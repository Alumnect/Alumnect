import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import {
  useSettlementSnapshot,
  useSubmitSettlementTicket,
} from '../hooks/useMentoringTickets'

interface MentoringSubmitSettlementTicketModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  onSuccess?: () => void
}

export function MentoringSubmitSettlementTicketModal({
  isOpen,
  onClose,
  taskId,
  onSuccess,
}: MentoringSubmitSettlementTicketModalProps) {
  const [note, setNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: snapshot, isLoading: isLoadingSnapshot, isError } = useSettlementSnapshot(taskId, isOpen)
  const submitTicketMutation = useSubmitSettlementTicket(taskId)

  if (!isOpen) return null

  const formatVnd = (amt?: number) => {
    if (typeof amt !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + 'đ'
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return format(parseISO(iso), 'dd/MM/yyyy HH:mm')
    } catch {
      return iso
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!snapshot || !snapshot.settlementProposalId) {
      setErrorMsg('Không tìm thấy thông tin thỏa thuận hợp lệ để tạo Ticket.')
      return
    }

    try {
      await submitTicketMutation.mutateAsync({
        proposalId: snapshot.settlementProposalId,
        note: note.trim() || undefined,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Có lỗi xảy ra khi gửi Settlement Ticket tới Admin.'
      )
    }
  }

  const total = snapshot ? snapshot.totalBudget || snapshot.mentorAmount + snapshot.studentRefund : 0
  const mentorPercent = total > 0 && snapshot ? Math.round((snapshot.mentorAmount / total) * 100) : 0
  const studentPercent = 100 - mentorPercent

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#242526] border border-cream-300 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-300 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-500/5 to-violet-500/5 dark:from-[#242526] dark:to-violet-600/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500 text-white shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-plum-900 dark:text-white">Gửi yêu cầu tất toán tới Admin</h3>
              <p className="text-xs text-plum-500 dark:text-plum-400">Yêu cầu Ban Quản Trị giải ngân và hoàn tiền theo thỏa thuận</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-plum-400 hover:text-plum-600 dark:hover:text-[#e4e6eb] hover:bg-cream-200 dark:hover:bg-[#3a3b3c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-[#242526] text-plum-900 dark:text-white">
          {isLoadingSnapshot ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-plum-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              <p className="text-sm">Đang tải biên bản Settlement Snapshot...</p>
            </div>
          ) : isError || !snapshot ? (
            <div className="p-4 rounded-xl border border-coral-200 dark:border-coral-900 bg-coral-50 dark:bg-coral-950/40 text-coral-700 dark:text-coral-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Không thể tải Settlement Snapshot</p>
                <p className="text-xs mt-0.5">Vui lòng đảm bảo hai bên đã đồng thuận đề xuất dừng Task trước khi gửi Ticket.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl border border-coral-200 dark:border-coral-900 bg-coral-50 dark:bg-coral-950/40 text-coral-700 dark:text-coral-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Settlement Snapshot Box */}
              <div className="p-4 rounded-xl border border-cream-300 dark:border-white/10 bg-cream-100 dark:bg-[#3a3b3c]/60 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-cream-300 dark:border-white/10">
                  <span className="text-xs font-semibold text-plum-500 dark:text-plum-400 uppercase tracking-wider">
                    Biên bản chốt thỏa thuận
                  </span>
                  <span className="text-xs text-plum-500 dark:text-plum-400">
                    Thời gian chốt: {formatDt(snapshot.agreedAt)}
                  </span>
                </div>

                <div className="text-sm">
                  <span className="text-plum-500 dark:text-plum-400">Nhiệm vụ: </span>
                  <span className="font-semibold text-plum-900 dark:text-white">{snapshot.taskTitle}</span>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-violet-500 dark:text-violet-400">
                      Mentor ({mentorPercent}%): {formatVnd(snapshot.mentorAmount)}
                    </span>
                    <span className="text-violet-500 dark:text-violet-400">
                      Bên tạo yêu cầu ({studentPercent}%): {formatVnd(snapshot.studentRefund)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-violet-500/10 dark:bg-violet-600/60 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-violet-500 transition-all duration-300"
                      style={{ width: `${mentorPercent}%` }}
                    />
                    <div
                      className="h-full bg-violet-500 transition-all duration-300"
                      style={{ width: `${studentPercent}%` }}
                    />
                  </div>
                  <div className="text-right text-[11px] text-plum-500 dark:text-plum-400">
                    Tổng ngân sách: <strong>{formatVnd(total)}</strong>
                  </div>
                </div>

                {/* Lý do thỏa thuận */}
                <div className="p-3 rounded-lg bg-white dark:bg-[#3a3b3c] border border-cream-300 dark:border-white/10 text-xs text-plum-800 dark:text-[#e4e6eb] space-y-1">
                  <span className="font-medium text-plum-500 dark:text-plum-400 block">Lý do hai bên thống nhất:</span>
                  <p className="italic">&ldquo;{snapshot.reason}&rdquo;</p>
                </div>
              </div>

              {/* Note input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-plum-900 dark:text-white">
                  Ghi chú thêm gửi Ban Quản Trị (Tùy chọn)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Ghi chú thêm về thông tin tài khoản hoặc ngữ cảnh bàn giao..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-cream-300 dark:border-white/10 bg-white dark:bg-[#3a3b3c] text-plum-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                />
                <div className="text-right text-[11px] text-plum-500 dark:text-plum-400">
                  {note.length}/1000 ký tự
                </div>
              </div>

              {/* Important Alert */}
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Lưu ý quan trọng trước khi gửi Ticket</p>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                    Khi gửi Ticket, nhiệm vụ sẽ chính thức chuyển sang trạng thái <strong>Dừng (CANCELLED)</strong>. Ban Quản Trị sẽ căn cứ vào biên bản này để tiến hành giải ngân thanh toán và hoàn tiền về ví/tài khoản của hai bên.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-cream-300 dark:border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitTicketMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={submitTicketMutation.isPending || !snapshot}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-semibold"
                >
                  {submitTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi Ticket...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Xác nhận gửi Ticket tới Admin
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
