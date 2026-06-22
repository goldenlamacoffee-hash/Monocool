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
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-soft-navy text-primary-foreground">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
              {badge}
            </span>
            <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-white text-balance sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              {description}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href="#products"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-secondary px-6 text-base font-semibold text-secondary-foreground shadow-lg transition-colors hover:bg-secondary/90"
              >
                {ctaText}
              </a>
              <a
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
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
            <div className="relative mx-auto aspect-square max-w-lg">
              <div className="absolute inset-0 rounded-3xl bg-secondary/20 blur-3xl" />
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
