import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle2,
  X,
  FileCheck,
  AlertCircle,
  Loader2,
  ExternalLink,
  RotateCcw,
  Sparkles,
  User,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import { useRespondTaskCompletion } from '../hooks/useMentoringTaskCompletion'
import type { MentoringTaskCompletion } from '../model/mentoringTaskTypes'

interface MentoringTaskReviewModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  completion: MentoringTaskCompletion
  onSuccess?: () => void
}

export function MentoringTaskReviewModal({
  isOpen,
  onClose,
  taskId,
  completion,
  onSuccess,
}: MentoringTaskReviewModalProps) {
  const [feedbackNote, setFeedbackNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | null>(null)

  const respondMutation = useRespondTaskCompletion(taskId)

  if (!isOpen) return null

  const formattedDate = (() => {
    try {
      return format(parseISO(completion.createdAt), 'dd/MM/yyyy HH:mm')
    } catch {
      return completion.createdAt
    }
  })()

  const handleAction = async (accept: boolean) => {
    setErrorMsg(null)
    setActionType(accept ? 'ACCEPT' : 'REJECT')

    if (!accept && (!feedbackNote || !feedbackNote.trim())) {
      setErrorMsg('Vui lòng nhập lý do hoặc yêu cầu chỉnh sửa/bổ sung để Mentor có thể cập nhật lại.')
      return
    }

    try {
      await respondMutation.mutateAsync({
        completionId: completion.id,
        payload: {
          accept,
          feedbackNote: feedbackNote.trim() || undefined,
        },
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể xử lý phản hồi nghiệm thu. Vui lòng thử lại.'
      )
    } finally {
      setActionType(null)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-[#242526] rounded-2xl shadow-2xl border border-cream-300 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-500/5 via-violet-500/5 to-transparent dark:from-violet-600/20 dark:to-violet-600/20 border-b border-cream-300 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-500 text-white shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-plum-900 dark:text-white">
                Nghiệm thu kết quả hoàn thành Task
              </h3>
              <p className="text-xs text-plum-500 dark:text-plum-400 mt-0.5">
                Kiểm tra sản phẩm bàn giao từ Cố vấn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-plum-400 hover:text-plum-600 dark:hover:text-[#e4e6eb] rounded-lg hover:bg-cream-200 dark:hover:bg-[#3a3b3c] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-[#242526] text-plum-900 dark:text-white">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-coral-50 dark:bg-coral-950/40 border border-coral-200 dark:border-coral-900 rounded-xl text-coral-700 dark:text-coral-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-coral-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Timestamp Info */}
          <div className="flex items-center justify-between p-3.5 bg-cream-100 dark:bg-[#3a3b3c]/60 border border-cream-300 dark:border-white/10 rounded-xl text-xs text-plum-600 dark:text-plum-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-violet-500/10 dark:bg-violet-600/60 text-violet-500 dark:text-violet-300 flex items-center justify-center font-semibold text-xs overflow-hidden">
                {completion.submittedBy?.avatarUrl ? (
                  <img src={completion.submittedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <span className="font-semibold text-plum-900 dark:text-white">{completion.submittedBy?.fullName || 'Mentor'}</span>
                <span className="text-[11px] text-plum-500 dark:text-plum-400 ml-1.5">(Cố vấn)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-plum-500 dark:text-plum-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-cream-100 dark:bg-[#3a3b3c]/50 border border-cream-300 dark:border-white/10 rounded-xl shadow-xs space-y-1.5">
            <h4 className="text-xs font-semibold text-plum-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              Mô tả kết quả hoàn thành từ Mentor:
            </h4>
            <p className="text-xs text-plum-700 dark:text-[#b0b3b8] whitespace-pre-wrap leading-relaxed">
              {completion.finalSummary}
            </p>
          </div>

          {/* Deliverables Card */}
          {completion.deliverables && (
            <div className="p-4 bg-cream-100 dark:bg-[#3a3b3c]/50 border border-cream-300 dark:border-white/10 rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-xs font-semibold text-plum-900 dark:text-white">
                📦 Sản phẩm bàn giao / Deliverables:
              </h4>
              <p className="text-xs text-plum-700 dark:text-[#b0b3b8] whitespace-pre-wrap leading-relaxed">
                {completion.deliverables}
              </p>
            </div>
          )}

          {/* Attachments */}
          {completion.attachmentUrls && completion.attachmentUrls.length > 0 && (
            <div className="p-4 bg-cream-100 dark:bg-[#3a3b3c]/50 border border-cream-300 dark:border-white/10 rounded-xl shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-plum-900 dark:text-white">
                📎 Tệp & Đường dẫn đính kèm:
              </h4>
              <div className="space-y-1.5">
                {completion.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-white dark:bg-[#3a3b3c] hover:bg-violet-500/5 dark:hover:bg-violet-600/40 text-xs text-violet-500 dark:text-violet-400 hover:text-violet-500 rounded-lg transition-colors border border-cream-300 dark:border-white/10"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Feedback note input */}
          <div>
            <label className="block text-xs font-semibold text-plum-900 dark:text-white mb-1.5">
              Ý kiến nhận xét / Đánh giá của Học viên:
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Nhập cảm nhận hoặc yêu cầu chỉnh sửa bổ sung (bắt buộc nếu yêu cầu chỉnh sửa)..."
              className="w-full px-3.5 py-2.5 text-xs text-plum-900 dark:text-white bg-white dark:bg-[#3a3b3c] border border-cream-300 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-cream-300 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              disabled={respondMutation.isPending}
              onClick={() => handleAction(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl flex items-center justify-center gap-1.5 font-semibold"
            >
              {actionType === 'REJECT' && respondMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Yêu cầu chỉnh sửa / Bổ sung
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={respondMutation.isPending}
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={respondMutation.isPending}
                onClick={() => handleAction(true)}
                className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
              >
                {actionType === 'ACCEPT' && respondMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Xác nhận Task hoàn thành
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
