// --- Market -> default currency label (V1.4I.1) -----------------------------
// Pure, no DB/session access. Used only by the owner-only margin UI to label
// a product's selling currency for the currency-mismatch guard in
// lib/margin.ts. This is a display-label default only — it never invents a
// price, and it intentionally does not touch site_settings.currency or any
// VAT/partner-pricing code path (kept isolated on purpose, see PR notes).
export const MARKET_CURRENCY_DEFAULTS: Record<string, string> = {
  'monocool.sk': 'EUR',
  'monocool.at': 'EUR',
  'monocool.cz': 'CZK',
  'monocool.eu': 'EUR',
}

export function resolveMarketCurrency(rawCurrency: string | null | undefined, market: string): string {
  if (rawCurrency != null && rawCurrency.trim().length === 3) return rawCurrency.trim().toUpperCase()
  return MARKET_CURRENCY_DEFAULTS[market] ?? 'EUR'
}
