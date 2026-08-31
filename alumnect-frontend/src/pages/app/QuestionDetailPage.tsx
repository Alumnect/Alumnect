/**
 * QuestionDetailPage — Chi tiết một câu hỏi diễn đàn Q&A (UC39 - View question detail).
 *
 * Trách nhiệm:
 *  - Đọc `id` câu hỏi từ URL (`/app/forum/:id`).
 *  - Lấy chi tiết câu hỏi qua hook `useQuestionDetail` (TanStack Query).
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / không tìm thấy (404) / lỗi (retry) / thành công.
 *  - Ai cũng xem được (Guest/Student/Alumni) vì câu hỏi ACTIVE là nội dung công khai.
 *  - Chỉ HIỂN THỊ chi tiết; vote và trả lời thuộc các UC khác nên ở đây chỉ đọc số liệu.
 */
import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronUp, Clock, AlertTriangle, SearchX, Pencil, Trash2 } from 'lucide-react'
import { Badge, Card, Avatar, ImageCarousel } from '@/components/ui'
import { Button, ButtonLink } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { useQuestionDetail, AnswersSection, AskQuestionModal, DeleteQuestionModal } from '@/features/forum'
import type { QuestionDetail } from '@/features/forum'

/** Chuyển mốc ISO-8601 sang ngày giờ đọc được (VD: "11/07/2026 09:30"), rỗng nếu không hợp lệ. */
function formatDateTime(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Liên kết quay lại danh sách câu hỏi. */
function BackLink() {
  return (
    <Link
      to="/app/forum"
      className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 transition-colors hover:text-brand-600"
    >
      <ArrowLeft size={16} /> Quay lại danh sách câu hỏi
    </Link>
  )
}

/** Khung xương hiển thị trong lúc tải chi tiết câu hỏi. */
function DetailSkeleton() {
  return (
    <Card hover={false} className="p-6 sm:p-8">
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-plum-900/[0.06]" />
        <div className="h-7 w-3/4 animate-pulse rounded bg-plum-900/[0.07]" />
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-plum-900/[0.07]" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 animate-pulse rounded bg-plum-900/[0.06]" />
            <div className="h-3 w-24 animate-pulse rounded bg-plum-900/[0.05]" />
          </div>
        </div>
        <div className="space-y-2.5 pt-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.05]" />
          <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.05]" />
          <div className="h-3.5 w-2/3 animate-pulse rounded bg-plum-900/[0.05]" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Trạng thái không tìm thấy câu hỏi (HTTP 404 — câu hỏi không tồn tại hoặc đã bị ẩn/xóa).
 */
function NotFoundState() {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
        <SearchX size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tìm thấy câu hỏi</p>
        <p className="mt-1 text-sm text-plum-500">
          Câu hỏi này không tồn tại hoặc đã bị ẩn/xóa khỏi diễn đàn.
        </p>
      </div>
      <ButtonLink to="/app/forum" variant="secondary" size="sm" leftIcon={<ArrowLeft size={16} />}>
        Về danh sách câu hỏi
      </ButtonLink>
    </Card>
  )
}

/**
 * Trạng thái lỗi hệ thống khi tải chi tiết thất bại — hiển thị nút Thử lại.
 * @param message Thông điệp lỗi từ backend
 * @param onRetry Hàm gọi lại API
 */
function DetailError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được chi tiết câu hỏi</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>
    </Card>
  )
}

/** Nội dung chi tiết câu hỏi (không bọc Card riêng — đặt chung Card với khu vực câu trả lời). */
function QuestionDetailContent({
  q,
  canEdit,
  onEdit,
  onDelete,
}: {
  q: QuestionDetail
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const postedAt = formatDateTime(q.createdAt)
  return (
    <div className="flex gap-5">
      {/* Cột trái: số vote (chỉ đọc ở UC39 — bình chọn thuộc UC khác) */}
      <div className="hidden flex-col items-center gap-1 sm:flex">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10">
          <ChevronUp size={20} />
        </span>
        <span className="text-sm font-bold text-plum-900">{q.votes}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-plum-400">bình chọn</span>
      </div>

      {/* Cột phải: chủ đề, tiêu đề, thông tin tác giả, nội dung đầy đủ */}
      <div className="min-w-0 flex-1">
        {/* Hàng đầu: nhãn thể loại/ngành (trái) + nút Chỉnh sửa/Xóa (phải, chỉ tác giả — UC46/UC47) */}
        {(q.topic || q.major || canEdit) && (
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {q.topic && <Badge tone="violet" className="px-2.5 py-0.5 text-[10px]">{q.topic}</Badge>}
              {q.major && <Badge tone="aqua" className="px-2.5 py-0.5 text-[10px]">{q.major}</Badge>}
            </div>
            {canEdit && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-plum-900/10 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-plum-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-400/50 hover:bg-brand-500/[0.06] hover:text-brand-600"
                >
                  <Pencil size={13} /> Chỉnh sửa
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-full border border-plum-900/10 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-plum-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-400/50 hover:bg-rose-500/[0.06] hover:text-rose-600"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            )}
          </div>
        )}
        <h1 className="text-2xl font-extrabold leading-snug text-plum-900 sm:text-[1.75rem]">{q.title}</h1>

        {/* Hàng thông tin tác giả + thời gian đăng */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-plum-900/8 pb-5">
          <Link
            to={q.authorId ? `/app/profile?userId=${q.authorId}` : '/app/profile'}
            className="flex items-center gap-3 min-w-0 hover:text-brand-600 transition-colors group"
          >
            <Avatar src={q.avatar} name={q.author} size={40} verified={q.verified} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-plum-900 group-hover:text-brand-600 group-hover:underline">{q.author}</p>
              {q.authorHeadline ? (
                <p className="truncate text-xs text-plum-500">{q.authorHeadline}</p>
              ) : null}
            </div>
          </Link>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-plum-400">
            <Clock size={13} />
            {postedAt ? <span title={postedAt}>{postedAt}</span> : <span>{q.time}</span>}
          </span>
        </div>

        {/* Nội dung đầy đủ của câu hỏi — giữ nguyên xuống dòng của người dùng */}
        <div className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-plum-700">
          {q.body || 'Câu hỏi này chưa có nội dung chi tiết.'}
        </div>

        {/* Ảnh đính kèm của câu hỏi — carousel dùng chung với bài đăng (kéo/vuốt xem tất cả ảnh) */}
        {q.images.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-xl border border-plum-900/10 shadow-sm">
            <ImageCarousel images={q.images} height={420} altPrefix="Ảnh câu hỏi" />
          </div>
        )}

        {/* Số vote (chỉ hiển thị trên mobile do cột vote bên trái bị ẩn) */}
        <div className="mt-5 text-sm sm:hidden">
          <span className="inline-flex items-center gap-1.5 font-semibold text-plum-500">
            <ChevronUp size={15} /> {q.votes} bình chọn
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Trang chi tiết câu hỏi diễn đàn (UC39 - View question detail).
 */
export function QuestionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, error, refetch } = useQuestionDetail(id)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // Quyền chỉnh sửa/xóa (UC46/UC47): chỉ chính TÁC GIẢ câu hỏi (Student/Alumni) mới thấy nút.
  const user = useAuthStore((s) => s.user)
  const canEdit = !!user && !!data && String(user.id) === data.authorId && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  // Phân biệt lỗi 404 (không tìm thấy) với lỗi hệ thống khác để hiển thị đúng trạng thái.
  const notFound = isError && /không tìm thấy|not found|404/i.test((error as Error)?.message ?? '')

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink />
      {isLoading ? (
        <DetailSkeleton />
      ) : notFound ? (
        <NotFoundState />
      ) : isError ? (
        <DetailError message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : data ? (
        // Câu hỏi + câu trả lời nằm chung MỘT card (như bài viết + bình luận trên Facebook/Reddit)
        <Card hover={false} className="overflow-hidden p-0">
          <div className="p-6 sm:p-8">
            <QuestionDetailContent q={data} canEdit={canEdit} onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />
          </div>
          {/* Khu vực câu trả lời (UC41) — nền hơi khác + đường kẻ để tách nhẹ trong cùng card */}
          <div className="border-t border-plum-900/[0.08] bg-plum-900/[0.02] p-6 sm:p-8">
            <AnswersSection questionId={data.id} count={data.answers} />
          </div>
        </Card>
      ) : (
        <NotFoundState />
      )}

      {/* Modal chỉnh sửa câu hỏi (UC46) — mở khi tác giả bấm "Chỉnh sửa" */}
      {editOpen && data && <AskQuestionModal editQuestion={data} onClose={() => setEditOpen(false)} />}

      {/* Modal xác nhận xóa câu hỏi (UC47) — mở khi tác giả bấm "Xóa"; xóa xong điều hướng về danh sách */}
      {deleteOpen && data && (
        <DeleteQuestionModal
          questionId={data.id}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => navigate('/app/forum')}
        />
      )}
    </div>
  )
}
