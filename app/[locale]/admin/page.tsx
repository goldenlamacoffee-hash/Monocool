import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user, product, order } from '@/lib/db/schema'
import { eq, count, sql } from 'drizzle-orm'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ButtonLink } from '@/components/button-link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, FileText, Users, ShoppingCart, TrendingUp, Clock, Phone } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

async function getStats() {
  const [totalUsersResult] = await db.select({ count: count() }).from(user)
  const [pendingUsersResult] = await db.select({ count: count() }).from(user).where(eq(user.status, 'pending'))
  const [approvedUsersResult] = await db.select({ count: count() }).from(user).where(eq(user.status, 'approved'))
  const [totalProductsResult] = await db.select({ count: count() }).from(product)
  const [totalOrdersResult] = await db.select({ count: count() }).from(order)
  
  // Calculate total revenue
  const [revenueResult] = await db
    .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
    .from(order)
    .where(eq(order.status, 'delivered'))
  
  return {
    totalUsers: totalUsersResult.count,
    pendingUsers: pendingUsersResult.count,
    approvedUsers: approvedUsersResult.count,
    totalProducts: totalProductsResult.count,
    totalOrders: totalOrdersResult.count,
    revenue: parseFloat(revenueResult.total) || 0,
  }
}

export default async function AdminPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('admin')
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session?.user) {
    redirect(`/${locale}/anmelden`)
  }

  // Fetch user role from database since session may not include it
  const [dbUser] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id))
  const userRole = dbUser?.role || 'user'

  if (userRole !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">{t('accessDenied')}</CardTitle>
              <CardDescription>{t('adminOnly')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ButtonLink href={`/${locale}`}>
                {t('backToHome')}
              </ButtonLink>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const stats = await getStats()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('welcome')}, {session.user.name}!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.totalUsers')}
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingUsers} {t('stats.pendingApproval').toLowerCase()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.approvedUsers')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approvedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((stats.approvedUsers / Math.max(stats.totalUsers, 1)) * 100)}{t('stats.approved')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.totalProducts')}
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.activeProducts')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('stats.totalOrders')}
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.totalOrders')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <h2 className="mb-4 text-lg font-semibold text-foreground">{t('quickActions')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <Users className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">{t('users')}</CardTitle>
                <CardDescription>{t('usersDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {stats.pendingUsers > 0 && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                      <Clock className="mr-1 h-3 w-3" />
                      {stats.pendingUsers} {t('stats.pending')}
                    </span>
                  )}
                </div>
                <ButtonLink href={`/${locale}/admin/benutzer`} className="mt-4 w-full">
                  {t('users')}
                </ButtonLink>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <Package className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">{t('products')}</CardTitle>
                <CardDescription>{t('productsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonLink href={`/${locale}/admin/produkte`} className="w-full">
                  {t('products')}
                </ButtonLink>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <ShoppingCart className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">{t('orders')}</CardTitle>
                <CardDescription>{t('ordersDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonLink href={`/${locale}/admin/bestellungen`} className="w-full">
                  {t('orders')}
                </ButtonLink>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">{t('cms')}</CardTitle>
                <CardDescription>{t('cmsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonLink href={`/${locale}/admin/cms`} className="w-full">
                  {t('cms')}
                </ButtonLink>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <Phone className="h-8 w-8 text-primary" />
                <CardTitle className="mt-4">{locale === 'sk' ? 'Kontakty' : locale === 'cs' ? 'Kontakty' : 'Kontakte'}</CardTitle>
                <CardDescription>{locale === 'sk' ? 'Spravovať kontaktné údaje' : locale === 'cs' ? 'Spravovat kontaktní údaje' : 'Kontaktdaten verwalten'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ButtonLink href={`/${locale}/admin/kontakt`} className="w-full">
                  {locale === 'sk' ? 'Kontakty' : locale === 'cs' ? 'Kontakty' : 'Kontakte'}
                </ButtonLink>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
