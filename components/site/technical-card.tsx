import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface TechnicalCardProps {
  icon?: LucideIcon
  title: React.ReactNode
  description?: React.ReactNode
  className?: string
}

/**
 * Precise technical content card: white surface, thin line-blue border,
 * calm hover — no heavy shadows. Used for benefits, advantages, use cases.
 */
export function TechnicalCard({ icon: Icon, title, description, className }: TechnicalCardProps) {
  return (
    <div
      className={cn(
        'group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-colors hover:border-secondary/60',
        className,
      )}
    >
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-primary ring-1 ring-inset ring-border transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      )}
      <h3 className={cn('font-semibold text-foreground', Icon ? 'mt-4' : '')}>{title}</h3>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  )
}

interface TechnicalSpecRowProps {
  icon?: LucideIcon
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}

/**
 * Single label/value specification row used in product spec lists.
 */
export function TechnicalSpecRow({ icon: Icon, label, value, className }: TechnicalSpecRowProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />}
        <span className="truncate">{label}</span>
      </div>
      <span className="shrink-0 text-sm font-semibold text-foreground">{value}</span>
    </div>
  )
}
