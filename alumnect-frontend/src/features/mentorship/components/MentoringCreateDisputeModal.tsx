import React, { useState } from 'react'
import {
  AlertTriangle,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Send,
  Plus,
  Trash2,
  Link as LinkIcon,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useCreateDisputeTicket } from '../hooks/useMentoringTickets'
import type { TicketEvidencePayload } from '../model/mentoringTaskTypes'

interface MentoringCreateDisputeModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  taskTitle?: string
  isStudent?: boolean
  onSuccess?: () => void
}

const DISPUTE_REASONS = [
  { value: 'SUBSTANDARD_DELIVERABLE', label: 'Sản phẩm không đạt chất lượng / Không đúng cam kết' },
  { value: 'MISSED_DEADLINE', label: 'Trễ hạn bàn giao nghiêm trọng không có lý do chính đáng' },
  { value: 'UNRESPONSIVE', label: 'Đối phương không phản hồi liên lạc kéo dài' },
  { value: 'DISAGREE_SETTLEMENT', label: 'Bất đồng về tỷ lệ phân chia tiền dừng Task' },
  { value: 'OTHER', label: 'Lý do khác' },
]

export function MentoringCreateDisputeModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  isStudent,
  onSuccess,
}: MentoringCreateDisputeModalProps) {
  const [title, setTitle] = useState('')
  const [disputeReason, setDisputeReason] = useState(DISPUTE_REASONS[0].value)
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [desiredSolution, setDesiredSolution] = useState('')
  const [evidences, setEvidences] = useState<TicketEvidencePayload[]>([])
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('')
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createDisputeMutation = useCreateDisputeTicket(taskId)

  if (!isOpen) return null

  const handleAddEvidence = () => {
    if (!newEvidenceUrl.trim()) return
    setEvidences([
      ...evidences,
      {
        title: newEvidenceTitle.trim() || 'Tài liệu / Ảnh chụp minh chứng',
        fileUrl: newEvidenceUrl.trim(),
      },
    ])
    setNewEvidenceTitle('')
    setNewEvidenceUrl('')
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidences(evidences.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề khiếu nại.')
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMsg('Vui lòng mô tả chi tiết vấn đề phát sinh (tối thiểu 10 ký tự).')
      return
    }

    if (!desiredSolution.trim()) {
      setErrorMsg('Vui lòng nêu rõ phương án bạn mong muốn Ban Quản Trị giải quyết.')
      return
    }

    const finalReason = disputeReason === 'OTHER' && customReason.trim()
      ? customReason.trim()
      : disputeReason

    try {
      await createDisputeMutation.mutateAsync({
        title: title.trim(),
        disputeReason: finalReason,
        description: description.trim(),
        desiredSolution: desiredSolution.trim(),
        initialEvidences: evidences.length > 0 ? evidences : undefined,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
        err?.message ||
        'Có lỗi xảy ra khi tạo khiếu nại tranh chấp.'
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50 to-red-50 dark:from-slate-900 dark:to-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-600 text-white shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Mở khiếu nại tranh chấp</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Yêu cầu Ban Quản Trị can thiệp và phân xử công bằng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {taskTitle && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Nhiệm vụ khiếu nại: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{taskTitle}</span>
              </div>
            )}

            {/* Tiêu đề */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-white">
                Tiêu đề khiếu nại <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder="Ví dụ: Khiếu nại Mentor không bàn giao sản phẩm đúng cam kết"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Lý do tranh chấp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-white">
                Lý do khiếu nại chính <span className="text-red-500">*</span>
              </label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              >
                {DISPUTE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {disputeReason === 'OTHER' && (
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Nhập lý do cụ thể..."
                  className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              )}
            </div>

            {/* Chi tiết nội dung */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-white">
                Mô tả chi tiết vấn đề phát sinh <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="Trình bày rõ các mốc thời gian, cam kết bị vi phạm và những trao đổi đã thực hiện..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all resize-none"
              />
              <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                {description.length}/3000 ký tự
              </div>
            </div>

            {/* Phương án mong muốn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-900 dark:text-white">
                Phương án mong muốn Admin xử lý <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={desiredSolution}
                onChange={(e) => setDesiredSolution(e.target.value)}
                maxLength={255}
                placeholder={
                  isStudent
                    ? 'Ví dụ: Yêu cầu hoàn lại 80% học phí hoặc giao đủ source code'
                    : 'Ví dụ: Yêu cầu thanh toán 100% thù lao do đã bàn giao đầy đủ'
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Bằng chứng ban đầu (Evidence) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                Bằng chứng ban đầu (Ảnh chụp / Tài liệu minh chứng)
              </span>

              {evidences.length > 0 && (
                <div className="space-y-2 mb-2">
                  {evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <LinkIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="font-medium text-slate-900 dark:text-white truncate">{ev.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newEvidenceTitle}
                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                  placeholder="Tên tài liệu / mô tả..."
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder="Đường dẫn file (https://...)"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEvidence}
                disabled={!newEvidenceUrl.trim()}
                className="h-7 text-xs w-full"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Thêm bằng chứng vào danh sách
              </Button>
            </div>

            {/* Warning Alert */}
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Lưu ý khi mở khiếu nại tranh chấp</p>
                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  Khi Dispute Ticket được tạo, nhiệm vụ sẽ chuyển sang trạng thái <strong>DISPUTED</strong>. Toàn bộ tiền thù lao và các thao tác nghiệm thu sẽ được <strong>đóng băng (ON_HOLD)</strong> để Ban Quản Trị đối soát và phân xử.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createDisputeMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={createDisputeMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                {createDisputeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang tạo khiếu nại...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Xác nhận mở Dispute Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
