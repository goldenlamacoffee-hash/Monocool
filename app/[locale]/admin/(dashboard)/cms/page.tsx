import { setRequestLocale } from 'next-intl/server'
import { CMSManager } from '@/components/admin/cms-manager'
import { getAllCmsContentByLocale } from '@/app/actions/products'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function AdminCMSPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  const cmsContent = await getAllCmsContentByLocale(locale)

  return <CMSManager initialContent={cmsContent} locale={locale} />
}
