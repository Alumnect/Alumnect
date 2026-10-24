import { useMemo, useState } from 'react'
import { Briefcase, Handshake, RefreshCw, Search } from 'lucide-react'
import { Button, ButtonLink, Container, EmptyState, Pagination } from '@/components/ui'
import { MentoringTermsGate, MentorPageHeader, MentoringTaskCard, useMyTasks } from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'
import { MENTORING_INPUT } from '@/features/mentorship/model/mentoringUiUtils'
import { cn } from '@/lib/utils'

type TaskFilter = 'ACTIVE' | 'DISPUTED' | 'CLOSED' | 'ALL'

const TASK_TABS: MentoringFilterOption<TaskFilter>[] = [
  { value: 'ACTIVE', label: 'Đang chạy' },
  { value: 'DISPUTED', label: 'Tranh chấp' },
  { value: 'CLOSED', label: 'Đã kết thúc' },
  { value: 'ALL', label: 'Tất cả' },
]

const EMPTY_HINT: Record<TaskFilter, string> = {
  ACTIVE: 'Không có Task nào đang chuẩn bị, thực hiện hoặc chờ nghiệm thu.',
  DISPUTED: 'Không có Task nào đang tranh chấp.',
  CLOSED: 'Chưa có Task nào hoàn thành, bị hủy hoặc được phân xử.',
  ALL: 'Task được tạo tự động sau khi thỏa thuận được chốt và Học viên thanh toán thành công.',
}

const PAGE_SIZE = 12

/** Danh sách Mentoring Task của người dùng (UC106), dùng chung cho Học viên và Mentor. */
function MyMentoringTasksContent() {
  const [filter, setFilter] = useState<TaskFilter>('ACTIVE')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)

  const { data: pageData, isLoading, isError, error, refetch, isFetching } = useMyTasks(
    filter === 'ACTIVE' || filter === 'CLOSED' ? filter : undefined,
    filter === 'DISPUTED' ? 'DISPUTED' : undefined,
    page,
    PAGE_SIZE,
  )

  const tasks = useMemo(() => pageData?.content ?? [], [pageData?.content])
  const totalPages = pageData?.totalPages || 0
  const totalElements = pageData?.totalElements || 0

  // Tìm nhanh trong trang đang xem
  const filteredTasks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return tasks
    return tasks.filter((t) =>
      [t.taskTitle, t.taskScope, t.mentorName, t.studentName].some((v) => v?.toLowerCase().includes(query)),
    )
  }, [tasks, searchQuery])

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<Briefcase className="h-4 w-4" />}
        eyebrow="Không gian làm việc"
        title="Công việc của tôi"
        description="Theo dõi tiến độ, nhật ký làm việc và kết quả các Task bạn đang tham gia."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
            >
              Làm mới
            </Button>
            <ButtonLink to="/app/mentoring/deals" variant="outline" size="sm" leftIcon={<Handshake className="h-4 w-4" />}>
              Thỏa thuận
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MentoringFilterTabs
          ariaLabel="Lọc Task"
          options={TASK_TABS}
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setPage(0)
          }}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            aria-label="Tìm theo tiêu đề, người tham gia..."
            type="search"
            placeholder="Tìm theo tiêu đề, người tham gia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(MENTORING_INPUT, 'py-2 pl-9')}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl border border-border bg-surface-2 dark:bg-white/[0.04]" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title="Không thể tải danh sách Task"
          description={error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Thử lại
            </Button>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title={searchQuery.trim() ? 'Không tìm thấy Task phù hợp' : 'Chưa có Task nào'}
          description={searchQuery.trim() ? 'Thử từ khóa khác hoặc xóa ô tìm kiếm.' : EMPTY_HINT[filter]}
          action={
            filter !== 'ALL' && !searchQuery.trim() ? (
              <Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>
                Xem tất cả Task
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-subtle">
            {searchQuery.trim() ? `${filteredTasks.length} kết quả trong trang này` : `${totalElements} Task`}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredTasks.map((task) => (
              <MentoringTaskCard key={task.id} task={task} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

/**
 * Trang danh sách Mentoring Tasks của người dùng (UC106).
 */
export function MyMentoringTasksPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MyMentoringTasksContent />
      </MentoringTermsGate>
    </Container>
  )
}

export default MyMentoringTasksPage
