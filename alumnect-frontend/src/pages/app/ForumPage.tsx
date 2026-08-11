/**
 * ForumPage — Danh sách câu hỏi diễn đàn Q&A.
 *
 * Trách nhiệm:
 *  - UC38: lấy danh sách câu hỏi (infinite scroll), lọc theo chủ đề, sắp xếp, phân trang.
 *  - Bộ lọc chủ đề dạng dropdown gọn (có icon) thay vì dãy dài.
 *  - Sắp xếp cho phép chọn NHIỀU tiêu chí theo thứ tự ưu tiên (Newest / Top voted / Most answered).
 *  - UC40: nút "Đặt câu hỏi" (chỉ Student/Alumni) mở modal đặt câu hỏi mới.
 *  - Xử lý đầy đủ trạng thái: loading (skeleton) / rỗng / lỗi (retry) / thành công.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { HelpCircle, ChevronUp, MessageSquare, Clock, Flame, CheckCircle2, Loader2, AlertTriangle, Inbox, LayoutGrid, GraduationCap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useMajors } from '@/features/auth/hooks/useAuth'
import { useQuestions, useTopics, AskQuestionModal } from '@/features/forum'
import type { Question, SortOption } from '@/features/forum'
import { FilterMultiSelect } from '@/features/forum/components/FilterMultiSelect'
import { TopicIcon } from '@/features/forum/lib/topicIcons'

/** Các tùy chọn sắp xếp — khớp tham số `sort` của backend. */
const SORTS: { key: SortOption; label: string; icon: LucideIcon }[] = [
  { key: 'recent', label: 'Newest', icon: Clock },
  { key: 'votes', label: 'Top voted', icon: Flame },
  { key: 'answers', label: 'Most answered', icon: CheckCircle2 },
]

/** Thẻ hiển thị một câu hỏi trong danh sách. */
function QuestionCard({ q }: { q: Question }) {
  return (
    <Card hover={false} className="p-5 transition-all hover:-translate-y-0.5">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-plum-900/[0.04] text-plum-500 ring-1 ring-inset ring-plum-900/10">
            <ChevronUp size={18} />
          </span>
          <span className="text-sm font-bold text-plum-900">{q.votes}</span>
        </div>

        <div className="min-w-0 flex-1">
          {(q.topic || q.major) && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              {q.topic && (
                <Badge tone="violet" className="px-2 py-0.5 text-[10px]">
                  {q.topic}
                </Badge>
              )}
              {q.major && (
                <Badge tone="aqua" className="px-2 py-0.5 text-[10px]">
                  {q.major}
                </Badge>
              )}
            </div>
          )}
          <Link to={`/app/forum/${q.id}`}>
            <h2 className="text-lg font-bold leading-snug text-plum-900 transition-colors hover:text-brand-600">{q.title}</h2>
          </Link>
          {q.excerpt && <p className="mt-1.5 line-clamp-2 text-sm text-plum-500">{q.excerpt}</p>}
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

/** Trạng thái lỗi khi tải danh sách câu hỏi thất bại. */
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
      <Button variant="secondary" size="sm" onClick={onRetry}>
        Thử lại
      </Button>
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
      <Button variant="secondary" size="sm" onClick={onClear}>
        Xóa bộ lọc
      </Button>
    </Card>
  )
}

/**
 * Trang danh sách câu hỏi diễn đàn (UC38) + đặt câu hỏi (UC40).
 */
export function ForumPage() {
  // === State: các chủ đề đang lọc (tick nhiều), danh sách tiêu chí sắp xếp (ưu tiên), mở modal ===
  const [topicIds, setTopicIds] = useState<number[]>([])
  const [majorIds, setMajorIds] = useState<number[]>([])
  // Mảng rỗng = mặc định "recent" (backend tự hiểu). Cái người dùng bấm ĐẦU TIÊN là ưu tiên 1.
  const [sorts, setSorts] = useState<SortOption[]>([])
  const [askOpen, setAskOpen] = useState(false)

  // === Quyền: chỉ Student/Alumni đã đăng nhập mới thấy nút "Đặt câu hỏi" (UC40) ===
  const user = useAuthStore((s) => s.user)
  const canAsk = !!user && (user.role === 'STUDENT' || user.role === 'ALUMNI')

  // === Dữ liệu: chủ đề (cho bộ lọc) + danh sách câu hỏi (infinite scroll) ===
  const { data: topics } = useTopics()
  const { data: majors } = useMajors()
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuestions(sorts, topicIds, majorIds)

  const questions = data?.pages.flatMap((p) => p.items) ?? []

  /** Bật/tắt một tiêu chí sắp xếp; thứ tự chọn = thứ tự ưu tiên. Rỗng = mặc định "recent". */
  const toggleSort = (key: SortOption) => {
    setSorts((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const resetFilter = () => {
    setTopicIds([])
    setMajorIds([])
    setSorts([])
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        icon={<HelpCircle size={20} />}
        title="Q&A Forum"
        subtitle="Ask seniors, answer juniors, and build a living knowledge base."
        actions={
          canAsk ? (
            <Button variant="primary" size="sm" onClick={() => setAskOpen(true)}>
              Đặt câu hỏi
            </Button>
          ) : undefined
        }
      />

      {/* Bộ lọc chủ đề (dropdown) + tiêu chí sắp xếp (multi-select ưu tiên) */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterMultiSelect
            buttonIcon={<LayoutGrid size={15} className="text-brand-600" />}
            allLabel="Tất cả thể loại"
            noun="thể loại"
            items={topics}
            selected={topicIds}
            onChange={setTopicIds}
            itemIcon={(name) => <TopicIcon name={name} size={16} className="text-plum-400" />}
          />
          <FilterMultiSelect
            buttonIcon={<GraduationCap size={15} className="text-brand-600" />}
            allLabel="Tất cả ngành"
            noun="ngành"
            items={majors}
            selected={majorIds}
            onChange={setMajorIds}
            searchable
            itemIcon={() => <GraduationCap size={16} className="text-plum-400" />}
          />
          {(topicIds.length > 0 || majorIds.length > 0 || sorts.length > 0) && (
            <button onClick={resetFilter} className="text-xs font-semibold text-plum-400 underline-offset-2 transition-colors hover:text-plum-700 hover:underline">
              Xóa lọc
            </button>
          )}
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex gap-1 rounded-xl bg-plum-900/[0.04] p-1">
            {SORTS.map((s) => {
              const inSorts = sorts.includes(s.key)
              // Khi chưa chọn gì (rỗng), "Newest" là mặc định nên vẫn hiển thị active.
              const active = inSorts || (sorts.length === 0 && s.key === 'recent')
              const order = sorts.indexOf(s.key)
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSort(s.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    active ? 'bg-plum-900/[0.08] text-plum-900' : 'text-plum-400 hover:text-plum-900',
                  )}
                >
                  <s.icon size={13} /> {s.label}
                  {/* Số thứ tự ưu tiên khi chọn nhiều tiêu chí */}
                  {inSorts && sorts.length > 1 && <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{order + 1}</span>}
                </button>
              )
            })}
          </div>
          {sorts.length > 1 && <span className="text-[11px] text-plum-400">Sắp theo thứ tự ưu tiên 1 → {sorts.length}</span>}
        </div>
      </div>

      {/* Vùng nội dung theo trạng thái */}
      {isLoading ? (
        <div className="space-y-4">
          <QuestionSkeleton />
          <QuestionSkeleton />
          <QuestionSkeleton />
        </div>
      ) : isError ? (
        <QuestionsError message={(error as Error)?.message} onRetry={() => refetch()} />
      ) : questions.length === 0 ? (
        <QuestionsEmpty onClear={resetFilter} />
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionCard key={q.id} q={q} />
            ))}
          </div>

          {/* Chỉ hiện nút tải thêm khi CÒN trang; hết trang thì không chừa khoảng trắng thừa */}
          {hasNextPage && (
            <div className="pt-4 text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                leftIcon={isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : undefined}
              >
                {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm câu hỏi'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal đặt câu hỏi (UC40) */}
      {askOpen && <AskQuestionModal onClose={() => setAskOpen(false)} />}
    </div>
  )
}
