'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react'
import { type Locale } from '@/i18n/config'

export default function AdminSetupPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as Locale
  const t = useTranslations('admin.setup')
  const [formData, setFormData] = useState({
    secret: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate
    if (!formData.secret) {
      setError(t('errors.secretRequired'))
      return
    }

    if (!formData.name || formData.name.length < 2) {
      setError(t('errors.nameRequired'))
      return
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError(t('errors.emailRequired'))
      return
    }

    if (formData.password.length < 8) {
      setError(t('errors.passwordLength'))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: formData.secret,
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || t('errors.setupFailed'))
        setLoading(false)
        return
      }

      setSuccess(data.message)
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/anmelden`)
      }, 2000)

    } catch (err) {
      setError(t('errors.unexpected'))
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="secret">{t('setupSecret')} *</Label>
              <div className="relative">
                <Input
                  id="secret"
                  type={showSecret ? 'text' : 'password'}
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder={t('setupSecretPlaceholder')}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('setupSecretHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t('fullName')} *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('fullNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')} *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('emailPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')} *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder={t('confirmPasswordPlaceholder')}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || !!success}>
              {loading ? t('creatingAdmin') : t('createAdmin')}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <Link href={`/${locale}/anmelden`} className="text-primary hover:underline">
                {t('backToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
