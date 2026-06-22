import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { PageHero } from '@/components/site/page-hero'
import { SectionHeader } from '@/components/site/section-header'
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

  // Group products by category. The two known categories are
  // `klimageraete` (air conditioners without outdoor unit) and `fancoil`.
  const monoblock = products.filter((p) => p.category === 'klimageraete')
  const fancoil = products.filter((p) => p.category === 'fancoil')
  const other = products.filter(
    (p) => p.category !== 'klimageraete' && p.category !== 'fancoil',
  )

  const sections = [
    {
      id: 'klimageraete',
      title: t('sectionMonoblock.title'),
      description: t('sectionMonoblock.description'),
      items: monoblock,
    },
    {
      id: 'fancoil',
      title: t('sectionFancoil.title'),
      description: t('sectionFancoil.description'),
      items: fancoil,
    },
  ].filter((section) => section.items.length > 0)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <PageHero eyebrow="MonoCool" title={t('title')} description={t('subtitle')} />

        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          {products.length > 0 ? (
            <div className="flex flex-col gap-16">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <SectionHeader
                    eyebrow="MonoCool"
                    title={section.title}
                    description={section.description}
                  />
                  <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))}

              {other.length > 0 && (
                <section className="scroll-mt-24">
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {other.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              )}
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
