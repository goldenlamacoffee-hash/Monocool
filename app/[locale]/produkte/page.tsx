import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { getProducts } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const t = await getTranslations('products')
  const products = await getProducts()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              {t('notFound')}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
