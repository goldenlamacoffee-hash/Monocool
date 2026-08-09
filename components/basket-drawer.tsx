'use client'

import Link from 'next/link'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { useBasket } from '@/contexts/basket-context'
import { computeBasketTotals } from '@/lib/basket'
import { useLocale, useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'

export function BasketDrawer() {
  const { items, count, removeItem, setQuantity, hydrated, deliveryPrice, vatRate, currency } =
    useBasket()
  const t = useTranslations('basket')
  const locale = useLocale() as Locale

  // V1.4J.3 — delivery is charged ONCE per order regardless of item count.
  // Display only; placeOrder() re-reads the authoritative value server-side
  // and re-derives this same result independently from the database.
  const { itemsSubtotal: subtotal, vatTotal: vatAmount, grandTotal } = computeBasketTotals({
    items,
    vatRate,
    deliveryPrice,
  })

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t('openBasket', { count })}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {hydrated && count > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="flex items-center gap-2 font-heading text-lg font-semibold">
            <ShoppingCart className="h-5 w-5 text-primary" aria-hidden="true" />
            {t('title')}
            {hydrated && count > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {t('itemCount', { count })}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto py-4">
          {!hydrated || items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
              <Link
                href={`/${locale}/produkte`}
                className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                {t('browseProducts')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-4" aria-label={t('title')}>
              {items.map((item) => (
                <li key={item.key} className="flex gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground leading-snug">
                      {item.productName}
                    </p>
                    {item.variantName && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {item.variantName}
                      </p>
                    )}
                    {item.sku && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground font-mono">
                        {item.sku}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {item.finalUnitPrice.toLocaleString(locale, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{' '}
                        {currency}
                      </span>
                      {item.discountPercent > 0 && (
                        <span className="rounded bg-secondary/15 px-1 py-0.5 text-[10px] font-semibold text-secondary">
                          -{item.discountPercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label={t('remove')}
                      onClick={() => removeItem(item.key)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={t('decrement')}
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Minus className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={t('increment')}
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {(item.finalUnitPrice * item.quantity).toLocaleString(locale, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}{' '}
                      {currency}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer — totals + actions */}
        {hydrated && items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-4">
            <Separator />
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(subtotal)} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('delivery')}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {deliveryPrice > 0 ? `${fmt(deliveryPrice)} ${currency}` : t('deliveryFree')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('vat', { rate: vatRate })}</span>
                <span className="font-medium text-foreground tabular-nums">
                  {fmt(vatAmount)} {currency}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1.5 text-base font-semibold">
                <span className="text-foreground">{t('grandTotal')}</span>
                <span className="text-foreground tabular-nums">
                  {fmt(grandTotal)} {currency}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/${locale}/checkout`}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
              >
                {t('checkout')}
              </Link>
              <Link
                href={`/${locale}/warenkorb`}
                className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {t('reviewBasket')}
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
