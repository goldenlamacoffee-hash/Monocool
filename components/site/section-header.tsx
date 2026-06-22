import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'left' | 'center'
  className?: string
  as?: 'h1' | 'h2'
}

/**
 * Consistent section heading: small uppercase eyebrow label, a Sora title,
 * and an optional supporting paragraph. Used across public sections to keep
 * vertical rhythm and typography aligned with the MonoCool Design Manual.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  as = 'h2',
}: SectionHeaderProps) {
  const Title = as
  return (
    <div
      className={cn(
        'flex flex-col gap-3',
        align === 'center' && 'items-center text-center',
        className,
      )}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Title
        className={cn(
          'text-balance font-semibold tracking-tight text-foreground',
          as === 'h1'
            ? 'text-3xl sm:text-4xl lg:text-5xl'
            : 'text-2xl sm:text-3xl lg:text-[2.25rem] lg:leading-[1.15]',
        )}
      >
        {title}
      </Title>
      {description && (
        <p
          className={cn(
            'text-pretty leading-relaxed text-muted-foreground',
            align === 'center' && 'mx-auto max-w-2xl',
            'max-w-2xl text-base sm:text-lg',
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
