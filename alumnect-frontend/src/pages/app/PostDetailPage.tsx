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
  Send,
  AlertCircle,
  Clock,
  MapPin,
  Users,
  ExternalLink,
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
  achievement: { label: 'Achievement', tone: 'gold' },
  recruitment: { label: 'Hiring', tone: 'aqua' },
  event: { label: 'Event', tone: 'violet' },
  normal: { label: 'Post', tone: 'brand' },
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
          <Avatar src={post.avatar} name={post.author} size={52} verified={post.verified} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-bold text-plum-900">
              <span className="truncate">{post.author}</span>
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
        <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-plum-800">{post.text}</p>
      </div>

      {/* --- Thẻ thông tin Tuyển dụng (nếu là bài recruitment) --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-6 mb-4 rounded-xl border border-aqua-200 bg-aqua-50/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-bold text-plum-900 truncate">{post.job.title}</p>
              <p className="text-sm text-plum-600 font-medium">{post.job.company}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-plum-500">
                {post.job.employmentType && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-aqua-100 px-2 py-0.5 font-semibold text-aqua-700">
                    {post.job.employmentType.replace('_', ' ')}
                  </span>
                )}
                {post.job.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {post.job.location}
                  </span>
                )}
                {(post.job.salaryMin || post.job.salaryMax) && (
                  <span className="inline-flex items-center gap-1">
                    {post.job.salaryMin ? post.job.salaryMin.toLocaleString('vi-VN') : '?'}
                    {' — '}
                    {post.job.salaryMax ? post.job.salaryMax.toLocaleString('vi-VN') : '?'}
                    {' ₫'}
                  </span>
                )}
              </div>
            </div>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#F27024] px-3 py-2 text-xs font-bold text-white hover:bg-[#d96010] transition-colors"
              >
                Ứng tuyển <ExternalLink size={12} />
              </a>
            )}
          </div>
          {post.job.contactEmail && (
            <p className="mt-2 text-xs text-plum-400">Liên hệ: {post.job.contactEmail}</p>
          )}
        </div>
      )}

      {/* --- Thẻ thông tin Sự kiện (nếu là bài event) --- */}
      {post.type === 'event' && post.event && (
        <div className="mx-6 mb-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4">
          <p className="font-bold text-plum-900">{post.event.title}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-plum-500">
            {post.event.startTime && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}
                {' '}
                {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {post.event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {post.event.location}
              </span>
            )}
            {post.event.capacity && (
              <span className="inline-flex items-center gap-1">
                <Users size={12} /> Tối đa {post.event.capacity} người
              </span>
            )}
          </div>
        </div>
      )}

      {/* Danh sách ảnh đính kèm (nếu có) — dùng ImageCarousel */}
      {post.images && post.images.length > 0 && (
        <ImageCarousel 
          images={post.images} 
          altPrefix={`Ảnh đính kèm bài viết của ${post.author}`}
        />
      )}

      {/* Thanh hành động — số liệu tương tác. Đăng like/comment/repost thuộc UC17/18/21,
          ở UC16 chỉ hiển thị số đếm (nút vô hiệu hóa với Guest theo BR-12). */}
      <div className="flex items-center gap-1 border-t border-plum-900/[0.06] p-3">
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
    </Card>
  )
}

/**
 * Một mục bình luận trong luồng bình luận.
 * @param comment Dữ liệu bình luận đã chuẩn hóa
 */
function CommentItem({ comment }: { comment: Comment }) {
  // Bình luận trả lời (có parentId) được thụt lề để thể hiện 1 cấp phân cấp.
  const isReply = !!comment.parentId
  return (
    <div className={cn('flex gap-3', isReply && 'ml-10')}>
      <Avatar src={comment.avatar} name={comment.author} size={38} verified={comment.verified} />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl bg-plum-900/[0.035] px-4 py-2.5">
          <p className="flex items-center gap-2 text-sm font-bold text-plum-900">
            <span className="truncate">{comment.author}</span>
          </p>
          {comment.role && <p className="truncate text-[11px] text-plum-400">{comment.role}</p>}
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-plum-800">{comment.text}</p>
        </div>
        <p className="mt-1 pl-1 text-[11px] text-plum-400">{comment.time}</p>
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
function CommentBox({ isGuest, postId }: { isGuest: boolean; postId: string }) {
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
  return <CommentComposer postId={postId} />
}

/**
 * Form soạn & gửi bình luận cho thành viên đã đăng nhập (UC18 - Comment on a post).
 * Tách riêng khỏi {@link CommentBox} để các hook luôn được gọi vô điều kiện (rules-of-hooks).
 * Validate phía client (không rỗng, tối đa {@link COMMENT_MAX} ký tự), hiển thị trạng thái
 * gửi và thông điệp lỗi nghiệp vụ từ Backend; khi thành công dọn ô nhập (hook tự chèn vào luồng).
 * @param postId ID bài viết đang được bình luận
 */
function CommentComposer({ postId }: { postId: string }) {
  const viewer = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const createComment = useCreateComment(postId)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (window.location.hash === '#comments' && textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      textareaRef.current.focus()
    }
  }, [])

  const trimmed = content.trim()
  const disabled = trimmed.length === 0 || createComment.isPending

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (disabled) return
    createComment.mutate({ content: trimmed }, { onSuccess: () => setContent('') })
  }

  return (
    <Card hover={false} className="p-3">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex gap-3">
          <Avatar src={viewer?.avatarUrl ?? ''} name={viewer?.name ?? ''} size={38} verified={viewer?.verified} />
          <div className="min-w-0 flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              maxLength={COMMENT_MAX}
              placeholder="Viết bình luận…"
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm leading-relaxed text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#F27024] focus:bg-white focus:ring-2 focus:ring-[#F27024]/20"
            />

            {/* Thông điệp lỗi nghiệp vụ từ Backend (VD 403/404/400) */}
            {createComment.isError && (
              <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-coral-500">
                <AlertCircle size={13} className="shrink-0" /> {(createComment.error as Error).message}
              </p>
            )}

            <div className="mt-1.5 flex items-center justify-between">
              <span className="pl-1 text-[11px] text-plum-400">{content.length}/{COMMENT_MAX}</span>
              <Button
                type="submit"
                size="sm"
                disabled={disabled}
                leftIcon={createComment.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              >
                {createComment.isPending ? 'Đang gửi…' : 'Gửi'}
              </Button>
            </div>
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

          {/* Khu bình luận — chỉ hiển thị khi bài viết tải thành công */}
          <CommentsSection postId={id} commentCount={post.comments} isGuest={isGuest} />
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

  return (
    <section id="comments" className="mt-6 space-y-4">
      <h2 className="px-1 text-sm font-bold uppercase tracking-wide text-plum-500">
        Bình luận{commentCount ? ` · ${compact(commentCount)}` : ''}
      </h2>

      {/* Ô soạn & đăng bình luận (UC18) */}
      <CommentBox isGuest={isGuest} postId={postId} />

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
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
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
