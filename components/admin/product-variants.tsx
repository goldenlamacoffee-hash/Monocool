'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2, Layers, X, Check } from 'lucide-react'
import {
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  toggleProductVariantActive,
} from '@/app/actions/product-variants'

interface Variant {
  id: number
  productId: number
  name: string
  sku: string | null
  price: string | null
  coolingOutput: string | null
  heatingOutput: string | null
  technicalData: string | null
  isActive: boolean
  sortOrder: number
}

interface VariantFormData {
  name: string
  sku: string
  price: string
  coolingOutput: string
  heatingOutput: string
  technicalData: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: VariantFormData = {
  name: '',
  sku: '',
  price: '',
  coolingOutput: '',
  heatingOutput: '',
  technicalData: '',
  sortOrder: '0',
  isActive: true,
}

interface ProductVariantsProps {
  productId: number
  onUpdate?: () => void
}

export function ProductVariants({ productId, onUpdate }: ProductVariantsProps) {
  const t = useTranslations('admin.variants')
  const tCommon = useTranslations('common')

  const [variants, setVariants] = useState<Variant[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<VariantFormData>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadingList(true)
    try {
      const rows = await getProductVariants(productId)
      setVariants(rows as Variant[])
    } catch (err) {
      console.error('[v0] Error loading variants:', err)
      setError(t('loadError'))
    } finally {
      setLoadingList(false)
    }
  }, [productId, t])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setFormData(emptyForm)
    setEditingId(null)
    setShowForm(false)
  }

  const openCreate = () => {
    setFormData({ ...emptyForm, sortOrder: String(variants.length) })
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (v: Variant) => {
    setFormData({
      name: v.name,
      sku: v.sku ?? '',
      price: v.price ?? '',
      coolingOutput: v.coolingOutput ?? '',
      heatingOutput: v.heatingOutput ?? '',
      technicalData: v.technicalData ?? '',
      sortOrder: String(v.sortOrder),
      isActive: v.isActive,
    })
    setEditingId(v.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError(t('nameRequired'))
      return
    }
    setSaving(true)
    setError(null)

    // Empty price string -> null (falls back to parent product price later).
    const priceValue = formData.price.trim() === '' ? null : Number(formData.price)
    if (priceValue !== null && Number.isNaN(priceValue)) {
      setError(t('priceInvalid'))
      setSaving(false)
      return
    }
    const sortOrderValue = Number(formData.sortOrder) || 0

    try {
      if (editingId) {
        await updateProductVariant(editingId, productId, {
          name: formData.name,
          sku: formData.sku,
          price: priceValue,
          coolingOutput: formData.coolingOutput,
          heatingOutput: formData.heatingOutput,
          technicalData: formData.technicalData,
          isActive: formData.isActive,
          sortOrder: sortOrderValue,
        })
      } else {
        await createProductVariant({
          productId,
          name: formData.name,
          sku: formData.sku,
          price: priceValue,
          coolingOutput: formData.coolingOutput,
          heatingOutput: formData.heatingOutput,
          technicalData: formData.technicalData,
          isActive: formData.isActive,
          sortOrder: sortOrderValue,
        })
      }
      resetForm()
      await load()
      onUpdate?.()
    } catch (err) {
      console.error('[v0] Error saving variant:', err)
      setError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    setBusyId(id)
    try {
      await deleteProductVariant(id, productId)
      await load()
      onUpdate?.()
    } catch (err) {
      console.error('[v0] Error deleting variant:', err)
      setError(err instanceof Error ? err.message : t('deleteError'))
    } finally {
      setBusyId(null)
    }
  }

  const handleToggle = async (v: Variant) => {
    setBusyId(v.id)
    try {
      await toggleProductVariantActive(v.id, productId, !v.isActive)
      await load()
      onUpdate?.()
    } catch (err) {
      console.error('[v0] Error toggling variant:', err)
      setError(err instanceof Error ? err.message : t('saveError'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('title')} ({variants.length})
        </h3>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('addVariant')}
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add / edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-border p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="v-name">{t('name')}</Label>
              <Input
                id="v-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Reverso FS 200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-sku">{t('sku')}</Label>
              <Input
                id="v-sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-price">{t('price')}</Label>
              <Input
                id="v-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder={t('pricePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-cooling">{t('coolingOutput')}</Label>
              <Input
                id="v-cooling"
                value={formData.coolingOutput}
                onChange={(e) => setFormData({ ...formData, coolingOutput: e.target.value })}
                placeholder="880 W"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-heating">{t('heatingOutput')}</Label>
              <Input
                id="v-heating"
                value={formData.heatingOutput}
                onChange={(e) => setFormData({ ...formData, heatingOutput: e.target.value })}
                placeholder="1100 W"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-sort">{t('sortOrder')}</Label>
              <Input
                id="v-sort"
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                id="v-active"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="v-active" className="cursor-pointer">
                {t('active')}
              </Label>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="v-tech">{t('technicalData')}</Label>
              <Textarea
                id="v-tech"
                rows={2}
                value={formData.technicalData}
                onChange={(e) => setFormData({ ...formData, technicalData: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={resetForm}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? tCommon('save') : t('addVariant')}
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      {loadingList ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : variants.length > 0 ? (
        <div className="space-y-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{v.name}</span>
                  <Badge variant={v.isActive ? 'default' : 'secondary'}>
                    {v.isActive ? t('active') : t('inactive')}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {v.price ? `${Number(v.price).toLocaleString('de-AT')} EUR` : t('priceFallback')}
                  {v.coolingOutput ? ` · ${t('coolingShort')}: ${v.coolingOutput}` : ''}
                  {v.heatingOutput ? ` · ${t('heatingShort')}: ${v.heatingOutput}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggle(v)}
                  disabled={busyId === v.id}
                  title={v.isActive ? t('deactivate') : t('activate')}
                >
                  {busyId === v.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : v.isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(v)} title={tCommon('edit')}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(v.id)}
                  disabled={busyId === v.id}
                  title={t('delete')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 py-8">
            <Layers className="mb-2 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          </div>
        )
      )}
    </div>
  )
}
