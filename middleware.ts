import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale, domainLocales, type Locale } from './i18n/config'

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
})

export default function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const pathname = request.nextUrl.pathname
  
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
