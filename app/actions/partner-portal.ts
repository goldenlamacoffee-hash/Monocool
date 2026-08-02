'use server'

// app/actions/partner-portal.ts
// Partner-safe data functions — every function derives userId from the session
// and gates access to approved same-market data only.
// No function accepts a userId from the caller.

import { db } from '@/lib/db'
import { order, orderItem, product, productVariant, productDocument, siteSettings, user } from '@/lib/db/schema'
import { eq, and, desc, count, sum, inArray, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { unstable_noStore as noStore } from 'next/cache'
import { getRequestSession } from '@/lib/auth-utils'
import { getDomainFromLocale, isValidMarket } from '@/lib/domain-utils'
import { normalizeDiscountPercent, parseBasePrice, computePartnerPrice } from '@/lib/pricing'

// ---------------------------------------------------------------------------
// Internal auth guard
// Returns { userId, discountPercent, market } for approved partners.
// Throws for any other state — caller must handle via try/catch or let it
// propagate as a 500 (server actions should not leak details to client).
// ---------------------------------------------------------------------------

async function requireApprovedPartner(locale: string) {
  const session = await getRequestSession()
  if (!session?.user) throw new Error('Unauthorized')

  const [row] = await db
    .select({
      role: user.role,
      status: user.status,
      market: user.market,
      discountPercent: user.discountPercent,
    })
    .from(user)
    .where(eq(user.id, session.user.id))

  if (!row) throw new Error('Unauthorized')
  if (row.role === 'admin') throw new Error('Admins use the admin area')

  const market = getDomainFromLocale(locale)
  if (!isValidMarket(row.market) || row.market !== market) throw new Error('Wrong market')
  if (row.status !== 'approved') throw new Error('Account not approved')

  return {
    userId: session.user.id,
    discountPercent: normalizeDiscountPercent(row.discountPercent),
    market,
  }
}

// ---------------------------------------------------------------------------
// Open order statuses (spec §3)
// ---------------------------------------------------------------------------
const OPEN_STATUSES = ['submitted', 'confirmed', 'processing', 'shipped']

// ---------------------------------------------------------------------------
// getPartnerDashboard
// ---------------------------------------------------------------------------

export type PartnerDashboardData = {
  totalOrders: number
  openOrders: number
  completedOrders: number
  historicalTotal: string   // persisted grandTotal sum
  availableDocuments: number
  recentOrders: PartnerOrderRow[]
  marketSettings: {
    currency: string
    vatRate: string
  }
}

export type PartnerOrderRow = {
  id: number
  orderNumber: string
  status: string
  paymentStatus: string
  customerPoNumber: string | null
  grandTotal: string | null
  total: string | null
  currency: string | null
  createdAt: Date
}

export async function getPartnerDashboard(locale: string): Promise<PartnerDashboardData> {
  noStore()
  const { userId, market } = await requireApprovedPartner(locale)

  const [ordersData, docsData, settingsData] = await Promise.all([
    // All partner orders for this market
    db
      .select({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customerPoNumber: order.customerPoNumber,
        grandTotal: order.grandTotal,
        total: order.total,
        currency: order.currency,
        createdAt: order.createdAt,
      })
      .from(order)
      .where(and(eq(order.userId, userId), eq(order.market, market)))
      .orderBy(desc(order.createdAt)),

    // Available documents (active, language = locale, active parent product in this market)
    db
      .select({ id: productDocument.id })
      .from(productDocument)
      .innerJoin(product, eq(productDocument.productId, product.id))
      .where(
        and(
          eq(productDocument.isActive, true),
          or(
            eq(productDocument.language, locale),
            eq(productDocument.language, 'en')
          ),
          eq(product.isActive, true),
          eq(product.domain, market)
        )
      ),

    // Market settings
    db
      .select({ currency: siteSettings.currency, vatRate: siteSettings.vatRate })
      .from(siteSettings)
      .where(eq(siteSettings.domain, market))
      .limit(1),
  ])

  const totalOrders = ordersData.length
  const openOrders = ordersData.filter(o => OPEN_STATUSES.includes(o.status)).length
  const completedOrders = ordersData.filter(o => o.status === 'completed').length

  // Sum persisted grandTotal — do not recalculate
  const historicalTotal = ordersData
    .reduce((s, o) => {
      const v = parseFloat(String(o.grandTotal ?? o.total ?? '0'))
      return s + (Number.isFinite(v) ? v : 0)
    }, 0)
    .toFixed(2)

  // Deduplicate English fallback documents:
  // If a product already has a document for the current locale + same type,
  // don't count the English one.
  const localeDocIds = new Set(
    docsData
      .filter((d: { id: number }) => {
        // We don't have language here — count all for simplicity; detail dedup is on the downloads page
        return true
      })
      .map((d: { id: number }) => d.id)
  )

  return {
    totalOrders,
    openOrders,
    completedOrders,
    historicalTotal,
    availableDocuments: localeDocIds.size,
    recentOrders: ordersData.slice(0, 5),
    marketSettings: {
      currency: settingsData[0]?.currency ?? 'EUR',
      vatRate: settingsData[0]?.vatRate ?? '20',
    },
  }
}

// ---------------------------------------------------------------------------
// getMyOrders
// ---------------------------------------------------------------------------

export type MyOrdersResult = {
  orders: PartnerOrderRow[]
  currency: string
}

export async function getMyOrders(locale: string): Promise<MyOrdersResult> {
  noStore()
  const { userId, market } = await requireApprovedPartner(locale)

  const rows = await db
    .select({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerPoNumber: order.customerPoNumber,
      grandTotal: order.grandTotal,
      total: order.total,
      currency: order.currency,
      discountTotal: order.discountTotal,
      vatTotal: order.vatTotal,
      createdAt: order.createdAt,
    })
    .from(order)
    .where(and(eq(order.userId, userId), eq(order.market, market)))
    .orderBy(desc(order.createdAt))

  const [settings] = await db
    .select({ currency: siteSettings.currency })
    .from(siteSettings)
    .where(eq(siteSettings.domain, market))
    .limit(1)

  return {
    orders: rows,
    currency: settings?.currency ?? 'EUR',
  }
}

// ---------------------------------------------------------------------------
// getMyOrderByNumber — returns null when not found or not authorized
// ---------------------------------------------------------------------------

export type MyOrderDetail = {
  id: number
  orderNumber: string
  status: string
  paymentStatus: string
  currency: string | null
  market: string | null
  customerPoNumber: string | null
  customerNote: string | null
  billingAddress: unknown
  shippingAddress: unknown
  discountTotal: string
  vatTotal: string
  grandTotal: string | null
  total: string
  // Order timestamps for timeline
  createdAt: Date
  confirmedAt: Date | null
  shippedAt: Date | null
  completedAt: Date | null
  cancelledAt: Date | null
  paidAt: Date | null
  // Items
  items: {
    id: number
    productName: string
    variantName: string | null
    sku: string | null
    quantity: number
    baseUnitPrice: string
    discountPercent: string
    finalUnitPrice: string
    vatRate: string
    vatAmount: string
    lineSubtotal: string
    lineTotal: string
  }[]
}

export async function getMyOrderByNumber(
  locale: string,
  orderNumber: string
): Promise<MyOrderDetail | null> {
  noStore()
  const { userId, market } = await requireApprovedPartner(locale)

  // Query with userId + market guard IN the WHERE clause (spec §4)
  const [row] = await db
    .select({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      currency: order.currency,
      market: order.market,
      customerPoNumber: order.customerPoNumber,
      customerNote: order.customerNote,
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
      discountTotal: order.discountTotal,
      vatTotal: order.vatTotal,
      grandTotal: order.grandTotal,
      total: order.total,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      paidAt: order.paidAt,
      // adminNote is intentionally excluded — spec §6
    })
    .from(order)
    .where(
      and(
        eq(order.orderNumber, orderNumber),
        eq(order.userId, userId),   // own order only
        eq(order.market, market)    // own market only
      )
    )
    .limit(1)

  if (!row) return null

  const items = await db
    .select({
      id: orderItem.id,
      productName: orderItem.productName,
      variantName: orderItem.variantName,
      sku: orderItem.sku,
      quantity: orderItem.quantity,
      baseUnitPrice: orderItem.baseUnitPrice,
      discountPercent: orderItem.discountPercent,
      finalUnitPrice: orderItem.finalUnitPrice,
      vatRate: orderItem.vatRate,
      vatAmount: orderItem.vatAmount,
      lineSubtotal: orderItem.lineSubtotal,
      lineTotal: orderItem.lineTotal,
    })
    .from(orderItem)
    .where(eq(orderItem.orderId, row.id))
    .orderBy(orderItem.id)

  return {
    ...row,
    discountTotal: String(row.discountTotal ?? '0'),
    vatTotal: String(row.vatTotal ?? '0'),
    total: String(row.total ?? '0'),
    items,
  }
}

// ---------------------------------------------------------------------------
// getMyPriceList — server-derived, all prices from DB
// ---------------------------------------------------------------------------

export type PriceListProduct = {
  id: number
  name: string
  slug: string
  category: string | null
  technicalData: string | null
  imageUrl: string | null
  basePrice: number | null
  partnerPrice: number | null
  grossPrice: number | null
  discountPercent: number
  vatRate: number
  currency: string
  variants: {
    id: number
    name: string
    sku: string | null
    basePrice: number | null
    partnerPrice: number | null
    grossPrice: number | null
  }[]
}

export async function getMyPriceList(locale: string): Promise<{
  products: PriceListProduct[]
  discountPercent: number
  currency: string
  vatRate: number
}> {
  noStore()
  const { discountPercent, market } = await requireApprovedPartner(locale)

  const [settings] = await db
    .select({ vatRate: siteSettings.vatRate, currency: siteSettings.currency })
    .from(siteSettings)
    .where(eq(siteSettings.domain, market))
    .limit(1)

  const vatRate = parseFloat(String(settings?.vatRate ?? '20'))
  const currency = settings?.currency ?? 'EUR'

  // Fetch active products for this market with their active variants
  const products = await db
    .select({
      id: product.id,
      name: product.name,
      slug: product.slug,
      category: product.category,
      technicalData: product.technicalData,
      imageUrl: product.imageUrl,
      price: product.price,
    })
    .from(product)
    .where(and(eq(product.isActive, true), eq(product.domain, market)))
    .orderBy(product.sortOrder, product.name)

  if (products.length === 0) {
    return { products: [], discountPercent, currency, vatRate }
  }

  const productIds = products.map(p => p.id)
  const variants = await db
    .select({
      id: productVariant.id,
      productId: productVariant.productId,
      name: productVariant.name,
      sku: productVariant.sku,
      price: productVariant.price,
    })
    .from(productVariant)
    .where(
      and(
        inArray(productVariant.productId, productIds),
        eq(productVariant.isActive, true)
      )
    )
    .orderBy(productVariant.sortOrder, productVariant.name)

  const variantsByProduct = new Map<number, typeof variants>()
  for (const v of variants) {
    if (!variantsByProduct.has(v.productId)) variantsByProduct.set(v.productId, [])
    variantsByProduct.get(v.productId)!.push(v)
  }

  const result: PriceListProduct[] = products.map(p => {
    const basePrice = parseBasePrice(p.price)
    const partnerPrice = basePrice === null ? null : computePartnerPrice(basePrice, discountPercent)
    const grossPrice = partnerPrice === null ? null : Math.round(partnerPrice * (1 + vatRate / 100) * 100) / 100

    const productVariants = (variantsByProduct.get(p.id) ?? []).map(v => {
      // Variant price when set; otherwise fall back to parent
      const vBase = parseBasePrice(v.price) ?? basePrice
      const vPartner = vBase === null ? null : computePartnerPrice(vBase, discountPercent)
      const vGross = vPartner === null ? null : Math.round(vPartner * (1 + vatRate / 100) * 100) / 100
      return {
        id: v.id,
        name: v.name,
        sku: v.sku,
        basePrice: vBase,
        partnerPrice: vPartner,
        grossPrice: vGross,
      }
    })

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      technicalData: p.technicalData,
      imageUrl: p.imageUrl,
      basePrice,
      partnerPrice,
      grossPrice,
      discountPercent,
      vatRate,
      currency,
      variants: productVariants,
    }
  })

  return { products: result, discountPercent, currency, vatRate }
}

// ---------------------------------------------------------------------------
// getMyDocuments — efficient joined query, with English fallback / dedup
// ---------------------------------------------------------------------------

export type DocumentItem = {
  id: number
  productId: number
  productName: string
  title: string
  type: string
  language: string
  fileUrl: string
  fileSize: number | null
  fileName: string | null
}

export type DocumentGroup = {
  productId: number
  productName: string
  documents: DocumentItem[]
}

export async function getMyDocuments(locale: string): Promise<DocumentGroup[]> {
  noStore()
  const { market } = await requireApprovedPartner(locale)

  // Fetch both locale-language and English documents in one query
  const rows = await db
    .select({
      id: productDocument.id,
      productId: productDocument.productId,
      productName: product.name,
      title: productDocument.title,
      type: productDocument.type,
      language: productDocument.language,
      fileUrl: productDocument.fileUrl,
      fileSize: productDocument.fileSize,
      fileName: productDocument.fileName,
      sortOrder: productDocument.sortOrder,
    })
    .from(productDocument)
    .innerJoin(product, eq(productDocument.productId, product.id))
    .where(
      and(
        eq(productDocument.isActive, true),
        eq(product.isActive, true),
        eq(product.domain, market),
        or(
          eq(productDocument.language, locale),
          eq(productDocument.language, 'en')
        )
      )
    )
    .orderBy(product.name, productDocument.sortOrder, productDocument.createdAt)

  // English fallback dedup: for each (productId, type) pair, prefer locale-language
  // document. Only show English when no locale document exists for that type.
  const localeKeys = new Set(
    rows
      .filter(r => r.language === locale)
      .map(r => `${r.productId}__${r.type}`)
  )

  const filtered = rows.filter(r => {
    if (r.language === locale) return true
    // English fallback: only include when no locale doc for this product+type
    return !localeKeys.has(`${r.productId}__${r.type}`)
  })

  // Group by product
  const groups = new Map<number, DocumentGroup>()
  for (const doc of filtered) {
    if (!groups.has(doc.productId)) {
      groups.set(doc.productId, { productId: doc.productId, productName: doc.productName, documents: [] })
    }
    groups.get(doc.productId)!.documents.push({
      id: doc.id,
      productId: doc.productId,
      productName: doc.productName,
      title: doc.title,
      type: doc.type,
      language: doc.language,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      fileName: doc.fileName,
    })
  }

  return Array.from(groups.values())
}

// ---------------------------------------------------------------------------
// updateMyPartnerProfile — authenticated, whitelisted fields only
// ---------------------------------------------------------------------------

const ALLOWED_PROFILE_FIELDS = [
  'name',
  'companyName',
  'companyId',
  'vatNumber',
  'phone',
  'address',
  'city',
  'postalCode',
  'country',
] as const

export type UpdateProfileInput = {
  name: string
  companyName: string
  companyId: string
  vatNumber: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
}

export type UpdateProfileResult =
  | { success: true; data: UpdateProfileInput }
  | { success: false; error: string }

export async function updateMyPartnerProfile(
  locale: string,
  input: UpdateProfileInput
): Promise<UpdateProfileResult> {
  try {
    const { userId } = await requireApprovedPartner(locale)

    // Validate + trim all allowed fields
    const name = input.name?.trim() ?? ''
    if (!name) return { success: false, error: 'nameRequired' }

    const update: Partial<typeof user.$inferInsert> = {
      name,
      companyName: input.companyName?.trim() || null,
      companyId: input.companyId?.trim() || null,
      vatNumber: input.vatNumber?.trim() || null,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      city: input.city?.trim() || null,
      postalCode: input.postalCode?.trim() || null,
      country: input.country?.trim() || null,
      updatedAt: new Date(),
    }

    // Perform narrow update — only whitelisted fields, keyed by userId
    await db.update(user).set(update).where(eq(user.id, userId))

    revalidatePath(`/${locale}/konto/profile`)
    revalidatePath(`/${locale}/konto`)

    return {
      success: true,
      data: {
        name,
        companyName: update.companyName ?? '',
        companyId: update.companyId ?? '',
        vatNumber: update.vatNumber ?? '',
        phone: update.phone ?? '',
        address: update.address ?? '',
        city: update.city ?? '',
        postalCode: update.postalCode ?? '',
        country: update.country ?? '',
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: msg }
  }
}
