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
