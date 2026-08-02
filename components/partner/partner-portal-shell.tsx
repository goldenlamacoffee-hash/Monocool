'use client'

// components/partner/partner-portal-shell.tsx
// Reusable portal layout: left nav rail (desktop) + top nav (mobile) + content area.
// Light B2B design — white cards, MonoCool navy headings, steel-blue accents.
// Does NOT look like the dark admin interface.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Tag,
  FileText,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { signOut } from '@/lib/auth-client'
import { type Locale } from '@/i18n/config'

interface PartnerPortalShellProps {
  children: React.ReactNode
  partnerName: string
  companyName: string | null
  market: string
}

export function PartnerPortalShell({
  children,
  partnerName,
  companyName,
  market,
}: PartnerPortalShellProps) {
  const t = useTranslations('partnerPortal')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { label: t('nav.overview'), href: `/${locale}/konto`, icon: LayoutDashboard },
    { label: t('nav.orders'), href: `/${locale}/konto/orders`, icon: ShoppingCart },
    { label: t('nav.prices'), href: `/${locale}/konto/prices`, icon: Tag },
    { label: t('nav.downloads'), href: `/${locale}/konto/downloads`, icon: FileText },
    { label: t('nav.profile'), href: `/${locale}/konto/profile`, icon: Building2 },
  ]

  const isActive = (href: string) => {
    if (href === `/${locale}/konto`) return pathname === href
    return pathname.startsWith(href)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav aria-label={t('nav.label')}>
      <ul className="flex flex-col gap-0.5" role="list">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)] ${
                  active
                    ? 'bg-[color:var(--mono-ice)] text-[color:var(--mono-navy)] font-semibold'
                    : 'text-[color:var(--mono-muted)] hover:bg-[color:var(--mono-ice)] hover:text-[color:var(--mono-navy)]'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {active && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )

  return (
    <div className="min-h-screen bg-[color:var(--mono-bg)]">
      {/* Mobile header bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[color:var(--mono-line)] bg-white px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[color:var(--mono-navy)]">
            <Building2 className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-heading text-sm font-semibold text-[color:var(--mono-navy)]">
            {t('portalTitle')}
          </span>
        </div>
        <button
          aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(v => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--mono-muted)] hover:bg-[color:var(--mono-ice)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mono-steel)]"
        >
          {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-20 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-14 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex flex-col h-full overflow-y-auto p-4">
              {/* Partner identity */}
              <div className="mb-5 rounded-xl border border-[color:var(--mono-line)] bg-[color:var(--mono-ice)] p-3">
                <p className="text-sm font-semibold text-[color:var(--mono-navy)] truncate">{partnerName}</p>
                {companyName && (
                  <p className="text-xs text-[color:var(--mono-muted)] mt-0.5 truncate">{companyName}</p>
                )}
                <p className="text-xs text-[color:var(--mono-steel)] mt-1 font-medium">{market}</p>
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="mt-auto pt-4 border-t border-[color:var(--mono-line)]">
                <button
                  onClick={() => signOut()}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {t('nav.signOut')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl gap-0 md:gap-6 lg:gap-8 px-0 md:px-4 lg:px-8 py-0 md:py-6 lg:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-52 lg:w-60 shrink-0 flex-col gap-4">
          {/* Partner identity card */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--mono-navy)]">
                <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[color:var(--mono-navy)] truncate leading-tight">{partnerName}</p>
                {companyName && (
                  <p className="text-xs text-[color:var(--mono-muted)] truncate mt-0.5">{companyName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-[color:var(--mono-ice)] px-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--mono-steel)]" aria-hidden="true" />
              <span className="text-xs font-medium text-[color:var(--mono-steel)]">{market}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="rounded-xl border border-[color:var(--mono-line)] bg-white p-2 shadow-sm">
            <NavLinks />
          </div>

          {/* Sign out */}
          <button
            onClick={() => signOut()}
            className="flex items-center gap-3 rounded-xl border border-[color:var(--mono-line)] bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 px-4 pb-8 md:px-0">
          {children}
        </main>
      </div>
    </div>
  )
}
