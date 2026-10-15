import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Plus, Filter, AlertTriangle, RefreshCw, ListChecks, Search, X, LayoutGrid,
  MapPin, Code2, Megaphone, Users, Palette, Briefcase,
  BarChart3, History,
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
    return { icon: BarChart3, bg: 'bg-info-soft text-info', badge: 'bg-info-soft text-info border-info-border' }
  }
  if (r.includes('design') || r.includes('ui') || r.includes('ux') || r.includes('thiết kế') || r.includes('graphic')) {
    return { icon: Palette, bg: 'bg-danger-soft text-danger', badge: 'bg-danger-soft text-danger border-danger-border' }
  }
  if (r.includes('dev') || r.includes('lập trình') || r.includes('engineer') || r.includes('kỹ sư') || r.includes('software') || r.includes('frontend') || r.includes('backend') || r.includes('fullstack')) {
    return { icon: Code2, bg: 'bg-primary-soft text-primary-solid', badge: 'bg-primary-soft text-primary-solid border-primary-soft-border' }
  }
  if (r.includes('market') || r.includes('seo') || r.includes('content') || r.includes('quảng cáo') || r.includes('media')) {
    return { icon: Megaphone, bg: 'bg-info-soft text-info', badge: 'bg-info-soft text-info border-info-border' }
  }
  if (r.includes('business') || r.includes('sales') || r.includes('kinh doanh') || r.includes('finance') || r.includes('tài chính') || r.includes('manager') || r.includes('quản lý') || r.includes('pm')) {
    return { icon: Briefcase, bg: 'bg-success-soft text-success', badge: 'bg-success-soft text-success border-success-border' }
  }
  return { icon: Users, bg: 'bg-warning-soft text-warning', badge: 'bg-warning-soft text-warning border-warning-border' }
}

/** Khung xương hiển thị trong lúc tải thống kê lần đầu (UC53). */
function SalarySkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-border p-4 bg-surface-2">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="h-4 w-44 animate-pulse rounded bg-border" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-surface-2" />
          </div>
          <div className="h-8 w-full animate-pulse rounded-full bg-surface-2" />
        </div>
      ))}
    </div>
  )
}

/** Trạng thái lỗi khi tải thống kê lương thất bại (UC53). */
function SalaryStatsError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-text">Không tải được thống kê lương</p>
        <p className="mt-1 text-sm text-text-subtle">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
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
              leftIcon={<History size={15} className="text-primary-solid" />}
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
                  variant="primary"
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
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              placeholder="Tìm theo chức danh..."
              maxLength={JOB_TITLE_SEARCH_MAX_LENGTH}
              className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors dark:placeholder-[#b0b3b8]"
            />
            {jobTitleInput && (
              <button
                onClick={() => setJobTitleInput('')}
                aria-label="Xóa tìm kiếm"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle transition-colors hover:bg-border hover:text-text-muted"
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
              return <Icon size={15} className="text-primary-solid shrink-0" />
            }}
            buttonIcon={<LayoutGrid size={15} className="text-primary-solid" />}
          />

          {/* 3. Chọn khu vực (tỉnh / thành phố) */}
          <EntitySelectField<string>
            items={regionOptions}
            value={region !== ALL_REGIONS ? region : null}
            onChange={(val) => setRegion(val ?? ALL_REGIONS)}
            placeholder="Tất cả khu vực"
            searchPlaceholder="Tìm tỉnh / thành phố…"
            searchable
            buttonIcon={<MapPin size={15} className="text-primary-solid" />}
          />
        </div>

        {/* Hàng lọc Cấp bậc & Nút Xóa bộ lọc */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-subtle mr-1 flex items-center gap-1">
              <Filter size={12} className="text-text-subtle" /> Cấp bậc:
            </span>
            <button
              type="button"
              onClick={() => setLevel(null)}
              className={cn(
                'min-h-8 rounded-full px-3 py-1 text-sm font-semibold transition-colors',
                level === null
                  ? 'bg-text text-bg shadow-raised'
                  : 'bg-surface-2 text-text-muted hover:bg-surface-3'
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
                  'min-h-8 rounded-full px-3 py-1 text-sm font-semibold transition-colors',
                  level === lv
                    ? 'bg-primary-solid text-on-primary shadow-raised'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                )}
              >
                {lv}
              </button>
            ))}
          </div>

          {isFiltering && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-danger hover:text-danger shrink-0 ml-auto"
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
              <h2 className="text-base sm:text-lg font-bold text-text">
                Mức lương theo vị trí
              </h2>
              <span className="text-xs text-text-subtle font-medium">(Triệu VNĐ / tháng)</span>
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
                    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                      {/* Tiêu đề vị trí & số mẫu */}
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-xl', style.bg)}>
                          <IconComponent size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate font-bold text-sm text-text">
                              {s.role}
                              <span className={cn('ml-2 font-semibold text-xs px-2 py-0.5 rounded-md border', style.badge)}>
                                {s.level}
                              </span>
                              <span className="ml-1.5 font-normal text-xs text-text-subtle">· {s.region}</span>
                            </h3>
                            <span className="shrink-0 text-xs font-medium text-text-subtle flex items-center gap-1">
                              <Users size={12} /> {s.samples} lượt chia sẻ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tóm tắt mức lương rõ ràng, dễ hiểu */}
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-text-subtle font-medium">Mức phổ biến:</span>
                          <span className="text-base sm:text-lg font-extrabold text-primary-solid">{s.median} Triệu</span>
                          <span className="text-xs text-text-subtle">/ tháng</span>
                        </div>
                        <div className="text-xs text-text-subtle">
                          Khoảng lương: <strong className="text-text font-bold">{s.p25} – {s.p75} Triệu</strong>
                        </div>
                      </div>

                      {/* Thanh trực quan dải lương */}
                      <div className="space-y-1.5">
                        <div className="relative h-3.5 rounded-full bg-surface-2 overflow-hidden">
                          {/* Dải lương từ thấp đến cao */}
                          <div
                            className="absolute top-0 h-full rounded-full bg-primary-solid transition-all duration-500"
                            style={{ left: `${(s.p25 / max) * 100}%`, width: `${((s.p75 - s.p25) / max) * 100}%` }}
                          />
                          {/* Vạch mốc lương phổ biến */}
                          <div
                            className="absolute top-0 h-full w-1.5 rounded-full bg-gold-400 shadow-sm transition-all duration-500"
                            style={{ left: `${(s.median / max) * 100}%` }}
                          />
                        </div>

                        {/* 3 mốc số bên dưới: Khởi điểm | Phổ biến nhất | Cao nhất */}
                        <div className="flex items-center justify-between text-xs text-text-subtle font-medium pt-0.5">
                          <span>Từ <strong>{s.p25} Tr</strong></span>
                          <span className="text-primary-solid font-bold">Phổ biến: {s.median} Tr</span>
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
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-center">
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
