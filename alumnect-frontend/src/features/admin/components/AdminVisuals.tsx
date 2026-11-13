import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Bộ thành phần hình ảnh cho khu Quản trị (hướng "sáng + đồ hoạ thương hiệu"):
 * dải chào có minh hoạ campus FPT, ô việc cần làm, biểu đồ vùng chuyển màu và vòng tròn cơ cấu.
 */

export function QueueTile({
  icon,
  count,
  label,
  sub,
  action,
  urgent,
  loading,
  onClick,
}: {
  icon: ReactNode
  count: number
  label: string
  sub: string
  action: string
  urgent: boolean
  loading?: boolean
  onClick: () => void
}) {
  const active = count > 0
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-3.5 rounded-[20px] border bg-surface p-4 text-left transition hover:-translate-y-0.5',
        active
          ? urgent
            ? 'border-[#FFD3C2] shadow-[0_12px_30px_-18px_rgba(229,72,77,0.55)]'
            : 'border-[#FBE3B3] shadow-[0_12px_30px_-18px_rgba(217,138,0,0.45)]'
          : 'border-border'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            'grid h-10 w-10 place-items-center rounded-xl [&>svg]:h-[19px] [&>svg]:w-[19px]',
            active ? (urgent ? 'bg-[#FFE9E3] text-[#E5484D] dark:bg-[#E5484D]/15' : 'bg-[#FFF4E0] text-[#D98A00] dark:bg-[#D98A00]/15') : 'bg-surface-2 text-text-subtle'
          )}
        >
          {icon}
        </span>
        {active && urgent && (
          <span className="hidden whitespace-nowrap rounded-full bg-[#FFE9E3] px-2 py-0.5 text-xs font-bold text-[#E5484D] sm:inline-block">Cần làm ngay</span>
        )}
      </div>
      <div>
        <p className={cn('font-display text-[32px] font-bold leading-none tabular-nums', active ? 'text-text' : 'text-text-subtle/60')}>
          {loading ? '…' : count}
        </p>
        <p className="mt-1.5 text-sm leading-snug text-text-muted">
          <span className="font-semibold text-text">{label}</span> {sub}
        </p>
      </div>
      <span
        className={cn(
          'mt-auto inline-flex items-center gap-1.5 text-sm font-bold',
          active ? 'text-[#E3561A]' : 'text-text-subtle/70'
        )}
      >
        {action}
        <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

/** Biểu đồ vùng chuyển màu cam; điểm cuối có nhãn giá trị. Giá trị null = kỳ chưa tới (chỉ hiện nhãn mờ). */
export function AreaTrend({ points, height = 220 }: { points: Array<{ label: string; value: number | null }>; height?: number }) {
  const w = 460
  const h = height
  const pad = { l: 26, r: 10, t: 30, b: 26 }
  const known = points.filter((p) => p.value !== null) as Array<{ label: string; value: number }>
  const maxVal = Math.max(...known.map((p) => p.value), 1)
  const step = Math.max(1, Math.ceil(maxVal / 3 / 5) * 5)
  const top = step * 3
  const iw = w - pad.l - pad.r
  const ih = h - pad.t - pad.b
  const x = (i: number) => pad.l + (points.length > 1 ? (iw * i) / (points.length - 1) : iw / 2)
  const y = (v: number) => pad.t + ih - (ih * v) / top
  const coords = points.map((p, i) => (p.value === null ? null : ([x(i), y(p.value)] as const))).filter(Boolean) as Array<readonly [number, number]>
  const line = coords.map(([cx, cy], i) => `${i ? 'L' : 'M'}${cx.toFixed(1)} ${cy.toFixed(1)}`).join(' ')
  const area = coords.length
    ? `${line} L${coords[coords.length - 1][0]} ${pad.t + ih} L${coords[0][0]} ${pad.t + ih} Z`
    : ''
  const last = coords[coords.length - 1]
  const lastPoint = known[known.length - 1]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block h-auto w-full" role="img" aria-label="Biểu đồ số tài khoản đăng ký mới">
      <defs>
        <linearGradient id="admin-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F27024" stopOpacity="0.32" />
          <stop offset="1" stopColor="#F27024" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, step, step * 2, top].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="currentColor" className="text-border" />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} className="fill-text-subtle">
            {v}
          </text>
        </g>
      ))}
      {area && <path d={area} fill="url(#admin-area-fill)" />}
      {line && <path d={line} fill="none" stroke="#F27024" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
      {last && lastPoint && (
        <g>
          <circle cx={last[0]} cy={last[1]} r={5} fill="#F27024" stroke="#fff" strokeWidth={2} />
          <g transform={`translate(${Math.min(last[0] - 30, w - pad.r - 64)} ${Math.max(last[1] - 32, 2)})`}>
            <rect width={60} height={22} rx={6} fill="#1F2A44" />
            <text x={30} y={15} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#fff">
              {`${lastPoint.label} · ${lastPoint.value}`}
            </text>
          </g>
        </g>
      )}
      {points.map((p, i) => (
        <text key={p.label + i} x={x(i)} y={h - 6} textAnchor="middle" fontSize={11} className="fill-text-subtle" opacity={p.value === null ? 0.45 : 1}>
          {p.label}
        </text>
      ))}
    </svg>
  )
}

/** Vòng tròn cơ cấu với tổng ở giữa */
export function Donut({
  parts,
  total,
  caption,
  size = 172,
}: {
  parts: Array<{ value: number; color: string }>
  total: number
  caption: string
  size?: number
}) {
  const stroke = 14
  const r = size / 2 - stroke
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${total} ${caption}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className="text-surface-2" />
      {total > 0 &&
        parts.map((p, i) => {
          const len = (p.value / total) * c
          const el = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={p.color}
              strokeWidth={stroke}
              strokeDasharray={`${Math.max(len - 3, 0)} ${c}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += len
          return el
        })}
      <text x="50%" y="48%" textAnchor="middle" fontSize={30} fontWeight={700} className="fill-text" fontFamily="Sora, sans-serif">
        {total}
      </text>
      <text x="50%" y="63%" textAnchor="middle" fontSize={12} className="fill-text-subtle">
        {caption}
      </text>
    </svg>
  )
}

// Dải đầu trang, minh hoạ nhỏ và ô số liệu dùng chung với Mentoring
export { BrandBanner as AdminPageBanner, BrandHero as AdminHero, StatTile } from '@/components/brand/BrandBlocks'

/** Khung nội dung chính (bảng, danh sách) */
export const panelClass = 'overflow-hidden rounded-3xl border border-border bg-surface'
