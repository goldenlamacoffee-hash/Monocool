import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ContactSettingsManager } from '@/components/admin/contact-settings-manager'
import { getAllSiteSettings } from '@/app/actions/site-settings'
import { type Locale } from '@/i18n/config'
import { getSessionWithRole } from '@/lib/auth-utils'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const { session, role } = await getSessionWithRole()

  if (!session?.user || role !== 'admin') {
    redirect(`/${locale}/anmelden`)
  }

  const allSettings = await getAllSiteSettings()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <ContactSettingsManager 
            initialSettings={allSettings}
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
