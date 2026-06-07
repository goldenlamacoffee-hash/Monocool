import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { product } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { ProductsManager } from '@/components/admin/products-manager'

export const metadata = {
  title: 'Produkte verwalten - Admin - MonoCool',
}

export default async function AdminProductsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/anmelden')
  }

  const products = await db.select().from(product).orderBy(asc(product.sortOrder))

  return <ProductsManager initialProducts={products} />
}
