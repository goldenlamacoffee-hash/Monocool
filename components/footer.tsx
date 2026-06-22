'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Mail, Phone, MapPin } from 'lucide-react'
import { type Locale } from '@/i18n/config'

export interface FooterContactInfo {
  email?: string | null
  phone?: string | null
  city?: string | null
  country?: string | null
}

interface FooterProps {
  contactInfo?: FooterContactInfo
}

export function Footer({ contactInfo }: FooterProps) {
  const t = useTranslations('footer')
  const tNav = useTranslations('nav')
  const locale = useLocale() as Locale
  
  // Only show contact details that actually exist. Never render invented
  // contact data — if a value is missing, hide that row entirely.
  const email = contactInfo?.email?.trim() || null
  const phone = contactInfo?.phone?.trim() || null
  const location = contactInfo?.city && contactInfo?.country
    ? `${contactInfo.city}, ${contactInfo.country}`
    : null
  const hasContact = Boolean(email || phone || location)

  return (
    <footer className="bg-soft-navy text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Wordmark & Description (text wordmark used on dark per brand manual) */}
          <div className="md:col-span-2">
            <span className="font-heading text-2xl font-semibold tracking-tight text-primary-foreground">
              Mono<span className="text-[color:var(--mono-steel)]">Cool</span>
            </span>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/70">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--mono-steel)]">{t('quickLinks')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={`/${locale}/produkte`} className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  {tNav('products')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/fan-coil`} className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  Fan Coil
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#vorteile`} className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  {tNav('benefits')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/impressum`} className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  {t('imprint')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/datenschutz`} className="text-primary-foreground/70 transition-colors hover:text-primary-foreground">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--mono-steel)]">{t('contact')}</h3>
            {hasContact ? (
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                {email && (
                  <li className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 shrink-0 text-[color:var(--mono-steel)]" />
                    <a href={`mailto:${email}`} className="break-all transition-colors hover:text-primary-foreground">
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-2.5">
                    <Phone className="h-4 w-4 shrink-0 text-[color:var(--mono-steel)]" />
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="transition-colors hover:text-primary-foreground">
                      {phone}
                    </a>
                  </li>
                )}
                {location && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--mono-steel)]" />
                    <span>{location}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-primary-foreground/70">{t('location')}</p>
            )}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} MonoCool. {t('rights')}</p>
        </div>
      </div>
    </footer>
  )
}
