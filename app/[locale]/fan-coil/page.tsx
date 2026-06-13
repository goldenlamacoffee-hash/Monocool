import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { FanCoilHero } from '@/components/fan-coil/hero'
import { FanCoilProductsDisplay } from '@/components/fan-coil/products-display'
import { FanCoilFeatures } from '@/components/fan-coil/features'
import { FanCoilCTA } from '@/components/fan-coil/cta'
import { getProductsByCategoryAndLocale, getFancoilCmsContentByLocale } from '@/app/actions/products'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getDomainFromLocale, buildSeoMetadata } from '@/lib/domain-utils'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'fanCoil' })
  const cms = await getFancoilCmsContentByLocale(locale)
  const seo = cms[`fancoil_hero_${locale}`] || cms['fancoil_hero']

  return buildSeoMetadata({
    domain: getDomainFromLocale(locale),
    seoTitle: seo?.seoTitle,
    seoDescription: seo?.seoDescription,
    ogImage: seo?.ogImage,
    fallbackTitle: t('meta.title'),
    fallbackDescription: t('meta.description'),
    path: 'fan-coil',
  })
}

export default async function FanCoilPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Fetch fan-coil products and CMS content from database
  const [fanCoilProducts, cmsContent, siteSettings] = await Promise.all([
    getProductsByCategoryAndLocale('fancoil', locale),
    getFancoilCmsContentByLocale(locale),
    getSiteSettingsByLocale(locale)
  ])

  // Helper to get CMS content with locale fallback.
  // Coerces the jsonb `metadata` column (typed as unknown) into the
  // Record<string, string> shape the presentational components expect.
  const getCms = (key: string) => {
    const localeKey = `${key}_${locale}`
    const entry = cmsContent[localeKey] || cmsContent[key] || null
    if (!entry) return null
    return {
      ...entry,
      metadata: (entry.metadata as Record<string, string> | null) ?? null,
    }
  }

  // Coerce the jsonb `specs` column (typed as unknown) into the
  // Record<string, string> shape the products display expects.
  const fanCoilProductsForDisplay = fanCoilProducts.map((p) => ({
    ...p,
    specs: (p.specs as Record<string, string> | null) ?? null,
  }))

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <FanCoilHero cmsContent={getCms('fancoil_hero')} />
        <FanCoilProductsDisplay products={fanCoilProductsForDisplay} />
        <FanCoilFeatures 
          cmsContent={{
            section: getCms('fancoil_features'),
            design: getCms('fancoil_feature_design'),
            efficiency: getCms('fancoil_feature_efficiency'),
            quiet: getCms('fancoil_feature_quiet'),
            eco: getCms('fancoil_feature_eco'),
            control: getCms('fancoil_feature_control'),
            quality: getCms('fancoil_feature_quality'),
          }}
        />
        <FanCoilCTA cmsContent={getCms('fancoil_cta')} contactInfo={{
          email: siteSettings.email,
          phone: siteSettings.phone
        }} />
      </main>
      <Footer contactInfo={{
        email: siteSettings.email,
        phone: siteSettings.phone,
        city: siteSettings.city,
        country: siteSettings.country
      }} />
    </div>
  )
}
