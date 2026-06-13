import { ExternalLink, Globe } from 'lucide-react'
import { getDomainFromLocale, getMarketName, getPreviewUrl } from '@/lib/domain-utils'
import { type Locale } from '@/i18n/config'

interface MarketBannerProps {
  locale: Locale
  /** Optional public path (without locale prefix) to link a live preview, e.g. "produkte". */
  previewPath?: string
  /** Optional label override for the preview link. */
  previewLabel?: string
}

/**
 * Compact, read-only banner that makes the currently edited market explicit
 * across admin screens, and links to the matching public page so editors can
 * verify their changes on the correct domain.
 */
export function MarketBanner({ locale, previewPath = '', previewLabel }: MarketBannerProps) {
  const domain = getDomainFromLocale(locale)
  const marketName = getMarketName(domain)
  const previewUrl = getPreviewUrl(domain, previewPath)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Aktiver Markt / Active market
          </span>
          <span className="text-sm font-semibold text-foreground">
            {marketName} &middot; {domain} &middot; <span className="uppercase">{locale}</span>
          </span>
        </div>
      </div>
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
      >
        <ExternalLink className="h-4 w-4" />
        {previewLabel ?? 'Öffentliche Seite ansehen / View public page'}
      </a>
    </div>
  )
}
