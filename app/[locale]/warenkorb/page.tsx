import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { BasketReviewClient } from '@/components/basket-review-client'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getPartnerViewer } from '@/lib/partner-pricing'
import { getDomainFromLocale } from '@/lib/domain-utils'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'basket' })
  return { title: t('pageTitle') }
}

export default async function WarenkorbPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Gate: only approved partners (and admins) may access the basket
  const viewer = await getPartnerViewer(getDomainFromLocale(locale))
  if (viewer.state !== 'approved') {
    redirect(`/${locale}/anmelden`)
  }

  const siteSettings = await getSiteSettingsByLocale(locale)
  const vatRate = siteSettings.vatRate ? parseFloat(String(siteSettings.vatRate)) : 20

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <BasketReviewClient locale={locale} vatRate={vatRate} />
      </main>
      <Footer
        contactInfo={{
          email: siteSettings.email,
          phone: siteSettings.phone,
          city: siteSettings.city,
          country: siteSettings.country,
        }}
      />
    </div>
  )
}
