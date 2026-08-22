/**
 * PostDetailPage — Trang chi tiết bài viết (UC16 - View Post Detail).
 *
 * Trách nhiệm:
 *  - Lấy chi tiết 1 bài viết qua `usePostDetail` và luồng bình luận (chỉ đọc) qua `useComments`.
 *  - Áp dụng phân quyền theo vai trò: Guest chỉ xem bài PUBLIC; bài MEMBERS trả 403 (mời đăng nhập).
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / không tồn tại-đã ẩn (404) / không có quyền (403)
 *    / lỗi hệ thống (retry) / thành công.
 *  - Thành viên (Student/Alumni) đăng bình luận qua ô soạn (UC18); Guest được mời đăng nhập.
 */
import { useState, useEffect, useRef, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Flag,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Loader2,
  AlertTriangle,
  Lock,
  Inbox,
  X,
  Send,
  Clock,
  MapPin,
  Users,
  ExternalLink,
  CalendarPlus,
  Briefcase,
} from 'lucide-react'
import { Avatar, Badge, Card, Skeleton, EmptyState, ImageCarousel } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { compact, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { usePostDetail, useComments, useCreateComment } from '@/features/post'
import type { Comment } from '@/features/post'
import { useToggleLike, CreatePostModal } from '@/features/feed'

/** Nhãn + tông màu badge cho từng loại bài viết (đồng bộ với bảng tin UC15). */
const TYPE_META: Record<string, { label: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }> = {
  achievement: { label: 'Thành tựu', tone: 'gold' },
  recruitment: { label: 'Tuyển dụng', tone: 'aqua' },
  event: { label: 'Sự kiện', tone: 'violet' },
  normal: { label: 'Bài viết', tone: 'brand' },
}

/** Nút quay lại bảng tin, hiển thị ở đầu mọi trạng thái của trang. */
function BackToFeed() {
  return (
    <Link
      to="/app"
      className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-plum-900"
    >
      <ArrowLeft size={16} /> Quay lại bảng tin
    </Link>
  )
}

/** Khung xương hiển thị trong lúc tải chi tiết bài viết lần đầu. */
function PostDetailSkeleton() {
  return (
    <Card hover={false} className="p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="mt-5 h-56 w-full rounded-2xl" />
    </Card>
  )
}

/**
 * Trạng thái lỗi khi tải chi tiết thất bại (MSG-POST-03) — có nút Thử lại.
 * @param message Thông điệp lỗi trả về
 * @param onRetry Hàm gọi lại API
 */
function PostError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-300/40 text-coral-600">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được bài viết</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>
    </Card>
  )
}

/** Trạng thái bài viết không tồn tại hoặc đã bị ẩn/gỡ (404 — MSG-POST-02, BR-08/BR-11). */
function PostNotAvailable() {
  return (
    <EmptyState
      icon={<Inbox size={24} />}
      title="Bài viết này không còn khả dụng"
      description="Bài viết có thể đã bị gỡ hoặc không tồn tại."
      action={
        <ButtonLink to="/app" variant="secondary" size="sm">
          Về bảng tin
        </ButtonLink>
      }
    />
  )
}

/** Trạng thái Guest cố xem bài MEMBERS (403 — MSG-POST-04, BR-12): mời đăng nhập. */
function PostForbidden() {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-600">
        <Lock size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Bài viết dành cho thành viên</p>
        <p className="mt-1 text-sm text-plum-500">Đăng nhập để xem nội dung bài viết này.</p>
      </div>
      <Link
        to="/login"
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-brand-700 hover:-translate-y-0.5"
      >
        Đăng nhập <ArrowRight size={15} />
      </Link>
    </Card>
  )
}

/**
 * Thẻ hiển thị đầy đủ nội dung một bài viết ở màn chi tiết.
 * @param post Dữ liệu bài viết đã chuẩn hóa
 * @param canInteract Người xem có quyền tương tác (đã đăng nhập) hay không
 */
function PostDetailCard({
  post,
  canInteract,
  currentUserName,
  onEdit,
}: {
  post: import('@/features/feed').Post
  canInteract: boolean
  currentUserName?: string
  onEdit?: () => void
}) {
  const meta = TYPE_META[post.type] ?? TYPE_META.normal
  const guardTitle = canInteract ? undefined : 'Đăng nhập để tương tác'
  const isAuthor = !!currentUserName && post.author === currentUserName

  // Trạng thái thích cục bộ (UC17) — khởi tạo từ dữ liệu bài viết đã tải.
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState(post.likes)
  const toggleLike = useToggleLike()

  /**
   * Thích/bỏ thích bài viết (UC17): cập nhật lạc quan, đồng bộ theo phản hồi backend,
   * hoàn tác khi lỗi. Guest đã bị chặn ở lớp `disabled` nên chỉ chạy khi có quyền.
   */
  const handleLike = () => {
    if (!canInteract) return
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

  return (
    <Card hover={false} className="overflow-hidden">
      <div className="p-6">
        {/* Header: avatar, tên tác giả, badge loại bài, chức danh · thời gian */}
        <div className="flex items-center gap-3">
          <Link
            to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
            className="shrink-0 transition-transform duration-200 hover:scale-105"
            title={`Xem hồ sơ của ${post.author}`}
          >
            <Avatar src={post.avatar} name={post.author} size={52} verified={post.verified} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-bold text-plum-900">
              <Link
                to={post.authorId ? `/app/profile?userId=${post.authorId}` : '/app/profile'}
                className="truncate hover:underline hover:text-brand-600 transition-colors"
                title={`Xem hồ sơ của ${post.author}`}
              >
                {post.author}
              </Link>
              <Badge tone={meta.tone} className="px-2 py-0.5 text-[10px]">{meta.label}</Badge>
            </p>
            <p className="truncate text-xs text-plum-400">{post.role ? `${post.role} · ` : ''}{post.time}</p>
          </div>
          {isAuthor && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Chỉnh sửa bài viết"
              title="Chỉnh sửa bài viết"
              className="inline-flex items-center gap-1.5 rounded-lg border border-plum-900/10 px-3 py-1.5 text-xs font-semibold text-plum-600 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900"
            >
              <Pencil size={14} /> Chỉnh sửa
            </button>
          )}
        </div>

        {/* Nội dung đầy đủ (không cắt dòng như thẻ ở bảng tin) */}
        {post.type !== 'event' && post.type !== 'recruitment' && (
          <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-plum-800">{post.text}</p>
        )}
      </div>

      {/* --- Thẻ thông tin Tuyển dụng (nếu là bài recruitment) --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-6 mb-4 mt-4 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm ring-1 ring-brand-50 transition-all">
          {/* Header Tuyển dụng */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-brand-100/30 px-6 py-4">
            <h3 className="flex items-center gap-2 font-bold text-brand-900 text-lg">
              <Briefcase size={20} className="text-brand-600" />
              <span>Tuyển dụng: <span className="text-plum-900">{post.job.title}</span></span>
            </h3>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#F27024] px-4 py-2 text-sm font-bold text-white hover:bg-[#d96010] transition-colors"
              >
                Ứng tuyển <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="p-6">
            <div className="mb-6 rounded-xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-base font-bold text-plum-900 mb-3">Công ty: {post.job.company}</p>
              
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                 <div>
                   <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Địa điểm</p>
                   <div className="flex flex-wrap gap-2 text-sm text-plum-800 font-medium">
                     {post.job.location && (
                       <span className="inline-flex items-center gap-1">
                         <MapPin size={15} className="text-brand-500" /> {post.job.location}
                       </span>
                     )}
                   </div>
                 </div>
                 <div>
                   <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mức lương & Liên hệ</p>
                   <div className="flex flex-col gap-1.5 text-sm font-medium text-plum-800">
                     {(post.job.salaryMin || post.job.salaryMax) ? (
                       <span className="inline-flex items-center gap-1">
                          <span className="font-semibold text-emerald-600">
                             {post.job.salaryMin && post.job.salaryMax
                               ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND đến ${post.job.salaryMax.toLocaleString('vi-VN')} VND`
                               : post.job.salaryMin
                               ? `Từ ${post.job.salaryMin.toLocaleString('vi-VN')} VND`
                               : `Lên đến ${post.job.salaryMax?.toLocaleString('vi-VN')} VND`}
                          </span>
                       </span>
                     ) : (
                       <span className="text-slate-400 font-normal">Thỏa thuận</span>
                     )}
                     {post.job.contactEmail && (
                       <span className="inline-flex items-center gap-1.5 text-sm">
                         <Inbox size={15} className="text-plum-400" /> {post.job.contactEmail}
                       </span>
                     )}
                   </div>
                 </div>
              </div>
            </div>

            {/* Mô tả tuyển dụng */}
            {post.text && (
              <div className="mb-6">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">Mô tả công việc:</p>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-plum-800">
                  {post.text}
                </p>
              </div>
            )}

            {/* Ảnh tuyển dụng */}
            {(() => {
              const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : []
              if (imgs.length === 0) return null
              return (
                <div className="overflow-hidden rounded-xl border border-plum-900/10 shadow-sm">
                  <ImageCarousel images={imgs} height={420} altPrefix="Ảnh tuyển dụng" />
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* --- Thẻ thông tin Sự kiện (nếu là bài event) --- */}
      {post.type === 'event' && post.event && (
        <div className="mx-6 mb-4 mt-4 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm ring-1 ring-violet-50 transition-all">
          {/* Header Sự kiện */}
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-violet-100/30 px-6 py-4">
            <h3 className="flex items-center gap-2 font-bold text-violet-900 text-lg">
              <CalendarPlus size={20} className="text-violet-600" />
              <span>Sự kiện: <span className="text-plum-900">{post.event.title}</span></span>
            </h3>
          </div>

          <div className="p-6">
            {/* Thời gian & Địa điểm */}
            <div className="mb-6 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-5 sm:grid-cols-2">
              {post.event.startTime && (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Bắt đầu</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-plum-900">
                    <Clock size={15} className="text-violet-500" />
                    {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                    {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {post.event.endTime ? (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết thúc</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-plum-900">
                    <Clock size={15} className="text-coral-500" />
                    {new Date(post.event.endTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                    {new Date(post.event.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết thúc</p>
                  <p className="text-sm font-semibold text-slate-400">—</p>
                </div>
              )}
              {(post.event.location || post.event.capacity) && (
                <div className="col-span-1 sm:col-span-2 mt-2 border-t border-slate-200/60 pt-4">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Địa điểm & Sức chứa</p>
                  <div className="flex flex-wrap items-center gap-5">
                    {post.event.location && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-plum-800">
                        <MapPin size={15} className="text-brand-500" /> {post.event.location}
                      </p>
                    )}
                    {post.event.capacity && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-plum-800">
                        <Users size={15} className="text-aqua-600" /> Tối đa {post.event.capacity} người
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mô tả sự kiện */}
            {post.text && (
              <div className="mb-6">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-violet-600">Mô tả sự kiện:</p>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-plum-800">
                  {post.text}
                </p>
              </div>
            )}

            {/* Ảnh sự kiện */}
            {(() => {
              const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : []
              if (imgs.length === 0) return null
              return (
                <div className="overflow-hidden rounded-xl border border-plum-900/10 shadow-sm">
                  <ImageCarousel images={imgs} height={420} altPrefix="Ảnh sự kiện" />
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Danh sách ảnh đính kèm (nếu có) — dùng ImageCarousel */}
      {post.type !== 'event' && post.type !== 'recruitment' && post.images && post.images.length > 0 && (
        <ImageCarousel 
          images={post.images} 
          altPrefix={`Ảnh đính kèm bài viết của ${post.author}`}
        />
      )}

      {/* Thanh hành động — số liệu tương tác. Đăng like/comment/repost thuộc UC17/18/21,
          ở UC16 chỉ hiển thị số đếm (nút vô hiệu hóa với Guest theo BR-12). */}
      <div className="flex items-center gap-1 border-t border-plum-900/[0.06] px-6 py-3">
        <button
          disabled={!canInteract}
          onClick={handleLike}
          aria-pressed={liked}
          title={guardTitle}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors enabled:hover:bg-plum-900/[0.04] disabled:cursor-not-allowed disabled:opacity-60',
            liked ? 'text-rose-500 enabled:hover:text-rose-600' : 'text-plum-500 enabled:hover:text-plum-900',
          )}
        >
          <Heart size={18} className={liked ? 'fill-rose-400' : ''} /> {compact(likeCount)}
        </button>
        <button
          disabled={!canInteract}
          title={guardTitle}
          onClick={() => {
            window.location.hash = 'comments'
            document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })
          }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors enabled:hover:bg-brand-500/[0.08] enabled:hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MessageCircle size={18} /> {compact(post.comments)}
        </button>
        <button
          disabled={!canInteract}
          title={guardTitle}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors enabled:hover:bg-plum-900/[0.04] enabled:hover:text-plum-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Repeat2 size={18} /> {compact(post.reposts)}
        </button>
        <button
          disabled={!canInteract}
          title={guardTitle}
          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-400 transition-colors enabled:hover:bg-plum-900/[0.04] enabled:hover:text-plum-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Flag size={17} />
        </button>
        <button aria-label="Lưu bài viết" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.04] hover:text-plum-900">
          <Bookmark size={18} />
        </button>
      </div>

      {/* Khu bình luận */}
      <div className="border-t border-plum-900/[0.08] bg-plum-900/[0.02] p-6 sm:p-8">
        <CommentsSection postId={post.id} commentCount={post.comments} isGuest={!canInteract} />
      </div>
    </Card>
  )
}

/**
 * Một mục bình luận trong luồng bình luận.
 * @param comment Dữ liệu bình luận đã chuẩn hóa
 */
function CommentItem({ comment, onReply }: { comment: Comment; onReply?: (id: string, name: string) => void }) {
  // Bình luận trả lời (có parentId) được thụt lề để thể hiện 1 cấp phân cấp.
  const isReply = !!comment.parentId
  return (
    <div className={cn('flex gap-3', isReply && 'ml-10')}>
      <Link to={comment.authorId ? `/app/profile?userId=${comment.authorId}` : '/app/profile'} className="shrink-0">
        <Avatar src={comment.avatar} name={comment.author} size={isReply ? 32 : 40} verified={comment.verified} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-plum-900/[0.04] px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <Link
              to={comment.authorId ? `/app/profile?userId=${comment.authorId}` : '/app/profile'}
              className="hover:underline"
            >
              <p className="truncate text-sm font-bold text-plum-900 hover:text-brand-600">
                {comment.author}
              </p>
            </Link>
            <span className="shrink-0 text-xs text-plum-400">{comment.time}</span>
          </div>
          {comment.role && <p className="truncate text-xs text-plum-500">{comment.role}</p>}
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-plum-800">{comment.text}</p>
        </div>
        <div className="mt-1 flex items-center pl-1">
          {onReply && (
            <button
              onClick={() => onReply(comment.parentId || comment.id, comment.author)}
              className="text-xs font-bold text-plum-500 hover:text-plum-900 transition-colors"
            >
              Trả lời
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Khung xương một mục bình luận trong lúc tải. */
function CommentSkeleton() {
  return (
    <div className="flex gap-3">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

/** Giới hạn ký tự nội dung bình luận (đồng bộ ràng buộc @Size backend UC18). */
const COMMENT_MAX = 2000

/**
 * Ô soạn bình luận ở cuối trang chi tiết (UC18 - Comment on a post).
 *  - Guest: mời đăng nhập (không hiển thị form).
 *  - Thành viên (Student/Alumni): hiển thị form soạn & gửi bình luận.
 * @param isGuest Người xem hiện tại có phải Guest hay không
 * @param postId  ID bài viết đang được bình luận
 */
function CommentBox({ isGuest, postId, replyingTo, setReplyingTo }: { isGuest: boolean; postId: string; replyingTo: { id: string; name: string } | null; setReplyingTo: (val: { id: string; name: string } | null) => void }) {
  if (isGuest) {
    return (
      <Card hover={false} className="flex items-center justify-between gap-3 p-4">
        <p className="text-sm text-plum-500">Đăng nhập để tham gia bình luận.</p>
        <Link
          to="/login"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-sm transition-transform hover:bg-brand-700 hover:-translate-y-0.5"
        >
          Đăng nhập <ArrowRight size={14} />
        </Link>
      </Card>
    )
  }
  return <CommentComposer postId={postId} replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
}

/**
 * Form soạn & gửi bình luận cho thành viên đã đăng nhập (UC18 - Comment on a post).
 * Tách riêng khỏi {@link CommentBox} để các hook luôn được gọi vô điều kiện (rules-of-hooks).
 * Validate phía client (không rỗng, tối đa {@link COMMENT_MAX} ký tự), hiển thị trạng thái
 * gửi và thông điệp lỗi nghiệp vụ từ Backend; khi thành công dọn ô nhập (hook tự chèn vào luồng).
 * @param postId ID bài viết đang được bình luận
 */
function CommentComposer({ postId, replyingTo, setReplyingTo }: { postId: string; replyingTo: { id: string; name: string } | null; setReplyingTo: (val: { id: string; name: string } | null) => void }) {
  const viewer = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [expanded, setExpanded] = useState(false)
  const createComment = useCreateComment(postId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (replyingTo) {
      setExpanded(true)
    }
  }, [replyingTo])

  useEffect(() => {
    if (expanded && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [expanded, replyingTo])

  const trimmed = content.trim()
  const disabled = trimmed.length === 0 || createComment.isPending

  const collapse = () => {
    setContent('')
    setExpanded(false)
    setReplyingTo(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled) return
    createComment.mutate({ content: trimmed, parentId: replyingTo?.id }, { 
      onSuccess: () => {
        collapse()
      } 
    })
  }

  if (!expanded && !replyingTo) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-5 flex w-full items-center gap-3 rounded-2xl card-surface p-3.5 text-left transition-colors hover:bg-plum-900/[0.02]"
      >
        <Avatar src={viewer?.avatarUrl ?? ''} name={viewer?.name ?? 'Bạn'} size={36} verified={viewer?.verified} />
        <span className="flex-1 rounded-full bg-plum-900/[0.05] px-4 py-2.5 text-sm text-plum-400">
          Viết bình luận của bạn…
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600">
          <Pencil size={16} />
        </span>
      </button>
    )
  }

  return (
    <Card hover={false} className="mb-4 p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar src={viewer?.avatarUrl ?? ''} name={viewer?.name ?? 'Bạn'} size={34} verified={viewer?.verified} />
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-plum-900">Bình luận của bạn</h3>
          <p className="text-xs text-plum-400">Tham gia thảo luận về bài viết này</p>
        </div>
      </div>

      {replyingTo && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-[#F27024]/10 px-3 py-1.5 text-xs font-semibold text-[#F27024] animate-fade-in w-fit">
          <MessageCircle size={14} />
          Đang trả lời {replyingTo.name}
          <button type="button" onClick={() => setReplyingTo(null)} className="ml-2 hover:text-[#d96010]">
            <X size={14} />
          </button>
        </div>
      )}

      {createComment.isError && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          <AlertTriangle size={16} className="shrink-0" /> {(createComment.error as Error).message}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          maxLength={COMMENT_MAX}
          placeholder={replyingTo ? `Viết câu trả lời cho ${replyingTo.name}...` : "Chia sẻ bình luận của bạn…"}
          className="w-full resize-y rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 py-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-plum-400">
            {content.length.toLocaleString('vi-VN')}/{COMMENT_MAX.toLocaleString('vi-VN')}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" onClick={collapse} disabled={createComment.isPending}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={disabled}
              leftIcon={createComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            >
              {createComment.isPending ? 'Đang gửi…' : 'Gửi bình luận'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}

/**
 * Trang chi tiết bài viết (UC16 - View Post Detail).
 * Lấy dữ liệu qua `usePostDetail` + `useComments`, áp dụng phân quyền theo vai trò và
 * xử lý đầy đủ các trạng thái loading / not-available (404) / forbidden (403) / error / thành công.
 */
export function PostDetailPage() {
  // === Bước 1: Lấy ID bài viết từ URL ===
  const { id = '' } = useParams<{ id: string }>()
  const [editModalOpen, setEditModalOpen] = useState(false)

  // === Bước 2: Lấy phiên đăng nhập & tính quyền (RBAC) ===
  const user = useAuthStore((s) => s.user)
  const isGuest = !user

  // === Bước 3: Gọi dữ liệu chi tiết bài viết ===
  const { data: post, isLoading, isError, error, refetch } = usePostDetail(id)

  // Lỗi có kèm HTTP status (do interceptor `http.ts` đính kèm) để phân biệt trạng thái.
  const status = (error as (Error & { status?: number }) | null)?.status

  return (
    <div className="mx-auto max-w-2xl">
      <BackToFeed />

      {/* Vùng nội dung theo trạng thái tải chi tiết bài viết */}
      {isLoading ? (
        <PostDetailSkeleton />
      ) : isError ? (
        status === 404 ? (
          <PostNotAvailable />
        ) : status === 403 ? (
          <PostForbidden />
        ) : (
          <PostError message={(error as Error)?.message} onRetry={() => refetch()} />
        )
      ) : post ? (
        <>
          <Reveal>
            <PostDetailCard
              post={post}
              canInteract={!isGuest}
              currentUserName={user?.name}
              onEdit={() => setEditModalOpen(true)}
            />
          </Reveal>

          {/* Modal chỉnh sửa bài viết (UC22) */}
          {user && (
            <CreatePostModal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              viewer={user}
              editPost={post}
            />
          )}

        </>
      ) : null}
    </div>
  )
}

/**
 * Khu vực luồng bình luận (chỉ đọc) của bài viết.
 * Tách riêng để chỉ gọi `useComments` khi bài viết đã tải thành công (tránh gọi thừa
 * khi bài không tồn tại/không có quyền).
 * @param postId ID bài viết
 * @param commentCount Số bình luận (lấy từ số đếm dồn của bài viết) để hiển thị tiêu đề
 * @param isGuest Người xem hiện tại có phải Guest hay không
 */
function CommentsSection({
  postId,
  commentCount,
  isGuest,
}: {
  postId: string
  commentCount: number
  isGuest: boolean
}) {
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComments(postId)

  // Gộp tất cả trang bình luận đã tải thành một danh sách phẳng.
  const comments = data?.pages.flatMap((p) => p.items) ?? []

  // Nhóm bình luận: Root -> Các Reply của Root đó
  const rootComments = comments.filter((c) => !c.parentId)
  const repliesByParent = comments.reduce((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = []
      acc[c.parentId].push(c)
    }
    return acc
  }, {} as Record<string, typeof comments>)

  // Làm phẳng lại cây thành danh sách tuyến tính: Root 1, Reply 1.1, Root 2...
  const structuredComments = rootComments.flatMap((root) => [
    root,
    ...(repliesByParent[root.id] ?? []),
  ])
  
  // Đảm bảo không mất bình luận nào (vd: reply mà root nằm ở trang bị thiếu)
  const structuredIds = new Set(structuredComments.map(c => c.id))
  const orphanedComments = comments.filter(c => !structuredIds.has(c.id))

  const handleReply = (id: string, name: string) => {
    setReplyingTo({ id, name })
  }

  return (
    <section id="comments" className="space-y-4">
      <div className="mb-4 flex items-center gap-2.5">
        <MessageCircle size={18} className="text-brand-600" />
        <h2 className="text-lg font-extrabold text-plum-900">Bình luận</h2>
        <span className="grid h-6 min-w-[24px] place-items-center rounded-full bg-brand-500/10 px-2 text-xs font-bold text-brand-700">
          {compact(commentCount)}
        </span>
      </div>

      {/* Ô soạn & đăng bình luận gốc (UC18) */}
      <div id="comments-box">
        <CommentBox isGuest={isGuest} postId={postId} replyingTo={null} setReplyingTo={setReplyingTo} />
      </div>

      {/* Danh sách bình luận theo trạng thái tải */}
      {isLoading ? (
        <div className="space-y-4 pt-1">
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : isError ? (
        <Card hover={false} className="flex items-center justify-between gap-3 p-4">
          <p className="text-sm text-plum-500">Không tải được bình luận.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>Thử lại</Button>
        </Card>
      ) : comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-plum-400">Chưa có bình luận nào — hãy là người đầu tiên bình luận.</p>
      ) : (
        <div className="space-y-4">
          {rootComments.map((root) => {
            const replies = repliesByParent[root.id] || []
            return (
              <div key={root.id} className="space-y-4">
                {/* Bình luận gốc */}
                <CommentItem comment={root} onReply={!isGuest ? handleReply : undefined} />
                
                {/* Các bình luận trả lời */}
                {replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} onReply={!isGuest ? handleReply : undefined} />
                ))}

                {/* Form soạn trả lời hiển thị inline ngay dưới thread này */}
                {replyingTo?.id === root.id && (
                  <div className="ml-10 animate-fade-in">
                    <CommentBox isGuest={isGuest} postId={postId} replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
                  </div>
                )}
              </div>
            )
          })}

          {/* Các bình luận mồ côi (nếu có, để đề phòng lỗi dữ liệu) */}
          {orphanedComments.map((c) => (
            <div key={c.id} className="space-y-4">
              <CommentItem comment={c} onReply={!isGuest ? handleReply : undefined} />
              {replyingTo?.id === c.id && (
                <div className="ml-10 animate-fade-in">
                  <CommentBox isGuest={isGuest} postId={postId} replyingTo={replyingTo} setReplyingTo={setReplyingTo} />
                </div>
              )}
            </div>
          ))}

          {/* Điều khiển tải thêm bình luận */}
          {hasNextPage && (
            <div className="pt-1 text-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <Loader2 size={15} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Xem thêm bình luận'}
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
