import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'text-on-primary bg-primary-solid hover:bg-primary-hover font-bold',
  secondary:
    'text-text bg-surface border border-border-strong hover:bg-surface-2 font-semibold',
  outline:
    'text-text-muted border border-border-strong hover:border-primary hover:text-primary-solid hover:bg-primary-soft',
  ghost: 'text-text-muted hover:text-text hover:bg-surface-2',
  gold:
    'text-text bg-warning-soft border border-warning-border hover:bg-warning-border/40 font-bold',
  glass: 'text-text glass hover:bg-surface-2',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-2xl',
}

/** Sinh chuỗi class Tailwind cho nút bấm theo variant/size — dùng chung cho Button và ButtonLink. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'group/btn press relative inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 select-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
