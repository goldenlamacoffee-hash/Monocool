'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Lock, Zap, Thermometer, ArrowRight } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface ProductCardProps {
  product: {
    id: number
    name: string
    slug: string
    shortDescription?: string | null
    price?: string | null
    imageUrl?: string | null
    category?: string | null
    energyClass?: string | null
    coolingCapacity?: string | null
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const { data: session, isPending } = useSession()
  const [mounted, setMounted] = useState(false)
  const t = useTranslations('products')
  const locale = useLocale() as Locale

  useEffect(() => {
    setMounted(true)
  }, [])

  const productUrl = `/${locale}/produkte/${product.slug}`

  return (
    <Link href={productUrl} className="block h-full focus-visible:outline-none">
      <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-18px_rgba(5,25,65,0.35)] hover:ring-1 hover:ring-secondary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-soft-ice">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Thermometer className="h-14 w-14 text-secondary/30" aria-hidden="true" />
              </div>
            )}
            {product.category && (
              <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-primary backdrop-blur">
                {product.category}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-5">
          <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {product.energyClass && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                <Zap className="h-3 w-3 text-secondary" aria-hidden="true" />
                {product.energyClass}
              </span>
            )}
            {product.coolingCapacity && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
                <Thermometer className="h-3 w-3 text-secondary" aria-hidden="true" />
                {product.coolingCapacity}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-3 border-t border-border p-5">
          {!mounted || isPending ? (
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          ) : session?.user ? (
            <div className="font-heading text-lg font-semibold text-primary">
              {product.price ? `${Number(product.price).toLocaleString(locale)} EUR` : t('priceOnLogin')}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('priceOnLogin')}</span>
            </div>
          )}
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-all group-hover:gap-2.5">
            {t('details')}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
