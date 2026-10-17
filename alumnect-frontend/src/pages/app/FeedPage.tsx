/**
 * FeedPage — Trang bảng tin cộng đồng (UC15 - View community Feed).
 *
 * Trách nhiệm:
 *  - Lấy dữ liệu bài viết qua hook `useFeed` (TanStack Query, infinite scroll).
 *  - Áp dụng phân quyền theo vai trò: Guest chỉ đọc; Student/Alumni đăng bài & tương tác.
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / rỗng / lỗi (retry) / phân quyền / thành công.
 *  - Lọc bài viết theo loại và tải thêm trang (phân trang).
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Image as ImageIcon,
  CalendarPlus,
  Briefcase,
  Award,
  Trophy,
  Loader2,
  AlertTriangle,
  Inbox,
  MapPin,
  ExternalLink,
  Clock,
  Users,
  Ban,
  Coins,
  Heart,
  MessageCircle,
  Repeat,
  Bookmark,
  Flag,
} from 'lucide-react'
import { TRANSITION } from '@/lib/motion'
import { Avatar, Badge, Card, toast, ImageViewerModal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { UpcomingEventsWidget, CancelEventModal, useCancelEvent, EventRsvpButton } from '@/features/event'

import { compact, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/store/authStore'
import { useSearchStore } from '@/store/searchStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useFeed, useToggleLike, useToggleSavePost, CreatePostModal, DeletePostModal, ShareModal, PostActionMenu, InlineComments } from '@/features/feed'
import { ReportPostModal } from '@/features/report'
import { ConnectionSuggestionsWidget } from '@/features/user'
import type { FeedFilter, Post } from '@/features/feed'

import type { PostType } from '@/features/feed/model/post'

/** Nhãn + tông màu badge cho từng loại bài viết. */
const TYPE_META: Record<string, { label: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }> = {
  achievement: { label: 'Thành tựu', tone: 'gold' },
  recruitment: { label: 'Tuyển dụng', tone: 'aqua' },
  event: { label: 'Sự kiện', tone: 'violet' },
  normal: { label: 'Bài viết', tone: 'brand' },
}

/** Các tab lọc bảng tin theo loại bài viết (UC15: lọc theo loại). */
const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'achievement', label: 'Thành tựu' },
  { key: 'recruitment', label: 'Tuyển dụng' },
  { key: 'event', label: 'Sự kiện' },
]

/**
 * Ô soạn bài viết ở đầu bảng tin — chỉ hiển thị cho thành viên đã đăng nhập
 * (Student/Alumni). Guest/Admin không thấy khối này; Guest tương tác sẽ được mời
 * đăng nhập qua popup (BR-12).
 * @param viewer Người dùng hiện tại dùng để hiển thị avatar/tên
 */
function Composer({ viewer, onOpen }: { viewer: AuthUser; onOpen: (type?: PostType) => void }) {
  const firstName = viewer.name ? viewer.name.trim().split(' ').slice(-1)[0] : 'bạn'
  return (
    <Card hover={false} className="p-4 border border-border shadow-xs bg-surface rounded-2xl">
      <div className="flex items-center gap-3">
        <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={42} verified={viewer.verified} />
        <button
          type="button"
          onClick={() => onOpen()}
          className="h-11 flex-1 rounded-full border border-border bg-surface-2 px-4 text-left text-sm text-text-subtle transition-all hover:bg-surface-2 hover:border-border-strong"
        >
          {firstName} ơi, bạn đang nghĩ gì thế?
        </button>
      </div>
      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2 sm:justify-start">
        <button
          type="button"
          onClick={() => onOpen('normal')}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:flex-none sm:px-3"
        >
          <ImageIcon size={18} className="shrink-0 text-info" />
          <span>Ảnh / Video</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('recruitment')}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:flex-none sm:px-3"
        >
          <Briefcase size={18} className="shrink-0 text-primary-solid" />
          <span>Tuyển dụng</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('event')}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-1 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:flex-none sm:px-3"
        >
          <CalendarPlus size={18} className="shrink-0 text-info" />
          <span>Sự kiện</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('achievement')}
          className="hidden min-h-11 items-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-text-muted transition-colors hover:bg-surface-2 hover:text-text sm:inline-flex"
        >
          <Award size={18} className="shrink-0 text-warning" />
          <span>Thành tựu</span>
        </button>
      </div>
    </Card>
  )
}

/**
 * Thẻ hiển thị một bài viết trên bảng tin.
 * @param post Dữ liệu bài viết
 * @param canInteract Người dùng có quyền tương tác (like/comment) hay không
 */
export function PostCard({
  post,
  canInteract,
  currentUserId,
  currentUserName,
  onEdit,
  onDelete,
  canReport,
  onReport,
  onShare,
  onCancelEvent,
}: {
  post: Post
  canInteract: boolean
  currentUserId?: string
  currentUserName?: string
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  canReport: boolean
  onReport?: (post: Post) => void
  onShare?: (post: Post) => void
  onCancelEvent?: (post: Post) => void
}) {
  // Trạng thái thích cục bộ (nguồn sự thật cho UI sau khi tương tác) — khởi tạo từ dữ liệu bài viết.
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState<number>(post.likes)
  // Trạng thái lưu bài viết cục bộ (UC20 - Save Post)
  const [saved, setSaved] = useState(post.saved ?? false)
  // Trạng thái mở khung bình luận trực tiếp (Inline Comments)
  const [showComments, setShowComments] = useState(false)
  const [commentCount, setCommentCount] = useState(post.comments)
  // Trạng thái xem ảnh phóng to toàn màn hình (Lightbox)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const viewer = useAuthStore((s) => s.user)
  const meta = TYPE_META[post.type] ?? TYPE_META.normal

  // Đồng bộ lại state khi post props thay đổi (ví dụ sau khi refetch hoặc đổi tab)
  useEffect(() => {
    setLiked(post.liked)
    setLikeCount(post.likes)
    setSaved(post.saved ?? false)
    setCommentCount(post.comments)
  }, [post.liked, post.likes, post.saved, post.comments])

  // Guest bấm tương tác sẽ mở popup mời đăng nhập (kiểu Facebook) thay vì nút bị vô hiệu hóa.
  const promptLogin = useLoginPrompt((s) => s.open)
  const toggleLike = useToggleLike()
  const toggleSave = useToggleSavePost()

  /**
   * Xử lý bấm nút Thích (UC17): cập nhật lạc quan (đổi UI ngay), đồng bộ theo phản hồi
   * backend khi thành công, hoàn tác (rollback) khi lỗi. Guest → popup mời đăng nhập (BR-12).
   */
  const handleLike = () => {
    if (!canInteract) {
      promptLogin('Đăng nhập để thích và tương tác với bài viết.')
      return
    }
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

  /**
   * Xử lý bấm nút Lưu / Bỏ lưu bài viết (UC20): cập nhật lạc quan,
   * rollback khi lỗi, hiển thị popup đăng nhập với Guest.
   */
  const handleSave = () => {
    if (!canInteract) {
      promptLogin('Đăng nhập để lưu bài viết.')
      return
    }
    const next = !saved
    setSaved(next)
    toggleSave.mutate(
      { postId: post.id, save: next },
      {
        onSuccess: (data) => {
          setSaved(data.saved)
        },
        onError: () => {
          setSaved(!next)
        },
      },
    )
  }

  const isAuthor = post.authorId != null
    ? !!currentUserId && post.authorId === currentUserId
    : !!currentUserName && post.author === currentUserName

  const navigate = useNavigate()
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, [role="button"], .interactive, [data-interactive]')) {
      return
    }
    navigate(`/app/posts/${post.id}`)
  }

  return (
    <Card
      hover={false}
      onClick={handleCardClick}
      className={cn(
        "overflow-hidden relative transition-shadow duration-200 cursor-pointer border border-border shadow-raised hover:shadow-overlay bg-surface rounded-2xl",
        post.type === 'achievement' && "border-warning-border"
      )}
    >
      {post.type === 'achievement' && (
        <div className="absolute -top-4 -right-4 p-6 opacity-[0.04] pointer-events-none -rotate-12">
          <Trophy size={160} className="text-warning" />
        </div>
      )}
      <div className="p-5 relative z-10">
        {/* --- Phần 1: Header — avatar, tên tác giả, badge loại bài, thời gian, menu "..." --- */}
        <div className="flex items-center gap-3">
          <Link
            to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
            className="shrink-0 transition-transform duration-200 hover:scale-105"
            title={`Xem hồ sơ của ${post.author}`}
          >
            <Avatar src={post.avatar} name={post.author} size={44} verified={post.verified} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                className="truncate font-bold text-text hover:underline hover:text-primary-solid transition-colors text-sm sm:text-base"
                title={`Xem hồ sơ của ${post.author}`}
              >
                {post.author}
              </Link>
              <Link to={`/app/posts/${post.id}`}>
                {post.type === 'achievement' ? (
                  <Badge tone={meta.tone} className="flex cursor-pointer items-center gap-1 border border-warning-border px-2.5 py-0.5 text-xs hover:opacity-85">
                    <Award size={12} /> {meta.label}
                  </Badge>
                ) : post.type !== 'normal' ? (
                  <Badge tone={meta.tone} className="px-2 py-0.5 text-xs cursor-pointer hover:opacity-85">{meta.label}</Badge>
                ) : null}
              </Link>
            </div>
            <Link to={`/app/posts/${post.id}`} className="block truncate text-xs text-text-subtle hover:text-text-muted transition-colors mt-0.5">
              {post.role ? `${post.role.replace(/\s*\|\s*FPTU Alumni/gi, '').replace(/FPTU Alumni/gi, '').trim()} · ` : ''}{post.time}
            </Link>
          </div>
          <PostActionMenu
            post={post}
            isAuthor={isAuthor}
            canInteract={canInteract}
            onEdit={onEdit}
            onDelete={onDelete}
            onCancelEvent={onCancelEvent}
            onReport={onReport}
          />
        </div>

        {/* --- Phần 2: Nội dung văn bản bài viết --- */}
        {post.text && (
          <p className="mt-3.5 whitespace-pre-line text-base leading-relaxed text-text">
            {post.text}
          </p>
        )}
      </div>

      {/* --- Phần 3: Khối thông tin Tuyển dụng (nếu là bài recruitment) — Thiết kế phẳng, tinh gọn --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-5 mb-4 rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-primary-soft-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-solid">
                  <Briefcase size={12} /> Tuyển dụng
                </span>
                <span className="text-xs text-text-muted font-semibold truncate">{post.job.company}</span>
              </div>
              <h4 className="mt-1.5 text-base font-bold text-text truncate">
                {post.job.title}
              </h4>
            </div>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-primary-solid px-3.5 text-sm font-bold text-on-primary shadow-raised hover:bg-primary-hover transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Ứng tuyển <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 border-t border-border pt-2.5 text-sm text-text-muted">
            {post.job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-primary-solid" /> {post.job.location}
              </span>
            )}
            {(post.job.salaryMin || post.job.salaryMax) ? (
              <span className="inline-flex items-center gap-1 font-semibold text-success">
                <Coins size={13} />
                {post.job.salaryMin && post.job.salaryMax
                  ? `${post.job.salaryMin.toLocaleString('vi-VN')} - ${post.job.salaryMax.toLocaleString('vi-VN')} VND`
                  : post.job.salaryMin
                  ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND`
                  : `Lên đến ${post.job.salaryMax?.toLocaleString('vi-VN')} VND`}
              </span>
            ) : (
              <span className="text-text-subtle">Lương thỏa thuận</span>
            )}
            {post.job.contactEmail && (
              <span className="inline-flex items-center gap-1 text-text-subtle">
                <Inbox size={13} className="text-text-subtle" /> {post.job.contactEmail}
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- Phần 3b: Khối thông tin Sự kiện (nếu là bài event) — Thiết kế phẳng, tinh gọn --- */}
      {post.type === 'event' && post.event && (
        <div className="mx-5 mb-4 rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-info-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-info-soft px-2 py-0.5 text-xs font-bold text-info">
                  <CalendarPlus size={12} /> Sự kiện
                </span>
                {post.event.status === 'CANCELLED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                    <Ban size={12} /> Đã hủy
                  </span>
                )}
              </div>
              <h4 className="mt-1.5 text-base font-bold text-text truncate">
                {post.event.title}
              </h4>
            </div>
            {post.event.status !== 'CANCELLED' && (
              <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <EventRsvpButton
                  eventId={post.event.id ?? post.eventId}
                  eventTitle={post.event.title}
                  initialRegistered={post.event.isRegistered ?? false}
                  initialAttendeeCount={post.event.attendeeCount ?? 0}
                  capacity={post.event.capacity}
                  startTime={post.event.startTime}
                  endTime={post.event.endTime}
                  status={post.event.status}
                  size="sm"
                  showCount={false}
                />
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 border-t border-border pt-2.5 text-sm text-text-muted">
            {post.event.startTime && (
              <span className="inline-flex items-center gap-1 font-medium text-text-muted">
                <Clock size={14} className="text-info" />
                {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'short' })}{' '}
                · {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {post.event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} className="text-info" /> {post.event.location}
              </span>
            )}
            {post.event.capacity && (
              <span className="inline-flex items-center gap-1 text-text-subtle">
                <Users size={13} className="text-text-subtle" /> Tối đa {post.event.capacity} người
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- Phần 4: Ảnh đính kèm (Lưới ảnh thông minh kiểu Facebook/Cộng đồng hiện đại) --- */}
      {(() => {
        const imgs = post.images && post.images.length > 0
          ? post.images
          : post.image ? [post.image] : []
        if (imgs.length === 0) return null
        return (
          <div className="px-5 pb-2">
            <div className="overflow-hidden rounded-2xl border border-border">
              {imgs.length === 1 && (
                <img
                  src={imgs[0]}
                  alt="Ảnh bài viết"
                  loading="lazy"
                  decoding="async"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviewImage(imgs[0])
                  }}
                  className="max-h-[460px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                />
              )}

              {imgs.length === 2 && (
                <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                  {imgs.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Ảnh bài viết"
                      loading="lazy"
                      decoding="async"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewImage(url)
                      }}
                      className="h-64 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                    />
                  ))}
                </div>
              )}

              {imgs.length === 3 && (
                <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                  <img
                    src={imgs[0]}
                    alt="Ảnh bài viết"
                    loading="lazy"
                    decoding="async"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewImage(imgs[0])
                    }}
                    className="col-span-2 h-64 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                  />
                  {imgs.slice(1).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Ảnh bài viết"
                      loading="lazy"
                      decoding="async"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewImage(url)
                      }}
                      className="h-44 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                    />
                  ))}
                </div>
              )}

              {imgs.length >= 4 && (
                <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                  {imgs.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt="Ảnh bài viết"
                      loading="lazy"
                      decoding="async"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewImage(url)
                      }}
                      className="h-44 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                    />
                  ))}
                  <div
                    className="relative h-44 cursor-pointer overflow-hidden"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewImage(imgs[3])
                    }}
                  >
                    <img
                      src={imgs[3]}
                      alt="Ảnh bài viết"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-opacity hover:opacity-95"
                    />
                    {imgs.length > 4 && (
                      <div className="absolute inset-0 grid place-items-center bg-black/50 text-xl font-black text-white">
                        +{imgs.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* --- Phần 5: Thanh hành động — Thích / Bình luận / Chia sẻ / Lưu / Báo cáo --- */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1 text-sm font-semibold text-text-muted sm:px-3">
        <div className="grid min-w-0 flex-1 grid-cols-3 gap-1">
          {/* Nút Thích */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleLike()
            }}
            aria-pressed={liked}
            className={cn(
              'inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 transition-colors cursor-pointer hover:bg-surface-2',
              liked
                ? 'text-danger font-bold'
                : 'hover:text-danger',
            )}
          >
            <AnimatePresence initial={false}>
              <motion.span
                key={liked ? 'liked' : 'unliked'}
                className="inline-flex"
                initial={{ scale: 0.55, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={TRANSITION.bounce}
              >
                <Heart size={18} className={cn(liked && 'fill-current')} />
              </motion.span>
            </AnimatePresence>
            <span className="truncate">{compact(likeCount)}<span className="sr-only sm:not-sr-only"> thích</span></span>
          </button>

          {/* Nút Bình luận */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (!canInteract) {
                promptLogin('Đăng nhập để bình luận về bài viết.')
                return
              }
              setShowComments((prev) => !prev)
            }}
            className={cn(
              'inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 transition-colors cursor-pointer hover:bg-surface-2',
              showComments
                ? 'text-primary-solid bg-primary-soft'
                : 'hover:text-primary-solid',
            )}
          >
            <MessageCircle size={18} />
            <span className="truncate">{compact(commentCount)}<span className="sr-only sm:not-sr-only"> bình luận</span></span>
          </button>

          {/* Nút Chia sẻ */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (!canInteract) {
                promptLogin('Đăng nhập để chia sẻ bài viết.')
              } else if (onShare) {
                onShare(post)
              }
            }}
            aria-label="Chia sẻ bài viết"
            className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-lg px-1 transition-colors cursor-pointer hover:bg-surface-2 hover:text-text"
          >
            <Repeat size={18} />
            <span className="sr-only sm:not-sr-only">Chia sẻ</span>
          </button>
        </div>

        {/* Các nút phụ bên phải: Lưu & Báo cáo */}
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
            onClick={(e) => {
              e.stopPropagation()
              handleSave()
            }}
            className={cn(
              'inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors cursor-pointer',
              saved
                ? 'text-primary-solid hover:bg-primary-soft'
                : 'text-text-subtle hover:text-primary-solid hover:bg-surface-2',
            )}
          >
            <Bookmark size={18} className={cn(saved && 'fill-current')} />
          </button>

          {!isAuthor && (canReport ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onReport?.(post)
              }}
              aria-label="Báo cáo bài viết"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors cursor-pointer text-text-subtle hover:bg-danger-soft hover:text-danger"
            >
              <Flag size={18} />
            </button>
          ) : !canInteract ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                promptLogin('Đăng nhập để báo cáo bài viết.')
              }}
              aria-label="Báo cáo bài viết"
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors cursor-pointer text-text-subtle hover:bg-danger-soft hover:text-danger"
            >
              <Flag size={18} />
            </button>
          ) : null)}
        </div>
      </div>

      {/* --- Phần 6: Khung bình luận trực tiếp trên bài viết (Inline Quick Comments) --- */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <InlineComments
              postId={post.id}
              totalComments={commentCount}
              viewer={viewer}
              canInteract={canInteract}
              onCommentAdded={() => setCommentCount((c) => c + 1)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Phần 7: Lightbox xem ảnh toàn màn hình với zoom/pan/rotate --- */}
      <ImageViewerModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage || ''}
        alt={post.text?.slice(0, 50) || 'Ảnh bài viết'}
        senderName={post.author}
        senderAvatar={post.avatar}
        time={post.time}
      />
    </Card>
  )
}

/** Khung xương (skeleton) hiển thị trong lúc tải bảng tin lần đầu. */
function PostSkeleton() {
  return (
    <Card hover={false} className="p-5 relative overflow-hidden">
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 border-4 border-primary-soft-border border-t-brand-600 rounded-full"
        />
      </div>
      <div className="flex items-center gap-3 opacity-30">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-40 animate-pulse rounded bg-border" />
          <div className="h-3 w-24 animate-pulse rounded bg-border" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-border" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-border" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-border" />
      </div>
      <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-surface-2" />
    </Card>
  )
}

/**
 * Trạng thái lỗi khi tải bảng tin thất bại (MSG05) — hiển thị nút Thử lại.
 * @param message Thông điệp lỗi trả về
 * @param onRetry Hàm gọi lại API
 */
function FeedError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-text">Không tải được bảng tin</p>
        <p className="mt-1 text-sm text-text-subtle">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>
    </Card>
  )
}

/** Trạng thái rỗng khi cộng đồng chưa có bài viết nào ("No posts yet"). */
function FeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-4 text-brand-300 drop-shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
      </motion.div>
      <h3 className="mb-1 text-lg font-bold text-text">Chưa có bài viết nào</h3>
      <p className="text-sm text-text-subtle">Hãy là người đầu tiên chia sẻ với cộng đồng cựu sinh viên.</p>
    </div>
  )
}


/**
 * Trang bảng tin cộng đồng (UC15 - View community Feed).
 * Lấy dữ liệu qua `useFeed` (infinite scroll), áp dụng phân quyền theo vai trò
 * (Guest chỉ đọc; Student/Alumni đăng bài & tương tác) và xử lý đầy đủ các
 * trạng thái loading / empty / error / permission.
 */
export function FeedPage() {
  // === Bước 1: State cục bộ — bộ lọc loại bài viết, mở/đóng modal & bài viết đang sửa (UC14/UC22) ===
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerDefaultType, setComposerDefaultType] = useState<PostType>('normal')
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState<Post | null>(null)
  const [reportingPost, setReportingPost] = useState<Post | null>(null)
  const [sharingPost, setSharingPost] = useState<Post | null>(null)
  const [cancellingEventPost, setCancellingEventPost] = useState<Post | null>(null)

  const cancelEventMutation = useCancelEvent()

  // Danh sách các bài viết người dùng vừa đăng trong phiên làm việc hiện tại
  // (Kiểu Facebook: hiển thị ngay tức thì ở đầu bảng tin trên máy người đăng;
  //  khi bấm F5 / refresh trang, state này tự động biến mất và bảng tin trở về đúng thứ tự thuật toán tự nhiên)
  const [sessionCreatedPosts, setSessionCreatedPosts] = useState<Post[]>([])

  const handlePostCreated = (newPost: Post) => {
    setSessionCreatedPosts((prev) => [newPost, ...prev.filter((p) => p.id !== newPost.id)])
  }

  const globalKeyword = useSearchStore((s) => s.keyword)
  const [debouncedKeyword, setDebouncedKeyword] = useState(globalKeyword)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(globalKeyword)
    }, 400)
    return () => clearTimeout(handler)
  }, [globalKeyword])

  // === Bước 2: Lấy phiên đăng nhập & tính quyền (RBAC) ===
  const user = useAuthStore((s) => s.user)

  // Người xem hiện tại: phiên đăng nhập thật hoặc null (Guest).
  const viewer: AuthUser | null = user ?? null
  const isGuest = !viewer
  // Chỉ Student/Alumni mới được đăng bài & tương tác (Admin không phải người đăng).
  const canPost = !!viewer && (viewer.role === 'STUDENT' || viewer.role === 'ALUMNI')
  const canReport = canPost

  const handleStartEdit = (p: Post) => {
    setEditingPost(p)
    setComposerOpen(true)
  }

  const handleOpenComposer = (type?: PostType) => {
    setComposerDefaultType(type ?? 'normal')
    setComposerOpen(true)
  }

  const handleCloseComposer = () => {
    setComposerOpen(false)
    setEditingPost(null)
  }

  // === Bước 3: Gọi dữ liệu bảng tin qua hook infinite-query với thuật toán thông minh tích hợp ===
  const {
    data,
    isLoading,          // đang tải trang đầu tiên
    isError,            // gọi API thất bại
    error,              // đối tượng lỗi (dùng lấy message)
    refetch,            // tải lại (nút Thử lại)
    fetchNextPage,      // tải trang kế tiếp
    hasNextPage,        // còn trang để tải không
    isFetchingNextPage, // đang tải trang kế tiếp
  } = useFeed(filter, debouncedKeyword)

  // === Bước 4: Gộp tất cả trang đã tải thành một danh sách bài viết phẳng ===
  const serverPosts = data?.pages.flatMap((p) => p.items) ?? []
  const sessionFilteredServerPosts = serverPosts.filter(
    (sp) => !sessionCreatedPosts.some((cp) => String(cp.id) === String(sp.id))
  )
  const posts = filter === 'all'
    ? [...sessionCreatedPosts, ...sessionFilteredServerPosts]
    : [...sessionCreatedPosts.filter((p) => p.type === filter), ...sessionFilteredServerPosts]

  // Tự động tải thêm bài viết (Infinite Scroll kiểu Facebook) khi người dùng cuộn tới cuối trang
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: '300px', threshold: 0.1 }
    )

    const currentTarget = loadMoreRef.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // === Bước 5: Render — cột trái (feed) + cột phải (gợi ý) ===
  return (
    <div className="mx-auto flex max-w-6xl items-start justify-center gap-8">
      {/* ============ CỘT TRÁI: BẢNG TIN CHÍNH ============ */}
      <div className="w-full max-w-[640px] shrink-0 space-y-5">
        {/* Khối A: Ô soạn bài chỉ hiện cho Student/Alumni. Guest/Admin không thấy gì ở đây —
            Guest khi tương tác sẽ được mời đăng nhập qua popup (kiểu Facebook). */}
        {canPost && viewer && (
          <>
            <Reveal>
              <Composer viewer={viewer} onOpen={handleOpenComposer} />
            </Reveal>
            {/* Modal soạn & đăng / chỉnh sửa bài viết (UC14 / UC22) */}
            <CreatePostModal
              open={composerOpen}
              onClose={handleCloseComposer}
              viewer={viewer}
              editPost={editingPost ?? undefined}
              defaultType={composerDefaultType}
              onPostCreated={handlePostCreated}
            />
          </>
        )}

        {/* Khối B: Bộ lọc danh mục bài viết (phong cách Facebook / Instagram - 1 dòng duy nhất) */}
        <div className="no-scrollbar flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-surface-2 p-1 w-fit">
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-sm sm:px-4 font-semibold transition-colors duration-200 cursor-pointer',
                  isActive
                    ? 'bg-surface text-primary-solid shadow-raised font-bold'
                    : 'text-text-muted hover:text-text hover:bg-surface/50'
                )}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        {/* Khối C: Vùng nội dung theo trạng thái, xét lần lượt:
            1) loading  → khung xương skeleton
            2) error    → thẻ lỗi + nút Thử lại (MSG05)
            3) rỗng     → thông báo "Chưa có bài viết nào"
            4) có dữ liệu → danh sách bài viết + nút tải thêm */}
        {isLoading ? (
          // (1) Đang tải trang đầu: hiển thị 3 skeleton
          <div className="space-y-5">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : isError ? (
          // (2) Lỗi tải: cho phép người dùng thử lại
          <FeedError message={(error as Error)?.message} onRetry={() => refetch()} />
        ) : posts.length === 0 ? (
          // (3) Không có bài viết nào
          debouncedKeyword ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/50 p-12 text-center">
              <Search size={48} className="mb-4 text-brand-300 drop-shadow-sm" />
              <h3 className="mb-1 text-lg font-bold text-text">Không tìm thấy kết quả</h3>
              <p className="text-sm text-text-subtle">
                Không có bài viết nào khớp với từ khóa "<span className="font-semibold">{debouncedKeyword}</span>"
              </p>
            </div>
          ) : (
            <FeedEmpty />
          )
        ) : (
          // (4) Có dữ liệu: render danh sách + điều khiển phân trang
          <>
            <div className="space-y-5">
              {posts.map((p) => (
                <Reveal key={p.id} duration={0.6}>
                  <PostCard
                    post={p}
                    canInteract={!isGuest}
                    canReport={canReport}
                    currentUserId={viewer?.id}
                    currentUserName={viewer?.name}
                    onEdit={handleStartEdit}
                    onDelete={setDeletingPost}
                    onReport={setReportingPost}
                    onShare={setSharingPost}
                    onCancelEvent={setCancellingEventPost}
                  />
                </Reveal>
              ))}
            </div>

            {/* Vùng tự động tải thêm trang (Infinite scroll sentinel kiểu Facebook) */}
            <div ref={loadMoreRef} className="py-4 text-center">
              {isFetchingNextPage && (
                <div className="flex items-center justify-center gap-2 text-sm text-text-subtle">
                  <Loader2 size={18} className="animate-spin text-primary-solid" />
                  <span>Đang tải thêm bài viết…</span>
                </div>
              )}
              {!hasNextPage && posts.length > 0 && (
                <p className="text-sm text-text-subtle">Bạn đã xem hết bảng tin 🎉</p>
              )}
            </div>

            {deletingPost && (
              <DeletePostModal
                open={!!deletingPost}
                onClose={() => setDeletingPost(null)}
                post={deletingPost}
                onDeleted={() => {
                   if (deletingPost) {
                     setSessionCreatedPosts((prev) => prev.filter((p) => String(p.id) !== String(deletingPost.id)))
                   }
                   setDeletingPost(null)
                   refetch()
                }}
              />
            )}
            {reportingPost && (
              <ReportPostModal
                open={!!reportingPost}
                postId={reportingPost.id}
                onClose={() => setReportingPost(null)}
              />
            )}
            {sharingPost && (
              <ShareModal
                isOpen={!!sharingPost}
                onClose={() => setSharingPost(null)}
                post={sharingPost}
              />
            )}
            {cancellingEventPost && (
              <CancelEventModal
                isOpen={!!cancellingEventPost}
                onClose={() => setCancellingEventPost(null)}
                onConfirm={() => {
                  const eventId = cancellingEventPost.event?.id ?? cancellingEventPost.eventId ?? cancellingEventPost.id
                  if (!eventId) return
                  cancelEventMutation.mutate(
                    { eventId },
                    {
                      onSuccess: (res) => {
                        toast.success(res.message || 'Đã hủy sự kiện thành công!')
                        setCancellingEventPost(null)
                        refetch()
                      },
                      onError: (err: any) => {
                        toast.error(
                          err.response?.data?.message ||
                            err.message ||
                            'Không thể hủy sự kiện. Vui lòng thử lại.'
                        )
                      },
                    }
                  )
                }}
                isPending={cancelEventMutation.isPending}
                eventTitle={cancellingEventPost.event?.title}
              />
            )}
          </>
        )}
      </div>

      {/* ============ CỘT PHẢI: GỢI Ý (ẩn trên mobile) ============
          Gồm 4 mục: gợi ý theo dõi, sự kiện sắp tới, Q&A nổi bật, CTA xác thực.
          Các mục này dùng dữ liệu tĩnh (mock) thuộc UC khác, chỉ hỗ trợ hiển thị. */}
      <aside className="hidden w-[320px] shrink-0 space-y-5 lg:block">
        {/* Mục 1: Gợi ý kết nối (UC10 - View Connection Suggestions) */}
        <Reveal direction="left">
          <ConnectionSuggestionsWidget limit={4} />
        </Reveal>

        {/* Mục 2: Gợi ý sự kiện sắp tới */}
        <Reveal direction="left" delay={0.1}>
          <UpcomingEventsWidget limit={3} />
        </Reveal>
      </aside>
    </div>
  )
}
