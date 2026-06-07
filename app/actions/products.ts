'use server'

import { db } from '@/lib/db'
import { product, cmsContent } from '@/lib/db/schema'
import { eq, asc, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { unstable_noStore as noStore } from 'next/cache'
import { getFallbackProducts } from '@/lib/data/products-fallback'
import { assertAdmin } from '@/lib/auth-utils'
import { getDomainFromLocale } from '@/lib/domain-utils'

// Check database availability at runtime
function isDatabaseAvailable() {
  return !!process.env.DATABASE_URL
}

// Public product queries - with domain filtering
export async function getProducts(domain?: string) {
  noStore()
  
  if (!isDatabaseAvailable()) {
    return getFallbackProducts(domain).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  }
  
  try {
    if (domain) {
      const result = await db.select().from(product)
        .where(and(eq(product.isActive, true), eq(product.domain, domain)))
        .orderBy(asc(product.sortOrder))
      return result
    }
    const result = await db.select().from(product).where(eq(product.isActive, true)).orderBy(asc(product.sortOrder))
    return result
  } catch (error) {
    console.error('[v0] Error fetching products, using fallback:', error)
    return getFallbackProducts(domain).filter(p => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder)
  }
}

export async function getProductsByLocale(locale: string) {
  const domain = getDomainFromLocale(locale)
  return getProducts(domain)
}

export async function getProductBySlug(slug: string, domain?: string) {
  noStore()
  
  if (!isDatabaseAvailable()) {
    return getFallbackProducts(domain).find(p => p.slug === slug)
  }
  
  try {
    if (domain) {
      const [result] = await db.select().from(product)
        .where(and(eq(product.slug, slug), eq(product.domain, domain)))
      return result
    }
    const [result] = await db.select().from(product).where(eq(product.slug, slug))
    return result
  } catch (error) {
    console.error('[v0] Error fetching product by slug, using fallback:', error)
    return getFallbackProducts(domain).find(p => p.slug === slug)
  }
}

export async function getProductBySlugAndLocale(slug: string, locale: string) {
  const domain = getDomainFromLocale(locale)
  return getProductBySlug(slug, domain)
}

// Helper to revalidate product pages across all locales
function revalidateProductPages(slug?: string) {
  const locales = ['de', 'en', 'cs', 'sk']
  locales.forEach(locale => {
    revalidatePath(`/${locale}`)
    revalidatePath(`/${locale}/produkte`)
    revalidatePath(`/${locale}/fan-coil`)
    if (slug) {
      revalidatePath(`/${locale}/produkte/${slug}`)
      revalidatePath(`/${locale}/fan-coil/${slug}`)
    }
  })
}

// Admin product mutations - with domain
export async function createProduct(data: {
  name: string
  slug: string
  description?: string
  shortDescription?: string
  price?: number
  category?: string
  coolingCapacity?: string
  heatingCapacity?: string
  energyClass?: string
  noiseLevel?: string
  dimensions?: string
  weight?: string
  features?: string[]
  technicalData?: string
  specifications?: Record<string, string>
  domain?: string
}) {
  await assertAdmin()
  const { price, ...rest } = data
  const [newProduct] = await db.insert(product).values({
    ...rest,
    ...(price !== undefined ? { price: price.toString() } : {}),
    domain: data.domain || 'monocool.at'
  }).returning()
  revalidateProductPages(newProduct.slug)
  return newProduct
}

export async function updateProduct(
  id: number,
  data: Partial<{
    name: string
    slug: string
    description: string
    shortDescription: string
    price: number
    category: string
    coolingCapacity: string
    heatingCapacity: string
    energyClass: string
    noiseLevel: string
    dimensions: string
    weight: string
    features: string[]
    technicalData: string
    specifications: Record<string, string>
    isActive: boolean
    sortOrder: number
    domain: string
  }>
) {
  await assertAdmin()
  const { price, ...rest } = data
  const [updated] = await db
    .update(product)
    .set({
      ...rest,
      ...(price !== undefined ? { price: price.toString() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(product.id, id))
    .returning()
  revalidateProductPages(updated.slug)
  return updated
}

export async function deleteProduct(id: number) {
  await assertAdmin()
  const [productToDelete] = await db.select().from(product).where(eq(product.id, id))
  await db.delete(product).where(eq(product.id, id))
  revalidateProductPages(productToDelete?.slug)
}

export async function toggleProductActive(id: number, isActive: boolean) {
  await assertAdmin()
  const [updated] = await db
    .update(product)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(product.id, id))
    .returning()
  revalidateProductPages(updated.slug)
  return updated
}

export async function getAllProducts(domain?: string) {
  noStore()
  
  if (!isDatabaseAvailable()) {
    return fallbackProducts.sort((a, b) => a.sortOrder - b.sortOrder)
  }
  
  try {
    if (domain) {
      return await db.select().from(product)
        .where(eq(product.domain, domain))
        .orderBy(asc(product.sortOrder))
    }
    return await db.select().from(product).orderBy(asc(product.sortOrder))
  } catch (error) {
    console.error('[v0] Error fetching all products, using fallback:', error)
    return fallbackProducts.sort((a, b) => a.sortOrder - b.sortOrder)
  }
}

export async function getAllProductsByLocale(locale: string) {
  const domain = getDomainFromLocale(locale)
  return getAllProducts(domain)
}

// Get products by category with domain filtering
export async function getProductsByCategory(category: string, domain?: string) {
  noStore()
  
  if (!isDatabaseAvailable()) {
    return fallbackProducts.filter(p => p.isActive && p.category === category).sort((a, b) => a.sortOrder - b.sortOrder)
  }
  
  try {
    const conditions = [eq(product.isActive, true), eq(product.category, category)]
    if (domain) {
      conditions.push(eq(product.domain, domain))
    }
    
    const result = await db
      .select()
      .from(product)
      .where(and(...conditions))
      .orderBy(asc(product.sortOrder))
    return result
  } catch (error) {
    console.error('[v0] Error fetching products by category:', error)
    return []
  }
}

export async function getProductsByCategoryAndLocale(category: string, locale: string) {
  const domain = getDomainFromLocale(locale)
  return getProductsByCategory(category, domain)
}

// CMS Content with domain filtering
export async function getCmsContent(key: string, domain?: string) {
  noStore()
  try {
    if (domain) {
      const [content] = await db.select().from(cmsContent)
        .where(and(eq(cmsContent.key, key), eq(cmsContent.domain, domain)))
      return content
    }
    const [content] = await db.select().from(cmsContent).where(eq(cmsContent.key, key))
    return content
  } catch (error) {
    console.error('[v0] Error fetching CMS content:', error)
    return null
  }
}

export async function getCmsContentByLocale(key: string, locale: string) {
  const domain = getDomainFromLocale(locale)
  return getCmsContent(key, domain)
}

export async function getAllCmsContent(domain?: string) {
  noStore()
  try {
    if (domain) {
      return await db.select().from(cmsContent).where(eq(cmsContent.domain, domain))
    }
    return await db.select().from(cmsContent)
  } catch (error) {
    console.error('[v0] Error fetching all CMS content:', error)
    return []
  }
}

export async function getAllCmsContentByLocale(locale: string) {
  const domain = getDomainFromLocale(locale)
  return getAllCmsContent(domain)
}

export async function upsertCmsContent(data: {
  key: string
  title?: string
  subtitle?: string
  content?: string
  imageUrl?: string
  gallery?: string[]
  metadata?: Record<string, unknown>
  domain?: string
}) {
  await assertAdmin()
  const domain = data.domain || 'monocool.at'
  
  // Check if exists for this key AND domain combination
  const existing = await getCmsContent(data.key, domain)
  
  if (existing) {
    const [updated] = await db
      .update(cmsContent)
      .set({ ...data, domain, updatedAt: new Date() })
      .where(and(eq(cmsContent.key, data.key), eq(cmsContent.domain, domain)))
      .returning()
    revalidateProductPages()
    return updated
  } else {
    const [created] = await db.insert(cmsContent).values({ ...data, domain }).returning()
    revalidateProductPages()
    return created
  }
}

// Get multiple CMS entries by key prefix with domain filtering
export async function getCmsContentByPrefix(prefix: string, domain?: string) {
  noStore()
  try {
    const results = domain 
      ? await db.select().from(cmsContent).where(eq(cmsContent.domain, domain))
      : await db.select().from(cmsContent)
    return results.filter(item => item.key.startsWith(prefix))
  } catch (error) {
    console.error('[v0] Error fetching CMS content by prefix:', error)
    return []
  }
}

export async function getCmsContentByPrefixAndLocale(prefix: string, locale: string) {
  const domain = getDomainFromLocale(locale)
  return getCmsContentByPrefix(prefix, domain)
}

// Get homepage CMS content with domain filtering
export async function getHomepageCmsContent(domain?: string) {
  noStore()
  try {
    const results = domain 
      ? await db.select().from(cmsContent).where(eq(cmsContent.domain, domain))
      : await db.select().from(cmsContent)
    
    const relevantContent = results.filter(item => 
      item.key.startsWith('homepage_') || 
      item.key.startsWith('about_') || 
      item.key.startsWith('footer_')
    )
    return relevantContent.reduce((acc, item) => {
      acc[item.key] = item
      return acc
    }, {} as Record<string, typeof results[0]>)
  } catch (error) {
    console.error('[v0] Error fetching homepage CMS content:', error)
    return {}
  }
}

export async function getHomepageCmsContentByLocale(locale: string) {
  const domain = getDomainFromLocale(locale)
  return getHomepageCmsContent(domain)
}

// Get fan-coil CMS content with domain filtering
export async function getFancoilCmsContent(domain?: string) {
  noStore()
  try {
    const results = domain 
      ? await db.select().from(cmsContent).where(eq(cmsContent.domain, domain))
      : await db.select().from(cmsContent)
    
    const relevantContent = results.filter(item => item.key.startsWith('fancoil_'))
    return relevantContent.reduce((acc, item) => {
      acc[item.key] = item
      return acc
    }, {} as Record<string, typeof results[0]>)
  } catch (error) {
    console.error('[v0] Error fetching fan-coil CMS content:', error)
    return {}
  }
}

export async function getFancoilCmsContentByLocale(locale: string) {
  const domain = getDomainFromLocale(locale)
  return getFancoilCmsContent(domain)
}
