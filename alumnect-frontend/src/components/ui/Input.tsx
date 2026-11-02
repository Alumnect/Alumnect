import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Class chung cho mọi control nhập liệu: cao 44px, token màu, focus/lỗi/disabled thống nhất. */
export function controlClasses(invalid?: boolean, className?: string) {
  return cn(
    'block w-full rounded-xl border bg-surface px-3.5 text-base text-text placeholder:text-text-subtle transition-colors',
    'focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-text-disabled',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/25'
      : 'border-border-input hover:border-primary focus:border-primary focus:ring-primary/25',
    className,
  )
}

export type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ invalid, className, ...rest }, ref) {
  return <input ref={ref} aria-invalid={invalid || undefined} className={controlClasses(invalid, cn('h-11', className))} {...rest} />
})

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={controlClasses(invalid, cn('min-h-24 resize-y py-2.5', className))}
      {...rest}
    />
  )
})

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }

/** Select gốc của trình duyệt, cùng giao diện với Input. Với danh sách tuỳ biến dùng SelectDropdown. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ invalid, className, children, ...rest }, ref) {
  return (
    <select ref={ref} aria-invalid={invalid || undefined} className={controlClasses(invalid, cn('h-11', className))} {...rest}>
      {children}
    </select>
  )
})

/** Nhãn luôn hiển thị + control + gợi ý + lỗi. Control con tự gắn `id` qua render-prop hoặc bọc trong label. */
export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  required?: boolean
  children: ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      <label id={id} className="block text-sm font-semibold text-text">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <div role="group" aria-labelledby={id}>
        {children}
      </div>
      {hint && !error && <p className="text-xs text-text-subtle">{hint}</p>}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
