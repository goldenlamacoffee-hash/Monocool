import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { locales, type Locale } from '@/i18n/config'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getDomainFromLocale, getMarketBaseUrl } from '@/lib/domain-utils'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

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

  return (
    <html lang={locale} className="bg-background">
      <body className={`${inter.className} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
