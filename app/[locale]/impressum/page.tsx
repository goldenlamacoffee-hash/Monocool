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
  const t = await getTranslations({ locale, namespace: 'legal.imprint' })
  
  return {
    title: `${t('title')} | MonoCool`,
    description: t('companyInfo'),
  }
}

export default async function ImpressumPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('legal.imprint')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-soft-ice">
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
            <p className="eyebrow">MonoCool</p>
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">{t('title')}</h1>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('companyInfo')}</h2>
                <div className="mt-4 space-y-1 text-muted-foreground">
                  <p className="font-medium text-foreground">{t('companyName')}</p>
                  <p>{t('address')}</p>
                  <p>{t('city')}</p>
                  <p>{t('country')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('contact')}</h2>
                <div className="mt-4 space-y-1 text-muted-foreground">
                  <p>{t('phone')}</p>
                  <p>{t('email')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('registration')}</h2>
                <div className="mt-4 space-y-1 text-muted-foreground">
                  <p>{t('registrationInfo')}</p>
                  <p>{t('registrationNumber')}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('vatId')}</h2>
                <p className="mt-4 text-muted-foreground">{t('vatIdNumber')}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('responsible')}</h2>
                <p className="mt-4 text-muted-foreground">{t('responsibleName')}</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-6">
                <h2 className="font-heading text-xl font-semibold text-foreground">{t('dispute')}</h2>
                <p className="mt-4 text-muted-foreground">{t('disputeText')}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
