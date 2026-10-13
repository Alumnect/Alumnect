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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#ffffff] rounded-2xl shadow-2xl border border-[#efe6db] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#fbf8f3] via-[#ffffff] to-[#f4f2ff] border-b border-[#efe6db]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#322c3f]">
                Nộp kết quả hoàn thành Task (UC110)
              </h3>
              <p className="text-xs text-[#6a6178] mt-0.5">
                {taskTitle ? `Nhiệm vụ: ${taskTitle}` : 'Gửi sản phẩm bàn giao chờ học viên nghiệm thu'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Info Banner */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-200/60 rounded-xl text-xs text-purple-900 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Quy trình nghiệm thu:</span> Khi bạn nộp kết quả, Task sẽ chuyển sang trạng thái{' '}
              <span className="font-semibold text-purple-800">Chờ nghiệm thu (SUBMITTED)</span>. Học viên sẽ kiểm tra và xác nhận hoàn thành để kích hoạt quyết toán thù lao cho bạn.
            </div>
          </div>

          {/* Field: Final Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#322c3f] mb-1.5">
              Mô tả kết quả cuối cùng <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={finalSummary}
              onChange={(e) => setFinalSummary(e.target.value)}
              placeholder="Tóm tắt những mục tiêu đã đạt được, kiến thức hoặc sản phẩm đã hoàn thiện trong suốt quá trình hướng dẫn..."
              className="w-full px-3.5 py-2.5 text-xs text-[#322c3f] bg-white border border-[#e2d9cf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f86ee]/30 focus:border-[#7f86ee] transition-all resize-none shadow-sm"
            />
            <p className="text-[11px] text-[#8e859b] mt-1">
              Mô tả chi tiết giúp học viên nắm rõ khối lượng công việc đã hoàn thành để nghiệm thu nhanh chóng.
            </p>
          </div>

          {/* Field: Deliverables */}
          <div>
            <label className="block text-xs font-semibold text-[#322c3f] mb-1.5">
              Sản phẩm bàn giao / Deliverables (Tùy chọn)
            </label>
            <textarea
              rows={3}
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              placeholder="Ví dụ: Link GitHub Repository, Google Drive slide thuyết trình, tài liệu hướng dẫn cài đặt..."
              className="w-full px-3.5 py-2.5 text-xs text-[#322c3f] bg-white border border-[#e2d9cf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f86ee]/30 focus:border-[#7f86ee] transition-all resize-none shadow-sm"
            />
          </div>

          {/* Field: Attachment URLs */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-[#322c3f] mb-1.5">
              <Link2 className="w-3.5 h-3.5 text-[#7f86ee]" />
              Đường dẫn liên kết / Tệp đính kèm (Mỗi dòng 1 link)
            </label>
            <textarea
              rows={2}
              value={attachmentUrls}
              onChange={(e) => setAttachmentUrls(e.target.value)}
              placeholder="https://drive.google.com/file/...&#10;https://github.com/..."
              className="w-full px-3.5 py-2.5 text-xs text-[#322c3f] bg-white border border-[#e2d9cf] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7f86ee]/30 focus:border-[#7f86ee] transition-all resize-none font-mono text-[11px] shadow-sm"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#efe6db]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitMutation.isPending}
              className="px-4 py-2 text-xs text-[#6a6178] border-[#e2d9cf] hover:bg-gray-50 rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="px-5 py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
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
