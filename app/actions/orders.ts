'use server'

import { db } from '@/lib/db'
import { order, orderItem, product, productVariant, user, siteSettings } from '@/lib/db/schema'
import { assertAdmin, getSessionWithRole } from '@/lib/auth-utils'
import { eq, desc, and, getTableColumns } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { normalizeDiscountPercent, computePartnerPrice, parseBasePrice } from '@/lib/pricing'
import { getDomainFromLocale } from '@/lib/domain-utils'

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
  customerPoNumber?: string
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

  // 2. Fetch VAT rate for this market
  const [settings] = await db
    .select({ vatRate: siteSettings.vatRate, currency: siteSettings.currency })
    .from(siteSettings)
    .where(eq(siteSettings.domain, market))
    .limit(1)
  const vatRate = settings?.vatRate ? parseFloat(String(settings.vatRate)) : 20
  const currency = settings?.currency ?? 'EUR'

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

  // 5. Generate order number: MC-{MARKET_2CHAR}-{YYYYMM}-{RANDOM_4HEX}
  const now = new Date()
  const marketCode = market.replace('monocool.', '').toUpperCase().slice(0, 2)
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0')
  const orderNumber = `MC-${marketCode}-${yyyymm}-${rand}`

  // 6. Insert order + order_items in a single transaction
  await db.transaction(async (tx) => {
    const [newOrder] = await tx
      .insert(order)
      .values({
        orderNumber,
        userId,
        status: 'submitted',
        market,
        currency,
        paymentStatus: 'unpaid',
        customerPoNumber: input.customerPoNumber?.trim() || null,
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
  })

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


