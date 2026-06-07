'use client'

import Link from 'next/link'
import Image from 'next/image'
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
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <Image src="/logo.png" alt="MonoCool Logo" width={140} height={42} className="h-10 w-auto" />
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/produkte`} className="text-muted-foreground hover:text-primary">
                  {tNav('products')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}#vorteile`} className="text-muted-foreground hover:text-primary">
                  {tNav('benefits')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/impressum`} className="text-muted-foreground hover:text-primary">
                  {t('imprint')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/datenschutz`} className="text-muted-foreground hover:text-primary">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">{t('contact')}</h3>
            {hasContact ? (
              <ul className="space-y-3 text-sm text-muted-foreground">
                {email && (
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${email}`} className="hover:text-primary">
                      {email}
                    </a>
                  </li>
                )}
                {phone && (
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-primary">
                      {phone}
                    </a>
                  </li>
                )}
                {location && (
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{location}</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('location')}</p>
            )}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} MonoCool. {t('rights')}</p>
        </div>
      </div>
    </footer>
  )
}
