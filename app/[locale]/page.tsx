import Link from 'next/link'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { ButtonLink } from '@/components/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { getProductsByLocale, getHomepageCmsContentByLocale } from '@/app/actions/products'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { Snowflake, Volume2, Wrench, Leaf, ArrowRight } from 'lucide-react'
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
  const tNav = await getTranslations('nav')

  const [products, cmsContent, siteSettings] = await Promise.all([
    getProductsByLocale(locale),
    getHomepageCmsContentByLocale(locale),
    getSiteSettingsByLocale(locale)
  ])

  // Helper to get CMS content with fallback (locale-specific)
  const getCms = (key: string, field: 'title' | 'content', fallback: string) => {
    // First try locale-specific key, then generic key
    const localeKey = `${key}_${locale}`
    const content = cmsContent[localeKey] || cmsContent[key]
    if (content) {
      if (field === 'title' && content.title) return content.title
      if (field === 'content' && content.content) return content.content
    }
    return fallback
  }

  // Get metadata from CMS (for complex data like features, benefits)
  const getMetadata = (key: string) => {
    const localeKey = `${key}_${locale}`
    const content = cmsContent[localeKey] || cmsContent[key]
    return content?.metadata as Record<string, unknown> | undefined
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  {(() => {
                    const heroTitle = getCms('homepage_hero', 'title', t('title'))
                    const words = heroTitle.split(' ')
                    return (
                      <>
                        <span className="text-primary">{words[0]}</span> {words.slice(1).join(' ')}
                      </>
                    )
                  })()}
                </h1>
                <p className="mt-6 text-pretty text-lg text-muted-foreground">
                  {getCms('homepage_hero', 'content', t('subtitle'))}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <ButtonLink href={`/${locale}/produkte`} size="lg">
                    {t('cta')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink href={`/${locale}#vorteile`} variant="outline" size="lg">
                    {t('secondary')}
                  </ButtonLink>
                </div>
              </div>
              <div className="relative aspect-square lg:aspect-[4/3]">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20" />
                <Image
                  src={getCmsImage('homepage_hero', '/logo.png')}
                  alt="MonoCool Klimaanlage"
                  fill
                  className="object-contain p-12"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="vorteile" className="border-y border-border bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                {getCms('homepage_features', 'title', tFeatures('title'))}
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                {getCms('homepage_features', 'content', tFeatures('subtitle'))}
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border-0 bg-background shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                  {getCms('homepage_benefits', 'title', tBenefits('title'))}
                </h2>
                <p className="mt-4 text-muted-foreground">
                  {getCms('homepage_benefits', 'content', tBenefits('subtitle'))}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-primary p-6 text-primary-foreground">
                  <div className="text-4xl font-bold">{tBenefits('noise.value')}</div>
                  <div className="mt-1 text-sm opacity-90">{tBenefits('noise.label')}</div>
                </div>
                <div className="rounded-xl bg-secondary p-6 text-secondary-foreground">
                  <div className="text-4xl font-bold">{tBenefits('energy.value')}</div>
                  <div className="mt-1 text-sm opacity-90">{tBenefits('energy.label')}</div>
                </div>
                <div className="rounded-xl bg-accent p-6 text-accent-foreground">
                  <div className="text-4xl font-bold">{tBenefits('outdoor.value')}</div>
                  <div className="mt-1 text-sm opacity-90">{tBenefits('outdoor.label')}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="text-4xl font-bold text-primary">{tBenefits('warranty.value').split(' ')[0]}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{tBenefits('warranty.label')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        {products.length > 0 && (
          <section className="border-t border-border bg-muted/30 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <h2 className="text-balance text-3xl font-bold text-foreground sm:text-4xl">
                    {getCms('homepage_products', 'title', tProducts('title'))}
                  </h2>
                  <p className="mt-4 text-muted-foreground">
                    {getCms('homepage_products', 'content', tProducts('subtitle'))}
                  </p>
                </div>
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

        {/* Contact Section */}
        <section id="kontakt" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card className="overflow-hidden">
              <div className="grid lg:grid-cols-2">
                <div className="bg-primary p-8 text-primary-foreground lg:p-12">
                  <h2 className="text-2xl font-bold sm:text-3xl">
                    {getCms('homepage_contact', 'title', tContact('title'))}
                  </h2>
                  <p className="mt-4 opacity-90">
                    {getCms('homepage_contact', 'content', tContact('subtitle'))}
                  </p>
                  {(siteSettings.email?.trim() || siteSettings.phone?.trim()) && (
                    <div className="mt-8 space-y-4">
                      {siteSettings.email?.trim() && (
                        <div>
                          <div className="font-semibold">{tContact('email')}</div>
                          <a href={`mailto:${siteSettings.email.trim()}`} className="opacity-90 hover:opacity-100">
                            {siteSettings.email.trim()}
                          </a>
                        </div>
                      )}
                      {siteSettings.phone?.trim() && (
                        <div>
                          <div className="font-semibold">{tContact('phone')}</div>
                          <a href={`tel:${siteSettings.phone.replace(/\s/g, '')}`} className="opacity-90 hover:opacity-100">
                            {siteSettings.phone.trim()}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center bg-muted/50 p-8 lg:p-12">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground">{tContact('dealerTitle')}</h3>
                    <p className="mt-2 text-muted-foreground">
                      {tContact('dealerText')}
                    </p>
                    <ButtonLink href={`/${locale}/anmelden`} className="mt-4">
                      {tContact('dealerCta')}
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>
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
