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
  // §6 — totals grouped by persisted order currency; never mixed across currencies
  historicalTotals: { currency: string; total: string }[]
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

    // Available documents — fetch productId, type, language for locale+English dedup
    // (same logic as getMyDocuments; one SK manual + its EN fallback = one document)
    db
      .select({ productId: productDocument.productId, type: productDocument.type, language: productDocument.language })
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

  // §6 — group persisted totals by order.currency; never mix different currencies.
  // Use market currency as fallback only when the persisted order currency is null.
  const rawCurrencyFallback = (() => {
    const raw = settingsData[0]?.currency
    if (raw != null && raw.trim().length === 3) return raw.trim().toUpperCase()
    const MARKET_CURRENCY: Record<string, string> = {
      'monocool.sk': 'EUR', 'monocool.at': 'EUR', 'monocool.cz': 'CZK', 'monocool.eu': 'EUR',
    }
    return MARKET_CURRENCY[market] ?? 'EUR'
  })()

  const totalsByCurrency = new Map<string, number>()
  for (const o of ordersData) {
    const cur = (o.currency && o.currency.trim().length === 3)
      ? o.currency.trim().toUpperCase()
      : rawCurrencyFallback
    const v = parseFloat(String(o.grandTotal ?? o.total ?? '0'))
    if (Number.isFinite(v)) {
      totalsByCurrency.set(cur, (totalsByCurrency.get(cur) ?? 0) + v)
    }
  }
  const historicalTotals = Array.from(totalsByCurrency.entries()).map(([currency, total]) => ({
    currency,
    total: total.toFixed(2),
  }))

  // §4 — deduplicate English fallback documents using the same locale+type logic
  // as getMyDocuments. One locale doc + its English fallback = one available doc.
  const localeKeys = new Set(
    docsData
      .filter(d => d.language === locale)
      .map(d => `${d.productId}__${d.type}`)
  )
  const dedupedDocs = docsData.filter(d => {
    if (d.language === locale) return true
    return !localeKeys.has(`${d.productId}__${d.type}`)
  })

  // §3 — safe fallbacks for null currency/vatRate in site_settings
  const rawCurrency = settingsData[0]?.currency
  const safeCurrency = (rawCurrency != null && rawCurrency.trim().length === 3)
    ? rawCurrency.trim().toUpperCase()
    : 'EUR'
  // §3 — pass the raw value through; never invent 20% if unconfigured
  const rawVat = settingsData[0]?.vatRate
  const safeVat = (rawVat != null && String(rawVat).trim() !== '') ? String(rawVat) : ''

  return {
    totalOrders,
    openOrders,
    completedOrders,
    historicalTotals,
    availableDocuments: dedupedDocs.length,
    recentOrders: ordersData.slice(0, 5),
    marketSettings: {
      currency: safeCurrency,
      vatRate: safeVat,
    },
  }
}

// ---------------------------------------------------------------------------
// getMyOrders
// ---------------------------------------------------------------------------

export type MyOrdersResult = {
  orders: PartnerOrderRow[]
  // §5 — each order carries its own persisted currency; marketCurrency is the
  // fallback used only when order.currency is null
  marketCurrency: string
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

  // §5 — market currency used only as fallback when an individual order has null currency
  const rawCur = settings?.currency
  const MARKET_CURRENCY: Record<string, string> = {
    'monocool.sk': 'EUR', 'monocool.at': 'EUR', 'monocool.cz': 'CZK', 'monocool.eu': 'EUR',
  }
  const marketCurrency = (rawCur != null && rawCur.trim().length === 3)
    ? rawCur.trim().toUpperCase()
    : (MARKET_CURRENCY[market] ?? 'EUR')

  return {
    orders: rows,
    marketCurrency,
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
  // grossPrice is null when vatRate is not configured for this market
  grossPrice: number | null
  discountPercent: number
  // vatRate is NaN when site_settings.vatRate is null for this market
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

// PG error code 42P01 = undefined_table (relation does not exist).
// This code is exposed by postgres, @neondatabase/serverless, and node-postgres
// as err.code on the root error or its cause.
function isPgUndefinedTable(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as Record<string, unknown>
  if (e.code === '42P01') return true
  // Drizzle may wrap the driver error; check the cause chain
  if (e.cause && isPgUndefinedTable(e.cause)) return true
  return false
}

export async function getMyPriceList(locale: string): Promise<{
  products: PriceListProduct[]
  discountPercent: number
  currency: string
  vatRate: number
  variantsAvailable: boolean
}> {
  noStore()
  const { discountPercent, market } = await requireApprovedPartner(locale)

  const [settings] = await db
    .select({ vatRate: siteSettings.vatRate, currency: siteSettings.currency })
    .from(siteSettings)
    .where(eq(siteSettings.domain, market))
    .limit(1)

  // §3 — VAT: do NOT fall back to any assumed value when site_settings.vatRate
  // is null. Pass NaN through to callers so the UI can show a localized
  // "VAT not configured" message rather than silently calculating with a wrong rate.
  const vatRateRaw = parseFloat(String(settings?.vatRate ?? ''))
  const vatRate = Number.isFinite(vatRateRaw) ? vatRateRaw : NaN

  // currency: null from DB must NOT become the string "null" — always use a real fallback
  const currencyRaw = settings?.currency
  const MARKET_CURRENCY: Record<string, string> = {
    'monocool.sk': 'EUR',
    'monocool.at': 'EUR',
    'monocool.cz': 'CZK',
    'monocool.eu': 'EUR',
  }
  const currency = (currencyRaw != null && currencyRaw.trim().length === 3)
    ? currencyRaw.trim().toUpperCase()
    : (MARKET_CURRENCY[market] ?? 'EUR')

  // §3 — validate currency is safe for Intl.NumberFormat before using it
  let safeCurrency: string
  try {
    new Intl.NumberFormat('de', { style: 'currency', currency }).format(0)
    safeCurrency = currency
  } catch {
    console.error(`[partner-portal] Invalid currency "${currency}" for market ${market}, falling back to EUR`)
    safeCurrency = 'EUR'
  }

  // Fetch active products for this market
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
    return { products: [], discountPercent, currency: safeCurrency, vatRate, variantsAvailable: true }
  }

  // product_variant table may not exist yet (migration 0004 not yet applied).
  // Only suppress the error when PG reports 42P01 (undefined_table).
  // All other errors — connection failures, permission errors, malformed
  // queries — are rethrown so they surface as real failures instead of
  // silently returning an empty variant list.
  let variantsByProduct = new Map<number, { id: number; productId: number; name: string; sku: string | null; price: string | null }[]>()
  let variantsAvailable = true
  try {
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

    for (const v of variants) {
      if (!variantsByProduct.has(v.productId)) variantsByProduct.set(v.productId, [])
      variantsByProduct.get(v.productId)!.push(v)
    }
  } catch (variantErr) {
    if (!isPgUndefinedTable(variantErr)) {
      // Not a missing-table error — rethrow connection, permission, and all other DB failures
      throw variantErr
    }
    // Table does not exist yet (migration 0004 pending) — price list renders without variants
    variantsAvailable = false
    console.warn('[partner-portal] product_variant table not found (migration 0004 not applied) — rendering price list without variants')
  }

  // §3 — one malformed product must not crash the rest; map with per-product error catch
  const result: PriceListProduct[] = []
  for (const p of products) {
    try {
      const basePrice = parseBasePrice(p.price)
      const partnerPrice = basePrice === null ? null : computePartnerPrice(basePrice, discountPercent)
      // §3 — NaN guard on grossPrice
      const grossPrice = (partnerPrice !== null && Number.isFinite(vatRate))
        ? Math.round(partnerPrice * (1 + vatRate / 100) * 100) / 100
        : null

      const productVariants = (variantsByProduct.get(p.id) ?? []).map(v => {
        // §3 — variant price: fall back to parent when null/missing
        const vBase = parseBasePrice(v.price) ?? basePrice
        const vPartner = vBase === null ? null : computePartnerPrice(vBase, discountPercent)
        const vGross = (vPartner !== null && Number.isFinite(vatRate))
          ? Math.round(vPartner * (1 + vatRate / 100) * 100) / 100
          : null
        return {
          id: v.id,
          name: v.name,
          sku: v.sku,
          basePrice: vBase,
          partnerPrice: vPartner,
          grossPrice: vGross,
        }
      })

      result.push({
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category,
        technicalData: p.technicalData,
        // §3 — null imageUrl is fine; client renders without image
        imageUrl: p.imageUrl ?? null,
        basePrice,
        partnerPrice,
        grossPrice,
        discountPercent,
        vatRate,
        currency: safeCurrency,
        variants: productVariants,
      })
    } catch (productErr) {
      // §3 — one invalid product row must not remove all others
      const msg = productErr instanceof Error ? productErr.message : String(productErr)
      console.error(`[partner-portal] skipping product id=${p.id} due to error: ${msg}`)
    }
  }

  return { products: result, discountPercent, currency: safeCurrency, vatRate, variantsAvailable }
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
