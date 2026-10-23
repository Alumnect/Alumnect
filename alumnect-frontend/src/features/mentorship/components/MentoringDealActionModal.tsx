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
      <div className="relative w-full max-w-3xl bg-surface rounded-3xl border border-border shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[92vh] overflow-y-auto chat-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 p-2 text-text-subtle hover:text-text-muted rounded-full hover:bg-surface-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header & Tabs */}
        <div className="space-y-4 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-solid" />
              <h3 className="font-display text-lg font-bold text-text">
                Mentoring Deal #{dealId}
              </h3>
            </div>
            <p className="text-xs text-text-subtle mt-0.5">
              {deal?.requestTitle ? `Request: ${deal.requestTitle}` : 'Điều khoản và lịch sử các phiên bản Deal Ticket.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('snapshot')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'snapshot'
                  ? 'bg-primary-solid text-on-primary shadow-xs'
                  : 'bg-surface-2 text-text-muted hover:bg-surface-3'
              }`}
            >
              Phiên bản mới nhất
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'history'
                  ? 'bg-primary-solid text-on-primary shadow-xs'
                  : 'bg-surface-2 text-text-muted hover:bg-surface-3'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Lịch sử phiên bản ({snapshots.length})</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-text-subtle">
            <Loader2 className="h-7 w-7 animate-spin text-primary-solid" />
            <p className="text-xs font-medium">Đang tải chi tiết Deal...</p>
          </div>
        ) : !deal ? (
          <div className="py-12 text-center text-xs text-text-subtle">Không tìm thấy thông tin thỏa thuận Deal.</div>
        ) : (
          <div className="space-y-6">
            {activeTab === 'snapshot' ? (
              <MentoringDealSnapshotCard deal={deal} />
            ) : (
              <MentoringDealHistoryTimeline snapshots={snapshots} currentVersion={deal.version} />
            )}

            {deal.readOnlyReason && (
              <div className="flex items-start gap-2 rounded-2xl bg-warning-soft p-3 text-xs font-semibold text-warning">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{deal.readOnlyReason}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              {deal.isPaid ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-soft text-success border border-success-border text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>Đã thanh toán • Task #{deal.taskId || ''}</span>
                </div>
              ) : (
                <span className="text-xs text-text-subtle">
                  Xác nhận, điều chỉnh và thanh toán được thực hiện trong phần Nhắn tin.
                </span>
              )}

              {!hideOpenChat && deal.conversationId && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/app/mentoring/chats/${deal.conversationId}`)}
                  leftIcon={<MessagesSquare className="h-4 w-4" />}
                  className="rounded-xl font-bold text-xs"
                >
                  Nhắn tin
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
