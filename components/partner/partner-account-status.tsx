'use client'

// components/partner/partner-account-status.tsx
// Status page for pending and rejected partners.
// Spec §1D and §1E.

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Clock, Ban, Mail, ArrowLeft } from 'lucide-react'

interface PartnerAccountStatusProps {
  status: 'pending' | 'rejected'
  locale: string
  contactEmail: string | null
}

export function PartnerAccountStatus({ status, locale, contactEmail }: PartnerAccountStatusProps) {
  const t = useTranslations('partnerPortal')

  const isPending = status === 'pending'

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-[color:var(--mono-line)] bg-white p-8 shadow-sm text-center">
        {/* Icon */}
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${
            isPending
              ? 'bg-amber-50 text-amber-500'
              : 'bg-red-50 text-red-500'
          }`}
        >
          {isPending
            ? <Clock className="h-8 w-8" aria-hidden="true" />
            : <Ban className="h-8 w-8" aria-hidden="true" />
          }
        </div>

        {/* Title */}
        <h1 className="font-heading text-2xl font-semibold text-[color:var(--mono-navy)] mb-3">
          {isPending ? t('status.pendingTitle') : t('status.rejectedTitle')}
        </h1>

        {/* Description */}
        <p className="text-sm text-[color:var(--mono-muted)] leading-relaxed mb-6">
          {isPending ? t('status.pendingDescription') : t('status.rejectedDescription')}
        </p>

        {/* Contact for rejected */}
        {!isPending && contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[color:var(--mono-ice)] px-4 py-2.5 text-sm font-medium text-[color:var(--mono-navy)] hover:bg-[color:var(--mono-line)] transition-colors mb-6"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            {contactEmail}
          </a>
        )}

        {/* Back link */}
        <div className="border-t border-[color:var(--mono-line)] pt-5 mt-2">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('status.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
