'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ShieldAlert } from 'lucide-react'

/**
 * Error boundary for the admin dashboard subtree.
 *
 * Converts a transient server render failure (e.g. a momentary DB hiccup during
 * the session/role/pending-count lookups) into a recoverable, localized screen
 * with a retry button, instead of a hard navigation failure.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('admin')

  useEffect(() => {
    console.log('[v0] admin error boundary:', error?.message, error?.digest)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--mono-deep)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[color:var(--mono-navy)] p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-300">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="font-heading text-xl font-semibold text-white">{t('errorTitle')}</h1>
        <p className="mt-2 text-sm text-white/60">{t('errorDescription')}</p>
        <div className="mt-6">
          <Button onClick={() => reset()}>{t('tryAgain')}</Button>
        </div>
      </div>
    </div>
  )
}
