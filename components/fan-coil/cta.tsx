'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { motion } from 'framer-motion'
import { ArrowRight, FileText, Phone } from 'lucide-react'

interface CmsContent {
  title: string | null
  content: string | null
  imageUrl: string | null
  metadata: Record<string, string> | null
}

interface ContactInfo {
  email?: string | null
  phone?: string | null
}

interface FanCoilCTAProps {
  cmsContent?: CmsContent | null
  contactInfo?: ContactInfo
}

export function FanCoilCTA({ cmsContent, contactInfo }: FanCoilCTAProps) {
  const t = useTranslations('fanCoil.cta')
  const locale = useLocale()
  
  // Use CMS content with translation fallbacks
  const title = cmsContent?.title || t('title')
  const description = cmsContent?.content || t('description')
  const contactText = cmsContent?.metadata?.contactText || t('contact')
  const catalogText = cmsContent?.metadata?.catalogText || t('catalog')

  return (
    <section className="bg-soft-navy py-20 text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-6 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h2>
          <p className="mb-10 text-lg leading-relaxed text-white/70">
            {description}
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            {contactInfo?.phone?.trim() && (
              <a 
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} 
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-secondary px-6 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                <Phone className="h-5 w-5" aria-hidden="true" />
                {contactText}
              </a>
            )}
            <Link href={`/${locale}/produkte`} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10">
              <FileText className="h-5 w-5" aria-hidden="true" />
              {catalogText}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
