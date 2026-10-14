import { useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  X,
  FileCheck2,
  AlertCircle,
  Loader2,
  Link2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useSubmitTaskCompletion } from '../hooks/useMentoringTaskCompletion'

interface MentoringTaskCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  taskTitle?: string
  onSuccess?: () => void
}

export function MentoringTaskCompletionModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onSuccess,
}: MentoringTaskCompletionModalProps) {
  const [finalSummary, setFinalSummary] = useState('')
  const [deliverables, setDeliverables] = useState('')
  const [attachmentUrls, setAttachmentUrls] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const submitMutation = useSubmitTaskCompletion(taskId)

  if (!isOpen) return null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!finalSummary.trim()) {
      setErrorMsg('Vui lòng nhập tóm tắt kết quả hoàn thành nhiệm vụ.')
      return
    }

    if (finalSummary.trim().length < 10) {
      setErrorMsg('Mô tả kết quả phải có tối thiểu 10 ký tự.')
      return
    }

    const urls = attachmentUrls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)

    try {
      await submitMutation.mutateAsync({
        finalSummary: finalSummary.trim(),
        deliverables: deliverables.trim() || undefined,
        attachmentUrls: urls.length > 0 ? urls : undefined,
      })
      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          'Không thể nộp kết quả nghiệm thu. Vui lòng thử lại.'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-transparent dark:from-emerald-950/20 dark:to-teal-950/20 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Nộp kết quả hoàn thành Task (UC110)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {taskTitle ? `Nhiệm vụ: ${taskTitle}` : 'Gửi sản phẩm bàn giao chờ học viên nghiệm thu'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded-xl text-xs text-purple-900 dark:text-purple-300 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Quy trình nghiệm thu:</span> Khi bạn nộp kết quả, Task sẽ chuyển sang trạng thái{' '}
              <span className="font-bold text-purple-800 dark:text-purple-200">Chờ nghiệm thu (SUBMITTED)</span>. Học viên sẽ kiểm tra và xác nhận hoàn thành để kích hoạt quyết toán thù lao cho bạn.
            </div>
          </div>

          {/* Field: Final Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1.5">
              Mô tả kết quả cuối cùng <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={finalSummary}
              onChange={(e) => setFinalSummary(e.target.value)}
              placeholder="Tóm tắt những mục tiêu đã đạt được, kiến thức hoặc sản phẩm đã hoàn thiện trong suốt quá trình hướng dẫn..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none shadow-sm"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Mô tả chi tiết giúp học viên nắm rõ khối lượng công việc đã hoàn thành để nghiệm thu nhanh chóng.
            </p>
          </div>

          {/* Field: Deliverables */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1.5">
              Sản phẩm bàn giao / Deliverables (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="Ví dụ: Link GitHub Repository, Google Drive slide thuyết trình, tài liệu hướng dẫn cài đặt..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none shadow-sm"
            />
          </div>

          {/* Field: Attachment URLs */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-blue-500" />
              Đường dẫn liên kết / Tệp đính kèm (Mỗi dòng 1 link)
            </label>
            <textarea
              rows={2}
              value={attachmentUrls}
              onChange={(e) => setAttachmentUrls(e.target.value)}
              placeholder="https://drive.google.com/file/...&#10;https://github.com/..."
              className="w-full px-3.5 py-2.5 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none font-mono text-[11px] shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitMutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi kết quả...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Nộp kết quả nghiệm thu
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
