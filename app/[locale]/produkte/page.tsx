import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { PageHero } from '@/components/site/page-hero'
import { getProductsByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'
import { PackageSearch } from 'lucide-react'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations('products')
  const products = await getProductsByLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PageHero eyebrow="MonoCool" title={t('title')} description={t('subtitle')} />

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-secondary">
                <PackageSearch className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-medium text-foreground">{t('notFound')}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
