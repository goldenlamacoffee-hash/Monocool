// Domain mapping utilities for multi-domain support

export function getDomainFromLocale(locale: string): string {
  switch (locale) {
    case 'sk': return 'monocool.sk'
    case 'cs': return 'monocool.cz'
    case 'en': return 'monocool.eu'
    case 'de':
    default: return 'monocool.at'
  }
}

export function getLocaleFromDomain(domain: string): string {
  switch (domain) {
    case 'monocool.sk': return 'sk'
    case 'monocool.cz': return 'cs'
    case 'monocool.eu': return 'en'
    case 'monocool.at':
    default: return 'de'
  }
}

export const DOMAINS = [
  { id: 'monocool.at', name: 'Österreich', locale: 'de' },
  { id: 'monocool.sk', name: 'Slovensko', locale: 'sk' },
  { id: 'monocool.cz', name: 'Česká republika', locale: 'cs' },
  { id: 'monocool.eu', name: 'European Union', locale: 'en' },
] as const

// Human-readable market name for a given domain (native/default label).
export function getMarketName(domain: string): string {
  return DOMAINS.find((d) => d.id === domain)?.name ?? domain
}

/**
 * Market (country) names translated into each admin UI locale.
 * Outer key = the admin's current locale (the language they read the UI in).
 * Inner key = the market domain being labelled.
 * This is what makes the market selector/banner show e.g. "Rakúsko" for a
 * Slovak admin instead of the hardcoded native "Österreich".
 */
const MARKET_NAMES: Record<string, Record<string, string>> = {
  de: {
    'monocool.at': 'Österreich',
    'monocool.sk': 'Slowakei',
    'monocool.cz': 'Tschechien',
    'monocool.eu': 'Europäische Union',
  },
  en: {
    'monocool.at': 'Austria',
    'monocool.sk': 'Slovakia',
    'monocool.cz': 'Czech Republic',
    'monocool.eu': 'European Union',
  },
  sk: {
    'monocool.at': 'Rakúsko',
    'monocool.sk': 'Slovensko',
    'monocool.cz': 'Česká republika',
    'monocool.eu': 'Európska únia',
  },
  cs: {
    'monocool.at': 'Rakousko',
    'monocool.sk': 'Slovensko',
    'monocool.cz': 'Česká republika',
    'monocool.eu': 'Evropská unie',
  },
}

/**
 * Market name localized to the current admin locale.
 * Falls back to the native default name, then the raw domain, so it is always
 * safe even for unknown locales/domains.
 */
export function getLocalizedMarketName(domain: string, adminLocale: string): string {
  return MARKET_NAMES[adminLocale]?.[domain] ?? getMarketName(domain)
}

// Absolute base URL (production hostname) for a given domain
export function getMarketBaseUrl(domain: string): string {
  return `https://${domain}`
}

// Build a public-facing preview URL for an admin-managed resource.
// Returns the locale-prefixed path on the correct market hostname.
export function getPreviewUrl(domain: string, path = ''): string {
  const locale = getLocaleFromDomain(domain)
  const normalized = path ? `/${path.replace(/^\/+/, '')}` : ''
  return `${getMarketBaseUrl(domain)}/${locale}${normalized}`
}

/**
 * Build a Next.js Metadata object from optional SEO fields with safe fallbacks.
 * - Falls back to the provided title/description when SEO fields are empty.
 * - Only emits an openGraph.images entry when an ogImage is actually present.
 */
export function buildSeoMetadata(opts: {
  domain: string
  seoTitle?: string | null
  seoDescription?: string | null
  ogImage?: string | null
  fallbackTitle: string
  fallbackDescription?: string | null
  path?: string
}) {
  const title = opts.seoTitle?.trim() || opts.fallbackTitle
  const description = opts.seoDescription?.trim() || opts.fallbackDescription?.trim() || undefined
  const url = getPreviewUrl(opts.domain, opts.path)
  const ogImage = opts.ogImage?.trim()

  const metadata: {
    title: string
    description?: string
    alternates: { canonical: string }
    openGraph: {
      title: string
      description?: string
      url: string
      siteName: string
      images?: { url: string }[]
    }
  } = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Monocool',
    },
  }

  if (ogImage) {
    metadata.openGraph.images = [{ url: ogImage }]
  }

  return metadata
}

