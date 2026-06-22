'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronRight, Thermometer, Wind, Volume2, Ruler, X, ChevronLeft, ChevronRight as ChevronRightIcon, ZoomIn, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductImage {
  id: number
  url: string
  pathname: string | null
  isPrimary: boolean
  sortOrder: number
}

interface FanCoilProduct {
  id: number
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  category: string | null
  price: string | null
  specs: Record<string, string> | null
  features: string[] | null
  technicalData: string | null
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

interface FanCoilProductsDisplayProps {
  products: FanCoilProduct[]
}

export function FanCoilProductsDisplay({ products }: FanCoilProductsDisplayProps) {
  const t = useTranslations('fanCoil.products')
  const params = useParams()
  const locale = params.locale as string
  const imagesLabel = locale === 'sk' ? 'obrázkov' : locale === 'cs' ? 'obrázků' : locale === 'de' ? 'Bilder' : 'images'
  const detailsLabel = locale === 'sk' ? 'Zobraziť detaily' : locale === 'cs' ? 'Zobrazit detaily' : locale === 'de' ? 'Details anzeigen' : 'View details'
  const galleryAriaLabel = locale === 'sk' ? 'Otvoriť galériu pre' : locale === 'cs' ? 'Otevřít galerii pro' : locale === 'de' ? 'Galerie öffnen für' : 'Open gallery for'
  const [activeProduct, setActiveProduct] = useState(products[0]?.slug || '')
  const [productImages, setProductImages] = useState<Record<number, ProductImage[]>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fetch gallery images for all products
  useEffect(() => {
    async function fetchImages() {
      const imagesMap: Record<number, ProductImage[]> = {}
      for (const product of products) {
        try {
          const res = await fetch(`/api/products/${product.id}/images`)
          if (res.ok) {
            const images = await res.json()
            imagesMap[product.id] = images
          }
        } catch (error) {
          console.error('Error fetching images for product', product.id, error)
        }
      }
      setProductImages(imagesMap)
    }
    if (products.length > 0) {
      fetchImages()
    }
  }, [products])

  const openLightbox = (product: FanCoilProduct) => {
    const images: string[] = []
    // Add gallery images
    const galleryImages = productImages[product.id] || []
    galleryImages.forEach(img => {
      if (!images.includes(img.url)) {
        images.push(img.url)
      }
    })
    if (images.length > 0) {
      setLightboxImages(images)
      setLightboxIndex(0)
      setLightboxOpen(true)
    }
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    setLightboxImages([])
    setLightboxIndex(0)
  }

  const nextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % lightboxImages.length)
  }

  const prevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + lightboxImages.length) % lightboxImages.length)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, lightboxImages.length])

  if (products.length === 0) {
    return (
      <section id="products" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('noProducts') || 'No products available yet.'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section id="products" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p className="eyebrow">Fan Coil</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {t('subtitle')}
            </p>
          </motion.div>

          <Tabs value={activeProduct} onValueChange={setActiveProduct} className="w-full">
            <TabsList className="mb-8 flex h-auto flex-wrap justify-center gap-2 bg-transparent">
              {products.map((product) => (
                <TabsTrigger
                  key={product.slug}
                  value={product.slug}
                  className="rounded-full border border-border px-6 py-2.5 text-base font-medium data-[state=active]:border-secondary data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground"
                >
                  {product.name}
                </TabsTrigger>
              ))}
            </TabsList>

              {products.map((product) => {
                const specs = product.specs || {}
                const features = product.features || []
                const galleryImages = productImages[product.id] || []
                // Get primary image from gallery
                const primaryImage = galleryImages.find(img => img.isPrimary) || galleryImages[0]
                const hasImages = galleryImages.length > 0
                
                return (
                  <TabsContent key={product.slug} value={product.slug} className="mt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Card className="overflow-hidden rounded-2xl border border-border shadow-[0_24px_60px_-30px_rgba(5,25,65,0.4)]">
                        <CardContent className="p-0">
                          <div className="grid gap-0 lg:grid-cols-2">
                            {/* Image Section - Full height, larger image */}
                            <div 
                              className={cn(
                                "relative flex min-h-[500px] items-center justify-center bg-soft-ice lg:min-h-[600px]",
                                hasImages && "cursor-pointer group"
                              )}
                            >
                              {/* Clickable overlay for the entire image area */}
                              {hasImages && (
                                <button
                                  type="button"
                                  className="absolute inset-0 z-20 w-full h-full bg-transparent"
                                  onClick={() => openLightbox(product)}
                                  aria-label={`${galleryAriaLabel} ${product.name}`}
                                />
                              )}
                              <div className="relative w-full h-full pointer-events-none">
                                {primaryImage ? (
                                  <Image
                                    src={primaryImage.url}
                                    alt={product.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center">
                                    <Wind className="h-32 w-32 text-muted-foreground/30" />
                                  </div>
                                )}
                                {/* Hover overlay with zoom icon */}
                                {hasImages && (
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                                    <ZoomIn className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  </div>
                                )}
                              </div>
                              {product.category && (
                                <span className="pointer-events-none absolute left-4 top-4 z-10 rounded-full bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-primary backdrop-blur">
                                  {product.category}
                                </span>
                              )}
                              {/* Gallery indicator */}
                              {galleryImages.length > 0 && (
                                <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-primary/80 px-3 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur">
                                  {galleryImages.length} {imagesLabel}
                                </div>
                              )}
                            </div>

                          {/* Content Section */}
                          <div className="flex flex-col justify-center bg-background p-8 lg:p-12">
                            <h3 className="mb-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
                              {product.name}
                            </h3>
                            {product.shortDescription && (
                              <p className="mb-4 text-lg font-medium text-secondary">
                                {product.shortDescription}
                              </p>
                            )}
                            {product.description && (
                              <p className="mb-8 leading-relaxed text-muted-foreground">
                                {product.description}
                              </p>
                            )}

                            {/* Specs Grid */}
                            {Object.keys(specs).length > 0 && (
                              <div className="grid grid-cols-2 gap-4 mb-8">
                                {specs.power && (
                                  <div className="flex items-center gap-3 rounded-xl border border-border bg-soft-ice p-4">
                                    <Thermometer className="h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">{t('specs.power')}</p>
                                      <p className="font-semibold text-foreground">{specs.power}</p>
                                    </div>
                                  </div>
                                )}
                                {specs.airflow && (
                                  <div className="flex items-center gap-3 rounded-xl border border-border bg-soft-ice p-4">
                                    <Wind className="h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">{t('specs.airflow')}</p>
                                      <p className="font-semibold text-foreground">{specs.airflow}</p>
                                    </div>
                                  </div>
                                )}
                                {specs.noise && (
                                  <div className="flex items-center gap-3 rounded-xl border border-border bg-soft-ice p-4">
                                    <Volume2 className="h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">{t('specs.noise')}</p>
                                      <p className="font-semibold text-foreground">{specs.noise}</p>
                                    </div>
                                  </div>
                                )}
                                {specs.dimensions && (
                                  <div className="flex items-center gap-3 rounded-xl border border-border bg-soft-ice p-4">
                                    <Ruler className="h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">{t('specs.dimensions')}</p>
                                      <p className="font-semibold text-foreground">{specs.dimensions}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Features */}
                            {features.length > 0 && (
                              <div className="space-y-3 mb-8">
                                {features.map((feature, i) => (
                                  <div key={i} className="flex items-center gap-3 text-muted-foreground">
                                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-secondary" aria-hidden="true" />
                                    <span>{feature}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* View Details Button */}
                            <Link 
                              href={`/${locale}/fan-coil/${product.slug}`}
                              className="group inline-flex items-center gap-2 font-semibold text-secondary transition-all hover:gap-3"
                            >
                              {detailsLabel}
                              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </TabsContent>
              )
            })}
          </Tabs>
        </div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
            onClick={closeLightbox}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              onClick={closeLightbox}
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-lg font-medium z-50">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>

            {/* Previous button */}
            {lightboxImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-50"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Main image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-[90vw] max-h-[85vh] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxImages[lightboxIndex]}
                alt={`Image ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </motion.div>

            {/* Next button */}
            {lightboxImages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 z-50"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
                aria-label="Next image"
              >
                <ChevronRightIcon className="h-8 w-8" />
              </Button>
            )}

            {/* Thumbnails */}
            {lightboxImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 rounded-lg z-50">
                {lightboxImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation()
                      setLightboxIndex(idx)
                    }}
                    className={cn(
                      "relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                      idx === lightboxIndex 
                        ? "border-white" 
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    aria-label={`View image ${idx + 1}`}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
