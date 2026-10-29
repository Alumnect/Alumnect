import { useMemo, useState } from 'react'
import { Briefcase, Handshake, RefreshCw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, Container, EmptyState, Pagination } from '@/components/ui'
import { MentoringTermsGate, MentorPageHeader, MentoringTaskCard, useMyTasks } from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'
import { MENTORING_INPUT } from '@/features/mentorship/model/mentoringUiUtils'
import { cn } from '@/lib/utils'

type TaskFilter = 'ACTIVE' | 'DISPUTED' | 'CLOSED' | 'ALL'

const PAGE_SIZE = 12

/** Danh sách Mentoring Task của người dùng (UC106), dùng chung cho Học viên và Mentor. */
function MyMentoringTasksContent() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<TaskFilter>('ACTIVE')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)

  const taskTabs: MentoringFilterOption<TaskFilter>[] = useMemo(
    () => [
      { value: 'ACTIVE', label: t('mentoring.tabTasksActive') },
      { value: 'DISPUTED', label: t('mentoring.tabTasksDisputed') },
      { value: 'CLOSED', label: t('mentoring.tabTasksClosed') },
      { value: 'ALL', label: t('mentoring.tabTasksAll') },
    ],
    [t],
  )

  const emptyHints: Record<TaskFilter, string> = useMemo(
    () => ({
      ACTIVE: t('mentoring.emptyTasksHintActive'),
      DISPUTED: t('mentoring.emptyTasksHintDisputed'),
      CLOSED: t('mentoring.emptyTasksHintClosed'),
      ALL: t('mentoring.emptyTasksHintAll'),
    }),
    [t],
  )

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
        eyebrow={t('mentoring.tasksEyebrow')}
        title={t('mentoring.tasksTitle')}
        description={t('mentoring.tasksSubtitle')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
            >
              {t('mentoring.refreshBtn')}
            </Button>
            <ButtonLink to="/app/mentoring/deals" variant="outline" size="sm" leftIcon={<Handshake className="h-4 w-4" />}>
              {t('mentoring.dealsBtn')}
            </ButtonLink>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MentoringFilterTabs
          ariaLabel={t('mentoring.filterTask')}
          options={taskTabs}
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setPage(0)
          }}
        />
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
          <input
            aria-label={t('mentoring.searchTasksPlaceholder')}
            type="search"
            placeholder={t('mentoring.searchTasksPlaceholder')}
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
          title={t('mentoring.loadTasksError')}
          description={error?.message || t('common.error')}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-6 w-6" />}
          title={searchQuery.trim() ? t('mentoring.noTasksFound') : t('mentoring.emptyTasksTitle')}
          description={searchQuery.trim() ? t('mentoring.searchTasksOther') : emptyHints[filter]}
          action={
            filter !== 'ALL' && !searchQuery.trim() ? (
              <Button variant="outline" size="sm" onClick={() => setFilter('ALL')}>
                {t('mentoring.viewAllTasks')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-subtle">
            {searchQuery.trim()
              ? t('mentoring.taskResultsCountFormat', { count: filteredTasks.length })
              : t('mentoring.taskCountFormat', { count: totalElements })}
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
