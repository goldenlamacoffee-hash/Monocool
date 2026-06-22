import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, domainLocales, type Locale } from './i18n/config'
import { SITE_GATE_COOKIE, getSitePassword, isValidAccessToken, resolveDomainKey } from './lib/site-gate'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

// Master switch for the temporary public password gate. Set to `false` to lower
// the gate on every domain at once (public site fully accessible); set back to
// `true` to re-enable per-domain password protection. When disabled, the
// per-domain password env vars are ignored entirely.
const SITE_GATE_ENABLED = false

// Routes that must stay reachable even when the public password gate is active:
// the admin area + auth flow (protected separately by Better Auth) and the gate
// page itself. Static assets, Next.js internals, and /api are already excluded
// by the matcher below.
const GATE_EXCLUDED = /^\/(de|cs|sk|en)\/(admin|anmelden|registrieren|site-locked)(\/|$)/

function resolveLocale(request: NextRequest, hostname: string): Locale {
  const domainLocale = Object.entries(domainLocales).find(
    ([domain]) => hostname === domain || hostname.endsWith(domain)
  )?.[1] as Locale | undefined
  if (domainLocale) return domainLocale

  const pathLocale = request.nextUrl.pathname.split('/')[1] as Locale
  if (locales.includes(pathLocale)) return pathLocale

  return defaultLocale
}

export default async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname

  // --- Temporary public password gate (V1.3C.3) -------------------------
  // Per-domain password: each domain has its own password (with a shared
  // fallback). Cookies are domain-scoped so unlocking one domain never
  // unlocks another.
  const sitePassword = SITE_GATE_ENABLED ? getSitePassword(hostname) : undefined
  if (sitePassword && !GATE_EXCLUDED.test(pathname)) {
    const domainKey = resolveDomainKey(hostname)
    const cookie = request.cookies.get(SITE_GATE_COOKIE)?.value
    const unlocked = await isValidAccessToken(cookie, domainKey, sitePassword)

    if (!unlocked) {
      // Show the branded unlock screen without revealing public content.
      // Rewrite (not redirect) keeps the requested URL in the address bar.
      const locale = resolveLocale(request, hostname)
      const url = request.nextUrl.clone()
      url.pathname = `/${locale}/site-locked`
      url.search = ''
      url.searchParams.set('from', pathname + request.nextUrl.search)
      return NextResponse.rewrite(url)
    }
  }
  // ----------------------------------------------------------------------

  // Check if we're on a production domain
  const domainLocale = Object.entries(domainLocales).find(
    ([domain]) => hostname === domain || hostname.endsWith(domain)
  )?.[1] as Locale | undefined
  
  if (domainLocale) {
    // On production domain - enforce the correct locale
    const pathLocale = pathname.split('/')[1] as Locale
    
    // If accessing root or wrong locale, redirect to correct locale
    if (pathname === '/' || (locales.includes(pathLocale) && pathLocale !== domainLocale)) {
      const pathWithoutLocale = pathname.replace(/^\/(de|cs|sk|en)/, '') || '/'
      const url = request.nextUrl.clone()
      url.pathname = `/${domainLocale}${pathWithoutLocale}`
      return NextResponse.redirect(url)
    }
    
    // If no locale in path, add the domain's locale
    if (!locales.includes(pathLocale)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${domainLocale}${pathname}`
      return NextResponse.redirect(url)
    }
  }
  
  // Use default next-intl middleware for other cases
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/', '/(de|cs|sk|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
}
