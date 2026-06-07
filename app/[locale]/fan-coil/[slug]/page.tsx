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
  Wind,
  CheckCircle2,
  FileText
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

  return {
    title: `${product.name} | Fan Coil | Monocool`,
    description: product.shortDescription || product.description?.slice(0, 160),
  }
}

export default async function FanCoilProductDetailPage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('fanCoil')
  const tProducts = await getTranslations('products')
  const product = await getProductBySlugAndLocale(slug, locale)
  
  if (!product) {
    notFound()
  }

  // Fetch gallery images for this product
  const galleryImages = await getProductImages(product.id)
  
  // Fetch site settings for contact info
  const siteSettings = await getSiteSettingsByLocale(locale)

  const session = await auth.api.getSession({ headers: await headers() })

  // Fan-coil specific specs from the specs JSON field
  const fanCoilSpecs = product.specs as Record<string, string> | null

  // Standard specs
  const standardSpecs = [
    { icon: Thermometer, label: tProducts('coolingCapacity'), value: product.coolingCapacity },
    { icon: Thermometer, label: tProducts('heatingCapacity'), value: product.heatingCapacity },
    { icon: Zap, label: tProducts('energyClass'), value: product.energyClass },
    { icon: Volume2, label: tProducts('noiseLevel'), value: product.noiseLevel },
    { icon: Ruler, label: tProducts('dimensions'), value: product.dimensions },
  ].filter(spec => spec.value)

  // Fan-coil specs grid items
  const specGridItems = fanCoilSpecs ? [
    { icon: Zap, label: locale === 'sk' ? 'Výkon' : locale === 'cs' ? 'Výkon' : locale === 'de' ? 'Leistung' : 'Power', value: fanCoilSpecs.power },
    { icon: Wind, label: locale === 'sk' ? 'Prietok vzduchu' : locale === 'cs' ? 'Průtok vzduchu' : locale === 'de' ? 'Luftstrom' : 'Airflow', value: fanCoilSpecs.airflow },
    { icon: Volume2, label: locale === 'sk' ? 'Hlučnosť' : locale === 'cs' ? 'Hlučnost' : locale === 'de' ? 'Lautstärke' : 'Noise', value: fanCoilSpecs.noise },
    { icon: Ruler, label: locale === 'sk' ? 'Rozmery' : locale === 'cs' ? 'Rozměry' : locale === 'de' ? 'Abmessungen' : 'Dimensions', value: fanCoilSpecs.dimensions },
  ].filter(spec => spec.value) : []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with gradient background */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Grid pattern overlay */}
          <div 
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <ButtonLink href={`/${locale}/fan-coil`} variant="ghost" size="sm" className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {locale === 'sk' ? 'Späť na Fan Coil' : locale === 'cs' ? 'Zpět na Fan Coil' : locale === 'de' ? 'Zurück zu Fan Coil' : 'Back to Fan Coil'}
            </ButtonLink>

            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
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
              <div className="flex flex-col justify-center">
                <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{product.name}</h1>
                
                {product.shortDescription && (
                  <p className="mt-4 text-lg text-slate-300">{product.shortDescription}</p>
                )}

                {/* Specs Grid */}
                {specGridItems.length > 0 && (
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    {specGridItems.map((spec) => (
                      <div 
                        key={spec.label} 
                        className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
                      >
                        <div className="flex items-center gap-2 text-slate-400">
                          <spec.icon className="h-4 w-4" />
                          <span className="text-sm">{spec.label}</span>
                        </div>
                        <div className="mt-1 text-lg font-semibold text-white">{spec.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Price Box */}
                <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6">
                  {session?.user ? (
                    <div>
                      <div className="text-sm text-slate-400">{tProducts('priceOnLogin')}</div>
                      <div className="mt-1 text-3xl font-bold text-primary">
                        {product.price 
                          ? `${Number(product.price).toLocaleString(locale)} EUR` 
                          : tProducts('priceOnLogin')}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-slate-400" />
                      <div>
                        <div className="font-medium text-white">{tProducts('loginToSeePrice')}</div>
                        <div className="text-sm text-slate-400">
                          <Link href={`/${locale}/anmelden`} className="text-primary hover:underline">
                            {tProducts('loginPrompt')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Buttons */}
                <div className="mt-6 flex flex-wrap gap-4">
                  <a 
                    href={`mailto:info@monocool.at?subject=${locale === 'sk' ? 'Dopyt' : locale === 'cs' ? 'Poptávka' : locale === 'de' ? 'Anfrage' : 'Inquiry'}: ${product.name}`}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {tProducts('requestQuote')}
                  </a>
                  <a 
                    href="tel:+4312345678"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-6 text-sm font-medium text-white transition-colors hover:bg-slate-700"
                  >
                    {tProducts('callNow')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start border-b bg-transparent p-0">
              <TabsTrigger 
                value="description" 
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                {tProducts('description')}
              </TabsTrigger>
              <TabsTrigger 
                value="specifications"
                className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                {tProducts('specifications')}
              </TabsTrigger>
              {product.features && product.features.length > 0 && (
                <TabsTrigger 
                  value="features"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  {tProducts('features')}
                </TabsTrigger>
              )}
              {product.technicalData && (
                <TabsTrigger 
                  value="technical"
                  className="rounded-none border-b-2 border-transparent px-6 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  {locale === 'sk' ? 'Technické údaje' : locale === 'cs' ? 'Technické údaje' : locale === 'de' ? 'Technische Daten' : 'Technical Data'}
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="description" className="mt-8">
              <Card className="border-none shadow-lg">
                <CardContent className="p-8">
                  {product.description ? (
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="whitespace-pre-line text-lg leading-relaxed text-foreground">{product.description}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{tProducts('notFound')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications" className="mt-8">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{tProducts('specifications')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {standardSpecs.length > 0 || specGridItems.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[...standardSpecs, ...specGridItems].map((spec) => (
                        <div 
                          key={spec.label} 
                          className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <spec.icon className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-muted-foreground">{spec.label}</span>
                          </div>
                          <span className="font-semibold text-foreground">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{tProducts('notFound')}</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {product.features && product.features.length > 0 && (
              <TabsContent value="features" className="mt-8">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle>{tProducts('features')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 rounded-lg bg-muted/30 p-4">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                          <span className="text-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {product.technicalData && (
              <TabsContent value="technical" className="mt-8">
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {locale === 'sk' ? 'Technické údaje' : locale === 'cs' ? 'Technické údaje' : locale === 'de' ? 'Technische Daten' : 'Technical Data'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="whitespace-pre-line text-foreground">{product.technicalData}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
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
