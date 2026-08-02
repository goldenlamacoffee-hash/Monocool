'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { User, Building2, Shield, Check, Loader2, AlertCircle } from 'lucide-react'
import { updateMyPartnerProfile, type UpdateProfileInput } from '@/app/actions/partner-portal'

interface ProfileClientProps {
  locale: string
  initial: {
    name: string
    email: string
    role: string
    status: string
    market: string
    marketName: string
    discountPercent: number
    partnerTier: string | null
    createdAt: Date
    companyName: string
    companyId: string
    vatNumber: string
    phone: string
    address: string
    city: string
    postalCode: string
    country: string
  }
}

export function ProfileClient({ locale, initial }: ProfileClientProps) {
  const t = useTranslations('partnerPortal')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateProfileInput>({
    name: initial.name,
    companyName: initial.companyName,
    companyId: initial.companyId,
    vatNumber: initial.vatNumber,
    phone: initial.phone,
    address: initial.address,
    city: initial.city,
    postalCode: initial.postalCode,
    country: initial.country,
  })

  const set = (field: keyof UpdateProfileInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    setSuccess(false)
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    startTransition(async () => {
      const result = await updateMyPartnerProfile(locale, form)
      if (result.success) {
        setSuccess(true)
      } else {
        const key = result.error === 'nameRequired' ? 'profile.errorNameRequired' : 'profile.errorSave'
        setError(t(key as 'profile.errorNameRequired'))
      }
    })
  }

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      approved: t('profile.statusApproved'),
      pending: t('profile.statusPending'),
      rejected: t('profile.statusRejected'),
    }
    return map[s] ?? s
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Left: read-only account info */}
      <div className="flex flex-col gap-5">
        {/* Account card */}
        <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--mono-ice)]">
              <Shield className="h-4 w-4 text-[color:var(--mono-steel)]" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)]">{t('profile.accountTitle')}</h2>
          </div>
          <dl className="flex flex-col gap-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.email')}</dt>
              <dd className="mt-0.5 text-[color:var(--mono-navy)] break-all">{initial.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.role')}</dt>
              <dd className="mt-0.5 text-[color:var(--mono-navy)]">{initial.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.status')}</dt>
              <dd className="mt-0.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  initial.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {statusLabel(initial.status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.market')}</dt>
              <dd className="mt-0.5 text-[color:var(--mono-navy)]">{initial.marketName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.discount')}</dt>
              <dd className="mt-0.5 text-[color:var(--mono-navy)]">
                {initial.discountPercent > 0 ? `${initial.discountPercent} %` : t('dashboard.noDiscount')}
              </dd>
            </div>
            {initial.partnerTier && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.tier')}</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-[color:var(--mono-ice)] px-2 py-0.5 text-xs font-semibold text-[color:var(--mono-navy)]">
                    {initial.partnerTier}
                  </span>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('profile.registered')}</dt>
              <dd className="mt-0.5 text-[color:var(--mono-navy)]">{fmtDate(initial.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Right: editable form */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
          {/* Personal details */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--mono-ice)]">
                <User className="h-4 w-4 text-[color:var(--mono-steel)]" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)]">{t('profile.personalTitle')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('profile.name')} required>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  required
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.phone')}>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="field-input"
                />
              </Field>
            </div>
          </div>

          {/* Company details */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--mono-ice)]">
                <Building2 className="h-4 w-4 text-[color:var(--mono-steel)]" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)]">{t('profile.companyTitle')}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('profile.companyName')} className="sm:col-span-2">
                <input
                  id="companyName"
                  type="text"
                  value={form.companyName}
                  onChange={set('companyName')}
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.companyId')}>
                <input
                  id="companyId"
                  type="text"
                  value={form.companyId}
                  onChange={set('companyId')}
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.vatNumber')}>
                <input
                  id="vatNumber"
                  type="text"
                  value={form.vatNumber}
                  onChange={set('vatNumber')}
                  className="field-input"
                />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-4">{t('profile.addressTitle')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('profile.address')} className="sm:col-span-2">
                <input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={set('address')}
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.city')}>
                <input
                  id="city"
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.postalCode')}>
                <input
                  id="postalCode"
                  type="text"
                  value={form.postalCode}
                  onChange={set('postalCode')}
                  className="field-input"
                />
              </Field>
              <Field label={t('profile.country')}>
                <input
                  id="country"
                  type="text"
                  value={form.country}
                  onChange={set('country')}
                  className="field-input"
                />
              </Field>
            </div>
          </div>

          {/* Save / feedback */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--mono-navy)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[color:var(--mono-deep)] disabled:opacity-60 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)]"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {t('profile.save')}
            </button>

            {success && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600" role="status">
                <Check className="h-4 w-4" aria-hidden="true" />
                {t('profile.saveSuccess')}
              </span>
            )}

            {error && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-red-600" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className,
  required,
}: {
  label: string
  children: React.ReactElement
  className?: string
  required?: boolean
}) {
  const id = (children as React.ReactElement<{ id?: string }>).props?.id ?? label
  return (
    <div className={`flex flex-col gap-1 ${className ?? ''}`}>
      <label
        htmlFor={id}
        className="text-xs font-semibold text-[color:var(--mono-navy)]"
      >
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
      </label>
      {children}
    </div>
  )
}
