import { useMemo, useState } from 'react'
import { BookOpen, Plus, RefreshCw, Send } from 'lucide-react'
import { Button, ButtonLink, Container, EmptyState, Pagination, Skeleton } from '@/components/ui'
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

const TYPE_TABS: MentoringFilterOption<RequestFilter>[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'GENERAL', label: 'Yêu cầu chung' },
  { value: 'DIRECT', label: 'Gửi trực tiếp', icon: <Send /> },
]

/** Danh sách yêu cầu Mentoring người dùng đã gửi và phản hồi từ Mentor (UC102). */
function MyMentoringRequestsContent() {
  const [activeTab, setActiveTab] = useState<RequestFilter>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

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
        eyebrow="Dành cho người học"
        title="Yêu cầu của tôi"
        description="Theo dõi trạng thái và phản hồi của Mentor cho các yêu cầu bạn đã gửi."
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
            <ButtonLink to="/app/mentoring/requests/create" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Tạo yêu cầu
            </ButtonLink>
          </>
        }
      />

      <MentoringFilterTabs ariaLabel="Lọc theo loại yêu cầu" options={TYPE_TABS} value={activeTab} onChange={setActiveTab} />

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
          title="Không thể tải danh sách yêu cầu"
          description={(error as Error)?.message || 'Vui lòng kiểm tra kết nối mạng và thử lại.'}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Thử lại
            </Button>
          }
        />
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={activeTab === 'ALL' ? 'Bạn chưa gửi yêu cầu nào' : 'Không có yêu cầu thuộc loại này'}
          description={
            activeTab === 'ALL'
              ? 'Tạo yêu cầu để được kết nối với Mentor phù hợp. Mentor cùng ngành sẽ được ưu tiên.'
              : 'Chuyển sang tab "Tất cả" để xem các yêu cầu khác.'
          }
          action={
            <ButtonLink to="/app/mentoring/requests/create" size="sm" leftIcon={<Plus className="h-4 w-4" />}>
              Tạo yêu cầu
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-text-subtle">{totalElements} yêu cầu</p>
          {filteredRequests.map((req) => (
            <MyRequestCard key={req.id} request={req} />
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
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
