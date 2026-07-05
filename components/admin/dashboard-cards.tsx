import Link from 'next/link'
import {
  Package,
  PackageCheck,
  Users,
  UserCheck,
  Clock,
  Plus,
  Phone,
  ExternalLink,
  Globe,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface DashboardStats {
  totalUsers: number
  pendingUsers: number
  approvedUsers: number
  totalProducts: number
  activeProducts: number
  missingContact: boolean
  missingSeo: boolean
}

interface DashboardLabels {
  welcome: string
  overview: string
  totalProducts: string
  activeProducts: string
  totalUsers: string
  approvedUsers: string
  pendingApproval: string
  pendingPartners: string
  allActive: string
  quickActions: string
  addProduct: string
  manageProducts: string
  managePartners: string
  editContact: string
  viewSite: string
  missingContactTitle: string
  missingContactDesc: string
  missingSeoTitle: string
  missingSeoDesc: string
  needsAttention: string
  activeMarket: string
}

interface DashboardCardsProps {
  locale: Locale
  userName: string
  marketName: string
  domain: string
  previewUrl: string
  stats: DashboardStats
  labels: DashboardLabels
}

export function DashboardCards({
  locale,
  userName,
  marketName,
  domain,
  previewUrl,
  stats,
  labels,
}: DashboardCardsProps) {
  const base = `/${locale}/admin`

  const statCards = [
    { label: labels.totalProducts, value: stats.totalProducts, icon: Package, hint: `${stats.activeProducts} ${labels.activeProducts.toLowerCase()}` },
    { label: labels.activeProducts, value: stats.activeProducts, icon: PackageCheck, hint: labels.allActive },
    { label: labels.totalUsers, value: stats.totalUsers, icon: Users, hint: `${stats.approvedUsers} ${labels.approvedUsers.toLowerCase()}` },
    { label: labels.pendingPartners, value: stats.pendingUsers, icon: Clock, hint: labels.pendingApproval, highlight: stats.pendingUsers > 0 },
  ]

  const quickActions = [
    { label: labels.addProduct, href: `${base}/produkte`, icon: Plus },
    { label: labels.manageProducts, href: `${base}/produkte`, icon: Package },
    { label: labels.managePartners, href: `${base}/benutzer`, icon: Users },
    { label: labels.editContact, href: `${base}/kontakt`, icon: Phone },
  ]

  const warnings = [
    stats.missingContact && {
      title: labels.missingContactTitle,
      desc: labels.missingContactDesc,
      href: `${base}/kontakt`,
    },
    stats.missingSeo && {
      title: labels.missingSeoTitle,
      desc: labels.missingSeoDesc,
      href: `${base}/kontakt`,
    },
  ].filter(Boolean) as { title: string; desc: string; href: string }[]

  return (
    <div className="space-y-6">
      {/* Welcome + active market banner */}
      <div className="overflow-hidden rounded-2xl bg-soft-navy p-6 text-white shadow-[0_20px_50px_-30px_rgba(2,26,58,0.8)] sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--mono-steel)]">
              {labels.overview}
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              {labels.welcome}, {userName}
            </h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm">
              <Globe className="h-4 w-4 text-[color:var(--mono-ice)]" />
              <span className="font-medium">{marketName}</span>
              <span className="text-white/40">&middot;</span>
              <span className="text-white/70">{domain}</span>
              <span className="text-white/40">&middot;</span>
              <span className="uppercase text-white/70">{locale}</span>
            </div>
          </div>
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[color:var(--mono-navy)] transition-colors hover:bg-[color:var(--mono-ice)]"
          >
            <ExternalLink className="h-4 w-4" />
            {labels.viewSite}
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    card.highlight ? 'bg-amber-100 text-amber-700' : 'bg-accent text-secondary'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 font-heading text-3xl font-semibold text-foreground">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
            </div>
          )
        })}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <p className="eyebrow">{labels.needsAttention}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {warnings.map((w) => (
              <Link
                key={w.title}
                href={w.href}
                className="group flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300 hover:bg-amber-100"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-amber-900">{w.title}</p>
                  <p className="mt-0.5 text-sm text-amber-800/80">{w.desc}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <p className="eyebrow">{labels.quickActions}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[0_16px_40px_-18px_rgba(5,25,65,0.3)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-secondary transition-colors group-hover:bg-[color:var(--mono-navy)] group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">{action.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
