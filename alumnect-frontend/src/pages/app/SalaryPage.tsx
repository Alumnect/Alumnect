import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Plus, Filter, AlertTriangle, RefreshCw, ListChecks, Search, X, LayoutGrid,
  MapPin, Code2, Megaphone, Users, Palette, Briefcase, HelpCircle, ChevronDown, ChevronUp,
  TrendingUp, BarChart3, History,
} from 'lucide-react'
import { PageHeader, Card, EmptyState, toast, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import {
  ContributeSalaryModal,
  MyContributionsModal,
  SalaryContributionsFeed,
  useSalaryStatistics,
  useIndustries,
  SALARY_LEVELS,
  getIndustryIcon,
} from '@/features/salary'
import type { SalaryContribution, SalaryLevel } from '@/features/salary'
import { EntitySelectField, type SelectOption } from '@/features/forum/components/EntitySelectField'

const ALL_REGIONS = 'Tất cả khu vực'
const JOB_TITLE_SEARCH_MAX_LENGTH = 150

/** Ánh xạ thông minh icon và màu sắc chủ đạo theo từ khóa vị trí công việc */
function getJobStyle(role: string) {
  const r = role.toLowerCase()
  if (r.includes('data') || r.includes('analyst') || r.includes('dữ liệu') || r.includes('bi')) {
    return { icon: BarChart3, bg: 'bg-sky-100 text-sky-600', badge: 'bg-sky-50 text-sky-700 border-sky-200/60' }
  }
  if (r.includes('design') || r.includes('ui') || r.includes('ux') || r.includes('thiết kế') || r.includes('graphic')) {
    return { icon: Palette, bg: 'bg-rose-100 text-rose-600', badge: 'bg-rose-50 text-rose-700 border-rose-200/60' }
  }
  if (r.includes('dev') || r.includes('lập trình') || r.includes('engineer') || r.includes('kỹ sư') || r.includes('software') || r.includes('frontend') || r.includes('backend') || r.includes('fullstack')) {
    return { icon: Code2, bg: 'bg-brand-100 text-brand-600', badge: 'bg-brand-50 text-brand-700 border-brand-200/60' }
  }
  if (r.includes('market') || r.includes('seo') || r.includes('content') || r.includes('quảng cáo') || r.includes('media')) {
    return { icon: Megaphone, bg: 'bg-violet-100 text-violet-600', badge: 'bg-violet-50 text-violet-700 border-violet-200/60' }
  }
  if (r.includes('business') || r.includes('sales') || r.includes('kinh doanh') || r.includes('finance') || r.includes('tài chính') || r.includes('manager') || r.includes('quản lý') || r.includes('pm')) {
    return { icon: Briefcase, bg: 'bg-emerald-100 text-emerald-700', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' }
  }
  return { icon: Users, bg: 'bg-amber-100 text-amber-700', badge: 'bg-amber-50 text-amber-700 border-amber-200/60' }
}

/** Khung xương hiển thị trong lúc tải thống kê lần đầu (UC53). */
function SalarySkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-plum-900/5 p-4 bg-plum-900/[0.01]">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="h-4 w-44 animate-pulse rounded bg-plum-900/[0.06]" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-plum-900/[0.05]" />
          </div>
          <div className="h-8 w-full animate-pulse rounded-full bg-plum-900/[0.04]" />
        </div>
      ))}
    </div>
  )
}

/** Trạng thái lỗi khi tải thống kê lương thất bại (UC53). */
function SalaryStatsError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được thống kê lương</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={14} />} onClick={onRetry}>
        Thử lại
      </Button>
    </Card>
  )
}

export function SalaryPage() {
  const role = useAuthStore((s) => s.user?.role)
  // Quy tắc nghiệp vụ (UC50, UC51, UC52): CHỈ ALUMNI mới có quyền đóng góp, sửa hoặc xóa dữ liệu lương.
  const canContribute = role === 'ALUMNI'

  const [contributeOpen, setContributeOpen] = useState(false)
  const [myContributionsOpen, setMyContributionsOpen] = useState(false)
  const [editingContribution, setEditingContribution] = useState<SalaryContribution | null>(null)
  const [feedOpen, setFeedOpen] = useState(false)

  // Bộ lọc UC54: ngành nghề, khu vực, chức danh, cấp bậc
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [region, setRegion] = useState<string>(ALL_REGIONS)
  const [level, setLevel] = useState<SalaryLevel | null>(null)
  const [jobTitleInput, setJobTitleInput] = useState<string>('')
  const [jobTitle, setJobTitle] = useState<string>('')

  // Debounce tìm kiếm chức danh 400ms để giảm số lần gọi API khi gõ phím
  useEffect(() => {
    const timer = setTimeout(() => setJobTitle(jobTitleInput), 400)
    return () => clearTimeout(timer)
  }, [jobTitleInput])

  const isFiltering = region !== ALL_REGIONS || industryId !== null || level !== null || jobTitle.trim().length > 0
  const clearFilters = () => {
    setRegion(ALL_REGIONS)
    setIndustryId(null)
    setLevel(null)
    setJobTitleInput('')
  }

  const { data: industries } = useIndustries()
  const { data: baseStats } = useSalaryStatistics()
  const regionOptions: SelectOption<string>[] = useMemo(() => {
    const rawCities = Array.from(new Set((baseStats?.rows ?? []).map((r) => r.region))).sort()
    return rawCities.map((city) => ({ id: city, name: city }))
  }, [baseStats])
  const levels = useMemo(() => {
    const present = new Set((baseStats?.rows ?? []).map((r) => r.level))
    return SALARY_LEVELS.filter((lv) => present.has(lv))
  }, [baseStats])

  const { data, isLoading, isError, error, refetch } = useSalaryStatistics({
    industryId,
    region: region !== ALL_REGIONS ? region : undefined,
    jobTitle: jobTitle.trim() || undefined,
    level,
  })

  // Phân trang danh sách mức lương theo vị trí (5 vị trí / trang)
  const STATS_PAGE_SIZE = 5
  const [statsPage, setStatsPage] = useState(0)

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setStatsPage(0)
  }, [industryId, region, level, jobTitle])

  const rows = data?.rows ?? []
  const totalStatsPages = Math.ceil(rows.length / STATS_PAGE_SIZE)
  const paginatedRows = useMemo(() => {
    const start = statsPage * STATS_PAGE_SIZE
    return rows.slice(start, start + STATS_PAGE_SIZE)
  }, [rows, statsPage])

  // Fallback 1 khi chưa có dữ liệu để tránh Math.max() trả về -Infinity.
  const max = rows.length ? Math.max(...rows.map((s) => s.p75)) : 1

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <PageHeader
        icon={<LineChart size={20} />}
        title="Bảng lương cộng đồng"
        subtitle="Khám phá mức thu nhập thực tế theo vị trí, ngành nghề và cấp bậc do cựu sinh viên FPTU chia sẻ."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<History size={15} className="text-brand-600" />}
              onClick={() => setFeedOpen(true)}
            >
              Đóng góp gần đây
            </Button>
            {canContribute && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ListChecks size={15} />}
                  onClick={() => setMyContributionsOpen(true)}
                >
                  Đóng góp của tôi
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  leftIcon={<Plus size={15} />}
                  onClick={() => setContributeOpen(true)}
                >
                  Đóng góp dữ liệu
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Bộ lọc (UC54): Chức danh, Ngành nghề, Khu vực & Cấp bậc */}
      <Card hover={false} className="overflow-visible p-4 space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-3">
          {/* 1. Tìm kiếm chức danh */}
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400" />
            <input
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              placeholder="Tìm theo chức danh..."
              maxLength={JOB_TITLE_SEARCH_MAX_LENGTH}
              className="h-11 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-10 pr-9 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
            />
            {jobTitleInput && (
              <button
                onClick={() => setJobTitleInput('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-900/[0.06] hover:text-plum-700"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Chọn ngành nghề */}
          <EntitySelectField
            items={industries}
            value={industryId}
            onChange={setIndustryId}
            placeholder="Tất cả ngành nghề"
            searchPlaceholder="Tìm kiếm ngành nghề…"
            searchable
            itemIcon={(name) => {
              const Icon = getIndustryIcon(name)
              return <Icon size={15} className="text-brand-600 shrink-0" />
            }}
            buttonIcon={<LayoutGrid size={15} className="text-brand-600" />}
          />

          {/* 3. Chọn khu vực (tỉnh / thành phố) */}
          <EntitySelectField<string>
            items={regionOptions}
            value={region !== ALL_REGIONS ? region : null}
            onChange={(val) => setRegion(val ?? ALL_REGIONS)}
            placeholder="Tất cả khu vực"
            searchPlaceholder="Tìm tỉnh / thành phố…"
            searchable
            buttonIcon={<MapPin size={15} className="text-brand-600" />}
          />
        </div>

        {/* Hàng lọc Cấp bậc & Nút Xóa bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-plum-900/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-plum-500 mr-1 flex items-center gap-1">
              <Filter size={12} className="text-plum-400" /> Cấp bậc:
            </span>
            <button
              type="button"
              onClick={() => setLevel(null)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                level === null
                  ? 'bg-plum-900 text-white shadow-xs'
                  : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
              )}
            >
              Tất cả
            </button>
            {levels.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(level === lv ? null : lv)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-all',
                  level === lv
                    ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white shadow-xs'
                    : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
                )}
              >
                {lv}
              </button>
            ))}
          </div>

          {isFiltering && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 shrink-0 ml-auto"
            >
              <X size={13} /> Xóa bộ lọc
            </button>
          )}
        </div>
      </Card>

      {/* Khối 1: Mức lương theo vị trí công việc */}
      <Reveal>
        <Card hover={false} className="overflow-hidden p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-plum-900">
                Mức lương theo vị trí
              </h2>
              <span className="text-xs text-plum-400 font-medium">(Triệu VNĐ / tháng)</span>
            </div>
          </div>

          {isLoading ? (
            <SalarySkeleton />
          ) : isError ? (
            <SalaryStatsError message={(error as Error)?.message} onRetry={() => refetch()} />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<LineChart size={24} />}
              title={isFiltering ? 'Không có vị trí nào khớp với bộ lọc này' : 'Chưa có vị trí nào đủ 5 mẫu khảo sát'}
              description={
                isFiltering
                  ? 'Hãy thử thay đổi hoặc xóa bớt tiêu chí lọc để xem thêm dữ liệu.'
                  : 'Dữ liệu sẽ tự động tổng hợp khi mỗi vị trí nhận đủ 5 lượt đóng góp.'
              }
              action={isFiltering ? <Button size="sm" variant="secondary" onClick={clearFilters}>Xóa bộ lọc</Button> : undefined}
            />
          ) : (
            <Stagger className="space-y-4" gap={0.06}>
              {paginatedRows.map((s) => {
                const style = getJobStyle(s.role)
                const IconComponent = style.icon
                return (
                  <StaggerItem key={`${s.role}-${s.level}-${s.region}`}>
                    <div className="rounded-2xl border border-plum-900/8 bg-white p-4 shadow-xs">
                      {/* Tiêu đề vị trí & số mẫu */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', style.bg)}>
                          <IconComponent size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate font-bold text-sm text-plum-900">
                              {s.role}
                              <span className={cn('ml-2 font-semibold text-xs px-2 py-0.5 rounded-md border', style.badge)}>
                                {s.level}
                              </span>
                              <span className="ml-1.5 font-normal text-xs text-plum-400">· {s.region}</span>
                            </h3>
                            <span className="shrink-0 text-xs font-medium text-plum-400 flex items-center gap-1">
                              <Users size={12} /> {s.samples} lượt chia sẻ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt mức lương rõ ràng, dễ hiểu */}
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-plum-500 font-medium">Mức phổ biến:</span>
                          <span className="text-base sm:text-lg font-extrabold text-brand-600">{s.median} Triệu</span>
                          <span className="text-xs text-plum-400">/ tháng</span>
                        </div>
                        <div className="text-xs text-plum-500">
                          Khoảng lương: <strong className="text-plum-800 font-bold">{s.p25} – {s.p75} Triệu</strong>
                        </div>
                      </div>

                      {/* Thanh trực quan dải lương */}
                      <div className="space-y-1.5">
                        <div className="relative h-3.5 rounded-full bg-plum-900/[0.05] overflow-hidden">
                          {/* Dải lương từ thấp đến cao */}
                          <div
                            className="absolute top-0 h-full rounded-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-500"
                            style={{ left: `${(s.p25 / max) * 100}%`, width: `${((s.p75 - s.p25) / max) * 100}%` }}
                          />
                          {/* Vạch mốc lương phổ biến */}
                          <div
                            className="absolute top-0 h-full w-1.5 rounded-full bg-gold-400 shadow-sm transition-all duration-500"
                            style={{ left: `${(s.median / max) * 100}%` }}
                          />
                        </div>

                        {/* 3 mốc số bên dưới: Khởi điểm | Phổ biến nhất | Cao nhất */}
                        <div className="flex items-center justify-between text-[11px] text-plum-500 font-medium pt-0.5">
                          <span>Từ <strong>{s.p25} Tr</strong></span>
                          <span className="text-brand-600 font-bold">Phổ biến: {s.median} Tr</span>
                          <span>Đến <strong>{s.p75} Tr</strong></span>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                )
              })}
            </Stagger>
          )}

          {/* Thanh phân trang khi có nhiều hơn 1 trang */}
          {totalStatsPages > 1 && (
            <div className="mt-4 pt-4 border-t border-plum-900/5 flex items-center justify-center">
              <Pagination
                page={statsPage}
                totalPages={totalStatsPages}
                onPageChange={setStatsPage}
                scrollToTop={false}
              />
            </div>
          )}
        </Card>
      </Reveal>

      {/* Khối 2: Popup lượt đóng góp gần đây */}
      <SalaryContributionsFeed isOpen={feedOpen} onClose={() => setFeedOpen(false)} />

      {/* Modal danh sách đóng góp của chính mình (UC51) */}
      {myContributionsOpen && (
        <MyContributionsModal
          onClose={() => setMyContributionsOpen(false)}
          onEdit={(contribution) => {
            setMyContributionsOpen(false)
            setEditingContribution(contribution)
          }}
        />
      )}

      {/* Modal đóng góp (UC50) HOẶC chỉnh sửa (UC51) */}
      {(contributeOpen || editingContribution) && (
        <ContributeSalaryModal
          editContribution={editingContribution ?? undefined}
          onClose={() => {
            setContributeOpen(false)
            setEditingContribution(null)
          }}
          onSuccess={() => {
            const wasEdit = !!editingContribution
            setContributeOpen(false)
            setEditingContribution(null)
            toast.success(
              wasEdit
                ? 'Đã cập nhật dữ liệu lương thành công!'
                : 'Đã ghi nhận đóng góp dữ liệu lương của bạn. Cảm ơn bạn!'
            )
          }}
        />
      )}
    </div>
  )
}
