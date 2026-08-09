'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  type BasketItem,
  type BasketItemInput,
  makeBasketKey,
  loadBasketFromStorage,
  saveBasketToStorage,
  clearBasketStorage,
  computeBasketSubtotal,
  computeBasketCount,
} from '@/lib/basket'

// ---------------------------------------------------------------------------
// State + Reducer
// ---------------------------------------------------------------------------

type BasketState = {
  items: BasketItem[]
  hydrated: boolean // false on SSR, true once localStorage has been read
}

type BasketAction =
  | { type: 'HYDRATE'; items: BasketItem[] }
  | { type: 'ADD'; input: BasketItemInput }
  | { type: 'REMOVE'; key: string }
  | { type: 'SET_QTY'; key: string; quantity: number }
  | { type: 'CLEAR' }

function basketReducer(state: BasketState, action: BasketAction): BasketState {
  switch (action.type) {
    case 'HYDRATE':
      return { items: action.items, hydrated: true }

    case 'ADD': {
      const key = makeBasketKey(action.input.productId, action.input.variantId)
      const existing = state.items.find((i) => i.key === key)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      return {
        ...state,
        items: [...state.items, { key, quantity: 1, ...action.input }],
      }
    }

    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.key !== action.key) }

    case 'SET_QTY': {
      if (action.quantity < 1) {
        return { ...state, items: state.items.filter((i) => i.key !== action.key) }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.key === action.key ? { ...i, quantity: action.quantity } : i
        ),
      }
    }

    case 'CLEAR':
      return { items: [], hydrated: state.hydrated }

    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

type BasketContextValue = {
  items: BasketItem[]
  hydrated: boolean
  count: number
  subtotal: number
  addItem: (input: BasketItemInput) => void
  removeItem: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clearBasket: () => void
  // V1.4J.3 — current market commerce settings, DISPLAY ONLY. The server
  // (placeOrder) independently re-reads these from site_settings and is the
  // sole authority for what actually gets charged. Never persisted to
  // localStorage — basket storage remains product items only.
  deliveryPrice: number
  vatRate: number
  currency: string
}

const BasketContext = createContext<BasketContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface BasketProviderProps {
  children: ReactNode
  /** Current market's NET delivery price. Display only — see BasketContextValue. */
  deliveryPrice?: number
  /** Current market's VAT rate (%). Display only — see BasketContextValue. */
  vatRate?: number
  /** Current market's currency code (e.g. "EUR", "CZK"). Display only. */
  currency?: string
}

export function BasketProvider({
  children,
  deliveryPrice = 0,
  vatRate = 20,
  currency = 'EUR',
}: BasketProviderProps) {
  const [state, dispatch] = useReducer(basketReducer, { items: [], hydrated: false })

  // Hydrate from localStorage once on mount (client only)
  useEffect(() => {
    dispatch({ type: 'HYDRATE', items: loadBasketFromStorage() })
  }, [])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (!state.hydrated) return
    if (state.items.length === 0) {
      clearBasketStorage()
    } else {
      saveBasketToStorage(state.items)
    }
  }, [state.items, state.hydrated])

  const addItem = useCallback((input: BasketItemInput) => {
    dispatch({ type: 'ADD', input })
  }, [])

  const removeItem = useCallback((key: string) => {
    dispatch({ type: 'REMOVE', key })
  }, [])

  const setQuantity = useCallback((key: string, quantity: number) => {
    dispatch({ type: 'SET_QTY', key, quantity })
  }, [])

  const clearBasket = useCallback(() => {
    dispatch({ type: 'CLEAR' })
    clearBasketStorage()
  }, [])

  return (
    <BasketContext.Provider
      value={{
        items: state.items,
        hydrated: state.hydrated,
        count: computeBasketCount(state.items),
        subtotal: computeBasketSubtotal(state.items),
        addItem,
        removeItem,
        setQuantity,
        clearBasket,
        deliveryPrice,
        vatRate,
        currency,
      }}
    >
      {children}
    </BasketContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBasket(): BasketContextValue {
  const ctx = useContext(BasketContext)
  if (!ctx) {
    throw new Error('useBasket must be used inside <BasketProvider>')
  }
  return ctx
}
