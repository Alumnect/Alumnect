import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-gradient-to-r from-brand-500 to-violet-500 shadow-[0_12px_28px_-12px_rgba(124,134,238,0.85)] hover:shadow-[0_18px_40px_-14px_rgba(149,104,216,0.85)] hover:-translate-y-0.5',
  secondary:
    'text-plum-700 bg-white border border-plum-900/10 shadow-[0_8px_22px_-14px_rgba(120,100,140,0.5)] hover:border-brand-300 hover:text-plum-900 hover:-translate-y-0.5',
  outline:
    'text-plum-700 border border-plum-900/15 hover:border-brand-400 hover:bg-brand-50',
  ghost: 'text-plum-600 hover:text-plum-900 hover:bg-plum-900/[0.05]',
  gold:
    'text-plum-900 bg-gradient-to-r from-gold-300 to-gold-400 shadow-[0_12px_28px_-12px_rgba(239,175,62,0.8)] hover:-translate-y-0.5 font-bold',
  glass: 'text-plum-800 glass hover:bg-white/80',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-2xl',
}

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'group/btn sheen press relative inline-flex items-center justify-center overflow-hidden font-semibold whitespace-nowrap transition-all duration-300 select-none',
    'focus-visible:outline-2 focus-visible:outline-brand-400 disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({ variant, size, leftIcon, rightIcon, className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, size, className)} {...rest}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  )
}

type ButtonLinkProps = {
  to?: string
  href?: string
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  className?: string
  children: ReactNode
  target?: string
  rel?: string
}

/** A link styled as a button — internal (`to`) via React Router, or external (`href`). */
export function ButtonLink({ to, href, variant, size, leftIcon, rightIcon, className, children, target, rel }: ButtonLinkProps) {
  const cls = buttonClasses(variant, size, className)
  const inner = (
    <>
      {leftIcon}
      {children}
      {rightIcon}
    </>
  )
  if (href) {
    return (
      <a href={href} className={cls} target={target} rel={rel}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={to ?? '#'} className={cls}>
      {inner}
    </Link>
  )
}
