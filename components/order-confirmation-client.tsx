'use client'

import { useEffect } from 'react'
import { useBasket } from '@/contexts/basket-context'
import { useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'

interface OrderItem {
  id: number
  productName: string
  variantName: string | null
  sku: string | null
  quantity: number
  baseUnitPrice: string
  discountPercent: string
  finalUnitPrice: string
  vatRate: string
  vatAmount: string
  lineSubtotal: string
  lineTotal: string
}

export interface OrderData {
  orderNumber: unknown
  grandTotal: unknown
  vatTotal: unknown
  subtotal?: unknown
  currency: unknown
  market: unknown
  customerPoNumber: unknown
  customerNote: unknown
  createdAt: unknown
  items: OrderItem[]
}

interface Props {
  order: OrderData
  locale: Locale
}

export function OrderConfirmationClient({ order, locale }: Props) {
  const { clearBasket } = useBasket()
  const t = useTranslations('orderConfirmation')

  // Clear basket on mount — the order is now placed
  useEffect(() => {
    clearBasket()
  }, [clearBasket])

  const fmt = (v: unknown) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v)
    if (!Number.isFinite(n)) return '—'
    return n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const currency = (order.currency as string) ?? 'EUR'

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
      {/* Item table */}
      <div>
        <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          {t('itemsLabel')}
        </h2>
        <ul className="divide-y divide-border">
          {order.items.map((item) => (
            <li key={item.id} className="py-3 flex gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{item.productName}</p>
                {item.variantName && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.variantName}</p>
                )}
                {item.sku && (
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{item.sku}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {fmt(item.finalUnitPrice)} {currency} / {t('piece')}
                  </span>
                  {parseFloat(item.discountPercent) > 0 && (
                    <span className="rounded bg-secondary/15 px-1.5 py-0.5 text-[10px] font-semibold text-secondary">
                      -{item.discountPercent}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">&times;{item.quantity}</p>
                <p className="text-sm font-semibold text-foreground tabular-nums mt-0.5">
                  {fmt(item.lineTotal)} {currency}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('subtotalLabel')}</span>
          <span className="tabular-nums">{fmt(order.subtotal)} {currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t('vatLabel')}</span>
          <span className="tabular-nums">{fmt(order.vatTotal)} {currency}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t border-border pt-2">
          <span>{t('grandTotalLabel')}</span>
          <span className="tabular-nums">{fmt(order.grandTotal)} {currency}</span>
        </div>
      </div>

      {/* Order metadata */}
      {(Boolean(order.customerPoNumber) || Boolean(order.customerNote)) && (
        <div className="border-t border-border pt-4 space-y-2 text-sm">
          {Boolean(order.customerPoNumber) && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-40 shrink-0">{t('poNumberLabel')}</span>
              <span className="font-mono text-foreground">{String(order.customerPoNumber)}</span>
            </div>
          )}
          {Boolean(order.customerNote) && (
            <div className="flex gap-2">
              <span className="text-muted-foreground w-40 shrink-0">{t('noteLabel')}</span>
              <span className="text-foreground">{String(order.customerNote)}</span>
            </div>
          )}
        </div>
      )}

      {/* What happens next */}
      <div className="rounded-xl bg-soft-ice border border-border p-4 text-sm text-muted-foreground">
        {t('whatHappensNext')}
      </div>
    </div>
  )
}
