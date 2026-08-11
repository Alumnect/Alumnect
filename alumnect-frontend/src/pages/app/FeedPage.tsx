/**
 * FeedPage — Trang bảng tin cộng đồng (UC15 - View community Feed).
 *
 * Trách nhiệm:
 *  - Lấy dữ liệu bài viết qua hook `useFeed` (TanStack Query, infinite scroll).
 *  - Áp dụng phân quyền theo vai trò: Guest chỉ đọc; Student/Alumni đăng bài & tương tác.
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / rỗng / lỗi (retry) / phân quyền / thành công.
 *  - Lọc bài viết theo loại và tải thêm trang (phân trang).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Image as ImageIcon,
  CalendarPlus,
  Briefcase,
  Award,
  Heart,
  MessageCircle,
  Repeat2,
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
} from 'lucide-react'
import { Avatar, Badge, Card, ImageCarousel } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Stagger, StaggerItem } from '@/components/motion'
import { ALUMNI, EVENTS, QUESTIONS } from '@/lib/constants'
import { compact, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { AuthUser } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useFeed, useToggleLike, CreatePostModal } from '@/features/feed'
import type { FeedFilter, Post } from '@/features/feed'
import type { PostType } from '@/features/feed/model/post'

/** Nhãn + tông màu badge cho từng loại bài viết. */
const TYPE_META: Record<string, { label: string; tone: 'brand' | 'gold' | 'aqua' | 'violet' }> = {
  achievement: { label: 'Achievement', tone: 'gold' },
  recruitment: { label: 'Hiring', tone: 'aqua' },
  event: { label: 'Event', tone: 'violet' },
  normal: { label: 'Post', tone: 'brand' },
}

/** Các tab lọc bảng tin theo loại bài viết (UC15: lọc theo loại). */
const FILTERS: { key: FeedFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'achievement', label: 'Achievements' },
  { key: 'recruitment', label: 'Hiring' },
  { key: 'event', label: 'Events' },
]

/**
 * Ô soạn bài viết ở đầu bảng tin — chỉ hiển thị cho thành viên đã đăng nhập
 * (Student/Alumni). Guest/Admin không thấy khối này; Guest tương tác sẽ được mời
 * đăng nhập qua popup (BR-12).
 * @param viewer Người dùng hiện tại dùng để hiển thị avatar/tên
 */
function Composer({ viewer, onOpen }: { viewer: AuthUser; onOpen: (type?: PostType) => void }) {
  return (
    <Card hover={false} className="p-4">
      <div className="flex gap-3">
        <Avatar src={viewer.avatarUrl ?? 'https://i.pravatar.cc/120?img=12'} name={viewer.name} size={44} verified={viewer.verified} />
        <button
          type="button"
          onClick={() => onOpen()}
          className="h-11 flex-1 rounded-xl border border-plum-900/10 bg-plum-900/[0.04] px-4 text-left text-sm text-plum-400 transition-colors hover:bg-plum-900/[0.05]"
        >
          Share an achievement, ask, or post a job…
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-plum-900/8 pt-3">
        {[
          { icon: Award, label: 'Achievement', tone: 'text-gold-600', type: 'achievement' },
          { icon: ImageIcon, label: 'Photo', tone: 'text-aqua-500', type: 'normal' },
          { icon: Briefcase, label: 'Job', tone: 'text-brand-600', type: 'recruitment' },
          { icon: CalendarPlus, label: 'Event', tone: 'text-violet-600', type: 'event' },
        ].map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => onOpen(a.type as PostType)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-plum-500 transition-colors hover:bg-plum-900/[0.04]"
          >
            <a.icon size={17} className={a.tone} />
            <span className="hidden sm:inline">{a.label}</span>
          </button>
        ))}
        <Button size="sm" className="ml-auto" onClick={() => onOpen()}>Post</Button>
      </div>
    </Card>
  )
}

/**
 * Thẻ hiển thị một bài viết trên bảng tin.
 * @param post Dữ liệu bài viết
 * @param canInteract Người dùng có quyền tương tác (like/comment) hay không
 */
function PostCard({
  post,
  canInteract,
  currentUserName,
  onEdit,
}: {
  post: Post
  canInteract: boolean
  currentUserName?: string
  onEdit?: (post: Post) => void
}) {
  // Trạng thái thích cục bộ (nguồn sự thật cho UI sau khi tương tác) — khởi tạo từ dữ liệu bài viết.
  const [liked, setLiked] = useState(post.liked)
  const [likeCount, setLikeCount] = useState<number>(post.likes)
  const meta = TYPE_META[post.type] ?? TYPE_META.normal

  // Guest bấm tương tác sẽ mở popup mời đăng nhập (kiểu Facebook) thay vì nút bị vô hiệu hóa.
  const promptLogin = useLoginPrompt((s) => s.open)
  const toggleLike = useToggleLike()

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

  const isAuthor = !!currentUserName && post.author === currentUserName

  return (
    <Card hover={false} className="overflow-hidden">
      <div className="p-5">
        {/* --- Phần 1: Header — avatar, tên tác giả, badge loại bài, thời gian, menu "..." --- */}
        <div className="flex items-center gap-3">
          <Avatar src={post.avatar} name={post.author} size={46} verified={post.verified} />
          {/* Tên tác giả + badge/thời gian: bấm vào mở trang chi tiết bài viết (UC16) */}
          <Link to={`/app/posts/${post.id}`} className="min-w-0 flex-1">
            <p className="flex items-center gap-2 font-bold text-plum-900">
              <span className="truncate hover:underline">{post.author}</span>
              <Badge tone={meta.tone} className="px-2 py-0.5 text-[10px]">{meta.label}</Badge>
            </p>
            <p className="truncate text-xs text-plum-400">{post.role} · {post.time}</p>
          </Link>
          {/* Nút Chỉnh sửa (UC22) chỉ hiển thị cho chính tác giả bài viết */}
          {isAuthor && onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(post)}
              aria-label="Chỉnh sửa bài viết"
              title="Chỉnh sửa bài viết"
              className="inline-flex items-center gap-1.5 rounded-lg border border-plum-900/10 px-2.5 py-1 text-xs font-semibold text-plum-600 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900"
            >
              <Pencil size={13} /> Sửa
            </button>
          ) : (
            <button aria-label="Tùy chọn khác" className="grid h-9 w-9 place-items-center rounded-lg text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900">
              <MoreHorizontal size={18} />
            </button>
          )}
        </div>

        {/* --- Phần 2: Nội dung văn bản (Ẩn đi nếu là bài event hoặc recruitment, vì văn bản đã được gom vào khung riêng) --- */}
        {post.type !== 'event' && post.type !== 'recruitment' && (
          <Link to={`/app/posts/${post.id}`} className="mt-4 block">
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-plum-800 transition-colors hover:text-plum-900">{post.text}</p>
          </Link>
        )}
      </div>

      {/* --- Phần 3: Thẻ thông tin Tuyển dụng (nếu là bài recruitment) --- */}
      {post.type === 'recruitment' && post.job && (
        <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-sm ring-1 ring-brand-50 transition-all hover:shadow-md">
          {/* Header Tuyển dụng */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-gradient-to-r from-brand-50/80 to-brand-100/30 px-5 py-3.5">
            <h3 className="flex items-center gap-2 font-bold text-brand-900">
              <Briefcase size={18} className="text-brand-600" />
              <span>Tuyển dụng: <span className="text-plum-900">{post.job.title}</span></span>
            </h3>
            {post.job.applyUrl && (
              <a
                href={post.job.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#F27024] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d96010] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Ứng tuyển <ExternalLink size={12} />
              </a>
            )}
          </div>

          <div className="p-5">
            <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-base font-bold text-plum-900 mb-1">{post.job.company}</p>
              
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                 <div>
                   <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Địa điểm</p>
                   <div className="flex flex-wrap gap-2 text-sm text-plum-800 font-medium">
                     {post.job.location && (
                       <span className="inline-flex items-center gap-1">
                         <MapPin size={14} className="text-brand-500" /> {post.job.location}
                       </span>
                     )}
                   </div>
                 </div>
                 <div>
                   <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Mức lương & Liên hệ</p>
                   <div className="flex flex-col gap-1.5 text-sm font-medium text-plum-800">
                     {(post.job.salaryMin || post.job.salaryMax) ? (
                       <span className="inline-flex items-center gap-1">
                         <span className="font-semibold text-emerald-600">
                           {post.job.salaryMin ? post.job.salaryMin.toLocaleString('vi-VN') : '?'}
                           {' — '}
                           {post.job.salaryMax ? post.job.salaryMax.toLocaleString('vi-VN') : '?'}
                           {' ₫'}
                         </span>
                       </span>
                     ) : (
                       <span className="text-slate-400 font-normal">Thỏa thuận</span>
                     )}
                     {post.job.contactEmail && (
                       <span className="inline-flex items-center gap-1 text-xs">
                         <Inbox size={12} className="text-plum-400" /> {post.job.contactEmail}
                       </span>
                     )}
                   </div>
                 </div>
              </div>
            </div>

            {/* Mô tả tuyển dụng */}
            {post.text && (
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">Mô tả công việc:</p>
                <Link to={`/app/posts/${post.id}`} className="block">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-plum-800 transition-colors hover:text-plum-900 line-clamp-4">
                    {post.text}
                  </p>
                </Link>
              </div>
            )}

            {/* Ảnh tuyển dụng (nếu có) */}
            {(() => {
              const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : []
              if (imgs.length === 0) return null
              return (
                <div className="overflow-hidden rounded-xl border border-plum-900/10 shadow-sm">
                  <ImageCarousel images={imgs} height={380} altPrefix="Ảnh tuyển dụng" />
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* --- Phần 3b: Thẻ thông tin Sự kiện (nếu là bài event) --- */}
      {post.type === 'event' && post.event && (
        <div className="mx-5 mb-4 overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm ring-1 ring-violet-50 transition-all hover:shadow-md">
          {/* Header Sự kiện */}
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 to-violet-100/30 px-5 py-3.5">
            <h3 className="flex items-center gap-2 font-bold text-violet-900">
              <CalendarPlus size={18} className="text-violet-600" />
              <span>Sự kiện: <span className="text-plum-900">{post.event.title}</span></span>
            </h3>
          </div>

          <div className="p-5">
            {/* Thời gian & Địa điểm */}
            <div className="mb-5 grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2">
              {post.event.startTime && (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Bắt đầu</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-plum-900">
                    <Clock size={14} className="text-violet-500" />
                    {new Date(post.event.startTime).toLocaleDateString('vi-VN', { dateStyle: 'medium' })} {' '}
                    {new Date(post.event.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
              {post.event.endTime ? (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kết thúc</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-plum-900">
                    <Clock size={14} className="text-coral-500" />
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
                <div className="col-span-1 sm:col-span-2 mt-1 border-t border-slate-200/60 pt-3">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Địa điểm & Sức chứa</p>
                  <div className="flex flex-wrap items-center gap-4">
                    {post.event.location && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-plum-800">
                        <MapPin size={14} className="text-brand-500" /> {post.event.location}
                      </p>
                    )}
                    {post.event.capacity && (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-plum-800">
                        <Users size={14} className="text-aqua-600" /> Tối đa {post.event.capacity} người
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mô tả sự kiện */}
            {post.text && (
              <div className="mb-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-violet-600">Mô tả sự kiện:</p>
                <Link to={`/app/posts/${post.id}`} className="block">
                  <p className="whitespace-pre-line text-[14px] leading-relaxed text-plum-800 transition-colors hover:text-plum-900">
                    {post.text}
                  </p>
                </Link>
              </div>
            )}

            {/* Ảnh sự kiện */}
            {(() => {
              const imgs = post.images && post.images.length > 0 ? post.images : post.image ? [post.image] : []
              if (imgs.length === 0) return null
              return (
                <div className="overflow-hidden rounded-xl border border-plum-900/10 shadow-sm">
                  <ImageCarousel images={imgs} height={380} altPrefix="Ảnh sự kiện" />
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* --- Phần 4: Ảnh đính kèm (Ẩn nếu là Sự kiện hoặc Tuyển dụng, vì ảnh đã ở trong khung riêng) --- */}
      {post.type !== 'event' && post.type !== 'recruitment' && (() => {
        const imgs = post.images && post.images.length > 0
          ? post.images
          : post.image ? [post.image] : []
        if (imgs.length === 0) return null
        return <ImageCarousel images={imgs} height={480} altPrefix="Ảnh bài viết" />
      })()}

      {/* --- Phần 4: Thanh hành động — Thích / Bình luận / Đăng lại / Báo cáo / Lưu.
          Guest bấm bất kỳ nút nào sẽ mở popup mời đăng nhập (kiểu Facebook) theo BR-12 --- */}
      <div className="flex items-center gap-1 p-3 border-t border-slate-100">
        {/* Nút Thích: người đã đăng nhập cập nhật lạc quan tại chỗ; Guest → popup đăng nhập */}
        <button
          onClick={handleLike}
          aria-pressed={liked}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100',
            liked ? 'text-rose-500 bg-rose-50' : 'text-slate-600 hover:text-slate-900',
          )}
        >
          <Heart size={18} className={liked ? 'fill-rose-500 text-rose-500' : ''} />
          {compact(likeCount)}
        </button>
        {canInteract ? (
          <Link
            to={`/app/posts/${post.id}#comments`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-[#F27024]/10 hover:text-[#F27024]"
            title="Xem và viết bình luận"
          >
            <MessageCircle size={18} /> {compact(post.comments)}
          </Link>
        ) : (
          <button
            onClick={() => promptLogin('Đăng nhập để bình luận về bài viết.')}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <MessageCircle size={18} /> {compact(post.comments)}
          </button>
        )}
        <button
          onClick={() => { if (!canInteract) promptLogin('Đăng nhập để đăng lại bài viết.') }}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Repeat2 size={18} /> {compact(post.reposts)}
        </button>
        <button
          onClick={() => { if (!canInteract) promptLogin('Đăng nhập để báo cáo bài viết.') }}
          className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <Flag size={17} />
        </button>
        <button
          aria-label="Lưu bài viết"
          onClick={() => { if (!canInteract) promptLogin('Đăng nhập để lưu bài viết.') }}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900"
        >
          <Bookmark size={18} />
        </button>
      </div>
    </Card>
  )
}

/** Khung xương (skeleton) hiển thị trong lúc tải bảng tin lần đầu. */
function PostSkeleton() {
  return (
    <Card hover={false} className="p-5">
      <div className="flex items-center gap-3">
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
    <Card hover={false} className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
        <Inbox size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Chưa có bài viết nào</p>
        <p className="mt-1 text-sm text-plum-500">Hãy là người đầu tiên chia sẻ với cộng đồng cựu sinh viên.</p>
      </div>
    </Card>
  )
}

/**
 * Thẻ khung cho các mục ở cột phải (gợi ý theo dõi, sự kiện, Q&A nổi bật).
 * @param title Tiêu đề của mục
 * @param action Nhãn liên kết hành động phụ (tùy chọn, vd "See all")
 * @param children Nội dung bên trong thẻ
 */
function SidebarCard({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <Card hover={false} className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-plum-900">{title}</h3>
        {action && <Link to="#" className="text-xs font-semibold text-brand-600 hover:text-brand-600">{action}</Link>}
      </div>
      {children}
    </Card>
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

  // === Bước 2: Lấy phiên đăng nhập & tính quyền (RBAC) ===
  const user = useAuthStore((s) => s.user)
  // Người xem hiện tại: phiên đăng nhập thật hoặc null (Guest).
  const viewer: AuthUser | null = user ?? null
  const isGuest = !viewer
  // Chỉ Student/Alumni mới được đăng bài & tương tác (Admin không phải người đăng).
  const canPost = !!viewer && (viewer.role === 'STUDENT' || viewer.role === 'ALUMNI')

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
  } = useFeed(filter)

  // === Bước 4: Gộp tất cả trang đã tải thành một danh sách bài viết phẳng ===
  const posts = data?.pages.flatMap((p) => p.items) ?? []

  // === Bước 5: Render — cột trái (feed) + cột phải (gợi ý) ===
  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      {/* ============ CỘT TRÁI: BẢNG TIN CHÍNH ============ */}
      <div className="space-y-5">
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

        {/* Khối B: Tabs lọc theo loại bài viết (All / Achievements / Hiring / Events) */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
                filter === f.key
                  ? 'bg-gradient-to-r from-[#F27024] to-[#FF8C38] text-white shadow-xs font-bold'
                  : 'bg-slate-200/60 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
              )}
            >
              {f.label}
            </button>
          ))}
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
          <FeedEmpty />
        ) : (
          // (4) Có dữ liệu: render danh sách + điều khiển phân trang
          <>
            <Stagger key={`${filter}-${posts[0]?.id}`} className="space-y-5" gap={0.08}>
              {posts.map((p) => (
                <StaggerItem key={p.id}>
                  <PostCard
                    post={p}
                    canInteract={!isGuest}
                    currentUserName={viewer?.name}
                    onEdit={handleStartEdit}
                  />
                </StaggerItem>
              ))}
            </Stagger>

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
          </>
        )}
      </div>

      {/* ============ CỘT PHẢI: GỢI Ý (ẩn trên mobile) ============
          Gồm 4 mục: gợi ý theo dõi, sự kiện sắp tới, Q&A nổi bật, CTA xác thực.
          Các mục này dùng dữ liệu tĩnh (mock) thuộc UC khác, chỉ hỗ trợ hiển thị. */}
      <aside className="hidden space-y-5 lg:block">
        {/* Mục 1: Gợi ý người để theo dõi */}
        <Reveal direction="left">
          <SidebarCard title="Who to follow" action="See all">
            <ul className="space-y-4">
              {ALUMNI.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <Avatar src={a.avatar} name={a.name} size={40} verified={a.verified} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-plum-900">{a.name}</p>
                    <p className="truncate text-xs text-plum-400">{a.cohort}</p>
                  </div>
                  <Button size="sm" variant="secondary">Follow</Button>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>

        {/* Mục 2: Sự kiện sắp tới */}
        <Reveal direction="left" delay={0.1}>
          <SidebarCard title="Upcoming events" action="All events">
            <ul className="space-y-3">
              {EVENTS.slice(0, 2).map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-plum-900/[0.04] py-1.5 text-center ring-1 ring-inset ring-plum-900/10">
                    <span className="text-[9px] font-bold uppercase text-brand-600">{e.month}</span>
                    <span className="text-base font-extrabold text-plum-900">{e.day}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-plum-900">{e.title}</p>
                    <p className="truncate text-xs text-plum-400">{compact(e.attendees)} attending</p>
                  </div>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>

        {/* Mục 3: Câu hỏi Q&A đang nổi bật */}
        <Reveal direction="left" delay={0.2}>
          <SidebarCard title="Trending Q&A" action="Forum">
            <ul className="space-y-3">
              {QUESTIONS.slice(0, 3).map((q) => (
                <li key={q.id}>
                  <Link to="/app/forum" className="group block">
                    <p className="line-clamp-2 text-sm font-semibold text-plum-800 group-hover:text-brand-600">{q.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-plum-400">
                      <TrendingUp size={12} /> {q.votes} votes · {q.answers} answers
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </SidebarCard>
        </Reveal>
      </aside>
    </div>
  )
}
