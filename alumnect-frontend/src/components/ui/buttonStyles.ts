import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'text-white bg-gradient-to-r from-[#F27024] to-[#FF8C38] shadow-[0_6px_20px_-6px_rgba(242,112,36,0.5)] hover:shadow-[0_10px_28px_-8px_rgba(242,112,36,0.65)] hover:-translate-y-0.5 font-bold',
  secondary:
    'text-slate-800 bg-white border border-slate-200/80 shadow-sm hover:border-[#F27024]/40 hover:text-[#F27024] hover:-translate-y-0.5 font-semibold',
  outline:
    'text-slate-700 border border-slate-200 hover:border-[#F27024] hover:text-[#F27024] hover:bg-[#F27024]/5',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
  gold:
    'text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_8px_20px_-8px_rgba(245,158,11,0.5)] hover:-translate-y-0.5 font-bold',
  glass: 'text-slate-800 glass hover:bg-white/90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-2xl',
}

/** Sinh chuỗi class Tailwind cho nút bấm theo variant/size — dùng chung cho Button và ButtonLink. */
export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(
    'group/btn sheen press relative inline-flex items-center justify-center overflow-hidden font-semibold whitespace-nowrap transition-all duration-300 select-none',
    'focus-visible:outline-2 focus-visible:outline-brand-400 disabled:opacity-50 disabled:pointer-events-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
