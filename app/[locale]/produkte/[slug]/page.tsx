import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ButtonLink } from '@/components/button-link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductGalleryCarousel } from '@/components/product-gallery-carousel'
import { getProductBySlugAndLocale } from '@/app/actions/products'
import { getProductImages } from '@/app/actions/gallery'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getDomainFromLocale, buildSeoMetadata } from '@/lib/domain-utils'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { type Locale } from '@/i18n/config'
import { 
  ArrowLeft, 
  Lock, 
  Zap, 
  Thermometer, 
  Volume2, 
  Ruler, 
  Weight,
  CheckCircle2
} from 'lucide-react'

interface Props {
  params: Promise<{ locale: Locale; slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params
  const product = await getProductBySlugAndLocale(slug, locale)

  if (!product) {
    return { title: 'Product Not Found' }
  }

  return buildSeoMetadata({
    domain: getDomainFromLocale(locale),
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    ogImage: product.ogImage,
    fallbackTitle: `${product.name} | Monocool`,
    fallbackDescription: product.shortDescription || product.description?.slice(0, 160),
    path: `produkte/${product.slug}`,
  })
}

export default async function ProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('products')
  const product = await getProductBySlugAndLocale(slug, locale)
  
  if (!product) {
    notFound()
  }

  // Fetch gallery images for this product
  const galleryImages = await getProductImages(product.id)
  
  // Fetch site settings for contact info
  const siteSettings = await getSiteSettingsByLocale(locale)

  const session = await auth.api.getSession({ headers: await headers() })

  const specs = [
    { icon: Thermometer, label: t('coolingCapacity'), value: product.coolingCapacity },
    { icon: Thermometer, label: t('heatingCapacity'), value: product.heatingCapacity },
    { icon: Zap, label: t('energyClass'), value: product.energyClass },
    { icon: Volume2, label: t('noiseLevel'), value: product.noiseLevel },
    { icon: Ruler, label: t('dimensions'), value: product.dimensions },
    { icon: Weight, label: t('weight'), value: product.weight },
  ].filter(spec => spec.value)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ButtonLink href={`/${locale}/produkte`} variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToProducts')}
          </ButtonLink>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Product Gallery */}
            <div className="relative min-w-0">
              <ProductGalleryCarousel 
                images={galleryImages}
                productName={product.name}
              />
              {product.category && (
                <span className="absolute left-4 top-4 z-10 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary backdrop-blur">
                  {product.category}
                </span>
              )}
            </div>

            {/* Product Info */}
            <div className="min-w-0">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.name}</h1>
              
              {product.shortDescription && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.shortDescription}</p>
              )}

              {/* Price */}
              <div className="mt-6 rounded-2xl border border-border bg-soft-ice p-5">
                {session?.user ? (
                  <div>
                    <div className="eyebrow">{t('priceLabel')}</div>
                    <div className="mt-1 font-heading text-3xl font-semibold text-primary">
                      {product.price 
                        ? `${Number(product.price).toLocaleString(locale)} EUR` 
                        : t('priceOnLogin')}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-secondary">
                      <Lock className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <div className="font-medium text-foreground">{t('loginToSeePrice')}</div>
                      <div className="text-sm text-muted-foreground">
                        <Link href={`/${locale}/anmelden`} className="font-medium text-secondary hover:underline">
                          {t('loginPrompt')}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Specs */}
              {specs.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {specs.slice(0, 4).map((spec) => (
                    <div key={spec.label} className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 text-sm">
                      <spec.icon className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                      <span className="text-muted-foreground">{spec.label}:</span>
                      <span className="ml-auto font-medium text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                {siteSettings.email?.trim() && (
                  <a 
                    href={`mailto:${siteSettings.email.trim()}?subject=Anfrage: ${product.name}`}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
                  >
                    {t('requestQuote')}
                  </a>
                )}
                {siteSettings.phone && (
                  <a 
                    href={`tel:${siteSettings.phone.replace(/[^+\d]/g, '')}`}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    {t('callNow')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-14">
            <Tabs defaultValue="beschreibung" className="w-full">
              <TabsList className="w-full max-w-full justify-start overflow-x-auto">
                {/* horizontally scrollable on narrow screens */}
                <TabsTrigger value="beschreibung">{t('description')}</TabsTrigger>
                <TabsTrigger value="spezifikationen">{t('specifications')}</TabsTrigger>
                {product.features && product.features.length > 0 && (
                  <TabsTrigger value="merkmale">{t('features')}</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="beschreibung" className="mt-6">
                <Card>
                  <CardContent className="prose prose-slate max-w-none p-6">
                    {product.description ? (
                      <p className="whitespace-pre-line text-foreground">{product.description}</p>
                    ) : (
                      <p className="text-muted-foreground">{t('notFound')}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="spezifikationen" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('specifications')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {specs.length > 0 ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {specs.map((spec) => (
                          <div 
                            key={spec.label} 
                            className="flex items-center justify-between rounded-xl border border-border bg-soft-ice p-3.5"
                          >
                            <div className="flex items-center gap-2">
                              <spec.icon className="h-4 w-4 text-secondary" aria-hidden="true" />
                              <span className="text-muted-foreground">{spec.label}</span>
                            </div>
                            <span className="font-medium text-foreground">{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{t('notFound')}</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              {product.features && product.features.length > 0 && (
                <TabsContent value="merkmale" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('features')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                            <span className="text-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
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
