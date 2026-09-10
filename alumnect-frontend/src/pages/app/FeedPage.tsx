/**
 * FeedPage — Trang bảng tin cộng đồng (UC15 - View community Feed).
 *
 * Trách nhiệm:
 *  - Lấy dữ liệu bài viết qua hook `useFeed` (TanStack Query, infinite scroll).
 *  - Áp dụng phân quyền theo vai trò: Guest chỉ đọc; Student/Alumni đăng bài & tương tác.
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / rỗng / lỗi (retry) / phân quyền / thành công.
 *  - Lọc bài viết theo loại và tải thêm trang (phân trang).
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Image as ImageIcon,
  CalendarPlus,
  Briefcase,
  Award,
  Trophy,
  Sparkles,
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  Pencil,
  TrendingUp,
  Flag,
  Loader2,
  AlertTriangle,
  Inbox,
  MapPin,
  ExternalLink,
  Clock,
  Users,
  Trash2,
  Share2,
  Ban,
  DollarSign,
} from 'lucide-react'
import { Avatar, Badge, Card, ImageCarousel, toast, ImageViewerModal } from '@/components/ui'
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
    <Card hover={false} className="p-4 border border-slate-200/80 shadow-xs bg-white rounded-2xl">
      <div className="flex items-center gap-3">
        <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={42} verified={viewer.verified} />
        <button
          type="button"
          onClick={() => onOpen()}
          className="h-11 flex-1 rounded-full border border-slate-200/80 bg-slate-50 px-4 text-left text-sm text-slate-400 transition-all hover:bg-slate-100 hover:border-slate-300"
        >
          {firstName} ơi, bạn đang nghĩ gì thế?
        </button>
      </div>
      <div className="mt-3 flex items-center justify-around border-t border-slate-100 pt-2.5 sm:justify-start sm:gap-2">
        <button
          type="button"
          onClick={() => onOpen('normal')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
        >
          <ImageIcon size={18} className="text-sky-500" />
          <span>Ảnh / Video</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('recruitment')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:bg-orange-50 hover:text-[#F27024]"
        >
          <Briefcase size={18} className="text-[#F27024]" />
          <span>Tuyển dụng</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('event')}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
        >
          <CalendarPlus size={18} className="text-indigo-500" />
          <span>Sự kiện</span>
        </button>
        <button
          type="button"
          onClick={() => onOpen('achievement')}
          className="hidden sm:inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:bg-amber-50 hover:text-amber-600"
        >
          <Award size={18} className="text-amber-500" />
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
        "overflow-hidden relative transition-all duration-200 cursor-pointer border border-slate-200/80 shadow-xs hover:shadow-md bg-white rounded-2xl",
        post.type === 'achievement' && "border-amber-300/80 shadow-[0_4px_20px_rgba(251,191,36,0.12)] bg-gradient-to-br from-amber-50/40 via-white to-white"
      )}
    >
      {post.type === 'achievement' && (
        <div className="absolute -top-4 -right-4 p-6 opacity-[0.04] pointer-events-none -rotate-12">
          <Trophy size={160} className="text-amber-600" />
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
            <div className="flex items-center gap-2">
              <Link
                to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                className="truncate font-bold text-slate-900 hover:underline hover:text-[#F27024] transition-colors text-sm sm:text-base"
                title={`Xem hồ sơ của ${post.author}`}
              >
                {post.author}
              </Link>
              <Link to={`/app/posts/${post.id}`}>
                {post.type === 'achievement' ? (
                  <Badge tone={meta.tone} className="px-2.5 py-0.5 text-[10px] cursor-pointer hover:opacity-85 shadow-sm shadow-amber-200/50 border border-amber-300/50 flex items-center gap-1 font-extrabold uppercase tracking-wide">
                    <Sparkles size={10} className="text-amber-600" /> {meta.label}
                  </Badge>
                ) : post.type !== 'normal' ? (
                  <Badge tone={meta.tone} className="px-2 py-0.5 text-[10px] cursor-pointer hover:opacity-85">{meta.label}</Badge>
                ) : null}
              </Link>
            </div>
            <Link to={`/app/posts/${post.id}`} className="block truncate text-xs text-slate-400 hover:text-slate-600 transition-colors mt-0.5">
              {post.role ? `${post.role} · ` : ''}{post.time}
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
          <Link to={`/app/posts/${post.id}`} className="mt-3.5 block">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700 transition-colors hover:text-slate-900">
              {post.text}
            </p>
          </Link>
        )}
      </div>

      {/* --- Phần 3: Khối thông tin Tuyển dụng (nếu là bài recruitment) — Thiết kế phẳng, tinh gọn --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-5 mb-4 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/50 to-amber-50/20 p-4 transition-all hover:border-orange-300">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#F27024]/10 px-2 py-0.5 text-[11px] font-bold text-[#F27024]">
                  <Briefcase size={12} /> Tuyển dụng
                </span>
                <span className="text-xs text-slate-600 font-semibold truncate">{post.job.company}</span>
              </div>
              <h4 className="mt-1.5 text-base font-bold text-slate-900 truncate">
                {post.job.title}
              </h4>
            </div>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-[#F27024] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#d96010] transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                Ứng tuyển <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 border-t border-orange-200/50 pt-2.5 text-xs text-slate-600">
            {post.job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-[#F27024]" /> {post.job.location}
              </span>
            )}
            {(post.job.salaryMin || post.job.salaryMax) ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <DollarSign size={13} />
                {post.job.salaryMin && post.job.salaryMax
                  ? `${post.job.salaryMin.toLocaleString('vi-VN')} - ${post.job.salaryMax.toLocaleString('vi-VN')} VND`
                  : post.job.salaryMin
                  ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND`
                  : `Lên đến ${post.job.salaryMax?.toLocaleString('vi-VN')} VND`}
              </span>
            ) : (
              <span className="text-slate-400">Lương thỏa thuận</span>
            )}
            {post.job.contactEmail && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Inbox size={13} className="text-slate-400" /> {post.job.contactEmail}
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- Phần 3b: Khối thông tin Sự kiện (nếu là bài event) — Thiết kế phẳng, tinh gọn --- */}
      {post.type === 'event' && post.event && (
        <div className="mx-5 mb-4 rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/40 to-violet-50/20 p-4 transition-all hover:border-indigo-300">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                  <CalendarPlus size={12} /> Sự kiện
                </span>
                {post.event.status === 'CANCELLED' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    <Ban size={10} /> Đã hủy
                  </span>
                )}
              </div>
              <h4 className="mt-1.5 text-base font-bold text-slate-900 truncate">
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

          <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-4 border-t border-indigo-200/40 pt-2.5 text-xs text-slate-600">
            {post.event.startTime && (
              <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                <Clock size={13} className="text-indigo-500" />
                {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'short' })}{' '}
                · {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {post.event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={13} className="text-indigo-500" /> {post.event.location}
              </span>
            )}
            {post.event.capacity && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Users size={13} className="text-slate-400" /> Tối đa {post.event.capacity} người
              </span>
            )}
          </div>
        </div>
      )}

      {/* --- Phần 4: Ảnh đính kèm (áp dụng cho tất cả loại bài viết nếu có ảnh) --- */}
      {(() => {
        const imgs = post.images && post.images.length > 0
          ? post.images
          : post.image ? [post.image] : []
        if (imgs.length === 0) return null
        return (
          <ImageCarousel
            images={imgs}
            height={460}
            altPrefix="Ảnh bài viết"
            onImageClick={(url) => setPreviewImage(url)}
          />
        )
      })()}

      {/* --- Phần 5: Thanh hành động — Thích (hoặc Chúc mừng) / Bình luận / Đăng lại / Báo cáo / Lưu.
          Guest bấm bất kỳ nút nào sẽ mở popup mời đăng nhập (kiểu Facebook) theo BR-12 --- */}
      <div className="flex items-center gap-1 p-3 border-t border-slate-100">
        {/* Nút Thích: người đã đăng nhập cập nhật lạc quan tại chỗ; Guest → popup đăng nhập */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleLike()
          }}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100',
            liked ? 'text-rose-500 bg-rose-50' : 'text-slate-600 hover:text-slate-900',
          )}
        >
          {liked ? (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [1.3, 1], opacity: 1 }}
              transition={{ duration: 0.4, type: 'spring', bounce: 0.6 }}
            >
              <Heart size={18} className="fill-rose-500 text-rose-500" />
            </motion.div>
          ) : (
            <Heart size={18} />
          )}
          {compact(likeCount)}
        </button>

        {/* Nút Bình luận: Bấm để mở/đóng inline quick comment trực tiếp trên thẻ bài viết */}
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
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            showComments
              ? 'text-[#F27024] bg-orange-50 font-bold'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          )}
          title={showComments ? 'Thu gọn bình luận' : 'Xem và viết bình luận'}
        >
          <MessageCircle size={18} className={showComments ? 'fill-[#F27024]/20 text-[#F27024]' : ''} />
          {compact(commentCount)}
        </button>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!canInteract) {
              promptLogin('Đăng nhập để chia sẻ bài viết.')
            } else if (onShare) {
              onShare(post)
            }
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Share2 size={18} />
        </button>
        {!isAuthor && (canReport ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReport?.(post)
            }}
            aria-label="Báo cáo bài viết"
            title="Báo cáo bài viết"
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Flag size={17} />
          </button>
        ) : !canInteract ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              promptLogin('Đăng nhập để báo cáo bài viết.')
            }}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <Flag size={17} />
          </button>
        ) : null)}
        <button
          aria-label={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          title={saved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
          onClick={(e) => {
            e.stopPropagation()
            handleSave()
          }}
          className={cn(
            'grid h-9 w-9 place-items-center rounded-lg transition-all duration-200',
            saved
              ? 'text-[#F27024] bg-orange-50 hover:bg-orange-100'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900',
          )}
        >
          {saved ? (
            <motion.div
              initial={{ scale: 0.6 }}
              animate={{ scale: [1.25, 1] }}
              transition={{ duration: 0.3, type: 'spring', bounce: 0.5 }}
            >
              <Bookmark size={18} className="fill-[#F27024] text-[#F27024]" />
            </motion.div>
          ) : (
            <Bookmark size={18} />
          )}
        </button>
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
          className="h-10 w-10 border-4 border-brand-200 border-t-brand-600 rounded-full"
        />
      </div>
      <div className="flex items-center gap-3 opacity-30">
        <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-plum-900/[0.07]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-40 animate-pulse rounded bg-plum-900/[0.07]" />
          <div className="h-3 w-24 animate-pulse rounded bg-plum-900/[0.06]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.06]" />
        <div className="h-3.5 w-11/12 animate-pulse rounded bg-plum-900/[0.06]" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-plum-900/[0.06]" />
      </div>
      <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-plum-900/[0.05]" />
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
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được bảng tin</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>
    </Card>
  )
}

/** Trạng thái rỗng khi cộng đồng chưa có bài viết nào ("No posts yet"). */
function FeedEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-plum-900/10 bg-white/50 p-12 text-center">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="mb-4 text-brand-300 drop-shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
      </motion.div>
      <h3 className="mb-1 text-lg font-bold text-plum-900">Chưa có bài viết nào</h3>
      <p className="text-sm text-plum-500">Hãy là người đầu tiên chia sẻ với cộng đồng cựu sinh viên.</p>
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

  // === Bước 3: Gọi dữ liệu bảng tin qua hook infinite-query ===
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
  const posts = data?.pages.flatMap((p) => p.items) ?? []

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
            />
          </>
        )}

        {/* Khối B: Tabs lọc theo loại bài viết */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/50 backdrop-blur-xs w-fit">
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  'rounded-xl px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-white text-[#F27024] shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-plum-900/10 bg-white/50 p-12 text-center">
              <Search size={48} className="mb-4 text-brand-300 drop-shadow-sm" />
              <h3 className="mb-1 text-lg font-bold text-plum-900">Không tìm thấy kết quả</h3>
              <p className="text-sm text-plum-500">
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

            {/* Điều khiển tải thêm trang (infinite/paged loading) */}
            <div className="pt-1 text-center">
              {hasNextPage ? (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  leftIcon={isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
                >
                  {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm bài viết'}
                </Button>
              ) : (
                <p className="text-sm text-plum-400">Bạn đã xem hết bảng tin 🎉</p>
              )}
            </div>

            {deletingPost && (
              <DeletePostModal
                open={!!deletingPost}
                onClose={() => setDeletingPost(null)}
                post={deletingPost}
                onDeleted={() => {
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
