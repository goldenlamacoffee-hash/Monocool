'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Upload,
  Trash2,
  Loader2,
  FileText,
  X,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Pencil,
  Check,
} from 'lucide-react'
import {
  getProductDocumentsAdmin,
  createProductDocument,
  updateProductDocument,
  deleteProductDocument,
  toggleProductDocumentActive,
} from '@/app/actions/documents'
import type { ProductDocument } from '@/lib/db/schema'

// Document types with localisation keys.
const DOCUMENT_TYPES = [
  'manual',
  'datasheet',
  'installation_guide',
  'energy_label',
  'declaration_of_conformity',
  'brochure',
  'other',
] as const

const LANGUAGES = ['de', 'sk', 'cs', 'en'] as const

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface ProductDocumentsProps {
  productId: number
  onUpdate?: () => void
}

export function ProductDocuments({ productId, onUpdate }: ProductDocumentsProps) {
  const t = useTranslations('admin.documents')

  const [docs, setDocs] = useState<ProductDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Upload form state.
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadType, setUploadType] = useState<string>('manual')
  const [uploadLanguage, setUploadLanguage] = useState<string>('de')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Inline edit state.
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editType, setEditType] = useState('')
  const [editLanguage, setEditLanguage] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getProductDocumentsAdmin(productId)
      setDocs(rows)
    } catch {
      setError(t('loadError'))
    } finally {
      setLoading(false)
    }
  }, [productId, t])

  useEffect(() => { load() }, [load])

  // ---- Upload ----

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (file.type !== 'application/pdf' || ext !== 'pdf') {
      setError(t('pdfOnly'))
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError(t('fileTooLarge'))
      return
    }
    setError(null)
    setSelectedFile(file)
    // Pre-fill title from filename if empty.
    if (!uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '))
    }
  }, [uploadTitle, t])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }, [handleFileSelect])

  const handleUpload = async () => {
    if (!selectedFile) { setError(t('noFileSelected')); return }
    if (!uploadTitle.trim()) { setError(t('titleRequired')); return }

    setError(null)
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('productId', productId.toString())

      const res = await fetch('/api/upload-document', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) { setError(data.error || t('uploadError')); return }

      await createProductDocument({
        productId,
        title: uploadTitle.trim(),
        type: uploadType,
        language: uploadLanguage,
        fileUrl: data.url,
        pathname: data.pathname,
        fileName: data.fileName,
        fileSize: data.fileSize,
      })

      // Reset form.
      setUploadTitle('')
      setUploadType('manual')
      setUploadLanguage('de')
      setSelectedFile(null)
      await load()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('uploadError'))
    } finally {
      setUploading(false)
    }
  }

  // ---- Inline edit ----

  const startEdit = (doc: ProductDocument) => {
    setEditingId(doc.id)
    setEditTitle(doc.title)
    setEditType(doc.type)
    setEditLanguage(doc.language)
  }

  const saveEdit = async (id: number) => {
    setSavingId(id)
    try {
      await updateProductDocument(id, { title: editTitle, type: editType, language: editLanguage })
      setEditingId(null)
      await load()
      onUpdate?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSavingId(null)
    }
  }

  const cancelEdit = () => setEditingId(null)

  // ---- Toggle active ----

  const handleToggle = async (id: number) => {
    setTogglingId(id)
    try {
      await toggleProductDocumentActive(id)
      await load()
      onUpdate?.()
    } catch {
      setError(t('toggleError'))
    } finally {
      setTogglingId(null)
    }
  }

  // ---- Delete ----

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await deleteProductDocument(id)
      await load()
      onUpdate?.()
    } catch {
      setError(t('deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  // ---- Reorder ----

  const moveDoc = async (index: number, direction: -1 | 1) => {
    const target = docs[index + direction]
    const current = docs[index]
    if (!target) return
    await Promise.all([
      updateProductDocument(current.id, { sortOrder: target.sortOrder }),
      updateProductDocument(target.id, { sortOrder: current.sortOrder }),
    ])
    await load()
    onUpdate?.()
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-2 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload form */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">{t('uploadNew')}</p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-5 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          {selectedFile ? (
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-5 w-5 shrink-0 text-secondary" />
                <span className="truncate text-sm font-medium text-foreground">{selectedFile.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
              </div>
              <button onClick={() => setSelectedFile(null)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium text-foreground">{t('dropzone')}</p>
              <p className="text-xs text-muted-foreground">{t('pdfHint')}</p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </>
          )}
        </div>

        {/* Metadata fields */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-3 space-y-1.5">
            <Label htmlFor="doc-title">{t('docTitle')} *</Label>
            <Input
              id="doc-title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder={t('docTitlePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-type">{t('docType')}</Label>
            <select
              id="doc-type"
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>{t(`type_${type}`)}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-lang">{t('language')}</Label>
            <select
              id="doc-lang"
              value={uploadLanguage}
              onChange={(e) => setUploadLanguage(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{t(`lang_${lang}`)}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleUpload} disabled={uploading || !selectedFile} className="w-full">
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading ? t('uploading') : t('upload')}
            </Button>
          </div>
        </div>
      </div>

      {/* Document list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 py-8">
          <FileText className="mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc, index) => (
            <div
              key={doc.id}
              className={`rounded-lg border border-border bg-card p-3 transition-opacity ${doc.isActive ? '' : 'opacity-50'}`}
            >
              {editingId === doc.id ? (
                /* Inline edit row */
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <option key={type} value={type}>{t(`type_${type}`)}</option>
                      ))}
                    </select>
                    <select
                      value={editLanguage}
                      onChange={(e) => setEditLanguage(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang} value={lang}>{t(`lang_${lang}`)}</option>
                      ))}
                    </select>
                    <Button size="sm" variant="default" onClick={() => saveEdit(doc.id)} disabled={savingId === doc.id}>
                      {savingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ) : (
                /* Display row */
                <div className="flex items-start gap-3">
                  {/* Reorder */}
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button onClick={() => moveDoc(index, -1)} disabled={index === 0} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => moveDoc(index, 1)} disabled={index === docs.length - 1} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`type_${doc.type}`)} · {t(`lang_${doc.language}`)}
                      {doc.fileName && ` · ${doc.fileName}`}
                      {doc.fileSize ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      title={t('preview')}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => handleToggle(doc.id)}
                      disabled={togglingId === doc.id}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground disabled:opacity-50"
                      title={doc.isActive ? t('deactivate') : t('activate')}
                    >
                      {togglingId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : doc.isActive ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(doc)}
                      className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                      title={t('edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="flex h-7 w-7 items-center justify-center rounded text-destructive/70 hover:text-destructive disabled:opacity-50"
                      title={t('delete')}
                    >
                      {deletingId === doc.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
