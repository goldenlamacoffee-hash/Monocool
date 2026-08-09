'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, ArrowRight, ShoppingCart, Package } from 'lucide-react'
import { type PartnerOrderRow } from '@/app/actions/partner-portal'

interface OrdersClientProps {
  orders: (PartnerOrderRow & { discountTotal?: string | null; vatTotal?: string | null })[]
  // §5 — fallback used only when order.currency is null
  marketCurrency: string
  locale: string
}

const STATUS_FILTER_GROUPS: Record<string, string[]> = {
  all: [],
  open: ['submitted', 'confirmed', 'processing', 'shipped'],
  completed: ['completed'],
  cancelled: ['cancelled'],
}

export function OrdersClient({ orders, marketCurrency, locale }: OrdersClientProps) {
  const t = useTranslations('partnerPortal')
  const [filter, setFilter] = useState<'all' | 'open' | 'completed' | 'cancelled'>('all')
  const [search, setSearch] = useState('')

  // §5 — each order is formatted using its own persisted currency; marketCurrency is the fallback
  const fmtOrderCurrency = (val: string | null | undefined, orderCurrency: string | null | undefined) => {
    const cur = (orderCurrency && orderCurrency.trim().length === 3)
      ? orderCurrency.trim().toUpperCase()
      : marketCurrency
    const n = parseFloat(String(val ?? '0'))
    if (!Number.isFinite(n)) return `— ${cur}`
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(n)
    } catch {
      return `${n.toFixed(2)} ${cur}`
    }
  }

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      submitted: t('orders.statusSubmitted'),
      confirmed: t('orders.statusConfirmed'),
      processing: t('orders.statusProcessing'),
      shipped: t('orders.statusShipped'),
      completed: t('orders.statusCompleted'),
      cancelled: t('orders.statusCancelled'),
    }
    return map[s] ?? s
  }

  const paymentLabel = (s: string) => {
    const map: Record<string, string> = {
      unpaid: t('orders.paymentUnpaid'),
      payment_request_sent: t('orders.paymentRequestSent'),
      paid: t('orders.paymentPaid'),
      refunded: t('orders.paymentRefunded'),
    }
    return map[s] ?? s
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'submitted': return 'bg-blue-50 text-blue-700'
      case 'confirmed': return 'bg-indigo-50 text-indigo-700'
      case 'processing': return 'bg-amber-50 text-amber-700'
      case 'shipped': return 'bg-purple-50 text-purple-700'
      case 'completed': return 'bg-emerald-50 text-emerald-700'
      case 'cancelled': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const paymentColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-emerald-50 text-emerald-700'
      case 'payment_request_sent': return 'bg-blue-50 text-blue-700'
      case 'refunded': return 'bg-gray-100 text-gray-600'
      default: return 'bg-amber-50 text-amber-700'
    }
  }

  const filtered = useMemo(() => {
    let result = orders

    if (filter !== 'all') {
      const group = STATUS_FILTER_GROUPS[filter]
      result = result.filter(o => group.includes(o.status))
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(o => o.orderNumber.toLowerCase().includes(q))
    }

    return result
  }, [orders, filter, search])

  const filterTabs = [
    { key: 'all', label: t('orders.filterAll') },
    { key: 'open', label: t('orders.filterOpen') },
    { key: 'completed', label: t('orders.filterCompleted') },
    { key: 'cancelled', label: t('orders.filterCancelled') },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-[color:var(--mono-line)] bg-white p-4 shadow-sm">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1" role="tablist" aria-label={t('orders.filterLabel')}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={filter === tab.key}
              onClick={() => setFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)] ${
                filter === tab.key
                  ? 'bg-[color:var(--mono-navy)] text-white'
                  : 'text-[color:var(--mono-muted)] hover:bg-[color:var(--mono-ice)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--mono-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('orders.searchPlaceholder')}
            aria-label={t('orders.searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] pl-9 pr-3 text-sm text-[color:var(--mono-navy)] placeholder:text-[color:var(--mono-muted)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)] sm:w-56"
          />
        </div>
      </div>

      {/* Table / empty state */}
      <div className="rounded-xl border border-[color:var(--mono-line)] bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ShoppingCart className="h-12 w-12 text-[color:var(--mono-line)] mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-[color:var(--mono-navy)]">{t('orders.emptyTitle')}</p>
            <p className="text-xs text-[color:var(--mono-muted)] mt-1">{t('orders.emptyDescription')}</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm" aria-label={t('nav.orders')}>
                <thead>
                  <tr className="border-b border-[color:var(--mono-line)] bg-[color:var(--mono-bg)]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.orderNumber')}</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.date')}</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.status')}</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.payment')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.total')}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)] sr-only">{t('orders.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o, idx) => (
                    <tr
                      key={o.id}
                      className={`border-b border-[color:var(--mono-line)] hover:bg-[color:var(--mono-bg)] transition-colors ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/${locale}/konto/orders/${o.orderNumber}`}
                          className="font-mono text-xs font-semibold text-[color:var(--mono-navy)] hover:text-[color:var(--mono-steel)] transition-colors"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3.5 text-[color:var(--mono-muted)] whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>
                          {statusLabel(o.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentColor(o.paymentStatus)}`}>
                          {paymentLabel(o.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right font-semibold text-[color:var(--mono-navy)]">
                        {fmtOrderCurrency(String(o.grandTotal ?? o.total ?? '0'), o.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/${locale}/konto/orders/${o.orderNumber}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors"
                          aria-label={`${t('orders.detail')} ${o.orderNumber}`}
                        >
                          {t('orders.detail')}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="flex flex-col divide-y divide-[color:var(--mono-line)] md:hidden">
              {filtered.map(o => (
                <Link
                  key={o.id}
                  href={`/${locale}/konto/orders/${o.orderNumber}`}
                  className="flex flex-col gap-2 p-4 hover:bg-[color:var(--mono-bg)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-[color:var(--mono-navy)]">{o.orderNumber}</span>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[color:var(--mono-muted)]">{fmtDate(o.createdAt)}</span>
                    <span className="font-semibold text-[color:var(--mono-navy)]">
                      {fmtOrderCurrency(String(o.grandTotal ?? o.total ?? '0'), o.currency)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${paymentColor(o.paymentStatus)}`}>
                      {paymentLabel(o.paymentStatus)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
