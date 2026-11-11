import { useState, useMemo } from 'react'
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  Calendar,
  User,
  Users,
  X,
  Archive,
  Hourglass,
  Clock,
  RefreshCw,
  Search,
  RotateCcw,
  CheckCircle2,
  Globe,
  GraduationCap,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'
import { Badge, Avatar, EmptyState, Skeleton, toast, Pagination, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  useAdminSystemNotifications,
  useCancelSystemNotification,
  useArchiveSystemNotification,
} from '../hooks/useAdmin'
import type { SystemNotificationDto, SystemNotificationStatus } from '../api/adminApi'
import { CreateNotificationModal } from './CreateNotificationModal'

const DURATION_LABELS: Record<string, string> = {
  ONE_DAY: '1 ngày',
  ONE_WEEK: '1 tuần',
  ONE_MONTH: '1 tháng',
  ONE_YEAR: '1 năm',
  FOREVER: 'Vĩnh viễn',
  CUSTOM: 'Tùy chỉnh',
}

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'success' | 'gold' | 'danger' | 'neutral' }
> = {
  SENT: { label: 'Đang hoạt động', tone: 'success' },
  ACTIVE: { label: 'Đang hoạt động', tone: 'success' },
  SCHEDULED: { label: 'Đang hẹn giờ', tone: 'gold' },
  SENDING: { label: 'Đang gửi', tone: 'gold' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy lịch', tone: 'danger' },
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
}

const STATUS_TABS: { label: string; value: SystemNotificationStatus | '' }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang hẹn giờ', value: 'SCHEDULED' },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Đã hết hạn', value: 'EXPIRED' },
  { label: 'Kho lưu trữ', value: 'ARCHIVED' },
]

const TIME_TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Hôm nay', value: 'TODAY' },
  { name: 'Tuần này', value: 'THIS_WEEK' },
  { name: 'Tháng này', value: 'THIS_MONTH' },
]

function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${hours}:${minutes} - ${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

/**
 * Trang quản lý thông báo hệ thống dành cho Quản trị viên (Admin).
 * Redesigned theo phong cách shadcn-admin / square-ui với 4 Thẻ KPI và bảng compound 0 cuộn ngang.
 */
export function AdminBroadcastPage() {
  const [statusFilter, setStatusFilter] = useState<SystemNotificationStatus | ''>('')
  const [timeFilter, setTimeFilter] = useState('ALL')
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'ALL_USERS' | 'STUDENT' | 'ALUMNI' | 'SPECIFIC_USER'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<SystemNotificationDto | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null)
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null)

  // Query API
  const { data, isLoading, isFetching, error, refetch } = useAdminSystemNotifications({
    timeFilter,
    status: statusFilter || undefined,
    page,
    size: pageSize,
  })

  const cancelMutation = useCancelSystemNotification()
  const archiveMutation = useArchiveSystemNotification()

  const rawNotifications = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Lọc client-side cho ô tìm kiếm và bộ lọc đối tượng nhận
  const notifications = useMemo(() => {
    return rawNotifications.filter((item) => {
      // Filter theo search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = item.title?.toLowerCase().includes(q)
        const matchContent = item.content?.toLowerCase().includes(q)
        const matchEmail = item.recipientUser?.email?.toLowerCase().includes(q)
        const matchName = item.recipientUser?.fullName?.toLowerCase().includes(q)
        if (!matchTitle && !matchContent && !matchEmail && !matchName) {
          return false
        }
      }

      // Filter theo đối tượng nhận
      if (recipientFilter !== 'ALL') {
        if (recipientFilter === 'ALL_USERS' && item.recipientType !== 'ALL_USERS') return false
        if (recipientFilter === 'SPECIFIC_USER' && item.recipientType !== 'SPECIFIC_USER') return false
        if (recipientFilter === 'STUDENT' && (item.recipientType !== 'USER_ROLE' || item.recipientRole !== 'STUDENT')) return false
        if (recipientFilter === 'ALUMNI' && (item.recipientType !== 'USER_ROLE' || item.recipientRole !== 'ALUMNI')) return false
      }

      return true
    })
  }, [rawNotifications, searchQuery, recipientFilter])

  // Thống kê KPIs từ dữ liệu thông báo
  const kpiStats = useMemo(() => {
    let scheduledCount = 0
    let activeCount = 0
    let archivedCount = 0
    let expiredCount = 0

    rawNotifications.forEach((n) => {
      if (n.status === 'SCHEDULED' || n.status === 'SENDING') scheduledCount++
      else if (n.status === 'ACTIVE' || n.status === 'SENT') activeCount++
      else if (n.status === 'ARCHIVED') archivedCount++
      else if (n.status === 'EXPIRED') expiredCount++
    })

    return {
      scheduledCount,
      activeCount,
      archivedAndExpired: archivedCount + expiredCount,
    }
  }, [rawNotifications])

  const handleCancelScheduled = async (id: number) => {
    try {
      await cancelMutation.mutateAsync(id)
      toast.success('Đã hủy thông báo hẹn giờ thành công!')
      setCancelTargetId(null)
      if (detailItem?.id === id) {
        setDetailItem(null)
      }
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi hủy thông báo')
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await archiveMutation.mutateAsync(id)
      toast.success('Đã lưu trữ thông báo vào kho lưu trữ thành công!')
      setArchiveTargetId(null)
      if (detailItem?.id === id) {
        setDetailItem(null)
      }
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu trữ thông báo')
    }
  }

  const hasActiveFilters =
    statusFilter !== '' ||
    timeFilter !== 'ALL' ||
    recipientFilter !== 'ALL' ||
    Boolean(searchQuery)

  const resetFilters = () => {
    setStatusFilter('')
    setTimeFilter('ALL')
    setRecipientFilter('ALL')
    setSearchQuery('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-solid">
            <Megaphone size={15} /> Truyền thông & Phát sóng toàn trường
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Quản lý thông báo hệ thống
          </h1>
          <p className="mt-0.5 text-xs text-text-subtle">
            Hẹn giờ phát sóng, kiểm soát thời hạn hiệu lực và quản lý kho lưu trữ thông báo độc lập.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl text-xs font-bold h-9 px-3.5 border border-border shadow-2xs"
          >
            <RefreshCw size={13} className={cn(isFetching && 'animate-spin text-primary-solid')} />
            <span>{isFetching ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl text-xs font-bold h-9 px-4 shadow-xs"
            leftIcon={<Plus size={15} />}
          >
            Tạo thông báo mới
          </Button>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng số thông báo */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Tổng thông báo</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
              <Megaphone size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{totalElements}</span>
            <span className="text-xs text-text-subtle font-medium">bản ghi</span>
          </div>
          <p className="mt-1 text-[11px] text-text-subtle font-medium">
            Trang {page + 1} / {Math.max(1, totalPages)}
          </p>
        </div>

        {/* Card 2: Đang hẹn giờ */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đang hẹn giờ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <Hourglass size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{kpiStats.scheduledCount}</span>
            <span className="text-xs text-text-subtle font-medium">lịch chờ gửi</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Clock size={11} /> Tự động phát khi đến giờ
          </p>
        </div>

        {/* Card 3: Đang hoạt động */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đang hoạt động</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{kpiStats.activeCount}</span>
            <span className="text-xs text-text-subtle font-medium">đang phát sóng</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={11} /> Còn trong thời hạn hiệu lực
          </p>
        </div>

        {/* Card 4: Lưu trữ & Hết hạn */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Lưu trữ & Hết hạn</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-2xs">
              <Archive size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{kpiStats.archivedAndExpired}</span>
            <span className="text-xs text-text-subtle font-medium">lịch sử</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
            <Archive size={11} /> Kho lưu trữ bảo lưu dữ liệu
          </p>
        </div>
      </div>

      {/* 3. Single Unified Container Card: Tích hợp Header, Filters, Table & Pagination */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header: Tabs trạng thái thông báo */}
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between bg-surface">
          <div>
            <h2 className="text-base font-extrabold text-text flex items-center gap-2">
              <span>Danh sách thông báo hệ thống</span>
              <span className="rounded-full bg-primary-soft text-primary-solid px-2 py-0.5 text-xs font-bold">
                {totalElements} thông báo
              </span>
            </h2>
            <p className="text-xs text-text-subtle mt-0.5">
              Theo dõi lịch phát sóng, hủy lịch hẹn trước hoặc chuyển thông báo cũ vào kho lưu trữ.
            </p>
          </div>

          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-2xs self-start sm:self-auto overflow-x-auto max-w-full">
            {STATUS_TABS.map((tab) => {
              const isActive = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value)
                    setPage(0)
                  }}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
                    isActive
                      ? 'bg-primary-solid text-on-primary shadow-xs font-extrabold'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toolbar: Tìm kiếm, Bộ lọc Đối tượng & Mốc thời gian */}
        <div className="border-b border-border bg-surface-2/40 p-4 space-y-3.5">
          {/* Row 1: Search Inputs & Recipient Filters */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm kiếm tiêu đề, nội dung thông báo..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm kiếm tiêu đề, nội dung thông báo..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Recipient Segmented Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 shadow-2xs">
              <span className="text-[11px] font-bold text-text-subtle px-2 flex items-center gap-1">
                <Users size={12} className="text-primary-solid" /> Đối tượng:
              </span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'ALL_USERS', label: 'Tất cả người dùng' },
                { id: 'STUDENT', label: 'Sinh viên' },
                { id: 'ALUMNI', label: 'Cựu SV' },
                { id: 'SPECIFIC_USER', label: 'Cá nhân' },
              ].map((r) => {
                const isSelected = recipientFilter === r.id
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRecipientFilter(r.id as any)
                      setPage(0)
                    }}
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer select-none',
                      isSelected
                        ? 'bg-primary-solid text-on-primary font-bold shadow-2xs'
                        : 'text-text-muted hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    {r.label}
                  </button>
                )
              })}
            </div>

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-text-muted hover:border-danger hover:bg-danger-soft hover:text-danger transition cursor-pointer shrink-0"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Row 2: Time Filter Tabs & Counter */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Time Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="flex items-center gap-1.5 pr-1.5 text-xs font-bold text-text-subtle shrink-0">
                <Calendar size={13} className="text-gold-500" /> Mốc thời gian:
              </span>

              {TIME_TABS.map((t) => {
                const isSelected = timeFilter === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setTimeFilter(t.value)
                      setPage(0)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none',
                      isSelected
                        ? 'bg-text text-text-inverse border-text shadow-xs'
                        : 'bg-surface text-text-muted border-border hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    <span>{t.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Counter */}
            <div className="text-xs font-semibold text-text-subtle shrink-0">
              Hiển thị <strong className="text-text font-bold">{notifications.length}</strong> / <strong>{totalElements}</strong> thông báo
            </div>
          </div>
        </div>

        {/* --- Table: Danh sách thông báo (Bố cục gọn gàng, 100% không tràn màn hình) --- */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-xl bg-primary-soft/40" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-primary-soft/40" />
                  <Skeleton className="h-3 w-1/2 bg-primary-soft/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={<Megaphone size={28} className="text-danger" />}
              title="Lỗi tải danh sách thông báo"
              description="Đã có lỗi hệ thống xảy ra trong quá trình truy vấn dữ liệu."
            />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Megaphone size={28} className="text-text-subtle" />}
              title="Không có thông báo nào"
              description="Hiện không có thông báo hệ thống nào phù hợp với bộ lọc đã chọn."
            />
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-subtle bg-surface-2/60">
                  <th className="px-3.5 py-3 font-bold w-[42%]">Tiêu đề & Nội dung</th>
                  <th className="px-3 py-3 font-bold w-[18%]">Đối tượng nhận</th>
                  <th className="px-3 py-3 font-bold w-[26%]">Tiến trình & Trạng thái</th>
                  <th className="px-3 py-3 pr-4 font-bold text-right w-[14%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notifications.map((item: SystemNotificationDto) => {
                  const statusTone = STATUS_CONFIG[item.status]?.tone || 'neutral'
                  const statusLabel = STATUS_CONFIG[item.status]?.label || item.status

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setDetailItem(item)}
                      className="cursor-pointer transition-colors hover:bg-surface-2/60 group"
                    >
                      {/* Cột 1: Tiêu đề & Nội dung phát sóng */}
                      <td className="px-3.5 py-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-solid border border-primary-soft-border group-hover:scale-105 transition-transform shadow-2xs mt-0.5">
                            <Megaphone size={14} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider shrink-0">
                                #{item.id}
                              </span>
                              <h3 className="font-extrabold text-xs text-text truncate group-hover:text-primary-solid transition">
                                {item.title}
                              </h3>
                            </div>
                            <div className="rounded-lg border border-border/70 bg-surface-2/40 p-2 text-[11px] text-text leading-relaxed">
                              <p className="line-clamp-2">
                                {item.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Đối tượng nhận */}
                      <td className="px-3 py-3 align-top">
                        {item.recipientType === 'ALL_USERS' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20 shadow-2xs">
                              <Globe size={11} /> Tất cả
                            </span>
                            <p className="text-[10px] text-text-subtle">Tất cả người dùng</p>
                          </div>
                        ) : item.recipientType === 'USER_ROLE' ? (
                          <div className="space-y-0.5">
                            {item.recipientRole === 'STUDENT' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-xs font-bold text-sky-600 dark:text-sky-400 border border-sky-500/20 shadow-2xs">
                                <GraduationCap size={11} /> Sinh viên
                              </span>
                            ) : item.recipientRole === 'ALUMNI' ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                                <Briefcase size={11} /> Cựu sinh viên
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-2xs">
                                <Users size={11} /> Quản trị viên
                              </span>
                            )}
                            <p className="text-[10px] text-text-subtle">Nhóm vai trò</p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Avatar
                              src={item.recipientUser?.avatarUrl}
                              name={item.recipientUser?.fullName || 'User'}
                              size={28}
                              className="shrink-0 ring-1 ring-border mt-0.5"
                            />
                            <div className="min-w-0">
                              <p className="font-extrabold text-xs text-text truncate max-w-[120px]">
                                {item.recipientUser?.fullName || 'Người dùng'}
                              </p>
                              <p className="text-[10px] text-text-subtle truncate max-w-[120px]" title={item.recipientUser?.email}>
                                {item.recipientUser?.email}
                              </p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Cột 3: Tiến trình & Trạng thái */}
                      <td className="px-3 py-3 align-top">
                        <div className="space-y-1">
                          {/* Status Badge */}
                          <div>
                            <Badge tone={statusTone} className="text-[10px] font-bold px-2 py-0.5">
                              {statusLabel}
                            </Badge>
                          </div>

                          {/* Time detail rows */}
                          <div className="space-y-0.5 text-[11px] text-text-subtle">
                            {item.status === 'SCHEDULED' ? (
                              <div className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                                <Clock size={11} className="shrink-0" />
                                <span className="truncate">Hẹn: {formatDateTime(item.scheduledAt)}</span>
                              </div>
                            ) : (
                              <div className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={11} className="shrink-0" />
                                <span className="truncate">Gửi: {formatDateTime(item.sentAt || item.createdAt)}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 text-text-subtle">
                              <Hourglass size={11} className="shrink-0" />
                              <span className="truncate">
                                {item.durationType === 'FOREVER' || !item.expiresAt ? (
                                  'Hiệu lực: Vĩnh viễn'
                                ) : (
                                  `Hết hạn: ${formatDateTime(item.expiresAt)}`
                                )}
                              </span>
                            </div>

                            {item.archivedAt && (
                              <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                <Archive size={11} className="shrink-0" />
                                <span className="truncate">Lưu trữ: {formatDateTime(item.archivedAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="px-3 py-3 pr-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View detail button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDetailItem(item)
                            }}
                            className="h-7 px-2 text-xs font-bold bg-surface-2 text-text hover:bg-surface-3 border border-border shadow-2xs"
                            title="Xem chi tiết thông báo"
                          >
                            <Eye size={12} />
                            <span>Xem</span>
                          </Button>

                          {/* Cancel schedule button */}
                          {item.status === 'SCHEDULED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setCancelTargetId(item.id)
                              }}
                              className="h-7 w-7 p-0 flex items-center justify-center text-xs font-bold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 shadow-2xs"
                              title="Hủy lịch phát sóng"
                            >
                              <Trash2 size={12} />
                            </Button>
                          )}

                          {/* Archive button */}
                          {(item.status === 'SENT' || item.status === 'ACTIVE' || item.status === 'EXPIRED') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setArchiveTargetId(item.id)
                              }}
                              className="h-7 w-7 p-0 flex items-center justify-center text-xs font-bold border border-border bg-surface-2 text-text-muted hover:bg-surface-3 shadow-2xs"
                              title="Lưu trữ thông báo"
                            >
                              <Archive size={12} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Footer: Pagination */}
        <div className="border-t border-border p-4 bg-surface flex items-center justify-between">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Modal Tạo Thông Báo */}
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          refetch()
        }}
      />

      {/* Modal Xem Chi Tiết Thông Báo */}
      {detailItem && (
        <DialogFrame
          onClose={() => setDetailItem(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-2xl"
          className="z-10 overflow-hidden border border-border shadow-2xl flex flex-col pop bg-surface"
        >
          {/* Header Modal */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-surface shrink-0">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary-solid border border-primary-soft-border shadow-2xs">
                <Megaphone size={18} />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-text tracking-tight leading-tight">
                  Chi tiết thông báo hệ thống
                </h3>
                <p className="text-xs text-text-subtle font-medium mt-0.5">
                  Mã #{detailItem.id} · Tạo lúc {formatDateTime(detailItem.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDetailItem(null)}
              className="grid h-8 w-8 place-items-center rounded-xl text-text-subtle hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nội dung chi tiết */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(85vh-130px)]">
            {/* Tiêu đề & Trạng thái phát hành */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface-2 border border-border">
              <div className="space-y-1 min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle block">
                  Tiêu đề thông báo
                </span>
                <h4 className="text-sm font-black text-text leading-snug">
                  {detailItem.title}
                </h4>
              </div>
              <Badge
                tone={STATUS_CONFIG[detailItem.status]?.tone || 'neutral'}
                className="px-3 py-1 text-xs font-bold shrink-0"
              >
                {STATUS_CONFIG[detailItem.status]?.label || detailItem.status}
              </Badge>
            </div>

            {/* Nội dung thông báo */}
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle block">
                Nội dung phát sóng
              </span>
              <div className="p-3.5 rounded-xl bg-surface-2 border border-border text-xs font-medium text-text leading-relaxed whitespace-pre-wrap">
                {detailItem.content}
              </div>
            </div>

            {/* Thông tin đối tượng nhận & Thời hạn hiệu lực */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Đối tượng nhận */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                  <Users size={13} className="text-primary-solid" /> Đối tượng nhận thông báo
                </span>
                {detailItem.recipientType === 'ALL_USERS' ? (
                  <div>
                    <Badge tone="brand" className="text-xs font-bold">
                      Tất cả người dùng
                    </Badge>
                    <p className="text-xs text-text-subtle mt-1">Toàn bộ thành viên có tài khoản ACTIVE</p>
                  </div>
                ) : detailItem.recipientType === 'USER_ROLE' ? (
                  <div>
                    <Badge
                      tone={
                        detailItem.recipientRole === 'STUDENT'
                          ? 'brand'
                          : detailItem.recipientRole === 'ALUMNI'
                            ? 'gold'
                            : 'neutral'
                      }
                      className="text-xs font-bold"
                    >
                      Nhóm: {
                        detailItem.recipientRole === 'STUDENT'
                          ? 'Sinh viên'
                          : detailItem.recipientRole === 'ALUMNI'
                            ? 'Cựu sinh viên'
                            : 'Quản trị viên'
                      }
                    </Badge>
                    <p className="text-xs text-text-subtle mt-1">
                      Gửi tới tất cả {
                        detailItem.recipientRole === 'STUDENT'
                          ? 'sinh viên'
                          : detailItem.recipientRole === 'ALUMNI'
                            ? 'cựu sinh viên'
                            : 'quản trị viên'
                      } trong hệ thống
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-0.5">
                    <Avatar
                      src={detailItem.recipientUser?.avatarUrl}
                      name={detailItem.recipientUser?.fullName || 'User'}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-text truncate">
                        {detailItem.recipientUser?.fullName || 'Người dùng chỉ định'}
                      </p>
                      <p className="text-xs text-text-subtle truncate">
                        {detailItem.recipientUser?.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Thời hạn hiệu lực */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                  <Hourglass size={13} className="text-gold-500" /> Thời hạn hiệu lực
                </span>
                <div>
                  <span className="text-xs font-bold text-text block">
                    {DURATION_LABELS[detailItem.durationType] || detailItem.durationType}
                  </span>
                  <p className="text-[11px] text-text-subtle mt-1">
                    {detailItem.expiresAt
                      ? `Hết hiệu lực: ${formatDateTime(detailItem.expiresAt)}`
                      : 'Thông báo duy trì vĩnh viễn không giới hạn thời gian'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mốc thời gian & Quản trị viên phát hành */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Mốc thời gian */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary-solid" /> Tiến trình thời gian
                </span>
                <div className="pt-1 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-text-subtle">Khởi tạo:</span>
                    <span className="font-semibold text-text">{formatDateTime(detailItem.createdAt)}</span>
                  </div>
                  {detailItem.scheduledAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Hẹn giờ gửi:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{formatDateTime(detailItem.scheduledAt)}</span>
                    </div>
                  )}
                  {detailItem.sentAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Thời điểm gửi:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-300">{formatDateTime(detailItem.sentAt)}</span>
                    </div>
                  )}
                  {detailItem.expiresAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-text-subtle">Hết hiệu lực:</span>
                      <span className="font-semibold text-text">{formatDateTime(detailItem.expiresAt)}</span>
                    </div>
                  )}
                  {detailItem.archivedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">Thời điểm lưu trữ:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">{formatDateTime(detailItem.archivedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quản trị viên phát hành */}
              <div className="p-4 rounded-2xl bg-surface-2 border border-border space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                  <User size={13} className="text-primary-solid" /> Quản trị viên phát hành
                </span>
                <div className="flex items-center gap-3 pt-0.5">
                  <Avatar
                    src={detailItem.createdBy?.avatarUrl}
                    name={detailItem.createdBy?.fullName || 'Quản trị viên'}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-text truncate">
                      {detailItem.createdBy?.fullName || 'Quản trị viên'}
                    </p>
                    <p className="text-xs text-text-subtle truncate">
                      {detailItem.createdBy?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Modal Actions */}
          <div className="p-4 border-t border-border bg-surface flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {detailItem.status === 'SCHEDULED' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    setCancelTargetId(detailItem.id)
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                  leftIcon={<Trash2 size={14} />}
                >
                  Hủy lịch hẹn gửi
                </Button>
              )}

              {(detailItem.status === 'SENT' || detailItem.status === 'ACTIVE' || detailItem.status === 'EXPIRED') && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setArchiveTargetId(detailItem.id)
                  }}
                  className="font-bold bg-surface-2 hover:bg-surface-3 text-text"
                  leftIcon={<Archive size={14} />}
                >
                  Lưu trữ thông báo
                </Button>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDetailItem(null)}>
              Đóng
            </Button>
          </div>
        </DialogFrame>
      )}

      {/* Confirm Hủy Lịch Gửi */}
      {cancelTargetId && (
        <DialogFrame
          onClose={() => setCancelTargetId(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-sm"
          className="z-10 p-5 border border-border shadow-2xl pop bg-surface rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-2 text-rose-600">
            <AlertTriangle size={20} />
            <h3 className="text-sm font-extrabold text-text">Xác nhận hủy thông báo hẹn giờ?</h3>
          </div>
          <p className="text-xs text-text-subtle mt-2 leading-relaxed">
            Thông báo này sẽ không được phát hành tự động nữa. Trạng thái sẽ chuyển sang ĐÃ HỦY LỊCH.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setCancelTargetId(null)}>
              Quay lại
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              disabled={cancelMutation.isPending}
              onClick={() => handleCancelScheduled(cancelTargetId)}
            >
              {cancelMutation.isPending ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </Button>
          </div>
        </DialogFrame>
      )}

      {/* Confirm Lưu Trữ Thông Báo (Archive) */}
      {archiveTargetId && (
        <DialogFrame
          onClose={() => setArchiveTargetId(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-sm"
          className="z-10 p-5 border border-border shadow-2xl pop bg-surface rounded-2xl"
        >
          <div className="flex items-center gap-2.5 mb-2 text-purple-600">
            <Archive size={20} />
            <h3 className="text-sm font-extrabold text-text">Lưu trữ thông báo?</h3>
          </div>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            Thông báo sẽ được chuyển vào <strong>Kho lưu trữ</strong> và ngừng hiển thị công khai trên bảng tin.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setArchiveTargetId(null)}>
              Quay lại
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="font-bold"
              disabled={archiveMutation.isPending}
              onClick={() => handleArchive(archiveTargetId)}
            >
              {archiveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận lưu trữ'}
            </Button>
          </div>
        </DialogFrame>
      )}
    </div>
  )
}
