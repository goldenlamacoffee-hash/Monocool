// lib/partner-portal.ts
// Server-only module — never import from client components.
//
// Partner portal access guard and resolved-partner type.
// Used by every page inside app/[locale]/konto/.
//
// Access rules (spec §1):
//   A. No session          → redirect to /[locale]/anmelden?callbackUrl=/[locale]/konto
//   B. Admin (non-impersonated) → redirect to /[locale]/admin
//   C. Approved partner on correct market → allow, return PartnerContext
//   D. Pending partner     → allow with status='pending' (renders status page)
//   E. Rejected partner    → allow with status='rejected' (renders status page)
//   F. Wrong market / missing market → redirect to login (fail closed)
//
// The existing impersonated partner session (where impersonatedBy is set on the
// session row) passes as the target approved partner — no special-casing needed
// because Better Auth surfaces the impersonated user's id/role/etc. as the
// current session user.

import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { getRequestSession } from '@/lib/auth-utils'
import { getDomainFromLocale, isValidMarket } from '@/lib/domain-utils'
import { normalizeDiscountPercent } from '@/lib/pricing'

export type PartnerStatus = 'approved' | 'pending' | 'rejected'

export type PartnerContext = {
  userId: string
  name: string
  email: string
  role: string
  status: PartnerStatus
  market: string        // domain, e.g. monocool.sk
  // Set for approved partners only; empty string otherwise
  companyName: string | null
  companyId: string | null
  vatNumber: string | null
  phone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  discountPercent: number   // 0 when not approved
  discountNote: string | null
  partnerTier: string | null
  createdAt: Date
}

/**
 * Resolve and validate partner access for a given locale.
 * Redirects when access is denied. Always returns a PartnerContext when it
 * does return — status='pending'|'rejected' means the page should show a
 * status notice instead of the portal content.
 */
export async function resolvePartnerContext(locale: string): Promise<PartnerContext> {
  const currentMarket = getDomainFromLocale(locale)

  // A. No session → redirect to login
  const session = await getRequestSession()
  if (!session?.user) {
    redirect(`/${locale}/anmelden?callbackUrl=/${locale}/konto`)
  }

  // Fetch authoritative values from DB (not session token)
  const [row] = await db
    .select({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      market: user.market,
      companyName: user.companyName,
      companyId: user.companyId,
      vatNumber: user.vatNumber,
      phone: user.phone,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      discountPercent: user.discountPercent,
      discountNote: user.discountNote,
      partnerTier: user.partnerTier,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (!row) {
    // Should never happen — session exists but user row is gone
    redirect(`/${locale}/anmelden`)
  }

  const role = row.role ?? 'user'
  const status = (row.status ?? 'pending') as string

  // B. Non-impersonated admin → redirect to admin area
  // We detect impersonation by checking session.session.impersonatedBy.
  // When a session has impersonatedBy set, the current "user" is the partner
  // being impersonated, NOT the actual admin — so role will already be 'user'.
  // A plain admin (not impersonating) will have role='admin' and no
  // impersonatedBy, so we redirect them.
  const isAdmin = role === 'admin'
  if (isAdmin) {
    redirect(`/${locale}/admin`)
  }

  // F. Wrong/missing market — fail closed
  if (!isValidMarket(row.market) || row.market !== currentMarket) {
    // Invalidate and redirect to login so enforceMarketSession also runs
    redirect(`/${locale}/anmelden`)
  }

  // Build context for all non-admin cases (approved / pending / rejected)
  const partnerStatus = (['approved', 'pending', 'rejected'].includes(status)
    ? status
    : 'pending') as PartnerStatus

  return {
    userId: session.user.id,
    name: row.name,
    email: row.email,
    role,
    status: partnerStatus,
    market: row.market,
    companyName: row.companyName,
    companyId: row.companyId,
    vatNumber: row.vatNumber,
    phone: row.phone,
    address: row.address,
    city: row.city,
    postalCode: row.postalCode,
    country: row.country,
    discountPercent: partnerStatus === 'approved'
      ? normalizeDiscountPercent(row.discountPercent)
      : 0,
    discountNote: null, // discountNote is admin-only in V1 (spec §9)
    partnerTier: partnerStatus === 'approved' ? (row.partnerTier ?? null) : null,
    createdAt: row.createdAt,
  }
}
