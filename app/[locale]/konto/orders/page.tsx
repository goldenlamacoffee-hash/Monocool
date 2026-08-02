import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { requireApprovedContext } from '@/lib/partner-portal'
import { getMyOrders } from '@/app/actions/partner-portal'
import { OrdersClient } from '@/components/partner/orders-client'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // §5 — pending/rejected users are redirected to /konto by requireApprovedContext
  await requireApprovedContext(locale)

  const [{ orders, currency }, t] = await Promise.all([
    getMyOrders(locale),
    getTranslations('partnerPortal'),
  ])

  return (
    <div className="flex flex-col gap-5 pt-4 md:pt-0">
      <div>
        <h1 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
          {t('nav.orders')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--mono-muted)]">{t('orders.subtitle')}</p>
      </div>
      <OrdersClient orders={orders} currency={currency} locale={locale} />
    </div>
  )
}
