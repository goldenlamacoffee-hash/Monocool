// --- Owner-only margin calculation helpers (V1.4I.1) ------------------------
// Pure, serializable functions. No DB or session access here, so this module
// is safe to import from both server actions and the owner-only client
// component. Never import anything from here into a public/partner code path
// — margin math is meaningless (and confidential) outside the owner UI.
//
// Discount-preview math reuses lib/pricing.ts's computePartnerPrice /
// normalizeDiscountPercent so the preview always matches the real, live
// partner-pricing calculation. This module never mutates partner pricing —
// it is display/calculation only.

import { computePartnerPrice, normalizeDiscountPercent } from '@/lib/pricing'

export type MarginResult =
  | { status: 'missing_selling_price' }
  | { status: 'missing_purchase_price' }
  | { status: 'currency_mismatch'; sellingCurrency: string; purchaseCurrency: string }
  | { status: 'zero_selling_price' }
  | { status: 'ok'; amount: number; percent: number }

/**
 * gross margin amount    = sellingPrice - purchasePrice
 * gross margin percentage = (sellingPrice - purchasePrice) / sellingPrice * 100
 *
 * Handles missing prices, a zero selling price (no division by zero), and
 * differing currencies safely. Currencies are compared case-insensitively
 * after trimming; on a mismatch NO automatic FX conversion is performed —
 * the caller must render a localized "margin unavailable" message instead.
 */
export function computeMargin(
  sellingPrice: number | null | undefined,
  purchasePrice: number | null | undefined,
  sellingCurrency: string | null | undefined,
  purchaseCurrency: string | null | undefined,
): MarginResult {
  if (purchasePrice === null || purchasePrice === undefined || !Number.isFinite(purchasePrice)) {
    return { status: 'missing_purchase_price' }
  }
  if (sellingPrice === null || sellingPrice === undefined || !Number.isFinite(sellingPrice)) {
    return { status: 'missing_selling_price' }
  }

  const sCur = (sellingCurrency || 'EUR').trim().toUpperCase()
  const pCur = (purchaseCurrency || 'EUR').trim().toUpperCase()
  if (sCur !== pCur) {
    return { status: 'currency_mismatch', sellingCurrency: sCur, purchaseCurrency: pCur }
  }

  if (sellingPrice === 0) return { status: 'zero_selling_price' }

  const amount = Math.round((sellingPrice - purchasePrice) * 100) / 100
  const percent = Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100 * 100) / 100
  return { status: 'ok', amount, percent }
}

export type DiscountPreviewResult =
  | { status: 'missing_selling_price' }
  | { status: 'missing_purchase_price' }
  | { status: 'currency_mismatch'; sellingCurrency: string; purchaseCurrency: string }
  | { status: 'zero_sale_price' }
  | { status: 'ok'; salePrice: number; marginAmount: number; marginPercent: number }

/**
 * Preview-only: what margin would remain if a partner received `discountPercent`
 * off the list price. Uses the exact same rounding/clamping as live partner
 * pricing (computePartnerPrice) so this number can never drift from what a
 * real partner account would actually be charged. Never saves or modifies
 * any partner account — pure calculation.
 */
export function computeDiscountPreview(
  listPrice: number | null | undefined,
  purchasePrice: number | null | undefined,
  discountPercent: number,
  sellingCurrency: string | null | undefined,
  purchaseCurrency: string | null | undefined,
): DiscountPreviewResult {
  if (purchasePrice === null || purchasePrice === undefined || !Number.isFinite(purchasePrice)) {
    return { status: 'missing_purchase_price' }
  }
  if (listPrice === null || listPrice === undefined || !Number.isFinite(listPrice)) {
    return { status: 'missing_selling_price' }
  }

  const sCur = (sellingCurrency || 'EUR').trim().toUpperCase()
  const pCur = (purchaseCurrency || 'EUR').trim().toUpperCase()
  if (sCur !== pCur) {
    return { status: 'currency_mismatch', sellingCurrency: sCur, purchaseCurrency: pCur }
  }

  const d = normalizeDiscountPercent(discountPercent)
  const salePrice = computePartnerPrice(listPrice, d)
  if (salePrice === 0) return { status: 'zero_sale_price' }

  const marginAmount = Math.round((salePrice - purchasePrice) * 100) / 100
  const marginPercent = Math.round(((salePrice - purchasePrice) / salePrice) * 100 * 100) / 100
  return { status: 'ok', salePrice, marginAmount, marginPercent }
}
