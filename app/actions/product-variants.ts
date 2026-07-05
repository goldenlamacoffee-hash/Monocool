'use server'

import { db } from '@/lib/db'
import { product, productVariant } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { unstable_noStore as noStore } from 'next/cache'
import { assertAdmin } from '@/lib/auth-utils'

// Revalidate the affected product pages across all locales (both product
// surfaces: /produkte and /fan-coil) plus the admin products route.
function revalidateForProduct(slug?: string | null) {
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach((locale) => {
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
    revalidatePath(`/${locale}/admin/produkte`)
    if (slug) {
      revalidatePath(`/${locale}/produkte/${slug}`)
      revalidatePath(`/${locale}/fan-coil/${slug}`)
    }
  })
}

// Ensure the parent product exists; returns its slug for revalidation.
async function assertProductExists(productId: number) {
  const [parent] = await db
    .select({ id: product.id, slug: product.slug })
    .from(product)
    .where(eq(product.id, productId))
  if (!parent) throw new Error('Parent product not found')
  return parent
}

// Verify a variant exists and belongs to the given product; returns it.
async function getOwnedVariant(variantId: number, productId: number) {
  const [variant] = await db
    .select()
    .from(productVariant)
    .where(eq(productVariant.id, variantId))
  if (!variant) throw new Error('Variant not found')
  if (variant.productId !== productId) {
    throw new Error('Variant does not belong to this product')
  }
  return variant
}

// Public/admin read: all variants for a product, ordered.
export async function getProductVariants(productId: number) {
  noStore()
  try {
    return await db
      .select()
      .from(productVariant)
      .where(eq(productVariant.productId, productId))
      .orderBy(asc(productVariant.sortOrder))
  } catch (error) {
    console.error('[v0] Error fetching product variants:', error)
    return []
  }
}

export async function createProductVariant(data: {
  productId: number
  name: string
  sku?: string | null
  price?: number | null
  coolingOutput?: string | null
  heatingOutput?: string | null
  technicalData?: string | null
  isActive?: boolean
  sortOrder?: number
}) {
  await assertAdmin()

  const name = data.name?.trim()
  if (!name) throw new Error('Variant name is required')

  const parent = await assertProductExists(data.productId)

  // Default sortOrder to the end of the current list.
  let sortOrder = data.sortOrder
  if (sortOrder === undefined) {
    const existing = await db
      .select({ sortOrder: productVariant.sortOrder })
      .from(productVariant)
      .where(eq(productVariant.productId, data.productId))
    sortOrder = existing.reduce((max, v) => Math.max(max, v.sortOrder), -1) + 1
  }

  const [created] = await db
    .insert(productVariant)
    .values({
      productId: data.productId,
      name,
      sku: data.sku?.trim() || null,
      price: data.price === undefined || data.price === null ? null : data.price.toString(),
      coolingOutput: data.coolingOutput?.trim() || null,
      heatingOutput: data.heatingOutput?.trim() || null,
      technicalData: data.technicalData?.trim() || null,
      isActive: data.isActive ?? true,
      sortOrder,
    })
    .returning()

  revalidateForProduct(parent.slug)
  return created
}

export async function updateProductVariant(
  variantId: number,
  productId: number,
  data: Partial<{
    name: string
    sku: string | null
    price: number | null
    coolingOutput: string | null
    heatingOutput: string | null
    technicalData: string | null
    isActive: boolean
    sortOrder: number
  }>
) {
  await assertAdmin()
  const parent = await assertProductExists(productId)
  await getOwnedVariant(variantId, productId)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name) throw new Error('Variant name is required')
    patch.name = name
  }
  if (data.sku !== undefined) patch.sku = data.sku?.trim() || null
  if (data.price !== undefined) {
    patch.price = data.price === null ? null : data.price.toString()
  }
  if (data.coolingOutput !== undefined) patch.coolingOutput = data.coolingOutput?.trim() || null
  if (data.heatingOutput !== undefined) patch.heatingOutput = data.heatingOutput?.trim() || null
  if (data.technicalData !== undefined) patch.technicalData = data.technicalData?.trim() || null
  if (data.isActive !== undefined) patch.isActive = data.isActive
  if (data.sortOrder !== undefined) patch.sortOrder = data.sortOrder

  const [updated] = await db
    .update(productVariant)
    .set(patch)
    .where(eq(productVariant.id, variantId))
    .returning()

  revalidateForProduct(parent.slug)
  return updated
}

export async function deleteProductVariant(variantId: number, productId: number) {
  await assertAdmin()
  const parent = await assertProductExists(productId)
  await getOwnedVariant(variantId, productId)

  await db.delete(productVariant).where(eq(productVariant.id, variantId))
  revalidateForProduct(parent.slug)
}

export async function toggleProductVariantActive(
  variantId: number,
  productId: number,
  isActive: boolean
) {
  return updateProductVariant(variantId, productId, { isActive })
}

// Persist a new ordering. `orderedIds` is the full list of variant ids in the
// desired order; each is validated to belong to the product before saving.
export async function reorderProductVariants(productId: number, orderedIds: number[]) {
  await assertAdmin()
  const parent = await assertProductExists(productId)

  const owned = await db
    .select({ id: productVariant.id })
    .from(productVariant)
    .where(eq(productVariant.productId, productId))
  const ownedIds = new Set(owned.map((v) => v.id))
  if (!orderedIds.every((id) => ownedIds.has(id))) {
    throw new Error('One or more variants do not belong to this product')
  }

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(productVariant)
        .set({ sortOrder: index, updatedAt: new Date() })
        .where(eq(productVariant.id, id))
    )
  )

  revalidateForProduct(parent.slug)
}
