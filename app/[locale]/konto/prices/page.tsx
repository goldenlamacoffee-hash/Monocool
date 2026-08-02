import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { requireApprovedContext } from '@/lib/partner-portal'
import { getMyPriceList } from '@/app/actions/partner-portal'
import { PriceListClient } from '@/components/partner/price-list-client'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function PricesPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // §5 — pending/rejected users are redirected to /konto by requireApprovedContext
  await requireApprovedContext(locale)

  const [priceList, t] = await Promise.all([
    getMyPriceList(locale),
    getTranslations('partnerPortal'),
  ])

  return (
    <div className="flex flex-col gap-5 pt-4 md:pt-0">
      <div>
        <h1 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
          {t('nav.prices')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--mono-muted)]">
          {t('prices.subtitle', { discount: priceList.discountPercent, currency: priceList.currency })}
        </p>
      </div>
      <PriceListClient
        products={priceList.products}
        discountPercent={priceList.discountPercent}
        currency={priceList.currency}
        vatRate={priceList.vatRate}
        locale={locale}
      />
    </div>
  )
}
