import Link from 'next/link'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ButtonLink } from '@/components/button-link'
import { SectionHeader } from '@/components/site/section-header'
import { TechnicalCard } from '@/components/site/technical-card'
import { FeatureChip } from '@/components/site/feature-chip'
import { CTAGroup } from '@/components/site/cta-group'
import { B2BCallout } from '@/components/site/b2b-callout'
import { getProductsByLocale, getHomepageCmsContentByLocale } from '@/app/actions/products'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { Snowflake, Volume2, Wrench, Leaf, ArrowRight, Wind, Droplets, ShieldCheck } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('hero')
  const tFeatures = await getTranslations('features')
  const tBenefits = await getTranslations('benefits')
  const tProducts = await getTranslations('products')
  const tContact = await getTranslations('contact')
  const tFanCoil = await getTranslations('fanCoil')

  const [products, cmsContent, siteSettings] = await Promise.all([
    getProductsByLocale(locale),
    getHomepageCmsContentByLocale(locale),
    getSiteSettingsByLocale(locale),
  ])

  // Helper to get CMS content with fallback (locale-specific)
  const getCms = (key: string, field: 'title' | 'content', fallback: string) => {
    const localeKey = `${key}_${locale}`
    const content = cmsContent[localeKey] || cmsContent[key]
    if (content) {
      if (field === 'title' && content.title) return content.title
      if (field === 'content' && content.content) return content.content
    }
    return fallback
  }

  // Get CMS image URL with fallback
  const getCmsImage = (key: string, fallback: string) => {
    const localeKey = `${key}_${locale}`
    const content = cmsContent[localeKey] || cmsContent[key]
    return content?.imageUrl || fallback
  }

  const features = [
    {
      icon: Snowflake,
      title: getCms('homepage_feature1', 'title', tFeatures('noOutdoor.title')),
      description: getCms('homepage_feature1', 'content', tFeatures('noOutdoor.description')),
    },
    {
      icon: Volume2,
      title: getCms('homepage_feature2', 'title', tFeatures('quiet.title')),
      description: getCms('homepage_feature2', 'content', tFeatures('quiet.description')),
    },
    {
      icon: Wrench,
      title: getCms('homepage_feature3', 'title', tFeatures('easy.title')),
      description: getCms('homepage_feature3', 'content', tFeatures('easy.description')),
    },
    {
      icon: Leaf,
      title: getCms('homepage_feature4', 'title', tFeatures('efficient.title')),
      description: getCms('homepage_feature4', 'content', tFeatures('efficient.description')),
    },
  ]

  const heroTitle = getCms('homepage_hero', 'title', t('title'))
  const hasContact = Boolean(siteSettings.email?.trim() || siteSettings.phone?.trim())

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-soft-ice">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:linear-gradient(to_right,var(--mono-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--mono-line)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
            <div className="min-w-0">
              <span className="eyebrow">{tFeatures('noOutdoor.title')} &middot; B2B</span>
              <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
                {heroTitle}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                {getCms('homepage_hero', 'content', t('subtitle'))}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <FeatureChip icon={Snowflake}>{tFeatures('noOutdoor.title')}</FeatureChip>
                <FeatureChip icon={Volume2}>{tFeatures('quiet.title')}</FeatureChip>
                <FeatureChip icon={Leaf}>{tFeatures('efficient.title')}</FeatureChip>
              </div>
              <CTAGroup className="mt-8">
                <ButtonLink href={`/${locale}/produkte`} size="lg">
                  {t('cta')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
                <ButtonLink href={`/${locale}#vorteile`} variant="outline" size="lg">
                  {t('secondary')}
                </ButtonLink>
              </CTAGroup>
            </div>

            <div className="relative">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-30px_rgba(5,25,65,0.45)] ring-1 ring-inset ring-white/40">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-tr from-secondary/10 via-transparent to-accent"
                />
                <Image
                  src={getCmsImage('homepage_hero', '/logo.png')}
                  alt={heroTitle}
                  fill
                  className="object-contain p-10 sm:p-14"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features / Technical advantages */}
        <section id="vorteile" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              align="center"
              eyebrow={tProducts('title')}
              title={getCms('homepage_features', 'title', tFeatures('title'))}
              description={getCms('homepage_features', 'content', tFeatures('subtitle'))}
            />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <TechnicalCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Without outdoor unit / proof points */}
        <section className="border-y border-border bg-muted/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="min-w-0">
                <SectionHeader
                  eyebrow={tFeatures('noOutdoor.title')}
                  title={getCms('homepage_benefits', 'title', tBenefits('title'))}
                  description={getCms('homepage_benefits', 'content', tBenefits('subtitle'))}
                />
                <div className="mt-6 flex flex-wrap gap-2">
                  <FeatureChip variant="ice">{tFeatures('noOutdoor.title')}</FeatureChip>
                  <FeatureChip variant="ice">{tFeatures('quiet.title')}</FeatureChip>
                  <FeatureChip variant="ice">{tFeatures('easy.title')}</FeatureChip>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-primary p-6 text-primary-foreground">
                  <div className="font-heading text-4xl font-semibold">{tBenefits('noise.value')}</div>
                  <div className="mt-1 text-sm text-primary-foreground/80">{tBenefits('noise.label')}</div>
                </div>
                <div className="rounded-xl bg-secondary p-6 text-secondary-foreground">
                  <div className="font-heading text-4xl font-semibold">{tBenefits('energy.value')}</div>
                  <div className="mt-1 text-sm text-secondary-foreground/90">{tBenefits('energy.label')}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="font-heading text-4xl font-semibold text-primary">{tBenefits('outdoor.value')}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{tBenefits('outdoor.label')}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="font-heading text-4xl font-semibold text-primary">{tBenefits('warranty.value')}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{tBenefits('warranty.label')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products preview */}
        {products.length > 0 && (
          <section className="py-16 lg:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  className="min-w-0"
                  eyebrow={tProducts('title')}
                  title={getCms('homepage_products', 'title', tProducts('title'))}
                  description={getCms('homepage_products', 'content', tProducts('subtitle'))}
                />
                <ButtonLink href={`/${locale}/produkte`} variant="outline" className="shrink-0 self-start sm:self-auto">
                  {tProducts('viewAll')}
                </ButtonLink>
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.slice(0, 3).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Fan Coil preview — visually marked as a separate product family */}
        <section className="border-t border-border bg-muted/40 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-10 overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2">
              <div className="order-2 p-8 sm:p-10 lg:order-1 lg:p-12">
                <span className="eyebrow text-secondary">{tFanCoil('hero.badge')}</span>
                <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {tFanCoil('hero.title')}
                </h2>
                <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
                  {tFanCoil('hero.description')}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <FeatureChip icon={Droplets}>Fan Coil</FeatureChip>
                  <FeatureChip icon={Wind}>{tFanCoil('hero.badge')}</FeatureChip>
                </div>
                <CTAGroup className="mt-7">
                  <ButtonLink href={`/${locale}/fan-coil`} size="lg">
                    {tFanCoil('hero.cta')}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </ButtonLink>
                </CTAGroup>
              </div>
              <div className="relative order-1 min-h-[18rem] overflow-hidden bg-soft-navy lg:order-2 lg:min-h-[24rem]">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px]"
                />
                <Image
                  src="/images/fan-coil-fs.png"
                  alt={tFanCoil('hero.title')}
                  fill
                  className="object-contain p-8 sm:p-10"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Partner / consultation CTA */}
        <section id="kontakt" className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <B2BCallout
              eyebrow={tContact('title')}
              title={getCms('homepage_contact', 'title', tContact('dealerTitle'))}
              description={getCms('homepage_contact', 'content', tContact('dealerText'))}
            >
              <CTAGroup>
                <ButtonLink href={`/${locale}/anmelden`} variant="secondary" size="lg">
                  {tContact('dealerCta')}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </ButtonLink>
                {siteSettings.email?.trim() && (
                  <a
                    href={`mailto:${siteSettings.email.trim()}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/10"
                  >
                    {tContact('email')}: {siteSettings.email.trim()}
                  </a>
                )}
              </CTAGroup>
              {hasContact && (siteSettings.phone?.trim()) && (
                <p className="mt-2 flex items-center gap-2 text-sm text-primary-foreground/70">
                  <ShieldCheck className="h-4 w-4 text-[color:var(--mono-steel)]" />
                  <a href={`tel:${siteSettings.phone.replace(/\s/g, '')}`} className="hover:text-primary-foreground">
                    {tContact('phone')}: {siteSettings.phone.trim()}
                  </a>
                </p>
              )}
            </B2BCallout>
          </div>
        </section>
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
