'use client'

// app/[locale]/konto/error.tsx
// Partner-portal error boundary — shown when any konto/* route throws an
// unhandled exception. This component is a Next.js App Router error boundary:
// it MUST be a Client Component ('use client') and receive (error, reset) props.
//
// It matches the light partner-zone design. It does NOT expose stack traces,
// database details, or the error digest to the partner. The digest is logged
// to the browser console only (for support purposes — no sensitive data).
//
// Translations live in the partnerPortal.error i18n namespace.

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'

interface KontoErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function KontoError({ error, reset }: KontoErrorProps) {
  const locale = (useLocale() as Locale) ?? 'en'
  // useTranslations works in client error boundaries — next-intl provides the
  // locale context from the nearest IntlProvider which is set by the root layout.
  const t = useTranslations('partnerPortal.error')

  useEffect(() => {
    // Log digest to console only — never display to partner; never log error.message
    if (error.digest) {
      console.error(`[partner-portal] error boundary triggered — digest: ${error.digest}`)
    } else {
      console.error('[partner-portal] error boundary triggered — no digest')
    }
  }, [error])

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--mono-line)] bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-500" aria-hidden="true" />
        </div>
        <h2 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
          {t('title')}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--mono-muted)]">
          {t('description')}
        </p>
        {/* digest intentionally NOT shown to the partner — console only */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[color:var(--mono-steel)] bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--mono-navy)] shadow-sm transition-colors hover:bg-[color:var(--mono-ice)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t('retry')}
          </button>
          <Link
            href={`/${locale}/konto`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[color:var(--mono-navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[color:var(--mono-steel)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-navy)]"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            {t('dashboard')}
          </Link>
        </div>
      </div>
    </div>
  )
}
