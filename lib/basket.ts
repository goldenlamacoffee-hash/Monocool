// --- Basket types and localStorage helpers (V1.4G.2) -----------------------
// Pure, serializable types shared between server and client code.
// No DB or session access here.

export type BasketItem = {
  /** Discriminates items so add/remove/increment work correctly */
  key: string // `${productId}` or `${productId}_${variantId}`
  productId: number
  variantId?: number
  productName: string
  variantName?: string
  sku?: string
  quantity: number
  /** List price before partner discount, in EUR. Frozen at add-time. */
  baseUnitPrice: number
  /** Partner discount applied at add-time (0-100). Frozen at add-time. */
  discountPercent: number
  /** Final unit price after discount. Frozen at add-time. */
  finalUnitPrice: number
}

export type BasketItemInput = Omit<BasketItem, 'key' | 'quantity'>

export const BASKET_STORAGE_KEY = 'monocool_basket_v1'

export function makeBasketKey(productId: number, variantId?: number): string {
  return variantId != null ? `${productId}_${variantId}` : `${productId}`
}

export function loadBasketFromStorage(): BasketItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(BASKET_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as BasketItem[]
  } catch {
    return []
  }
}

export function saveBasketToStorage(items: BasketItem[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(BASKET_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage full or blocked — silently ignore
  }
}

export function clearBasketStorage(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(BASKET_STORAGE_KEY)
  } catch {
    // ignore
  }
}

/** Sum of (finalUnitPrice * quantity) for all items. */
export function computeBasketSubtotal(items: BasketItem[]): number {
  return items.reduce((acc, item) => acc + item.finalUnitPrice * item.quantity, 0)
}

/** Total item count (sum of quantities). */
export function computeBasketCount(items: BasketItem[]): number {
  return items.reduce((acc, item) => acc + item.quantity, 0)
}

// ---------------------------------------------------------------------------
// Display-only totals (V1.4J.3 hardening) ------------------------------------
// Mirrors placeOrder()'s exact rounding sequence (app/actions/orders.ts) so
// the basket drawer, full basket page, and checkout preview always match the
// server's persisted order to the cent. This module is DISPLAY ONLY:
// placeOrder() never receives these numbers and always re-derives prices,
// discount, VAT, and delivery independently from the database. Nothing here
// is sent to the server action.
// ---------------------------------------------------------------------------

/** Round to 2 decimal places using the same half-up cents rounding as the server. */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export interface BasketTotals {
  /** Sum of per-line rounded subtotals (product only, excl. delivery/VAT). */
  itemsSubtotal: number
  /** Sum of per-line rounded VAT (product only). */
  itemsVat: number
  /** NET delivery price, charged once per order. */
  deliveryNet: number
  /** VAT on the delivery price. */
  deliveryVat: number
  /** itemsVat + deliveryVat. */
  vatTotal: number
  /** itemsSubtotal + deliveryNet + vatTotal. */
  grandTotal: number
}

/**
 * Computes basket totals using the exact same per-line rounding sequence as
 * placeOrder(): each line's subtotal and VAT are rounded to 2 decimals
 * individually, THEN summed — never VAT-on-aggregate-subtotal. Delivery is
 * charged once, is not discounted, and is taxed at the same vatRate.
 */
export function computeBasketTotals({
  items,
  vatRate,
  deliveryPrice,
}: {
  items: BasketItem[]
  vatRate: number
  deliveryPrice: number
}): BasketTotals {
  let itemsSubtotal = 0
  let itemsVat = 0

  for (const item of items) {
    const lineSubtotal = roundMoney(item.finalUnitPrice * item.quantity)
    const lineVat = roundMoney(lineSubtotal * (vatRate / 100))
    itemsSubtotal += lineSubtotal
    itemsVat += lineVat
  }

  // itemsSubtotal/itemsVat are sums of already-rounded cents, so they are
  // exact to the cent — no further rounding needed here, matching the
  // server's `itemsSubtotal = resolvedItems.reduce(...)` step.
  const deliveryNet = deliveryPrice
  const deliveryVat = roundMoney(deliveryNet * (vatRate / 100))
  const vatTotal = itemsVat + deliveryVat
  const grandTotal = roundMoney(itemsSubtotal + deliveryNet + vatTotal)

  return { itemsSubtotal, itemsVat, deliveryNet, deliveryVat, vatTotal, grandTotal }
}
