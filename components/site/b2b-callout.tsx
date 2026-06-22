import { cn } from '@/lib/utils'

interface B2BCalloutProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

/**
 * High-contrast navy block for B2B/partner calls to action. Uses the deep
 * technical gradient from the brand palette for an expensive, confident feel.
 */
export function B2BCallout({ eyebrow, title, description, children, className }: B2BCalloutProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-soft-navy px-6 py-10 text-primary-foreground sm:px-10 sm:py-12 lg:px-14',
        className,
      )}
    >
      {/* Subtle architectural grid motif */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]"
      />
      <div className="relative flex flex-col gap-5 lg:max-w-3xl">
        <div className="flex flex-col gap-3">
          {eyebrow && (
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--mono-steel)]">
              {eyebrow}
            </span>
          )}
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          {description && (
            <p className="text-pretty leading-relaxed text-primary-foreground/80">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
