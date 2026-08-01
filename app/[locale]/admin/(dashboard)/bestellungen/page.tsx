import { setRequestLocale } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { listOrders } from '@/app/actions/orders'
import { OrdersManager } from '@/components/admin/orders-manager'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function BestellungenPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const initialOrders = await listOrders()

  return <OrdersManager initialOrders={initialOrders} locale={locale} />
}
