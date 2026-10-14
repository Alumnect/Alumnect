import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ShieldCheck, CheckCircle2, History, Loader2, MessagesSquare, Info } from 'lucide-react'
import { Button } from '@/components/ui'
import { MentoringDealSnapshotCard } from './MentoringDealSnapshotCard'
import { MentoringDealHistoryTimeline } from './MentoringDealHistoryTimeline'
import { useDealDetail } from '../hooks/useMentoringDeals'

interface MentoringDealActionModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: number
  /** Ẩn nút "Mở Chat for Task" khi modal được mở ngay trong Chat for Task */
  hideOpenChat?: boolean
}

/**
 * Modal xem chi tiết Deal và toàn bộ lịch sử phiên bản Deal Ticket (UC104).
 * Chỉ để xem: mọi hành động (xác nhận, yêu cầu điều chỉnh, từ chối, thanh toán) được thực hiện trong
 * Chat for Task của Request để backend kiểm tra đúng phiên bản và ngữ cảnh Request.
 */
export function MentoringDealActionModal({ isOpen, onClose, dealId, hideOpenChat = false }: MentoringDealActionModalProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'snapshot' | 'history'>('snapshot')
  const { data: detailData, isLoading } = useDealDetail(dealId)

  if (!isOpen || !dealId) return null

  const deal = detailData?.deal
  const snapshots = detailData?.snapshots || []

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[92vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
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
                Mentoring Deal #{dealId}
              </h3>
            </div>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8] mt-0.5">
              {deal?.requestTitle ? `Request: ${deal.requestTitle}` : 'Điều khoản và lịch sử các phiên bản Deal Ticket.'}
            </p>
          </div>

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
              Phiên bản mới nhất
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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-plum-400">
            <Loader2 className="h-7 w-7 animate-spin text-brand-500" />
            <p className="text-xs font-medium">Đang tải chi tiết Deal...</p>
          </div>
        ) : !deal ? (
          <div className="py-12 text-center text-xs text-plum-400">Không tìm thấy thông tin thỏa thuận Deal.</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'snapshot' ? (
              <MentoringDealSnapshotCard deal={deal} />
            ) : (
              <MentoringDealHistoryTimeline snapshots={snapshots} currentVersion={deal.version} />
            )}

            {deal.readOnlyReason && (
              <div className="flex items-start gap-2 rounded-2xl bg-amber-500/10 p-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{deal.readOnlyReason}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-plum-900/[0.06] dark:border-white/10">
              {deal.isPaid ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-50 text-mint-700 border border-mint-200 text-xs font-bold dark:bg-mint-950/40 dark:text-mint-300 dark:border-mint-800/40">
                  <CheckCircle2 className="h-4 w-4 text-mint-600" />
                  <span>Đã thanh toán • Task #{deal.taskId || ''}</span>
                </div>
              ) : (
                <span className="text-xs text-plum-500 dark:text-[#b0b3b8]">
                  Xác nhận, điều chỉnh và thanh toán được thực hiện trong Chat for Task.
                </span>
              )}

              {!hideOpenChat && deal.conversationId && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/app/mentoring/chats/${deal.conversationId}`)}
                  leftIcon={<MessagesSquare className="h-4 w-4" />}
                  className="rounded-xl font-black text-xs"
                >
                  Mở Chat for Task
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
