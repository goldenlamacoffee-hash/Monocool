import { getSessionWithRole } from '@/lib/auth-utils'

/**
 * Server-only owner-admin permission layer (V1.4I.1).
 *
 * "Owner" is NOT a Better Auth role and never exists in the database, the
 * session token, or any client payload. There is no "superadmin" role, no
 * owner badge, and no owner flag on the user record — every owner admin
 * (Marek, Lenka) and every ordinary admin (e.g. a salesperson) has the exact
 * same `role = 'admin'` and looks identical in the Users screen and admin
 * navigation. Owner access is resolved fresh, server-side, on every call from
 * three independent facts:
 *
 *   1. A valid authenticated session (Better Auth)
 *   2. role === 'admin', read from the database (see getSessionWithRole —
 *      never trust a role claim from the client or a stale session)
 *   3. session.user.email present in MONOCOOL_OWNER_ADMIN_EMAILS
 *
 * MONOCOOL_OWNER_ADMIN_EMAILS is a plain server-side environment variable
 * (comma-separated email list). It is never prefixed NEXT_PUBLIC_, never
 * sent to the client, and never logged.
 *
 * Every owner-only server function (internal purchase costs, margins) MUST
 * call assertOwnerAdmin() as its first line. Never gate real data access on
 * a client-supplied flag, hidden button, localStorage value, or URL param —
 * this module is the only authority.
 */

function parseOwnerAllowlist(raw: string | undefined): Set<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  )
}

/**
 * Returns true only when the current session belongs to a database-verified
 * admin whose email is present in MONOCOOL_OWNER_ADMIN_EMAILS.
 *
 * Fails closed: a missing/empty env var, no session, a non-admin role, or an
 * email not on the list all resolve to `false` — this function never throws,
 * so it is safe to use for conditional UI gating in a server component
 * (e.g. deciding whether to render the owner-only product-editor section at
 * all — not just hide it with CSS).
 */
export async function isOwnerAdmin(): Promise<boolean> {
  const allowlist = parseOwnerAllowlist(process.env.MONOCOOL_OWNER_ADMIN_EMAILS)
  if (allowlist.size === 0) return false

  const { session, role } = await getSessionWithRole()
  if (!session?.user?.email) return false
  if (role !== 'admin') return false

  const email = session.user.email.trim().toLowerCase()
  return allowlist.has(email)
}

/**
 * Throwing owner guard — the first line of every owner-only server action
 * (internal cost reads/writes). Mirrors assertAdmin()'s shape but additionally
 * requires the caller's email to be on the MONOCOOL_OWNER_ADMIN_EMAILS
 * allowlist. An ordinary admin who calls an owner-only Server Action directly
 * (bypassing the UI entirely) gets the same thrown error as a logged-out
 * visitor — there is no partial/degraded owner access.
 *
 * Returns the authenticated Better Auth session on success.
 */
export async function assertOwnerAdmin() {
  const { session, role } = await getSessionWithRole()

  if (!session?.user?.email) {
    throw new Error('Unauthorized')
  }
  if (role !== 'admin') {
    throw new Error('Owner access required')
  }

  const allowlist = parseOwnerAllowlist(process.env.MONOCOOL_OWNER_ADMIN_EMAILS)
  if (allowlist.size === 0) {
    throw new Error('Owner access required')
  }

  const email = session.user.email.trim().toLowerCase()
  if (!allowlist.has(email)) {
    throw new Error('Owner access required')
  }

  return session
}
