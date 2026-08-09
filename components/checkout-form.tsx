'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Loader2 } from 'lucide-react'
import { useBasket } from '@/contexts/basket-context'
import { placeOrder } from '@/app/actions/orders'
import { useTranslations } from 'next-intl'
import { type Locale } from '@/i18n/config'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface UserProfile {
  name: string | null
  email: string | null
  companyName: string | null
  companyId: string | null
  vatNumber: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  phone: string | null
}

interface Props {
  locale: Locale
  userProfile: UserProfile | null
}

export function CheckoutForm({ locale, userProfile }: Props) {
  const { items, subtotal, clearBasket, hydrated, deliveryPrice, vatRate, currency } = useBasket()
  const t = useTranslations('checkout')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [customerNote, setCustomerNote] = useState('')
  // Shipping address — pre-filled from user profile
  const [shipAddress, setShipAddress] = useState(userProfile?.address ?? '')
  const [shipCity, setShipCity] = useState(userProfile?.city ?? '')
  const [shipPostal, setShipPostal] = useState(userProfile?.postalCode ?? '')
  const [shipCountry, setShipCountry] = useState(userProfile?.country ?? '')
  // Billing same as shipping toggle
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true)
  const [billAddress, setBillAddress] = useState(userProfile?.address ?? '')
  const [billCity, setBillCity] = useState(userProfile?.city ?? '')
  const [billPostal, setBillPostal] = useState(userProfile?.postalCode ?? '')
  const [billCountry, setBillCountry] = useState(userProfile?.country ?? '')

  // V1.4J.3 — delivery is charged ONCE per order. This is a DISPLAY-ONLY
  // preview: placeOrder() below never receives this deliveryPrice and always
  // re-reads the authoritative value server-side at order-creation time.
  const itemsVat = Math.round(subtotal * (vatRate / 100) * 100) / 100
  const deliveryVat = Math.round(deliveryPrice * (vatRate / 100) * 100) / 100
  const vatAmount = itemsVat + deliveryVat
  const grandTotal = Math.round((subtotal + deliveryPrice + vatAmount) * 100) / 100

  const fmt = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (items.length === 0) return
    setError(null)

    startTransition(async () => {
      try {
        const shippingAddress = {
          address: shipAddress.trim() || undefined,
          city: shipCity.trim() || undefined,
          postalCode: shipPostal.trim() || undefined,
          country: shipCountry.trim() || undefined,
        }
        const billingAddress = billingSameAsShipping
          ? shippingAddress
          : {
              address: billAddress.trim() || undefined,
              city: billCity.trim() || undefined,
              postalCode: billPostal.trim() || undefined,
              country: billCountry.trim() || undefined,
            }

        const result = await placeOrder({
          locale,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            productName: i.productName,
            variantName: i.variantName,
            sku: i.sku,
          })),
          customerNote: customerNote.trim() || undefined,
          shippingAddress,
          billingAddress,
        })

        clearBasket()
        router.push(`/${locale}/bestellung-bestaetigung/${result.orderNumber}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('errorGeneric'))
      }
    })
  }

  // Skeleton while basket hydrates
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  // Empty basket guard
  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 px-4 py-24 text-center sm:px-6 lg:px-8">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" aria-hidden="true" />
        <h1 className="font-heading text-2xl font-semibold text-foreground">{t('emptyTitle')}</h1>
        <Link
          href={`/${locale}/produkte`}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToProducts')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/${locale}/warenkorb`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t('backToBasket')}
      </Link>

      <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground mb-8">
        {t('pageTitle')}
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left column — form fields */}
          <div className="lg:col-span-2 space-y-8">
            {/* Company info (read-only display) */}
            {(userProfile?.companyName || userProfile?.name) && (
              <section className="rounded-2xl border border-border bg-card p-6">
                <h2 className="font-heading text-base font-semibold text-foreground mb-4">
                  {t('companyInfo')}
                </h2>
                <div className="grid gap-3 text-sm">
                  {userProfile.companyName && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-32 shrink-0">{t('company')}</span>
                      <span className="text-foreground font-medium">{userProfile.companyName}</span>
                    </div>
                  )}
                  {userProfile.name && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-32 shrink-0">{t('contactName')}</span>
                      <span className="text-foreground">{userProfile.name}</span>
                    </div>
                  )}
                  {userProfile.email && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-32 shrink-0">{t('email')}</span>
                      <span className="text-foreground">{userProfile.email}</span>
                    </div>
                  )}
                  {userProfile.vatNumber && (
                    <div className="flex gap-2">
                      <span className="text-muted-foreground w-32 shrink-0">{t('vatNumber')}</span>
                      <span className="text-foreground font-mono">{userProfile.vatNumber}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Shipping address */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t('shippingAddress')}
              </h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="shipAddress">{t('address')}</Label>
                  <Input
                    id="shipAddress"
                    value={shipAddress}
                    onChange={(e) => setShipAddress(e.target.value)}
                    placeholder={t('addressPlaceholder')}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="shipPostal">{t('postalCode')}</Label>
                    <Input
                      id="shipPostal"
                      value={shipPostal}
                      onChange={(e) => setShipPostal(e.target.value)}
                      placeholder="12345"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shipCity">{t('city')}</Label>
                    <Input
                      id="shipCity"
                      value={shipCity}
                      onChange={(e) => setShipCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shipCountry">{t('country')}</Label>
                  <Input
                    id="shipCountry"
                    value={shipCountry}
                    onChange={(e) => setShipCountry(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </section>

            {/* Billing address */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold text-foreground">
                  {t('billingAddress')}
                </h2>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="rounded border-border"
                  />
                  {t('sameAsShipping')}
                </label>
              </div>

              {!billingSameAsShipping && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="billAddress">{t('address')}</Label>
                    <Input
                      id="billAddress"
                      value={billAddress}
                      onChange={(e) => setBillAddress(e.target.value)}
                      placeholder={t('addressPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="billPostal">{t('postalCode')}</Label>
                      <Input
                        id="billPostal"
                        value={billPostal}
                        onChange={(e) => setBillPostal(e.target.value)}
                        placeholder="12345"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billCity">{t('city')}</Label>
                      <Input
                        id="billCity"
                        value={billCity}
                        onChange={(e) => setBillCity(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="billCountry">{t('country')}</Label>
                    <Input
                      id="billCountry"
                      value={billCountry}
                      onChange={(e) => setBillCountry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Customer note */}
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t('orderDetails')}
              </h2>
              <div>
                <Label htmlFor="customerNote">{t('customerNote')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                  {t('customerNoteHint')}
                </p>
                <Textarea
                  id="customerNote"
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  rows={3}
                  placeholder={t('customerNotePlaceholder')}
                />
              </div>
            </section>
          </div>

          {/* Right column — order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="font-heading text-base font-semibold text-foreground">
                {t('orderSummary')}
              </h2>

              {/* Items */}
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.key} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">
                      {item.productName}
                      {item.variantName ? ` — ${item.variantName}` : ''}
                      {' ×'}{item.quantity}
                    </span>
                    <span className="shrink-0 tabular-nums font-medium">
                      {fmt(item.finalUnitPrice * item.quantity)} {currency}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('subtotal')}</span>
                  <span className="tabular-nums">{fmt(subtotal)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('delivery')}</span>
                  <span className="tabular-nums">
                    {deliveryPrice > 0 ? `${fmt(deliveryPrice)} ${currency}` : t('deliveryFree')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('vat', { rate: vatRate })}</span>
                  <span className="tabular-nums">{fmt(vatAmount)} {currency}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>{t('grandTotal')}</span>
                  <span className="tabular-nums">{fmt(grandTotal)} {currency}</span>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending || items.length === 0}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-mono-deep disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t('placing')}
                  </>
                ) : (
                  t('placeOrder')
                )}
              </button>
              <p className="text-xs text-center text-muted-foreground">{t('orderNote')}</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
