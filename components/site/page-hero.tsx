import { cn } from '@/lib/utils'
import { SectionHeader } from '@/components/site/section-header'

interface PageHeroProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
}

/**
 * Compact, premium header band for inner pages (catalog, fan coil, legal).
 * Uses a subtle ice gradient and a hairline bottom border for an
 * architectural, technical feel.
 */
export function PageHero({ eyebrow, title, description, children, align = 'left', className }: PageHeroProps) {
  return (
    <section className={cn('relative overflow-hidden border-b border-border bg-soft-ice', className)}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <SectionHeader
          as="h1"
          eyebrow={eyebrow}
          title={title}
          description={description}
          align={align}
        />
        {children && <div className={cn('mt-8', align === 'center' && 'flex justify-center')}>{children}</div>}
      </div>
    </section>
  )
}
