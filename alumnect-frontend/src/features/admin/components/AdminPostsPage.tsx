import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  User,
  Newspaper,
  Clock,
  ThumbsUp,
  MessageSquare,
  Repeat,
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
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminPosts, useTogglePostHidden } from '../hooks/useAdmin'

const STATUS_TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Đang hiển thị', value: 'VISIBLE' },
  { name: 'Đã ẩn', value: 'HIDDEN' },
  { name: 'Đã xóa', value: 'DELETED' },
]

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
    colorHex: '#4A1525',
    pillActiveBg: 'bg-plum-900 text-gold-300 border-plum-800 shadow-md shadow-plum-900/20 ring-2 ring-gold-400/40 font-bold',
    pillInactiveBg: 'bg-plum-900/[0.05] text-plum-800 border-plum-900/15 hover:bg-plum-900/10 hover:border-plum-900/25',
    dropdownHoverBg: 'hover:bg-plum-900/10 hover:text-plum-950',
    badgeBg: 'bg-plum-900/10',
    badgeText: 'text-plum-800',
    badgeBorder: 'border-plum-900/20',
    rowBorderLeft: 'border-l-plum-600',
    bgHoverRow: 'hover:bg-plum-900/[0.02]',
  },
  GENERAL: {
    value: 'GENERAL',
    label: 'Bình thường (General)',
    shortLabel: 'Bình thường',
    icon: Newspaper,
    colorHex: '#475569',
    pillActiveBg: 'bg-slate-700 text-white border-slate-600 shadow-md shadow-slate-700/25 ring-2 ring-slate-400 font-bold',
    pillInactiveBg: 'bg-slate-100 text-slate-700 border-slate-200/90 hover:bg-slate-200/70 hover:border-slate-300',
    dropdownHoverBg: 'hover:bg-slate-100 hover:text-slate-900',
    badgeBg: 'bg-slate-100 text-slate-800',
    badgeText: 'text-slate-800',
    badgeBorder: 'border-slate-300',
    rowBorderLeft: 'border-l-slate-400',
    bgHoverRow: 'hover:bg-slate-500/[0.03]',
  },
  ACHIEVEMENT: {
    value: 'ACHIEVEMENT',
    label: 'Thành tựu (Achievement)',
    shortLabel: 'Thành tựu',
    icon: Trophy,
    colorHex: '#D97706',
    pillActiveBg: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-plum-950 border-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-300 font-bold',
    pillInactiveBg: 'bg-amber-50 text-amber-900 border-amber-200/90 hover:bg-amber-100 hover:border-amber-300',
    dropdownHoverBg: 'hover:bg-amber-50 hover:text-amber-950',
    badgeBg: 'bg-amber-100 text-amber-900',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300/80',
    rowBorderLeft: 'border-l-amber-500',
    bgHoverRow: 'hover:bg-amber-500/[0.05]',
  },
  RECRUITMENT: {
    value: 'RECRUITMENT',
    label: 'Tuyển dụng (Recruitment)',
    shortLabel: 'Tuyển dụng',
    icon: Briefcase,
    colorHex: '#0284C7',
    pillActiveBg: 'bg-gradient-to-r from-sky-600 to-cyan-600 text-white border-sky-400 shadow-md shadow-sky-600/30 ring-2 ring-sky-300 font-bold',
    pillInactiveBg: 'bg-sky-50 text-sky-900 border-sky-200/90 hover:bg-sky-100 hover:border-sky-300',
    dropdownHoverBg: 'hover:bg-sky-50 hover:text-sky-950',
    badgeBg: 'bg-sky-100 text-sky-900',
    badgeText: 'text-sky-900',
    badgeBorder: 'border-sky-300/80',
    rowBorderLeft: 'border-l-sky-500',
    bgHoverRow: 'hover:bg-sky-500/[0.05]',
  },
  EVENT: {
    value: 'EVENT',
    label: 'Sự kiện (Event)',
    shortLabel: 'Sự kiện',
    icon: Calendar,
    colorHex: '#7C3AED',
    pillActiveBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 shadow-md shadow-purple-600/30 ring-2 ring-purple-300 font-bold',
    pillInactiveBg: 'bg-purple-50 text-purple-900 border-purple-200/90 hover:bg-purple-100 hover:border-purple-300',
    dropdownHoverBg: 'hover:bg-purple-50 hover:text-purple-950',
    badgeBg: 'bg-purple-100 text-purple-900',
    badgeText: 'text-purple-900',
    badgeBorder: 'border-purple-300/80',
    rowBorderLeft: 'border-l-purple-500',
    bgHoverRow: 'hover:bg-purple-500/[0.05]',
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
          'flex h-10 items-center justify-between gap-2.5 rounded-xl border bg-white px-3.5 text-xs font-bold text-plum-900 shadow-sm transition-all duration-200 hover:border-gold-400 focus:outline-none cursor-pointer min-w-[200px]',
          isOpen ? 'ring-2 ring-gold-400/40 border-gold-400 bg-plum-900/[0.02]' : 'border-plum-900/15 hover:bg-plum-900/[0.02]'
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
          className={cn('text-plum-400 transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-gold-500' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-2xl border border-plum-900/15 bg-white/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-plum-950/20 animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-plum-400 border-b border-plum-900/5 mb-1 flex items-center justify-between">
            <span>Lọc loại bài viết</span>
            <Sparkles size={11} className="text-gold-400" />
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
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-plum-900 text-gold-300 shadow-md font-bold'
                      : cn('text-plum-800', cfg.dropdownHoverBg)
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-2xs shrink-0 transition-transform',
                        isSelected ? 'scale-105' : 'opacity-90'
                      )}
                      style={{ backgroundColor: cfg.colorHex }}
                    >
                      <Icon size={13} />
                    </span>
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="text-gold-300 shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function AdminPostsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState<CategoryKey>('ALL')
  const [query, setQuery] = useState('')
  const [author, setAuthor] = useState('')
  const [page, setPage] = useState(0)

  // Hook lấy bài viết & ẩn/hiện bài viết
  const { data, isLoading, error } = useAdminPosts({
    query: query || undefined,
    author: author || undefined,
    status: status === 'ALL' ? undefined : status,
    type: type === 'ALL' ? undefined : type,
    page,
    size: 10,
  })

  const toggleMutation = useTogglePostHidden()

  const posts = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const handleToggleHidden = async (e: React.MouseEvent, postId: number, isCurrentlyHidden: boolean) => {
    e.stopPropagation()
    const actionText = isCurrentlyHidden ? 'hiển thị lại' : 'ẩn'
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} bài viết #${postId}?`)) {
      try {
        await toggleMutation.mutateAsync({ id: postId, hidden: !isCurrentlyHidden })
      } catch (err) {
        console.error('Lỗi thay đổi trạng thái:', err)
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Quản lý bài viết cộng đồng"
        subtitle="Duyệt, phân loại theo mục đích và kiểm duyệt nội dung bài viết trong toàn hệ thống."
      />

      {/* --- Bộ lọc theo Loại bài viết (Color-coded Category Bar) --- */}
      <Card hover={false} className="p-4 bg-white/80 backdrop-blur border border-plum-900/10 shadow-sm !overflow-visible relative z-20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-plum-900">
              <Filter size={14} className="text-gold-500" />
              <span>Phân loại bài viết</span>
            </div>
            {totalElements > 0 && (
              <span className="text-xs font-semibold text-plum-500">
                Hiển thị <strong className="text-plum-900">{posts.length}</strong> / <strong>{totalElements}</strong> bài viết
              </span>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {(Object.keys(CATEGORY_MAP) as CategoryKey[]).map((catKey) => {
              const cfg = CATEGORY_MAP[catKey]
              const Icon = cfg.icon
              const isSelected = type === catKey

              return (
                <button
                  key={catKey}
                  onClick={() => {
                    setType(catKey)
                    setPage(0)
                  }}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 border cursor-pointer',
                    isSelected ? cfg.pillActiveBg : cfg.pillInactiveBg
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md shrink-0 transition-all',
                      isSelected ? 'bg-white/20 text-current' : 'text-white'
                    )}
                    style={{ backgroundColor: isSelected ? undefined : cfg.colorHex }}
                  >
                    <Icon size={12} />
                  </span>
                  <span>{cfg.shortLabel}</span>
                  {isSelected && <CheckCircle2 size={13} className="ml-0.5 opacity-90 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* --- Controls: Tabs trạng thái & Thanh tìm kiếm --- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value)
                setPage(0)
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-bold transition-all',
                status === t.value
                  ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-950 shadow-sm'
                  : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>

        {/* Custom Category Dropdown selector matching system style */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <CustomCategoryDropdown
            value={type}
            onChange={(newType) => {
              setType(newType)
              setPage(0)
            }}
          />

          <div className="relative flex items-center sm:w-48">
            <Search size={15} className="pointer-events-none absolute left-3 text-plum-400" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm nội dung..."
              className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-9 pr-3 text-xs text-plum-900 placeholder:text-plum-400 focus:border-gold-400 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="relative flex items-center sm:w-48">
            <User size={15} className="pointer-events-none absolute left-3 text-plum-400" />
            <input
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm tác giả, email..."
              className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.03] pl-9 pr-3 text-xs text-plum-900 placeholder:text-plum-400 focus:border-gold-400 focus:bg-white focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* --- Bảng dữ liệu bài viết (Redesigned with Category Colors) --- */}
      <Reveal>
        {isLoading ? (
          <Card hover={false} className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            icon={<Newspaper size={28} className="text-red-500" />}
            title="Lỗi tải danh sách bài viết"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper size={28} className="text-plum-400" />}
            title="Không tìm thấy bài viết"
            description={
              type !== 'ALL'
                ? `Không có bài viết nào thuộc loại "${CATEGORY_MAP[type]?.label}".`
                : 'Hiện tại không có bài viết nào phù hợp với bộ lọc.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-hidden border border-plum-900/10 shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead>
                    <tr className="border-b border-plum-900/10 bg-plum-900/[0.03] text-left text-[11px] font-bold uppercase tracking-wider text-plum-500">
                      <th className="px-4 py-3.5">Loại bài viết</th>
                      <th className="px-4 py-3.5">Tác giả</th>
                      <th className="px-4 py-3.5">Nội dung & Thông tin</th>
                      <th className="px-4 py-3.5">Tương tác</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-plum-900/5">
                    {posts.map((p) => {
                      const catCfg = getCategoryConfig(p.type)
                      const IconComponent = catCfg.icon

                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/admin/posts/${p.id}`)}
                          className={cn(
                            'cursor-pointer transition-colors border-l-4',
                            catCfg.rowBorderLeft,
                            catCfg.bgHoverRow
                          )}
                        >
                          {/* 1. Category Column with Color-coded Badge */}
                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold border shadow-2xs',
                                  catCfg.badgeBg,
                                  catCfg.badgeText,
                                  catCfg.badgeBorder
                                )}
                              >
                                <IconComponent size={13} style={{ color: catCfg.colorHex }} />
                                <span>{catCfg.shortLabel}</span>
                              </span>

                              <Badge
                                tone={p.visibility === 'PUBLIC' ? 'success' : 'neutral'}
                                className="text-[10px] px-2 py-0.2"
                              >
                                {p.visibility === 'PUBLIC' ? 'Công khai' : 'Thành viên'}
                              </Badge>
                            </div>
                          </td>

                          {/* 2. Author Column */}
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <Avatar src={p.authorAvatarUrl} name={p.authorName || 'U'} size={36} />
                              <div className="min-w-0">
                                <p className="font-bold text-plum-950 truncate max-w-[140px]">{p.authorName || 'Ẩn danh'}</p>
                                <p className="text-[11px] text-plum-400 truncate max-w-[140px]">{p.authorEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* 3. Content & Special Details Column */}
                          <td className="px-4 py-4 align-top max-w-sm">
                            {/* Special headers for Event / Job / Achievement */}
                            {p.type === 'EVENT' && p.event?.title && (
                              <div className="mb-1 rounded-md bg-purple-50 px-2 py-1 border border-purple-200 text-purple-900 font-bold text-[11px] flex items-center gap-1">
                                <Calendar size={12} className="text-purple-600 shrink-0" />
                                <span className="truncate">Sự kiện: {p.event.title}</span>
                              </div>
                            )}

                            {p.type === 'RECRUITMENT' && p.job?.title && (
                              <div className="mb-1 rounded-md bg-sky-50 px-2 py-1 border border-sky-200 text-sky-900 font-bold text-[11px] flex items-center gap-1">
                                <Briefcase size={12} className="text-sky-600 shrink-0" />
                                <span className="truncate">Tên vị trí: {p.job.title} {p.job.company ? `(${p.job.company})` : ''}</span>
                              </div>
                            )}

                            {p.type === 'ACHIEVEMENT' && (
                              <div className="mb-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200 text-amber-900 font-bold text-[10px]">
                                <Trophy size={11} className="text-amber-600" />
                                <span>Chia sẻ thành tựu</span>
                              </div>
                            )}

                            <p className="line-clamp-2 text-plum-900 font-medium leading-relaxed">
                              {p.content || <span className="italic text-plum-400">(Không có nội dung mô tả)</span>}
                            </p>
                            <p className="text-[11px] text-plum-400 mt-1 flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(p.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </td>

                          {/* 4. Interactions Column */}
                          <td className="px-4 py-4 align-top whitespace-nowrap text-plum-600">
                            <div className="flex flex-col gap-1 text-[11px]">
                              <span className="flex items-center gap-1.5">
                                <ThumbsUp size={12} className="text-gold-500" /> <strong>{p.likeCount}</strong> thích
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-plum-400" /> <strong>{p.commentCount}</strong> bình luận
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Repeat size={12} className="text-sky-500" /> <strong>{p.repostCount}</strong> đăng lại
                              </span>
                            </div>
                          </td>

                          {/* 5. Status Column */}
                          <td className="px-4 py-4 align-top whitespace-nowrap">
                            {p.deleted ? (
                              <Badge tone="danger" className="font-semibold">Đã xóa</Badge>
                            ) : p.hidden ? (
                              <Badge tone="danger" className="font-semibold">Đã ẩn (Vi phạm)</Badge>
                            ) : (
                              <Badge tone="success" className="font-semibold">Hiển thị</Badge>
                            )}
                          </td>

                          {/* 6. Action Column */}
                          <td className="px-4 py-4 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => handleToggleHidden(e, p.id, p.hidden)}
                                disabled={toggleMutation.isPending}
                                className={cn(
                                  'h-7 px-2 text-[11px] font-bold border transition-colors',
                                  p.hidden
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                )}
                                title={p.hidden ? 'Mở hiển thị bài viết' : 'Ẩn bài viết vi phạm'}
                              >
                                {p.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                                <span>{p.hidden ? 'Mở' : 'Ẩn'}</span>
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate(`/admin/posts/${p.id}`)
                                }}
                                className="h-7 px-2.5 text-[11px] font-bold bg-plum-900/[0.05] text-plum-800 hover:bg-plum-900/[0.1] border border-plum-900/10"
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
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <p className="text-xs text-plum-500">
                  Trang <strong className="text-plum-900">{page + 1}</strong> / <strong>{totalPages}</strong> (Tổng {totalElements} bài)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    className="text-xs font-bold"
                  >
                    Trước
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    className="text-xs font-bold"
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Reveal>
    </div>
  )
}

