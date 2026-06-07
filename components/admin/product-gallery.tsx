'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Trash2, 
  Star, 
  StarOff, 
  Loader2,
  ImageIcon,
  X
} from 'lucide-react'
import {
  addProductImage,
  deleteProductImage,
  setImageAsPrimary,
} from '@/app/actions/gallery'

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

interface ProductGalleryProps {
  productId: number
  images: ProductImage[]
  onUpdate: () => void
}

export function ProductGallery({ productId, images, onUpdate }: ProductGalleryProps) {
  const t = useTranslations('admin.gallery')
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [settingPrimaryId, setSettingPrimaryId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    
    setError(null)
    setUploading(true)

    try {
      for (const file of Array.from(files)) {
        // Validate on client side too
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        if (!allowedTypes.includes(file.type)) {
          setError('Invalid file type. Allowed: JPEG, PNG, WebP, GIF')
          continue
        }

        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
          setError('File too large. Maximum size: 5MB')
          continue
        }

        // Upload to blob storage
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', productId.toString())

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Upload failed')
          continue
        }

        const { url, pathname } = data

        // Add to database
        await addProductImage({
          productId,
          url,
          pathname,
          alt: file.name.replace(/\.[^/.]+$/, ''),
        })
      }

      onUpdate()
    } catch (err) {
      setError('Failed to upload image')
      console.error('[v0] Upload error:', err)
    } finally {
      setUploading(false)
    }
  }, [productId, onUpdate])

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId)
    try {
      await deleteProductImage(imageId)
      onUpdate()
    } catch (err) {
      setError('Failed to delete image')
      console.error('[v0] Delete error:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetPrimary = async (imageId: number) => {
    setSettingPrimaryId(imageId)
    try {
      await setImageAsPrimary(imageId)
      onUpdate()
    } catch (err) {
      setError('Failed to set primary image')
      console.error('[v0] Set primary error:', err)
    } finally {
      setSettingPrimaryId(null)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          {t('title')} ({images.length})
        </h3>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-destructive hover:text-destructive/80">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('uploading')}</p>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium text-foreground">
              {t('dropzone')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('formats')}
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </>
        )}
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                image.isPrimary ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image
                src={image.url}
                alt={image.alt || ''}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              
              {/* Primary badge */}
              {image.isPrimary && (
                <div className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {t('primary')}
                </div>
              )}

              {/* Hover overlay with actions */}
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                {!image.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(image.id)}
                    disabled={settingPrimaryId === image.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-50"
                    title={t('setPrimary')}
                  >
                    {settingPrimaryId === image.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(image.id)}
                  disabled={deletingId === image.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/80 text-white transition-colors hover:bg-destructive disabled:opacity-50"
                  title={t('delete')}
                >
                  {deletingId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 py-8">
          <ImageIcon className="mb-2 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      )}
    </div>
  )
}
