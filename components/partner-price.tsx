'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { formatPrice, type ProductPriceView } from '@/lib/pricing'
import { type Locale } from '@/i18n/config'

interface PartnerPriceProps {
  view: ProductPriceView
  /** `card` = compact (product cards), `detail` = full block (detail pages). */
  variant?: 'card' | 'detail'
  /** `onDark` swaps text colors for placement on dark/navy surfaces. */
  tone?: 'default' | 'onDark'
}

/**
 * Presentational, gated price display. It renders ONLY what the server-resolved
 * `view` allows: guests and unapproved partners never receive discounted or
 * final prices in their props, so no partner price can leak client-side.
 */
export function PartnerPrice({ view, variant = 'card', tone = 'default' }: PartnerPriceProps) {
  const t = useTranslations('products')
  const locale = useLocale() as Locale

  const onDark = tone === 'onDark'
  const c = {
    eyebrow: onDark ? 'text-xs font-semibold uppercase tracking-[0.12em] text-white/60' : 'eyebrow',
    price: onDark ? 'text-white' : 'text-primary',
    muted: onDark ? 'text-white/60' : 'text-muted-foreground',
    strong: onDark ? 'text-white' : 'text-foreground',
    lockBg: onDark ? 'bg-white/10' : 'bg-background',
    badge: onDark ? 'bg-white/10 text-white' : 'bg-accent text-accent-foreground',
  }

  // --- Guest: not logged in ---
  if (view.state === 'guest') {
    if (variant === 'detail') {
      return (
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary ${c.lockBg}`}>
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <div className={`font-medium ${c.strong}`}>{t('loginToSeePrice')}</div>
            <div className={`text-sm ${c.muted}`}>
              <Link href={`/${locale}/anmelden`} className="font-medium text-secondary hover:underline">
                {t('loginPrompt')}
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className={`flex items-center gap-1.5 text-sm ${c.muted}`}>
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('priceOnLogin')}</span>
      </div>
    )
  }

  // --- Logged in but awaiting approval ---
  if (view.state === 'pending') {
    if (variant === 'detail') {
      return (
        <div className="flex items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary ${c.lockBg}`}>
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className={`font-medium ${c.strong}`}>{t('awaitingApproval')}</div>
        </div>
      )
    }
    return (
      <div className={`flex items-center gap-1.5 text-sm ${c.muted}`}>
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('awaitingApproval')}</span>
      </div>
    )
  }

  // --- Approved partner (or admin) ---
  // No base price set for this market → show a neutral message, never "0 EUR".
  if (view.finalPrice === null || view.listPrice === null) {
    return <span className={`text-sm ${c.muted}`}>{t('priceOnRequest')}</span>
  }

  const hasDiscount = view.discountPercent > 0

  if (variant === 'detail') {
    return (
      <div>
        <div className={c.eyebrow}>{t('partnerPrice')}</div>
        <div className={`mt-1 font-heading text-3xl font-semibold ${c.price}`}>
          {formatPrice(view.finalPrice, locale)}
        </div>
        {hasDiscount && (
          <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm ${c.muted}`}>
            <span>
              {t('listPrice')}:{' '}
              <span className="line-through">{formatPrice(view.listPrice, locale)}</span>
            </span>
            <span className={`rounded-md px-2 py-0.5 font-semibold ${c.badge}`}>
              -{view.discountPercent}% {t('discountLabel')}
            </span>
          </div>
        )}
      </div>
    )
  }

  // card variant
  return (
    <div className="flex flex-col">
      <span className={`font-heading text-lg font-semibold ${c.price}`}>
        {formatPrice(view.finalPrice, locale)}
      </span>
      {hasDiscount && (
        <span className={`text-xs ${c.muted}`}>
          <span className="line-through">{formatPrice(view.listPrice, locale)}</span>
          <span className="ml-1.5 font-semibold text-secondary">-{view.discountPercent}%</span>
        </span>
      )}
    </div>
  )
}
