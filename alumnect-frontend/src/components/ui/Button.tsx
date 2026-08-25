import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { buttonClasses } from './buttonStyles'
import type { ButtonVariant, ButtonSize } from './buttonStyles'

export type { ButtonVariant, ButtonSize } from './buttonStyles'

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
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
}

/** A link styled as a button — internal (`to`) via React Router, or external (`href`). */
export function ButtonLink({ to, href, variant, size, leftIcon, rightIcon, className, children, target, rel, onClick }: ButtonLinkProps) {
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
      <a href={href} className={cls} target={target} rel={rel} onClick={onClick}>
        {inner}
      </a>
    )
  }
  return (
    <Link to={to ?? '#'} className={cls} onClick={onClick}>
      {inner}
    </Link>
  )
}
