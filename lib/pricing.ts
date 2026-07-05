// --- B2B partner pricing helpers (V1.4B) -----------------------------------
// Pure, serializable helpers shared between server and client. No DB or
// session access here — see lib/partner-pricing.ts for the server resolver.

export const MIN_DISCOUNT = 0
export const MAX_DISCOUNT = 100

/**
 * Coerce any incoming discount value (string from a numeric DB column, number,
 * null, NaN, out-of-range) into a safe percentage between 0 and 100.
 */
export function normalizeDiscountPercent(value: unknown): number {
  const n =
    typeof value === 'string'
      ? parseFloat(value)
      : typeof value === 'number'
        ? value
        : NaN
  if (!Number.isFinite(n)) return 0
  return Math.min(MAX_DISCOUNT, Math.max(MIN_DISCOUNT, n))
}

/**
 * Parse a base/list price (decimal columns come back as strings in Drizzle)
 * into a number, or null when there is no usable price.
 */
export function parseBasePrice(price: string | number | null | undefined): number | null {
  if (price === null || price === undefined || price === '') return null
  const n = typeof price === 'string' ? parseFloat(price) : price
  return Number.isFinite(n) ? n : null
}

/**
 * Final partner price = base * (1 - discount/100), rounded to 2 decimals and
 * never negative.
 */
export function computePartnerPrice(basePrice: number, discountPercent: number): number {
  const d = normalizeDiscountPercent(discountPercent)
  const final = basePrice * (1 - d / 100)
  return Math.max(0, Math.round(final * 100) / 100)
}

/** Format a numeric price as a localized string with the EUR suffix. */
export function formatPrice(value: number, locale: string): string {
  return `${value.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} EUR`
}

// --- View models -----------------------------------------------------------

export type PartnerViewerState = 'guest' | 'pending' | 'approved'

/**
 * Serializable per-product pricing view passed from server components down to
 * (client) presentational components. Discounted / final prices are only ever
 * populated for the `approved` state, so no partner price can leak to public
 * or unapproved viewers through props.
 */
export type ProductPriceView =
  | { state: 'guest' }
  | { state: 'pending' }
  | {
      state: 'approved'
      discountPercent: number
      listPrice: number | null
      finalPrice: number | null
    }

/**
 * Build the per-product pricing view for a given viewer. Pure function so it
 * can be unit-reasoned about and reused anywhere.
 */
export function resolveProductPriceView(
  basePrice: string | number | null | undefined,
  viewer: { state: PartnerViewerState; discountPercent?: number },
): ProductPriceView {
  if (viewer.state === 'guest') return { state: 'guest' }
  if (viewer.state === 'pending') return { state: 'pending' }

  const discountPercent = normalizeDiscountPercent(viewer.discountPercent ?? 0)
  const listPrice = parseBasePrice(basePrice)
  const finalPrice = listPrice === null ? null : computePartnerPrice(listPrice, discountPercent)
  return { state: 'approved', discountPercent, listPrice, finalPrice }
}
