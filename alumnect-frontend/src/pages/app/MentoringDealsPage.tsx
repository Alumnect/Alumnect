import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Handshake, RefreshCw } from 'lucide-react'
import { Button, ButtonLink, Container, EmptyState, Pagination } from '@/components/ui'
import {
  MentoringTermsGate,
  MentorPageHeader,
  MentoringDealCard,
  MentoringDealActionModal,
  useMyDeals,
  type MentoringDeal,
  type MentoringDealStatus,
} from '@/features/mentorship'
import { MentoringFilterTabs, type MentoringFilterOption } from '@/features/mentorship/components/MentoringUi'

type DealFilter = 'ALL' | MentoringDealStatus

const DEAL_TABS: MentoringFilterOption<DealFilter>[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'DEAL_CONFIRMED', label: 'Đã chốt' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

/**
 * Danh sách thỏa thuận Mentoring (UC104 & UC105).
 * Thỏa thuận luôn thuộc phần trao đổi của một Request: trang này chỉ liệt kê và dẫn tới đó, không tạo thỏa thuận độc lập.
 */
function MentoringDealsContent() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<DealFilter>('ALL')
  const [page, setPage] = useState(0)
  const [selectedDeal, setSelectedDeal] = useState<MentoringDeal | null>(null)

  const { data: pageData, isLoading, isError, error, refetch, isFetching } = useMyDeals(
    filter === 'ALL' ? undefined : filter,
    page,
    9,
  )
  const deals = pageData?.content || []
  const totalPages = pageData?.totalPages || 0

  const handleOpenChat = (deal: MentoringDeal) => {
    if (deal.conversationId) navigate(`/app/mentoring/chats/${deal.conversationId}`)
  }

  return (
    <div className="space-y-5">
      <MentorPageHeader
        icon={<Handshake className="h-4 w-4" />}
        eyebrow="Thỏa thuận và thanh toán"
        title="Thỏa thuận"
        description="Theo dõi các thỏa thuận hợp tác. Task chỉ bắt đầu sau khi hai bên chốt nội dung và Học viên thanh toán."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            leftIcon={<RefreshCw className={isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />}
          >
            Làm mới
          </Button>
        }
      />

      <MentoringFilterTabs
        ariaLabel="Lọc thỏa thuận"
        options={DEAL_TABS}
        value={filter}
        onChange={(v) => {
          setFilter(v)
          setPage(0)
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-border bg-surface-2 dark:bg-white/[0.04]" />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<Handshake className="h-6 w-6" />}
          title="Không thể tải danh sách thỏa thuận"
          description={error?.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="h-4 w-4" />}>
              Thử lại
            </Button>
          }
        />
      ) : deals.length === 0 ? (
        <EmptyState
          icon={<Handshake className="h-6 w-6" />}
          title="Chưa có thỏa thuận nào"
          description={
            filter !== 'ALL'
              ? 'Không có thỏa thuận nào ở trạng thái này.'
              : 'Thỏa thuận được tạo trong phần trao đổi sau khi Mentor đồng ý yêu cầu.'
          }
          action={
            <ButtonLink to="/app/mentoring/requests" size="sm" variant="outline" leftIcon={<BookOpen className="h-4 w-4" />}>
              Yêu cầu của tôi
            </ButtonLink>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {deals.map((deal) => (
              <MentoringDealCard key={deal.id} deal={deal} onViewDetail={setSelectedDeal} onOpenChat={handleOpenChat} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {selectedDeal && (
        <MentoringDealActionModal
          isOpen
          onClose={() => {
            setSelectedDeal(null)
            refetch()
          }}
          dealId={selectedDeal.id}
        />
      )}
    </div>
  )
}

/**
 * Trang quản lý Thỏa thuận Mentoring Deals (UC104).
 */
export function MentoringDealsPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentoringDealsContent />
      </MentoringTermsGate>
    </Container>
  )
}
