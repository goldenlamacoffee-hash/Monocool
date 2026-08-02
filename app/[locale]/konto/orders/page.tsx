import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { resolveApprovedContext } from '@/lib/partner-portal'
import { getMyOrders } from '@/app/actions/partner-portal'
import { OrdersClient } from '@/components/partner/orders-client'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function OrdersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Pending/rejected: return null — layout renders the status card; no data query runs.
  const ctx = await resolveApprovedContext(locale)
  if (!ctx) return null

  const [{ orders, marketCurrency }, t] = await Promise.all([
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
      <OrdersClient orders={orders} marketCurrency={marketCurrency} locale={locale} />
    </div>
  )
}
