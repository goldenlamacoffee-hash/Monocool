'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createProduct, updateProduct, deleteProduct, toggleProductActive } from '@/app/actions/products'
import { getDomainFromLocale, getPreviewUrl } from '@/lib/domain-utils'
import { getProductImages } from '@/app/actions/gallery'
import { Plus, Pencil, Trash2, ArrowLeft, ToggleLeft, ToggleRight, ImageIcon, SlidersHorizontal, Check, Package } from 'lucide-react'
import { type Locale } from '@/i18n/config'
import { ProductGallery } from './product-gallery'

interface Product {
  id: number
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  price: string | null
  category: string | null
  coolingCapacity: string | null
  heatingCapacity: string | null
  energyClass: string | null
  noiseLevel: string | null
  dimensions: string | null
  weight: string | null
  features: string[] | null
  technicalData: string | null
  seoTitle: string | null
  seoDescription: string | null
  ogImage: string | null
  isActive: boolean
  sortOrder: number
}

interface ProductFormData {
  name: string
  slug: string
  description: string
  shortDescription: string
  price: string
  category: string
  coolingCapacity: string
  heatingCapacity: string
  energyClass: string
  noiseLevel: string
  dimensions: string
  weight: string
  features: string
  technicalData: string
  seoTitle: string
  seoDescription: string
  ogImage: string
  sortOrder: string
  isActive: boolean
}

interface ProductImage {
  id: number
  productId: number
  url: string
  pathname: string
  alt: string | null
  sortOrder: number
  isPrimary: boolean
  createdAt: Date
}

const emptyForm: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  price: '',
  category: '',
  coolingCapacity: '',
  heatingCapacity: '',
  energyClass: '',
  noiseLevel: '',
  dimensions: '',
  weight: '',
  features: '',
  technicalData: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  sortOrder: '0',
  isActive: true,
}

export function ProductsManager({ initialProducts, locale }: { initialProducts: Product[], locale: Locale }) {
  const router = useRouter()
  const t = useTranslations('admin.productManagement')
  const tCommon = useTranslations('common')
  const [products, setProducts] = useState(initialProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState<ProductFormData>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false)
  const [galleryProduct, setGalleryProduct] = useState<Product | null>(null)
  const [galleryImages, setGalleryImages] = useState<ProductImage[]>([])
  // Column visibility state
  const [showFeatures, setShowFeatures] = useState(false)
  const [showTechnicalData, setShowTechnicalData] = useState(false)

  const loadGalleryImages = useCallback(async (productId: number) => {
    const images = await getProductImages(productId)
    setGalleryImages(images)
  }, [])

  const openGalleryDialog = async (product: Product) => {
    setGalleryProduct(product)
    await loadGalleryImages(product.id)
    setGalleryDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingProduct(null)
    setFormData(emptyForm)
    setSaveError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setSaveError(null)
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: product.price || '',
      category: product.category || '',
      coolingCapacity: product.coolingCapacity || '',
      heatingCapacity: product.heatingCapacity || '',
      energyClass: product.energyClass || '',
      noiseLevel: product.noiseLevel || '',
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      features: product.features?.join('\n') || '',
      technicalData: product.technicalData || '',
      seoTitle: product.seoTitle || '',
      seoDescription: product.seoDescription || '',
      ogImage: product.ogImage || '',
      sortOrder: String(product.sortOrder ?? 0),
      isActive: product.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaveError(null)

    try {
      const data = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        category: formData.category || undefined,
        coolingCapacity: formData.coolingCapacity || undefined,
        heatingCapacity: formData.heatingCapacity || undefined,
        energyClass: formData.energyClass || undefined,
        noiseLevel: formData.noiseLevel || undefined,
        dimensions: formData.dimensions || undefined,
        weight: formData.weight || undefined,
        features: formData.features ? formData.features.split('\n').filter(f => f.trim()) : undefined,
        technicalData: formData.technicalData || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        ogImage: formData.ogImage || undefined,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder, 10) : undefined,
        isActive: formData.isActive,
      }

      if (editingProduct) {
        await updateProduct(editingProduct.id, data)
      } else {
        await createProduct({ ...data, domain: getDomainFromLocale(locale) })
      }

      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving product:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('confirmDelete'))) return
    
    try {
      await deleteProduct(id)
      router.refresh()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/admin`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              {t('backToAdmin') || 'Zurück'}
            </Link>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button 
                onClick={openCreateDialog}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
              >
                <Plus className="h-4 w-4" />
                {t('newProduct')}
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? t('editProduct') : t('createProduct')}
                </DialogTitle>
                <DialogDescription>
                  {t('productForm')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('name')} *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">{t('slug')}</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder={t('slugPlaceholder')}
                    />
                    {(formData.slug || formData.name) && (
                      <p className="break-all text-xs text-muted-foreground">
                        {getPreviewUrl(
                          getDomainFromLocale(locale),
                          `produkte/${formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-')}`,
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">
                      {locale === 'sk' ? 'Poradie' : locale === 'cs' ? 'Pořadí' : locale === 'de' ? 'Reihenfolge' : 'Sort order'}
                    </Label>
                    <Input
                      id="sortOrder"
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      {locale === 'sk'
                        ? 'Nižšie čísla sa zobrazujú skôr.'
                        : locale === 'cs'
                        ? 'Nižší čísla se zobrazují dříve.'
                        : locale === 'de'
                        ? 'Niedrigere Zahlen erscheinen zuerst.'
                        : 'Lower numbers appear first.'}
                    </p>
                  </div>
                  <div className="flex items-end pb-1">
                    <label htmlFor="isActive" className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                      <input
                        id="isActive"
                        type="checkbox"
                        className="h-4 w-4 rounded border-border accent-primary"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      {locale === 'sk'
                        ? 'Aktívny (viditeľný na stránke)'
                        : locale === 'cs'
                        ? 'Aktivní (viditelný na webu)'
                        : locale === 'de'
                        ? 'Aktiv (auf der Website sichtbar)'
                        : 'Active (visible on site)'}
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shortDescription">{t('shortDescription')}</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('description')}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('price')}</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">{t('category')}</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="coolingCapacity">{t('coolingCapacity')}</Label>
                    <Input
                      id="coolingCapacity"
                      value={formData.coolingCapacity}
                      onChange={(e) => setFormData({ ...formData, coolingCapacity: e.target.value })}
                      placeholder="z.B. 2.5 kW"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="heatingCapacity">{t('heatingCapacity')}</Label>
                    <Input
                      id="heatingCapacity"
                      value={formData.heatingCapacity}
                      onChange={(e) => setFormData({ ...formData, heatingCapacity: e.target.value })}
                      placeholder="z.B. 2.3 kW"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="energyClass">{t('energyClass')}</Label>
                    <Input
                      id="energyClass"
                      value={formData.energyClass}
                      onChange={(e) => setFormData({ ...formData, energyClass: e.target.value })}
                      placeholder="z.B. A++"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="noiseLevel">{t('noiseLevel')}</Label>
                    <Input
                      id="noiseLevel"
                      value={formData.noiseLevel}
                      onChange={(e) => setFormData({ ...formData, noiseLevel: e.target.value })}
                      placeholder="z.B. 19 dB(A)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">{t('weight')}</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="z.B. 35 kg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dimensions">{t('dimensions')}</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="z.B. 800 x 200 x 550 mm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="features">{t('features')}</Label>
                  <Textarea
                    id="features"
                    value={formData.features}
                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                    rows={4}
                    placeholder="WiFi-Steuerung&#10;Inverter-Technologie&#10;Timer-Funktion"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technicalData">{locale === 'sk' ? 'Technické údaje' : locale === 'cs' ? 'Technické údaje' : locale === 'de' ? 'Technische Daten' : 'Technical Data'}</Label>
                  <Textarea
                    id="technicalData"
                    value={formData.technicalData}
                    onChange={(e) => setFormData({ ...formData, technicalData: e.target.value })}
                    rows={4}
                    placeholder={locale === 'sk' ? 'Zadajte technické údaje produktu...' : locale === 'cs' ? 'Zadejte technické údaje produktu...' : locale === 'de' ? 'Technische Daten eingeben...' : 'Enter product technical data...'}
                  />
                </div>

                <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">SEO</h3>
                    <p className="text-xs text-muted-foreground">
                      {locale === 'sk'
                        ? 'Ak ostane prázdne, použijú sa predvolené hodnoty produktu.'
                        : locale === 'cs'
                        ? 'Pokud zůstane prázdné, použijí se výchozí hodnoty produktu.'
                        : locale === 'de'
                        ? 'Wenn leer, werden die Standardwerte des Produkts verwendet.'
                        : 'If left empty, the product defaults are used.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seoTitle">SEO Title</Label>
                    <Input
                      id="seoTitle"
                      value={formData.seoTitle}
                      onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      maxLength={70}
                      placeholder={locale === 'de' ? 'z.B. Produktname | Monocool' : 'e.g. Product name | Monocool'}
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

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? t('saving') : editingProduct ? tCommon('save') : t('create')}
                  </Button>
                </div>
                {saveError && (
                  <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {saveError}
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">{t('title')}</h1>
        </div>

        {/* Column visibility dropdown */}
        <div className="mb-4 flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              {locale === 'sk' ? 'Stĺpce' : locale === 'cs' ? 'Sloupce' : locale === 'de' ? 'Spalten' : 'Columns'}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                {locale === 'sk' ? 'Zobraziť stĺpce' : locale === 'cs' ? 'Zobrazit sloupce' : locale === 'de' ? 'Spalten anzeigen' : 'Toggle columns'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showFeatures}
                onCheckedChange={(val) => setShowFeatures(val)}
              >
                {locale === 'sk' ? 'Vlastnosti' : locale === 'cs' ? 'Vlastnosti' : locale === 'de' ? 'Eigenschaften' : 'Features'}
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showTechnicalData}
                onCheckedChange={(val) => setShowTechnicalData(val)}
              >
                {locale === 'sk' ? 'Technické údaje' : locale === 'cs' ? 'Technické údaje' : locale === 'de' ? 'Technische Daten' : 'Technical Data'}
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="rounded-2xl border-border shadow-sm">
          <CardContent className="p-0">
            {products.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('name')}</TableHead>
                    <TableHead>{t('category')}</TableHead>
                    <TableHead>{t('price')}</TableHead>
                    {showFeatures && (
                      <TableHead>{locale === 'sk' ? 'Vlastnosti' : locale === 'cs' ? 'Vlastnosti' : locale === 'de' ? 'Eigenschaften' : 'Features'}</TableHead>
                    )}
                    {showTechnicalData && (
                      <TableHead>{locale === 'sk' ? 'Technické údaje' : locale === 'cs' ? 'Technické údaje' : locale === 'de' ? 'Technische Daten' : 'Technical Data'}</TableHead>
                    )}
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="text-right">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>
                        {product.price ? `${Number(product.price).toLocaleString('de-AT')} EUR` : '-'}
                      </TableCell>
                      {showFeatures && (
                        <TableCell className="max-w-xs">
                          {product.features && product.features.length > 0 ? (
                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                              {product.features.slice(0, 3).map((f, i) => (
                                <li key={i} className="truncate">{f}</li>
                              ))}
                              {product.features.length > 3 && (
                                <li className="text-xs">+{product.features.length - 3} {locale === 'sk' ? 'ďalších' : locale === 'cs' ? 'dalších' : locale === 'de' ? 'weitere' : 'more'}</li>
                              )}
                            </ul>
                          ) : '-'}
                        </TableCell>
                      )}
                      {showTechnicalData && (
                        <TableCell className="max-w-xs">
                          {product.technicalData ? (
                            <p className="text-sm text-muted-foreground line-clamp-3">{product.technicalData}</p>
                          ) : '-'}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? t('active') : t('inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openGalleryDialog(product)}
                            title="Gallery"
                          >
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-secondary">
                  <Package className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="mt-4 font-heading text-lg font-semibold text-foreground">{t('noProducts')}</p>
                <Button className="mt-5" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('firstProduct')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Dialog */}
        <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {galleryProduct?.name} - {t('gallery') || 'Gallery'}
              </DialogTitle>
              <DialogDescription>
                {t('galleryDesc') || 'Manage product images'}
              </DialogDescription>
            </DialogHeader>
            {galleryProduct && (
              <ProductGallery
                productId={galleryProduct.id}
                images={galleryImages}
                onUpdate={() => {
                  loadGalleryImages(galleryProduct.id)
                  router.refresh()
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
