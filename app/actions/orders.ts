'use server'

import { db } from '@/lib/db'
import { order, orderItem, product, productVariant, user, siteSettings } from '@/lib/db/schema'
import { assertAdmin, getSessionWithRole } from '@/lib/auth-utils'
import { eq, desc, and, sql, getTableColumns } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { normalizeDiscountPercent, computePartnerPrice, parseBasePrice } from '@/lib/pricing'
import { getDomainFromLocale } from '@/lib/domain-utils'
import { formatOrderNumber } from '@/lib/order-number'

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

  const conditions = []
  if (filters?.market) conditions.push(eq(order.market, filters.market))
  if (filters?.status) conditions.push(eq(order.status, filters.status))
  if (filters?.paymentStatus) conditions.push(eq(order.paymentStatus, filters.paymentStatus))

  const rows = await db
    .select({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      market: order.market,
      currency: order.currency,
      grandTotal: order.grandTotal,
      total: order.total,
      customerPoNumber: order.customerPoNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      userName: user.name,
      userEmail: user.email,
      userCompanyName: user.companyName,
    })
    .from(order)
    .leftJoin(user, eq(user.id, order.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(order.createdAt))

  return rows
}

// ---------------------------------------------------------------------------
// Get single order with items (admin only)
// ---------------------------------------------------------------------------

export async function getOrderById(id: number) {
  await assertAdmin()

  const rows = await db
    .select({
      ...getTableColumns(order),
      userName: user.name,
      userEmail: user.email,
      userCompanyName: user.companyName,
      userPhone: user.phone,
      userAddress: user.address,
      userCity: user.city,
      userPostalCode: user.postalCode,
      userCountry: user.country,
      userVatNumber: user.vatNumber,
      userCompanyId: user.companyId,
    })
    .from(order)
    .leftJoin(user, eq(user.id, order.userId))
    .where(eq(order.id, id))
    .limit(1)

  if (rows.length === 0) return null

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, id))
    .orderBy(orderItem.id)

  return { ...rows[0], items }
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

// ---------------------------------------------------------------------------
// Atomic admin update — status + paymentStatus + adminNote in one DB write
// ---------------------------------------------------------------------------

export type UpdateOrderAdminFieldsInput = {
  orderId: number
  status: string
  paymentStatus: string
  adminNote: string
}

export type UpdateOrderAdminFieldsResult = {
  id: number
  status: string
  paymentStatus: string
  adminNote: string | null
  updatedAt: Date
}

export async function updateOrderAdminFields(
  input: UpdateOrderAdminFieldsInput
): Promise<UpdateOrderAdminFieldsResult> {
  await assertAdmin()

  // Validate orderId
  if (!Number.isInteger(input.orderId) || input.orderId < 1) {
    throw new Error('Invalid orderId')
  }

  // Validate status
  if (!VALID_STATUSES.includes(input.status as OrderStatus)) {
    throw new Error(`Invalid status: ${input.status}`)
  }

  // Validate paymentStatus
  if (!VALID_PAYMENT_STATUSES.includes(input.paymentStatus as PaymentStatus)) {
    throw new Error(`Invalid paymentStatus: ${input.paymentStatus}`)
  }

  // Confirm order exists and fetch current values to resolve timestamps
  const existing = await db
    .select({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      paidAt: order.paidAt,
    })
    .from(order)
    .where(eq(order.id, input.orderId))
    .limit(1)

  if (existing.length === 0) {
    throw new Error(`Order ${input.orderId} not found`)
  }

  const prev = existing[0]
  const now = new Date()
  const newStatus = input.status as OrderStatus
  const newPayment = input.paymentStatus as PaymentStatus

  // Derive timestamp updates — set on first transition, do not clear on revert
  const timestampUpdates: Partial<typeof order.$inferInsert> = {}
  if (newStatus === 'confirmed' && prev.confirmedAt == null) {
    timestampUpdates.confirmedAt = now
  }
  if (newStatus === 'shipped' && prev.shippedAt == null) {
    timestampUpdates.shippedAt = now
  }
  if (newStatus === 'completed' && prev.completedAt == null) {
    timestampUpdates.completedAt = now
  }
  if (newStatus === 'cancelled' && prev.cancelledAt == null) {
    timestampUpdates.cancelledAt = now
  }
  if (newPayment === 'paid' && prev.paidAt == null) {
    timestampUpdates.paidAt = now
  }

  // Single atomic update
  const [updated] = await db
    .update(order)
    .set({
      status: newStatus,
      paymentStatus: newPayment,
      adminNote: input.adminNote.trim() || null,
      updatedAt: now,
      ...timestampUpdates,
    })
    .where(eq(order.id, input.orderId))
    .returning({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      adminNote: order.adminNote,
      updatedAt: order.updatedAt,
    })

  revalidatePath('/[locale]/admin/(dashboard)/bestellungen', 'page')
  return updated
}

// ---------------------------------------------------------------------------
// Partner-only auth guard
// ---------------------------------------------------------------------------

/**
 * Throws unless the current user is an approved partner (or admin) on the
 * correct market. Returns `{ userId, discountPercent, market }` on success.
 * Never trusts the client for discount or market — always reads from the DB.
 */
export async function assertApprovedPartner(locale: string) {
  const { session, role, status } = await getSessionWithRole()

  if (!session?.user) throw new Error('Unauthorized')

  const isAdmin = role === 'admin'
  const isApproved = status === 'approved' || isAdmin
  if (!isApproved) throw new Error('Account not approved')

  const [row] = await db
    .select({ discountPercent: user.discountPercent, market: user.market })
    .from(user)
    .where(eq(user.id, session.user.id))

  const market = getDomainFromLocale(locale)

  // Non-admins must belong to the current market
  if (!isAdmin) {
    if (!row?.market || row.market !== market) {
      throw new Error('Wrong market')
    }
  }

  return {
    userId: session.user.id,
    discountPercent: normalizeDiscountPercent(row?.discountPercent),
    market,
  }
}

// ---------------------------------------------------------------------------
// Place order — partner-facing server action (V1.4G.2)
// ---------------------------------------------------------------------------

export type BasketItemInput = {
  productId: number
  variantId?: number
  quantity: number
  productName: string
  variantName?: string
  sku?: string
}

export type PlaceOrderInput = {
  locale: string
  items: BasketItemInput[]
  customerNote?: string
  shippingAddress?: {
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
  billingAddress?: {
    address?: string
    city?: string
    postalCode?: string
    country?: string
  }
}

export async function placeOrder(input: PlaceOrderInput): Promise<{ orderNumber: string }> {
  if (!input.items || input.items.length === 0) {
    throw new Error('Basket is empty')
  }

  // 1. Auth guard — re-derives discount from DB, never from client
  const { userId, discountPercent, market } = await assertApprovedPartner(input.locale)

  // 2. Fetch site_settings for this market. A row is REQUIRED — order numbering
  // (V1.4J.1) is market-specific and must never invent a global sequence or
  // fall back to another market's counter. Fail cleanly instead of creating
  // the order.
  const [settings] = await db
    .select({ vatRate: siteSettings.vatRate, currency: siteSettings.currency })
    .from(siteSettings)
    .where(eq(siteSettings.domain, market))
    .limit(1)
  if (!settings) {
    throw new Error(`No site settings configured for market ${market}`)
  }
  const vatRate = settings.vatRate ? parseFloat(String(settings.vatRate)) : 20
  const currency = settings.currency ?? 'EUR'

  // 3. Re-derive all prices server-side
  const resolvedItems = await Promise.all(
    input.items.map(async (item) => {
      // Validate quantity
      const qty = Math.max(1, Math.min(9999, Math.floor(item.quantity)))

      // ── Step A: Always validate the parent product from DB ──────────────
      // client-provided productName/variantName/sku are never trusted.
      const [prod] = await db
        .select({ id: product.id, name: product.name, price: product.price, isActive: product.isActive })
        .from(product)
        .where(and(eq(product.id, item.productId), eq(product.isActive, true)))
        .limit(1)

      if (!prod) {
        throw new Error(`Product ${item.productId} not found or inactive`)
      }

      // Derive name and base price from the validated parent product
      const resolvedProductName = prod.name
      const productBasePrice = parseBasePrice(prod.price)
      let basePrice: number | null = productBasePrice

      let resolvedVariantName: string | null = null
      let resolvedSku: string | null = null

      // ── Step B: When variantId present, validate it belongs to this product ──
      if (item.variantId != null) {
        const [variant] = await db
          .select({
            id: productVariant.id,
            name: productVariant.name,
            sku: productVariant.sku,
            price: productVariant.price,
            isActive: productVariant.isActive,
          })
          .from(productVariant)
          .where(
            and(
              eq(productVariant.id, item.variantId),
              eq(productVariant.productId, item.productId), // must belong to this product
              eq(productVariant.isActive, true)
            )
          )
          .limit(1)

        if (!variant) {
          throw new Error(
            `Variant ${item.variantId} not found, inactive, or does not belong to product ${item.productId}`
          )
        }

        // Derive variant name and SKU from DB
        resolvedVariantName = variant.name
        resolvedSku = variant.sku ?? null

        // Use variant price when present; otherwise fall back to parent product price
        const variantPrice = parseBasePrice(variant.price)
        if (variantPrice !== null) {
          basePrice = variantPrice
        }
      }

      if (basePrice === null) {
        throw new Error(`Price unavailable for product ${item.productId}`)
      }

      const finalUnitPrice = computePartnerPrice(basePrice, discountPercent)
      const lineSubtotal = Math.round(finalUnitPrice * qty * 100) / 100
      const vatAmount = Math.round(lineSubtotal * (vatRate / 100) * 100) / 100
      const lineTotal = Math.round((lineSubtotal + vatAmount) * 100) / 100

      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: resolvedProductName,
        variantName: resolvedVariantName,
        sku: resolvedSku,
        quantity: qty,
        baseUnitPrice: String(basePrice),
        discountPercent: String(discountPercent),
        finalUnitPrice: String(finalUnitPrice),
        vatRate: String(vatRate),
        vatAmount: String(vatAmount),
        lineSubtotal: String(lineSubtotal),
        lineTotal: String(lineTotal),
      }
    })
  )

  // 4. Aggregate totals
  const subtotal = resolvedItems.reduce((s, i) => s + parseFloat(i.lineSubtotal), 0)
  const totalVat = resolvedItems.reduce((s, i) => s + parseFloat(i.vatAmount), 0)
  const grandTotal = Math.round((subtotal + totalVat) * 100) / 100
  const discountTotal =
    resolvedItems.reduce(
      (s, i) => s + (parseFloat(i.baseUnitPrice) - parseFloat(i.finalUnitPrice)) * i.quantity,
      0
    )

  // 5. Allocate the order number and insert order + order_items in ONE
  // transaction (V1.4J.1). The nextOrderNumber counter increment and the
  // order INSERT must be atomic so that:
  //  - two concurrent checkouts on the same market can never receive the
  //    same number
  //  - a rolled-back transaction (e.g. a UNIQUE collision on orderNumber
  //    after an admin manually edited the counter) never permanently
  //    consumes a sequence number
  const now = new Date()
  let orderNumber = ''

  try {
    await db.transaction(async (tx) => {
      // Atomically increment and read back the pre-increment value in a
      // single statement — this is the allocation. No separate SELECT-then-
      // UPDATE: two concurrent transactions serialize on this row.
      const [allocated] = await tx
        .update(siteSettings)
        .set({
          nextOrderNumber: sql`${siteSettings.nextOrderNumber} + 1`,
          updatedAt: now,
        })
        .where(eq(siteSettings.domain, market))
        .returning({ allocatedNumber: sql<number>`${siteSettings.nextOrderNumber} - 1` })

      if (!allocated) {
        // Row disappeared between step 2 and here — fail closed, never
        // invent a sequence.
        throw new Error(`No site settings configured for market ${market}`)
      }

      orderNumber = formatOrderNumber({ market, date: now, sequence: allocated.allocatedNumber })

      const [newOrder] = await tx
        .insert(order)
        .values({
          orderNumber,
          userId,
          status: 'submitted',
          market,
          currency,
          paymentStatus: 'unpaid',
          // V1.4J.2 — the customer-entered PO/order-number field has been removed.
          // Only the MonoCool-generated orderNumber is customer-visible now.
          // The DB column is kept (nullable) for backward compatibility with
          // historical orders only — new orders never write to it.
          customerPoNumber: null,
          customerNote: input.customerNote?.trim() || null,
          shippingAddress: input.shippingAddress ?? null,
          billingAddress: input.billingAddress ?? null,
          discountTotal: String(Math.round(discountTotal * 100) / 100),
          vatTotal: String(Math.round(totalVat * 100) / 100),
          grandTotal: String(grandTotal),
          // Legacy columns
          items: JSON.stringify([]),
          subtotal: String(Math.round(subtotal * 100) / 100),
          total: String(grandTotal),
        })
        .returning({ id: order.id })

      await tx.insert(orderItem).values(
        resolvedItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          productName: item.productName,
          variantName: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          baseUnitPrice: item.baseUnitPrice,
          discountPercent: item.discountPercent,
          finalUnitPrice: item.finalUnitPrice,
          vatRate: item.vatRate,
          vatAmount: item.vatAmount,
          lineSubtotal: item.lineSubtotal,
          lineTotal: item.lineTotal,
        }))
      )
      // If the INSERT above throws (e.g. UNIQUE violation on orderNumber
      // after an admin manually edited nextOrderNumber to collide with an
      // existing order), the whole transaction — including the counter
      // increment — rolls back automatically. No number is permanently lost.
    })
  } catch (err) {
    const pgError = err as { code?: string; constraint?: string }
    if (pgError?.code === '23505') {
      // Unique constraint violation on order.orderNumber
      throw new Error(
        'Order number collision detected — the sequence was rolled back safely. Please try again.'
      )
    }
    throw err
  }

  revalidatePath('/[locale]/admin/(dashboard)/bestellungen', 'page')
  return { orderNumber }
}

// ---------------------------------------------------------------------------
// Get a single order by orderNumber (owner or admin)
// ---------------------------------------------------------------------------

export async function getOrderByNumber(orderNumber: string) {
  const { session, role } = await getSessionWithRole()
  if (!session?.user) throw new Error('Unauthorized')

  const rows = await db
    .select({
      ...getTableColumns(order),
      userName: user.name,
      userEmail: user.email,
      userCompanyName: user.companyName,
    })
    .from(order)
    .leftJoin(user, eq(user.id, order.userId))
    .where(eq(order.orderNumber, orderNumber))
    .limit(1)

  if (rows.length === 0) return null

  const row = rows[0]

  // Only the owner or an admin may view
  if (role !== 'admin' && row.userId !== session.user.id) {
    throw new Error('Forbidden')
  }

  const items = await db
    .select()
    .from(orderItem)
    .where(eq(orderItem.orderId, row.id))
    .orderBy(orderItem.id)

  return { ...row, items }
}


