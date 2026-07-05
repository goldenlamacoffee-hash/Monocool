import { setRequestLocale } from 'next-intl/server'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
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

  const users = await getUsers()

  return <UserManagementClient initialUsers={users} locale={locale} />
}
