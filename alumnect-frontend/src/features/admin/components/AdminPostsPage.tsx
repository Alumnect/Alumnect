import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  User,
  Newspaper,
  Clock,
  ThumbsUp,
  MessageSquare,
  Trophy,
  Briefcase,
  Calendar,
  Layers,
  Eye,
  EyeOff,
  ChevronRight,
  Filter,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  X,
  Image as ImageIcon,
  AlertTriangle,
  Globe,
  Lock,
} from 'lucide-react'
import { Badge, Avatar, EmptyState, Skeleton, toast, Pagination, Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAdminPosts, useTogglePostHidden } from '../hooks/useAdmin'
import type { AdminPostDto } from '../api/adminApi'

export type CategoryKey = 'ALL' | 'GENERAL' | 'ACHIEVEMENT' | 'RECRUITMENT' | 'EVENT'

export interface PostCategoryConfig {
  value: CategoryKey
  label: string
  shortLabel: string
  icon: React.ElementType
  colorHex: string
  pillActiveBg: string
  pillInactiveBg: string
  dropdownHoverBg: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  rowBorderLeft: string
  bgHoverRow: string
}

export const CATEGORY_MAP: Record<CategoryKey, PostCategoryConfig> = {
  ALL: {
    value: 'ALL',
    label: 'Tất cả loại',
    shortLabel: 'Tất cả loại',
    icon: Layers,
    colorHex: '#F27024',
    pillActiveBg: 'bg-primary-solid text-on-primary border-primary shadow-xs font-bold',
    pillInactiveBg: 'bg-surface text-text-muted border-border hover:bg-surface-2 hover:text-text',
    dropdownHoverBg: 'hover:bg-surface-2 hover:text-text',
    badgeBg: 'bg-surface-2',
    badgeText: 'text-text',
    badgeBorder: 'border-border',
    rowBorderLeft: 'border-l-primary-500',
    bgHoverRow: 'hover:bg-primary-soft/10',
  },
  GENERAL: {
    value: 'GENERAL',
    label: 'Bình thường',
    shortLabel: 'Bình thường',
    icon: Newspaper,
    colorHex: '#64748B',
    pillActiveBg: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-700 shadow-xs font-bold',
    pillInactiveBg: 'bg-surface text-text-muted border-border hover:bg-surface-2 hover:text-text',
    dropdownHoverBg: 'hover:bg-surface-2 hover:text-text',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    rowBorderLeft: 'border-l-slate-400',
    bgHoverRow: 'hover:bg-slate-500/5',
  },
  ACHIEVEMENT: {
    value: 'ACHIEVEMENT',
    label: 'Thành tựu',
    shortLabel: 'Thành tựu',
    icon: Trophy,
    colorHex: '#D97706',
    pillActiveBg: 'bg-amber-600 text-white border-amber-600 shadow-xs font-bold',
    pillInactiveBg: 'bg-surface text-text-muted border-border hover:bg-amber-500/10 hover:text-amber-600 hover:border-amber-300',
    dropdownHoverBg: 'hover:bg-amber-500/10 hover:text-amber-600',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-900/60',
    rowBorderLeft: 'border-l-amber-500',
    bgHoverRow: 'hover:bg-amber-500/5',
  },
  RECRUITMENT: {
    value: 'RECRUITMENT',
    label: 'Tuyển dụng',
    shortLabel: 'Tuyển dụng',
    icon: Briefcase,
    colorHex: '#0284C7',
    pillActiveBg: 'bg-sky-600 text-white border-sky-600 shadow-xs font-bold',
    pillInactiveBg: 'bg-surface text-text-muted border-border hover:bg-sky-500/10 hover:text-sky-600 hover:border-sky-300',
    dropdownHoverBg: 'hover:bg-sky-500/10 hover:text-sky-600',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-900/60',
    rowBorderLeft: 'border-l-sky-500',
    bgHoverRow: 'hover:bg-sky-500/5',
  },
  EVENT: {
    value: 'EVENT',
    label: 'Sự kiện',
    shortLabel: 'Sự kiện',
    icon: Calendar,
    colorHex: '#7C3AED',
    pillActiveBg: 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold',
    pillInactiveBg: 'bg-surface text-text-muted border-border hover:bg-purple-500/10 hover:text-purple-600 hover:border-purple-300',
    dropdownHoverBg: 'hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-900/60',
    rowBorderLeft: 'border-l-purple-500',
    bgHoverRow: 'hover:bg-purple-500/5',
  },
}

export const getCategoryConfig = (rawType?: string): PostCategoryConfig => {
  if (!rawType) return CATEGORY_MAP.GENERAL
  const upper = rawType.toUpperCase()
  if (upper === 'NORMAL') return CATEGORY_MAP.GENERAL
  return CATEGORY_MAP[upper as CategoryKey] || CATEGORY_MAP.GENERAL
}

interface CustomCategoryDropdownProps {
  value: CategoryKey
  onChange: (val: CategoryKey) => void
}

function CustomCategoryDropdown({ value, onChange }: CustomCategoryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedCategory = CATEGORY_MAP[value] || CATEGORY_MAP.ALL
  const SelectedIcon = selectedCategory.icon

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 items-center justify-between gap-2.5 rounded-xl border bg-surface px-3.5 text-xs font-bold text-text shadow-2xs transition duration-200 hover:border-primary-solid focus:outline-none cursor-pointer min-w-[170px]',
          isOpen ? 'ring-2 ring-primary-500/20 border-primary-solid bg-surface-2' : 'border-border hover:bg-surface-2'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-white shadow-2xs shrink-0"
            style={{ backgroundColor: selectedCategory.colorHex }}
          >
            <SelectedIcon size={12} />
          </span>
          <span className="truncate">{selectedCategory.label}</span>
        </div>
        <ChevronRight
          size={14}
          className={cn('text-text-subtle transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-primary-solid' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-2xl border border-border bg-surface backdrop-blur-xl p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-subtle border-b border-border mb-1 flex items-center justify-between">
            <span>Loại bài viết</span>
            <Sparkles size={11} className="text-primary-solid" />
          </div>
          <div className="space-y-0.5">
            {(Object.keys(CATEGORY_MAP) as CategoryKey[]).map((catKey) => {
              const cfg = CATEGORY_MAP[catKey]
              const Icon = cfg.icon
              const isSelected = value === catKey

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => {
                    onChange(catKey)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-primary-solid text-on-primary shadow-xs font-bold'
                      : cn('text-text', cfg.dropdownHoverBg)
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-5.5 w-5.5 items-center justify-center rounded-lg text-white shadow-2xs shrink-0 transition-transform',
                        isSelected ? 'scale-105 bg-white/20 text-white' : 'opacity-90'
                      )}
                      style={{ backgroundColor: isSelected ? undefined : cfg.colorHex }}
                    >
                      <Icon size={12} />
                    </span>
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="text-white shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Trang quản lý bài viết cộng đồng dành cho Quản trị viên (Admin).
 * Redesigned theo phong cách shadcn-admin / square-ui với 4 Thẻ KPI và bảng compound 0 cuộn ngang.
 */
export function AdminPostsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED'>('ALL')
  const [type, setType] = useState<CategoryKey>('ALL')
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [page, setPage] = useState(0)

  // Query dữ liệu bài viết
  const { data, isLoading, error } = useAdminPosts({
    query: query || undefined,
    author: author || undefined,
    status: status === 'ALL' ? undefined : status,
    type: type === 'ALL' ? undefined : type,
    page,
    size: 10,
  })

  const toggleMutation = useTogglePostHidden()
  const [confirmPost, setConfirmPost] = useState<{ id: number; hidden: boolean } | null>(null)

  const posts = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Thống kê nhanh từ danh sách bài viết hiện tại
  const stats = useMemo(() => {
    let visibleCount = 0
    let hiddenCount = 0
    let totalInteractions = 0

    posts.forEach((p) => {
      if (p.hidden || p.deleted) {
        hiddenCount++
      } else {
        visibleCount++
      }
      totalInteractions += (p.likeCount || 0) + (p.commentCount || 0)
    })

    return { visibleCount, hiddenCount, totalInteractions }
  }, [posts])

  const handleToggleHidden = (e: React.MouseEvent, postId: number, isCurrentlyHidden: boolean) => {
    e.stopPropagation()
    setConfirmPost({ id: postId, hidden: isCurrentlyHidden })
  }

  const handleConfirmToggle = async () => {
    if (!confirmPost) return
    try {
      await toggleMutation.mutateAsync({ id: confirmPost.id, hidden: !confirmPost.hidden })
      toast.success(confirmPost.hidden ? 'Đã hiển thị lại bài viết!' : 'Đã ẩn bài viết vi phạm thành công!')
      setConfirmPost(null)
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi cập nhật trạng thái bài viết.')
    }
  }

  const hasActiveFilters =
    status !== 'ALL' ||
    type !== 'ALL' ||
    Boolean(query) ||
    Boolean(author)

  const resetFilters = () => {
    setStatus('ALL')
    setType('ALL')
    setQuery('')
    setAuthor('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-solid">
            <Newspaper size={15} /> Kiểm duyệt nội dung mạng xã hội
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Quản lý bài viết cộng đồng
          </h1>
          <p className="mt-0.5 text-xs text-text-subtle">
            Duyệt, phân loại theo mục đích và kiểm duyệt nội dung bài viết trong toàn bộ hệ thống mạng lưới.
          </p>
        </div>
      </div>

      {/* 2. Top 4 Executive KPI Cards (Shadcn-Admin style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng bài viết */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Tổng số bài viết</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
              <Newspaper size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{totalElements}</span>
            <span className="text-xs text-text-subtle font-medium">bài viết</span>
          </div>
          <p className="mt-1 text-[11px] text-text-subtle font-medium">
            Trang {page + 1} / {Math.max(1, totalPages)}
          </p>
        </div>

        {/* Card 2: Đang hiển thị */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đang hiển thị</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <Eye size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{stats.visibleCount}</span>
            <span className="text-xs text-text-subtle font-medium">trên trang này</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={11} /> Công khai & nội bộ an toàn
          </p>
        </div>

        {/* Card 3: Bài viết đã ẩn / Vi phạm */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đã ẩn / Vi phạm</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
              <EyeOff size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{stats.hiddenCount}</span>
            <span className="text-xs text-text-subtle font-medium">bài trên trang</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle size={11} /> Đã khóa hiển thị
          </p>
        </div>

        {/* Card 4: Tương tác bài viết */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Tương tác trang</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <ThumbsUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{stats.totalInteractions}</span>
            <span className="text-xs text-text-subtle font-medium">lượt thích & cmt</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Sparkles size={11} /> Độ thảo luận sôi nổi
          </p>
        </div>
      </div>

      {/* 3. Single Unified Container Card: Tích hợp Header, Filters, Chips, Table & Pagination */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header: Tabs trạng thái bài viết */}
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between bg-surface">
          <div>
            <h2 className="text-base font-extrabold text-text flex items-center gap-2">
              <span>Danh sách bài viết</span>
              <span className="rounded-full bg-primary-soft text-primary-solid px-2 py-0.5 text-xs font-bold">
                {totalElements} bài
              </span>
            </h2>
            <p className="text-xs text-text-subtle mt-0.5">
              Tra cứu nhanh, phân loại nội dung và thực hiện các biện pháp kiểm duyệt bài đăng vi phạm.
            </p>
          </div>

          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-2xs self-start sm:self-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'VISIBLE', label: 'Đang hiển thị' },
              { key: 'HIDDEN', label: 'Đã ẩn' },
              { key: 'DELETED', label: 'Đã xóa' },
            ].map((tab) => {
              const isActive = status === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatus(tab.key as any)
                    setPage(0)
                  }}
                  className={cn(
                    'relative flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer select-none',
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

        {/* Toolbar: Tìm kiếm, Bộ lọc & Phân loại bài viết */}
        <div className="border-b border-border bg-surface-2/40 p-4 space-y-3.5">
          {/* Row 1: Search Inputs & Dropdowns */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Content */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm kiếm nội dung bài viết..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm kiếm nội dung bài viết..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Author */}
            <div className="relative w-full sm:w-56">
              <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm tác giả, email..."
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value)
                  setPage(0)
                }}
                placeholder="Tác giả, email..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {author && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthor('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <CustomCategoryDropdown
              value={type}
              onChange={(newType) => {
                setType(newType)
                setPage(0)
              }}
            />

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

          {/* Row 2: Category Quick Chips & Counter */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Quick Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="flex items-center gap-1.5 pr-1.5 text-xs font-bold text-text-subtle shrink-0">
                <Filter size={13} className="text-primary-solid" /> Phân loại:
              </span>

              {(Object.keys(CATEGORY_MAP) as CategoryKey[]).map((catKey) => {
                const cfg = CATEGORY_MAP[catKey]
                const Icon = cfg.icon
                const isSelected = type === catKey

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => {
                      setType(catKey)
                      setPage(0)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none',
                      isSelected ? cfg.pillActiveBg : cfg.pillInactiveBg
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4.5 w-4.5 items-center justify-center rounded-md shrink-0 transition',
                        isSelected ? 'bg-white/20 text-white' : 'text-white'
                      )}
                      style={{ backgroundColor: isSelected ? undefined : cfg.colorHex }}
                    >
                      <Icon size={11} />
                    </span>
                    <span>{cfg.shortLabel}</span>
                  </button>
                )
              })}
            </div>

            {/* Counter */}
            <div className="text-xs font-semibold text-text-subtle shrink-0">
              Hiển thị <strong className="text-text font-bold">{posts.length}</strong> / <strong>{totalElements}</strong> bài viết
            </div>
          </div>
        </div>

        {/* --- Table: Danh sách bài viết (4 Cột Compound, ZERO CUỘN NGANG) --- */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-soft/40" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-primary-soft/40" />
                  <Skeleton className="h-3 w-1/2 bg-primary-soft/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={<Newspaper size={28} className="text-danger" />}
              title="Lỗi tải danh sách bài viết"
              description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
            />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Newspaper size={28} className="text-text-subtle" />}
              title="Không tìm thấy bài viết"
              description={
                type !== 'ALL'
                  ? `Không có bài viết nào thuộc loại "${CATEGORY_MAP[type]?.label}".`
                  : 'Hiện tại không có bài viết nào phù hợp với bộ lọc.'
              }
            />
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-subtle bg-surface-2/60">
                  <th className="px-4 py-3 sm:px-5 font-bold w-[26%]">Tác giả & Thời gian</th>
                  <th className="px-4 py-3 sm:px-5 font-bold">Bài viết & Phân loại</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-center w-[160px]">Tương tác & Trạng thái</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-right w-[130px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((p: AdminPostDto) => {
                  const catCfg = getCategoryConfig(p.type)
                  const CatIcon = catCfg.icon

                  return (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/admin/posts/${p.id}`)}
                      className={cn(
                        'cursor-pointer transition-colors border-l-4 group',
                        catCfg.rowBorderLeft,
                        catCfg.bgHoverRow
                      )}
                    >
                      {/* Cột 1: Tác giả & Thời gian đăng */}
                      <td className="px-4 py-3.5 sm:px-5 align-top">
                        <div className="flex items-start gap-3">
                          <Avatar
                            src={p.authorAvatarUrl}
                            name={p.authorName || 'U'}
                            size={38}
                            className="shrink-0 ring-1 ring-border group-hover:ring-primary-solid/40 transition"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-xs text-text truncate group-hover:text-primary-solid transition">
                              {p.authorName || 'Ẩn danh'}
                            </p>
                            <p className="text-[11px] text-text-subtle truncate max-w-[170px]" title={p.authorEmail}>
                              {p.authorEmail}
                            </p>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-text-subtle">
                              <Clock size={11} className="shrink-0 text-text-subtle" />
                              <span>{new Date(p.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Nội dung & Phân loại (Compound Box) */}
                      <td className="px-4 py-3.5 sm:px-5 align-top">
                        <div className="space-y-1.5">
                          {/* Badges Bar: Category + Visibility + Has Image Tag */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold border shadow-2xs',
                                catCfg.badgeBg,
                                catCfg.badgeText,
                                catCfg.badgeBorder
                              )}
                            >
                              <CatIcon size={12} style={{ color: catCfg.colorHex }} />
                              <span>{catCfg.shortLabel}</span>
                            </span>

                            <span
                              className={cn(
                                'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border',
                                p.visibility === 'PUBLIC'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                                  : 'bg-surface-2 text-text-muted border-border'
                              )}
                            >
                              {p.visibility === 'PUBLIC' ? (
                                <>
                                  <Globe size={10} /> Công khai
                                </>
                              ) : (
                                <>
                                  <Lock size={10} /> Thành viên
                                </>
                              )}
                            </span>

                            {((p.images && p.images.length > 0) || p.imageUrl) && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-text-subtle border border-border">
                                <ImageIcon size={10} />
                                <span>{p.images?.length || 1} ảnh</span>
                              </span>
                            )}
                          </div>

                          {/* Event / Job / Achievement Highlight Header */}
                          {p.type === 'EVENT' && p.event?.title && (
                            <div className="rounded-lg bg-purple-500/10 px-2 py-1 border border-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1.5">
                              <Calendar size={12} className="text-purple-600 dark:text-purple-400 shrink-0" />
                              <span className="truncate">Sự kiện: {p.event.title}</span>
                            </div>
                          )}

                          {p.type === 'RECRUITMENT' && p.job?.title && (
                            <div className="rounded-lg bg-sky-500/10 px-2 py-1 border border-sky-500/20 text-sky-700 dark:text-sky-300 font-bold text-[11px] flex items-center gap-1.5">
                              <Briefcase size={12} className="text-sky-600 dark:text-sky-400 shrink-0" />
                              <span className="truncate">Vị trí: {p.job.title} {p.job.company ? `(${p.job.company})` : ''}</span>
                            </div>
                          )}

                          {p.type === 'ACHIEVEMENT' && (
                            <div className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 px-2 py-0.5 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                              <Trophy size={11} className="text-amber-600 dark:text-amber-400" />
                              <span>Vinh danh thành tựu cựu sinh viên</span>
                            </div>
                          )}

                          {/* Trích đoạn nội dung trong hộp bo cong tinh tế */}
                          <div className="rounded-xl border border-border/70 bg-surface-2/40 p-2.5 text-xs text-text leading-relaxed">
                            <p className="line-clamp-2">
                              {p.content || <span className="italic text-text-subtle">(Không có nội dung mô tả)</span>}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Tương tác & Trạng thái */}
                      <td className="px-4 py-3.5 sm:px-5 align-top text-center whitespace-nowrap">
                        <div className="flex flex-col items-center justify-center gap-2">
                          {/* Interactions pills */}
                          <div className="inline-flex items-center gap-2 rounded-lg bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-text-muted border border-border">
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Lượt thích">
                              <ThumbsUp size={11} /> {p.likeCount}
                            </span>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1 text-text-subtle" title="Bình luận">
                              <MessageSquare size={11} /> {p.commentCount}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {p.deleted ? (
                            <Badge tone="danger" className="text-[10px] font-bold px-2 py-0.5">
                              Đã xóa
                            </Badge>
                          ) : p.hidden ? (
                            <Badge tone="danger" className="text-[10px] font-bold px-2 py-0.5">
                              Đã ẩn (Vi phạm)
                            </Badge>
                          ) : (
                            <Badge tone="success" className="text-[10px] font-bold px-2 py-0.5">
                              Hiển thị
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="px-4 py-3.5 sm:px-5 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!p.deleted && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => handleToggleHidden(e, p.id, p.hidden)}
                              disabled={toggleMutation.isPending}
                              className={cn(
                                'h-8 px-2.5 text-xs font-bold border transition-colors shadow-2xs',
                                p.hidden
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
                              )}
                              title={p.hidden ? 'Mở hiển thị lại bài viết' : 'Ẩn bài viết vi phạm'}
                            >
                              {p.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                              <span>{p.hidden ? 'Mở' : 'Ẩn'}</span>
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/admin/posts/${p.id}`)
                            }}
                            className="h-8 px-2.5 text-xs font-bold bg-surface-2 text-text hover:bg-surface-3 border border-border shadow-2xs"
                            title="Xem chi tiết bài viết"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight size={12} />
                          </Button>
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

      {/* Modal xác nhận ẩn / hiện bài viết */}
      <Modal
        isOpen={!!confirmPost}
        onClose={() => setConfirmPost(null)}
        title={confirmPost?.hidden ? 'Mở hiển thị bài viết' : 'Xác nhận ẩn bài viết'}
        icon={
          confirmPost?.hidden ? (
            <Eye size={18} className="text-emerald-500" />
          ) : (
            <EyeOff size={18} className="text-rose-500" />
          )
        }
        footer={
          <div className="flex justify-end gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmPost(null)}
              disabled={toggleMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmToggle}
              disabled={toggleMutation.isPending}
              className={cn(
                'font-bold text-white',
                confirmPost?.hidden
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              )}
            >
              {toggleMutation.isPending
                ? 'Đang xử lý...'
                : confirmPost?.hidden
                ? 'Mở hiển thị'
                : 'Ẩn bài viết'}
            </Button>
          </div>
        }
      >
        <div className="space-y-2 py-1">
          <p className="text-xs text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn {confirmPost?.hidden ? 'mở hiển thị lại' : 'ẩn'} bài viết{' '}
            <strong className="text-text font-bold">#{confirmPost?.id}</strong> không?
          </p>
          {!confirmPost?.hidden && (
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              Lưu ý: Bài viết sau khi bị ẩn sẽ không còn hiển thị trên Bảng tin của sinh viên và cựu sinh viên.
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
