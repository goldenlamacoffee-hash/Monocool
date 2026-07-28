'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { eq, desc, count, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth-utils'
import { MIN_DISCOUNT, MAX_DISCOUNT } from '@/lib/pricing'
import { isValidMarket } from '@/lib/domain-utils'

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
  // Market is optional in the payload; when present it is validated below and
  // saved. `null` means "global" and is only allowed for admin accounts.
  market?: string | null
}) {
  await assertAdmin()

  // Separate `market` from the free-form fields so we can validate it against
  // the allowed market list and the target user's role. Market is NOT derived
  // from `country` — it is an explicit, admin-controlled value.
  const { market, ...rest } = data
  const updates: Record<string, unknown> = { ...rest, updatedAt: new Date() }

  if (market !== undefined) {
    // Determine the target user's role (source of truth = DB), since only
    // admins may be saved with a null/global market.
    const [target] = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)
    if (!target) {
      throw new Error('User not found')
    }
    const isAdmin = target.role === 'admin'

    if (market === null || market === '') {
      if (!isAdmin) {
        throw new Error('Market is required for non-admin users')
      }
      updates.market = null
    } else {
      if (!isValidMarket(market)) {
        throw new Error('Invalid market')
      }
      updates.market = market
    }
  }

  await db
    .update(user)
    .set(updates)
    .where(eq(user.id, id))

  revalidatePath('/admin/benutzer')
  // Market changes affect partner-price visibility, so refresh public surfaces.
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach((locale) => {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
  })
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

// Create a partner account from the admin panel (admin only).
//
// Safety approach:
//   1. assertAdmin — only admins can call this.
//   2. Duplicate-email check before we touch auth, so the error is clear.
//   3. auth.api.signUpEmail — creates the user row + account row + hashes the
//      password using Better Auth's own bcrypt pipeline. We never store or log
//      the plain password ourselves.
//   4. Immediately patch the new user row to set market, status, role (user),
//      and the optional partner fields.  The role is forced to 'user' on the
//      update regardless of what signUp might have defaulted to; admins cannot
//      be created through this path.
//
// The partner can log in immediately with the temporary password.
export async function createPartner(data: {
  // Required
  email: string
  password: string
  market: string
  // Optional profile
  name?: string
  companyName?: string
  companyId?: string
  vatNumber?: string
  phone?: string
  address?: string
  postalCode?: string
  city?: string
  country?: string
  notes?: string
  // Partner pricing
  discountPercent?: number
  discountNote?: string
  partnerTier?: string
  // Status (default approved for admin-created accounts)
  status?: 'pending' | 'approved' | 'rejected'
}) {
  await assertAdmin()

  // Validate market — required for partner users, must be a known market.
  if (!data.market || !isValidMarket(data.market)) {
    throw new Error('Invalid market')
  }

  // Validate password length (Better Auth min is 8 chars).
  if (!data.password || data.password.length < 8) {
    throw new Error('Password must be at least 8 characters')
  }

  // Validate email format.
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    throw new Error('Invalid email address')
  }

  // Duplicate-email check (Better Auth will also reject it, but we give a
  // clearer message this way).
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, data.email.toLowerCase().trim()))
    .limit(1)
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  // Validate discount if provided.
  const rawDiscount = data.discountPercent ?? 0
  if (!Number.isFinite(rawDiscount) || rawDiscount < MIN_DISCOUNT || rawDiscount > MAX_DISCOUNT) {
    throw new Error(`Discount must be between ${MIN_DISCOUNT} and ${MAX_DISCOUNT}`)
  }
  const discountPercent = Math.round(rawDiscount * 100) / 100

  // Create the account through Better Auth so the password is hashed via its
  // own bcrypt pipeline. autoSignIn is enabled globally but we don't consume
  // the returned session cookie here (server action context).
  let newUserId: string
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email.trim(),
        password: data.password,
        name: data.name?.trim() || data.email.trim(),
      },
    })
    if (!result?.user?.id) {
      throw new Error('Account creation failed')
    }
    newUserId = result.user.id
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // Better Auth may also throw on duplicate email; surface it consistently.
    if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('exist')) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }
    throw err
  }

  // Patch the user row: set market, status, role (forced to 'user'), and
  // optional partner fields.  We never allow 'admin' role through this path.
  const status = data.status ?? 'approved'
  await db
    .update(user)
    .set({
      market: data.market,
      status,
      role: 'user',
      companyName: data.companyName?.trim() || null,
      companyId: data.companyId?.trim() || null,
      vatNumber: data.vatNumber?.trim() || null,
      phone: data.phone?.trim() || null,
      address: data.address?.trim() || null,
      postalCode: data.postalCode?.trim() || null,
      city: data.city?.trim() || null,
      country: data.country?.trim() || null,
      notes: data.notes?.trim() || null,
      discountPercent: discountPercent.toString(),
      discountNote: data.discountNote?.trim() || null,
      partnerTier: data.partnerTier?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, newUserId))

  revalidatePath('/admin/benutzer')
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach((locale) => {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
  })

  // Return the new user row so the client can optimistically add it to the table.
  const [created] = await db.select().from(user).where(eq(user.id, newUserId)).limit(1)
  return { success: true, user: created }
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
