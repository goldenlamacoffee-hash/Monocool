import { FileText, Download } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getProductDocumentsPublic } from '@/app/actions/documents'
import type { ProductDocument } from '@/lib/db/schema'

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

// Type label localised for display (e.g. "Bedienungsanleitung").
// We rely on the admin.documents i18n keys to keep it DRY, but since this is a
// Server Component we manually map to avoid the overhead of a client hook.
const TYPE_LABELS: Record<string, Record<string, string>> = {
  manual: {
    de: 'Bedienungs- und Installationsanleitung',
    sk: 'Návod na obsluhu a inštaláciu',
    cs: 'Návod k obsluze a instalaci',
    en: 'User and installation manual',
  },
  datasheet: {
    de: 'Technisches Datenblatt',
    sk: 'Technický datasheet',
    cs: 'Technický datasheet',
    en: 'Technical datasheet',
  },
  installation_guide: {
    de: 'Installationsanleitung',
    sk: 'Inštalačný návod',
    cs: 'Instalační návod',
    en: 'Installation guide',
  },
  energy_label: {
    de: 'Energieetikett',
    sk: 'Energetický štítok',
    cs: 'Energetický štítek',
    en: 'Energy label',
  },
  declaration_of_conformity: {
    de: 'Konformitätserklärung',
    sk: 'Vyhlásenie o zhode',
    cs: 'Prohlášení o shodě',
    en: 'Declaration of conformity',
  },
  brochure: {
    de: 'Broschüre',
    sk: 'Brožúra',
    cs: 'Brožura',
    en: 'Brochure',
  },
  other: {
    de: 'Sonstiges',
    sk: 'Iné',
    cs: 'Jiné',
    en: 'Other',
  },
}

function getTypeLabel(type: string, locale: string): string {
  return TYPE_LABELS[type]?.[locale] ?? type
}

function langLabel(language: string, locale: string): string {
  const map: Record<string, Record<string, string>> = {
    de: { de: 'Deutsch', sk: 'Nemčina', cs: 'Němčina', en: 'German' },
    sk: { de: 'Slowakisch', sk: 'Slovenčina', cs: 'Slovenština', en: 'Slovak' },
    cs: { de: 'Tschechisch', sk: 'Čeština', cs: 'Čeština', en: 'Czech' },
    en: { de: 'Englisch', sk: 'Angličtina', cs: 'Angličtina', en: 'English' },
  }
  return map[language]?.[locale] ?? language.toUpperCase()
}

interface ProductDocumentsBlockProps {
  productId: number
  locale: string
  /** Pass "onDark" when rendering inside a dark hero (fan-coil page). */
  tone?: 'default' | 'onDark'
}

export async function ProductDocumentsBlock({ productId, locale, tone = 'default' }: ProductDocumentsBlockProps) {
  const onDark = tone === 'onDark'
  const docs = await getProductDocumentsPublic(productId, locale)

  // Hide the entire block when there are no active documents for this locale.
  if (docs.length === 0) return null

  const t = await getTranslations('products')

  return (
    <div className="mt-6">
      <h2 className={`font-heading text-lg font-semibold ${onDark ? 'text-white' : 'text-foreground'}`}>
        {t('documentsTitle')}
      </h2>
      <ul className="mt-3 space-y-2">
        {(docs as ProductDocument[]).map((doc) => {
          const meta = [
            langLabel(doc.language, locale),
            'PDF',
            formatFileSize(doc.fileSize),
          ]
            .filter(Boolean)
            .join(' · ')

          return (
            <li key={doc.id}>
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                  onDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                }`}
              >
                <FileText
                  className={`mt-0.5 h-5 w-5 shrink-0 text-secondary transition-colors group-hover:text-primary`}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${onDark ? 'text-white' : 'text-foreground'}`}>
                    {doc.title}
                  </p>
                  {meta && (
                    <p className={`mt-0.5 text-xs ${onDark ? 'text-white/60' : 'text-muted-foreground'}`}>{meta}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-secondary transition-colors group-hover:text-primary">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  {t('download')}
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
