import { cn } from '@/lib/utils'

interface CTAGroupProps {
  children: React.ReactNode
  align?: 'start' | 'center'
  className?: string
}

/**
 * Button container that stacks vertically on mobile and flows in a row from
 * sm: up, keeping CTAs tappable and overflow-safe at narrow widths.
 */
export function CTAGroup({ children, align = 'start', className }: CTAGroupProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center',
        align === 'center' && 'sm:justify-center',
        className,
      )}
    >
      {children}
    </div>
  )
}
