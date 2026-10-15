import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  /**
   * True nếu người mở khiếu nại là Bên tạo yêu cầu (Requester - có thể là Học viên hoặc Mentor khác thuê hướng dẫn)
   * False nếu là Bên thực hiện (Performer / Mentor được thuê)
   */
  isRequester?: boolean
  /** Alias cho isRequester để đảm bảo tương thích ngược */
  isStudent?: boolean
  onSuccess?: () => void
}

/** Danh mục lý do dành cho Bên tạo yêu cầu (Requester - Học viên hoặc Mentor thuê hướng dẫn) */
const REQUESTER_DISPUTE_REASONS = [
  { value: 'SUBSTANDARD_DELIVERABLE', label: 'Sản phẩm bàn giao không đạt chất lượng / Không đúng cam kết ban đầu' },
  { value: 'MISSED_DEADLINE', label: 'Bên thực hiện trễ hạn bàn giao nghiêm trọng không có lý do chính đáng' },
  { value: 'UNRESPONSIVE', label: 'Bên thực hiện không phản hồi liên lạc kéo dài (ngừng hỗ trợ / bỏ bê Task)' },
  { value: 'UNREASONABLE_DEMAND', label: 'Bên thực hiện đòi hỏi chi phí phát sinh ngoài thỏa thuận' },
  { value: 'DISAGREE_SETTLEMENT', label: 'Bất đồng về tỷ lệ phân chia tiền khi dừng Task' },
  { value: 'OTHER', label: 'Lý do khác' },
]

/** Danh mục lý do dành cho Bên thực hiện (Performer - Mentor nhận hướng dẫn / thực hiện Task) */
const PERFORMER_DISPUTE_REASONS = [
  { value: 'STUDENT_UNRESPONSIVE', label: 'Bên tạo yêu cầu không phản hồi, chậm trễ nghiệm thu / xác nhận kết quả' },
  { value: 'OUT_OF_SCOPE_DEMAND', label: 'Bên tạo yêu cầu từ chối nghiệm thu vô cớ hoặc đòi hỏi ngoài thỏa thuận' },
  { value: 'UNPAID_ADDITIONAL_FEE', label: 'Bên tạo yêu cầu không thanh toán khoản tiền bổ sung đã thỏa thuận' },
  { value: 'DISAGREE_SETTLEMENT', label: 'Bất đồng về tỷ lệ phân chia tiền khi dừng Task' },
  { value: 'STUDENT_MISCONDUCT', label: 'Bên tạo yêu cầu có hành vi thiếu chuẩn mực / vi phạm quy tắc hợp tác' },
  { value: 'OTHER', label: 'Lý do khác' },
]

export function MentoringCreateDisputeModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  isRequester,
  isStudent = false,
  onSuccess,
}: MentoringCreateDisputeModalProps) {
  // Xác định vai trò: ưu tiên isRequester, fallback sang isStudent
  const isRequesterRole = isRequester !== undefined ? isRequester : isStudent
  const disputeReasons = isRequesterRole ? REQUESTER_DISPUTE_REASONS : PERFORMER_DISPUTE_REASONS
  const [title, setTitle] = useState('')
  const [disputeReason, setDisputeReason] = useState(disputeReasons[0].value)
  const [customReason, setCustomReason] = useState('')
  const [description, setDescription] = useState('')
  const [desiredSolution, setDesiredSolution] = useState('')
  const [evidences, setEvidences] = useState<TicketEvidencePayload[]>([])
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('')
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDisputeReason(isRequesterRole ? REQUESTER_DISPUTE_REASONS[0].value : PERFORMER_DISPUTE_REASONS[0].value)
      setTitle('')
      setCustomReason('')
      setDescription('')
      setDesiredSolution('')
      setEvidences([])
      setErrorMsg(null)
    }
  }, [isOpen, isRequesterRole])

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

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-coral-50 to-coral-50 dark:from-surface dark:to-coral-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-danger text-text-inverse shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-text">Mở khiếu nại tranh chấp</h3>
              <p className="text-xs text-text-subtle">Yêu cầu Ban Quản Trị can thiệp và phân xử công bằng</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-subtle hover:text-text-muted hover:bg-surface-3 dark:hover:bg-surface-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 bg-surface text-text">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl border border-danger-border bg-danger-soft text-danger text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2 border border-border text-xs">
              <span className="text-text-subtle">
                Vai trò của bạn khi mở khiếu nại:
              </span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                isRequesterRole 
                  ? 'bg-info-soft text-info' 
                  : 'bg-primary-soft text-primary-solid'
              }`}>
                {isRequesterRole ? 'Bên tạo yêu cầu (Requester)' : 'Bên thực hiện (Mentor)'}
              </span>
            </div>

            {taskTitle && (
              <div className="p-3 rounded-xl bg-surface-2 border border-border text-xs">
                <span className="text-text-subtle">Nhiệm vụ khiếu nại: </span>
                <span className="font-semibold text-text">{taskTitle}</span>
              </div>
            )}

            {/* Tiêu đề */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Tiêu đề khiếu nại <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                placeholder={
                  isRequesterRole
                    ? 'Ví dụ: Khiếu nại Bên thực hiện không bàn giao kết quả đúng cam kết'
                    : 'Ví dụ: Khiếu nại Bên tạo yêu cầu chậm trễ nghiệm thu và đòi hỏi ngoài thỏa thuận'
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all"
              />
            </div>

            {/* Lý do tranh chấp */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Lý do khiếu nại chính ({isRequesterRole ? 'Dành cho Bên tạo yêu cầu' : 'Dành cho Bên thực hiện'}) <span className="text-danger">*</span>
              </label>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all"
              >
                {disputeReasons.map((r) => (
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
                  className="w-full mt-2 px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all"
                />
              )}
            </div>

            {/* Chi tiết nội dung */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Mô tả chi tiết vấn đề phát sinh <span className="text-danger">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
                rows={4}
                placeholder="Trình bày rõ các mốc thời gian, cam kết bị vi phạm và những trao đổi đã thực hiện..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all resize-none"
              />
              <div className="text-right text-xs text-text-subtle">
                {description.length}/3000 ký tự
              </div>
            </div>

            {/* Phương án mong muốn */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text">
                Phương án mong muốn Admin xử lý <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={desiredSolution}
                onChange={(e) => setDesiredSolution(e.target.value)}
                maxLength={255}
                placeholder={
                  isRequesterRole
                    ? 'Ví dụ: Yêu cầu hoàn lại 80% tiền ký quỹ hoặc bàn giao đúng kết quả cam kết'
                    : 'Ví dụ: Yêu cầu giải ngân 100% thù lao do đã bàn giao đầy đủ sản phẩm cam kết'
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-danger focus:border-danger transition-all"
              />
            </div>

            {/* Bằng chứng ban đầu (Evidence) */}
            <div className="space-y-2 p-3.5 rounded-xl border border-border bg-surface-2">
              <span className="text-xs font-semibold text-text block">
                Bằng chứng ban đầu (Ảnh chụp / Tài liệu minh chứng)
              </span>

              {evidences.length > 0 && (
                <div className="space-y-2 mb-2">
                  {evidences.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-surface border border-border flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <LinkIcon className="w-3.5 h-3.5 text-info shrink-0" />
                        <span className="font-medium text-text truncate">{ev.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEvidence(idx)}
                        className="text-text-subtle hover:text-danger p-1 rounded transition-colors"
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
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text"
                />
                <input
                  type="url"
                  value={newEvidenceUrl}
                  onChange={(e) => setNewEvidenceUrl(e.target.value)}
                  placeholder="Đường dẫn file (https://...)"
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-text"
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
            <div className="p-3.5 rounded-xl border border-warning-border bg-warning-soft text-warning text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-warning mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Lưu ý khi mở khiếu nại tranh chấp</p>
                <p className="text-xs leading-relaxed text-warning">
                  Khi Dispute Ticket được tạo, nhiệm vụ sẽ chuyển sang trạng thái <strong>DISPUTED</strong>. Toàn bộ tiền thù lao và các thao tác nghiệm thu sẽ được <strong>đóng băng (ON_HOLD)</strong> để Ban Quản Trị đối soát và phân xử.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
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
                className="bg-danger hover:opacity-90 text-text-inverse font-semibold"
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
    </div>,
    document.body
  )
}
