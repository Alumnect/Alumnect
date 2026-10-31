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
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Image as ImageIcon,
  CalendarPlus,
  Briefcase,
  Award,
  Send,
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
  Bookmark,
  Flag,
} from 'lucide-react'
import { TRANSITION } from '@/lib/motion'
import { Avatar, FadeSwitch, toast, ImageViewerModal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
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
const TYPE_META: Record<string, { labelKey: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }> = {
  achievement: { labelKey: 'feed.achievement', tone: 'gold' },
  recruitment: { labelKey: 'feed.recruitment', tone: 'aqua' },
  event: { labelKey: 'feed.event', tone: 'violet' },
  normal: { labelKey: 'feed.normal', tone: 'brand' },
}

/**
 * Ô soạn bài viết ở đầu bảng tin — chỉ hiển thị cho thành viên đã đăng nhập
 * (Student/Alumni). Guest/Admin không thấy khối này; Guest tương tác sẽ được mời
 * đăng nhập qua popup (BR-12).
 * @param viewer Người dùng hiện tại dùng để hiển thị avatar/tên
 */
function Composer({ viewer, onOpen }: { viewer: AuthUser; onOpen: (type?: PostType) => void }) {
  const { t } = useTranslation()
  const firstName = viewer.name ? viewer.name.trim().split(' ').slice(-1)[0] : t('common.you', 'bạn')
  const quick: { type: PostType; label: string; icon: ReactNode }[] = [
    { type: 'normal', label: t('feed.photoVideo'), icon: <ImageIcon size={18} /> },
    { type: 'recruitment', label: t('feed.recruitment'), icon: <Briefcase size={18} /> },
    { type: 'event', label: t('feed.event'), icon: <CalendarPlus size={18} /> },
    { type: 'achievement', label: t('feed.achievement'), icon: <Award size={18} /> },
  ]
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-3">
        <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={40} verified={viewer.verified} />
        <button
          type="button"
          onClick={() => onOpen()}
          className="h-10 min-w-0 flex-1 truncate text-left text-[15px] text-text-subtle transition-colors hover:text-text-muted"
        >
          {t('feed.createPostPrompt', { name: firstName })}
        </button>
        <Button type="button" size="sm" variant="primary" className="shrink-0 rounded-full px-5" onClick={() => onOpen()}>
          {t('feed.post')}
        </Button>
      </div>
      <div className="mt-1 flex items-center gap-1 pl-[52px]">
        {quick.map((q) => (
          <button
            key={q.type}
            type="button"
            onClick={() => onOpen(q.type)}
            aria-label={q.label}
            title={q.label}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-sm font-medium text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
          >
            {q.icon}
            <span className="hidden sm:inline">{q.label}</span>
          </button>
        ))}
      </div>
    </div>
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
  variant = 'card',
}: {
  post: Post
  /** 'row': một hàng trong danh sách có đường kẻ mảnh (Bảng tin); 'card': thẻ riêng có viền (trang cá nhân…) */
  variant?: 'row' | 'card'
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
  const { t } = useTranslation()
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
  const typeLabel = post.type === 'normal'
    ? t('feed.normal')
    : post.type === 'achievement'
    ? t('feed.achievement')
    : post.type === 'recruitment'
    ? t('feed.recruitment')
    : post.type === 'event'
    ? t('feed.event')
    : t(meta.labelKey)

  // Bài dài chỉ hiện ~6 dòng + "Xem thêm" để các thẻ trong bảng tin có chiều cao gần nhau, dễ quét mắt
  const isLongText = (post.text?.length ?? 0) > 320 || (post.text?.split('\n').length ?? 0) > 6

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
      promptLogin(t('feed.loginToInteract'))
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
      promptLogin(t('feed.loginToSave'))
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
    <article
      onClick={handleCardClick}
      className={cn(
        'relative cursor-pointer transition-colors [contain-intrinsic-size:auto_260px] [content-visibility:auto]',
        variant === 'row'
          ? 'border-b border-border last:border-b-0 hover:bg-surface-2/50'
          : 'overflow-hidden rounded-2xl border border-border bg-surface hover:border-border-strong',
      )}
    >
      <div className="relative z-10 px-4 pt-4 sm:px-5">
        {/* --- Header: avatar, tên, loại bài, vai trò · thời gian, menu "..." --- */}
        <div className="flex items-start gap-3">
          <Link
            to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
            className="shrink-0"
            title={t('feed.viewProfile', { name: post.author })}
          >
            <Avatar src={post.avatar} name={post.author} size={44} verified={post.verified} />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <Link
                to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                className="truncate text-[15px] font-bold text-text hover:underline"
                title={t('feed.viewProfile', { name: post.author })}
              >
                {post.author}
              </Link>
              {post.type !== 'normal' && (
                <Link to={`/app/posts/${post.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-text-muted hover:text-text">
                  {post.type === 'achievement' && <Award size={12} className="text-warning" />}
                  {typeLabel}
                </Link>
              )}
            </div>
            <Link to={`/app/posts/${post.id}`} className="mt-0.5 block truncate text-[13px] text-text-subtle hover:text-text-muted">
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

        {/* --- Nội dung văn bản --- */}
        {post.text && (
          <>
            <p className={cn('mt-3 whitespace-pre-line text-[15px] leading-relaxed text-text', isLongText && 'line-clamp-6')}>{post.text}</p>
            {isLongText && (
              <Link to={`/app/posts/${post.id}`} className="mt-1 inline-block text-sm font-semibold text-text-subtle hover:text-text">
                {t('common.viewMore')}
              </Link>
            )}
          </>
        )}
      </div>

      {/* --- Phần 3: Khối thông tin Tuyển dụng (nếu là bài recruitment) — Thiết kế phẳng, tinh gọn --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-4 mb-1 mt-3 rounded-2xl border border-border p-4 sm:mx-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-solid">
                  <Briefcase size={12} /> {t('feed.recruitment')}
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
                className="shrink-0 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary-solid px-4 text-sm font-bold text-on-primary hover:bg-primary-hover transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {t('feed.applyNow')} <ExternalLink size={12} />
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
                  ? t('feed.salaryRange', {
                      min: post.job.salaryMin.toLocaleString('vi-VN'),
                      max: post.job.salaryMax.toLocaleString('vi-VN'),
                    })
                  : post.job.salaryMin
                  ? t('feed.salaryFrom', { amount: post.job.salaryMin.toLocaleString('vi-VN') })
                  : t('feed.salaryUpTo', { amount: post.job.salaryMax?.toLocaleString('vi-VN') })}
              </span>
            ) : (
              <span className="text-text-subtle">{t('feed.salaryNegotiable')}</span>
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
        <div className="mx-4 mb-1 mt-3 rounded-2xl border border-border p-4 sm:mx-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-info-soft px-2 py-0.5 text-xs font-bold text-info">
                  <CalendarPlus size={12} /> {t('feed.event')}
                </span>
                {post.event.status === 'CANCELLED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">
                    <Ban size={12} /> {t('feed.eventCancelled')}
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
                <Users size={13} className="text-text-subtle" /> {t('feed.maxAttendees', { count: post.event.capacity })}
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
          <div className="px-4 pb-1 pt-3 sm:px-5">
            <div className="overflow-hidden rounded-2xl border border-border">
              {imgs.length === 1 && (
                <img
                  src={imgs[0]}
                  alt={t('feed.postImage', 'Ảnh bài viết')}
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
                <div className="grid grid-cols-2 gap-0.5 bg-surface-3">
                  {imgs.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={t('feed.postImage', 'Ảnh bài viết')}
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
                <div className="grid grid-cols-2 gap-0.5 bg-surface-3">
                  <img
                    src={imgs[0]}
                    alt={t('feed.postImage', 'Ảnh bài viết')}
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
                      alt={t('feed.postImage', 'Ảnh bài viết')}
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
                <div className="grid grid-cols-2 gap-0.5 bg-surface-3">
                  {imgs.slice(0, 3).map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={t('feed.postImage', 'Ảnh bài viết')}
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
                      alt={t('feed.postImage', 'Ảnh bài viết')}
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

      {/* --- Thanh hành động: icon + số, nền chỉ hiện khi rê chuột --- */}
      <div className="flex items-center gap-0.5 px-2.5 pb-2 pt-1 text-text-muted sm:px-3.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleLike()
          }}
          aria-pressed={liked}
          aria-label={liked ? t('feed.unlike') : t('feed.likeAction')}
          className={cn(
            'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-surface-2',
            liked ? 'text-danger' : 'hover:text-danger',
          )}
        >
          <motion.span key={liked ? 'liked' : 'unliked'} className="inline-flex" initial={{ scale: liked ? 0.8 : 1 }} animate={{ scale: 1 }} transition={TRANSITION.bounce}>
            <Heart size={20} className={cn(liked && 'fill-current')} />
          </motion.span>
          {likeCount > 0 && <span className="tabular-nums">{compact(likeCount)}</span>}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (!canInteract) {
              promptLogin(t('feed.loginToComment'))
              return
            }
            setShowComments((prev) => !prev)
          }}
          aria-expanded={showComments}
          aria-label={t('feed.comment')}
          className={cn(
            'inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-2.5 text-sm font-semibold transition-colors hover:bg-surface-2',
            showComments ? 'text-primary-solid' : 'hover:text-text',
          )}
        >
          <MessageCircle size={20} />
          {commentCount > 0 && <span className="tabular-nums">{compact(commentCount)}</span>}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!canInteract) {
              promptLogin(t('feed.loginToShare'))
            } else if (onShare) {
              onShare(post)
            }
          }}
          aria-label={t('feed.sharePost')}
          className="inline-flex h-10 min-w-10 items-center justify-center rounded-full px-2.5 transition-colors hover:bg-surface-2 hover:text-text"
        >
          <Send size={19} />
        </button>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            aria-label={saved ? t('feed.unsave') : t('feed.save')}
            aria-pressed={saved}
            onClick={(e) => {
              e.stopPropagation()
              handleSave()
            }}
            className={cn('inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-2', saved ? 'text-primary-solid' : 'hover:text-text')}
          >
            <Bookmark size={20} className={cn(saved && 'fill-current')} />
          </button>
          {!isAuthor && (canReport || !canInteract) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                if (canReport) onReport?.(post)
                else promptLogin(t('feed.loginToReport'))
              }}
              aria-label={t('feed.report')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <Flag size={19} />
            </button>
          )}
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
        alt={post.text?.slice(0, 50) || t('feed.postImage', 'Ảnh bài viết')}
        senderName={post.author}
        senderAvatar={post.avatar}
        time={post.time}
      />
    </article>
  )
}

/** Khung xương (skeleton) hiển thị trong lúc tải bảng tin lần đầu. */
function PostSkeleton() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5" role="status" aria-label={t('feed.loadingPosts', 'Đang tải bài viết')}>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-surface-3" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-40 animate-pulse rounded bg-surface-3" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-3" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-surface-3" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface-3" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-surface-3" />
      </div>
    </div>
  )
}

/**
 * Trạng thái lỗi khi tải bảng tin thất bại (MSG05) — hiển thị nút Thử lại.
 * @param message Thông điệp lỗi trả về
 * @param onRetry Hàm gọi lại API
 */
function FeedError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <AlertTriangle size={32} className="text-danger" aria-hidden />
      <div>
        <p className="font-bold text-text">{t('feed.loadError')}</p>
        <p className="mt-1 text-sm text-text-subtle">{message ?? t('feed.loadErrorDesc')}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>{t('common.tryAgain')}</Button>
    </div>
  )
}

/** Trạng thái rỗng khi cộng đồng chưa có bài viết nào ("No posts yet"). */
function FeedEmpty() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <Inbox size={40} className="mb-3 text-text-subtle" aria-hidden />
      <h3 className="mb-1 text-lg font-bold text-text">{t('feed.emptyFeed')}</h3>
      <p className="text-sm text-text-subtle">{t('feed.emptyFeedDesc')}</p>
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
  const { t } = useTranslation()
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

  const filters: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: t('feed.all') },
    { key: 'achievement', label: t('feed.achievement') },
    { key: 'recruitment', label: t('feed.recruitment') },
    { key: 'event', label: t('feed.event') },
  ]

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
    <div className="mx-auto grid max-w-[1216px] grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,0.8fr)_620px_minmax(0,1.2fr)]">
      {/* ============ CỘT TRÁI: BẢNG TIN CHÍNH ============ */}
      <div className="mx-auto w-full min-w-0 max-w-[620px] xl:col-start-2">
        <div className="space-y-4">
          {/* Ô soạn bài chỉ hiện cho Student/Alumni. Guest/Admin không thấy — Guest tương tác sẽ được mời đăng nhập qua popup. */}
          {canPost && viewer && (
            <>
              <Composer viewer={viewer} onOpen={handleOpenComposer} />
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

          {/* Bộ lọc theo loại bài viết: tab gạch chân chia đều (kiểu Threads) */}
          <div role="tablist" aria-label={t('feed.filterByType', 'Lọc bài viết theo loại')} className="flex border-b border-border-strong/60">
            {filters.map((f) => {
              const isActive = filter === f.key
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'relative h-12 min-w-0 flex-1 truncate px-0.5 text-sm font-semibold transition-colors',
                    isActive ? 'text-text' : 'text-text-subtle hover:text-text-muted',
                  )}
                >
                  {f.label}
                  {isActive && <motion.span layoutId="feed-tab-underline" transition={TRANSITION.indicator} className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary-solid" />}
                </button>
              )
            })}
          </div>

          <FadeSwitch id={`${filter}-${isLoading ? "loading" : isError ? "error" : posts.length === 0 ? "empty" : "list"}`}>
          {isLoading ? (
            <div className="space-y-4">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : isError ? (
            <div className="rounded-2xl border border-border bg-surface">
              <FeedError message={(error as Error)?.message} onRetry={() => refetch()} />
            </div>
          ) : posts.length === 0 ? (
            debouncedKeyword ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface px-6 py-16 text-center">
                <Search size={36} className="mb-3 text-text-subtle" aria-hidden />
                <h3 className="mb-1 text-lg font-bold text-text">{t('feed.searchNoResults')}</h3>
                <p className="text-sm text-text-subtle">
                  {t('feed.searchNoResultsDesc', { keyword: debouncedKeyword })}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface">
                <FeedEmpty />
              </div>
            )
          ) : (
            <>
              <div className="space-y-4">
              {posts.map((p) => (
                <PostCard
                  key={p.id}
                  variant="card"
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
              ))}
              </div>
              {/* Vùng tự động tải thêm trang (Infinite scroll sentinel) */}
              <div ref={loadMoreRef} className="py-5 text-center">
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2 text-sm text-text-subtle">
                    <Loader2 size={18} className="animate-spin text-primary-solid" />
                    <span>{t('feed.loadingMore')}</span>
                  </div>
                )}
                {!hasNextPage && posts.length > 0 && <p className="text-sm text-text-subtle">{t('feed.endOfFeed')}</p>}
              </div>
            </>
          )}
          </FadeSwitch>
        </div>

        {/* Các hộp thoại của bài viết */}
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
        {reportingPost && <ReportPostModal open={!!reportingPost} postId={reportingPost.id} onClose={() => setReportingPost(null)} />}
        {sharingPost && <ShareModal isOpen={!!sharingPost} onClose={() => setSharingPost(null)} post={sharingPost} />}
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
                    toast.success(res.message || t('event.cancelEventSuccess', 'Đã hủy sự kiện thành công!'))
                    setCancellingEventPost(null)
                    refetch()
                  },
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onError: (err: any) => {
                    toast.error(err.response?.data?.message || err.message || t('event.cancelEventError', 'Không thể hủy sự kiện. Vui lòng thử lại.'))
                  },
                },
              )
            }}
            isPending={cancelEventMutation.isPending}
            eventTitle={cancellingEventPost.event?.title}
          />
        )}
      </div>

      {/* ============ CỘT PHẢI: GỢI Ý (ẩn trên mobile) ============
          Gồm 4 mục: gợi ý theo dõi, sự kiện sắp tới, Q&A nổi bật, CTA xác thực.
          Các mục này dùng dữ liệu tĩnh (mock) thuộc UC khác, chỉ hỗ trợ hiển thị. */}
      <aside className="sticky top-24 hidden w-full space-y-4 xl:col-start-3 xl:block xl:max-w-[300px]">
        {/* Mục 1: Gợi ý kết nối (UC10 - View Connection Suggestions) */}
        <ConnectionSuggestionsWidget limit={4} />

        {/* Mục 2: Gợi ý sự kiện sắp tới */}
        <UpcomingEventsWidget limit={3} />
      </aside>
    </div>
  )
}
