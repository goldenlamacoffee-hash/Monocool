'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertTriangle, X } from 'lucide-react'
import { signOut } from '@/lib/auth-client'

/**
 * Top-of-page notice shown when the server has invalidated a session because
 * the account belongs to a different market (see `enforceMarketSession`).
 *
 * The server has already deleted the session row; this component additionally
 * clears the stale client session + cookie once on mount so the header
 * immediately reflects the logged-out state. It deliberately does NOT refresh
 * the route, so this message stays visible on the current page.
 */
export function WrongMarketNotice() {
  const t = useTranslations('auth')
  const [dismissed, setDismissed] = useState(false)
  const cleared = useRef(false)

  useEffect(() => {
    if (cleared.current) return
    cleared.current = true
    // Fire-and-forget: sync the client session state with the server logout.
    signOut().catch(() => {})
  }, [])

  if (dismissed) return null

  return (
    <div role="alert" className="border-b border-destructive/30 bg-destructive/10">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium text-destructive text-pretty">
          {t('wrongMarketSession')}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-destructive/80 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
          aria-label={t('dismiss')}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
