// --- Server-side partner pricing resolver (V1.4B) --------------------------
// Server-only: resolves the current viewer's pricing state and discount from
// the session + database. Imported only by server components / server actions.
// (It transitively imports `next/headers` via auth-utils, so it can never be
// bundled into client code.)

import { getSessionWithRole } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { normalizeDiscountPercent, type PartnerViewerState } from '@/lib/pricing'

export type PartnerViewer = {
  state: PartnerViewerState
  discountPercent: number
}

/**
 * Determine what pricing the current request may see:
 * - guest: no session → no prices at all
 * - pending: logged in but not an approved partner (and not admin) → no prices
 * - approved: approved partner or admin → prices with their discount applied
 *
 * The discount is always read fresh from the database (never trusted from the
 * client), so a stale session or tampered request cannot change it.
 */
export async function getPartnerViewer(): Promise<PartnerViewer> {
  const { session, role, status } = await getSessionWithRole()

  if (!session?.user) {
    return { state: 'guest', discountPercent: 0 }
  }

  const isApproved = status === 'approved' || role === 'admin'
  if (!isApproved) {
    return { state: 'pending', discountPercent: 0 }
  }

  const [row] = await db
    .select({ discountPercent: user.discountPercent })
    .from(user)
    .where(eq(user.id, session.user.id))

  return {
    state: 'approved',
    discountPercent: normalizeDiscountPercent(row?.discountPercent),
  }
}
