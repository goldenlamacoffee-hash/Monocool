// --- Complete market session isolation (V1.4E.3) ---------------------------
// Server-only guard that enforces per-market session isolation.
//
// Background: sessions are per-domain (cookies do not cross domains), and
// partner-price visibility is already market-gated in `getPartnerViewer`. This
// guard closes the remaining gap: a non-admin account may only stay LOGGED IN
// on its own market. If a non-admin session is resolved on the wrong market
// (or the account has no market at all), the session is invalidated so the user
// is treated as a guest on that domain.
//
// It is imported only by server components (transitively pulls in
// `next/headers` + the Better Auth server API), so it can never reach the
// client bundle.

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { user, session } from '@/lib/db/schema'
import { domainLocales } from '@/i18n/config'
import { MARKET_IDS } from '@/lib/domain-utils'
import { getRequestSession } from '@/lib/auth-utils'

/**
 * Resolve the market (domain) the current request is being served from, based
 * on the Host header. Returns `null` for non-production hosts (preview /
 * localhost), where there is no single market context and session isolation
 * intentionally does not apply.
 */
function resolveMarketFromHost(host: string | null): string | null {
  if (!host) return null
  const hostname = host.split(':')[0].toLowerCase()
  const match = Object.keys(domainLocales).find(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )
  if (!match) return null
  // Normalise `www.` variants to the canonical market id (e.g. monocool.sk).
  const market = match.replace(/^www\./, '')
  return MARKET_IDS.includes(market) ? market : null
}

/**
 * Enforce that the current session (if any) is allowed on the current market.
 *
 * Rules:
 * - No session, or a preview/localhost host → nothing to do (guest).
 * - Admins are global → always allowed, never logged out.
 * - Non-admin (approved, pending or rejected) is allowed only when
 *   `user.market === currentMarket`. Fails CLOSED: a `null`/mismatched market
 *   triggers logout.
 *
 * Logout mechanism: the resolved (per-domain) session row is deleted from the
 * database. Because the token no longer exists, `auth.api.getSession` returns
 * `null` on this and every subsequent request — including the client
 * `useSession` fetch used by the header — so the user is fully signed out on
 * this market. The now-inert cookie is additionally cleared client-side by the
 * wrong-market notice. The account and its other-domain sessions are untouched.
 *
 * @returns `{ wrongMarket: true }` when a session was invalidated for this
 * market, so the caller can surface the localized "wrong market" message.
 */
export async function enforceMarketSession(): Promise<{ wrongMarket: boolean }> {
  const hdrs = await headers()
  const currentMarket = resolveMarketFromHost(hdrs.get('host'))

  // No production-market context (preview/localhost) → do not isolate.
  if (!currentMarket) return { wrongMarket: false }

  const authSession = await getRequestSession()
  if (!authSession?.user) return { wrongMarket: false }

  const [row] = await db
    .select({ role: user.role, market: user.market })
    .from(user)
    .where(eq(user.id, authSession.user.id))

  // Admins remain global.
  if (row?.role === 'admin') return { wrongMarket: false }

  // Non-admins are locked to their own market. Fail closed on null market.
  if (!row?.market || row.market !== currentMarket) {
    try {
      await db
        .delete(session)
        .where(eq(session.token, authSession.session.token))
    } catch (error) {
      console.log('[v0] market-session: failed to invalidate wrong-market session', error)
    }
    return { wrongMarket: true }
  }

  return { wrongMarket: false }
}
