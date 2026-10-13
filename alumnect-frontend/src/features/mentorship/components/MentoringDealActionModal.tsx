import { useState } from 'react'
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  History,
  Ban,
  CreditCard,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Button, ConfirmModal, toast } from '@/components/ui'
import { MentoringDealSnapshotCard } from './MentoringDealSnapshotCard'
import { MentoringDealHistoryTimeline } from './MentoringDealHistoryTimeline'
import { MentoringDealFormModal } from './MentoringDealFormModal'
import { MentoringTaskPaymentModal } from './MentoringTaskPaymentModal'
import { useConfirmDeal, useCancelDeal, useDealDetail } from '../hooks/useMentoringDeals'
import type { MentoringDeal } from '../model/mentoringDealTypes'

interface MentoringDealActionModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: number
  onPaymentRedirect?: (deal: MentoringDeal) => void
}

/**
 * Modal trung tâm xem chi tiết Snapshot, xác nhận 2 bên và quản lý vòng đời Deal (UC104 & UC105).
 * Có thể mở từ cuộc trò chuyện Direct Messaging hoặc từ trang danh sách Deals.
 */
export function MentoringDealActionModal({
  isOpen,
  onClose,
  dealId,
  onPaymentRedirect,
}: MentoringDealActionModalProps) {
  const [activeTab, setActiveTab] = useState<'snapshot' | 'history'>('snapshot')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const { data: detailData, isLoading, refetch } = useDealDetail(dealId)
  const confirmMutation = useConfirmDeal()
  const cancelMutation = useCancelDeal()

  if (!isOpen || !dealId) return null

  const deal = detailData?.deal
  const snapshots = detailData?.snapshots || []

  const handleConfirm = async () => {
    if (!deal) return
    try {
      const updated = await confirmMutation.mutateAsync(deal.id)
      if (updated.status === 'DEAL_CONFIRMED') {
        toast.success(
          'Tuyệt vời! Cả hai bên đã cùng xác nhận Thỏa thuận. Snapshot đã được khóa và sẵn sàng thanh toán (UC105).'
        )
      } else {
        toast.success('Bạn đã xác nhận Thỏa thuận thành công. Đang chờ bên còn lại xác nhận.')
      }
      refetch()
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể xác nhận thỏa thuận. Vui lòng thử lại.'
      toast.error(msg)
    }
  }

  const handleCancelConfirm = async () => {
    if (!deal) return
    try {
      await cancelMutation.mutateAsync({
        dealId: deal.id,
        reason: 'Hủy bỏ thỏa thuận từ người tham gia',
      })
      toast.success('Đã hủy bỏ thỏa thuận Deal thành công.')
      setIsCancelConfirmOpen(false)
      refetch()
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể hủy bỏ thỏa thuận.'
      toast.error(msg)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-plum-950/45 backdrop-blur-sm animate-fade-in">
        <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[92vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
          {/* Nút đóng */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header & Tabs */}
          <div className="space-y-4 border-b border-plum-900/[0.06] pb-4 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-heading text-lg font-black text-plum-900 dark:text-[#f0f2f5]">
                  Thỏa thuận & Xác nhận Mentoring Deal
                </h3>
              </div>
              <p className="text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
                Xem điều khoản, trao đổi và khóa snapshot khi cả hai bên đạt thỏa thuận cuối cùng (UC104).
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('snapshot')}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'snapshot'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-plum-50 text-plum-600 hover:bg-plum-100 dark:bg-white/5 dark:text-[#b0b3b8] dark:hover:bg-white/10'
                }`}
              >
                Snapshot mới nhất
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-plum-50 text-plum-600 hover:bg-plum-100 dark:bg-white/5 dark:text-[#b0b3b8] dark:hover:bg-white/10'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Lịch sử phiên bản ({snapshots.length})</span>
              </button>
            </div>
          </div>

          {/* Nội dung chính theo Tab */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-plum-400">
              <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
              <p className="text-xs font-medium">Đang tải chi tiết Deal Snapshot...</p>
            </div>
          ) : !deal ? (
            <div className="py-12 text-center text-xs text-plum-400">
              Không tìm thấy thông tin thỏa thuận Deal.
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'snapshot' ? (
                <MentoringDealSnapshotCard deal={deal} />
              ) : (
                <MentoringDealHistoryTimeline
                  snapshots={snapshots}
                  currentVersion={deal.version}
                />
              )}

              {/* Thanh tác vụ hành động dưới đáy */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-plum-900/[0.06] dark:border-white/10">
                <div>
                  {deal.status !== 'CANCELLED' && !deal.isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCancelConfirmOpen(true)}
                      disabled={cancelMutation.isPending}
                      className="text-rose-600 hover:bg-rose-50 text-xs font-bold dark:text-rose-400 dark:hover:bg-rose-950/20"
                    >
                      <Ban className="h-3.5 w-3.5 mr-1" />
                      Hủy bỏ Deal
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Nút Điều chỉnh điều khoản nếu chưa khóa */}
                  {deal.canEdit && (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditModalOpen(true)}
                      className="rounded-xl font-bold border-plum-900/15 text-xs text-plum-800 hover:bg-plum-50 dark:border-white/10 dark:text-[#e4e6eb] dark:hover:bg-white/5"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Điều chỉnh điều khoản
                    </Button>
                  )}

                  {/* Nút Xác nhận Thỏa thuận nếu có quyền confirm */}
                  {deal.canConfirm && (
                    <Button
                      variant="primary"
                      onClick={handleConfirm}
                      disabled={confirmMutation.isPending}
                      className="rounded-xl font-black bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20 text-xs"
                    >
                      {confirmMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      )}
                      Xác nhận Thỏa thuận này
                    </Button>
                  )}

                  {/* Nút Thanh toán khi DEAL_CONFIRMED & chưa thanh toán */}
                  {deal.status === 'DEAL_CONFIRMED' && !deal.isPaid && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onPaymentRedirect) onPaymentRedirect(deal)
                        else setIsPaymentModalOpen(true)
                      }}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4 text-white" />
                      <span>Thanh toán Task</span>
                      <ExternalLink className="h-3.5 w-3.5 text-white/90" />
                    </button>
                  )}

                  {/* Khi DEAL_CONFIRMED & đã thanh toán */}
                  {deal.status === 'DEAL_CONFIRMED' && deal.isPaid && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-50 text-mint-700 border border-mint-200 text-xs font-bold dark:bg-mint-950/40 dark:text-mint-300 dark:border-mint-800/40">
                      <CheckCircle2 className="h-4 w-4 text-mint-600" />
                      <span>Đã thanh toán • Task #{deal.taskId || ''} (PREPARATION)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
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
          }}
        />
      )}

      {/* Modal chỉnh sửa điều khoản nếu được mở */}
      {isEditModalOpen && deal && (
        <MentoringDealFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          mode="edit"
          deal={deal}
          onSuccess={() => refetch()}
        />
      )}

      {/* Modal xác nhận hủy bỏ Deal */}
      <ConfirmModal
        isOpen={isCancelConfirmOpen}
        onClose={() => !cancelMutation.isPending && setIsCancelConfirmOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Hủy bỏ Thỏa thuận Mentoring Deal?"
        message="Bạn có chắc chắn muốn hủy bỏ thỏa thuận này? Cả hai bên sẽ không thể tiếp tục thực hiện Task của Deal này nữa."
        confirmText="Hủy bỏ thỏa thuận"
        cancelText="Đóng"
        variant="danger"
        icon={<Ban size={24} />}
        isLoading={cancelMutation.isPending}
      />
    </>
  )
}
