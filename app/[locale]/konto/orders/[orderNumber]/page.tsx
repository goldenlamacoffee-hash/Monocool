import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { type Locale } from '@/i18n/config'
import { resolveApprovedContext } from '@/lib/partner-portal'
import { getMyOrderByNumber } from '@/app/actions/partner-portal'
import { ArrowLeft, CheckCircle2, Circle, Clock, Package, Truck, XCircle, CreditCard } from 'lucide-react'

interface Props {
  params: Promise<{ locale: Locale; orderNumber: string }>
}

export default async function OrderDetailPage({ params }: Props) {
  const { locale, orderNumber } = await params
  setRequestLocale(locale)

  // Pending/rejected: return null — layout renders the status card; no data query runs.
  const ctx = await resolveApprovedContext(locale)
  if (!ctx) return null

  const [orderData, t] = await Promise.all([
    getMyOrderByNumber(locale, orderNumber),
    getTranslations('partnerPortal'),
  ])

  if (!orderData) notFound()

  const order = orderData

  const fmtCurrency = (val: string | null | undefined) => {
    const cur = order.currency ?? 'EUR'
    const n = parseFloat(String(val ?? '0'))
    if (!Number.isFinite(n)) return `— ${cur}`
    return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(n)
  }

  const fmtDate = (d: Date | null | undefined) => {
    if (!d) return null
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(d))
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      submitted: t('orders.statusSubmitted'),
      confirmed: t('orders.statusConfirmed'),
      processing: t('orders.statusProcessing'),
      shipped: t('orders.statusShipped'),
      completed: t('orders.statusCompleted'),
      cancelled: t('orders.statusCancelled'),
    }
    return map[s] ?? s
  }

  const paymentLabel = (s: string) => {
    const map: Record<string, string> = {
      unpaid: t('orders.paymentUnpaid'),
      payment_request_sent: t('orders.paymentRequestSent'),
      paid: t('orders.paymentPaid'),
      refunded: t('orders.paymentRefunded'),
    }
    return map[s] ?? s
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-100'
      case 'confirmed': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
      case 'processing': return 'bg-amber-50 text-amber-700 border-amber-100'
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-100'
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Build timeline from real persisted timestamps only (spec §6)
  const timeline: { label: string; ts: Date | null; icon: React.ElementType }[] = [
    { label: t('timeline.submitted'), ts: order.createdAt, icon: Circle },
    { label: t('timeline.confirmed'), ts: order.confirmedAt, icon: CheckCircle2 },
    { label: t('timeline.shipped'), ts: order.shippedAt, icon: Truck },
    { label: t('timeline.completed'), ts: order.completedAt, icon: Package },
    { label: t('timeline.cancelled'), ts: order.cancelledAt, icon: XCircle },
    { label: t('timeline.paid'), ts: order.paidAt, icon: CreditCard },
  ]

  // Only show events that have real timestamps (or the first entry = submitted which always has createdAt)
  const activeTimeline = timeline.filter(e => e.ts !== null)

  const billingAddr = order.billingAddress as Record<string, string> | null
  const shippingAddr = order.shippingAddress as Record<string, string> | null

  return (
    <div className="flex flex-col gap-5 pt-4 md:pt-0">
      {/* Back link + header */}
      <div>
        <Link
          href={`/${locale}/konto/orders`}
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('orders.backToOrders')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
              {t('orders.orderDetail')}
            </h1>
            <p className="font-mono text-sm text-[color:var(--mono-muted)] mt-0.5">{order.orderNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${statusColor(order.status)}`}>
              {statusLabel(order.status)}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${
              order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : order.paymentStatus === 'payment_request_sent' ? 'bg-blue-50 text-blue-700 border-blue-100'
              : 'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {paymentLabel(order.paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left column: items + totals */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Order items table */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[color:var(--mono-line)]">
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)]">{t('orders.items')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label={t('orders.items')}>
                <thead>
                  <tr className="border-b border-[color:var(--mono-line)] bg-[color:var(--mono-bg)]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.product')}</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.sku')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.qty')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.basePrice')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.discount')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.unitPrice')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.vatRate')}</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.vatAmount')}</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[color:var(--mono-muted)]">{t('orders.lineTotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={`border-b border-[color:var(--mono-line)] ${idx === order.items.length - 1 ? 'border-b-0' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-[color:var(--mono-navy)]">{item.productName}</p>
                        {item.variantName && (
                          <p className="text-xs text-[color:var(--mono-muted)] mt-0.5">{item.variantName}</p>
                        )}
                      </td>
                      <td className="px-3 py-3.5 font-mono text-xs text-[color:var(--mono-muted)]">{item.sku ?? '—'}</td>
                      <td className="px-3 py-3.5 text-right text-[color:var(--mono-navy)]">{item.quantity}</td>
                      <td className="px-3 py-3.5 text-right text-[color:var(--mono-muted)]">{fmtCurrency(item.baseUnitPrice)}</td>
                      <td className="px-3 py-3.5 text-right text-[color:var(--mono-muted)]">{parseFloat(item.discountPercent).toFixed(0)} %</td>
                      <td className="px-3 py-3.5 text-right font-medium text-[color:var(--mono-navy)]">{fmtCurrency(item.finalUnitPrice)}</td>
                      <td className="px-3 py-3.5 text-right text-[color:var(--mono-muted)]">{parseFloat(item.vatRate).toFixed(0)} %</td>
                      <td className="px-3 py-3.5 text-right text-[color:var(--mono-muted)]">{fmtCurrency(item.vatAmount)}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-[color:var(--mono-navy)]">{fmtCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t border-[color:var(--mono-line)] bg-[color:var(--mono-bg)] px-5 py-4">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex items-center gap-8">
                  <span className="text-[color:var(--mono-muted)]">{t('orders.subtotal')}</span>
                  <span className="font-medium text-[color:var(--mono-navy)] min-w-[100px] text-right">
                    {fmtCurrency(String(parseFloat(order.grandTotal ?? order.total ?? '0') - parseFloat(order.vatTotal)))}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[color:var(--mono-muted)]">{t('orders.discountTotal')}</span>
                  <span className="font-medium text-emerald-600 min-w-[100px] text-right">
                    -{fmtCurrency(order.discountTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-8">
                  <span className="text-[color:var(--mono-muted)]">{t('orders.vatTotal')}</span>
                  <span className="font-medium text-[color:var(--mono-navy)] min-w-[100px] text-right">
                    {fmtCurrency(order.vatTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-8 border-t border-[color:var(--mono-line)] pt-2 mt-1">
                  <span className="font-semibold text-[color:var(--mono-navy)]">{t('orders.grandTotal')}</span>
                  <span className="font-bold text-lg text-[color:var(--mono-navy)] min-w-[100px] text-right">
                    {fmtCurrency(order.grandTotal ?? order.total)}
                  </span>
                </div>
                <p className="text-xs text-[color:var(--mono-muted)]">{order.currency ?? 'EUR'}</p>
              </div>
            </div>
          </div>

          {/* Order timeline */}
          {activeTimeline.length > 0 && (
            <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-4">
                {t('timeline.title')}
              </h2>
              <ol className="relative flex flex-col gap-0 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[color:var(--mono-line)]">
                {activeTimeline.map(event => (
                  <li key={event.label} className="relative flex items-start gap-3 pb-5 last:pb-0">
                    <div className="absolute -left-6 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[color:var(--mono-steel)] mt-0.5">
                      <event.icon className="h-2.5 w-2.5 text-white" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--mono-navy)]">{event.label}</p>
                      {event.ts && (
                        <time
                          dateTime={new Date(event.ts).toISOString()}
                          className="text-xs text-[color:var(--mono-muted)]"
                        >
                          {fmtDate(event.ts)}
                        </time>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Right column: order info, addresses */}
        <div className="flex flex-col gap-5">
          {/* Order info */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
            <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-4">{t('orders.orderInfo')}</h2>
            <dl className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-[color:var(--mono-muted)]">{t('orders.date')}</dt>
                <dd className="font-medium text-[color:var(--mono-navy)] text-right">{fmtDate(order.createdAt)}</dd>
              </div>
              {order.customerPoNumber && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[color:var(--mono-muted)]">{t('orders.poNumber')}</dt>
                  <dd className="font-medium text-[color:var(--mono-navy)] text-right font-mono text-xs">{order.customerPoNumber}</dd>
                </div>
              )}
              {order.customerNote && (
                <div className="flex flex-col gap-1">
                  <dt className="text-[color:var(--mono-muted)]">{t('orders.customerNote')}</dt>
                  <dd className="rounded-lg bg-[color:var(--mono-bg)] px-3 py-2 text-xs text-[color:var(--mono-navy)]">
                    {order.customerNote}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Billing address */}
          {billingAddr && Object.values(billingAddr).some(Boolean) && (
            <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-3">{t('orders.billingAddress')}</h2>
              <address className="not-italic text-sm text-[color:var(--mono-navy)] leading-relaxed">
                {[billingAddr.address, billingAddr.city, billingAddr.postalCode, billingAddr.country]
                  .filter(Boolean)
                  .join(', ')}
              </address>
            </div>
          )}

          {/* Shipping address */}
          {shippingAddr && Object.values(shippingAddr).some(Boolean) && (
            <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
              <h2 className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-3">{t('orders.shippingAddress')}</h2>
              <address className="not-italic text-sm text-[color:var(--mono-navy)] leading-relaxed">
                {[shippingAddr.address, shippingAddr.city, shippingAddr.postalCode, shippingAddr.country]
                  .filter(Boolean)
                  .join(', ')}
              </address>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
