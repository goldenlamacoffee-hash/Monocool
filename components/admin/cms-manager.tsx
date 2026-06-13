'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { upsertCmsContent } from '@/app/actions/products'
import { getDomainFromLocale, getMarketName } from '@/lib/domain-utils'
import { ArrowLeft, Save, FileText, Image, Settings, Globe, Plus, Pencil, X, ImagePlus } from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface CmsContentItem {
  id: number
  key: string
  title: string | null
  subtitle: string | null
  content: string | null
  imageUrl: string | null
  gallery: string[] | null
  metadata: unknown
  seoTitle: string | null
  seoDescription: string | null
  ogImage: string | null
}

interface CMSManagerProps {
  initialContent: CmsContentItem[]
  locale: Locale
}

// Predefined CMS sections for the website with human-readable labels
const getCmsSections = (locale: Locale) => {
  const labels = {
    sk: {
      // Homepage
      heroSection: 'Úvodná sekcia', heroDesc: 'Hlavný nadpis a popis na úvodnej stránke',
      features: 'Prečo MonoCool?', featuresDesc: 'Názov a popis sekcie výhod',
      feature1: 'Bez vonkajšej jednotky', feature1Desc: 'Žiadna rušivá vonkajšia jednotka',
      feature2: 'Tichá prevádzka', feature2Desc: 'Extrémne tichá prevádzka',
      feature3: 'Jednoduchá inštalácia', feature3Desc: 'Rýchla a jednoduchá inštalácia',
      feature4: 'Energeticky úsporné', feature4Desc: 'Vysoká energetická účinnosť',
      benefits: 'Výhody MonoCool', benefitsDesc: 'Štatistiky a čísla',
      productsSection: 'Sekcia produktov', productsSectionDesc: 'Názov a popis sekcie produktov',
      contact: 'Kontakt', contactDesc: 'Kontaktné informácie',
      // Fan-coil
      fancoilHero: 'Fan-coil úvodná sekcia', fancoilHeroDesc: 'Hlavný nadpis, popis a obrázok',
      fancoilFeatures: 'Fan-coil vlastnosti', fancoilFeaturesDesc: 'Názov sekcie vlastností',
      fancoilDesign: 'Prémiový dizajn', fancoilDesignDesc: 'Popis prémiového dizajnu',
      fancoilEfficiency: 'Energetická účinnosť', fancoilEfficiencyDesc: 'Popis energetickej účinnosti',
      fancoilQuiet: 'Tichá prevádzka', fancoilQuietDesc: 'Popis tichej prevádzky',
      fancoilEco: 'Ekologické riešenie', fancoilEcoDesc: 'Popis ekológie',
      fancoilControl: 'Inteligentné ovládanie', fancoilControlDesc: 'Popis ovládania',
      fancoilQuality: 'Záruka kvality', fancoilQualityDesc: 'Popis záruky kvality',
      fancoilCta: 'Výzva k akcii', fancoilCtaDesc: 'Text výzvy a tlačidla',
      // General
      about: 'O nás', aboutDesc: 'Text o firme',
      footer: 'Pätička', footerDesc: 'Texty v pätičke',
      // Tabs
      homepage: 'Úvodná stránka', fancoil: 'Fan-coil', general: 'Všeobecné',
    },
    cs: {
      heroSection: 'Úvodní sekce', heroDesc: 'Hlavní nadpis a popis na úvodní stránce',
      features: 'Proč MonoCool?', featuresDesc: 'Název a popis sekce výhod',
      feature1: 'Bez venkovní jednotky', feature1Desc: 'Žádná rušivá venkovní jednotka',
      feature2: 'Tichý provoz', feature2Desc: 'Extrémně tichý provoz',
      feature3: 'Snadná instalace', feature3Desc: 'Rychlá a snadná instalace',
      feature4: 'Energeticky úsporné', feature4Desc: 'Vysoká energetická účinnost',
      benefits: 'Výhody MonoCool', benefitsDesc: 'Statistiky a čísla',
      productsSection: 'Sekce produktů', productsSectionDesc: 'Název a popis sekce produktů',
      contact: 'Kontakt', contactDesc: 'Kontaktní informace',
      fancoilHero: 'Fan-coil úvodní sekce', fancoilHeroDesc: 'Hlavní nadpis, popis a obrázek',
      fancoilFeatures: 'Fan-coil vlastnosti', fancoilFeaturesDesc: 'Název sekce vlastností',
      fancoilDesign: 'Prémiový design', fancoilDesignDesc: 'Popis prémiového designu',
      fancoilEfficiency: 'Energetická účinnost', fancoilEfficiencyDesc: 'Popis energetické účinnosti',
      fancoilQuiet: 'Tichý provoz', fancoilQuietDesc: 'Popis tichého provozu',
      fancoilEco: 'Ekologické řešení', fancoilEcoDesc: 'Popis ekologie',
      fancoilControl: 'Inteligentní ovládání', fancoilControlDesc: 'Popis ovládání',
      fancoilQuality: 'Záruka kvality', fancoilQualityDesc: 'Popis záruky kvality',
      fancoilCta: 'Výzva k akci', fancoilCtaDesc: 'Text výzvy a tlačítka',
      about: 'O nás', aboutDesc: 'Text o firmě',
      footer: 'Patička', footerDesc: 'Texty v patičce',
      homepage: 'Úvodní stránka', fancoil: 'Fan-coil', general: 'Obecné',
    },
    de: {
      heroSection: 'Hero-Bereich', heroDesc: 'Hauptüberschrift und Beschreibung',
      features: 'Warum MonoCool?', featuresDesc: 'Titel und Beschreibung der Vorteile',
      feature1: 'Keine Außeneinheit', feature1Desc: 'Keine störende Außeneinheit',
      feature2: 'Leiser Betrieb', feature2Desc: 'Extrem leiser Betrieb',
      feature3: 'Einfache Installation', feature3Desc: 'Schnelle und einfache Installation',
      feature4: 'Energieeffizient', feature4Desc: 'Hohe Energieeffizienz',
      benefits: 'MonoCool Vorteile', benefitsDesc: 'Statistiken und Zahlen',
      productsSection: 'Produkte-Bereich', productsSectionDesc: 'Titel und Beschreibung',
      contact: 'Kontakt', contactDesc: 'Kontaktinformationen',
      fancoilHero: 'Fan-coil Hero-Bereich', fancoilHeroDesc: 'Hauptüberschrift, Beschreibung und Bild',
      fancoilFeatures: 'Fan-coil Eigenschaften', fancoilFeaturesDesc: 'Titel der Eigenschaften',
      fancoilDesign: 'Premium-Design', fancoilDesignDesc: 'Beschreibung des Designs',
      fancoilEfficiency: 'Energieeffizienz', fancoilEfficiencyDesc: 'Beschreibung der Effizienz',
      fancoilQuiet: 'Leiser Betrieb', fancoilQuietDesc: 'Beschreibung des leisen Betriebs',
      fancoilEco: 'Umweltfreundlich', fancoilEcoDesc: 'Beschreibung der Umweltfreundlichkeit',
      fancoilControl: 'Intelligente Steuerung', fancoilControlDesc: 'Beschreibung der Steuerung',
      fancoilQuality: 'Qualitätsgarantie', fancoilQualityDesc: 'Beschreibung der Qualität',
      fancoilCta: 'Handlungsaufruf', fancoilCtaDesc: 'Text und Button',
      about: 'Über uns', aboutDesc: 'Firmentext',
      footer: 'Footer', footerDesc: 'Footer-Texte',
      homepage: 'Startseite', fancoil: 'Fan-coil', general: 'Allgemein',
    },
    en: {
      heroSection: 'Hero Section', heroDesc: 'Main headline and description',
      features: 'Why MonoCool?', featuresDesc: 'Title and description of benefits',
      feature1: 'No Outdoor Unit', feature1Desc: 'No disruptive outdoor unit',
      feature2: 'Quiet Operation', feature2Desc: 'Extremely quiet operation',
      feature3: 'Easy Installation', feature3Desc: 'Quick and easy installation',
      feature4: 'Energy Efficient', feature4Desc: 'High energy efficiency',
      benefits: 'MonoCool Benefits', benefitsDesc: 'Statistics and numbers',
      productsSection: 'Products Section', productsSectionDesc: 'Title and description',
      contact: 'Contact', contactDesc: 'Contact information',
      fancoilHero: 'Fan-coil Hero Section', fancoilHeroDesc: 'Main headline, description and image',
      fancoilFeatures: 'Fan-coil Features', fancoilFeaturesDesc: 'Features section title',
      fancoilDesign: 'Premium Design', fancoilDesignDesc: 'Premium design description',
      fancoilEfficiency: 'Energy Efficiency', fancoilEfficiencyDesc: 'Energy efficiency description',
      fancoilQuiet: 'Quiet Operation', fancoilQuietDesc: 'Quiet operation description',
      fancoilEco: 'Eco-friendly', fancoilEcoDesc: 'Eco-friendly description',
      fancoilControl: 'Smart Control', fancoilControlDesc: 'Smart control description',
      fancoilQuality: 'Quality Guarantee', fancoilQualityDesc: 'Quality guarantee description',
      fancoilCta: 'Call to Action', fancoilCtaDesc: 'CTA text and button',
      about: 'About Us', aboutDesc: 'Company text',
      footer: 'Footer', footerDesc: 'Footer texts',
      homepage: 'Homepage', fancoil: 'Fan-coil', general: 'General',
    },
  }
  const l = labels[locale] || labels.en
  
  return {
    tabs: { homepage: l.homepage, fancoil: l.fancoil, general: l.general },
    sections: [
      // Homepage sections
      { key: `homepage_hero_${locale}`, icon: Globe, label: l.heroSection, description: l.heroDesc, category: 'homepage' },
      { key: `homepage_features_${locale}`, icon: Settings, label: l.features, description: l.featuresDesc, category: 'homepage' },
      { key: `homepage_feature1_${locale}`, icon: Settings, label: l.feature1, description: l.feature1Desc, category: 'homepage' },
      { key: `homepage_feature2_${locale}`, icon: Settings, label: l.feature2, description: l.feature2Desc, category: 'homepage' },
      { key: `homepage_feature3_${locale}`, icon: Settings, label: l.feature3, description: l.feature3Desc, category: 'homepage' },
      { key: `homepage_feature4_${locale}`, icon: Settings, label: l.feature4, description: l.feature4Desc, category: 'homepage' },
      { key: `homepage_benefits_${locale}`, icon: FileText, label: l.benefits, description: l.benefitsDesc, category: 'homepage' },
      { key: `homepage_products_${locale}`, icon: FileText, label: l.productsSection, description: l.productsSectionDesc, category: 'homepage' },
      { key: `homepage_contact_${locale}`, icon: FileText, label: l.contact, description: l.contactDesc, category: 'homepage' },
      // Fan-coil sections
      { key: `fancoil_hero_${locale}`, icon: Globe, label: l.fancoilHero, description: l.fancoilHeroDesc, category: 'fancoil' },
      { key: `fancoil_features_${locale}`, icon: Settings, label: l.fancoilFeatures, description: l.fancoilFeaturesDesc, category: 'fancoil' },
      { key: `fancoil_feature_design_${locale}`, icon: Settings, label: l.fancoilDesign, description: l.fancoilDesignDesc, category: 'fancoil' },
      { key: `fancoil_feature_efficiency_${locale}`, icon: Settings, label: l.fancoilEfficiency, description: l.fancoilEfficiencyDesc, category: 'fancoil' },
      { key: `fancoil_feature_quiet_${locale}`, icon: Settings, label: l.fancoilQuiet, description: l.fancoilQuietDesc, category: 'fancoil' },
      { key: `fancoil_feature_eco_${locale}`, icon: Settings, label: l.fancoilEco, description: l.fancoilEcoDesc, category: 'fancoil' },
      { key: `fancoil_feature_control_${locale}`, icon: Settings, label: l.fancoilControl, description: l.fancoilControlDesc, category: 'fancoil' },
      { key: `fancoil_feature_quality_${locale}`, icon: Settings, label: l.fancoilQuality, description: l.fancoilQualityDesc, category: 'fancoil' },
      { key: `fancoil_cta_${locale}`, icon: FileText, label: l.fancoilCta, description: l.fancoilCtaDesc, category: 'fancoil' },
      // General sections
      { key: `about_${locale}`, icon: FileText, label: l.about, description: l.aboutDesc, category: 'general' },
      { key: `footer_${locale}`, icon: FileText, label: l.footer, description: l.footerDesc, category: 'general' },
    ]
  }
}

export function CMSManager({ initialContent, locale }: CMSManagerProps) {
  const router = useRouter()
  const t = useTranslations('admin.cmsManagement')
  const tCommon = useTranslations('common')
  const { tabs, sections: cmsSections } = getCmsSections(locale)
  const [content, setContent] = useState<Record<string, CmsContentItem>>(
    initialContent.reduce((acc, item) => ({ ...acc, [item.key]: item }), {})
  )
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    key: string
    title: string
    subtitle: string
    content: string
    imageUrl: string
    gallery: string[]
    metadata: string
    seoTitle: string
    seoDescription: string
    ogImage: string
  }>({
    key: '',
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    gallery: [],
    metadata: '{}',
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
  })
  const [loading, setSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const openEditDialog = (sectionKey: string, custom = false) => {
    const existingContent = content[sectionKey]
    setEditingSection(sectionKey)
    setIsCustom(custom)
    setSaveError(null)
    setFormData({
      key: sectionKey,
      title: existingContent?.title || '',
      subtitle: existingContent?.subtitle || '',
      content: existingContent?.content || '',
      imageUrl: existingContent?.imageUrl || '',
      gallery: (existingContent?.gallery as string[]) || [],
      metadata: existingContent?.metadata ? JSON.stringify(existingContent.metadata, null, 2) : '{}',
      seoTitle: existingContent?.seoTitle || '',
      seoDescription: existingContent?.seoDescription || '',
      ogImage: existingContent?.ogImage || '',
    })
    setIsDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingSection(null)
    setIsCustom(true)
    setSaveError(null)
    setFormData({
      key: '',
      title: '',
      subtitle: '',
      content: '',
      imageUrl: '',
      gallery: [],
      metadata: '{}',
      seoTitle: '',
      seoDescription: '',
      ogImage: '',
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    const key = editingSection || formData.key
    if (!key) return
    setSaving(true)
    setSaveError(null)

    try {
      let parsedMetadata = {}
      try {
        parsedMetadata = JSON.parse(formData.metadata || '{}')
      } catch {
        parsedMetadata = {}
      }

      await upsertCmsContent({
        key,
        title: formData.title || undefined,
        subtitle: formData.subtitle || undefined,
        content: formData.content || undefined,
        imageUrl: formData.imageUrl || undefined,
        gallery: formData.gallery.length > 0 ? formData.gallery : undefined,
        metadata: parsedMetadata,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        ogImage: formData.ogImage || undefined,
        domain: getDomainFromLocale(locale),
      })

      setContent({
        ...content,
        [key]: {
          ...content[key],
          id: content[key]?.id || 0,
          key,
          title: formData.title,
          subtitle: formData.subtitle,
          content: formData.content,
          imageUrl: formData.imageUrl,
          gallery: formData.gallery,
          metadata: parsedMetadata,
          seoTitle: formData.seoTitle,
          seoDescription: formData.seoDescription,
          ogImage: formData.ogImage,
        } as CmsContentItem,
      })

      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving content:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save content')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('backToAdmin')}
            </Link>
            <span className="hidden items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
              <Globe className="h-3.5 w-3.5" />
              {getMarketName(getDomainFromLocale(locale))} &middot; {getDomainFromLocale(locale)}
            </span>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t('newContent')}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="mb-8 text-muted-foreground">
          {t('description')}
        </p>

        <Tabs defaultValue="homepage" className="space-y-6">
          <TabsList>
            <TabsTrigger value="homepage">{tabs.homepage}</TabsTrigger>
            <TabsTrigger value="fancoil">{tabs.fancoil}</TabsTrigger>
            <TabsTrigger value="general">{tabs.general}</TabsTrigger>
            <TabsTrigger value="all">{t('allContent')}</TabsTrigger>
          </TabsList>

          {(['homepage', 'fancoil', 'general'] as const).map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cmsSections.filter(s => s.category === category).map((section) => {
                  const Icon = section.icon
                  const savedContent = content[section.key]
                  const hasContent = !!savedContent
                  const displayLabel = savedContent?.title || section.label
                  return (
                    <Card key={section.key} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openEditDialog(section.key)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{displayLabel}</CardTitle>
                            <CardDescription>{section.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm ${hasContent ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {hasContent ? t('configured') : t('notConfigured')}
                          </span>
                          <Button variant="ghost" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('edit')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('allEntries')}</CardTitle>
                <CardDescription>
                  {t('allEntriesDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(content).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(content).map(([key, item]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <h4 className="font-medium font-mono text-sm">{key}</h4>
                          <p className="text-sm text-muted-foreground">
                            {item.title || t('noTitle')}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(key, true)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {t('edit')}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t('noContent')}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSection 
                  ? content[editingSection]?.title || cmsSections.find(s => s.key === editingSection)?.label || editingSection
                  : t('newContent')
                }
              </DialogTitle>
              <DialogDescription>
                {t('editContentDesc')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!editingSection && (
                <div className="space-y-2">
                  <Label htmlFor="key">{t('key')} *</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder={t('keyPlaceholder')}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">{t('titleField')}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('titlePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">{locale === 'sk' ? 'Podnadpis / Štítok' : locale === 'cs' ? 'Podnadpis / Štítek' : locale === 'de' ? 'Untertitel / Badge' : 'Subtitle / Badge'}</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder={locale === 'sk' ? 'napr. Premium Design' : locale === 'cs' ? 'např. Premium Design' : locale === 'de' ? 'z.B. Premium Design' : 'e.g. Premium Design'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t('contentField')}</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={t('contentPlaceholder')}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">{t('imageUrl')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.imageUrl && (
                    <div className="h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                      <img src={formData.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
              <div className="space-y-2">
                <Label>{locale === 'sk' ? 'Galéria' : locale === 'cs' ? 'Galerie' : locale === 'de' ? 'Galerie' : 'Gallery'}</Label>
                <div className="space-y-2">
                  {formData.gallery.map((url, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={url}
                        onChange={(e) => {
                          const newGallery = [...formData.gallery]
                          newGallery[index] = e.target.value
                          setFormData({ ...formData, gallery: newGallery })
                        }}
                        placeholder="https://..."
                        className="flex-1"
                      />
                      {url && (
                        <div className="h-10 w-10 rounded border overflow-hidden flex-shrink-0">
                          <img src={url} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newGallery = formData.gallery.filter((_, i) => i !== index)
                          setFormData({ ...formData, gallery: newGallery })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, gallery: [...formData.gallery, ''] })}
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {locale === 'sk' ? 'Pridať obrázok' : locale === 'cs' ? 'Přidat obrázek' : locale === 'de' ? 'Bild hinzufügen' : 'Add image'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metadata">{t('metadata')}</Label>
                <Textarea
                  id="metadata"
                  value={formData.metadata}
                  onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
                  placeholder="{}"
                  rows={3}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {locale === 'sk' ? 'Dodatočné údaje ako texty tlačidiel: {"ctaText": "Objavte produkty", "learnMoreText": "Zistiť viac"}' : 
                   locale === 'cs' ? 'Dodatečná data jako texty tlačítek: {"ctaText": "Objevte produkty", "learnMoreText": "Zjistit více"}' :
                   locale === 'de' ? 'Zusätzliche Daten wie Button-Texte: {"ctaText": "Produkte entdecken", "learnMoreText": "Mehr erfahren"}' :
                   'Additional data like button texts: {"ctaText": "Discover products", "learnMoreText": "Learn more"}'}
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">SEO</h3>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'sk'
                      ? 'Voliteľné. Ak ostane prázdne, použijú sa predvolené hodnoty stránky.'
                      : locale === 'cs'
                      ? 'Volitelné. Pokud zůstane prázdné, použijí se výchozí hodnoty stránky.'
                      : locale === 'de'
                      ? 'Optional. Wenn leer, werden die Standardwerte der Seite verwendet.'
                      : 'Optional. If left empty, the page defaults are used.'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoTitle.length}/60{' '}
                    {locale === 'sk' ? 'znakov (odporúčané 50–60)' : locale === 'cs' ? 'znaků (doporučeno 50–60)' : locale === 'de' ? 'Zeichen (empfohlen 50–60)' : 'chars (50–60 recommended)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                    rows={2}
                    maxLength={180}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seoDescription.length}/160{' '}
                    {locale === 'sk' ? 'znakov (odporúčané 140–160)' : locale === 'cs' ? 'znaků (doporučeno 140–160)' : locale === 'de' ? 'Zeichen (empfohlen 140–160)' : 'chars (140–160 recommended)'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ogImage">OG Image URL</Label>
                  <Input
                    id="ogImage"
                    type="url"
                    value={formData.ogImage}
                    onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              {saveError && (
                <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={loading || (!editingSection && !formData.key)}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? t('saving') : tCommon('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
