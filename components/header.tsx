'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useSession, signOut } from '@/lib/auth-client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Flag } from '@/components/flag'
import { Menu, User, LogOut, Settings } from 'lucide-react'
import { locales, localeNames, localeDomains, domainLocales, type Locale } from '@/i18n/config'

export function Header() {
  const { data: session, isPending } = useSession()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)
  const t = useTranslations('nav')
  const locale = useLocale() as Locale
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    // Get current domain on client side
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname)
    }
  }, [])

  const navigation = [
    { name: t('home'), href: `/${locale}` },
    { name: t('products'), href: `/${locale}/produkte` },
    { name: 'Fan Coil', href: `/${locale}/fan-coil` },
    { name: t('benefits'), href: `/${locale}#vorteile` },
    { name: t('contact'), href: `/${locale}#kontakt` },
  ]

  const switchLocale = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    // Check if we're on a production domain (monocool.*)
    const isProductionDomain = currentDomain && Object.keys(domainLocales).some(
      domain => currentDomain === domain || currentDomain.endsWith(domain)
    )
    
    if (isProductionDomain) {
      // On production: redirect to the correct domain
      const targetDomain = localeDomains[newLocale]
      window.location.href = `https://${targetDomain}${pathWithoutLocale}`
    } else {
      // On localhost/preview: just change the path
      window.location.href = `/${newLocale}${pathWithoutLocale}`
    }
  }

  const isActive = (href: string) => {
    const base = href.split('#')[0]
    if (base === `/${locale}`) return pathname === `/${locale}`
    return pathname === base || pathname.startsWith(`${base}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2" aria-label="MonoCool home">
          <Image src="/logo.png" alt="MonoCool Logo" width={160} height={48} className="h-9 w-auto" priority />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-primary'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
              <Flag locale={locale as Locale} className="w-5 h-4" />
              <span className="hidden sm:inline">{localeNames[locale]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => switchLocale(loc)}
                  className={loc === locale ? 'bg-accent' : ''}
                >
                  <Flag locale={loc} className="w-5 h-4 mr-2" />
                  {localeNames[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {mounted && !isPending && session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{session.user.name || t('login')}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <Link href={`/${locale}/konto`} className="flex w-full items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('home')}
                  </Link>
                </DropdownMenuItem>
                {session.user.role === 'admin' && (
                  <DropdownMenuItem>
                    <Link href={`/${locale}/admin`} className="flex w-full items-center gap-2">
                      <Settings className="h-4 w-4" />
                      {t('admin')}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : mounted && !isPending ? (
            <Link 
              href={`/${locale}/anmelden`}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t('login')}
            </Link>
          ) : (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          )}

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex items-center gap-2 border-b border-border pb-4">
                <Image src="/logo.png" alt="MonoCool Logo" width={140} height={42} className="h-8 w-auto" />
              </div>
              <nav className="mt-6 flex flex-col gap-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                    className={`rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-accent text-primary'
                        : 'text-foreground hover:bg-accent hover:text-primary'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t('language')}</p>
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        switchLocale(loc)
                        setOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium ${
                        loc === locale ? 'bg-accent text-primary' : 'text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <Flag locale={loc} className="w-5 h-4" />
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
