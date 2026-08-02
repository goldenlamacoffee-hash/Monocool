import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Sora, Manrope } from 'next/font/google'
import { locales, type Locale } from '@/i18n/config'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getDomainFromLocale, getMarketBaseUrl } from '@/lib/domain-utils'
import { enforceMarketSession } from '@/lib/market-session'
import { WrongMarketNotice } from '@/components/wrong-market-notice'
import { ImpersonationBannerWrapper } from '@/components/impersonation-banner-wrapper'
import { BasketProvider } from '@/contexts/basket-context'
import '../globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sora',
  display: 'swap',
})

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const messages = await getMessages({ locale })
  const metadata = messages.metadata as { title: string; description: string }
  const domain = getDomainFromLocale(locale)
  const settings = await getSiteSettingsByLocale(locale)

  const title = settings.seoTitle?.trim() || metadata.title
  const description = settings.seoDescription?.trim() || metadata.description
  const ogImage = settings.ogImage?.trim()

  return {
    metadataBase: new URL(getMarketBaseUrl(domain)),
    title,
    description,
    keywords: 'Klimaanlage, ohne Außengerät, MonoCool, Kühlung, Heizung, energieeffizient',
    openGraph: {
      title,
      description,
      url: `${getMarketBaseUrl(domain)}/${locale}`,
      siteName: 'Monocool',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  setRequestLocale(locale)
  const messages = await getMessages()

  // V1.4E.3 — complete market session isolation. Runs on every locale route
  // (public + admin). Admins stay global; a non-admin session on the wrong
  // market is invalidated server-side here and reported via the notice.
  const { wrongMarket } = await enforceMarketSession()

  return (
    <html lang={locale} className={`bg-background ${manrope.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ImpersonationBannerWrapper locale={locale} />
          <BasketProvider>
            {wrongMarket && <WrongMarketNotice />}
            {children}
          </BasketProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
