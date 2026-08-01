'use client'

import { useState, useCallback } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useBasket } from '@/contexts/basket-context'
import { type BasketItemInput } from '@/lib/basket'
import { useTranslations } from 'next-intl'

interface BasketAddButtonProps {
  item: BasketItemInput
  className?: string
}

/**
 * "Add to Basket" client button.
 *
 * Receives a fully-resolved, server-computed `BasketItemInput` (prices frozen
 * at render time on the server). Only rendered for approved partners — the
 * product page gates rendering to `priceView.state === 'approved'`.
 */
export function BasketAddButton({ item, className }: BasketAddButtonProps) {
  const { addItem } = useBasket()
  const t = useTranslations('basket')
  const [added, setAdded] = useState(false)

  const handleAdd = useCallback(() => {
    addItem(item)
    setAdded(true)
    const timer = setTimeout(() => setAdded(false), 1800)
    return () => clearTimeout(timer)
  }, [addItem, item])

  return (
    <button
      type="button"
      onClick={handleAdd}
      aria-label={added ? t('added') : t('addToBasket')}
      className={[
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-sm font-semibold transition-colors',
        added
          ? 'bg-secondary text-secondary-foreground'
          : 'bg-primary text-primary-foreground hover:bg-mono-deep',
        className ?? '',
      ].join(' ')}
    >
      {added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {added ? t('added') : t('addToBasket')}
    </button>
  )
}
