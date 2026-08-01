'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { signOut } from '@/lib/auth-client'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminMarketSelector } from '@/components/admin/market-selector'
import { getDomainFromLocale, getPreviewUrl } from '@/lib/domain-utils'
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Phone,
  ShoppingCart,
  ExternalLink,
  LogOut,
  Menu,
  User,
  ChevronRight,
} from 'lucide-react'
import { type Locale } from '@/i18n/config'

interface AdminShellProps {
  locale: Locale
  userName: string
  userEmail: string
  pendingCount: number
  children: React.ReactNode
}

interface NavItem {
  key: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  exact?: boolean
  badge?: number
  soon?: boolean
}

export function AdminShell({ locale, userName, userEmail, pendingCount, children }: AdminShellProps) {
  const t = useTranslations('admin.nav')
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const base = `/${locale}/admin`

  const navItems: NavItem[] = [
    { key: 'dashboard', label: t('dashboard'), href: base, icon: LayoutDashboard, exact: true },
    { key: 'products', label: t('products'), href: `${base}/produkte`, icon: Package },
    { key: 'partners', label: t('partners'), href: `${base}/benutzer`, icon: Users, badge: pendingCount },
    { key: 'cms', label: t('cms'), href: `${base}/cms`, icon: FileText },
    { key: 'contact', label: t('contact'), href: `${base}/kontakt`, icon: Phone },
    { key: 'orders', label: t('orders'), href: `${base}/bestellungen`, icon: ShoppingCart },
  ]

  const isActive = (item: NavItem) => {
    if (item.soon) return false
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  const activeLabel = navItems.find((i) => isActive(i))?.label ?? t('dashboard')

  const handleSignOut = async () => {
    await signOut()
    router.push(`/${locale}/anmelden`)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label={t('dashboard')}>
      {navItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item)
        if (item.soon) {
          return (
            <span
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/40"
              aria-disabled="true"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-[18px] w-[18px]" />
                {item.label}
              </span>
              <span className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                {t('soon')}
              </span>
            </span>
          )
        }
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-[color:var(--mono-steel)]/25 text-white shadow-[inset_2px_0_0_0_var(--mono-ice)]'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </span>
            {item.badge ? (
              <span className="inline-flex min-w-[20px] items-center justify-center rounded-full bg-[color:var(--mono-ice)] px-1.5 py-0.5 text-[11px] font-bold text-[color:var(--mono-navy)]">
                {item.badge}
              </span>
            ) : (
              active && <ChevronRight className="h-4 w-4 text-white/60" />
            )}
          </Link>
        )
      })}
    </nav>
  )

  const SidebarBody = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-[color:var(--mono-deep)]">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-5">
        <Image src="/logo.png" alt="" aria-hidden="true" width={36} height={36} className="h-9 w-9 rounded-md" />
        <div className="flex flex-col leading-tight">
          <span className="font-heading text-lg font-semibold tracking-tight text-white">
            Mono<span className="text-[color:var(--mono-steel)]">Cool</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
            {t('adminPanel')}
          </span>
        </div>
      </div>

      <div className="mt-2 flex-1 overflow-y-auto pb-4">
        <NavLinks onNavigate={onNavigate} />
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/10 p-3">
        <a
          href={getPreviewUrl(getDomainFromLocale(locale))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          {t('backToSite')}
        </a>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
          {t('signOut')}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[color:var(--mono-deep)] lg:flex">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 lg:block">
        <SidebarBody />
      </aside>

      {/* Content column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-[color:var(--mono-navy)] px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger className="flex h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t('openMenu')}</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-0 p-0">
                <SheetTitle className="sr-only">{t('adminPanel')}</SheetTitle>
                <SidebarBody onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <h1 className="truncate font-heading text-lg font-semibold tracking-tight text-white">
              {activeLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <AdminMarketSelector locale={locale} variant="compact" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 outline-none">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--mono-steel)] text-xs font-bold text-white">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[140px] truncate md:inline">{userName}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">{userEmail}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 sm:hidden">
                  <AdminMarketSelector locale={locale} variant="compact" />
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem
                  render={
                    <a href={getPreviewUrl(getDomainFromLocale(locale))} target="_blank" rel="noopener noreferrer" />
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('backToSite')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 bg-[color:var(--mono-bg)]">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
