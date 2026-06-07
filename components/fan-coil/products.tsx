'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronRight, Thermometer, Wind, Volume2, Ruler } from 'lucide-react'

const products = [
  {
    id: 'fs',
    image: '/images/fan-coil-fs.png',
    specs: {
      power: '1.5 - 8.5 kW',
      airflow: '200 - 850 m³/h',
      noise: '22 - 38 dB(A)',
      dimensions: '600 x 200 x 600 mm',
    },
  },
  {
    id: 'sm',
    image: '/images/fan-coil-sm.png',
    specs: {
      power: '1.2 - 6.0 kW',
      airflow: '180 - 650 m³/h',
      noise: '20 - 35 dB(A)',
      dimensions: '800 x 150 x 400 mm',
    },
  },
  {
    id: 'hw',
    image: '/images/fan-coil-hw.png',
    specs: {
      power: '1.8 - 10.0 kW',
      airflow: '250 - 1000 m³/h',
      noise: '24 - 40 dB(A)',
      dimensions: '1200 x 200 x 300 mm',
    },
  },
  {
    id: 'bt',
    image: '/images/fan-coil-bt.png',
    specs: {
      power: '2.0 - 12.0 kW',
      airflow: '300 - 1200 m³/h',
      noise: '25 - 42 dB(A)',
      dimensions: '1500 x 450 x 400 mm',
    },
  },
  {
    id: 'tw',
    image: '/images/fan-coil-tw.png',
    specs: {
      power: '1.5 - 7.0 kW',
      airflow: '200 - 700 m³/h',
      noise: '22 - 36 dB(A)',
      dimensions: '300 x 300 x 1800 mm',
    },
  },
]

export function FanCoilProducts() {
  const t = useTranslations('fanCoil.products')
  const [activeProduct, setActiveProduct] = useState('fs')

  return (
    <section id="products" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <Tabs value={activeProduct} onValueChange={setActiveProduct} className="w-full">
          <TabsList className="flex flex-wrap justify-center gap-2 bg-transparent h-auto mb-8">
            {products.map((product) => (
              <TabsTrigger
                key={product.id}
                value={product.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-3 rounded-lg text-base font-medium"
              >
                {t(`${product.id}.name`)}
              </TabsTrigger>
            ))}
          </TabsList>

          {products.map((product) => (
            <TabsContent key={product.id} value={product.id} className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="overflow-hidden border-0 shadow-xl">
                  <CardContent className="p-0">
                    <div className="grid lg:grid-cols-2 gap-0">
                      {/* Image Section */}
                      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8 lg:p-12 flex items-center justify-center min-h-[400px]">
                        <div className="relative w-full max-w-md aspect-square">
                          <Image
                            src={product.image}
                            alt={t(`${product.id}.name`)}
                            fill
                            className="object-contain"
                          />
                        </div>
                        <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                          {t(`${product.id}.badge`)}
                        </Badge>
                      </div>

                      {/* Content Section */}
                      <div className="p-8 lg:p-12 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold text-foreground mb-2">
                          {t(`${product.id}.name`)}
                        </h3>
                        <p className="text-lg text-primary font-medium mb-4">
                          {t(`${product.id}.tagline`)}
                        </p>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                          {t(`${product.id}.description`)}
                        </p>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Thermometer className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('specs.power')}</p>
                              <p className="font-semibold text-foreground">{product.specs.power}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Wind className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('specs.airflow')}</p>
                              <p className="font-semibold text-foreground">{product.specs.airflow}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Volume2 className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('specs.noise')}</p>
                              <p className="font-semibold text-foreground">{product.specs.noise}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                            <Ruler className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">{t('specs.dimensions')}</p>
                              <p className="font-semibold text-foreground text-sm">{product.specs.dimensions}</p>
                            </div>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <ChevronRight className="h-4 w-4 text-primary" />
                              <span>{t(`${product.id}.feature${i}`)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  )
}
