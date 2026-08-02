'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Globe } from 'lucide-react'
import { DOMAINS, getDomainFromLocale, getLocalizedMarketName } from '@/lib/domain-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type Locale } from '@/i18n/config'

interface AdminMarketSelectorProps {
  locale: Locale
  /**
   * "card" (default): full bordered card used inside content areas.
   * "compact": slim control designed for the dark admin top bar.
   */
  variant?: 'card' | 'compact'
}

/**
 * Lets an admin see and switch which market (domain) they are editing.
 * Each market maps 1:1 to a locale, so switching navigates the current
 * admin page to the matching locale prefix.
 */
export function AdminMarketSelector({ locale, variant = 'card' }: AdminMarketSelectorProps) {
  const t = useTranslations('admin.market')
  const pathname = usePathname()

  const currentDomain = getDomainFromLocale(locale)

  const handleChange = (nextLocale: Locale | null) => {
    if (!nextLocale || nextLocale === locale) return
    // Replace the leading locale segment in the current path and perform a
    // full document navigation so stale App Router bundles are never used.
    const segments = pathname.split('/')
    segments[1] = nextLocale
    const nextPath = segments.join('/')
    window.location.assign(nextPath)
  }

  if (variant === 'compact') {
    return (
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger
          aria-label={t('selectMarket')}
          className="h-9 w-full gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white/30 data-[placeholder]:text-white/70 sm:w-[210px] [&_svg]:text-white/70"
        >
          <Globe className="h-4 w-4 shrink-0 text-[color:var(--mono-ice)]" />
          <span className="truncate text-left text-xs">
            <span className="text-white/50">{t('activeMarket')}: </span>
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {DOMAINS.map((domain) => (
            <SelectItem key={domain.id} value={domain.locale}>
              {getLocalizedMarketName(domain.id, locale)} ({domain.id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Globe className="h-5 w-5" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('activeMarket')}
        </span>
        <span className="text-sm font-semibold text-foreground">{currentDomain}</span>
      </div>
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger className="w-[200px]" aria-label={t('selectMarket')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOMAINS.map((domain) => (
            <SelectItem key={domain.id} value={domain.locale}>
              {getLocalizedMarketName(domain.id, locale)} ({domain.id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
