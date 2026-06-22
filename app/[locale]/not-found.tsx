'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

export default function LocaleNotFound() {
  const t = useTranslations('notFound')
  const locale = useLocale()

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-heading text-7xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">{t('heading')}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t('description')}</p>
      <Link
        href={`/${locale}`}
        className="mt-8 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t('button')}
      </Link>
    </div>
  )
}
