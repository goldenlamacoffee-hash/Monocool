import { getTranslations, setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { user, product, siteSettings } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import { getSessionWithRole } from '@/lib/auth-utils'
import { getDomainFromLocale, getLocalizedMarketName, getPreviewUrl } from '@/lib/domain-utils'
import { type Locale } from '@/i18n/config'
import { DashboardCards } from '@/components/admin/dashboard-cards'

interface Props {
  params: Promise<{ locale: Locale }>
}

async function getStats(domain: string) {
  const [totalUsers] = await db.select({ count: count() }).from(user)
  const [pendingUsers] = await db.select({ count: count() }).from(user).where(eq(user.status, 'pending'))
  const [approvedUsers] = await db.select({ count: count() }).from(user).where(eq(user.status, 'approved'))
  const [totalProducts] = await db.select({ count: count() }).from(product).where(eq(product.domain, domain))
  const [activeProducts] = await db
    .select({ count: count() })
    .from(product)
    .where(and(eq(product.domain, domain), eq(product.isActive, true)))
  const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.domain, domain))

  const missingContact = !settings || (!settings.phone?.trim() && !settings.email?.trim())
  const missingSeo = !settings || (!settings.seoTitle?.trim() && !settings.seoDescription?.trim())

  return {
    totalUsers: totalUsers?.count ?? 0,
    pendingUsers: pendingUsers?.count ?? 0,
    approvedUsers: approvedUsers?.count ?? 0,
    totalProducts: totalProducts?.count ?? 0,
    activeProducts: activeProducts?.count ?? 0,
    missingContact,
    missingSeo,
  }
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('admin')
  const { session } = await getSessionWithRole()

  const domain = getDomainFromLocale(locale)
  const stats = await getStats(domain)

  return (
    <DashboardCards
      locale={locale}
      userName={session?.user.name ?? ''}
      marketName={getLocalizedMarketName(domain, locale)}
      domain={domain}
      previewUrl={getPreviewUrl(domain)}
      stats={stats}
      labels={{
        welcome: t('welcome'),
        overview: t('dashboard.overview'),
        totalProducts: t('stats.totalProducts'),
        activeProducts: t('stats.activeProducts'),
        totalUsers: t('stats.totalUsers'),
        approvedUsers: t('stats.approvedUsers'),
        pendingApproval: t('stats.pendingApproval'),
        pendingPartners: t('dashboard.pendingPartners'),
        allActive: t('dashboard.allActive'),
        quickActions: t('quickActions'),
        addProduct: t('dashboard.addProduct'),
        manageProducts: t('products'),
        managePartners: t('users'),
        editContact: t('dashboard.editContact'),
        viewSite: t('nav.backToSite'),
        missingContactTitle: t('dashboard.missingContactTitle'),
        missingContactDesc: t('dashboard.missingContactDesc'),
        missingSeoTitle: t('dashboard.missingSeoTitle'),
        missingSeoDesc: t('dashboard.missingSeoDesc'),
        needsAttention: t('dashboard.needsAttention'),
        activeMarket: t('market.activeMarket'),
      }}
    />
  )
}
