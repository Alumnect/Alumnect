import React, { useState } from 'react'
import {
  Scale,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useCreateSettlementProposal } from '../hooks/useMentoringTaskResolutions'

interface MentoringSettlementProposalModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  totalBudget: number
  onSuccess?: () => void
}

export function MentoringSettlementProposalModal({
  isOpen,
  onClose,
  taskId,
  totalBudget,
  onSuccess,
}: MentoringSettlementProposalModalProps) {
  // Mặc định chia 50-50
  const [mentorAmount, setMentorAmount] = useState<number>(Math.round(totalBudget * 0.5))
  const [studentRefund, setStudentRefund] = useState<number>(totalBudget - Math.round(totalBudget * 0.5))
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useCreateSettlementProposal(taskId)

  if (!isOpen) return null

  const formatVnd = (amt: number) => new Intl.NumberFormat('vi-VN').format(amt) + 'đ'

  const handleMentorChange = (val: number) => {
    const clamped = Math.max(0, Math.min(totalBudget, val))
    setMentorAmount(clamped)
    setStudentRefund(totalBudget - clamped)
  }

  const handleStudentChange = (val: number) => {
    const clamped = Math.max(0, Math.min(totalBudget, val))
    setStudentRefund(clamped)
    setMentorAmount(totalBudget - clamped)
  }

  const handlePreset = (percentToMentor: number) => {
    const mAmount = Math.round((totalBudget * percentToMentor) / 100)
    setMentorAmount(mAmount)
    setStudentRefund(totalBudget - mAmount)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (mentorAmount + studentRefund !== totalBudget) {
      setErrorMsg(`Tổng số tiền phân chia (${formatVnd(mentorAmount + studentRefund)}) phải bằng đúng ngân sách Task (${formatVnd(totalBudget)}).`)
      return
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setErrorMsg('Vui lòng nhập lý do đề xuất dừng Task (tối thiểu 10 ký tự).')
      return
    }

    try {
      await createMutation.mutateAsync({
        mentorAmount,
        studentRefund,
        reason: reason.trim(),
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi đề xuất dừng Task.')
    }
  }

  const mentorPercent = totalBudget > 0 ? Math.round((mentorAmount / totalBudget) * 100) : 0
  const studentPercent = 100 - mentorPercent

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-slate-900 dark:to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Thỏa thuận dừng Task & Phân chia tiền</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Đề xuất phân chia quỹ Task chưa hoàn thành (UC109, mục 5.6)</p>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Total budget display */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Tổng quỹ thanh toán của Task</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">{formatVnd(totalBudget)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 30, 50, 70, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className={`px-2 py-1 text-xs rounded-lg font-semibold transition ${
                    mentorPercent === p
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          {/* Progress bar split */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-purple-600 dark:text-purple-400">Mentor nhận ({mentorPercent}%)</span>
              <span className="text-blue-600 dark:text-blue-400">Hoàn lại Học viên ({studentPercent}%)</span>
            </div>
            <div className="h-3 w-full bg-blue-100 dark:bg-blue-950/60 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-purple-600 transition-all duration-200"
                style={{ width: `${mentorPercent}%` }}
              />
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${studentPercent}%` }}
              />
            </div>
          </div>

          {/* Amounts input */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Mentor Amount (VND)
              </label>
              <input
                type="number"
                min="0"
                max={totalBudget}
                step="5000"
                value={mentorAmount}
                onChange={(e) => handleMentorChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{formatVnd(mentorAmount)}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Student Refund (VND)
              </label>
              <input
                type="number"
                min="0"
                max={totalBudget}
                step="5000"
                value={studentRefund}
                onChange={(e) => handleStudentChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{formatVnd(studentRefund)}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Lý do đề xuất dừng Task & tỷ lệ chia tiền <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giải trình khối lượng công việc đã hoàn thành hoặc lý do không thể tiếp tục thực hiện..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition resize-none"
              required
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tối thiểu 10 ký tự</span>
              <span>{reason.length}/1000</span>
            </div>
          </div>

          {/* Info notice */}
          <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-300 text-xs space-y-1">
            <p className="font-semibold">Quy trình xử lý sau khi hai bên đồng thuận:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
              <li>Nếu cả hai bên đồng thuận với phương án này: Task sẽ dừng lại và chuyển tiếp sang UC111 (Settlement Ticket) gửi Admin để thực hiện giải ngân cho Mentor và hoàn tiền cho Học viên.</li>
              <li>Nếu một bên từ chối: Hai bên có thể tiếp tục thương lượng tỷ lệ khác hoặc gửi Dispute Ticket (UC112) để Admin can thiệp.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Gửi đề xuất phân chia
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
