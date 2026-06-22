'use client'

import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Palette, Zap, Volume2, Leaf, Settings, Shield } from 'lucide-react'

interface CmsContent {
  title: string | null
  content: string | null
  imageUrl: string | null
  metadata: Record<string, string> | null
}

interface FanCoilFeaturesProps {
  cmsContent?: {
    section?: CmsContent | null
    design?: CmsContent | null
    efficiency?: CmsContent | null
    quiet?: CmsContent | null
    eco?: CmsContent | null
    control?: CmsContent | null
    quality?: CmsContent | null
  }
}

const featureIcons = {
  design: Palette,
  efficiency: Zap,
  quiet: Volume2,
  eco: Leaf,
  control: Settings,
  quality: Shield,
}

export function FanCoilFeatures({ cmsContent }: FanCoilFeaturesProps) {
  const t = useTranslations('fanCoil.features')
  
  // Get section title and subtitle from CMS or translations
  const sectionTitle = cmsContent?.section?.title || t('title')
  const sectionSubtitle = cmsContent?.section?.content || t('subtitle')
  
  // Feature keys
  const featureKeys = ['design', 'efficiency', 'quiet', 'eco', 'control', 'quality'] as const

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="eyebrow">Fan Coil</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
            {sectionTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {sectionSubtitle}
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[key]
            const featureCms = cmsContent?.[key]
            const featureTitle = featureCms?.title || t(`${key}.title`)
            const featureDescription = featureCms?.content || t(`${key}.description`)
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-18px_rgba(5,25,65,0.3)]">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
                        <Icon className="h-6 w-6 text-secondary" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="mb-2 font-heading font-semibold text-foreground">
                          {featureTitle}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {featureDescription}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
