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
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            {title}
          </h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed">
            {description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {contactInfo?.phone?.trim() && (
              <a 
                href={`tel:${contactInfo.phone.replace(/\s/g, '')}`} 
                className="inline-flex h-9 gap-1.5 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Phone className="h-5 w-5" />
                {contactText}
              </a>
            )}
            <Link href={`/${locale}/produkte`} className="inline-flex h-9 gap-1.5 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-700">
              <FileText className="h-5 w-5" />
              {catalogText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
