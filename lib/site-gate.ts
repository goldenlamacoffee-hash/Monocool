// Temporary public password gate (V1.3C.3)
// Simple, production-safe gate. Not enterprise-grade auth.
//
// The cookie never stores the password itself — only a SHA-256 token derived
// from it. Rotating MONOCOOL_SITE_PASSWORD automatically invalidates old cookies.
// This module is Edge-safe (uses Web Crypto + TextEncoder only) so it can be
// imported by both middleware (Edge) and route handlers (Node).

export const SITE_GATE_COOKIE = 'monocool_site_access'

// Cookie lifetime: 7 days
export const SITE_GATE_MAX_AGE = 60 * 60 * 24 * 7

/**
 * Returns the configured site password, or undefined when the gate is disabled.
 */
export function getSitePassword(): string | undefined {
  const value = process.env.MONOCOOL_SITE_PASSWORD
  if (!value || value.trim() === '') return undefined
  return value
}

/**
 * Derives the opaque access token stored in the unlock cookie from the password.
 * Same input always yields the same token, so middleware (Edge) and the unlock
 * API (Node) can compute and compare it without sharing the raw password.
 */
export async function computeAccessToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`monocool-site-gate:v1:${password}`)
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
 * Verifies that a cookie value unlocks the site for the given password.
 */
export async function isValidAccessToken(
  cookieValue: string | undefined,
  password: string,
): Promise<boolean> {
  if (!cookieValue) return false
  const expected = await computeAccessToken(password)
  return tokensMatch(cookieValue, expected)
}
