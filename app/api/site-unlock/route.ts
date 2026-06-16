import { NextRequest, NextResponse } from 'next/server'
import {
  SITE_GATE_COOKIE,
  SITE_GATE_MAX_AGE,
  computeAccessToken,
  getSitePassword,
  resolveDomainKey,
  tokensMatch,
} from '@/lib/site-gate'

// Verifies the submitted password server-side and, on success, sets an
// httpOnly unlock cookie. Never returns or stores the raw password.
// The password is validated against the requesting domain's configured
// password, and the cookie is domain-scoped via the token salt.
export async function POST(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const sitePassword = getSitePassword(hostname)
  const domainKey = resolveDomainKey(hostname)

  // Gate disabled -> nothing to unlock.
  if (!sitePassword) {
    return NextResponse.json({ ok: true, redirect: '/' })
  }

  let submitted = ''
  let from = '/'
  try {
    const body = await request.json()
    submitted = typeof body?.password === 'string' ? body.password : ''
    if (typeof body?.from === 'string' && body.from.startsWith('/')) {
      from = body.from
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  // Compare server-side using derived tokens (constant-time-ish).
  const submittedToken = await computeAccessToken(domainKey, submitted)
  const expectedToken = await computeAccessToken(domainKey, sitePassword)

  if (!submitted || !tokensMatch(submittedToken, expectedToken)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true, redirect: from })
  response.cookies.set(SITE_GATE_COOKIE, expectedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SITE_GATE_MAX_AGE,
  })
  return response
}
