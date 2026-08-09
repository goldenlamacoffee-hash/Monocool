import { setRequestLocale } from 'next-intl/server'
import { ProductsManager } from '@/components/admin/products-manager'
import { getAllProductsByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'
import { isOwnerAdmin } from '@/lib/owner-auth'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // isOwnerAdmin() is resolved server-side, fresh, from the DB-verified role
  // and the MONOCOOL_OWNER_ADMIN_EMAILS allowlist (see lib/owner-auth.ts).
  // This is a rendering gate only — every internal-costs server action
  // re-verifies with assertOwnerAdmin() independently of this flag.
  const [products, isOwner] = await Promise.all([
    getAllProductsByLocale(locale),
    isOwnerAdmin(),
  ])

  return <ProductsManager initialProducts={products} locale={locale} isOwner={isOwner} />
}
