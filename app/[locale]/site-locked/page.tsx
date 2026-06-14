import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Lock } from 'lucide-react'
import { type Locale } from '@/i18n/config'
import { SiteGateForm } from '@/components/site-gate-form'

interface Props {
  params: Promise<{ locale: Locale }>
  searchParams: Promise<{ from?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'siteGate' })
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  }
}

export default async function SiteLockedPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const { from: fromParam } = await searchParams
  const from = fromParam && fromParam.startsWith('/') ? fromParam : `/${locale}`

  const t = await getTranslations({ locale, namespace: 'siteGate' })

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-6 text-center">
          <Image
            src="/logo.png"
            alt="MonoCool"
            width={180}
            height={54}
            className="h-12 w-auto"
            priority
          />

          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-6" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-balance text-xl font-semibold text-foreground">
              {t('heading')}
            </h1>
            <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
              {t('subheading')}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <SiteGateForm from={from} />
        </div>
      </div>
    </main>
  )
}
