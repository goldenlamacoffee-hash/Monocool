import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { getDomainFromLocale } from '@/lib/domain-utils'

// Markets a partner/customer account can belong to (V1.4E.1). Foundation only —
// no access is enforced here; we just record where the account registered.
const ALLOWED_MARKETS = ['monocool.at', 'monocool.sk', 'monocool.cz', 'monocool.eu']

/**
 * Resolve the market for a new registration, server-side and untrusted-input safe.
 * Prefers the real request host (production domains force their own locale), and
 * falls back to the locale the form was rendered in (covers preview/localhost).
 */
function resolveRegistrationMarket(host: string | null, locale?: unknown): string | undefined {
  const cleanHost = (host ?? '').replace(/^www\./, '').split(':')[0]
  if (ALLOWED_MARKETS.includes(cleanHost)) return cleanHost
  if (typeof locale === 'string' && locale) {
    const fromLocale = getDomainFromLocale(locale)
    if (ALLOWED_MARKETS.includes(fromLocale)) return fromLocale
  }
  return undefined
}

export async function POST(request: Request) {
  try {
    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const market = resolveRegistrationMarket(requestHeaders.get('host'), data.locale)

    await db
      .update(user)
      .set({
        companyName: data.companyName,
        companyId: data.companyId,
        vatNumber: data.vatNumber,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
        // Record the registration market once; never overwrite an existing value
        // (admins stay NULL because they are not created through this flow).
        ...(market ? { market: sql`COALESCE(${user.market}, ${market})` } : {}),
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [profile] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
