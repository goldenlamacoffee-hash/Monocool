import { redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CheckoutForm } from '@/components/checkout-form'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getPartnerViewer } from '@/lib/partner-pricing'
import { getDomainFromLocale } from '@/lib/domain-utils'
import { getRequestSession } from '@/lib/auth-utils'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'checkout' })
  return { title: t('pageTitle') }
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Gate: only approved partners
  const viewer = await getPartnerViewer(getDomainFromLocale(locale))
  if (viewer.state !== 'approved') {
    redirect(`/${locale}/anmelden`)
  }

  // Load user address fields for pre-fill
  const session = await getRequestSession()
  let userProfile: {
    name: string | null
    email: string | null
    companyName: string | null
    companyId: string | null
    vatNumber: string | null
    address: string | null
    city: string | null
    postalCode: string | null
    country: string | null
    phone: string | null
  } | null = null

  if (session?.user?.id) {
    const [row] = await db
      .select({
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        companyId: user.companyId,
        vatNumber: user.vatNumber,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode,
        country: user.country,
        phone: user.phone,
      })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)
    userProfile = row ?? null
  }

  const siteSettings = await getSiteSettingsByLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <CheckoutForm locale={locale} userProfile={userProfile} />
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
