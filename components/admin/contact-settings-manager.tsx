'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Save, Trash2, Plus, Building2, Mail, Phone, MapPin, Scale, Share2, Search, Globe, ExternalLink } from 'lucide-react'
import { upsertSiteSettings, deleteSiteSettings, type SiteSettings } from '@/app/actions/site-settings'
import { getLocaleFromDomain, getPreviewUrl } from '@/lib/domain-utils'
import { useRouter } from 'next/navigation'

interface ContactSettingsManagerProps {
  initialSettings: SiteSettings[]
  locale: string
}

const DOMAINS = [
  { domain: 'monocool.at', label: 'Österreich', flag: '🇦🇹', locale: 'de' },
  { domain: 'monocool.sk', label: 'Slovensko', flag: '🇸🇰', locale: 'sk' },
  { domain: 'monocool.cz', label: 'Česká republika', flag: '🇨🇿', locale: 'cs' },
  { domain: 'monocool.eu', label: 'European Union', flag: '🇪🇺', locale: 'en' },
]

export function ContactSettingsManager({ initialSettings, locale }: ContactSettingsManagerProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, Partial<SiteSettings>>>(() => {
    const initial: Record<string, Partial<SiteSettings>> = {}
    for (const domain of DOMAINS) {
      const existing = initialSettings.find(s => s.domain === domain.domain)
      initial[domain.domain] = existing || { domain: domain.domain }
    }
    return initial
  })
  const [activeDomain, setActiveDomain] = useState(DOMAINS[0].domain)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const translations = {
    title: locale === 'sk' ? 'Nastavenia kontaktov' : locale === 'cs' ? 'Nastavení kontaktů' : locale === 'de' ? 'Kontakteinstellungen' : 'Contact Settings',
    description: locale === 'sk' ? 'Spravujte kontaktné údaje pre každú doménu' : locale === 'cs' ? 'Spravujte kontaktní údaje pro každou doménu' : locale === 'de' ? 'Kontaktdaten für jede Domain verwalten' : 'Manage contact information for each domain',
    contact: locale === 'sk' ? 'Kontakt' : locale === 'cs' ? 'Kontakt' : locale === 'de' ? 'Kontakt' : 'Contact',
    address: locale === 'sk' ? 'Adresa' : locale === 'cs' ? 'Adresa' : locale === 'de' ? 'Adresse' : 'Address',
    legal: locale === 'sk' ? 'Právne údaje' : locale === 'cs' ? 'Právní údaje' : locale === 'de' ? 'Rechtliche Angaben' : 'Legal',
    social: locale === 'sk' ? 'Sociálne siete' : locale === 'cs' ? 'Sociální sítě' : locale === 'de' ? 'Soziale Medien' : 'Social Media',
    save: locale === 'sk' ? 'Uložiť' : locale === 'cs' ? 'Uložit' : locale === 'de' ? 'Speichern' : 'Save',
    saving: locale === 'sk' ? 'Ukladám...' : locale === 'cs' ? 'Ukládám...' : locale === 'de' ? 'Speichern...' : 'Saving...',
    saved: locale === 'sk' ? 'Uložené!' : locale === 'cs' ? 'Uloženo!' : locale === 'de' ? 'Gespeichert!' : 'Saved!',
    error: locale === 'sk' ? 'Chyba pri ukladaní' : locale === 'cs' ? 'Chyba při ukládání' : locale === 'de' ? 'Fehler beim Speichern' : 'Error saving',
    companyName: locale === 'sk' ? 'Názov spoločnosti' : locale === 'cs' ? 'Název společnosti' : locale === 'de' ? 'Firmenname' : 'Company Name',
    email: locale === 'sk' ? 'Hlavný email' : locale === 'cs' ? 'Hlavní email' : locale === 'de' ? 'Haupt-E-Mail' : 'Main Email',
    emailSales: locale === 'sk' ? 'Email predaj' : locale === 'cs' ? 'Email prodej' : locale === 'de' ? 'Verkauf E-Mail' : 'Sales Email',
    emailSupport: locale === 'sk' ? 'Email podpora' : locale === 'cs' ? 'Email podpora' : locale === 'de' ? 'Support E-Mail' : 'Support Email',
    phone: locale === 'sk' ? 'Hlavný telefón' : locale === 'cs' ? 'Hlavní telefon' : locale === 'de' ? 'Haupttelefon' : 'Main Phone',
    phoneSecondary: locale === 'sk' ? 'Sekundárny telefón' : locale === 'cs' ? 'Sekundární telefon' : locale === 'de' ? 'Zweittelefon' : 'Secondary Phone',
    fax: locale === 'sk' ? 'Fax' : locale === 'cs' ? 'Fax' : locale === 'de' ? 'Fax' : 'Fax',
    street: locale === 'sk' ? 'Ulica' : locale === 'cs' ? 'Ulice' : locale === 'de' ? 'Straße' : 'Street',
    city: locale === 'sk' ? 'Mesto' : locale === 'cs' ? 'Město' : locale === 'de' ? 'Stadt' : 'City',
    postalCode: locale === 'sk' ? 'PSČ' : locale === 'cs' ? 'PSČ' : locale === 'de' ? 'PLZ' : 'Postal Code',
    country: locale === 'sk' ? 'Krajina' : locale === 'cs' ? 'Země' : locale === 'de' ? 'Land' : 'Country',
    companyId: locale === 'sk' ? 'IČO' : locale === 'cs' ? 'IČO' : locale === 'de' ? 'Firmenbuchnummer' : 'Company ID',
    vatNumber: locale === 'sk' ? 'DIČ / IČ DPH' : locale === 'cs' ? 'DIČ' : locale === 'de' ? 'UID-Nummer' : 'VAT Number',
    registrationCourt: locale === 'sk' ? 'Registrový súd' : locale === 'cs' ? 'Registrační soud' : locale === 'de' ? 'Registergericht' : 'Registration Court',
    registrationNumber: locale === 'sk' ? 'Číslo registrácie' : locale === 'cs' ? 'Číslo registrace' : locale === 'de' ? 'Registernummer' : 'Registration Number',
    responsiblePerson: locale === 'sk' ? 'Zodpovedná osoba' : locale === 'cs' ? 'Odpovědná osoba' : locale === 'de' ? 'Verantwortliche Person' : 'Responsible Person',
    businessHours: locale === 'sk' ? 'Otváracie hodiny' : locale === 'cs' ? 'Otevírací hodiny' : locale === 'de' ? 'Öffnungszeiten' : 'Business Hours',
    facebook: 'Facebook URL',
    instagram: 'Instagram URL',
    linkedin: 'LinkedIn URL',
    youtube: 'YouTube URL',
    seo: locale === 'sk' ? 'SEO' : locale === 'cs' ? 'SEO' : locale === 'de' ? 'SEO' : 'SEO',
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Description',
    ogImage: 'OG Image URL',
    seoHint: locale === 'sk'
      ? 'Voliteľné. Ak ostane prázdne, použijú sa predvolené hodnoty stránky.'
      : locale === 'cs'
      ? 'Volitelné. Pokud zůstane prázdné, použijí se výchozí hodnoty stránky.'
      : locale === 'de'
      ? 'Optional. Wenn leer, werden die Standardwerte der Seite verwendet.'
      : 'Optional. If left empty, the page defaults are used.',
    charsTitle: locale === 'sk' ? 'znakov (odporúčané 50–60)' : locale === 'cs' ? 'znaků (doporučeno 50–60)' : locale === 'de' ? 'Zeichen (empfohlen 50–60)' : 'chars (50–60 recommended)',
    charsDesc: locale === 'sk' ? 'znakov (odporúčané 140–160)' : locale === 'cs' ? 'znaků (doporučeno 140–160)' : locale === 'de' ? 'Zeichen (empfohlen 140–160)' : 'chars (140–160 recommended)',
    activeMarket: locale === 'sk' ? 'Aktívny trh' : locale === 'cs' ? 'Aktivní trh' : locale === 'de' ? 'Aktiver Markt' : 'Active market',
    viewPublic: locale === 'sk' ? 'Zobraziť verejnú stránku' : locale === 'cs' ? 'Zobrazit veřejnou stránku' : locale === 'de' ? 'Öffentliche Seite ansehen' : 'View public page',
    ctaHint: locale === 'sk'
      ? 'Prázdny telefón alebo email skryje príslušné tlačidlá na verejnej stránke.'
      : locale === 'cs'
      ? 'Prázdný telefon nebo email skryje příslušná tlačítka na veřejné stránce.'
      : locale === 'de'
      ? 'Leere Telefon- oder E-Mail-Felder blenden die zugehörigen Buttons auf der öffentlichen Seite aus.'
      : 'Leaving phone or email empty hides the related call-to-action buttons on the public page.',
  }

  const updateField = (domain: string, field: keyof SiteSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [field]: value || null,
      }
    }))
  }

  const handleSave = async (domain: string) => {
    setSaving(true)
    setMessage(null)
    
    const domainSettings = settings[domain]
    const { id, domain: _, createdAt, updatedAt, ...data } = domainSettings as SiteSettings
    
    const result = await upsertSiteSettings(domain, data)
    
    if (result.success) {
      setMessage({ type: 'success', text: translations.saved })
      router.refresh()
    } else {
      setMessage({ type: 'error', text: result.error || translations.error })
    }
    
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  const currentSettings = settings[activeDomain] || {}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{translations.title}</h1>
          <p className="text-muted-foreground mt-1">{translations.description}</p>
        </div>
      </div>

      {/* Domain Selector */}
      <div className="flex gap-2">
        {DOMAINS.map((d) => (
          <Button
            key={d.domain}
            variant={activeDomain === d.domain ? 'default' : 'outline'}
            onClick={() => setActiveDomain(d.domain)}
            className="gap-2"
          >
            <span className="text-lg">{d.flag}</span>
            {d.label}
          </Button>
        ))}
      </div>

      {/* Active market banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Globe className="h-4 w-4 text-primary" />
          <span className="font-medium text-muted-foreground">{translations.activeMarket}:</span>
          <span className="font-semibold text-foreground">
            {DOMAINS.find((d) => d.domain === activeDomain)?.label} &middot; {activeDomain} &middot;{' '}
            <span className="uppercase">{getLocaleFromDomain(activeDomain)}</span>
          </span>
        </div>
        <a
          href={getPreviewUrl(activeDomain)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
          {translations.viewPublic}
        </a>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <Tabs defaultValue="contact" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="h-4 w-4" />
            {translations.contact}
          </TabsTrigger>
          <TabsTrigger value="address" className="gap-2">
            <MapPin className="h-4 w-4" />
            {translations.address}
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-2">
            <Scale className="h-4 w-4" />
            {translations.legal}
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" />
            {translations.social}
          </TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">
            <Search className="h-4 w-4" />
            {translations.seo}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {translations.contact}
              </CardTitle>
              <CardDescription>
                {DOMAINS.find(d => d.domain === activeDomain)?.flag} {activeDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <p className="md:col-span-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {translations.ctaHint}
              </p>
              <div className="space-y-2">
                <Label htmlFor="companyName">{translations.companyName}</Label>
                <Input
                  id="companyName"
                  value={currentSettings.companyName || ''}
                  onChange={(e) => updateField(activeDomain, 'companyName', e.target.value)}
                  placeholder={translations.companyName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{translations.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentSettings.email || ''}
                  onChange={(e) => updateField(activeDomain, 'email', e.target.value)}
                  placeholder={translations.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailSales">{translations.emailSales}</Label>
                <Input
                  id="emailSales"
                  type="email"
                  value={currentSettings.emailSales || ''}
                  onChange={(e) => updateField(activeDomain, 'emailSales', e.target.value)}
                  placeholder={translations.emailSales}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailSupport">{translations.emailSupport}</Label>
                <Input
                  id="emailSupport"
                  type="email"
                  value={currentSettings.emailSupport || ''}
                  onChange={(e) => updateField(activeDomain, 'emailSupport', e.target.value)}
                  placeholder={translations.emailSupport}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{translations.phone}</Label>
                <Input
                  id="phone"
                  value={currentSettings.phone || ''}
                  onChange={(e) => updateField(activeDomain, 'phone', e.target.value)}
                  placeholder={translations.phone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneSecondary">{translations.phoneSecondary}</Label>
                <Input
                  id="phoneSecondary"
                  value={currentSettings.phoneSecondary || ''}
                  onChange={(e) => updateField(activeDomain, 'phoneSecondary', e.target.value)}
                  placeholder={translations.phoneSecondary}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fax">{translations.fax}</Label>
                <Input
                  id="fax"
                  value={currentSettings.fax || ''}
                  onChange={(e) => updateField(activeDomain, 'fax', e.target.value)}
                  placeholder={translations.fax}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessHours">{translations.businessHours}</Label>
                <Input
                  id="businessHours"
                  value={currentSettings.businessHours || ''}
                  onChange={(e) => updateField(activeDomain, 'businessHours', e.target.value)}
                  placeholder={translations.businessHours}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {translations.address}
              </CardTitle>
              <CardDescription>
                {DOMAINS.find(d => d.domain === activeDomain)?.flag} {activeDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{translations.street}</Label>
                <Input
                  id="address"
                  value={currentSettings.address || ''}
                  onChange={(e) => updateField(activeDomain, 'address', e.target.value)}
                  placeholder={translations.street}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{translations.city}</Label>
                <Input
                  id="city"
                  value={currentSettings.city || ''}
                  onChange={(e) => updateField(activeDomain, 'city', e.target.value)}
                  placeholder={translations.city}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">{translations.postalCode}</Label>
                <Input
                  id="postalCode"
                  value={currentSettings.postalCode || ''}
                  onChange={(e) => updateField(activeDomain, 'postalCode', e.target.value)}
                  placeholder={translations.postalCode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">{translations.country}</Label>
                <Input
                  id="country"
                  value={currentSettings.country || ''}
                  onChange={(e) => updateField(activeDomain, 'country', e.target.value)}
                  placeholder={translations.country}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                {translations.legal}
              </CardTitle>
              <CardDescription>
                {DOMAINS.find(d => d.domain === activeDomain)?.flag} {activeDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyId">{translations.companyId}</Label>
                <Input
                  id="companyId"
                  value={currentSettings.companyId || ''}
                  onChange={(e) => updateField(activeDomain, 'companyId', e.target.value)}
                  placeholder={translations.companyId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">{translations.vatNumber}</Label>
                <Input
                  id="vatNumber"
                  value={currentSettings.vatNumber || ''}
                  onChange={(e) => updateField(activeDomain, 'vatNumber', e.target.value)}
                  placeholder={translations.vatNumber}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationCourt">{translations.registrationCourt}</Label>
                <Input
                  id="registrationCourt"
                  value={currentSettings.registrationCourt || ''}
                  onChange={(e) => updateField(activeDomain, 'registrationCourt', e.target.value)}
                  placeholder={translations.registrationCourt}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">{translations.registrationNumber}</Label>
                <Input
                  id="registrationNumber"
                  value={currentSettings.registrationNumber || ''}
                  onChange={(e) => updateField(activeDomain, 'registrationNumber', e.target.value)}
                  placeholder={translations.registrationNumber}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="responsiblePerson">{translations.responsiblePerson}</Label>
                <Input
                  id="responsiblePerson"
                  value={currentSettings.responsiblePerson || ''}
                  onChange={(e) => updateField(activeDomain, 'responsiblePerson', e.target.value)}
                  placeholder={translations.responsiblePerson}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {translations.social}
              </CardTitle>
              <CardDescription>
                {DOMAINS.find(d => d.domain === activeDomain)?.flag} {activeDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facebook">{translations.facebook}</Label>
                <Input
                  id="facebook"
                  value={currentSettings.facebook || ''}
                  onChange={(e) => updateField(activeDomain, 'facebook', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">{translations.instagram}</Label>
                <Input
                  id="instagram"
                  value={currentSettings.instagram || ''}
                  onChange={(e) => updateField(activeDomain, 'instagram', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">{translations.linkedin}</Label>
                <Input
                  id="linkedin"
                  value={currentSettings.linkedin || ''}
                  onChange={(e) => updateField(activeDomain, 'linkedin', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">{translations.youtube}</Label>
                <Input
                  id="youtube"
                  value={currentSettings.youtube || ''}
                  onChange={(e) => updateField(activeDomain, 'youtube', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                {translations.seo}
              </CardTitle>
              <CardDescription>
                {DOMAINS.find(d => d.domain === activeDomain)?.flag} {activeDomain}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                {translations.seoHint}
              </p>
              <div className="space-y-2">
                <Label htmlFor="seoTitle">{translations.seoTitle}</Label>
                <Input
                  id="seoTitle"
                  value={currentSettings.seoTitle || ''}
                  onChange={(e) => updateField(activeDomain, 'seoTitle', e.target.value)}
                  maxLength={70}
                />
                <p className="text-xs text-muted-foreground">
                  {(currentSettings.seoTitle || '').length}/60 {translations.charsTitle}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">{translations.seoDescription}</Label>
                <Input
                  id="seoDescription"
                  value={currentSettings.seoDescription || ''}
                  onChange={(e) => updateField(activeDomain, 'seoDescription', e.target.value)}
                  maxLength={180}
                />
                <p className="text-xs text-muted-foreground">
                  {(currentSettings.seoDescription || '').length}/160 {translations.charsDesc}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">{translations.ogImage}</Label>
                <Input
                  id="ogImage"
                  type="url"
                  value={currentSettings.ogImage || ''}
                  onChange={(e) => updateField(activeDomain, 'ogImage', e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => handleSave(activeDomain)} 
          disabled={saving}
          size="lg"
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? translations.saving : translations.save}
        </Button>
      </div>
    </div>
  )
}
