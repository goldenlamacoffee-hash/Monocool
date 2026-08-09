'use client'

// --- Owner-only internal purchase-cost panel (V1.4I.1) ----------------------
// This component is only ever mounted by products-manager.tsx when the
// server-resolved `isOwner` flag is true (see lib/owner-auth.ts). For an
// ordinary admin it does not exist in the DOM or the React tree at all — it
// is never rendered-and-hidden. Every data read/write below goes through the
// owner-gated Server Actions in app/actions/internal-costs.ts, which
// independently re-verify owner access server-side on every call. Tampering
// with client state cannot grant access to real cost data.

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Trash2 } from 'lucide-react'
import {
  getInternalProductCosts,
  upsertInternalProductCost,
  deleteInternalProductCost,
} from '@/app/actions/internal-costs'
import { getProductVariants } from '@/app/actions/product-variants'
import { computeMargin, computeDiscountPreview } from '@/lib/margin'
import { resolveMarketCurrency } from '@/lib/market-currency'
import { getDomainFromLocale } from '@/lib/domain-utils'
import { type Locale } from '@/i18n/config'

type CostRow = {
  id: number
  productId: number
  variantId: number | null
  supplier: string
  purchasePrice: string
  currency: string
  note: string | null
}

type VariantOption = {
  id: number
  name: string
  price: string | null
}

interface InternalCostPanelProps {
  productId: number
  /** The base product's current selling price (product.price), as a string. */
  sellingPrice: string | null
  locale: Locale
}

const BASE_KEY = 'base'

function formatMoney(value: number, locale: string, currency: string) {
  return `${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export function InternalCostPanel({ productId, sellingPrice, locale }: InternalCostPanelProps) {
  const t = useTranslations('admin.internalCosts')

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [costRows, setCostRows] = useState<CostRow[]>([])
  const [variants, setVariants] = useState<VariantOption[]>([])

  const [target, setTarget] = useState<string>(BASE_KEY)
  const [supplier, setSupplier] = useState('')
  const [purchasePrice, setPurchasePrice] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [note, setNote] = useState('')
  const [discountInput, setDiscountInput] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'success' | 'error'>('idle')
  const [clearing, setClearing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [costs, variantRows] = await Promise.all([
        getInternalProductCosts(productId),
        getProductVariants(productId).catch(() => []),
      ])
      setCostRows(costs as CostRow[])
      setVariants(
        (variantRows as { id: number; name: string; price: string | null }[]).map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
        })),
      )
    } catch (err) {
      console.error('[v0] Error loading internal costs:', err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    load()
  }, [load])

  // When the target (base product / a variant) or the loaded cost rows
  // change, sync the form fields to whatever is persisted for that target.
  useEffect(() => {
    const variantId = target === BASE_KEY ? null : Number(target)
    const existing = costRows.find((r) => (r.variantId ?? null) === variantId)
    setSupplier(existing?.supplier ?? 'Zymbo')
    setPurchasePrice(existing?.purchasePrice ?? '')
    setCurrency(existing?.currency ?? 'EUR')
    setNote(existing?.note ?? '')
    setSaveState('idle')
  }, [target, costRows])

  const market = getDomainFromLocale(locale)
  const sellingCurrency = resolveMarketCurrency(undefined, market)

  // Selling price for the currently selected target: the variant's own price
  // when set, otherwise fall back to the base product's price — matching the
  // same fallback behavior the public frontend uses for variant pricing.
  const currentSellingPrice = useMemo(() => {
    if (target === BASE_KEY) {
      return sellingPrice !== null && sellingPrice !== '' ? Number(sellingPrice) : null
    }
    const variant = variants.find((v) => String(v.id) === target)
    const variantPrice = variant?.price
    if (variantPrice !== null && variantPrice !== undefined && variantPrice !== '') {
      return Number(variantPrice)
    }
    return sellingPrice !== null && sellingPrice !== '' ? Number(sellingPrice) : null
  }, [target, variants, sellingPrice])

  const purchasePriceNum = purchasePrice.trim() === '' ? null : Number(purchasePrice)

  const margin = computeMargin(
    currentSellingPrice,
    Number.isFinite(purchasePriceNum) ? purchasePriceNum : null,
    sellingCurrency,
    currency,
  )

  const discountPercentNum = discountInput.trim() === '' ? null : Number(discountInput)
  const discountPreview =
    discountPercentNum !== null && Number.isFinite(discountPercentNum)
      ? computeDiscountPreview(
          currentSellingPrice,
          Number.isFinite(purchasePriceNum) ? purchasePriceNum : null,
          discountPercentNum,
          sellingCurrency,
          currency,
        )
      : null

  const existingRow = useMemo(() => {
    const variantId = target === BASE_KEY ? null : Number(target)
    return costRows.find((r) => (r.variantId ?? null) === variantId) ?? null
  }, [target, costRows])

  const handleSave = async () => {
    const price = Number(purchasePrice)
    if (!purchasePrice.trim() || !Number.isFinite(price) || price < 0) {
      setSaveState('error')
      return
    }
    setSaving(true)
    setSaveState('idle')
    try {
      await upsertInternalProductCost({
        productId,
        variantId: target === BASE_KEY ? null : Number(target),
        supplier,
        purchasePrice: price,
        currency,
        note,
      })
      await load()
      setSaveState('success')
    } catch (err) {
      console.error('[v0] Error saving internal cost:', err)
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!existingRow) return
    if (!confirm(t('confirmClear'))) return
    setClearing(true)
    try {
      await deleteInternalProductCost(existingRow.id)
      await load()
    } catch (err) {
      console.error('[v0] Error clearing internal cost:', err)
    } finally {
      setClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {t('loadError')}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-foreground">{t('title')}</h3>
        <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="ic-target">{t('target')}</Label>
          <select
            id="ic-target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="border-input bg-transparent flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3"
          >
            <option value={BASE_KEY}>{t('baseProduct')}</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ic-supplier">{t('supplier')}</Label>
          <Input
            id="ic-supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder={t('supplierPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ic-price">{t('purchasePrice')}</Label>
          <Input
            id="ic-price"
            type="number"
            step="0.01"
            min="0"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder={t('purchasePricePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ic-currency">{t('currency')}</Label>
          <Input
            id="ic-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ic-note">{t('note')}</Label>
        <Textarea
          id="ic-note"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('notePlaceholder')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {saving ? t('saving') : t('save')}
        </Button>
        {existingRow && (
          <Button type="button" size="sm" variant="ghost" onClick={handleClear} disabled={clearing}>
            {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4 text-destructive" />}
            {t('clear')}
          </Button>
        )}
        {saveState === 'success' && <span className="text-xs text-emerald-600">{t('savedSuccessfully')}</span>}
        {saveState === 'error' && <span className="text-xs text-destructive">{t('saveFailed')}</span>}
      </div>

      {/* Margin summary */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('sellingPrice')}</span>
          <span className="font-medium text-foreground">
            {currentSellingPrice !== null
              ? formatMoney(currentSellingPrice, locale, sellingCurrency)
              : t('notConfigured')}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('purchasePrice')}</span>
          <span className="font-medium text-foreground">
            {purchasePriceNum !== null && Number.isFinite(purchasePriceNum)
              ? formatMoney(purchasePriceNum, locale, currency)
              : t('notConfigured')}
          </span>
        </div>
        <div className="mt-2 border-t border-border pt-2">
          {margin.status === 'ok' ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('margin')}</span>
                <span className="font-semibold text-foreground">
                  {formatMoney(margin.amount, locale, sellingCurrency)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t('marginPercent')}</span>
                <span className="font-semibold text-foreground">{margin.percent.toFixed(2)} %</span>
              </div>
            </>
          ) : margin.status === 'currency_mismatch' ? (
            <p className="text-sm text-amber-600">{t('marginUnavailableCurrenciesDiffer')}</p>
          ) : margin.status === 'zero_selling_price' ? (
            <p className="text-sm text-amber-600">{t('marginUnavailableZeroPrice')}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t('notConfigured')}</p>
          )}
        </div>
      </div>

      {/* Partner discount margin preview */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="ic-discount">{t('discountPreview')}</Label>
          <Input
            id="ic-discount"
            type="number"
            step="1"
            min="0"
            max="100"
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value)}
            placeholder={t('discountPreviewPlaceholder')}
            className="max-w-[140px]"
          />
        </div>
        {discountPreview && (
          <div className="rounded-lg border border-border p-3 space-y-1.5">
            {discountPreview.status === 'ok' ? (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('partnerSalePrice')}</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(discountPreview.salePrice, locale, sellingCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('margin')}</span>
                  <span className="font-medium text-foreground">
                    {formatMoney(discountPreview.marginAmount, locale, sellingCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('marginPercent')}</span>
                  <span className="font-medium text-foreground">{discountPreview.marginPercent.toFixed(2)} %</span>
                </div>
              </>
            ) : discountPreview.status === 'currency_mismatch' ? (
              <p className="text-sm text-amber-600">{t('marginUnavailableCurrenciesDiffer')}</p>
            ) : discountPreview.status === 'zero_sale_price' ? (
              <p className="text-sm text-amber-600">{t('marginUnavailableZeroPrice')}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('notConfigured')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
