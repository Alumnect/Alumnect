/**
 * ForumPage — Danh sách câu hỏi diễn đàn Q&A (UC38 - View question list).
 *
 * Trách nhiệm:
 *  - Lấy danh sách câu hỏi qua hook `useQuestions` (TanStack Query, infinite scroll).
 *  - Lấy danh mục chủ đề qua `useTopics` để dựng bộ lọc.
 *  - Lọc theo chủ đề, sắp xếp (mới nhất / nhiều vote / nhiều trả lời), phân trang.
 *  - Xử lý đầy đủ các trạng thái: loading (skeleton) / rỗng / lỗi (retry) / thành công.
 *  - Ai cũng xem được (Guest/Student/Alumni); nút "Đặt câu hỏi" chỉ hiện với thành viên.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle,
  ChevronUp,
  MessageSquare,
  Clock,
  Flame,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Stagger, StaggerItem } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useQuestions, useTopics } from '@/features/forum'
import type { Question, SortOption } from '@/features/forum'

/** Các tùy chọn sắp xếp — khớp tham số `sort` của backend. */
const SORTS: { key: SortOption; label: string; icon: typeof Clock }[] = [
  { key: 'recent', label: 'Newest', icon: Clock },
  { key: 'votes', label: 'Top voted', icon: Flame },
  { key: 'answers', label: 'Most answered', icon: CheckCircle2 },
]

/** Thẻ hiển thị một câu hỏi trong danh sách. */
function QuestionCard({ q }: { q: Question }) {
  return (
    <Card hover={false} className="p-5 transition-all hover:-translate-y-0.5">
      <div className="flex gap-4">
        {/* Cột trái: số vote (chỉ đọc ở UC38 — bình chọn thuộc UC khác) */}
        <div className="flex flex-col items-center gap-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10">
            <ChevronUp size={18} />
          </span>
          <span className="text-sm font-bold text-plum-900">{q.votes}</span>
        </div>

        {/* Cột phải: chủ đề, tiêu đề, trích đoạn, footer tác giả/thời gian/số trả lời */}
        <div className="min-w-0 flex-1">
          {q.topic && (
            <Badge tone="violet" className="mb-2 px-2 py-0.5 text-[10px]">{q.topic}</Badge>
          )}
          <Link to={`/app/forum/${q.id}`}>
            <h2 className="text-lg font-bold leading-snug text-plum-900 transition-colors hover:text-brand-600">{q.title}</h2>
          </Link>
          {q.excerpt && (
            <p className="mt-1.5 line-clamp-2 text-sm text-plum-500">{q.excerpt}</p>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-plum-900/8 pt-3">
            <div className="flex items-center gap-2 text-sm text-plum-500">
              <Avatar src={q.avatar} name={q.author} size={24} verified={q.verified} />
              <span className="truncate">{q.author}</span>
              <span className="text-plum-300">·</span>
              <span>{q.time}</span>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-600">
              <MessageSquare size={15} /> {q.answers} answers
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Khung xương hiển thị trong lúc tải danh sách lần đầu. */
function QuestionSkeleton() {
  return (
    <Card hover={false} className="p-5">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-plum-900/[0.07]" />
          <div className="h-3 w-6 animate-pulse rounded bg-plum-900/[0.06]" />
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="h-3 w-20 animate-pulse rounded bg-plum-900/[0.06]" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-plum-900/[0.07]" />
          <div className="h-3.5 w-full animate-pulse rounded bg-plum-900/[0.05]" />
          <div className="mt-3 h-3.5 w-1/3 animate-pulse rounded bg-plum-900/[0.06]" />
        </div>
      </div>
    </Card>
  )
}

/**
 * Trạng thái lỗi khi tải danh sách câu hỏi thất bại — hiển thị nút Thử lại.
 * @param message Thông điệp lỗi trả về từ backend
 * @param onRetry Hàm gọi lại API
 */
function QuestionsError({ message, onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <AlertTriangle size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Không tải được danh sách câu hỏi</p>
        <p className="mt-1 text-sm text-plum-500">{message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onRetry}>Thử lại</Button>
    </Card>
  )
}

/** Trạng thái rỗng khi chưa có câu hỏi nào khớp bộ lọc. */
function QuestionsEmpty({ onClear }: { onClear: () => void }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
        <Inbox size={24} />
      </span>
      <div>
        <p className="font-bold text-plum-900">Chưa có câu hỏi nào</p>
        <p className="mt-1 text-sm text-plum-500">Thử đổi chủ đề khác, hoặc là người đầu tiên đặt câu hỏi.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={onClear}>Xóa bộ lọc</Button>
    </Card>
  )
}

/**
 * Trang danh sách câu hỏi diễn đàn (UC38 - View question list).
 */
export function ForumPage() {
  // === Bước 1: State cục bộ — chủ đề đang lọc (id, null = tất cả) và tiêu chí sắp xếp ===
  const [topicId, setTopicId] = useState<number | null>(null)
  const [sort, setSort] = useState<SortOption>('recent')

  // === Bước 2: Quyền hiển thị — chỉ thành viên đã đăng nhập mới thấy nút "Đặt câu hỏi" ===
  const user = useAuthStore((s) => s.user)
  const canAsk = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  // === Bước 3: Lấy danh mục chủ đề (cho bộ lọc) và danh sách câu hỏi (infinite scroll) ===
  const { data: topics } = useTopics()
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useQuestions(sort, topicId)

  // === Bước 4: Gộp tất cả trang đã tải thành một danh sách phẳng ===
  const questions = data?.pages.flatMap((p) => p.items) ?? []

  // === Bước 5: Render ===
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<HelpCircle size={20} />}
        title="Q&A Forum"
        subtitle="Ask seniors, answer juniors, and build a living knowledge base."
        actions={canAsk ? <Button variant="primary" size="sm">Đặt câu hỏi</Button> : undefined}
      />

      {/* Bộ lọc chủ đề + tiêu chí sắp xếp */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTopicId(null)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
              topicId === null
                ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white'
                : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
            )}
          >
            All
          </button>
          {topics?.map((t) => (
            <button
              key={t.id}
              onClick={() => setTopicId(t.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
                topicId === t.id
                  ? 'bg-gradient-to-r from-brand-500 to-violet-500 text-white'
                  : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]',
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl bg-plum-900/[0.04] p-1">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                sort === s.key ? 'bg-plum-900/[0.06] text-plum-900' : 'text-plum-400 hover:text-plum-900',
              )}
            >
              <s.icon size={13} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Vùng nội dung theo trạng thái: loading → error → empty → data + load more */}
      {isLoading ? (
        <div className="space-y-4">
          <QuestionSkeleton />
          <QuestionSkeleton />
          <QuestionSkeleton />
        </div>
      ) : isError ? (
        <QuestionsError message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : questions.length === 0 ? (
        <QuestionsEmpty onClear={() => setTopicId(null)} />
      ) : (
        <>
          {/* key theo (sort, topicId): mỗi lần đổi lọc/sắp xếp sẽ remount danh sách để
              hiệu ứng Stagger chạy lại từ đầu — tránh lỗi item mới bị kẹt ẩn (opacity 0)
              do whileInView + viewport once của component Stagger dùng chung. */}
          <Stagger key={`${sort}-${topicId}`} className="space-y-4" gap={0.06}>
            {questions.map((q) => (
              <StaggerItem key={q.id}>
                <QuestionCard q={q} />
              </StaggerItem>
            ))}
          </Stagger>

          <div className="pt-5 text-center">
            {hasNextPage ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm câu hỏi'}
              </Button>
            ) : (
              <p className="text-sm text-plum-400">Bạn đã xem hết danh sách câu hỏi 🎉</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
