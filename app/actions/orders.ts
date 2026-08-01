'use server'

import { db } from '@/lib/db'
import { order, orderItem } from '@/lib/db/schema'
import { assertAdmin } from '@/lib/auth-utils'
import { eq, desc, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderWithItems = Awaited<ReturnType<typeof getOrderById>>

export type OrderRow = {
  id: number
  orderNumber: string
  userId: string
  status: string
  paymentStatus: string
  market: string | null
  currency: string | null
  grandTotal: string | null
  total: string | null
  customerPoNumber: string | null
  createdAt: Date
  updatedAt: Date
  // Joined from user table
  userName: string | null
  userEmail: string | null
  userCompanyName: string | null
}

// ---------------------------------------------------------------------------
// List orders (admin only)
// ---------------------------------------------------------------------------

export async function listOrders(filters?: {
  market?: string
  status?: string
  paymentStatus?: string
}): Promise<OrderRow[]> {
  await assertAdmin()

  // Build a raw query so we can join user without a Drizzle relation defined
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters?.market) {
    values.push(filters.market)
    conditions.push(`o.market = $${values.length}`)
  }
  if (filters?.status) {
    values.push(filters.status)
    conditions.push(`o.status = $${values.length}`)
  }
  if (filters?.paymentStatus) {
    values.push(filters.paymentStatus)
    conditions.push(`o."paymentStatus" = $${values.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const rows = await db.execute(
    sql.raw(`
      SELECT
        o.id,
        o."orderNumber",
        o."userId",
        o.status,
        o."paymentStatus",
        o.market,
        o.currency,
        o."grandTotal",
        o.total,
        o."customerPoNumber",
        o."createdAt",
        o."updatedAt",
        u.name AS "userName",
        u.email AS "userEmail",
        u."companyName" AS "userCompanyName"
      FROM "order" o
      LEFT JOIN "user" u ON u.id = o."userId"
      ${where}
      ORDER BY o."createdAt" DESC
    `)
  )

  return rows as unknown as OrderRow[]
}

// ---------------------------------------------------------------------------
// Get single order with items (admin only)
// ---------------------------------------------------------------------------

export async function getOrderById(id: number) {
  await assertAdmin()

  const [row] = (await db.execute(
    sql.raw(`
      SELECT
        o.*,
        u.name AS "userName",
        u.email AS "userEmail",
        u."companyName" AS "userCompanyName",
        u.phone AS "userPhone",
        u.address AS "userAddress",
        u.city AS "userCity",
        u."postalCode" AS "userPostalCode",
        u.country AS "userCountry",
        u."vatNumber" AS "userVatNumber",
        u."companyId" AS "userCompanyId"
      FROM "order" o
      LEFT JOIN "user" u ON u.id = o."userId"
      WHERE o.id = ${id}
    `)
  ) as unknown) as unknown[]

  if (!row) return null

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, id))
    .orderBy(orderItem.id)

  return { ...(row as Record<string, unknown>), items }
}

// ---------------------------------------------------------------------------
// Update order status (admin only)
// ---------------------------------------------------------------------------

const VALID_STATUSES = ['submitted', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'] as const
type OrderStatus = (typeof VALID_STATUSES)[number]

export async function updateOrderStatus(orderId: number, status: OrderStatus) {
  await assertAdmin()
  if (!VALID_STATUSES.includes(status)) throw new Error('Invalid status')

  const timestampField: Record<OrderStatus, string | null> = {
    submitted: null,
    confirmed: 'confirmedAt',
    processing: null,
    shipped: 'shippedAt',
    completed: 'completedAt',
    cancelled: 'cancelledAt',
  }

  const extra = timestampField[status]
  const now = new Date()

  await db
    .update(order)
    .set({
      status,
      ...(extra ? { [extra]: now } : {}),
      updatedAt: now,
    })
    .where(eq(order.id, orderId))

  revalidatePath('/[locale]/admin/(dashboard)/bestellungen', 'page')
}

// ---------------------------------------------------------------------------
// Update payment status (admin only)
// ---------------------------------------------------------------------------

const VALID_PAYMENT_STATUSES = ['unpaid', 'payment_request_sent', 'paid', 'refunded'] as const
type PaymentStatus = (typeof VALID_PAYMENT_STATUSES)[number]

export async function updatePaymentStatus(orderId: number, paymentStatus: PaymentStatus) {
  await assertAdmin()
  if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) throw new Error('Invalid payment status')

  const now = new Date()
  await db
    .update(order)
    .set({
      paymentStatus,
      ...(paymentStatus === 'paid' ? { paidAt: now } : {}),
      updatedAt: now,
    })
    .where(eq(order.id, orderId))

  revalidatePath('/[locale]/admin/(dashboard)/bestellungen', 'page')
}

// ---------------------------------------------------------------------------
// Update admin note (admin only)
// ---------------------------------------------------------------------------

export async function updateAdminNote(orderId: number, adminNote: string) {
  await assertAdmin()
  await db
    .update(order)
    .set({ adminNote: adminNote.trim() || null, updatedAt: new Date() })
    .where(eq(order.id, orderId))
  revalidatePath('/[locale]/admin/(dashboard)/bestellungen', 'page')
}


