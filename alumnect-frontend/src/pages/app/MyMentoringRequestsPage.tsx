import { useMemo, useState } from 'react'
import { BookOpen, Plus, RefreshCw, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, ButtonLink, Container, EmptyState, Pagination, Skeleton, FadeSwitch } from '@/components/ui'
import {
  MentoringTermsGate,
  MentorPageHeader,
  MyRequestCard,
  useMyMentoringRequests,
  type MentoringRequestType,
} from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'
import { cn } from '@/lib/utils'

type RequestFilter = 'ALL' | MentoringRequestType

/** Danh sách yêu cầu Mentoring người dùng đã gửi và phản hồi từ Mentor (UC102). */
function MyMentoringRequestsContent() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<RequestFilter>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const typeTabs: MentoringFilterOption<RequestFilter>[] = useMemo(
    () => [
      { value: 'ALL', label: t('mentoring.tabAll') },
      { value: 'GENERAL', label: t('mentoring.tabGeneral') },
      { value: 'DIRECT', label: t('mentoring.tabDirect'), icon: <Send /> },
    ],
    [t],
  )

  const { data, isLoading, isError, error, refetch, isFetching } = useMyMentoringRequests({ page, size: pageSize })

  const requests = useMemo(() => data?.content ?? [], [data?.content])
  // Lọc theo loại yêu cầu trong trang đang xem
  const filteredRequests = useMemo(
    () => (activeTab === 'ALL' ? requests : requests.filter((r) => r.requestType === activeTab)),
    [requests, activeTab],
  )
  const totalPages = data?.totalPages ?? 1
  const totalElements = data?.totalElements ?? 0

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<BookOpen className="h-4 w-4" />}
        eyebrow={t('mentoring.menteeEyebrow')}
        title={t('mentoring.myRequestsTitle')}
        description={t('mentoring.myRequestsDesc')}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
            >
              {t('mentoring.refresh')}
            </Button>
            <ButtonLink to="/app/mentoring/requests/create" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              {t('mentoring.createRequest')}
            </ButtonLink>
          </>
        }
      />

      <MentoringFilterTabs ariaLabel={t('mentoring.myRequestsTitle')} options={typeTabs} value={activeTab} onChange={setActiveTab} />

      <FadeSwitch id={activeTab}>
{isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-border bg-surface p-5">
              <Skeleton className="h-5 w-40 rounded-full" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-full rounded-md" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={t('common.error')}
          description={(error as Error)?.message || t('common.tryAgain')}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              {t('common.tryAgain')}
            </Button>
          }
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={activeTab === 'ALL' ? t('mentoring.emptyMyRequestsAll') : t('mentoring.emptyMyRequestsType')}
          description={
            activeTab === 'ALL'
              ? t('mentoring.emptyMyRequestsAllDesc')
              : t('mentoring.emptyMyRequestsTypeDesc')
          }
          action={
            <ButtonLink to="/app/mentoring/requests/create" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              {t('mentoring.createRequest')}
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-subtle">{t('mentoring.requestsCount', { count: totalElements })}</p>
          {filteredRequests.map((req) => (
            <MyRequestCard key={req.id} request={req} />
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
</FadeSwitch>
    </div>
  )
}

/**
 * Trang danh sách Yêu cầu Mentoring của tôi (UC102 — View Mentoring Request Responses).
 * Bao bọc bởi MentoringTermsGate để đảm bảo điều khoản UC90 trước khi tương tác.
 */
export function MyMentoringRequestsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MyMentoringRequestsContent />
      </MentoringTermsGate>
    </Container>
  )
}
