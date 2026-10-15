import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Inbox, RefreshCw, Clock, CheckCircle2, XCircle, Info } from 'lucide-react'
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

const STATUS_TABS: MentoringFilterOption<ResponseFilter>[] = [
  { value: 'WAITING', label: 'Chờ phản hồi', icon: <Clock /> },
  { value: 'ACCEPTED', label: 'Đã đồng ý', icon: <CheckCircle2 /> },
  { value: 'DECLINED', label: 'Đã từ chối', icon: <XCircle /> },
  { value: 'ALL', label: 'Tất cả' },
]

const SCOPE_TABS: MentoringFilterOption<IncomingRequestScope>[] = [
  { value: 'ALL', label: 'Mọi yêu cầu' },
  { value: 'SAME_INDUSTRY', label: 'Cùng ngành' },
  { value: 'SAME_FORMAT', label: 'Cùng hình thức' },
]

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
  const [responseFilter, setResponseFilter] = useState<ResponseFilter>('WAITING')
  const [scopeFilter, setScopeFilter] = useState<IncomingRequestScope>('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

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
        eyebrow="Dành cho Mentor"
        title="Yêu cầu gửi đến"
        description="Xem và phản hồi các yêu cầu được gửi trực tiếp hoặc phân phối cho bạn."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />}
          >
            Làm mới
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <MentoringFilterTabs
          ariaLabel="Lọc theo phản hồi"
          options={STATUS_TABS}
          value={responseFilter}
          onChange={(v) => {
            setResponseFilter(v)
            setPage(0)
          }}
        />
        <MentoringFilterTabs
          ariaLabel="Lọc theo mức độ phù hợp"
          options={SCOPE_TABS}
          value={scopeFilter}
          onChange={(v) => {
            setScopeFilter(v)
            setPage(0)
          }}
        />
      </div>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-500" />
        <span>
          "Đồng ý trao đổi" chỉ mở kênh trò chuyện với người học. Thỏa thuận và thanh toán được tạo sau khi hai bên thống
          nhất phạm vi công việc.
        </span>
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-2xl border border-plum-900/[0.08] bg-white p-5 dark:border-white/10 dark:bg-[#242526]">
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
          title="Không thể tải danh sách yêu cầu"
          description={error instanceof Error ? error.message : 'Đã có lỗi xảy ra, vui lòng thử lại.'}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Thử lại
            </Button>
          }
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={responseFilter === 'WAITING' ? 'Không có yêu cầu nào đang chờ bạn' : 'Chưa có yêu cầu phù hợp'}
          description={
            filtered
              ? 'Thử chuyển sang tab khác hoặc bỏ bộ lọc để xem thêm yêu cầu.'
              : 'Yêu cầu mới sẽ xuất hiện ở đây. Hãy đảm bảo hồ sơ Mentor đang hoạt động và gói thành viên còn hiệu lực.'
          }
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">{totalElements} yêu cầu</p>
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
