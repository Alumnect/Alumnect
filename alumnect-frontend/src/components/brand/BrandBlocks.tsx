import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { CampusIllustration } from './CampusIllustration'
import { BannerScene, type BannerSceneKey } from './BannerScenes'

/** Dải chào lớn có minh hoạ campus FPT (trang tổng quan) */
export function BrandHero({
  eyebrow,
  title,
  children,
  actions,
  illustration = true,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
  illustration?: boolean
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[28px] border border-[#FFE3D0] px-8 py-8 dark:border-border',
        'bg-[radial-gradient(120%_140%_at_85%_0%,#FFE2CC_0%,#FFF3EA_45%,#FFF9F4_100%)] dark:bg-none dark:bg-surface',
        illustration ? 'min-h-[236px]' : ''
      )}
    >
      {illustration && (
        <div className="pointer-events-none absolute -bottom-1.5 right-0 hidden w-[min(46%,540px)] lg:block">
          <CampusIllustration tone="warm" />
        </div>
      )}
      <div className={cn('relative', illustration ? 'max-w-[540px]' : '')}>
        {eyebrow && <p className="text-sm font-semibold text-[#B4643A] dark:text-primary-solid">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-[32px] font-bold leading-tight tracking-tight text-text">{title}</h1>
        {children && <div className="mt-3 text-[15px] leading-relaxed text-[#6B5A50] dark:text-text-muted">{children}</div>}
        {actions && <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div>}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Dải đầu trang + ô số liệu dùng chung cho Quản trị và Mentoring      */
/* ------------------------------------------------------------------ */

type Tone = 'orange' | 'blue' | 'green' | 'red' | 'amber' | 'slate' | 'violet'
const TONES: Record<Tone, { bg: string; fg: string }> = {
  orange: { bg: 'bg-[#FFEDE2] dark:bg-[#F27024]/15', fg: 'text-[#E3561A]' },
  blue: { bg: 'bg-[#E6F0FB] dark:bg-[#1F6BB8]/20', fg: 'text-[#1F6BB8]' },
  green: { bg: 'bg-[#E3F4E7] dark:bg-[#3E9B4F]/20', fg: 'text-[#2F7E3D]' },
  red: { bg: 'bg-[#FFE9E3] dark:bg-[#E5484D]/15', fg: 'text-[#E5484D]' },
  amber: { bg: 'bg-[#FFF4E0] dark:bg-[#D98A00]/15', fg: 'text-[#C27C00]' },
  slate: { bg: 'bg-[#ECEFF5] dark:bg-white/10', fg: 'text-[#1F2A44] dark:text-text' },
  violet: { bg: 'bg-[#F0EAFB] dark:bg-[#6B4BC2]/20', fg: 'text-[#6B4BC2]' },
}

/** Dải đầu trang thương hiệu: tiêu đề, mô tả ngắn, nút và hình minh hoạ nhỏ */
export function BrandBanner({
  title,
  description,
  scene,
  actions,
  back,
  className,
  compact,
}: {
  className?: string
  /** Bản gọn cho trang cần nhiều chiều cao (vd. bản đồ) */
  compact?: boolean
  title: ReactNode
  description?: ReactNode
  scene?: BannerSceneKey
  actions?: ReactNode
  back?: ReactNode
}) {
  return (
    <section
      className={cn(
        'relative flex items-center justify-between gap-6 overflow-hidden rounded-[24px] border border-[#FFE3D0] pl-5 pr-4 sm:pl-7 dark:border-border',
        'bg-[radial-gradient(120%_160%_at_90%_0%,#FFE2CC_0%,#FFF3EA_48%,#FFF9F4_100%)] dark:bg-none dark:bg-surface',
        className
      )}
    >
      {/* Dải đồi chạy suốt cạnh dưới, nối liền với hình minh hoạ bên phải */}
      <svg
        viewBox="0 0 1200 48"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 w-full dark:opacity-25"
        aria-hidden
      >
        <path d="M0 26 C 220 6, 420 30, 640 20 S 1000 2, 1200 14 L1200 48 L0 48 Z" fill="#FFD9BF" opacity="0.75" />
        <path d="M0 38 C 260 24, 520 44, 780 34 S 1080 22, 1200 30 L1200 48 L0 48 Z" fill="#FFC7A1" opacity="0.7" />
      </svg>
      <div className={cn('relative min-w-0 flex-1', compact ? 'pb-7 pt-4' : 'pb-10 pt-6')}>
        {back}
        <h1 className={cn('font-display font-bold leading-tight tracking-tight text-text', compact ? 'text-xl sm:text-[22px]' : 'text-[22px] sm:text-[26px]')}>{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#6B5A50] dark:text-text-muted">{description}</p>}
        {actions && <div className="mt-4 flex flex-wrap gap-2.5">{actions}</div>}
      </div>
      {scene && (
        // Mỗi nhóm trang một cảnh riêng (cùng nét vẽ với minh hoạ campus FPT)
        <div className={cn('relative hidden shrink-0 self-end md:block', compact ? 'w-[170px]' : 'w-[250px] lg:w-[270px]')} aria-hidden>
          <BannerScene scene={scene} />
        </div>
      )}
    </section>
  )
}

/** Ô số liệu có biểu tượng màu; khi truyền onClick thì là bộ lọc (active = đang chọn) */
export function StatTile({
  icon,
  label,
  value,
  hint,
  tone = 'slate',
  active,
  onClick,
}: {
  icon: ReactNode
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
  active?: boolean
  onClick?: () => void
}) {
  const t = TONES[tone]
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      {...(onClick ? { type: 'button' as const, onClick, 'aria-pressed': !!active } : {})}
      className={cn(
        'flex items-center gap-3.5 rounded-[20px] border bg-surface p-4 text-left transition',
        onClick && 'hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-20px_rgba(31,42,68,0.45)]',
        active ? 'border-transparent bg-[#FFFAF6] ring-2 ring-[#F27024] dark:bg-surface' : 'border-border'
      )}
    >
      <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl [&>svg]:h-5 [&>svg]:w-5', t.bg, t.fg)}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-text-subtle">{label}</span>
        <span className="mt-0.5 block font-display text-[24px] font-bold leading-tight tabular-nums text-text">{value}</span>
        {hint && <span className="mt-0.5 block truncate text-xs text-text-subtle">{hint}</span>}
      </span>
    </Comp>
  )
}

/** Khung nội dung chính (bảng, danh sách) */
export const panelClass = 'overflow-hidden rounded-3xl border border-border bg-surface'
