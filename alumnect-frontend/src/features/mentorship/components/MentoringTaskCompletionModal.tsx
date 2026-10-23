import { useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-mint-50 via-mint-50 to-transparent dark:from-mint-950/20 dark:to-mint-950/20 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-success text-text-inverse shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                Nộp kết quả hoàn thành Task
              </h3>
              <p className="text-xs text-text-subtle mt-0.5">
                {taskTitle ? `Nhiệm vụ: ${taskTitle}` : 'Gửi sản phẩm bàn giao chờ học viên nghiệm thu'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 bg-surface text-text">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-danger-soft border border-danger-border rounded-xl text-danger text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 bg-info-soft border border-info rounded-xl text-xs text-info leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Quy trình nghiệm thu:</span> Khi bạn nộp kết quả, Task sẽ chuyển sang trạng thái{' '}
              <span className="font-bold text-info">Chờ nghiệm thu (SUBMITTED)</span>. Học viên sẽ kiểm tra và xác nhận hoàn thành để kích hoạt quyết toán thù lao cho bạn.
            </div>
          </div>

          {/* Field: Final Summary */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Mô tả kết quả cuối cùng <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              value={finalSummary}
              onChange={(e) => setFinalSummary(e.target.value)}
              placeholder="Tóm tắt những mục tiêu đã đạt được, kiến thức hoặc sản phẩm đã hoàn thiện trong suốt quá trình hướng dẫn..."
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none shadow-sm"
            />
            <p className="text-xs text-text-subtle mt-1">
              Mô tả chi tiết giúp học viên nắm rõ khối lượng công việc đã hoàn thành để nghiệm thu nhanh chóng.
            </p>
          </div>

          {/* Field: Deliverables */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Sản phẩm bàn giao / Deliverables (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="Ví dụ: Link GitHub Repository, Google Drive slide thuyết trình, tài liệu hướng dẫn cài đặt..."
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none shadow-sm"
            />
          </div>

          {/* Field: Attachment URLs */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-text mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-info" />
              Đường dẫn liên kết / Tệp đính kèm (Mỗi dòng 1 link)
            </label>
            <textarea
              rows={2}
              value={attachmentUrls}
              onChange={(e) => setAttachmentUrls(e.target.value)}
              placeholder="https://drive.google.com/file/...&#10;https://github.com/..."
              className="w-full px-3.5 py-2.5 text-xs text-text bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none font-mono text-xs shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
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
              className="px-5 py-2 text-xs font-semibold text-on-primary bg-primary-solid hover:bg-primary-hover rounded-xl shadow-md shadow-brand-600/20 flex items-center gap-2"
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
    </div>,
    document.body
  )
}
