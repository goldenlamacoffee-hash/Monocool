import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { getAllCmsContent } from '@/app/actions/products'
import { CmsManager } from '@/components/admin/cms-manager'

export const metadata = {
  title: 'CMS Inhalte - Admin - MonoCool',
}

export default async function AdminCmsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/anmelden')
  }

  const content = await getAllCmsContent()

  return <CmsManager initialContent={content} />
}
