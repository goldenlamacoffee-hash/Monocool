'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { type Locale } from '@/i18n/config'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale() as Locale
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      if (mode === 'sign-up') {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        })
        if (error) throw new Error(error.message)
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        })
        if (error) throw new Error(error.message)
      }
      router.push(`/${locale}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">
          {mode === 'sign-in' ? t('loginTitle') : t('registerTitle')}
        </CardTitle>
        <CardDescription>
          {mode === 'sign-in' ? t('loginSubtitle') : t('registerSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'sign-up' && (
            <div className="space-y-2">
              <Label htmlFor="name">{t('name')}</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Max Mustermann"
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="********"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? tCommon('loading')
              : mode === 'sign-in'
                ? t('loginButton')
                : t('registerButton')}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'sign-in' ? (
              <>
                {t('noAccount')}{' '}
                <Link href={`/${locale}/registrieren`} className="text-primary hover:underline">
                  {t('registerLink')}
                </Link>
              </>
            ) : (
              <>
                {t('hasAccount')}{' '}
                <Link href={`/${locale}/anmelden`} className="text-primary hover:underline">
                  {t('loginLink')}
                </Link>
              </>
            )}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
