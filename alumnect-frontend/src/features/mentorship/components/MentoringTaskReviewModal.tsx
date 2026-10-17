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
        className="relative w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-violet-500/5 via-violet-500/5 to-transparent dark:from-violet-600/20 dark:to-violet-600/20 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-info text-text-inverse shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                Nghiệm thu kết quả hoàn thành Task
              </h3>
              <p className="text-xs text-text-subtle mt-0.5">
                Kiểm tra sản phẩm bàn giao từ Cố vấn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-text-subtle hover:text-text-muted rounded-lg hover:bg-surface-3 dark:hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 bg-surface text-text">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger-soft border border-danger-border rounded-xl text-danger text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Timestamp Info */}
          <div className="flex items-center justify-between p-3.5 bg-surface-2 border border-border rounded-xl text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-info-soft text-info flex items-center justify-center font-semibold text-xs overflow-hidden">
                {completion.submittedBy?.avatarUrl ? (
                  <img src={completion.submittedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <span className="font-semibold text-text">{completion.submittedBy?.fullName || 'Mentor'}</span>
                <span className="text-xs text-text-subtle ml-1.5">(Cố vấn)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-text-subtle">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-1.5">
            <h4 className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-info" />
              Mô tả kết quả hoàn thành từ Mentor:
            </h4>
            <p className="text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
              {completion.finalSummary}
            </p>
          </div>

          {/* Deliverables Card */}
          {completion.deliverables && (
            <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-1.5">
              <h4 className="text-xs font-semibold text-text">
                📦 Sản phẩm bàn giao / Deliverables:
              </h4>
              <p className="text-xs text-text-muted whitespace-pre-wrap leading-relaxed">
                {completion.deliverables}
              </p>
            </div>
          )}

          {/* Attachments */}
          {completion.attachmentUrls && completion.attachmentUrls.length > 0 && (
            <div className="p-4 bg-surface-2 border border-border rounded-xl shadow-xs space-y-2">
              <h4 className="text-xs font-semibold text-text">
                📎 Tệp & Đường dẫn đính kèm:
              </h4>
              <div className="space-y-1.5">
                {completion.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-surface hover:bg-info-soft text-xs text-info hover:text-info rounded-lg transition-colors border border-border"
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
            <label className="block text-xs font-semibold text-text mb-1.5">
              Ý kiến nhận xét / Đánh giá của Học viên:
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Nhập cảm nhận hoặc yêu cầu chỉnh sửa bổ sung (bắt buộc nếu yêu cầu chỉnh sửa)..."
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={respondMutation.isPending}
              onClick={() => handleAction(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs text-warning border-warning-border hover:bg-warning-soft rounded-xl flex items-center justify-center gap-1.5 font-semibold"
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
                className="px-5 py-2 text-xs font-semibold text-on-primary bg-primary-solid hover:bg-primary-hover rounded-xl shadow-md shadow-brand-600/20 flex items-center justify-center gap-2"
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
