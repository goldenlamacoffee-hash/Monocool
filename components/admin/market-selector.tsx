'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Globe } from 'lucide-react'
import { DOMAINS, getDomainFromLocale } from '@/lib/domain-utils'
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
}

/**
 * Lets an admin see and switch which market (domain) they are editing.
 * Each market maps 1:1 to a locale, so switching navigates the current
 * admin page to the matching locale prefix.
 */
export function AdminMarketSelector({ locale }: AdminMarketSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentDomain = getDomainFromLocale(locale)

  const handleChange = (nextLocale: Locale | null) => {
    if (!nextLocale || nextLocale === locale) return
    // Replace the leading locale segment in the current path
    const segments = pathname.split('/')
    segments[1] = nextLocale
    const nextPath = segments.join('/')
    startTransition(() => {
      router.push(nextPath)
    })
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Globe className="h-5 w-5" />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Aktiver Markt / Active market
        </span>
        <span className="text-sm font-semibold text-foreground">{currentDomain}</span>
      </div>
      <Select value={locale} onValueChange={handleChange} disabled={isPending}>
        <SelectTrigger className="w-[200px]" aria-label="Markt auswählen">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOMAINS.map((domain) => (
            <SelectItem key={domain.id} value={domain.locale}>
              {domain.name} ({domain.id})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
