/**
 * SavedPostsView — Component hiển thị danh sách bài viết đã lưu trong trang cá nhân (UC21 - View Saved Posts).
 *
 * Thiết kế phong cách Instagram & LinkedIn:
 * - Hỗ trợ 2 chế độ xem: Dòng thời gian (Feed) và Dạng lưới (Grid).
 * - Bộ lọc danh mục theo loại bài viết: Tất cả, Thành tựu, Tuyển dụng, Sự kiện.
 * - Thẻ bài viết hiển thị đầy đủ thông tin chi tiết, hình ảnh, thông tin việc làm, sự kiện, tương tác like/comment/bỏ lưu.
 * - Tương thích hoàn hảo với hệ màu Pastel Premium và hoạt ảnh mượt mà.
 */
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bookmark,
  Heart,
  MessageCircle,
  Trophy,
  Sparkles,
  Briefcase,
  CalendarPlus,
  Clock,
  MapPin,
  ExternalLink,
  Loader2,
  AlertTriangle,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react'
import { Avatar, Card, EmptyState, ImageCarousel } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { compact, cn } from '@/lib/utils'
import { useSavedPosts } from '../hooks/useSavedPosts'
import { useToggleSavePost } from '../hooks/useToggleSavePost'
import { useToggleLike } from '../hooks/useToggleLike'
import type { Post, FeedFilter } from '../model/post'

/** Nhãn, icon và phong cách hiển thị badge rõ nét cho từng loại bài viết. */
const TYPE_META: Record<
  string,
  {
    label: string
    tone: 'brand' | 'gold' | 'aqua' | 'violet'
    icon: React.ReactNode
    badgeClass: string
    pillClass: string
  }
> = {
  achievement: {
    label: 'Thành tựu',
    tone: 'gold',
    icon: <Sparkles size={11} className="text-amber-600" />,
    badgeClass: 'bg-white/95 text-amber-700 border border-amber-200/80 shadow-sm font-extrabold',
    pillClass: 'bg-amber-100 text-amber-800 border border-amber-200',
  },
  recruitment: {
    label: 'Tuyển dụng',
    tone: 'aqua',
    icon: <Briefcase size={11} className="text-sky-600" />,
    badgeClass: 'bg-white/95 text-sky-700 border border-sky-200/80 shadow-sm font-extrabold',
    pillClass: 'bg-sky-100 text-sky-800 border border-sky-200',
  },
  event: {
    label: 'Sự kiện',
    tone: 'violet',
    icon: <CalendarPlus size={11} className="text-violet-600" />,
    badgeClass: 'bg-white/95 text-violet-700 border border-violet-200/80 shadow-sm font-extrabold',
    pillClass: 'bg-violet-100 text-violet-800 border border-violet-200',
  },
  normal: {
    label: 'Bài viết',
    tone: 'brand',
    icon: null,
    badgeClass: 'bg-white/95 text-plum-900 border border-plum-200/80 shadow-sm font-extrabold',
    pillClass: 'bg-plum-100 text-plum-800 border border-plum-200',
  },
}

/** Các tab lọc bài viết đã lưu theo loại. */
const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'achievement', label: 'Thành tựu' },
  { key: 'recruitment', label: 'Tuyển dụng' },
  { key: 'event', label: 'Sự kiện' },
]

/** Thẻ hiển thị một bài viết đã lưu ở chế độ Feed (Dòng thời gian chi tiết). */
function SavedFeedCard({
  post,
  onUnsave,
}: {
  post: Post
  onUnsave: (postId: string) => void
}) {
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState<number>(post.likes)
  const meta = TYPE_META[post.type] ?? TYPE_META.normal
  const toggleLike = useToggleLike()

  const handleLike = () => {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => c + (next ? 1 : -1))
    toggleLike.mutate(
      { postId: post.id, like: next },
      {
        onSuccess: (data) => {
          setLiked(data.liked)
          setLikeCount(data.likeCount)
        },
        onError: () => {
          setLiked(!next)
          setLikeCount((c) => c + (next ? -1 : 1))
        },
      },
    )
  }

  const images = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : []

  return (
    <Card
      hover={false}
      className={cn(
        'overflow-hidden relative transition-all duration-300 rounded-2xl border border-plum-900/10 shadow-sm hover:shadow-md bg-white text-left mb-6',
        post.type === 'achievement' && 'border-amber-200 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-amber-100/30'
      )}
    >
      {post.type === 'achievement' && (
        <div className="absolute -top-4 -right-4 p-6 opacity-[0.04] pointer-events-none -rotate-12">
          <Trophy size={160} className="text-amber-600" />
        </div>
      )}

      <div className="p-6 relative z-10">
        {/* Header: tác giả, avatar, badge & nút Bỏ lưu */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
              className="shrink-0 transition-transform duration-200 hover:scale-105"
            >
              <Avatar src={post.avatar} name={post.author} size={44} verified={post.verified} />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                  className="font-bold text-plum-900 truncate hover:underline hover:text-brand-600 transition-colors text-sm"
                >
                  {post.author}
                </Link>
                <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold shadow-2xs', meta.pillClass)}>
                  {meta.icon} {meta.label}
                </span>
              </div>
              <p className="text-xs text-plum-400 mt-0.5 truncate">
                {post.role ? `${post.role} · ` : ''}{post.time}
              </p>
            </div>
          </div>

          {/* Nút Bỏ lưu nhanh */}
          <button
            type="button"
            onClick={() => onUnsave(post.id)}
            aria-label="Bỏ lưu bài viết"
            title="Bỏ lưu bài viết này"
            className="group flex items-center gap-1.5 rounded-xl border border-plum-900/10 bg-plum-50/60 px-3 py-1.5 text-xs font-semibold text-plum-600 transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 active:scale-95 cursor-pointer shrink-0"
          >
            <Bookmark size={14} className="fill-[#F27024] text-[#F27024] group-hover:hidden" />
            <Trash2 size={14} className="hidden text-rose-600 group-hover:block" />
            <span className="group-hover:text-rose-600">Đã lưu</span>
          </button>
        </div>

        {/* Nội dung bài viết */}
        {post.type !== 'event' && post.type !== 'recruitment' && post.text && (
          <Link to={`/app/posts/${post.id}`} className="mt-3.5 block">
            <p className="whitespace-pre-line text-sm leading-relaxed text-plum-800 transition-colors hover:text-plum-900">
              {post.text}
            </p>
          </Link>
        )}
      </div>

      {/* Tuyển dụng (nếu là bài recruitment) */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-5 mb-4 overflow-hidden rounded-xl border border-brand-100 bg-brand-50/30 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h3 className="font-bold text-plum-900 text-sm flex items-center gap-1.5">
              <Briefcase size={15} className="text-brand-600 shrink-0" />
              <span>{post.job.title}</span>
            </h3>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-[#F27024] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#d96010] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Ứng tuyển <ExternalLink size={11} />
              </a>
            )}
          </div>
          <p className="text-xs font-semibold text-plum-600 mb-2">🏢 {post.job.company}</p>
          {post.job.location && (
            <p className="text-xs text-plum-500 flex items-center gap-1 mb-2">
              <MapPin size={12} className="text-brand-500" /> {post.job.location}
            </p>
          )}
          {post.text && (
            <Link to={`/app/posts/${post.id}`} className="block">
              <p className="text-xs text-plum-700 line-clamp-2 mt-2 pt-2 border-t border-brand-100/60">
                {post.text}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Sự kiện (nếu là bài event) */}
      {post.type === 'event' && post.event && (
        <div className="mx-5 mb-4 overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarPlus size={16} className="text-violet-600 shrink-0" />
            <h3 className="font-bold text-plum-900 text-sm">{post.event.title}</h3>
          </div>
          {post.event.startTime && (
            <p className="text-xs font-medium text-plum-600 flex items-center gap-1.5 mb-1.5">
              <Clock size={12} className="text-violet-500" />
              {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'full' })}
            </p>
          )}
          {post.event.location && (
            <p className="text-xs text-plum-500 flex items-center gap-1.5 mb-2">
              <MapPin size={12} className="text-violet-500" /> {post.event.location}
            </p>
          )}
          {post.text && (
            <Link to={`/app/posts/${post.id}`} className="block">
              <p className="text-xs text-plum-700 line-clamp-2 mt-2 pt-2 border-t border-violet-100/60">
                {post.text}
              </p>
            </Link>
          )}
        </div>
      )}

      {/* Ảnh đính kèm */}
      {post.type !== 'event' && post.type !== 'recruitment' && images.length > 0 && (
        <div className="px-5 pb-3">
          <ImageCarousel images={images} height={320} altPrefix="Ảnh bài viết" />
        </div>
      )}

      {/* Action footer */}
      <div className="flex items-center gap-1 px-4 py-2.5 border-t border-plum-900/5 bg-slate-50/50">
        <button
          onClick={handleLike}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-200/60 cursor-pointer',
            liked ? 'text-rose-500 bg-rose-50' : 'text-slate-600',
          )}
        >
          <Heart size={15} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
          <span>{compact(likeCount)}</span>
        </button>

        <Link
          to={`/app/posts/${post.id}#comments`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-[#F27024]/10 hover:text-[#F27024]"
        >
          <MessageCircle size={15} />
          <span>{compact(post.comments)} bình luận</span>
        </Link>

        <Link
          to={`/app/posts/${post.id}`}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[#F27024] hover:underline"
        >
          Xem chi tiết →
        </Link>
      </div>
    </Card>
  )
}

/** Thẻ hiển thị một bài viết đã lưu ở chế độ Grid (Lưới ảnh / ô thẻ phong cách Instagram). */
function SavedGridCard({
  post,
  onUnsave,
}: {
  post: Post
  onUnsave: (postId: string) => void
}) {
  const meta = TYPE_META[post.type] ?? TYPE_META.normal
  const coverImage = post.images?.[0] || post.image || (post.type === 'event' ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' : null)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-plum-900/10 bg-white shadow-sm hover:shadow-md transition-all duration-300 text-left flex flex-col h-full">
      {/* Phần hình ảnh hoặc Banner màu */}
      <Link to={`/app/posts/${post.id}`} className="relative aspect-video w-full overflow-hidden bg-slate-100 block shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.text || 'Bài viết'}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-plum-100/80 via-plum-50 to-orange-50/50 p-4 flex flex-col justify-center">
            <p className="text-xs text-plum-700 line-clamp-3 font-medium">{post.text || 'Bài viết AlumNect'}</p>
          </div>
        )}
        <div className="absolute top-2.5 left-2.5">
          <span className={cn('inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-md shadow-sm', meta.badgeClass)}>
            {meta.icon} {meta.label}
          </span>
        </div>

        {/* Nút bỏ lưu góc phải */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onUnsave(post.id)
          }}
          title="Bỏ lưu bài viết"
          className="absolute top-2.5 right-2.5 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-rose-500 shadow-sm backdrop-blur-xs hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
        >
          <Trash2 size={13} />
        </button>
      </Link>

      {/* Nội dung tóm tắt */}
      <div className="p-3.5 flex flex-col justify-between flex-1">
        <Link to={`/app/posts/${post.id}`} className="block">
          {post.type === 'recruitment' && post.job ? (
            <p className="font-bold text-plum-900 text-xs line-clamp-1 mb-1">
              💼 {post.job.title} ({post.job.company})
            </p>
          ) : post.type === 'event' && post.event ? (
            <p className="font-bold text-plum-900 text-xs line-clamp-1 mb-1">
              📅 {post.event.title}
            </p>
          ) : null}

          <p className="text-xs text-plum-700 line-clamp-2 leading-relaxed">
            {post.text || 'Nhấn để xem chi tiết bài viết...'}
          </p>
        </Link>

        {/* Footer info */}
        <div className="mt-3 pt-2.5 border-t border-plum-900/5 flex items-center justify-between text-[11px] text-plum-400">
          <div className="flex items-center gap-1.5 truncate">
            <Avatar src={post.avatar} name={post.author} size={20} />
            <span className="truncate text-plum-700 font-medium">{post.author}</span>
          </div>
          <span className="shrink-0">{post.time}</span>
        </div>
      </div>
    </div>
  )
}

/** Khung xương tải bài viết đã lưu. */
function SavedPostsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} hover={false} className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-plum-900/[0.07]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-36 animate-pulse rounded bg-plum-900/[0.07]" />
              <div className="h-3 w-20 animate-pulse rounded bg-plum-900/[0.05]" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.06]" />
            <div className="h-3.5 w-4/5 animate-pulse rounded bg-plum-900/[0.06]" />
          </div>
        </Card>
      ))}
    </div>
  )
}

/**
 * Component hiển thị danh sách bài viết đã lưu bên trong trang Profile cá nhân.
 */
export function SavedPostsView() {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [viewMode, setViewMode] = useState<'feed' | 'grid'>('grid')
  const { data, isLoading, isError, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useSavedPosts()
  const toggleSave = useToggleSavePost()

  // Bóc danh sách bài viết đã lưu từ các trang
  const allSavedPosts: Post[] = useMemo(() => (data?.pages ?? []).flatMap((p) => p.items), [data])
  const filteredPosts = useMemo(
    () => (filter === 'all' ? allSavedPosts : allSavedPosts.filter((p) => p.type === filter)),
    [allSavedPosts, filter]
  )

  const handleUnsave = (postId: string) => {
    toggleSave.mutate({ postId, save: false })
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header thanh công cụ (Filters + View Mode Switcher) */}
      <Reveal>
        <div className="rounded-2xl bg-white p-4 sm:p-5 border border-plum-900/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Tabs bộ lọc */}
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key
              const count = f.key === 'all'
                ? allSavedPosts.length
                : allSavedPosts.filter((p) => p.type === f.key).length

              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2',
                    active
                      ? 'bg-[#F27024] text-white shadow-xs shadow-orange-500/20'
                      : 'bg-slate-100/80 text-plum-600 hover:bg-slate-200/80 hover:text-plum-900',
                  )}
                >
                  <span>{f.label}</span>
                  {!isLoading && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-extrabold',
                        active ? 'bg-white/25 text-white' : 'bg-plum-900/10 text-plum-700'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Chuyển đổi chế độ xem Grid / Feed (Instagram style) */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-plum-900/5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Chế độ lưới ảnh (Mặc định)"
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg text-xs transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-plum-900 font-bold shadow-xs'
                  : 'text-plum-400 hover:text-plum-700'
              )}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('feed')}
              title="Chế độ dòng thời gian"
              className={cn(
                'grid h-8 w-8 place-items-center rounded-lg text-xs transition-all cursor-pointer',
                viewMode === 'feed'
                  ? 'bg-white text-plum-900 font-bold shadow-xs'
                  : 'text-plum-400 hover:text-plum-700'
              )}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </Reveal>

      {/* Nội dung danh sách */}
      {isLoading ? (
        <SavedPostsSkeleton />
      ) : isError ? (
        <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center rounded-2xl">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-300/40 text-coral-600">
            <AlertTriangle size={24} />
          </span>
          <p className="font-bold text-plum-900">Không tải được danh sách bài viết đã lưu</p>
          <p className="text-xs text-plum-500">{(error as Error)?.message || 'Vui lòng kiểm tra lại kết nối mạng.'}</p>
          <Button size="sm" onClick={() => refetch()}>Thử lại</Button>
        </Card>
      ) : filteredPosts.length === 0 ? (
        <Card hover={false} className="rounded-2xl p-10 text-center bg-white border border-plum-900/10">
          <EmptyState
            icon={<Bookmark size={32} className="text-orange-500" />}
            title={filter === 'all' ? 'Chưa có bài viết nào được lưu' : `Không có bài viết loại "${FILTERS.find(f => f.key === filter)?.label}"`}
            description={filter === 'all' ? 'Lưu lại những bài viết, tuyển dụng hoặc sự kiện hay trên Bảng tin để xem lại bất cứ khi nào.' : 'Thử chuyển sang tab bộ lọc khác để xem bài viết.'}
            action={
              <ButtonLink to="/app" className="bg-[#F27024] text-white hover:bg-[#d96010] rounded-xl text-xs font-bold px-5 py-2.5 shadow-sm">
                Khám phá Bảng tin
              </ButtonLink>
            }
          />
        </Card>
      ) : viewMode === 'feed' ? (
        /* Dòng thời gian chi tiết (Feed View) */
        <div className="space-y-6">
          <Stagger className="space-y-6 flex flex-col gap-6">
            {filteredPosts.map((post) => (
              <StaggerItem key={post.id}>
                <SavedFeedCard post={post} onUnsave={handleUnsave} />
              </StaggerItem>
            ))}
          </Stagger>

          {/* Tải thêm trang kế tiếp */}
          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2 rounded-xl cursor-pointer px-5 py-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang tải thêm…
                  </>
                ) : (
                  'Tải thêm bài viết'
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Dạng lưới ảnh (Instagram Grid View) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredPosts.map((post) => (
              <SavedGridCard key={post.id} post={post} onUnsave={handleUnsave} />
            ))}
          </div>

          {/* Tải thêm trang kế tiếp */}
          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="gap-2 rounded-xl cursor-pointer px-5 py-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang tải thêm…
                  </>
                ) : (
                  'Tải thêm bài viết'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
