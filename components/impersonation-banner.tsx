'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { authClient } from '@/lib/auth-client'
import { UserRoundCheck, Loader2 } from 'lucide-react'

interface ImpersonationBannerProps {
  /** The name of the partner being impersonated */
  partnerName: string
  /** The company of the partner being impersonated */
  partnerCompany: string | null
  /** Current locale — used for navigation after stopping impersonation */
  locale: string
}

export function ImpersonationBanner({ partnerName, partnerCompany, locale }: ImpersonationBannerProps) {
  const t = useTranslations('impersonation')
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState<string | null>(null)

  const handleStop = async () => {
    if (stopping) return
    setStopping(true)
    setStopError(null)
    try {
      await authClient.admin.stopImpersonating()
      // Full document navigation so the restored admin session is loaded cleanly
      window.location.assign(`/${locale}/admin/benutzer`)
    } catch (err) {
      setStopError(err instanceof Error ? err.message : t('stopError'))
      setStopping(false)
    }
  }

  const label = partnerCompany
    ? t('bannerLabel', { name: partnerName, company: partnerCompany })
    : t('bannerLabelNoCompany', { name: partnerName })

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex flex-col gap-1 bg-amber-500 px-4 py-2 text-amber-950 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <UserRoundCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {stopError && (
          <span className="text-xs font-medium text-red-800" role="alert">{stopError}</span>
        )}
        <button
          onClick={handleStop}
          disabled={stopping}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-amber-950/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-amber-950/25 disabled:pointer-events-none disabled:opacity-60"
        >
          {stopping && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {t('stopButton')}
        </button>
      </div>
    </div>
  )
}
