'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { productImage, product } from '@/lib/db/schema'
import { eq, asc } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { del } from '@vercel/blob'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
  return session
}

// Helper to revalidate product pages across all locales
function revalidateProductPages(slug?: string) {
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach(locale => {
    revalidatePath(`/${locale}/produkte`)
    if (slug) {
      revalidatePath(`/${locale}/produkte/${slug}`)
    }
  })
}

// Get all images for a product
export async function getProductImages(productId: number) {
  try {
    return await db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, productId))
      .orderBy(asc(productImage.sortOrder))
  } catch (error) {
    console.error('[v0] Error fetching product images:', error)
    return []
  }
}

// Add image to product gallery
export async function addProductImage(data: {
  productId: number
  url: string
  pathname: string
  alt?: string
  isPrimary?: boolean
}) {
  await requireAdmin()
  
  // Get current max sortOrder
  const existingImages = await db
    .select()
    .from(productImage)
    .where(eq(productImage.productId, data.productId))
  
  const maxSortOrder = existingImages.reduce((max, img) => Math.max(max, img.sortOrder), -1)
  
  // If this is set as primary, unset other primary images
  if (data.isPrimary) {
    await db
      .update(productImage)
      .set({ isPrimary: false })
      .where(eq(productImage.productId, data.productId))
  }
  
  // If this is the first image, make it primary
  const isPrimary = existingImages.length === 0 ? true : data.isPrimary ?? false
  
  const [newImage] = await db
    .insert(productImage)
    .values({
      productId: data.productId,
      url: data.url,
      pathname: data.pathname,
      alt: data.alt,
      sortOrder: maxSortOrder + 1,
      isPrimary,
    })
    .returning()
  
  // Update product's main imageUrl if this is primary
  if (isPrimary) {
    await db
      .update(product)
      .set({ imageUrl: data.url })
      .where(eq(product.id, data.productId))
  }
  
  // Get product slug for revalidation
  const [prod] = await db.select().from(product).where(eq(product.id, data.productId))
  revalidateProductPages(prod?.slug)
  
  return newImage
}

// Delete image from product gallery
export async function deleteProductImage(imageId: number) {
  await requireAdmin()
  
  // Get image info before deleting
  const [image] = await db.select().from(productImage).where(eq(productImage.id, imageId))
  if (!image) return
  
  // Delete from Vercel Blob using pathname
  try {
    // For private blobs, we need to delete by pathname
    // The url field stores the API route URL, not the blob URL
    // So we use the pathname field instead
    if (image.pathname) {
      await del(image.pathname)
    }
  } catch (error) {
    console.error('[v0] Error deleting blob:', error)
    // Continue even if blob delete fails - the DB record should still be removed
  }
  
  // Delete from database
  await db.delete(productImage).where(eq(productImage.id, imageId))
  
  // If this was primary, set another image as primary
  if (image.isPrimary) {
    const [nextImage] = await db
      .select()
      .from(productImage)
      .where(eq(productImage.productId, image.productId))
      .orderBy(asc(productImage.sortOrder))
      .limit(1)
    
    if (nextImage) {
      await db
        .update(productImage)
        .set({ isPrimary: true })
        .where(eq(productImage.id, nextImage.id))
      
      // Update product's main imageUrl
      await db
        .update(product)
        .set({ imageUrl: nextImage.url })
        .where(eq(product.id, image.productId))
    } else {
      // No more images, clear product's imageUrl
      await db
        .update(product)
        .set({ imageUrl: null })
        .where(eq(product.id, image.productId))
    }
  }
  
  // Get product slug for revalidation
  const [prod] = await db.select().from(product).where(eq(product.id, image.productId))
  revalidateProductPages(prod?.slug)
}

// Set image as primary
export async function setImageAsPrimary(imageId: number) {
  await requireAdmin()
  
  const [image] = await db.select().from(productImage).where(eq(productImage.id, imageId))
  if (!image) return
  
  // Unset all other primary images for this product
  await db
    .update(productImage)
    .set({ isPrimary: false })
    .where(eq(productImage.productId, image.productId))
  
  // Set this image as primary
  await db
    .update(productImage)
    .set({ isPrimary: true })
    .where(eq(productImage.id, imageId))
  
  // Update product's main imageUrl
  await db
    .update(product)
    .set({ imageUrl: image.url })
    .where(eq(product.id, image.productId))
  
  // Get product slug for revalidation
  const [prod] = await db.select().from(product).where(eq(product.id, image.productId))
  revalidateProductPages(prod?.slug)
}

// Update image sort order
export async function updateImageSortOrder(imageId: number, newSortOrder: number) {
  await requireAdmin()
  
  await db
    .update(productImage)
    .set({ sortOrder: newSortOrder })
    .where(eq(productImage.id, imageId))
}

// Update image alt text
export async function updateImageAlt(imageId: number, alt: string) {
  await requireAdmin()
  
  await db
    .update(productImage)
    .set({ alt })
    .where(eq(productImage.id, imageId))
}
