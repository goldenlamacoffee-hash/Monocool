import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { resolvePartnerContext } from '@/lib/partner-portal'
import { getLocalizedMarketName } from '@/lib/domain-utils'
import { ProfileClient } from '@/components/partner/profile-client'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [ctx, t] = await Promise.all([
    resolvePartnerContext(locale),
    getTranslations('partnerPortal'),
  ])

  const marketName = getLocalizedMarketName(ctx.market, locale)

  return (
    <div className="flex flex-col gap-5 pt-4 md:pt-0">
      <div>
        <h1 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
          {t('nav.profile')}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--mono-muted)]">{t('profile.subtitle')}</p>
      </div>
      <ProfileClient
        locale={locale}
        initial={{
          name: ctx.name,
          email: ctx.email,
          role: ctx.role,
          status: ctx.status,
          market: ctx.market,
          marketName,
          discountPercent: ctx.discountPercent,
          partnerTier: ctx.partnerTier,
          createdAt: ctx.createdAt,
          companyName: ctx.companyName ?? '',
          companyId: ctx.companyId ?? '',
          vatNumber: ctx.vatNumber ?? '',
          phone: ctx.phone ?? '',
          address: ctx.address ?? '',
          city: ctx.city ?? '',
          postalCode: ctx.postalCode ?? '',
          country: ctx.country ?? '',
        }}
      />
    </div>
  )
}
