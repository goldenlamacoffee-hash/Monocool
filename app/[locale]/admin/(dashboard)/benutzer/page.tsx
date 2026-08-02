import { setRequestLocale } from 'next-intl/server'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { type Locale } from '@/i18n/config'
import { UserManagementClient } from './user-management-client'

interface Props {
  params: Promise<{ locale: Locale }>
}

async function getUsers() {
  return await db.select().from(user).orderBy(desc(user.createdAt))
}

export default async function UsersPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const [users, session] = await Promise.all([
    getUsers(),
    auth.api.getSession({ headers: await headers() }),
  ])

  const currentUserId = session?.user?.id ?? ''

  return <UserManagementClient initialUsers={users} locale={locale} currentUserId={currentUserId} />
}
