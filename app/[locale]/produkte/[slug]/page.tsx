import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ButtonLink } from '@/components/button-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductGalleryCarousel } from '@/components/product-gallery-carousel'
import { getProductBySlugAndLocale } from '@/app/actions/products'
import { getProductImages } from '@/app/actions/gallery'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
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
            <div className="relative">
              <ProductGalleryCarousel 
                images={galleryImages}
                productName={product.name}
              />
              {product.category && (
                <Badge className="absolute left-4 top-4 z-10 bg-primary text-primary-foreground">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              
              {product.shortDescription && (
                <p className="mt-4 text-lg text-muted-foreground">{product.shortDescription}</p>
              )}

              {/* Price */}
              <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
                {session?.user ? (
                  <div>
                    <div className="text-sm text-muted-foreground">{t('priceOnLogin')}</div>
                    <div className="mt-1 text-3xl font-bold text-primary">
                      {product.price 
                        ? `${Number(product.price).toLocaleString(locale)} EUR` 
                        : t('priceOnLogin')}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{t('loginToSeePrice')}</div>
                      <div className="text-sm text-muted-foreground">
                        <Link href={`/${locale}/anmelden`} className="text-primary hover:underline">
                          {t('loginPrompt')}
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Specs */}
              {specs.length > 0 && (
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {specs.slice(0, 4).map((spec) => (
                    <div key={spec.label} className="flex items-center gap-2 text-sm">
                      <spec.icon className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">{spec.label}:</span>
                      <span className="font-medium text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap gap-4">
                {siteSettings.email?.trim() && (
                  <a 
                    href={`mailto:${siteSettings.email.trim()}?subject=Anfrage: ${product.name}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {t('requestQuote')}
                  </a>
                )}
                {siteSettings.phone && (
                  <a 
                    href={`tel:${siteSettings.phone.replace(/[^+\d]/g, '')}`}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {t('callNow')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="mt-12">
            <Tabs defaultValue="beschreibung" className="w-full">
              <TabsList className="w-full justify-start">
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
                            className="flex items-center justify-between rounded-lg border border-border p-3"
                          >
                            <div className="flex items-center gap-2">
                              <spec.icon className="h-4 w-4 text-primary" />
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
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {product.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
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
