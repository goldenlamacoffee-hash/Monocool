'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { type PriceListProduct } from '@/app/actions/partner-portal'

interface PriceListClientProps {
  products: PriceListProduct[]
  discountPercent: number
  currency: string
  vatRate: number
  locale: string
}

export function PriceListClient({
  products,
  discountPercent,
  currency,
  vatRate,
  locale,
}: PriceListClientProps) {
  const t = useTranslations('partnerPortal')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set())

  const fmtCurrency = (val: number | null) => {
    if (val === null || !Number.isFinite(val)) return null
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val)
    } catch {
      // Last-resort fallback if currency is somehow invalid on the client
      return `${val.toFixed(2)} ${currency}`
    }
  }

  const categories = useMemo(() => {
    const cats = new Set<string>()
    for (const p of products) {
      if (p.category) cats.add(p.category)
    }
    return Array.from(cats)
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter
      if (!matchCategory) return false
      if (!q) return true
      if (p.name.toLowerCase().includes(q)) return true
      if (p.category?.toLowerCase().includes(q)) return true
      // Check variant SKUs
      if (p.variants.some(v => (v.sku ?? '').toLowerCase().includes(q) || v.name.toLowerCase().includes(q))) return true
      return false
    })
  }, [products, search, categoryFilter])

  const toggleVariants = (id: number) => {
    setExpandedVariants(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const categoryLabel = (c: string | null) => {
    if (!c) return null
    const map: Record<string, string> = {
      klimageraete: t('prices.categoryMonoblock'),
      fancoil: t('prices.categoryFancoil'),
    }
    return map[c] ?? c
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-12 shadow-sm text-center">
        <Tag className="mx-auto h-12 w-12 text-[color:var(--mono-line)] mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-[color:var(--mono-navy)]">{t('prices.emptyTitle')}</p>
        <p className="text-xs text-[color:var(--mono-muted)] mt-1">{t('prices.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-xl border border-[color:var(--mono-line)] bg-white p-4 shadow-sm">
        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)] ${
              categoryFilter === 'all'
                ? 'bg-[color:var(--mono-navy)] text-white'
                : 'text-[color:var(--mono-muted)] hover:bg-[color:var(--mono-ice)]'
            }`}
          >
            {t('prices.allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)] ${
                categoryFilter === cat
                  ? 'bg-[color:var(--mono-navy)] text-white'
                  : 'text-[color:var(--mono-muted)] hover:bg-[color:var(--mono-ice)]'
              }`}
            >
              {categoryLabel(cat) ?? cat}
            </button>
          ))}
        </div>

        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--mono-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('prices.searchPlaceholder')}
            aria-label={t('prices.searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] pl-9 pr-3 text-sm text-[color:var(--mono-navy)] placeholder:text-[color:var(--mono-muted)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)] sm:w-56"
          />
        </div>
      </div>

      {/* Discount info band */}
      <div className="flex items-center gap-3 rounded-xl border border-[color:var(--mono-steel)]/20 bg-[color:var(--mono-ice)] px-4 py-3">
        <Tag className="h-4 w-4 text-[color:var(--mono-steel)] shrink-0" aria-hidden="true" />
        <p className="text-sm text-[color:var(--mono-navy)]">
          {t('prices.discountBand', { discount: discountPercent, vat: vatRate, currency })}
        </p>
      </div>

      {/* Products */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-10 text-center">
          <p className="text-sm text-[color:var(--mono-muted)]">{t('prices.noResults')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(product => {
            const expanded = expandedVariants.has(product.id)
            const hasVariants = product.variants.length > 0
            return (
              <div
                key={product.id}
                className="rounded-xl border border-[color:var(--mono-line)] bg-white shadow-sm overflow-hidden"
              >
                {/* Product row */}
                <div className="flex gap-4 p-4 sm:p-5">
                  {/* Image */}
                  {product.imageUrl && (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)]">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={
                            product.category === 'fancoil'
                              ? `/${locale}/fan-coil/${product.slug}`
                              : `/${locale}/produkte/${product.slug}`
                          }
                          className="font-heading text-base font-semibold text-[color:var(--mono-navy)] hover:text-[color:var(--mono-steel)] transition-colors"
                        >
                          {product.name}
                        </Link>
                        {product.category && (
                          <p className="text-xs text-[color:var(--mono-muted)] mt-0.5">{categoryLabel(product.category)}</p>
                        )}
                        {product.technicalData && (
                          <p className="text-xs text-[color:var(--mono-muted)] mt-1 line-clamp-1">{product.technicalData}</p>
                        )}
                      </div>

                      {/* Prices — top-right */}
                      <div className="text-right shrink-0">
                        {product.basePrice !== null ? (
                          <>
                            <p className="text-xs text-[color:var(--mono-muted)] line-through">
                              {fmtCurrency(product.basePrice)}
                            </p>
                            <p className="text-lg font-bold text-[color:var(--mono-navy)]">
                              {fmtCurrency(product.partnerPrice)}
                            </p>
                            <p className="text-xs text-[color:var(--mono-muted)]">
                              {t('prices.grossLabel')} {fmtCurrency(product.grossPrice)}
                            </p>
                            <p className="text-xs font-medium text-emerald-600 mt-0.5">
                              -{discountPercent} %
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-[color:var(--mono-muted)] italic">{t('prices.noPriceConfigured')}</p>
                        )}
                      </div>
                    </div>

                    {/* Variant toggle */}
                    {hasVariants && (
                      <button
                        onClick={() => toggleVariants(product.id)}
                        aria-expanded={expanded}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)] rounded"
                      >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />}
                        {expanded ? t('prices.hideVariants') : t('prices.showVariants', { count: product.variants.length })}
                      </button>
                    )}
                  </div>
                </div>

                {/* Variants table */}
                {hasVariants && expanded && (
                  <div className="border-t border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] overflow-x-auto">
                    <table className="w-full text-sm" aria-label={`${product.name} ${t('prices.variants')}`}>
                      <thead>
                        <tr className="border-b border-[color:var(--mono-line)]">
                          <th className="px-5 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('prices.variantName')}</th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('prices.sku')}</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('prices.basePrice')}</th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('prices.partnerPrice')}</th>
                          <th className="px-5 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('prices.grossPrice')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v, idx) => (
                          <tr
                            key={v.id}
                            className={`border-b border-[color:var(--mono-line)] ${idx === product.variants.length - 1 ? 'border-b-0' : ''}`}
                          >
                            <td className="px-5 py-2.5 font-medium text-[color:var(--mono-navy)]">{v.name}</td>
                            <td className="px-3 py-2.5 font-mono text-xs text-[color:var(--mono-muted)]">{v.sku ?? '—'}</td>
                            <td className="px-3 py-2.5 text-right text-[color:var(--mono-muted)]">
                              {v.basePrice !== null ? fmtCurrency(v.basePrice) : <span className="italic">{t('prices.noPriceConfigured')}</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right font-semibold text-[color:var(--mono-navy)]">
                              {v.partnerPrice !== null ? fmtCurrency(v.partnerPrice) : '—'}
                            </td>
                            <td className="px-5 py-2.5 text-right text-[color:var(--mono-muted)]">
                              {v.grossPrice !== null ? fmtCurrency(v.grossPrice) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
