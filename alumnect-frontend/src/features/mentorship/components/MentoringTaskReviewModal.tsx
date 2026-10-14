import { useState } from 'react'
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-50 via-indigo-50 to-transparent dark:from-purple-950/20 dark:to-indigo-950/20 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nghiệm thu kết quả hoàn thành Task (UC110)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kiểm tra sản phẩm bàn giao từ Cố vấn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Timestamp Info */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-semibold text-xs overflow-hidden">
                {completion.submittedBy?.avatarUrl ? (
                  <img src={completion.submittedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{completion.submittedBy?.fullName || 'Mentor'}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5">(Cố vấn)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xs space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Mô tả kết quả hoàn thành từ Mentor:
            </h4>
            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {completion.finalSummary}
            </p>
          </div>

          {/* Deliverables Card */}
          {completion.deliverables && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                📦 Sản phẩm bàn giao / Deliverables:
              </h4>
              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {completion.deliverables}
              </p>
            </div>
          )}

          {/* Attachments */}
          {completion.attachmentUrls && completion.attachmentUrls.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                📎 Tệp & Đường dẫn đính kèm:
              </h4>
              <div className="space-y-1.5">
                {completion.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-xs text-blue-600 dark:text-blue-400 hover:text-purple-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
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
            <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1.5">
              Ý kiến nhận xét / Đánh giá của Học viên:
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Nhập cảm nhận hoặc yêu cầu chỉnh sửa bổ sung (bắt buộc nếu yêu cầu chỉnh sửa)..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
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
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
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
    </div>
  )
}
