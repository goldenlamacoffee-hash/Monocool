'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSession } from '@/lib/auth-client'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lock, Zap, Thermometer } from 'lucide-react'
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
    <Link href={productUrl} className="block h-full">
      <Card className="group flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20">
        <CardHeader className="p-0">
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Thermometer className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {product.category && (
              <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                {product.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {product.shortDescription && (
            <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
              {product.shortDescription}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {product.energyClass && (
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {product.energyClass}
              </Badge>
            )}
            {product.coolingCapacity && (
              <Badge variant="outline" className="gap-1">
                <Thermometer className="h-3 w-3" />
                {product.coolingCapacity}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t p-4">
          {!mounted || isPending ? (
            <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          ) : session?.user ? (
            <div className="text-lg font-bold text-primary">
              {product.price ? `${Number(product.price).toLocaleString(locale)} EUR` : t('priceOnLogin')}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>{t('priceOnLogin')}</span>
            </div>
          )}
          <span className="inline-flex h-7 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground transition-colors group-hover:bg-primary/90">
            {t('details')}
          </span>
        </CardFooter>
      </Card>
    </Link>
  )
}
