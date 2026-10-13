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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#ffffff] rounded-2xl shadow-2xl border border-[#efe6db] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#fbf8f3] via-[#ffffff] to-[#effbf7] border-b border-[#efe6db]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#322c3f]">
                Nghiệm thu kết quả hoàn thành Task (UC110)
              </h3>
              <p className="text-xs text-[#6a6178] mt-0.5">
                Kiểm tra sản phẩm bàn giao từ Cố vấn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Timestamp Info */}
          <div className="flex items-center justify-between p-3.5 bg-[#fbf8f3] border border-[#efe6db] rounded-xl text-xs text-[#6a6178]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-xs overflow-hidden">
                {completion.submittedBy?.avatarUrl ? (
                  <img src={completion.submittedBy.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <span className="font-semibold text-[#322c3f]">{completion.submittedBy?.fullName || 'Mentor'}</span>
                <span className="text-[11px] text-[#8e859b] ml-1.5">(Cố vấn)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[#8e859b]">
              <Clock className="w-3.5 h-3.5" />
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-white border border-[#efe6db] rounded-xl shadow-sm space-y-1.5">
            <h4 className="text-xs font-semibold text-[#322c3f] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7f86ee]" />
              Mô tả kết quả hoàn thành từ Mentor:
            </h4>
            <p className="text-xs text-[#52495d] whitespace-pre-wrap leading-relaxed">
              {completion.finalSummary}
            </p>
          </div>

          {/* Deliverables Card */}
          {completion.deliverables && (
            <div className="p-4 bg-white border border-[#efe6db] rounded-xl shadow-sm space-y-1.5">
              <h4 className="text-xs font-semibold text-[#322c3f]">
                📦 Sản phẩm bàn giao / Deliverables:
              </h4>
              <p className="text-xs text-[#52495d] whitespace-pre-wrap leading-relaxed">
                {completion.deliverables}
              </p>
            </div>
          )}

          {/* Attachments */}
          {completion.attachmentUrls && completion.attachmentUrls.length > 0 && (
            <div className="p-4 bg-white border border-[#efe6db] rounded-xl shadow-sm space-y-2">
              <h4 className="text-xs font-semibold text-[#322c3f]">
                📎 Tệp & Đường dẫn đính kèm:
              </h4>
              <div className="space-y-1.5">
                {completion.attachmentUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-[#fbf8f3] hover:bg-purple-50 text-xs text-[#7f86ee] hover:text-purple-700 rounded-lg transition-colors border border-[#efe6db]"
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
            <label className="block text-xs font-semibold text-[#322c3f] mb-1.5">
              Ý kiến nhận xét / Đánh giá của Học viên:
            </label>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="Nhập cảm nhận hoặc yêu cầu chỉnh sửa bổ sung (bắt buộc nếu yêu cầu chỉnh sửa)..."
              className="w-full px-3.5 py-2.5 text-xs text-[#322c3f] bg-white border border-[#e2d9cf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f86ee]/30 focus:border-[#7f86ee] transition-all resize-none shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#efe6db]">
            <Button
              type="button"
              variant="outline"
              disabled={respondMutation.isPending}
              onClick={() => handleAction(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs text-amber-700 border-amber-200 hover:bg-amber-50 rounded-xl flex items-center justify-center gap-1.5"
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
                className="px-4 py-2 text-xs text-[#6a6178] border-[#e2d9cf] hover:bg-gray-50 rounded-xl"
              >
                Đóng
              </Button>
              <Button
                type="button"
                disabled={respondMutation.isPending}
                onClick={() => handleAction(true)}
                className="px-5 py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
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
