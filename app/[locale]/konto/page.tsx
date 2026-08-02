import { setRequestLocale } from 'next-intl/server'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { type Locale } from '@/i18n/config'
import { resolveApprovedContext } from '@/lib/partner-portal'
import { getPartnerDashboard } from '@/app/actions/partner-portal'
import { getLocalizedMarketName } from '@/lib/domain-utils'
import {
  ShoppingCart,
  PackageCheck,
  PackageOpen,
  Banknote,
  FileText,
  ArrowRight,
  ShoppingBag,
  Tag,
  Download,
  Mail,
} from 'lucide-react'

interface Props {
  params: Promise<{ locale: Locale }>
}

export default async function KontoDashboardPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  // Pending/rejected users: return null — the konto layout renders PartnerAccountStatus.
  // Do NOT call any data action before this guard returns a non-null context.
  const [ctx, t] = await Promise.all([
    resolveApprovedContext(locale),
    getTranslations('partnerPortal'),
  ])
  if (!ctx) return null

  const dashboard = await getPartnerDashboard(locale)

  const currency = dashboard.marketSettings.currency || 'EUR'
  const marketName = getLocalizedMarketName(ctx.market, locale)

  // §5 — format a value using the order's own currency
  const fmtCurrency = (val: string, cur: string = currency) => {
    const n = parseFloat(val)
    if (!Number.isFinite(n)) return `— ${cur}`
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: cur }).format(n)
    } catch {
      return `${n.toFixed(2)} ${cur}`
    }
  }

  // §6 — format per-currency totals; never merge different currencies
  const fmtHistoricalTotals = () => {
    if (dashboard.historicalTotals.length === 0) return `— ${currency}`
    return dashboard.historicalTotals
      .map(({ currency: cur, total }) => fmtCurrency(total, cur))
      .join(' / ')
  }

  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(d))

  const kpis = [
    {
      label: t('dashboard.totalOrders'),
      value: String(dashboard.totalOrders),
      icon: ShoppingCart,
      color: 'text-[color:var(--mono-steel)]',
      bg: 'bg-[color:var(--mono-ice)]',
    },
    {
      label: t('dashboard.openOrders'),
      value: String(dashboard.openOrders),
      icon: PackageOpen,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: t('dashboard.completedOrders'),
      value: String(dashboard.completedOrders),
      icon: PackageCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: t('dashboard.historicalTotal'),
      value: fmtHistoricalTotals(),
      icon: Banknote,
      color: 'text-[color:var(--mono-navy)]',
      bg: 'bg-[color:var(--mono-ice)]',
      wide: true,
    },
    {
      label: t('dashboard.availableDocuments'),
      value: String(dashboard.availableDocuments),
      icon: FileText,
      color: 'text-[color:var(--mono-steel)]',
      bg: 'bg-[color:var(--mono-ice)]',
    },
  ]

  const statusKey = (s: string) => {
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

  const statusColor = (s: string) => {
    switch (s) {
      case 'submitted': return 'bg-blue-50 text-blue-700'
      case 'confirmed': return 'bg-indigo-50 text-indigo-700'
      case 'processing': return 'bg-amber-50 text-amber-700'
      case 'shipped': return 'bg-purple-50 text-purple-700'
      case 'completed': return 'bg-emerald-50 text-emerald-700'
      case 'cancelled': return 'bg-red-50 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const quickActions = [
    { label: t('dashboard.actionBrowseProducts'), href: `/${locale}/produkte`, icon: ShoppingBag },
    { label: t('dashboard.actionPriceList'), href: `/${locale}/konto/prices`, icon: Tag },
    { label: t('dashboard.actionDownloads'), href: `/${locale}/konto/downloads`, icon: Download },
    { label: t('dashboard.actionContact'), href: `/${locale}#kontakt`, icon: Mail },
  ]

  return (
    <div className="flex flex-col gap-6 pt-4 md:pt-0">
      {/* Welcome header */}
      <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
        <h1 className="font-heading text-xl font-semibold text-[color:var(--mono-navy)]">
          {t('dashboard.welcome', { name: ctx.name })}
        </h1>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--mono-muted)]">
          {ctx.companyName && (
            <span><span className="font-medium text-[color:var(--mono-navy)]">{t('dashboard.company')}:</span> {ctx.companyName}</span>
          )}
          <span><span className="font-medium text-[color:var(--mono-navy)]">{t('dashboard.market')}:</span> {marketName}</span>
          <span>
            <span className="font-medium text-[color:var(--mono-navy)]">{t('dashboard.discount')}:</span>{' '}
            {ctx.discountPercent > 0 ? `${ctx.discountPercent} %` : t('dashboard.noDiscount')}
          </span>
          {ctx.partnerTier && (
            <span>
              <span className="font-medium text-[color:var(--mono-navy)]">{t('dashboard.tier')}:</span>{' '}
              <span className="inline-flex items-center rounded-full bg-[color:var(--mono-ice)] px-2 py-0.5 text-xs font-semibold text-[color:var(--mono-navy)]">
                {ctx.partnerTier}
              </span>
            </span>
          )}
          <span>
            <span className="font-medium text-[color:var(--mono-navy)]">{t('dashboard.currency')}:</span> {currency}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">{t('dashboard.kpiTitle')}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {kpis.map(kpi => (
            <div
              key={kpi.label}
              className={`rounded-xl border border-[color:var(--mono-line)] bg-white p-4 shadow-sm ${kpi.wide ? 'col-span-2 sm:col-span-1' : ''}`}
            >
              <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} aria-hidden="true" />
              </div>
              <p className={`text-lg font-semibold leading-tight ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-[color:var(--mono-muted)] mt-0.5">{kpi.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <section className="lg:col-span-2" aria-labelledby="recent-orders-heading">
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--mono-line)]">
              <h2 id="recent-orders-heading" className="font-heading text-base font-semibold text-[color:var(--mono-navy)]">
                {t('dashboard.recentOrders')}
              </h2>
              <Link
                href={`/${locale}/konto/orders`}
                className="flex items-center gap-1 text-xs font-medium text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors"
              >
                {t('dashboard.viewAllOrders')}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
            {dashboard.recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-[color:var(--mono-line)] mb-3" aria-hidden="true" />
                <p className="text-sm text-[color:var(--mono-muted)]">{t('dashboard.noOrders')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label={t('dashboard.recentOrders')}>
                  <thead>
                    <tr className="border-b border-[color:var(--mono-line)] bg-[color:var(--mono-bg)]">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-[color:var(--mono-muted)] uppercase tracking-wide">{t('orders.orderNumber')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[color:var(--mono-muted)] uppercase tracking-wide">{t('orders.date')}</th>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-[color:var(--mono-muted)] uppercase tracking-wide">{t('orders.status')}</th>
                      <th className="px-3 py-3 text-right text-xs font-semibold text-[color:var(--mono-muted)] uppercase tracking-wide">{t('orders.total')}</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-[color:var(--mono-muted)] uppercase tracking-wide sr-only">{t('orders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders.map((o, idx) => (
                      <tr
                        key={o.id}
                        className={`border-b border-[color:var(--mono-line)] hover:bg-[color:var(--mono-bg)] transition-colors ${idx === dashboard.recentOrders.length - 1 ? 'border-b-0' : ''}`}
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/${locale}/konto/orders/${o.orderNumber}`}
                            className="font-mono text-xs font-semibold text-[color:var(--mono-navy)] hover:text-[color:var(--mono-steel)] transition-colors"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-[color:var(--mono-muted)]">{fmtDate(o.createdAt)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(o.status)}`}>
                            {statusKey(o.status)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-[color:var(--mono-navy)]">
                          {fmtCurrency(String(o.grandTotal ?? o.total ?? '0'), o.currency ?? currency)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Link
                            href={`/${locale}/konto/orders/${o.orderNumber}`}
                            className="text-xs font-medium text-[color:var(--mono-steel)] hover:text-[color:var(--mono-navy)] transition-colors"
                            aria-label={`${t('orders.detail')} ${o.orderNumber}`}
                          >
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section aria-labelledby="quick-actions-heading">
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-5 shadow-sm">
            <h2 id="quick-actions-heading" className="font-heading text-base font-semibold text-[color:var(--mono-navy)] mb-4">
              {t('dashboard.quickActions')}
            </h2>
            <ul className="flex flex-col gap-2" role="list">
              {quickActions.map(action => (
                <li key={action.label}>
                  <Link
                    href={action.href}
                    className="flex items-center gap-3 rounded-lg border border-[color:var(--mono-line)] px-3 py-2.5 text-sm font-medium text-[color:var(--mono-navy)] hover:bg-[color:var(--mono-ice)] hover:border-[color:var(--mono-steel)] transition-colors"
                  >
                    <action.icon className="h-4 w-4 text-[color:var(--mono-steel)] shrink-0" aria-hidden="true" />
                    {action.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
