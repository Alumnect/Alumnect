import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, Download, HandCoins, RefreshCw, Scale, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAdminRevenueOverview } from '../hooks/useAdmin'
import type { AdminRevenueTransactionDto } from '../api/adminApi'

type Period = 'ALL' | '30D' | '90D' | 'YEAR'

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
  const { data, isLoading, isFetching, error, refetch } = useAdminRevenueOverview(range)

  const transactions = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('vi')
    return (data?.transactions ?? []).filter((item) => {
      const matchesSource = source === 'ALL' || item.sourceType === source
      const matchesQuery = !keyword || [item.payerName, item.payerEmail, item.referenceCode, item.description]
        .some((value) => value?.toLocaleLowerCase('vi').includes(keyword))
      return matchesSource && matchesQuery
    })
  }, [data?.transactions, query, source])

  const chartMax = Math.max(...(data?.monthlyRevenue ?? []).map((item) => item.totalRevenue), 1)
  const growth = data?.monthGrowthPercent ?? 0

  const exportCsv = () => {
    if (!transactions.length) return
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
    const rows = [
      ['Mã tham chiếu', 'Nguồn thu', 'Người thanh toán', 'Email', 'Số tiền', 'Thời gian', 'Phương thức'],
      ...transactions.map((item) => [item.referenceCode, item.sourceType === 'MENTOR_SUBSCRIPTION' ? 'Gói Mentor' : 'Phí tranh chấp', item.payerName, item.payerEmail, item.amount, formatDateTime(item.occurredAt), item.paymentMethod]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(',')).join('\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `doanh-thu-alumnect-${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  if (error) return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
      <p className="font-bold text-rose-700">Không thể tải dữ liệu doanh thu</p>
      <p className="mt-1 text-sm text-rose-600">{(error as Error).message}</p>
      <Button className="mt-4" variant="secondary" onClick={() => refetch()}>Thử lại</Button>
    </div>
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5 text-slate-800 dark:text-slate-100">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F27024]"><BadgeDollarSign className="h-4 w-4" /> Tài chính AlumNect</div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Doanh thu nền tảng</h1>
          <p className="mt-1 text-sm text-slate-500">Chỉ ghi nhận tiền thuộc sở hữu Admin; không cộng tiền ký quỹ hoặc tiền đang chờ chi.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-700 dark:bg-slate-900">
            {(['ALL', '30D', '90D', 'YEAR'] as Period[]).map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${period === item ? 'bg-[#F27024] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{{ ALL: 'Tất cả', '30D': '30 ngày', '90D': '90 ngày', YEAR: 'Năm nay' }[item]}</button>)}
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="gap-2"><RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Làm mới</Button>
          <Button variant="gold" size="sm" onClick={exportCsv} disabled={!transactions.length} className="gap-2"><Download className="h-4 w-4" /> Xuất báo cáo</Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <RevenueCard loading={isLoading} label="Tổng doanh thu sở hữu" value={formatVnd(data?.totalOwnedRevenue)} helper={`${data?.successfulTransactionCount ?? 0} khoản đã ghi nhận`} icon={<BadgeDollarSign className="h-5 w-5" />} tone="orange" />
        <RevenueCard loading={isLoading} label="Doanh thu gói Mentor" value={formatVnd(data?.subscriptionRevenue)} helper="Thanh toán gói thành công" icon={<WalletCards className="h-5 w-5" />} tone="blue" />
        <RevenueCard loading={isLoading} label="Phí xử lý tranh chấp" value={formatVnd(data?.disputeFeeRevenue)} helper="Ticket đã được giải quyết" icon={<Scale className="h-5 w-5" />} tone="violet" />
        <RevenueCard loading={isLoading} label="Doanh thu tháng này" value={formatVnd(data?.currentMonthRevenue)} helper={growth === 0 ? 'Không đổi so với tháng trước' : `${growth > 0 ? '+' : ''}${growth.toLocaleString('vi-VN')}% so với tháng trước`} icon={growth >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />} tone={growth >= 0 ? 'green' : 'red'} />
      </section>

      <section className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-white p-2 text-amber-600 shadow-xs dark:bg-slate-900"><ShieldCheck className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900 dark:text-white">Quỹ đang quản lý — không phải doanh thu</h2>
            <p className="text-xs text-slate-500">Các khoản này vẫn thuộc học viên hoặc Mentor cho đến khi hoàn tất quyết toán.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3"><FundValue label="Đang giữ ký quỹ" value={data?.escrowHolding} /><FundValue label="Chờ chi cho Mentor" value={data?.pendingMentorPayout} /><FundValue label="Chờ hoàn học viên" value={data?.pendingStudentRefund} /></div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-950 dark:text-white">Xu hướng doanh thu 12 tháng</h2><p className="text-xs text-slate-500">Gói Mentor và phí xử lý tranh chấp đã ghi nhận</p></div><p className="text-xs font-semibold text-slate-400">Đơn vị: VNĐ</p></div>
          <div className="mt-6 flex h-56 items-end gap-2 sm:gap-3">
            {(data?.monthlyRevenue ?? Array.from({ length: 12 })).map((item, index) => {
              const total = item?.totalRevenue ?? 0
              const height = total ? Math.max(8, total / chartMax * 100) : 3
              return <div key={item?.month ?? index} className="group flex h-full min-w-0 flex-1 flex-col justify-end"><div className="relative flex flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-[#F27024] to-[#FFB067] transition-all group-hover:from-[#dc5e16]" style={{ height: `${isLoading ? 18 + index * 4 % 55 : height}%` }} title={`${item?.label ?? ''}: ${formatVnd(total)}`} /></div><span className="mt-2 truncate text-center text-[10px] font-semibold text-slate-400">{item?.label?.slice(0, 2) ?? ''}</span></div>
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <h2 className="font-bold text-slate-950 dark:text-white">Cơ cấu doanh thu</h2><p className="text-xs text-slate-500">Theo kỳ đang chọn</p>
          <div className="mt-6 space-y-5"><BreakdownRow label="Gói dịch vụ Mentor" value={data?.subscriptionRevenue ?? 0} total={data?.totalOwnedRevenue ?? 0} color="bg-blue-500" /><BreakdownRow label="Phí xử lý tranh chấp" value={data?.disputeFeeRevenue ?? 0} total={data?.totalOwnedRevenue ?? 0} color="bg-violet-500" /></div>
          <div className="mt-7 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/30"><div className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-300"><HandCoins className="h-4 w-4" /> Nguyên tắc ghi nhận</div><p className="mt-1.5 text-xs leading-5 text-emerald-700/80 dark:text-emerald-300/80">Gói chỉ tính khi đã thanh toán. Phí tranh chấp chỉ tính sau khi Ticket được Admin giải quyết.</p></div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between dark:border-slate-800">
          <div><h2 className="font-bold text-slate-950 dark:text-white">Giao dịch doanh thu</h2><p className="text-xs text-slate-500">{transactions.length} kết quả trong kỳ đang chọn</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên, email hoặc mã..." className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none focus:border-[#F27024] sm:w-60 dark:border-slate-700 dark:bg-slate-800" /></label><select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none dark:border-slate-700 dark:bg-slate-800"><option value="ALL">Tất cả nguồn thu</option><option value="MENTOR_SUBSCRIPTION">Gói Mentor</option><option value="DISPUTE_FEE">Phí tranh chấp</option></select></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/70"><tr><th className="px-5 py-3">Giao dịch</th><th className="px-5 py-3">Người thanh toán</th><th className="px-5 py-3">Thời gian</th><th className="px-5 py-3">Phương thức</th><th className="px-5 py-3 text-right">Doanh thu</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableSkeleton key={index} />) : transactions.length ? transactions.map((item) => <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"><td className="px-5 py-4"><p className="font-semibold text-slate-900 dark:text-white">{item.description}</p><p className="mt-0.5 text-xs text-slate-400">#{item.referenceCode}</p></td><td className="px-5 py-4"><p className="font-semibold">{item.payerName}</p><p className="mt-0.5 text-xs text-slate-400">{item.payerEmail}</p></td><td className="px-5 py-4 text-xs text-slate-500">{formatDateTime(item.occurredAt)}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.paymentMethod}</span></td><td className="px-5 py-4 text-right font-extrabold text-emerald-600">+{formatVnd(item.amount)}</td></tr>) : <tr><td colSpan={5} className="px-5 py-14 text-center text-sm text-slate-400">Không có giao dịch doanh thu phù hợp.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  )
}

function RevenueCard({ label, value, helper, icon, tone, loading }: { label: string; value: string; helper: string; icon: ReactNode; tone: 'orange' | 'blue' | 'violet' | 'green' | 'red'; loading: boolean }) {
  const tones = { orange: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/60', blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/60', violet: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/20 dark:border-violet-900/60', green: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/60', red: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/60' }
  return <div className={`rounded-2xl border p-4 shadow-xs ${tones[tone]}`}><div className="flex items-start justify-between"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><span className="rounded-lg bg-white/80 p-2 shadow-xs dark:bg-slate-900/70">{icon}</span></div>{loading ? <div className="mt-3 h-7 w-3/4 animate-pulse rounded bg-slate-200/70" /> : <p className="mt-2 text-xl font-extrabold text-slate-950 dark:text-white">{value}</p>}<p className="mt-1 truncate text-xs text-slate-500">{helper}</p></div>
}

function FundValue({ label, value = 0 }: { label: string; value?: number }) { return <div className="rounded-xl border border-amber-200/80 bg-white/80 px-4 py-3 dark:border-amber-900/60 dark:bg-slate-900/60"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className="mt-1 font-extrabold text-slate-900 dark:text-white">{formatVnd(value)}</p></div> }
function BreakdownRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total ? Math.round(value / total * 100) : 0; return <div><div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span><span className="font-bold">{percent}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div><p className="mt-1.5 text-right text-xs font-bold text-slate-500">{formatVnd(value)}</p></div> }
function TableSkeleton() { return <tr>{Array.from({ length: 5 }).map((_, index) => <td key={index} className="px-5 py-4"><div className="h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" /></td>)}</tr> }
