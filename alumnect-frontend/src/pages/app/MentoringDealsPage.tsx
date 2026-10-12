import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, ShieldCheck } from 'lucide-react'
import { Container, Button, EmptyState } from '@/components/ui'
import {
  MentoringTermsGate,
  MentoringDealCard,
  MentoringDealActionModal,
  MentoringDealFormModal,
  MentoringChatForTask,
  useMyDeals,
  useDealDetail,
  type MentoringDeal,
  type MentoringDealStatus,
} from '@/features/mentorship'

/**
 * Nội dung trang danh sách Thỏa thuận Mentoring Deals & Chat for Task (UC104 & UC105).
 */
function MentoringDealsContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const dealIdFromUrl = searchParams.get('dealId') ? Number(searchParams.get('dealId')) : null

  const [selectedStatus, setSelectedStatus] = useState<MentoringDealStatus | undefined>(undefined)
  const [page, setPage] = useState(0)
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<MentoringDeal | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: pageData, isLoading, isError, error, refetch } = useMyDeals(selectedStatus, page, 9)
  const deals = pageData?.content || []
  const totalPages = pageData?.totalPages || 0

  // Tìm deal từ danh sách hiện tại
  const foundInList = dealIdFromUrl ? deals.find((d) => d.id === dealIdFromUrl) || null : null

  // Hỗ trợ tải Deal trực tiếp nếu mở theo link dealId trên URL mà chưa có trong danh sách trang hiện tại
  const { data: detailDataFromUrl } = useDealDetail(
    dealIdFromUrl && !foundInList ? dealIdFromUrl : undefined
  )

  const activeChatDeal = foundInList || detailDataFromUrl?.deal || null

  const handleOpenDetail = (deal: MentoringDeal) => {
    setSelectedDealForDetail(deal)
    setIsDetailModalOpen(true)
  }

  const handleOpenChat = (deal: MentoringDeal) => {
    setSearchParams({ dealId: String(deal.id) })
  }

  const handleCloseChat = () => {
    setSearchParams({}, { replace: true })
  }

  const statusTabs: { label: string; value?: MentoringDealStatus; count?: number }[] = [
    { label: 'Tất cả thỏa thuận', value: undefined },
    { label: 'Đang thương lượng', value: 'PROPOSED' },
    { label: 'Chờ đối tác xác nhận', value: 'STUDENT_CONFIRMED' },
    { label: 'Đã chốt & Khóa Snapshot', value: 'DEAL_CONFIRMED' },
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
            Thống nhất phạm vi công việc, giá và điều kiện giữa Student và Mentor. Khi cả hai cùng xác nhận, snapshot thỏa thuận sẽ được khóa bất biến và sẵn sàng thanh toán (UC105).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
            className="rounded-2xl font-black px-5 py-3 bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 active:scale-[0.98]"
          >
            Đề xuất Deal mới
          </Button>
        </div>
      </div>

      {/* Nếu đang mở Chat for Task riêng biệt của một Deal */}
      {activeChatDeal ? (
        <MentoringChatForTask
          deal={activeChatDeal}
          onBack={handleCloseChat}
          onDealUpdated={refetch}
        />
      ) : (
        <>
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
                  : 'Hãy bắt đầu đề xuất thỏa thuận Mentoring Deal với Mentor để mở Chat for Task riêng và trao đổi chốt Deal.'
              }
              action={
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus size={16} className="mr-1.5" />
                  Tạo đề xuất Deal mới
                </Button>
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
        </>
      )}

      {/* Modal chi tiết và Xác nhận Deal */}
      {isDetailModalOpen && selectedDealForDetail && (
        <MentoringDealActionModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            refetch()
          }}
          dealId={selectedDealForDetail.id}
        />
      )}

      {/* Modal tạo mới Deal */}
      {isCreateModalOpen && (
        <MentoringDealFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          mentorId={1} // Mặc định hoặc chọn
          onSuccess={() => {
            refetch()
          }}
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
