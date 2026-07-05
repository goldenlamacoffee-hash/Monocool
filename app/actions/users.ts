'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, desc, count, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth-utils'
import { MIN_DISCOUNT, MAX_DISCOUNT } from '@/lib/pricing'

// Get all users (admin only)
export async function getUsers(status?: string) {
  await assertAdmin()
  
  const conditions = status && status !== 'all' ? eq(user.status, status) : undefined
  
  const users = await db
    .select()
    .from(user)
    .where(conditions)
    .orderBy(desc(user.createdAt))
  
  return users
}

// Get user by ID (admin only)
export async function getUserById(id: string) {
  await assertAdmin()
  
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  
  return foundUser
}

// Update user status (admin only)
export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  await assertAdmin()
  
  await db
    .update(user)
    .set({ status, updatedAt: new Date() })
    .where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Update user role (admin only)
export async function updateUserRole(id: string, role: 'user' | 'admin') {
  await assertAdmin()
  
  await db
    .update(user)
    .set({ role, updatedAt: new Date() })
    .where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Update user details (admin only)
export async function updateUser(id: string, data: {
  name?: string
  email?: string
  companyName?: string
  companyId?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
  notes?: string
}) {
  await assertAdmin()
  
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Update a partner account's B2B discount (admin only).
// Validates the percentage server-side (0-100) so a partner price can never be
// negative or exceed the base price, and never trusts a client-calculated value.
export async function updatePartnerDiscount(
  id: string,
  data: {
    discountPercent: number
    discountNote?: string | null
    partnerTier?: string | null
  },
) {
  await assertAdmin()

  const raw = Number(data.discountPercent)
  if (!Number.isFinite(raw)) {
    throw new Error('Discount must be a number')
  }
  if (raw < MIN_DISCOUNT || raw > MAX_DISCOUNT) {
    throw new Error(`Discount must be between ${MIN_DISCOUNT} and ${MAX_DISCOUNT}`)
  }
  // Round to 2 decimals to match the numeric(5,2) column.
  const discountPercent = Math.round(raw * 100) / 100

  await db
    .update(user)
    .set({
      discountPercent: discountPercent.toString(),
      discountNote: data.discountNote?.trim() || null,
      partnerTier: data.partnerTier?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, id))

  // Refresh admin + public product surfaces so the new partner price shows up.
  revalidatePath('/admin/benutzer')
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach((locale) => {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
  })

  return { success: true, discountPercent }
}

// Delete user (admin only)
export async function deleteUser(id: string) {
  await assertAdmin()
  
  await db.delete(user).where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Get user statistics (admin only)
export async function getUserStats() {
  await assertAdmin()
  
  const [totalUsers] = await db.select({ count: count() }).from(user)
  const [pendingUsers] = await db.select({ count: count() }).from(user).where(eq(user.status, 'pending'))
  const [approvedUsers] = await db.select({ count: count() }).from(user).where(eq(user.status, 'approved'))
  const [rejectedUsers] = await db.select({ count: count() }).from(user).where(eq(user.status, 'rejected'))
  
  return {
    total: totalUsers.count,
    pending: pendingUsers.count,
    approved: approvedUsers.count,
    rejected: rejectedUsers.count,
  }
}

// Update user profile (for logged in user)
export async function updateProfile(data: {
  companyName?: string
  companyId?: string
  vatNumber?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  phone?: string
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, session.user.id))
  
  return { success: true }
}
