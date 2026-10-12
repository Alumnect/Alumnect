import { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Edit3,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  ExternalLink,
  Plus,
  RefreshCw,
  FileCheck2,
  AlertCircle,
} from 'lucide-react'
import { Button, ConfirmModal, toast } from '@/components/ui'
import { MentoringDealBadge } from './MentoringDealBadge'
import { MentoringDealFormModal } from './MentoringDealFormModal'
import { MentoringTaskPaymentModal } from './MentoringTaskPaymentModal'
import { MentoringDealActionModal } from './MentoringDealActionModal'
import {
  useConfirmDeal,
  useRejectDeal,
  useRequestAdjustment,
  useDealByConversation,
  useDealDetail,
} from '../hooks/useMentoringDeals'
import { useAuthStore } from '@/store/authStore'

interface MentoringDealTicketCardProps {
  conversationId?: number | null
  recipientId: number | string
  dealId?: number
  onPaymentSuccess?: () => void
}

/**
 * Thẻ Deal Ticket hiển thị ngay trong Chat for Task (UC104 & UC105).
 * Thể hiện đầy đủ nội dung, phiên bản, người gửi, thời điểm, trạng thái và các nút hành động tương tác:
 * - Mentor: "Chấp nhận Deal theo Request" hoặc "Deal lại / Tạo Deal Ticket".
 * - Student: "Xác nhận & thanh toán", "Yêu cầu điều chỉnh", hoặc "Từ chối".
 * - Sau khi chốt & thanh toán: Hiển thị trạng thái PREPARATION và nút "Xem Task".
 */
export function MentoringDealTicketCard({
  conversationId,
  recipientId,
  dealId,
  onPaymentSuccess,
}: MentoringDealTicketCardProps) {
  const currentUserId = useAuthStore((state) => state.user?.id)
  const currentUserRole = useAuthStore((state) => state.user?.role)

  const [isExpanded, setIsExpanded] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createProposalSource, setCreateProposalSource] = useState<'REQUEST_ACCEPTANCE' | 'RENEGOTIATION'>('RENEGOTIATION')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Dialog nhập lý do từ chối / điều chỉnh
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [adjustNote, setAdjustNote] = useState('')

  const safeConvId = typeof conversationId === 'number' && conversationId > 0 ? conversationId : undefined
  const { data: convData, isLoading: isLoadingConv, refetch: refetchConv } = useDealByConversation(safeConvId)
  const { data: detailDataById, isLoading: isLoadingDetail, refetch: refetchDetail } = useDealDetail(dealId)

  const detailData = dealId ? (detailDataById || convData) : convData
  const isLoading = dealId ? (isLoadingDetail && !detailData) : isLoadingConv
  const refetch = () => {
    if (dealId) refetchDetail()
    if (safeConvId) refetchConv()
  }

  const deal = detailData?.deal

  const confirmMutation = useConfirmDeal()
  const rejectMutation = useRejectDeal()
  const adjustMutation = useRequestAdjustment()

  const currentNumId = Number(currentUserId) || 0
  const recipientNumId = Number(recipientId) || 0
  const isCurrentMentor = currentUserRole === 'ALUMNI' || (deal ? deal.mentorId === currentNumId : false)
  const isCurrentStudent = (deal ? deal.studentId === currentNumId : !isCurrentMentor)

  const mentorId = isCurrentMentor ? currentNumId : recipientNumId
  const studentId = isCurrentMentor ? recipientNumId : currentNumId

  // Xử lý Student chọn: "Xác nhận & thanh toán"
  const handleConfirmAndPay = async () => {
    if (!deal) return
    try {
      const updated = await confirmMutation.mutateAsync(deal.id)
      refetch()
      if (updated.status === 'DEAL_CONFIRMED') {
        toast.success('Xác nhận Deal thành công! Đang mở cổng thanh toán PayOS...')
        setIsPaymentModalOpen(true)
      } else {
        toast.success('Đã xác nhận thỏa thuận. Đang chờ đối phương xác nhận.')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xác nhận Deal.'
      toast.error(msg)
    }
  }

  // Xử lý Student chọn: "Yêu cầu điều chỉnh"
  const handleRequestAdjustment = async () => {
    if (!deal) return
    try {
      await adjustMutation.mutateAsync({
        dealId: deal.id,
        note: adjustNote.trim() || 'Học viên yêu cầu điều chỉnh các điều khoản',
      })
      toast.success('Đã gửi yêu cầu điều chỉnh. Deal Ticket cũ đã được đánh dấu SUPERSEDED.')
      setIsAdjustDialogOpen(false)
      setAdjustNote('')
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi yêu cầu điều chỉnh.'
      toast.error(msg)
    }
  }

  // Xử lý Student / Mentor chọn: "Từ chối"
  const handleRejectDeal = async () => {
    if (!deal) return
    try {
      await rejectMutation.mutateAsync({
        dealId: deal.id,
        reason: rejectReason.trim() || 'Từ chối đề xuất Deal',
      })
      toast.success('Đã từ chối Deal Ticket thành công.')
      setIsRejectDialogOpen(false)
      setRejectReason('')
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể từ chối Deal.'
      toast.error(msg)
    }
  }

  // Xử lý Mentor bấm: "Chấp nhận Deal theo Request"
  const handleAcceptAccordingToRequest = () => {
    setCreateProposalSource('REQUEST_ACCEPTANCE')
    setIsCreateModalOpen(true)
  }

  // Xử lý Mentor bấm: "Deal lại / Tạo Deal Ticket"
  const handleRenegotiateDeal = () => {
    setCreateProposalSource('RENEGOTIATION')
    setIsCreateModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-3 text-xs text-plum-500 bg-white/70 border-b border-plum-900/10 backdrop-blur-sm dark:bg-[#242526]/70 dark:border-white/10">
        <Loader2 className="h-4 w-4 animate-spin mr-2 text-brand-500" />
        <span>Đang kiểm tra thông tin Deal Ticket...</span>
      </div>
    )
  }

  // TRƯỜNG HỢP 1: Chưa có Deal nào trong cuộc hội thoại
  if (!deal) {
    if (isCurrentMentor) {
      return (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-gradient-to-r from-brand-50/90 via-white/80 to-plum-50/80 border-b border-brand-200/60 backdrop-blur-md shadow-2xs dark:from-brand-950/30 dark:via-[#242526] dark:to-plum-950/20 dark:border-brand-900/40">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/50 dark:text-brand-300">
                <FileCheck2 className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black text-plum-900 dark:text-[#f0f2f5]">
                  Thỏa thuận Mentoring (Deal Ticket)
                </p>
                <p className="text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                  Chưa có Deal Ticket nào cho yêu cầu này. Bạn có thể chấp nhận theo yêu cầu hoặc deal lại điều kiện.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAcceptAccordingToRequest}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-mint-700 bg-mint-50 border border-mint-200 hover:bg-mint-100 dark:bg-mint-950/40 dark:text-mint-300 dark:border-mint-800/40"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1 text-mint-600" />
                Chấp nhận theo Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRenegotiateDeal}
                className="rounded-xl px-3 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Deal lại / Tạo Deal Ticket
              </Button>
            </div>
          </div>

          {isCreateModalOpen && (
            <MentoringDealFormModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              mode="create"
              conversationId={conversationId}
              mentorId={mentorId}
              studentId={studentId}
              proposalSource={createProposalSource}
              onSuccess={() => {
                refetch()
                setIsExpanded(true)
              }}
            />
          )}
        </>
      )
    }

    // Học viên đang đợi Mentor phản hồi
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-plum-50/70 border-b border-plum-900/10 text-xs text-plum-600 backdrop-blur-sm dark:bg-white/5 dark:text-[#b0b3b8] dark:border-white/10">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-amber-500" />
          <span>Đang trao đổi với Mentor. Chờ Mentor gửi Deal Ticket để thỏa thuận phạm vi và giá task.</span>
        </div>
      </div>
    )
  }

  // TRƯỜNG HỢP 2: ĐÃ CÓ DEAL TICKET TRONG CHAT
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(deal.agreedPrice || 0)

  const formattedDeadline = deal.deadline
    ? new Date(deal.deadline).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Chưa xác định'

  const proposalSourceLabel =
    deal.proposalSource === 'REQUEST_ACCEPTANCE'
      ? 'Chấp nhận theo Request'
      : 'Deal lại / Thỏa thuận riêng'

  return (
    <>
      <div className="border-b border-plum-900/10 bg-white/95 backdrop-blur-md transition-all shadow-2xs dark:bg-[#242526]/95 dark:border-[#393a3b]">
        {/* Thanh tóm tắt nhanh Deal Ticket */}
        <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-500/20 dark:bg-brand-950/40 dark:text-brand-400">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-heading font-black text-xs text-plum-900 dark:text-[#f0f2f5]">
                  Deal Ticket #{deal.ticketId || deal.id} (v{deal.version})
                </span>
                <span className="rounded-md bg-plum-100/80 px-1.5 py-0.5 text-[10px] font-bold text-plum-700 dark:bg-white/10 dark:text-[#b0b3b8]">
                  {proposalSourceLabel}
                </span>
                <MentoringDealBadge
                  status={deal.status}
                  isLocked={deal.isLocked}
                  isPaid={deal.isPaid}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                <span>
                  Giá: <strong className="text-emerald-600 dark:text-emerald-400 font-black">{formattedPrice}</strong>
                </span>
                <span>•</span>
                <span>Hạn chót: {formattedDeadline}</span>
              </div>
            </div>
          </div>

          {/* Cụm nút hành động bên phải */}
          <div className="flex items-center gap-2">
            {/* TH: Student cần Xác nhận & thanh toán (hoặc thanh toán lại nếu đã chốt) */}
            {isCurrentStudent && !deal.isPaid && deal.status !== 'CANCELLED' && deal.status !== 'REJECTED' && deal.status !== 'SUPERSEDED' && (
              <>
                {deal.status === 'DEAL_CONFIRMED' ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="rounded-xl px-3 py-1.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-500/25"
                  >
                    <CreditCard className="h-3.5 w-3.5 mr-1" />
                    Thanh toán Task (UC105)
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmAndPay}
                    disabled={confirmMutation.isPending}
                    className="rounded-xl px-3 py-1.5 text-xs font-black bg-brand-600 hover:bg-brand-700 text-white shadow-sm"
                  >
                    {confirmMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    )}
                    Xác nhận & thanh toán
                  </Button>
                )}

                {/* Yêu cầu điều chỉnh & Từ chối khi chưa khóa */}
                {!deal.isLocked && deal.status !== 'DEAL_CONFIRMED' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAdjustDialogOpen(true)}
                      className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-amber-700 border-amber-300 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950/30"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Yêu cầu điều chỉnh
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsRejectDialogOpen(true)}
                      className="rounded-xl px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Từ chối
                    </Button>
                  </>
                )}
              </>
            )}

            {/* TH: Đã thanh toán thành công (UC105 hoàn tất) */}
            {deal.isPaid && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-mint-50 px-2.5 py-1 text-xs font-black text-mint-700 border border-mint-200 dark:bg-mint-950/40 dark:text-mint-300 dark:border-mint-800/40">
                  <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" />
                  Task #{deal.taskId || ''} (PREPARATION)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailModalOpen(true)}
                  className="rounded-xl px-2.5 py-1 text-xs font-bold border-mint-300 text-mint-700 hover:bg-mint-50 dark:border-mint-700 dark:text-mint-300"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Xem Task
                </Button>
              </div>
            )}

            {/* TH: Mentor xử lý khi Deal bị SUPERSEDED hoặc REJECTED */}
            {isCurrentMentor && (deal.status === 'SUPERSEDED' || deal.status === 'REJECTED') && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleRenegotiateDeal}
                className="rounded-xl px-3 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Gửi Deal Ticket mới
              </Button>
            )}

            {/* Nút Điều chỉnh nếu có quyền canEdit */}
            {deal.canEdit && !deal.isPaid && deal.status !== 'SUPERSEDED' && deal.status !== 'REJECTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="rounded-xl px-2.5 py-1 text-xs font-bold border-plum-900/15 text-plum-800 hover:bg-plum-50 dark:border-white/10 dark:text-[#e4e6eb] dark:hover:bg-white/5"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Chỉnh sửa Deal
              </Button>
            )}

            {/* Nút Toggle mở rộng chi tiết */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-plum-400 hover:text-plum-700 rounded-lg hover:bg-plum-50 dark:hover:bg-white/5 transition-colors"
              title={isExpanded ? 'Thu gọn chi tiết' : 'Xem chi tiết Deal Ticket'}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Khối chi tiết xổ xuống khi click Expand */}
        {isExpanded && (
          <div className="px-5 py-4 border-t border-plum-900/[0.06] bg-plum-50/30 text-xs space-y-3 dark:border-white/5 dark:bg-[#1e1f20]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-bold text-plum-500 dark:text-[#b0b3b8]">Phạm vi công việc (Task Scope):</span>
                <p className="text-plum-900 dark:text-[#f0f2f5] whitespace-pre-wrap rounded-xl bg-white p-2.5 border border-plum-900/10 dark:bg-[#2b2c2d] dark:border-white/5 font-sans leading-relaxed">
                  {deal.taskScope}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-plum-500 dark:text-[#b0b3b8]">Kết quả kỳ vọng đầu ra:</span>
                <p className="text-plum-900 dark:text-[#f0f2f5] whitespace-pre-wrap rounded-xl bg-white p-2.5 border border-plum-900/10 dark:bg-[#2b2c2d] dark:border-white/5 font-sans leading-relaxed">
                  {deal.expectedResult}
                </p>
              </div>
            </div>

            {/* Hàng trạng thái xác nhận */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-plum-900/[0.05] dark:border-white/5">
              <div className="flex items-center gap-4 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  {deal.mentorConfirmed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>Mentor: {deal.mentorConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}</span>
                </span>

                <span className="inline-flex items-center gap-1.5">
                  {deal.studentConfirmed ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  <span>Học viên: {deal.studentConfirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="text-brand-600 font-bold hover:underline inline-flex items-center gap-1 text-[11px] dark:text-brand-400 cursor-pointer"
              >
                <span>Xem lịch sử phiên bản Snapshot</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal thanh toán PayOS VietQR UC105 */}
      {isPaymentModalOpen && deal && (
        <MentoringTaskPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          deal={deal}
          onSuccess={() => {
            setIsPaymentModalOpen(false)
            refetch()
            if (onPaymentSuccess) onPaymentSuccess()
          }}
        />
      )}

      {/* Modal tạo mới hoặc chỉnh sửa Deal Ticket */}
      {isCreateModalOpen && (
        <MentoringDealFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          mode="create"
          conversationId={conversationId}
          mentorId={mentorId}
          studentId={studentId}
          proposalSource={createProposalSource}
          onSuccess={() => {
            refetch()
            setIsExpanded(true)
          }}
        />
      )}

      {isEditModalOpen && deal && (
        <MentoringDealFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          mode="edit"
          deal={deal}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal chi tiết toàn diện */}
      {isDetailModalOpen && deal && (
        <MentoringDealActionModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          dealId={deal.id}
          onPaymentRedirect={() => {
            setIsDetailModalOpen(false)
            setIsPaymentModalOpen(true)
          }}
        />
      )}

      {/* Dialog xác nhận từ chối */}
      <ConfirmModal
        isOpen={isRejectDialogOpen}
        onClose={() => !rejectMutation.isPending && setIsRejectDialogOpen(false)}
        onConfirm={handleRejectDeal}
        title="Từ chối Deal Ticket đề xuất?"
        message="Bạn có chắc chắn muốn từ chối thỏa thuận Deal Ticket này? Thao tác này sẽ hủy đề xuất hiện tại và không tạo Task."
        confirmText="Từ chối đề xuất"
        cancelText="Đóng"
        variant="danger"
        icon={<AlertCircle size={24} />}
        isLoading={rejectMutation.isPending}
      />

      {/* Dialog nhập nội dung yêu cầu điều chỉnh */}
      {isAdjustDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 text-left space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
            <h4 className="font-heading text-base font-black text-plum-900 dark:text-[#f0f2f5]">
              Yêu cầu điều chỉnh Deal Ticket
            </h4>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Phiên bản hiện tại sẽ trở thành SUPERSEDED. Vui lòng ghi rõ nội dung bạn muốn Mentor điều chỉnh (giá, deadline, số buổi...).
            </p>
            <textarea
              rows={3}
              value={adjustNote}
              onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Ví dụ: Mong muốn giảm giá xuống 400.000đ hoặc kéo dài deadline thêm 3 ngày..."
              className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdjustDialogOpen(false)}
                disabled={adjustMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestAdjustment}
                disabled={adjustMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {adjustMutation.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
