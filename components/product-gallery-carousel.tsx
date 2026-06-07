'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Thermometer, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

interface GalleryImage {
  id: number
  url: string
  alt: string | null
  isPrimary: boolean
}

interface ProductGalleryCarouselProps {
  images: GalleryImage[]
  productName: string
}

export function ProductGalleryCarousel({ 
  images, 
  productName, 
}: ProductGalleryCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Sort images with primary first
  const allImages = [...images].sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return 0
  })

  // Set up carousel event listener
  useEffect(() => {
    if (!api) return
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }
    
    onSelect() // Set initial value
    api.on('select', onSelect)
    
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = useCallback(() => {
    setLightboxIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }, [allImages.length])

  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }, [allImages.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, goToPrevious, goToNext])

  // If no images at all, show placeholder
  if (allImages.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
        <div className="flex h-full items-center justify-center">
          <Thermometer className="h-24 w-24 text-muted-foreground/30" />
        </div>
      </div>
    )
  }

  // If only one image, show it without carousel but with lightbox
  if (allImages.length === 1) {
    return (
      <>
        <div 
          className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-muted group"
          onClick={() => openLightbox(0)}
        >
          <Image
            src={allImages[0].url}
            alt={allImages[0].alt || productName}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
            <ZoomIn className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
        </div>
        
        {/* Lightbox */}
        {lightboxOpen && (
          <Lightbox
            images={allImages}
            currentIndex={lightboxIndex}
            productName={productName}
            onClose={closeLightbox}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onThumbnailClick={setLightboxIndex}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Carousel */}
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {allImages.map((image, index) => (
              <CarouselItem key={image.id || index}>
                <div 
                  className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-muted group"
                  onClick={() => openLightbox(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || `${productName} - Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <ZoomIn className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-4 h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background" />
          <CarouselNext className="right-4 h-10 w-10 bg-background/80 backdrop-blur-sm hover:bg-background" />
        </Carousel>

        {/* Thumbnail Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                current === index 
                  ? 'border-primary ring-2 ring-primary/20' 
                  : 'border-transparent hover:border-muted-foreground/30'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* Image Counter */}
        <div className="text-center text-sm text-muted-foreground">
          {current + 1} / {allImages.length}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={allImages}
          currentIndex={lightboxIndex}
          productName={productName}
          onClose={closeLightbox}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onThumbnailClick={setLightboxIndex}
        />
      )}
    </>
  )
}

// Lightbox Component
interface LightboxProps {
  images: GalleryImage[]
  currentIndex: number
  productName: string
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onThumbnailClick: (index: number) => void
}

function Lightbox({ 
  images, 
  currentIndex, 
  productName, 
  onClose, 
  onPrevious, 
  onNext,
  onThumbnailClick 
}: LightboxProps) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation - Previous */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrevious() }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Main Image */}
      <div 
        className="relative h-[80vh] w-[90vw] max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[currentIndex].url}
          alt={images[currentIndex].alt || `${productName} - Image ${currentIndex + 1}`}
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* Navigation - Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Next image"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Image Counter */}
      <div className="absolute bottom-20 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div 
          className="absolute bottom-4 left-1/2 z-10 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto rounded-lg bg-black/50 p-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, index) => (
            <button
              key={image.id || index}
              onClick={() => onThumbnailClick(index)}
              className={cn(
                'relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                currentIndex === index 
                  ? 'border-white' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <Image
                src={image.url}
                alt={image.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
