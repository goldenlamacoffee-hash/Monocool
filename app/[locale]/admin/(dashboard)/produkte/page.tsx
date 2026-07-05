import { setRequestLocale } from 'next-intl/server'
import { ProductsManager } from '@/components/admin/products-manager'
import { getAllProductsByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const products = await getAllProductsByLocale(locale)

  return <ProductsManager initialProducts={products} locale={locale} />
}
