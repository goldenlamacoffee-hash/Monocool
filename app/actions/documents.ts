'use server'

import { db } from '@/lib/db'
import { productDocument, product } from '@/lib/db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'
import { assertAdmin } from '@/lib/auth-utils'

// Allowed language codes (1:1 map with market locales).
const ALLOWED_LANGUAGES = ['de', 'sk', 'cs', 'en'] as const
type DocLanguage = (typeof ALLOWED_LANGUAGES)[number]

// Allowed document types.
const ALLOWED_TYPES = [
  'manual',
  'datasheet',
  'installation_guide',
  'energy_label',
  'declaration_of_conformity',
  'brochure',
  'other',
] as const
type DocType = (typeof ALLOWED_TYPES)[number]

function isAllowedLanguage(lang: string): lang is DocLanguage {
  return (ALLOWED_LANGUAGES as readonly string[]).includes(lang)
}
function isAllowedType(type: string): type is DocType {
  return (ALLOWED_TYPES as readonly string[]).includes(type)
}

// Revalidate all routes that may show product documents.
function revalidateProductRoutes(slug?: string | null) {
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach((locale) => {
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
    if (slug) {
      revalidatePath(`/${locale}/produkte/${slug}`)
      revalidatePath(`/${locale}/fan-coil/${slug}`)
    }
  })
}

async function getProductSlug(productId: number): Promise<string | null> {
  const [row] = await db.select({ slug: product.slug }).from(product).where(eq(product.id, productId)).limit(1)
  return row?.slug ?? null
}

// ---- Public ----------------------------------------------------------------

/** Returns active documents for a product, filtered to the given locale/language. */
export async function getProductDocumentsPublic(productId: number, language: string) {
  if (!isAllowedLanguage(language)) return []
  return db
    .select()
    .from(productDocument)
    .where(
      and(
        eq(productDocument.productId, productId),
        eq(productDocument.language, language),
        eq(productDocument.isActive, true)
      )
    )
    .orderBy(asc(productDocument.sortOrder), asc(productDocument.createdAt))
}

// ---- Admin -----------------------------------------------------------------

/** Returns all documents (active + inactive) for admin management. */
export async function getProductDocumentsAdmin(productId: number) {
  await assertAdmin()
  return db
    .select()
    .from(productDocument)
    .where(eq(productDocument.productId, productId))
    .orderBy(asc(productDocument.sortOrder), asc(productDocument.createdAt))
}

export async function createProductDocument(data: {
  productId: number
  title: string
  type: string
  language: string
  fileUrl: string
  pathname: string
  fileName?: string
  fileSize?: number
}) {
  await assertAdmin()

  if (!data.title?.trim()) throw new Error('Title is required')
  if (!isAllowedLanguage(data.language)) throw new Error('Invalid language')
  if (!isAllowedType(data.type)) throw new Error('Invalid document type')
  if (!data.fileUrl || !data.pathname) throw new Error('File is required')

  // Verify parent product exists.
  const [prod] = await db.select({ id: product.id, slug: product.slug }).from(product).where(eq(product.id, data.productId)).limit(1)
  if (!prod) throw new Error('Product not found')

  // Append at end of sort order.
  const existing = await db
    .select({ sortOrder: productDocument.sortOrder })
    .from(productDocument)
    .where(eq(productDocument.productId, data.productId))
  const maxSort = existing.reduce((m, r) => Math.max(m, r.sortOrder), -1)

  const [doc] = await db
    .insert(productDocument)
    .values({
      productId: data.productId,
      title: data.title.trim(),
      type: data.type,
      language: data.language,
      fileUrl: data.fileUrl,
      pathname: data.pathname,
      fileName: data.fileName ?? null,
      fileSize: data.fileSize ?? null,
      sortOrder: maxSort + 1,
    })
    .returning()

  revalidateProductRoutes(prod.slug)
  return doc
}

export async function updateProductDocument(
  id: number,
  data: Partial<{
    title: string
    type: string
    language: string
    isActive: boolean
    sortOrder: number
  }>
) {
  await assertAdmin()

  const [doc] = await db.select().from(productDocument).where(eq(productDocument.id, id)).limit(1)
  if (!doc) throw new Error('Document not found')

  if (data.language !== undefined && !isAllowedLanguage(data.language)) throw new Error('Invalid language')
  if (data.type !== undefined && !isAllowedType(data.type)) throw new Error('Invalid document type')
  if (data.title !== undefined && !data.title.trim()) throw new Error('Title is required')

  await db
    .update(productDocument)
    .set({
      ...(data.title !== undefined ? { title: data.title.trim() } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      updatedAt: new Date(),
    })
    .where(eq(productDocument.id, id))

  const slug = await getProductSlug(doc.productId)
  revalidateProductRoutes(slug)
}

export async function deleteProductDocument(id: number) {
  await assertAdmin()

  const [doc] = await db.select().from(productDocument).where(eq(productDocument.id, id)).limit(1)
  if (!doc) return

  // Delete the file from Vercel Blob first.
  try {
    if (doc.pathname) await del(doc.pathname)
  } catch (err) {
    console.error('[v0] Failed to delete document blob:', err)
    // Continue — remove the DB record even if the Blob delete fails.
  }

  await db.delete(productDocument).where(eq(productDocument.id, id))

  const slug = await getProductSlug(doc.productId)
  revalidateProductRoutes(slug)
}

export async function toggleProductDocumentActive(id: number) {
  await assertAdmin()

  const [doc] = await db.select().from(productDocument).where(eq(productDocument.id, id)).limit(1)
  if (!doc) throw new Error('Document not found')

  await db
    .update(productDocument)
    .set({ isActive: !doc.isActive, updatedAt: new Date() })
    .where(eq(productDocument.id, id))

  const slug = await getProductSlug(doc.productId)
  revalidateProductRoutes(slug)
}
