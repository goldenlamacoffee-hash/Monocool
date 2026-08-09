'use server'

import { db } from '@/lib/db'
import { internalProductCost, product, productVariant } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { assertOwnerAdmin } from '@/lib/owner-auth'

// ---------------------------------------------------------------------------
// OWNER-ONLY internal purchase-cost data (V1.4I.1).
//
// Every exported function below begins with `await assertOwnerAdmin()`.
// There is no other entry point to the internal_product_cost table — it is
// never joined into getProducts(), getProductBySlug(), the partner price
// list, basket, checkout, orders, or any ordinary-admin product query. An
// admin who is not on the MONOCOOL_OWNER_ADMIN_EMAILS allowlist gets a
// thrown "Owner access required" error from every function here, even when
// calling the Server Action directly and bypassing the UI entirely.
//
// Do not log purchase prices, note text, or the owner allowlist. Do not add
// a generic/unrestricted query for this table anywhere else in the codebase.
// ---------------------------------------------------------------------------

// Detects Postgres "undefined_table" (42P01), including when wrapped in a
// driver-specific `cause` chain. Only this specific error is treated as
// "migration not applied yet" — every other error (permissions, connection,
// etc.) is rethrown untouched so it is never silently swallowed.
function isPgUndefinedTable(err: unknown): boolean {
  const e = err as { code?: string; cause?: unknown } | null | undefined
  if (!e || typeof e !== 'object') return false
  if (e.code === '42P01') return true
  return e.cause ? isPgUndefinedTable(e.cause) : false
}

// Verify a variant exists and belongs to the given product. There is no
// DB-level FK from internal_product_cost.variantId to product_variant (see
// the migration file for why) — this is the application-level integrity
// check, mirroring getOwnedVariant() in app/actions/product-variants.ts.
async function assertOwnedVariant(variantId: number, productId: number) {
  const [variant] = await db
    .select({ id: productVariant.id, productId: productVariant.productId })
    .from(productVariant)
    .where(eq(productVariant.id, variantId))
  if (!variant) throw new Error('Variant not found')
  if (variant.productId !== productId) throw new Error('Variant does not belong to this product')
}

function targetCondition(productId: number, variantId: number | null) {
  return variantId
    ? and(eq(internalProductCost.productId, productId), eq(internalProductCost.variantId, variantId))
    : and(eq(internalProductCost.productId, productId), isNull(internalProductCost.variantId))
}

export type InternalCostInput = {
  productId: number
  variantId?: number | null
  supplier?: string
  purchasePrice: number
  currency?: string
  note?: string | null
}

/**
 * All cost rows for a product (the base-product row plus any variant rows).
 * Returns an empty array if the migration has not been applied yet (table
 * does not exist) — the caller renders "not configured" rather than crashing
 * the product editor for the owner.
 */
export async function getInternalProductCosts(productId: number) {
  await assertOwnerAdmin()
  try {
    return await db
      .select()
      .from(internalProductCost)
      .where(eq(internalProductCost.productId, productId))
  } catch (err) {
    if (isPgUndefinedTable(err)) return []
    throw err
  }
}

/**
 * A single cost row: the base product's cost when `variantId` is omitted or
 * null, otherwise that specific variant's cost. Returns null when no row
 * exists yet, or when the migration has not been applied.
 */
export async function getInternalProductCost(productId: number, variantId?: number | null) {
  await assertOwnerAdmin()
  try {
    const [row] = await db
      .select()
      .from(internalProductCost)
      .where(targetCondition(productId, variantId ?? null))
    return row ?? null
  } catch (err) {
    if (isPgUndefinedTable(err)) return null
    throw err
  }
}

/**
 * Create or update the cost row for a product (variantId omitted/null) or a
 * specific variant (variantId set). Validates the parent product exists and,
 * for variant targets, that the variant exists and belongs to this product.
 */
export async function upsertInternalProductCost(input: InternalCostInput) {
  const session = await assertOwnerAdmin()

  if (!Number.isFinite(input.purchasePrice) || input.purchasePrice < 0) {
    throw new Error('Purchase price must be a non-negative number')
  }

  const [parent] = await db.select({ id: product.id }).from(product).where(eq(product.id, input.productId))
  if (!parent) throw new Error('Product not found')

  const variantId = input.variantId ?? null
  if (variantId !== null) {
    await assertOwnedVariant(variantId, input.productId)
  }

  const supplier = input.supplier?.trim() || 'Zymbo'
  const currency = (input.currency?.trim() || 'EUR').toUpperCase()
  const note = input.note?.trim() || null

  const [existing] = await db
    .select({ id: internalProductCost.id })
    .from(internalProductCost)
    .where(targetCondition(input.productId, variantId))

  if (existing) {
    const [updated] = await db
      .update(internalProductCost)
      .set({
        supplier,
        purchasePrice: input.purchasePrice.toString(),
        currency,
        note,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(internalProductCost.id, existing.id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(internalProductCost)
    .values({
      productId: input.productId,
      variantId,
      supplier,
      purchasePrice: input.purchasePrice.toString(),
      currency,
      note,
      updatedBy: session.user.id,
    })
    .returning()
  return created
}

/** Remove a single cost row (base or variant) by its id. */
export async function deleteInternalProductCost(id: number) {
  await assertOwnerAdmin()
  await db.delete(internalProductCost).where(eq(internalProductCost.id, id))
}
