import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Card, CardContent } from '@/components/ui/card'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'legal.privacy' })
  
  return {
    title: `${t('title')} | MonoCool`,
    description: t('intro').substring(0, 160),
  }
}

export default async function DatenschutzPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal.privacy')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{t('title')}</h1>
          
          <p className="mt-6 text-muted-foreground">{t('intro')}</p>

          <div className="mt-8 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('responsible')}</h2>
                <p className="mt-4 text-muted-foreground">{t('responsibleText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('dataCollection')}</h2>
                <p className="mt-4 text-muted-foreground">{t('dataCollectionText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('cookies')}</h2>
                <p className="mt-4 text-muted-foreground">{t('cookiesText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('rights')}</h2>
                <p className="mt-4 text-muted-foreground">{t('rightsText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('contact')}</h2>
                <p className="mt-4 text-muted-foreground">{t('contactText')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground">{t('updates')}</h2>
                <p className="mt-4 text-muted-foreground">{t('updatesText')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
