import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { CMSManager } from '@/components/admin/cms-manager'
import { getAllCmsContentByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'
import { getSessionWithRole } from '@/lib/auth-utils'
import { AdminMarketSelector } from '@/components/admin/market-selector'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminCMSPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const { session, role } = await getSessionWithRole()

  if (!session?.user || role !== 'admin') {
    redirect(`/${locale}/anmelden`)
  }

  const cmsContent = await getAllCmsContentByLocale(locale)

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <AdminMarketSelector locale={locale} />
        </div>
        <CMSManager initialContent={cmsContent} locale={locale} />
      </main>
      <Footer />
    </div>
  )
}
