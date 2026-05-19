import { cn } from '@/lib/utils'
import { type HTMLAttributes, forwardRef } from 'react'

type BadgeVariant = 'default' | 'secondary' | 'outline'

type BadgeProps = HTMLAttributes<HTMLDivElement> & {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'border text-foreground',
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'
