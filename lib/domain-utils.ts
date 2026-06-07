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
