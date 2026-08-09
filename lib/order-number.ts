// --- B2B sequential order numbering (V1.4J.1) -------------------------------
// Pure, side-effect-free helpers. No DB or session access here — the atomic
// sequence allocation lives in app/actions/orders.ts (placeOrder), inside the
// same DB transaction as the order INSERT.
//
// Format:  MC-{MARKET_2CHAR}-{YYYYMM}-{SEQUENCE}
// Example: MC-SK-202608-0115
//
// The sequence is zero-padded to a MINIMUM of 4 digits and is never
// truncated above 9999 (e.g. 10000 stays "10000").

import { DOMAINS, isValidMarket } from '@/lib/domain-utils'

const MIN_SEQUENCE_DIGITS = 4

/** Map a market domain (e.g. "monocool.sk") to its 2-letter order-number code. */
export function getMarketCode(market: string): string {
  if (!isValidMarket(market)) {
    throw new Error(`Unknown market: ${market}`)
  }
  // monocool.sk -> SK, monocool.at -> AT, monocool.cz -> CZ, monocool.eu -> EU
  const suffix = market.split('.').pop() ?? ''
  return suffix.toUpperCase().slice(0, 2)
}

/** Format a sequence number with a minimum 4-digit zero-padded width. */
export function padSequence(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error(`Invalid order sequence: ${sequence}`)
  }
  return String(sequence).padStart(MIN_SEQUENCE_DIGITS, '0')
}

export type FormatOrderNumberInput = {
  market: string
  date: Date
  sequence: number
}

/**
 * Build the full order number: MC-{MARKET}-{YYYYMM}-{SEQUENCE}.
 * `sequence` must be the already-allocated integer (from the atomic
 * site_settings.nextOrderNumber counter) — this function performs no
 * allocation itself.
 */
export function formatOrderNumber({ market, date, sequence }: FormatOrderNumberInput): string {
  const marketCode = getMarketCode(market)
  const yyyymm = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`
  return `MC-${marketCode}-${yyyymm}-${padSequence(sequence)}`
}

// Re-exported for convenience / tests — all currently supported markets.
export const SUPPORTED_MARKETS = DOMAINS.map((d) => d.id)
