import { useState, useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, Modal, toast, Pagination } from '@/components/ui'
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
    pillActiveBg: 'bg-primary-solid text-on-primary border-primary shadow-raised font-bold',
    pillInactiveBg: 'bg-surface-2 text-text border-border-strong hover:bg-surface-3 hover:border-border-strong',
    dropdownHoverBg: 'hover:bg-surface-3 hover:text-text',
    badgeBg: 'bg-surface-3',
    badgeText: 'text-text',
    badgeBorder: 'border-border-strong',
    rowBorderLeft: 'border-l-plum-600',
    bgHoverRow: 'hover:bg-surface-2',
  },
  GENERAL: {
    value: 'GENERAL',
    label: 'Bình thường',
    shortLabel: 'Bình thường',
    icon: Newspaper,
    colorHex: '#475569',
    pillActiveBg: 'bg-text text-bg border-text shadow-raised font-bold',
    pillInactiveBg: 'bg-surface-2 text-text-muted border-border hover:bg-surface-3 hover:border-border-strong',
    dropdownHoverBg: 'hover:bg-surface-2 hover:text-text',
    badgeBg: 'bg-surface-2 text-text',
    badgeText: 'text-text',
    badgeBorder: 'border-border-strong',
    rowBorderLeft: 'border-l-slate-400',
    bgHoverRow: 'hover:bg-surface-2',
  },
  ACHIEVEMENT: {
    value: 'ACHIEVEMENT',
    label: 'Thành tựu',
    shortLabel: 'Thành tựu',
    icon: Trophy,
    colorHex: '#D97706',
    pillActiveBg: 'bg-warning text-text-inverse border-warning shadow-raised font-bold',
    pillInactiveBg: 'bg-warning-soft text-warning border-warning-border hover:bg-warning-border/60 hover:border-warning-border',
    dropdownHoverBg: 'hover:bg-warning-soft hover:text-warning',
    badgeBg: 'bg-warning-soft text-warning',
    badgeText: 'text-warning',
    badgeBorder: 'border-warning-border',
    rowBorderLeft: 'border-l-amber-500',
    bgHoverRow: 'hover:bg-warning-soft',
  },
  RECRUITMENT: {
    value: 'RECRUITMENT',
    label: 'Tuyển dụng',
    shortLabel: 'Tuyển dụng',
    icon: Briefcase,
    colorHex: '#0284C7',
    pillActiveBg: 'bg-info text-text-inverse border-info shadow-raised font-bold',
    pillInactiveBg: 'bg-info-soft text-info border-info-border hover:bg-info-border/60 hover:border-info-border',
    dropdownHoverBg: 'hover:bg-info-soft hover:text-info',
    badgeBg: 'bg-info-soft text-info',
    badgeText: 'text-info',
    badgeBorder: 'border-info-border',
    rowBorderLeft: 'border-l-sky-500',
    bgHoverRow: 'hover:bg-info-soft',
  },
  EVENT: {
    value: 'EVENT',
    label: 'Sự kiện',
    shortLabel: 'Sự kiện',
    icon: Calendar,
    colorHex: '#7C3AED',
    pillActiveBg: 'bg-purple-600 text-white border-purple-600 shadow-raised font-bold',
    pillInactiveBg: 'bg-purple-500/10 text-purple-700 border-purple-500/30 hover:bg-purple-500/20 dark:text-purple-300',
    dropdownHoverBg: 'hover:bg-purple-500/10 hover:text-purple-700 dark:hover:text-purple-300',
    badgeBg: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
    badgeText: 'text-purple-700 dark:text-purple-300',
    badgeBorder: 'border-purple-500/30',
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
          'flex h-10 items-center justify-between gap-2.5 rounded-xl border bg-surface px-3.5 text-xs font-bold text-text shadow-sm transition duration-200 hover:border-gold-400 focus:outline-none cursor-pointer min-w-[200px]',
          isOpen ? 'ring-2 ring-gold-400/40 border-gold-400 bg-surface-2' : 'border-border-strong hover:bg-surface-2'
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
          className={cn('text-text-subtle transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-gold-500' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-64 origin-top-right rounded-2xl border border-border-strong bg-surface backdrop-blur-xl p-1.5 shadow-2xl shadow-plum-950/20 animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-subtle border-b border-border mb-1 flex items-center justify-between">
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
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-plum-900 text-gold-300 shadow-md font-bold'
                      : cn('text-text', cfg.dropdownHoverBg)
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
  const [confirmPost, setConfirmPost] = useState<{ id: number; hidden: boolean } | null>(null)

  const posts = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const handleToggleHidden = (e: React.MouseEvent, postId: number, isCurrentlyHidden: boolean) => {
    e.stopPropagation()
    setConfirmPost({ id: postId, hidden: isCurrentlyHidden })
  }

  const handleConfirmToggle = async () => {
    if (!confirmPost) return
    try {
      await toggleMutation.mutateAsync({ id: confirmPost.id, hidden: !confirmPost.hidden })
      toast.success(confirmPost.hidden ? 'Đã hiển thị lại bài viết!' : 'Đã ẩn bài viết thành công!')
      setConfirmPost(null)
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi khi cập nhật trạng thái bài viết.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Quản lý bài viết cộng đồng"
        subtitle="Duyệt, phân loại theo mục đích và kiểm duyệt nội dung bài viết trong toàn hệ thống."
      />

      {/* --- Bộ lọc theo Loại bài viết (Color-coded Category Bar) --- */}
      <Card hover={false} className="p-4 bg-surface/80 backdrop-blur border border-border shadow-sm !overflow-visible relative z-20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text">
              <Filter size={14} className="text-gold-500" />
              <span>Phân loại bài viết</span>
            </div>
            {totalElements > 0 && (
              <span className="text-xs font-semibold text-text-subtle">
                Hiển thị <strong className="text-text">{posts.length}</strong> / <strong>{totalElements}</strong> bài viết
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
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition duration-200 border cursor-pointer',
                    isSelected ? cfg.pillActiveBg : cfg.pillInactiveBg
                  )}
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md shrink-0 transition',
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
                'rounded-full px-4 py-1.5 text-xs font-bold transition cursor-pointer select-none',
                status === t.value
                  ? 'bg-primary-solid text-on-primary shadow-xs'
                  : 'bg-surface-2 text-text-muted hover:bg-surface-3'
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
            <Search size={15} className="pointer-events-none absolute left-3 text-text-subtle" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm nội dung..."
              className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-xs text-text placeholder:text-text-subtle focus:border-gold-400 focus:bg-surface focus:outline-none transition"
            />
          </div>

          <div className="relative flex items-center sm:w-48">
            <User size={15} className="pointer-events-none absolute left-3 text-text-subtle" />
            <input
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm tác giả, email..."
              className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-xs text-text placeholder:text-text-subtle focus:border-gold-400 focus:bg-surface focus:outline-none transition"
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
            icon={<Newspaper size={28} className="text-danger" />}
            title="Lỗi tải danh sách bài viết"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper size={28} className="text-text-subtle" />}
            title="Không tìm thấy bài viết"
            description={
              type !== 'ALL'
                ? `Không có bài viết nào thuộc loại "${CATEGORY_MAP[type]?.label}".`
                : 'Hiện tại không có bài viết nào phù hợp với bộ lọc.'
            }
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-hidden border border-border shadow-sm bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-left text-xs font-bold uppercase tracking-wider text-text-subtle">
                      <th className="px-4 py-3.5">Loại bài viết</th>
                      <th className="px-4 py-3.5">Tác giả</th>
                      <th className="px-4 py-3.5">Nội dung & Thông tin</th>
                      <th className="px-4 py-3.5">Tương tác</th>
                      <th className="px-4 py-3.5">Trạng thái</th>
                      <th className="px-4 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
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
                                  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold border shadow-2xs',
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
                                className="text-xs px-2 py-0.2"
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
                                <p className="font-bold text-text truncate max-w-[140px]">{p.authorName || 'Ẩn danh'}</p>
                                <p className="text-xs text-text-subtle truncate max-w-[140px]">{p.authorEmail}</p>
                              </div>
                            </div>
                          </td>

                          {/* 3. Content & Special Details Column */}
                          <td className="px-4 py-4 align-top max-w-sm">
                            {/* Special headers for Event / Job / Achievement */}
                            {p.type === 'EVENT' && p.event?.title && (
                              <div className="mb-1 rounded-md bg-purple-50 px-2 py-1 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1">
                                <Calendar size={12} className="text-purple-600 shrink-0" />
                                <span className="truncate">Sự kiện: {p.event.title}</span>
                              </div>
                            )}

                            {p.type === 'RECRUITMENT' && p.job?.title && (
                              <div className="mb-1 rounded-md bg-info-soft px-2 py-1 border border-info-border text-info font-bold text-xs flex items-center gap-1">
                                <Briefcase size={12} className="text-info shrink-0" />
                                <span className="truncate">Tên vị trí: {p.job.title} {p.job.company ? `(${p.job.company})` : ''}</span>
                              </div>
                            )}

                            {p.type === 'ACHIEVEMENT' && (
                              <div className="mb-1 inline-flex items-center gap-1 rounded-md bg-warning-soft px-2 py-0.5 border border-warning-border text-warning font-bold text-xs">
                                <Trophy size={11} className="text-warning" />
                                <span>Chia sẻ thành tựu</span>
                              </div>
                            )}

                            <p className="line-clamp-2 text-text font-medium leading-relaxed">
                              {p.content || <span className="italic text-text-subtle">(Không có nội dung mô tả)</span>}
                            </p>
                            <p className="text-xs text-text-subtle mt-1 flex items-center gap-1">
                              <Clock size={11} />
                              {new Date(p.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </td>

                          {/* 4. Interactions Column */}
                          <td className="px-4 py-4 align-top whitespace-nowrap text-text-muted">
                            <div className="flex flex-col gap-1 text-xs">
                              <span className="flex items-center gap-1.5">
                                <ThumbsUp size={12} className="text-gold-500" /> <strong>{p.likeCount}</strong> thích
                              </span>
                              <span className="flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-text-subtle" /> <strong>{p.commentCount}</strong> bình luận
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
                              {!p.deleted && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => handleToggleHidden(e, p.id, p.hidden)}
                                  disabled={toggleMutation.isPending}
                                  className={cn(
                                    'h-7 px-2 text-xs font-bold border transition-colors',
                                    p.hidden
                                      ? 'bg-success-soft text-success border-success-border hover:bg-success-border/60'
                                      : 'bg-danger-soft text-danger border-danger-border hover:bg-danger-border/60'
                                  )}
                                  title={p.hidden ? 'Mở hiển thị bài viết' : 'Ẩn bài viết vi phạm'}
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
                                className="h-7 px-2.5 text-xs font-bold bg-surface-2 text-text hover:bg-surface-3 border border-border"
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Reveal>

      {/* Modal xác nhận ẩn / hiện bài viết */}
      {confirmPost && (
        <Modal
          isOpen={!!confirmPost}
          onClose={() => setConfirmPost(null)}
          title={confirmPost.hidden ? 'Mở ẩn bài viết' : 'Ẩn bài viết'}
          icon={confirmPost.hidden ? <Eye size={18} className="text-success" /> : <EyeOff size={18} className="text-danger" />}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmPost(null)} disabled={toggleMutation.isPending}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmToggle}
                disabled={toggleMutation.isPending}
                className={confirmPost.hidden ? 'bg-success hover:opacity-90 text-text-inverse' : 'bg-danger hover:opacity-90 text-text-inverse'}
              >
                {toggleMutation.isPending ? 'Đang xử lý...' : confirmPost.hidden ? 'Mở ẩn' : 'Ẩn bài viết'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-muted">
            Bạn có chắc muốn {confirmPost.hidden ? 'mở ẩn lại' : 'ẩn'} bài viết #{confirmPost.id} không?
          </p>
        </Modal>
      )}
    </div>
  )
}

