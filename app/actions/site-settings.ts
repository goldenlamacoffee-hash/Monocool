'use server'

import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth-utils'

export type SiteSettings = {
  id: number
  domain: string
  companyName: string | null
  email: string | null
  emailSales: string | null
  emailSupport: string | null
  phone: string | null
  phoneSecondary: string | null
  fax: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  companyId: string | null
  vatNumber: string | null
  registrationCourt: string | null
  registrationNumber: string | null
  responsiblePerson: string | null
  facebook: string | null
  instagram: string | null
  linkedin: string | null
  youtube: string | null
  businessHours: string | null
  seoTitle: string | null
  seoDescription: string | null
  ogImage: string | null
  createdAt: Date
  updatedAt: Date
}

// Default fallback settings
const defaultSettings: Omit<SiteSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  domain: 'monocool.at',
  companyName: 'MonoCool GmbH',
  email: 'info@monocool.at',
  emailSales: 'verkauf@monocool.at',
  emailSupport: 'support@monocool.at',
  phone: null,
  phoneSecondary: null,
  fax: null,
  address: null,
  city: null,
  postalCode: null,
  country: 'Österreich',
  companyId: null,
  vatNumber: null,
  registrationCourt: null,
  registrationNumber: null,
  responsiblePerson: null,
  facebook: null,
  instagram: null,
  linkedin: null,
  youtube: null,
  businessHours: 'Mo-Fr 9:00-17:00',
  seoTitle: null,
  seoDescription: null,
  ogImage: null,
}

// Map locale to domain
function localeToDomain(locale: string): string {
  switch (locale) {
    case 'sk':
      return 'monocool.sk'
    case 'cs':
      return 'monocool.cz'
    case 'en':
      return 'monocool.eu'
    case 'de':
    default:
      return 'monocool.at'
  }
}

// Get settings for a specific domain
export async function getSiteSettings(domain: string): Promise<SiteSettings> {
  try {
    const result = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.domain, domain))
      .limit(1)

    if (result.length > 0) {
      return result[0] as SiteSettings
    }

    // Return default settings with the requested domain
    return {
      ...defaultSettings,
      domain,
      id: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteSettings
  } catch (error) {
    console.error('Error fetching site settings:', error)
    return {
      ...defaultSettings,
      domain,
      id: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as SiteSettings
  }
}

// Get settings by locale (convenience function)
export async function getSiteSettingsByLocale(locale: string): Promise<SiteSettings> {
  const domain = localeToDomain(locale)
  return getSiteSettings(domain)
}

// Get all site settings
export async function getAllSiteSettings(): Promise<SiteSettings[]> {
  try {
    const result = await db.select().from(siteSettings)
    return result as SiteSettings[]
  } catch (error) {
    console.error('Error fetching all site settings:', error)
    return []
  }
}

// Create or update site settings
export async function upsertSiteSettings(
  domain: string,
  data: Partial<Omit<SiteSettings, 'id' | 'domain' | 'createdAt' | 'updatedAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()

    // Check if settings exist for this domain
    const existing = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.domain, domain))
      .limit(1)

    if (existing.length > 0) {
      // Update existing
      await db
        .update(siteSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(siteSettings.domain, domain))
    } else {
      // Insert new
      await db.insert(siteSettings).values({
        domain,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error upserting site settings:', error)
    return { success: false, error: 'Failed to save settings' }
  }
}

// Delete site settings for a domain
export async function deleteSiteSettings(domain: string): Promise<{ success: boolean; error?: string }> {
  try {
    await assertAdmin()
    await db.delete(siteSettings).where(eq(siteSettings.domain, domain))
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Error deleting site settings:', error)
    return { success: false, error: 'Failed to delete settings' }
  }
}
