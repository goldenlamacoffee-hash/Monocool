'use client'

import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface CmsContent {
  title: string | null
  subtitle: string | null
  content: string | null
  imageUrl: string | null
  metadata: Record<string, string> | null
}

interface FanCoilHeroProps {
  cmsContent?: CmsContent | null
}

export function FanCoilHero({ cmsContent }: FanCoilHeroProps) {
  const t = useTranslations('fanCoil')
  
  // Use CMS content with translation fallbacks
  // subtitle is used for the badge text
  const badge = cmsContent?.subtitle || t('hero.badge')
  const title = cmsContent?.title || t('hero.title')
  const description = cmsContent?.content || t('hero.description')
  const imageUrl = cmsContent?.imageUrl || '/images/fan-coil-fs.png'
  const ctaText = cmsContent?.metadata?.ctaText || t('hero.cta')
  const learnMoreText = cmsContent?.metadata?.learnMoreText || t('hero.learnMore')

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      
      <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <span className="inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary mb-6">
              {badge}
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300 max-w-xl">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start">
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
              >
                {ctaText}
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-6 py-3 text-base font-medium text-white hover:bg-slate-700 transition-all"
              >
                {learnMoreText}
              </a>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-3xl blur-3xl" />
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
