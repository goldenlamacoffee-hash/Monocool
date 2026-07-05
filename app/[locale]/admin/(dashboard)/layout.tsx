import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { count, eq } from 'drizzle-orm'
import { getSessionWithRole } from '@/lib/auth-utils'
import { AdminShell } from '@/components/admin/admin-shell'
import { ButtonLink } from '@/components/button-link'
import { ShieldAlert } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: Locale }>
}

export default async function AdminDashboardLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { session, role } = await getSessionWithRole()
  const t = await getTranslations('admin')

  if (!session?.user) {
    redirect(`/${locale}/anmelden`)
  }

  if (role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--mono-deep)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[color:var(--mono-navy)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-red-300">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-white">{t('accessDenied')}</h1>
          <p className="mt-2 text-sm text-white/60">{t('adminOnly')}</p>
          <div className="mt-6">
            <ButtonLink href={`/${locale}`}>{t('backToHome')}</ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  const [pendingResult] = await db
    .select({ count: count() })
    .from(user)
    .where(eq(user.status, 'pending'))

  return (
    <AdminShell
      locale={locale}
      userName={session.user.name || session.user.email}
      userEmail={session.user.email}
      pendingCount={pendingResult?.count ?? 0}
    >
      {children}
    </AdminShell>
  )
}
