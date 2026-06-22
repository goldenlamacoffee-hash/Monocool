import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface FeatureChipProps {
  children: React.ReactNode
  icon?: LucideIcon
  variant?: 'default' | 'solid' | 'ice'
  className?: string
}

/**
 * Short technical advantage pill ("No outdoor unit", "B2B", "Quiet").
 * Thin border, calm surface — never used for long marketing claims.
 */
export function FeatureChip({ children, icon: Icon, variant = 'default', className }: FeatureChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        variant === 'default' && 'border border-border bg-card text-foreground',
        variant === 'ice' && 'bg-accent text-accent-foreground',
        variant === 'solid' && 'bg-primary text-primary-foreground',
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn('h-3.5 w-3.5 shrink-0', variant === 'solid' ? 'text-primary-foreground' : 'text-secondary')}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
