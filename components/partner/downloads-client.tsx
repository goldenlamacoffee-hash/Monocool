'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Download, FileText, Search } from 'lucide-react'
import { type DocumentGroup } from '@/app/actions/partner-portal'

interface DownloadsClientProps {
  groups: DocumentGroup[]
  locale: string
}

const DOC_TYPES = [
  'manual',
  'datasheet',
  'installation_guide',
  'energy_label',
  'declaration_of_conformity',
  'brochure',
  'other',
] as const

function formatFileSize(bytes: number | null): string | null {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DownloadsClient({ groups, locale }: DownloadsClientProps) {
  const t = useTranslations('partnerPortal')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [langFilter, setLangFilter] = useState<string>('all')

  const allProducts = useMemo(() =>
    groups.map(g => ({ id: g.productId, name: g.productName })),
    [groups]
  )

  const allDocs = useMemo(() =>
    groups.flatMap(g => g.documents),
    [groups]
  )

  const availableTypes = useMemo(() => {
    const types = new Set<string>()
    for (const d of allDocs) types.add(d.type)
    return Array.from(types)
  }, [allDocs])

  const availableLanguages = useMemo(() => {
    const langs = new Set<string>()
    for (const d of allDocs) langs.add(d.language)
    return Array.from(langs)
  }, [allDocs])

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase()
    return groups
      .map(group => {
        if (productFilter !== 'all' && String(group.productId) !== productFilter) return null
        const docs = group.documents.filter(doc => {
          if (typeFilter !== 'all' && doc.type !== typeFilter) return false
          if (langFilter !== 'all' && doc.language !== langFilter) return false
          if (q) {
            if (doc.title.toLowerCase().includes(q)) return true
            if (group.productName.toLowerCase().includes(q)) return true
            return false
          }
          return true
        })
        if (docs.length === 0) return null
        return { ...group, documents: docs }
      })
      .filter(Boolean) as DocumentGroup[]
  }, [groups, search, productFilter, typeFilter, langFilter])

  const docTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      manual: t('downloads.typeManual'),
      datasheet: t('downloads.typeDatasheet'),
      installation_guide: t('downloads.typeInstallation'),
      energy_label: t('downloads.typeEnergyLabel'),
      declaration_of_conformity: t('downloads.typeDeclaration'),
      brochure: t('downloads.typeBrochure'),
      other: t('downloads.typeOther'),
    }
    return map[type] ?? type
  }

  const langLabel = (lang: string) => {
    const map: Record<string, string> = {
      de: 'DE', sk: 'SK', cs: 'CS', en: 'EN',
    }
    return map[lang] ?? lang.toUpperCase()
  }

  if (allDocs.length === 0) {
    return (
      <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-12 shadow-sm text-center">
        <FileText className="mx-auto h-12 w-12 text-[color:var(--mono-line)] mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-[color:var(--mono-navy)]">{t('downloads.emptyTitle')}</p>
        <p className="text-xs text-[color:var(--mono-muted)] mt-1">{t('downloads.emptyDescription')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 rounded-xl border border-[color:var(--mono-line)] bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[color:var(--mono-muted)]" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('downloads.searchPlaceholder')}
            aria-label={t('downloads.searchPlaceholder')}
            className="h-9 w-full rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] pl-9 pr-3 text-sm text-[color:var(--mono-navy)] placeholder:text-[color:var(--mono-muted)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)]"
          />
        </div>

        {/* Product filter */}
        <select
          value={productFilter}
          onChange={e => setProductFilter(e.target.value)}
          aria-label={t('downloads.filterProduct')}
          className="h-9 rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] px-3 text-sm text-[color:var(--mono-navy)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)]"
        >
          <option value="all">{t('downloads.allProducts')}</option>
          {allProducts.map(p => (
            <option key={p.id} value={String(p.id)}>{p.name}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          aria-label={t('downloads.filterType')}
          className="h-9 rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] px-3 text-sm text-[color:var(--mono-navy)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)]"
        >
          <option value="all">{t('downloads.allTypes')}</option>
          {availableTypes.map(type => (
            <option key={type} value={type}>{docTypeLabel(type)}</option>
          ))}
        </select>

        {/* Language filter */}
        {availableLanguages.length > 1 && (
          <select
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            aria-label={t('downloads.filterLanguage')}
            className="h-9 rounded-lg border border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] px-3 text-sm text-[color:var(--mono-navy)] focus:border-[color:var(--mono-steel)] focus:outline-none focus:ring-1 focus:ring-[color:var(--mono-steel)]"
          >
            <option value="all">{t('downloads.allLanguages')}</option>
            {availableLanguages.map(lang => (
              <option key={lang} value={lang}>{langLabel(lang)}</option>
            ))}
          </select>
        )}
      </div>

      {/* Document groups */}
      {filteredGroups.length === 0 ? (
        <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-10 text-center">
          <p className="text-sm text-[color:var(--mono-muted)]">{t('downloads.noResults')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredGroups.map(group => (
            <div key={group.productId} className="rounded-xl border border-[color:var(--mono-line)] bg-white shadow-sm overflow-hidden">
              {/* Product header */}
              <div className="border-b border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] px-5 py-3">
                <h2 className="font-heading text-sm font-semibold text-[color:var(--mono-navy)]">{group.productName}</h2>
              </div>

              {/* Document list */}
              <ul className="divide-y divide-[color:var(--mono-line)]" role="list">
                {group.documents.map(doc => {
                  const size = formatFileSize(doc.fileSize)
                  return (
                    <li key={doc.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-[color:var(--mono-bg)] transition-colors">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--mono-ice)]">
                          <FileText className="h-4 w-4 text-[color:var(--mono-steel)]" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[color:var(--mono-navy)] truncate">{doc.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center rounded-full bg-[color:var(--mono-ice)] px-2 py-0.5 text-xs font-medium text-[color:var(--mono-steel)]">
                              {docTypeLabel(doc.type)}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-[color:var(--mono-line)] px-2 py-0.5 text-xs font-medium text-[color:var(--mono-muted)]">
                              {langLabel(doc.language)}
                            </span>
                            {size && (
                              <span className="text-xs text-[color:var(--mono-muted)]">{size}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl}
                        download={doc.fileName ?? undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[color:var(--mono-steel)] bg-white px-3 py-1.5 text-sm font-medium text-[color:var(--mono-steel)] hover:bg-[color:var(--mono-ice)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)]"
                        aria-label={`${t('downloads.download')} ${doc.title}`}
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        {t('downloads.download')}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
