'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { useBasket } from '@/contexts/basket-context'
import { useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'

interface Props {
  locale: Locale
}

export function BasketReviewClient({ locale }: Props) {
  const { items, subtotal, removeItem, setQuantity, hydrated, deliveryPrice, vatRate, currency } = useBasket()
  const t = useTranslations('basket')

  // V1.4J.3 — delivery is charged ONCE per order. Display only; placeOrder()
  // re-reads the authoritative deliveryPrice/vatRate server-side.
  const itemsVat = Math.round(subtotal * (vatRate / 100) * 100) / 100
  const deliveryVat = Math.round(deliveryPrice * (vatRate / 100) * 100) / 100
  const vatAmount = itemsVat + deliveryVat
  const grandTotal = Math.round((subtotal + deliveryPrice + vatAmount) * 100) / 100

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('emptyTitle')}</h1>
        <p className="text-muted-foreground">{t('empty')}</p>
        <Link
          href={`/${locale}/produkte`}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('browseProducts')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}/produkte`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('continueShopping')}
      </Link>

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground mb-8">
        {t('pageTitle')}
      </h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Item table */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="font-medium text-foreground leading-snug">{item.productName}</p>
                {item.variantName && (
                  <p className="text-sm text-muted-foreground">{item.variantName}</p>
                )}
                {item.sku && (
                  <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-sm text-muted-foreground">
                    {fmt(item.finalUnitPrice)} {currency} / {t('piece')}
                  </span>
                  {item.discountPercent > 0 && (
                    <span className="rounded bg-secondary/15 px-1.5 py-0.5 text-[11px] font-semibold text-secondary">
                      -{item.discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Qty + line total */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  aria-label={t('remove')}
                  onClick={() => removeItem(item.key)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={t('decrement')}
                    onClick={() => setQuantity(item.key, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={t('increment')}
                    onClick={() => setQuantity(item.key, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <span className="text-base font-bold text-foreground tabular-nums">
                  {fmt(item.finalUnitPrice * item.quantity)} {currency}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              {t('orderSummary')}
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium tabular-nums">{fmt(subtotal)} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('delivery')}</span>
                <span className="font-medium tabular-nums">
                  {deliveryPrice > 0 ? `${fmt(deliveryPrice)} ${currency}` : t('deliveryFree')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t('vat', { rate: vatRate })}
                </span>
                <span className="font-medium tabular-nums">{fmt(vatAmount)} {currency}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                <span>{t('grandTotal')}</span>
                <span className="tabular-nums">{fmt(grandTotal)} {currency}</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{t('vatIncluded', { rate: vatRate })}</p>

            <Link
              href={`/${locale}/checkout`}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
            >
              {t('proceedToCheckout')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
