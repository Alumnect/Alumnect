import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { Container, Button, EmptyState } from '@/components/ui'
import {
  MentoringTermsGate,
  MentoringDealCard,
  MentoringDealActionModal,
  useMyDeals,
  type MentoringDeal,
  type MentoringDealStatus,
} from '@/features/mentorship'

/**
 * Nội dung trang danh sách Mentoring Deals (UC104 & UC105).
 * Deal luôn thuộc một Chat for Task của Request: trang này chỉ liệt kê và điều hướng tới Chat for Task,
 * không tạo Deal độc lập.
 */
function MentoringDealsContent() {
  const navigate = useNavigate()
  const [selectedStatus, setSelectedStatus] = useState<MentoringDealStatus | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<MentoringDeal | null>(null)

  const { data: pageData, isLoading, isError, error, refetch } = useMyDeals(selectedStatus, page, 9)
  const deals = pageData?.content || []
  const totalPages = pageData?.totalPages || 0

  const handleOpenDetail = (deal: MentoringDeal) => setSelectedDealForDetail(deal)

  const handleOpenChat = (deal: MentoringDeal) => {
    if (deal.conversationId) navigate(`/app/mentoring/chats/${deal.conversationId}`)
  }

  const statusTabs: { label: string; value?: MentoringDealStatus }[] = [
    { label: 'Tất cả thỏa thuận', value: undefined },
    { label: 'Đã hủy', value: 'CANCELLED' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-gradient-to-r from-brand-50/80 via-white to-violet-50/60 p-6 sm:p-8 border border-brand-200/50 shadow-xs dark:from-brand-950/20 dark:via-[#242526] dark:to-violet-950/20 dark:border-white/10">
        <div className="space-y-1.5 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Thỏa thuận & Thanh toán</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black text-plum-900 dark:text-[#f0f2f5]">
            Thỏa thuận & Xác nhận Deal
          </h1>
          <p className="text-xs sm:text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Mỗi Deal thuộc Chat for Task của một Mentoring Request. Mentor gửi Deal Ticket, Học viên xác nhận để khóa Deal và thanh toán; Task chỉ được tạo sau khi thanh toán thành công.
          </p>
        </div>
      </div>

      {/* Tabs Lọc trạng thái */}
      <div className="flex flex-wrap items-center gap-2 border-b border-plum-900/[0.08] pb-3 dark:border-white/10">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.value
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value)
                setPage(0)
              }}
              className={`rounded-2xl px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white text-plum-600 hover:bg-plum-50 border border-plum-900/10 dark:bg-[#242526] dark:text-[#b0b3b8] dark:border-white/10 dark:hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Nội dung danh sách Deals */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-3xl bg-plum-100/50 animate-pulse dark:bg-white/5"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-6 text-center space-y-3 dark:bg-rose-950/20 dark:border-rose-900/30">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
            {error?.message || 'Không thể tải danh sách thỏa thuận Mentoring Deals.'}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="font-bold">
            Thử lại
          </Button>
        </div>
      ) : deals.length === 0 ? (
        <EmptyState
          title="Chưa có thỏa thuận nào"
          description={
            selectedStatus
              ? 'Không có thỏa thuận nào ở trạng thái này. Bạn có thể chọn tab lọc khác.'
              : 'Deal được tạo trong Chat for Task sau khi Mentor chấp nhận Request. Hãy tạo Request hoặc mở Request đã được Mentor chấp nhận.'
          }
          action={
            <Button onClick={() => navigate('/app/mentoring/requests')}>Xem Request của tôi</Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {deals.map((deal) => (
              <MentoringDealCard
                key={deal.id}
                deal={deal}
                onViewDetail={handleOpenDetail}
                onOpenChat={handleOpenChat}
              />
            ))}
          </div>

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-xl font-bold text-xs"
              >
                Trang trước
              </Button>
              <span className="text-xs font-bold text-plum-600 dark:text-[#b0b3b8] px-3">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl font-bold text-xs"
              >
                Trang tiếp
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal xem chi tiết & lịch sử phiên bản Deal */}
      {selectedDealForDetail && (
        <MentoringDealActionModal
          isOpen
          onClose={() => {
            setSelectedDealForDetail(null)
            refetch()
          }}
          dealId={selectedDealForDetail.id}
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
