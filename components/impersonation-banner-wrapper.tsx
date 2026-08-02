import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { ImpersonationBanner } from '@/components/impersonation-banner'

interface Props {
  locale: string
}

/**
 * Server component — reads the current session server-side and renders the
 * ImpersonationBanner client component only when the session is an active
 * impersonation session (session.impersonatedBy is set).
 *
 * Must NOT be rendered inside the admin shell (admins don't see the banner
 * while impersonating — the banner is for public partner pages only).
 */
export async function ImpersonationBannerWrapper({ locale }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })

  // Not logged in or not an impersonation session — nothing to render
  if (!session?.session?.impersonatedBy) return null

  const partnerName = session.user.name ?? session.user.email
  const partnerCompany = (session.user as { companyName?: string | null }).companyName ?? null

  return (
    <ImpersonationBanner
      partnerName={partnerName}
      partnerCompany={partnerCompany}
      locale={locale}
    />
  )
}
