import { notFound, redirect } from 'next/navigation'
import { setRequestLocale, getTranslations } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { OrderConfirmationClient } from '@/components/order-confirmation-client'
import { getOrderByNumber } from '@/app/actions/orders'
import type { OrderData } from '@/components/order-confirmation-client'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { getRequestSession } from '@/lib/auth-utils'
import { type Locale } from '@/i18n/config'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: Promise<{ locale: Locale; orderNumber: string }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })
  return { title: t('pageTitle') }
}

export default async function OrderConfirmationPage({ params }: Props) {
  const { locale, orderNumber } = await params
  setRequestLocale(locale)

  const session = await getRequestSession()
  if (!session?.user) {
    redirect(`/${locale}/anmelden`)
  }

  let order: OrderData | null = null
  try {
    const raw = await getOrderByNumber(orderNumber)
    order = raw as unknown as OrderData
  } catch {
    redirect(`/${locale}`)
  }

  if (!order) notFound()

  const t = await getTranslations({ locale, namespace: 'orderConfirmation' })
  const siteSettings = await getSiteSettingsByLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Success header */}
          <div className="flex flex-col items-center gap-4 text-center mb-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/15">
              <CheckCircle2 className="h-9 w-9 text-secondary" aria-hidden="true" />
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
              {t('heading')}
            </h1>
            <p className="text-muted-foreground max-w-md text-balance">
              {t('subheading')}
            </p>
            <div className="rounded-xl border border-border bg-card px-6 py-3 mt-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                {t('orderNumberLabel')}
              </p>
              <p className="font-mono text-xl font-bold text-primary tracking-wider">
                {String(order.orderNumber)}
              </p>
            </div>
          </div>

          {/* Order details */}
          <OrderConfirmationClient order={order} locale={locale} />

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/${locale}/produkte`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
            >
              {t('continueShoppingCta')}
            </Link>
          </div>
        </div>
      </main>
      <Footer
        contactInfo={{
          email: siteSettings.email,
          phone: siteSettings.phone,
          city: siteSettings.city,
          country: siteSettings.country,
        }}
      />
    </div>
  )
}
