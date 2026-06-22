import { redirect } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { AuthForm } from '@/components/auth-form'
import { type Locale } from '@/i18n/config'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function SignInPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  
  const session = await auth.api.getSession({ headers: await headers() })
  
  if (session?.user) {
    redirect(`/${locale}`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-soft-ice px-4 py-16">
        <AuthForm mode="sign-in" />
      </main>
      <Footer />
    </div>
  )
}
