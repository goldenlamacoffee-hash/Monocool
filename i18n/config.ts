export const locales = ['de', 'cs', 'sk', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'de'

export const localeNames: Record<Locale, string> = {
  de: 'Deutsch',
  cs: 'Čeština',
  sk: 'Slovenčina',
  en: 'English'
}

export const localeFlags: Record<Locale, string> = {
  de: '🇦🇹',
  cs: '🇨🇿',
  sk: '🇸🇰',
  en: '🇪🇺'
}

export const localeCountries: Record<Locale, string> = {
  de: 'Österreich',
  cs: 'Česká republika',
  sk: 'Slovensko',
  en: 'European Union'
}

// Domain to locale mapping
export const domainLocales: Record<string, Locale> = {
  'monocool.at': 'de',
  'monocool.cz': 'cs',
  'monocool.sk': 'sk',
  'monocool.eu': 'en',
  // Include www variants
  'www.monocool.at': 'de',
  'www.monocool.cz': 'cs',
  'www.monocool.sk': 'sk',
  'www.monocool.eu': 'en',
}

// Locale to domain mapping (for language switching)
export const localeDomains: Record<Locale, string> = {
  de: 'monocool.at',
  cs: 'monocool.cz',
  sk: 'monocool.sk',
  en: 'monocool.eu',
}

// Get the domain for a locale (with protocol)
export function getDomainUrl(locale: Locale, path: string = ''): string {
  const domain = localeDomains[locale]
  // Remove locale prefix from path since domain determines locale
  const cleanPath = path.replace(/^\/(de|cs|sk|en)/, '') || '/'
  return `https://${domain}${cleanPath}`
}
