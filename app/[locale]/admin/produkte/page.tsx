import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductsManager } from '@/components/admin/products-manager'
import { getAllProductsByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'
import { getSessionWithRole } from '@/lib/auth-utils'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const { session, role } = await getSessionWithRole()

  if (!session?.user || role !== 'admin') {
    redirect(`/${locale}/anmelden`)
  }

  const products = await getAllProductsByLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ProductsManager initialProducts={products} locale={locale} />
      </main>
      <Footer />
    </div>
  )
}
