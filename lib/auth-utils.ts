import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'

export async function getSessionWithRole() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user) {
    return { session: null, role: null }
  }

  // Fetch user role from database since session may not include custom fields
  const [dbUser] = await db
    .select({ role: user.role, status: user.status })
    .from(user)
    .where(eq(user.id, session.user.id))

  return {
    session,
    role: dbUser?.role || 'user',
    status: dbUser?.status || 'pending',
  }
}

export async function requireAdmin() {
  const { session, role } = await getSessionWithRole()
  
  if (!session) {
    return { authorized: false, session: null, redirect: 'login' }
  }
  
  if (role !== 'admin') {
    return { authorized: false, session, redirect: 'denied' }
  }
  
  return { authorized: true, session, role }
}
