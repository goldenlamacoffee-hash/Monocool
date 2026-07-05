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
 * - wrong_market: approved partner whose account market differs from the market
 *   currently being viewed → no prices, distinct message (V1.4E.2)
 * - approved: approved partner on their own market, or admin → prices with their
 *   discount applied
 *
 * Market scoping (V1.4E.2):
 * - Admins are global: they are never market-gated.
 * - A non-admin approved partner only sees prices when their `user.market`
 *   equals `currentMarket`. This FAILS CLOSED: a partner with `market = null`,
 *   or on any other domain, gets no prices.
 * - When `currentMarket` is omitted (e.g. a caller that has no domain context),
 *   market scoping is skipped and behaviour matches V1.4E.1 for compatibility.
 *
 * The discount and market are always read fresh from the database (never
 * trusted from the client), so a stale session or tampered request cannot
 * change them.
 */
export async function getPartnerViewer(currentMarket?: string): Promise<PartnerViewer> {
  const { session, role, status } = await getSessionWithRole()

  if (!session?.user) {
    return { state: 'guest', discountPercent: 0 }
  }

  const isAdmin = role === 'admin'
  const isApproved = status === 'approved' || isAdmin
  if (!isApproved) {
    return { state: 'pending', discountPercent: 0 }
  }

  const [row] = await db
    .select({ discountPercent: user.discountPercent, market: user.market })
    .from(user)
    .where(eq(user.id, session.user.id))

  // Market enforcement for non-admins. Admins remain global.
  if (!isAdmin && currentMarket) {
    // Fail closed: no market on the account, or a different market → no prices.
    if (!row?.market || row.market !== currentMarket) {
      return { state: 'wrong_market', discountPercent: 0 }
    }
  }

  return {
    state: 'approved',
    discountPercent: normalizeDiscountPercent(row?.discountPercent),
  }
}
