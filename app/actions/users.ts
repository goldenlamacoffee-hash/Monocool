'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, desc, count, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// Helper to check if user is admin
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session.user
}

// Get all users (admin only)
export async function getUsers(status?: string) {
  await requireAdmin()
  
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
  await requireAdmin()
  
  const [foundUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1)
  
  return foundUser
}

// Update user status (admin only)
export async function updateUserStatus(id: string, status: 'pending' | 'approved' | 'rejected') {
  await requireAdmin()
  
  await db
    .update(user)
    .set({ status, updatedAt: new Date() })
    .where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Update user role (admin only)
export async function updateUserRole(id: string, role: 'user' | 'admin') {
  await requireAdmin()
  
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
  await requireAdmin()
  
  await db
    .update(user)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Delete user (admin only)
export async function deleteUser(id: string) {
  await requireAdmin()
  
  await db.delete(user).where(eq(user.id, id))
  
  revalidatePath('/admin/benutzer')
  return { success: true }
}

// Get user statistics (admin only)
export async function getUserStats() {
  await requireAdmin()
  
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
