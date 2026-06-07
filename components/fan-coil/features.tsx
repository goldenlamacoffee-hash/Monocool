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
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {sectionTitle}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
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
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow bg-card">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">
                          {featureTitle}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
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
