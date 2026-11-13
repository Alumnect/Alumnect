import { useMemo, useState, useRef, useEffect } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  HandCoins,
  Scale,
  Search,
  ShieldCheck,
  WalletCards,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SelectDropdown, toast } from '@/components/ui'
import { useAdminRevenueOverview } from '../hooks/useAdmin'
import type { AdminRevenueTransactionDto } from '../api/adminApi'
import { exportFinancialExcel, exportRevenueCsv } from '../lib/excelExport'
import { AdminPageBanner, StatTile } from './AdminVisuals'
import { brandButtonClass } from '@/components/brand/brandClasses'
import { cn } from '@/lib/utils'

type Period = 'ALL' | '30D' | '90D' | 'YEAR'

const PERIOD_LABELS: Record<Period, string> = {
  ALL: 'Toàn bộ thời gian',
  '30D': '30 ngày gần nhất',
  '90D': '90 ngày gần nhất',
  YEAR: 'Năm tài chính 2026',
}

const formatVnd = (value = 0) => new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
}).format(value)

const formatDateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value))

const getRange = (period: Period) => {
  if (period === 'ALL') return undefined
  const now = new Date()
  const from = new Date(now)
  if (period === '30D') from.setDate(from.getDate() - 30)
  if (period === '90D') from.setDate(from.getDate() - 90)
  if (period === 'YEAR') {
    from.setMonth(0, 1)
    from.setHours(0, 0, 0, 0)
  }
  return { from: from.toISOString(), to: now.toISOString() }
}

export function AdminRevenuePage() {
  const [period, setPeriod] = useState<Period>('ALL')
  const [source, setSource] = useState<'ALL' | AdminRevenueTransactionDto['sourceType']>('ALL')
  const [query, setQuery] = useState('')
  const range = useMemo(() => getRange(period), [period])
  const { data, isLoading, error, refetch } = useAdminRevenueOverview(range)

  // Chỉ hiển thị dữ liệu thật từ backend; chưa có dữ liệu thì các chỉ số về 0 và danh sách trống
  const effectiveData: Partial<NonNullable<typeof data>> = data ?? {}

  const transactions = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi')
    return (effectiveData.transactions ?? []).filter((item) => {
      const matchesSource = source === 'ALL' || item.sourceType === source
      const matchesQuery = !keyword || [item.payerName, item.payerEmail, item.referenceCode, item.description]
        .some((value) => value?.toLocaleLowerCase('vi').includes(keyword))
      return matchesSource && matchesQuery
    })
  }, [effectiveData.transactions, query, source])

  const chartMax = Math.max(...(effectiveData.monthlyRevenue ?? []).map((item) => item.totalRevenue), 1)
  const growth = effectiveData.monthGrowthPercent ?? 0

  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportExcel = () => {
    if (!data) return
    exportFinancialExcel(data, transactions, PERIOD_LABELS[period])
    toast.success('Đã xuất Báo cáo tài chính Excel (.xls) thành công!')
    setShowExportMenu(false)
  }

  const handleExportCsv = () => {
    if (!transactions.length) return
    exportRevenueCsv(transactions)
    toast.success('Đã xuất file dữ liệu giao dịch (.csv) thành công!')
    setShowExportMenu(false)
  }

  if (error && !data) return (
    <div className="rounded-2xl border border-danger-border bg-danger-soft p-8 text-center">
      <p className="font-bold text-danger">Không thể tải dữ liệu doanh thu</p>
      <p className="mt-1 text-sm text-danger">{(error as Error).message}</p>
      <Button className="mt-4" variant="secondary" onClick={() => refetch()}>Thử lại</Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 text-text">
      {/* 1. Dải đầu trang: kỳ báo cáo + xuất file */}
      <AdminPageBanner
        title="Doanh thu nền tảng"
        description="Chỉ tính tiền thuộc về nền tảng, không gồm tiền ký quỹ."
        scene="revenue"
        actions={
          <>
            <div role="tablist" aria-label="Kỳ báo cáo" className="inline-flex rounded-2xl border border-[#F3D9C8] bg-white/80 p-1 backdrop-blur dark:border-border dark:bg-surface">
              {(['ALL', '30D', '90D', 'YEAR'] as Period[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={period === item}
                  onClick={() => setPeriod(item)}
                  className={cn('rounded-xl px-3.5 py-2 text-sm font-semibold transition', period === item ? 'bg-[#1F2A44] text-white shadow-sm' : 'text-text-muted hover:text-text')}
                >
                  {{ ALL: 'Tất cả', '30D': '30 ngày', '90D': '90 ngày', YEAR: 'Năm nay' }[item]}
                </button>
              ))}
            </div>
          {/* Enhanced Financial Export Dropdown Menu */}
          <div className="relative inline-block text-left" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!transactions.length}
              className={cn(brandButtonClass, 'disabled:opacity-50')}
            >
              <Download className="h-4 w-4" />
              <span>Xuất báo cáo tài chính</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 z-50 mt-1.5 w-68 origin-top-right rounded-2xl border border-border bg-surface p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95">
                <div className="px-3 py-1.5 text-xs font-bold text-text-subtle border-b border-border mb-1">
                  Định dạng trích xuất
                </div>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-text hover:bg-primary-soft hover:text-primary-solid transition text-left cursor-pointer group"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition shrink-0">
                    <FileSpreadsheet className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-bold text-text group-hover:text-primary-solid">Báo cáo tài chính Excel (.xls)</p>
                    <p className="text-xs text-text-subtle">2 sheet: Tổng quan P&amp;L + Sổ chi tiết</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-text hover:bg-surface-2 transition text-left cursor-pointer group mt-0.5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition shrink-0">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-bold text-text">Dữ liệu thô CSV (.csv)</p>
                    <p className="text-xs text-text-subtle">Danh sách giao dịch định dạng UTF-8</p>
                  </div>
                </button>
              </div>
            )}
          </div>
          </>
        }
      />

      {/* 2. Số liệu doanh thu: tổng nổi bật trên nền xanh đậm + ba nguồn */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#1F2A44] to-[#2B3A5E] px-5 py-4 text-white">
          <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[#F27024]/25 blur-xl" aria-hidden />
          <p className="relative text-[13px] text-[#B9C3DA]">Tổng doanh thu sở hữu · {PERIOD_LABELS[period].toLocaleLowerCase('vi')}</p>
          {isLoading && !data ? (
            <div className="relative mt-2 h-8 w-2/3 animate-pulse rounded bg-white/10" />
          ) : (
            <p className="relative mt-1 font-display text-[28px] font-bold tabular-nums">{formatVnd(effectiveData.totalOwnedRevenue)}</p>
          )}
          <p className="relative mt-0.5 text-xs text-[#B9C3DA]">{effectiveData.successfulTransactionCount ?? 0} khoản đã ghi nhận</p>
        </div>
        <StatTile icon={<WalletCards />} tone="blue" label="Doanh thu gói Mentor" value={isLoading && !data ? '…' : formatVnd(effectiveData.subscriptionRevenue)} />
        <StatTile icon={<Scale />} tone="violet" label="Phí xử lý tranh chấp" value={isLoading && !data ? '…' : formatVnd(effectiveData.disputeFeeRevenue)} />
        <StatTile
          icon={growth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
          tone={growth >= 0 ? 'green' : 'red'}
          label="Doanh thu tháng này"
          value={isLoading && !data ? '…' : formatVnd(effectiveData.currentMonthRevenue)}
          hint={growth === 0 ? 'Không đổi so với tháng trước' : `${growth > 0 ? '+' : ''}${growth.toLocaleString('vi-VN')}% so với tháng trước`}
        />
      </section>
      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFF4E0] text-[#C27C00]"><ShieldCheck className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-text">Quỹ đang quản lý — không phải doanh thu</h2>
            
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><FundValue label="Đang giữ ký quỹ" value={effectiveData.escrowHolding} /><FundValue label="Chờ chi cho Mentor" value={effectiveData.pendingMentorPayout} /><FundValue label="Chờ hoàn học viên" value={effectiveData.pendingStudentRefund} /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-3xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between"><h2 className="font-display font-bold text-text">Xu hướng doanh thu 12 tháng</h2></div>
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
            {(effectiveData.monthlyRevenue ?? Array.from({ length: 12 })).map((item, index) => {
              const total = item?.totalRevenue ?? 0
              const height = total ? Math.max(8, total / chartMax * 100) : 3
              return <div key={item?.month ?? index} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-[#F27024] to-[#FFB067] transition group-hover:from-[#dc5e16]" style={{ height: `${isLoading && !data ? 18 + index * 4 % 55 : height}%` }} title={`${item?.label ?? ''}: ${formatVnd(total)}`} /></div><span className="mt-2 truncate text-center text-xs font-semibold text-text-subtle">{item?.label?.slice(0, 2) ?? ''}</span></div>
            })}
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6">
          <h2 className="font-display font-bold text-text">Cơ cấu doanh thu</h2>
          <div className="mt-6 space-y-5"><BreakdownRow label="Gói dịch vụ Mentor" value={effectiveData.subscriptionRevenue ?? 0} total={effectiveData.totalOwnedRevenue ?? 0} color="bg-info" /><BreakdownRow label="Phí xử lý tranh chấp" value={effectiveData.disputeFeeRevenue ?? 0} total={effectiveData.totalOwnedRevenue ?? 0} color="bg-violet-500" /></div>
          <div className="mt-7 rounded-2xl bg-success-soft p-4"><div className="flex items-center gap-2 text-sm font-bold text-success"><HandCoins className="h-4 w-4" /> Nguyên tắc ghi nhận</div><p className="mt-1.5 text-xs leading-5 text-success">Gói chỉ tính khi đã thanh toán. Phí tranh chấp chỉ tính sau khi Ticket được Admin giải quyết.</p></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display font-bold text-text">Giao dịch doanh thu</h2><p className="text-xs text-text-subtle">{transactions.length} kết quả trong kỳ đang chọn</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, email hoặc mã..." className="h-9 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-xs outline-none focus:border-primary sm:w-60" /></label><SelectDropdown
              value={source}
              onChange={(val) => setSource(val as typeof source)}
              options={[
                { value: 'ALL', label: 'Tất cả nguồn thu' },
                { value: 'MENTOR_SUBSCRIPTION', label: 'Gói Mentor' },
                { value: 'DISPUTE_FEE', label: 'Phí tranh chấp' },
              ]}
              placeholder="Tất cả nguồn thu"
              className="sm:w-48"
              buttonClassName="h-9 text-xs"
            /></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-surface-2 text-xs text-text-subtle"><tr><th className="px-5 py-3">Giao dịch</th><th className="px-5 py-3">Người thanh toán</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Phương thức</th><th className="px-5 py-3 text-right">Doanh thu</th></tr></thead><tbody className="divide-y divide-border">
          {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableSkeleton key={index} />) : transactions.length ? transactions.map((item) => <tr key={item.id} className="hover:bg-surface-2"><td className="px-5 py-4"><p className="font-semibold text-text">{item.description}</p><p className="mt-0.5 text-xs text-text-subtle">#{item.referenceCode}</p></td><td className="px-5 py-4"><p className="font-semibold">{item.payerName}</p><p className="mt-0.5 text-xs text-text-subtle">{item.payerEmail}</p></td><td className="px-5 py-4 text-xs text-text-subtle">{formatDateTime(item.occurredAt)}</td><td className="px-5 py-4"><span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-bold text-text-muted">{item.paymentMethod}</span></td><td className="px-5 py-4 text-right font-bold text-success">+{formatVnd(item.amount)}</td></tr>) : <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-text-subtle">Không có giao dịch doanh thu phù hợp.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  )
}

function FundValue({ label, value = 0 }: { label: string; value?: number }) { return <div className="rounded-2xl border border-border bg-surface-2/60 px-4 py-3"><p className="text-xs font-semibold text-text-subtle">{label}</p><p className="mt-1 font-display text-lg font-bold tabular-nums text-text">{formatVnd(value)}</p></div> }
function BreakdownRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total ? Math.round(value / total * 100) : 0; return <div><div className="flex items-center justify-between text-xs"><span className="font-semibold text-text-muted">{label}</span><span className="font-bold">{percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div><p className="mt-1.5 text-right text-xs font-bold text-text-subtle">{formatVnd(value)}</p></div> }
function TableSkeleton() { return <tr>{Array.from({ length: 5 }).map((_, index) => <td key={index} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-surface-2" /></td>)}</tr> }
