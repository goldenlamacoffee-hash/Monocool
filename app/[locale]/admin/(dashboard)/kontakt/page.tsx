import { setRequestLocale } from 'next-intl/server'
import { ContactSettingsManager } from '@/components/admin/contact-settings-manager'
import { getAllSiteSettings } from '@/app/actions/site-settings'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminContactPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const allSettings = await getAllSiteSettings()

  return <ContactSettingsManager initialSettings={allSettings} locale={locale} />
}
