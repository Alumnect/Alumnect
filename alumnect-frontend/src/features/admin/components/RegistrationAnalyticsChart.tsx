import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Activity, TrendingUp } from 'lucide-react'
import { Card, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { AdminDashboardSummaryDto } from '../api/adminApi'

export type TimePeriod = 'WEEK' | 'MONTH' | 'YEAR'

export interface ChartDataPoint {
  label: string
  count: number
  trend: number
}

interface RegistrationAnalyticsChartProps {
  summary?: AdminDashboardSummaryDto
  liveDailyRegs?: Array<{ date: string; count: number }>
  isLoading?: boolean
}

export function RegistrationAnalyticsChart({ summary, liveDailyRegs = [] }: RegistrationAnalyticsChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('MONTH')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // 1. Dữ liệu cho chế độ Tuần (Weekly) - Ưu tiên từ CSDL PostgreSQL
  const dbWeekRegs = summary?.registrationsLast7Days || summary?.dailyRegistrations || liveDailyRegs
  const weekData: ChartDataPoint[] = dbWeekRegs.length > 0
    ? dbWeekRegs.map((d) => ({
        label: d.date.length > 5 ? d.date.substring(5) : d.date,
        count: Number(d.count || 0),
        trend: Math.round(Number(d.count || 0) * 0.75 + 2),
      }))
    : [
        { label: 'Thứ 2', count: 0, trend: 0 },
        { label: 'Thứ 3', count: 0, trend: 0 },
        { label: 'Thứ 4', count: 0, trend: 0 },
        { label: 'Thứ 5', count: 0, trend: 0 },
        { label: 'Thứ 6', count: 0, trend: 0 },
        { label: 'Thứ 7', count: 0, trend: 0 },
        { label: 'Chủ nhật', count: 0, trend: 0 },
      ]

  // 2. Dữ liệu cho chế độ Tháng (Monthly - 12 Tháng) - Ưu tiên từ CSDL PostgreSQL
  const dbMonthRegs = summary?.registrationsByMonth
  const monthData: ChartDataPoint[] = dbMonthRegs && dbMonthRegs.length > 0
    ? dbMonthRegs.map((d) => ({
        label: d.date,
        count: Number(d.count || 0),
        trend: Math.round(Number(d.count || 0) * 0.8),
      }))
    : [
        { label: 'Tháng 1', count: 0, trend: 0 },
        { label: 'Tháng 2', count: 0, trend: 0 },
        { label: 'Tháng 3', count: 0, trend: 0 },
        { label: 'Tháng 4', count: 0, trend: 0 },
        { label: 'Tháng 5', count: 0, trend: 0 },
        { label: 'Tháng 6', count: 0, trend: 0 },
        { label: 'Tháng 7', count: 0, trend: 0 },
        { label: 'Tháng 8', count: 0, trend: 0 },
        { label: 'Tháng 9', count: 0, trend: 0 },
        { label: 'Tháng 10', count: 0, trend: 0 },
        { label: 'Tháng 11', count: 0, trend: 0 },
        { label: 'Tháng 12', count: 0, trend: 0 },
      ]

  // 3. Dữ liệu cho chế độ Năm (Yearly) - Ưu tiên từ CSDL PostgreSQL
  const dbYearRegs = summary?.registrationsByYear
  const yearData: ChartDataPoint[] = dbYearRegs && dbYearRegs.length > 0
    ? dbYearRegs.map((d) => ({
        label: d.date,
        count: Number(d.count || 0),
        trend: Math.round(Number(d.count || 0) * 0.85),
      }))
    : [
        { label: 'Năm 2026', count: Number(summary?.totalUsers || 0), trend: Math.round(Number(summary?.totalUsers || 0) * 0.8) },
      ]

  const activeData = period === 'WEEK' ? weekData : period === 'MONTH' ? monthData : yearData
  const maxVal = Math.max(...activeData.map((d) => Math.max(d.count, d.trend)), 10)

  // Tính toán đường Line trend SVG
  const chartHeight = 180
  const chartWidth = 700

  // Hàm tính tọa độ X, Y cho SVG line
  const getCoordinates = (index: number, total: number, value: number) => {
    const step = chartWidth / (total - 1 || 1)
    const x = index * step
    const y = chartHeight - (value / maxVal) * (chartHeight - 30) - 15
    return { x, y }
  }

  // Tạo d-string cho SVG path (Line)
  const linePoints = activeData.map((d, i) => getCoordinates(i, activeData.length, d.trend))
  const svgLineD = linePoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')

  // Tạo area gradient fill dưới đường line
  const svgAreaD = linePoints.length > 0
    ? `${svgLineD} L ${linePoints[linePoints.length - 1].x} ${chartHeight} L ${linePoints[0].x} ${chartHeight} Z`
    : ''

  return (
    <Card hover={false} className="relative overflow-hidden p-6 shadow-xl shadow-plum-900/5">
      {/* Chart Header & Period Selector */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-plum-900">Số lượng đăng ký mới</h2>
            <Badge tone="mint" size="sm" className="gap-1 font-bold">
              <Activity className="h-3 w-3 text-mint-600" />
              {period === 'WEEK' ? 'Theo ngày' : period === 'MONTH' ? 'Theo tháng' : 'Theo năm'}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-plum-400">
            {period === 'WEEK'
              ? 'Thống kê tài khoản mới đăng ký theo ngày'
              : period === 'MONTH'
              ? 'Thống kê lượng người dùng mới 12 tháng trong năm'
              : 'Thống kê sự tăng trưởng qua các năm'}
          </p>
        </div>

        {/* Period Switcher Tabs */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-cream-100 p-1 border border-plum-900/5">
          {(
            [
              { key: 'WEEK', label: 'Tuần' },
              { key: 'MONTH', label: 'Tháng' },
              { key: 'YEAR', label: 'Năm' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setPeriod(t.key)}
              className={cn(
                'relative rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                period === t.key
                  ? 'text-plum-900 shadow-sm'
                  : 'text-plum-500 hover:text-plum-900'
              )}
            >
              {period === t.key && (
                <motion.span
                  layoutId="activePeriodTab"
                  className="absolute inset-0 rounded-xl bg-white shadow-md shadow-plum-900/10 ring-1 ring-plum-900/5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chart Legend */}
      <div className="mb-5 flex flex-wrap items-center justify-between border-b border-plum-900/5 pb-4 text-xs">
        <div className="flex items-center gap-5">
          {/* Bar Legend */}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md bg-gradient-to-t from-brand-600 to-brand-400 shadow-sm" />
            <span className="font-semibold text-plum-700">Tài khoản đăng ký</span>
          </div>

          {/* Line Legend */}
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded bg-gradient-to-r from-amber-500 to-coral-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-coral-500 ring-2 ring-coral-200" />
            <span className="font-semibold text-plum-700">Xu hướng tăng trưởng</span>
          </div>
        </div>

        {/* Total Summary */}
        <div className="flex items-center gap-1.5 text-plum-500 font-semibold">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          <span>Tổng đăng ký: </span>
          <span className="font-black text-plum-900">
            {activeData.reduce((acc, d) => acc + d.count, 0).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative h-[220px] w-full pt-4">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="w-full border-b border-dashed border-plum-900/15" />
          ))}
        </div>

        {/* Overlay SVG Line Trend Chart */}
        <div className="absolute inset-x-0 top-4 bottom-8 pointer-events-none z-10">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="h-full w-full overflow-visible preserve-3d">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#efaf3e" />
                <stop offset="50%" stopColor="#fb8366" />
                <stop offset="100%" stopColor="#ad85e6" />
              </linearGradient>
              <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fb8366" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#fb8366" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              d={svgAreaD}
              fill="url(#areaGrad)"
            />

            {/* Main Trend Line */}
            <motion.path
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              d={svgLineD}
              fill="none"
              stroke="url(#lineGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Line Glowing Dots */}
            {linePoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIdx === i ? 6 : 4}
                  fill="#ffffff"
                  stroke="#fb8366"
                  strokeWidth="3"
                  className="transition-all duration-200"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Combo Bars Layer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex h-full items-end gap-2 sm:gap-3"
          >
            {activeData.map((d, i) => {
              const heightPct = Math.max((d.count / maxVal) * 100, 8)
              const isHovered = hoveredIdx === i

              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="group relative flex flex-1 flex-col items-center justify-end h-full cursor-pointer z-20"
                >
                  {/* Tooltip Hover Box */}
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute -top-14 z-30 flex flex-col items-center pointer-events-none"
                    >
                      <div className="rounded-xl bg-plum-900 px-3 py-1.5 text-[11px] font-bold text-white shadow-xl shadow-plum-900/30 ring-1 ring-white/10 whitespace-nowrap">
                        <span className="block text-gold-300 font-extrabold">{d.label}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span>Đăng ký: <strong className="text-white">{d.count}</strong></span>
                          <span>·</span>
                          <span className="text-coral-300">Xu hướng: {d.trend}</span>
                        </div>
                      </div>
                      <div className="h-2 w-2 rotate-45 bg-plum-900 -mt-1" />
                    </motion.div>
                  )}

                  {/* Vertical Column Bar */}
                  <div className="w-full flex-1 flex items-end justify-center px-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.5, delay: i * 0.03, ease: 'easeOut' }}
                      className={cn(
                        'w-full max-w-[42px] rounded-t-xl transition-all duration-300',
                        isHovered
                          ? 'bg-gradient-to-t from-brand-600 via-brand-500 to-violet-400 shadow-lg shadow-brand-500/40 ring-2 ring-brand-400'
                          : 'bg-gradient-to-t from-brand-500/40 via-brand-500/70 to-brand-400 opacity-90'
                      )}
                    />
                  </div>

                  {/* X-Axis Label */}
                  <span
                    className={cn(
                      'mt-2 text-[11px] font-bold transition-colors whitespace-nowrap',
                      isHovered ? 'text-plum-900 scale-105' : 'text-plum-500'
                    )}
                  >
                    {d.label}
                  </span>
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  )
}
