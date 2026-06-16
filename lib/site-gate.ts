// Temporary public password gate (V1.3C.3)
// Simple, production-safe gate. Not enterprise-grade auth.
//
// Per-domain passwords: each production domain has its own password, configured
// via a dedicated env var (see DOMAIN_PASSWORD_ENV below). An optional shared
// MONOCOOL_SITE_PASSWORD acts as a fallback for any domain without a specific
// password (and for local/preview hosts).
//
// The cookie never stores the password itself — only a SHA-256 token derived
// from the domain + password. Because the domain key is part of the token salt,
// a token minted for one domain can never unlock another, even if two domains
// happen to share the same password. Rotating a password automatically
// invalidates old cookies for that domain.
// This module is Edge-safe (uses Web Crypto + TextEncoder only) so it can be
// imported by both middleware (Edge) and route handlers (Node).

export const SITE_GATE_COOKIE = 'monocool_site_access'

// Cookie lifetime: 7 days
export const SITE_GATE_MAX_AGE = 60 * 60 * 24 * 7

// Stable per-domain keys used for env lookup and token salting.
export type DomainKey = 'at' | 'cz' | 'sk' | 'eu'

// Map a request hostname to its domain key. Handles apex + www variants and
// falls back to `at` (the primary domain) for unknown hosts like localhost or
// Vercel preview URLs so the shared password still works there.
export function resolveDomainKey(hostname: string): DomainKey {
  const host = (hostname || '').toLowerCase().split(':')[0]
  if (host.endsWith('monocool.cz')) return 'cz'
  if (host.endsWith('monocool.sk')) return 'sk'
  if (host.endsWith('monocool.eu')) return 'eu'
  if (host.endsWith('monocool.at')) return 'at'
  return 'at'
}

// Env var that holds the password for each domain.
const DOMAIN_PASSWORD_ENV: Record<DomainKey, string> = {
  at: 'MONOCOOL_SITE_PASSWORD_AT',
  cz: 'MONOCOOL_SITE_PASSWORD_CZ',
  sk: 'MONOCOOL_SITE_PASSWORD_SK',
  eu: 'MONOCOOL_SITE_PASSWORD_EU',
}

function readEnv(name: string): string | undefined {
  const value = process.env[name]
  if (!value || value.trim() === '') return undefined
  return value
}

/**
 * Returns the configured password for the given domain, falling back to the
 * shared MONOCOOL_SITE_PASSWORD. Returns undefined when the gate is disabled
 * for that domain (no specific and no shared password set).
 */
export function getSitePassword(hostname: string): string | undefined {
  const key = resolveDomainKey(hostname)
  return readEnv(DOMAIN_PASSWORD_ENV[key]) ?? readEnv('MONOCOOL_SITE_PASSWORD')
}

/**
 * Derives the opaque access token stored in the unlock cookie from the domain
 * key + password. Same input always yields the same token, so middleware (Edge)
 * and the unlock API (Node) can compute and compare it without sharing the raw
 * password. The domain key in the salt makes tokens domain-specific.
 */
export async function computeAccessToken(domainKey: DomainKey, password: string): Promise<string> {
  const data = new TextEncoder().encode(`monocool-site-gate:v2:${domainKey}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Constant-time-ish comparison of two equal-length hex tokens.
 */
export function tokensMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Verifies that a cookie value unlocks the given domain for the given password.
 */
export async function isValidAccessToken(
  cookieValue: string | undefined,
  domainKey: DomainKey,
  password: string,
): Promise<boolean> {
  if (!cookieValue) return false
  const expected = await computeAccessToken(domainKey, password)
  return tokensMatch(cookieValue, expected)
}
