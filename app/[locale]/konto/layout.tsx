import { setRequestLocale } from 'next-intl/server'
import { type Locale } from '@/i18n/config'
import { resolvePartnerContext } from '@/lib/partner-portal'
import { PartnerPortalShell } from '@/components/partner/partner-portal-shell'
import { Header } from '@/components/header'
import { getSiteSettingsByLocale } from '@/app/actions/site-settings'
import { PartnerAccountStatus } from '@/components/partner/partner-account-status'

interface KontoLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function KontoLayout({ children, params }: KontoLayoutProps) {
  const { locale: _locale } = await params
  const locale = _locale as Locale
  setRequestLocale(locale)

  // resolvePartnerContext redirects for: no session, admin, wrong market.
  // Returns a context for approved / pending / rejected partners.
  const ctx = await resolvePartnerContext(locale)

  const settings = await getSiteSettingsByLocale(locale)

  // Pending / Rejected → show status page (not portal content)
  if (ctx.status === 'pending' || ctx.status === 'rejected') {
    return (
      <div className="flex min-h-screen flex-col bg-[color:var(--mono-bg)]">
        <Header />
        <main className="flex flex-1 items-center justify-center p-6">
          <PartnerAccountStatus
            status={ctx.status}
            locale={locale}
            contactEmail={settings.email ?? settings.emailSupport ?? null}
          />
        </main>
      </div>
    )
  }

  // Approved partner — render portal shell
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--mono-bg)]">
      <Header />
      <PartnerPortalShell
        partnerName={ctx.name}
        companyName={ctx.companyName}
        market={ctx.market}
      >
        {children}
      </PartnerPortalShell>
    </div>
  )
}
