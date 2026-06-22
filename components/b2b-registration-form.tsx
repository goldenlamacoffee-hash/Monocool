'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { signUp } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Building2, User, Mail, Phone, MapPin } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface B2BRegistrationFormProps {
  locale: Locale
}

const countries = [
  { code: 'AT', name: 'Österreich' },
  { code: 'CZ', name: 'Česká republika' },
  { code: 'SK', name: 'Slovensko' },
  { code: 'DE', name: 'Deutschland' },
  { code: 'HU', name: 'Magyarország' },
  { code: 'PL', name: 'Polska' },
  { code: 'SI', name: 'Slovenija' },
  { code: 'IT', name: 'Italia' },
]

export function B2BRegistrationForm({ locale }: B2BRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)
  const router = useRouter()
  const t = useTranslations('auth')

  // Form state
  const [formData, setFormData] = useState({
    // Personal
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Company
    companyName: '',
    companyId: '',
    vatNumber: '',
    // Address
    address: '',
    city: '',
    postalCode: '',
    country: 'AT',
  })

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError(t('errors.nameRequired'))
      return false
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t('errors.invalidEmail'))
      return false
    }
    if (formData.password.length < 8) {
      setError(t('errors.passwordLength'))
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.companyName.trim()) {
      setError(t('errors.companyRequired'))
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleBack = () => {
    setStep(prev => prev - 1)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep1() || !validateStep2()) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        // Additional fields will be stored via the auth plugin
      })

      if (result.error) {
        setError(result.error.message || t('errors.registrationFailed'))
        return
      }

      // After signup, update the user profile with B2B data
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: formData.companyName,
          companyId: formData.companyId,
          vatNumber: formData.vatNumber,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        }),
      })

      if (!response.ok) {
        console.warn('Failed to save profile data')
      }

      setSuccess(true)
    } catch (err) {
      setError(t('errors.registrationFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="mx-auto w-full max-w-lg rounded-2xl border-border shadow-[0_24px_60px_-30px_rgba(5,25,65,0.35)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-green-600">{t('registrationSuccess')}</CardTitle>
          <CardDescription className="text-base">
            {t('registrationPending')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            {t('registrationPendingDescription')}
          </p>
          <Link 
            href={`/${locale}`}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
          >
            {t('backToHome')}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto w-full max-w-lg rounded-2xl border-border shadow-[0_24px_60px_-30px_rgba(5,25,65,0.35)]">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">{t('registerTitle')}</CardTitle>
        <CardDescription>{t('registerSubtitle')}</CardDescription>
        {/* Progress indicator */}
        <div className="mt-4 flex gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{t('step1')}</span>
          <span>{t('step2')}</span>
          <span>{t('step3')}</span>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-heading text-lg font-semibold">
                <User className="h-5 w-5 text-secondary" aria-hidden="true" />
                {t('personalInfo')}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder={t('phonePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')} *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('confirmPassword')} *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Company Information */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-heading text-lg font-semibold">
                <Building2 className="h-5 w-5 text-secondary" aria-hidden="true" />
                {t('companyInfo')}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">{t('companyName')} *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  placeholder={t('companyNamePlaceholder')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyId">{t('companyId')}</Label>
                <Input
                  id="companyId"
                  value={formData.companyId}
                  onChange={(e) => updateField('companyId', e.target.value)}
                  placeholder={t('companyIdPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vatNumber">{t('vatNumber')}</Label>
                <Input
                  id="vatNumber"
                  value={formData.vatNumber}
                  onChange={(e) => updateField('vatNumber', e.target.value)}
                  placeholder={t('vatNumberPlaceholder')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Address */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 font-heading text-lg font-semibold">
                <MapPin className="h-5 w-5 text-secondary" aria-hidden="true" />
                {t('addressInfo')}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">{t('address')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField('address', e.target.value)}
                  placeholder={t('addressPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{t('postalCode')}</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    placeholder={t('postalCodePlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder={t('cityPlaceholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">{t('country')}</Label>
                <Select value={formData.country} onValueChange={(v) => updateField('country', v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
                {t('back')}
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" onClick={handleNext} className="flex-1">
                {t('next')}
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('register')}
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t('haveAccount')}{' '}
            <Link href={`/${locale}/anmelden`} className="font-semibold text-secondary hover:underline">
              {t('login')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
