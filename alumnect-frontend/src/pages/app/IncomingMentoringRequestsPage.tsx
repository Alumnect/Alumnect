import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Inbox, RefreshCw, Clock, CheckCircle2, XCircle, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Container, EmptyState, Pagination, Skeleton } from '@/components/ui'
import {
  MentoringTermsGate,
  MentorPageHeader,
  IncomingRequestCard,
  useIncomingMentoringRequests,
  type MentoringResponseStatus,
  type IncomingRequestScope,
} from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

type ResponseFilter = 'ALL' | MentoringResponseStatus

// Trạng thái hiển thị (WAITING, ACCEPTED, DECLINED) → trạng thái backend (PENDING, ACCEPTED, REJECTED)
const BACKEND_STATUS: Record<ResponseFilter, string | undefined> = {
  ALL: undefined,
  WAITING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'REJECTED',
  EXPIRED: 'EXPIRED',
}

/**
 * Danh sách Yêu cầu Mentoring gửi đến (UC103): yêu cầu trực tiếp và yêu cầu chung được phân phối cho Mentor.
 * Mặc định mở tab "Chờ phản hồi" để Mentor thấy ngay việc cần làm.
 */
function IncomingMentoringRequestsContent() {
  const { t } = useTranslation()
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>('WAITING')
  const [scopeFilter, setScopeFilter] = useState<IncomingRequestScope>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const statusTabs: MentoringFilterOption<ResponseFilter>[] = useMemo(
    () => [
      { value: 'WAITING', label: t('mentoring.tabWaiting'), icon: <Clock /> },
      { value: 'ACCEPTED', label: t('mentoring.tabAccepted'), icon: <CheckCircle2 /> },
      { value: 'DECLINED', label: t('mentoring.tabDeclined'), icon: <XCircle /> },
      { value: 'ALL', label: t('mentoring.tabAll') },
    ],
    [t],
  )

  const scopeTabs: MentoringFilterOption<IncomingRequestScope>[] = useMemo(
    () => [
      { value: 'ALL', label: t('mentoring.tabScopeAll') },
      { value: 'SAME_INDUSTRY', label: t('mentoring.tabScopeSameIndustry') },
      { value: 'SAME_FORMAT', label: t('mentoring.tabScopeSameFormat') },
    ],
    [t],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useIncomingMentoringRequests({
    status: BACKEND_STATUS[responseFilter],
    scope: scopeFilter,
    page,
    size: pageSize,
  })

  const requests = data?.content ?? []
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0
  const filtered = responseFilter !== 'ALL' || scopeFilter !== 'ALL'

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<Inbox className="h-4 w-4" />}
        eyebrow={t('mentoring.mentorEyebrow')}
        title={t('mentoring.incomingRequestsTitle')}
        description={t('mentoring.incomingRequestsDesc')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
          >
            {t('mentoring.refresh')}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <MentoringFilterTabs
          ariaLabel={t('mentoring.incomingRequestsTitle')}
          options={statusTabs}
          value={responseFilter}
          onChange={(v) => {
            setResponseFilter(v)
            setPage(0)
          }}
        />
        <MentoringFilterTabs
          ariaLabel={t('mentoring.filterCriteria')}
          options={scopeTabs}
          value={scopeFilter}
          onChange={(v) => {
            setScopeFilter(v)
            setPage(0)
          }}
        />
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
        <span>
          {t('mentoring.incomingNote')}
        </span>
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-40 rounded-md" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={t('common.error')}
          description={error instanceof Error ? error.message : t('common.tryAgain')}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={responseFilter === 'WAITING' ? t('mentoring.emptyIncomingWaiting') : t('mentoring.emptyIncomingFiltered')}
          description={
            filtered
              ? t('mentoring.emptyIncomingFilteredDesc')
              : t('mentoring.emptyIncomingWaitingDesc')
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-subtle">{t('mentoring.requestsCount', { count: totalElements })}</p>
          {requests.map((item) => (
            <IncomingRequestCard key={item.distributionId ?? `request-${item.id}`} request={item} />
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

export default function IncomingMentoringRequestsPage() {
  const user = useAuthStore((state) => state.user)

  if (user?.role !== 'ALUMNI') {
    return <Navigate to="/app/mentoring" replace />
  }

  return (
    <MentoringTermsGate>
      <Container className="py-2 sm:py-4">
        <IncomingMentoringRequestsContent />
      </Container>
    </MentoringTermsGate>
  )
}
