import { redirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type Locale } from '@/i18n/config'
import { UserManagementClient } from './user-management-client'
import { getSessionWithRole } from '@/lib/auth-utils'

interface Props {
  params: Promise<{ locale: Locale }>
}

async function getUsers() {
  return await db
    .select()
    .from(user)
    .orderBy(desc(user.createdAt))
}

export default async function UsersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('admin')
  const { session, role } = await getSessionWithRole()

  if (!session?.user) {
    redirect(`/${locale}/anmelden`)
  }

  if (role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">{t('accessDenied')}</CardTitle>
              <CardDescription>{t('adminOnly')}</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  const users = await getUsers()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <UserManagementClient initialUsers={users} locale={locale} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
