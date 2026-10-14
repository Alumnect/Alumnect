import React, { useState } from 'react'
import {
  FileEdit,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  CreditCard,
  Calendar,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import { useCreateTaskAmendment } from '../hooks/useMentoringTaskResolutions'

interface MentoringTaskAmendmentModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  currentScope: string
  currentExpectedResult: string
  currentPrice: number
  currentDeadline?: string
  onSuccess?: () => void
}

export function MentoringTaskAmendmentModal({
  isOpen,
  onClose,
  taskId,
  currentScope,
  currentExpectedResult,
  currentPrice,
  currentDeadline,
  onSuccess,
}: MentoringTaskAmendmentModalProps) {
  const [newScope, setNewScope] = useState(currentScope)
  const [newExpectedResult, setNewExpectedResult] = useState(currentExpectedResult)
  const [additionalAmount, setAdditionalAmount] = useState<number>(0)
  const [newDeadline, setNewDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useCreateTaskAmendment(taskId)

  if (!isOpen) return null

  const formatVnd = (amt: number) => new Intl.NumberFormat('vi-VN').format(amt) + 'đ'

  const formattedCurrentDeadline = (() => {
    if (!currentDeadline) return 'Chưa thiết lập'
    try {
      return format(parseISO(currentDeadline), 'dd/MM/yyyy HH:mm')
    } catch {
      return currentDeadline
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (additionalAmount < 0) {
      setErrorMsg('Số tiền bổ sung không được âm.')
      return
    }

    if (!reason.trim() || reason.trim().length < 10) {
      setErrorMsg('Vui lòng nhập lý do điều chỉnh cụ thể (tối thiểu 10 ký tự).')
      return
    }

    try {
      let isoDeadline: string | undefined = undefined
      if (newDeadline) {
        const d = new Date(newDeadline)
        if (d <= new Date()) {
          setErrorMsg('Thời hạn mới phải ở trong tương lai.')
          return
        }
        isoDeadline = d.toISOString()
      }

      await createMutation.mutateAsync({
        newScope: newScope.trim() !== currentScope ? newScope.trim() : undefined,
        newExpectedResult: newExpectedResult.trim() !== currentExpectedResult ? newExpectedResult.trim() : undefined,
        additionalAmount: Number(additionalAmount),
        newDeadline: isoDeadline,
        reason: reason.trim(),
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo Ticket điều chỉnh.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Điều chỉnh Task & Bổ sung tiền</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Task Amendment Ticket trong Chat for Task (UC109, mục 5.8)</p>
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

          {/* Current Budget & Deadline summary */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-sm">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Ngân sách hiện tại của Task</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">{formatVnd(currentPrice)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Hạn chót hiện tại</span>
              <span className="font-medium text-slate-900 dark:text-white">{formattedCurrentDeadline}</span>
            </div>
          </div>

          {/* New Scope */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Phạm vi công việc mới đề xuất
            </label>
            <textarea
              rows={3}
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              placeholder="Cập nhật hoặc bổ sung các hạng mục công việc cần làm..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* New Expected Result */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Kết quả kỳ vọng đầu ra mới
            </label>
            <textarea
              rows={2}
              value={newExpectedResult}
              onChange={(e) => setNewExpectedResult(e.target.value)}
              placeholder="Kết quả, sản phẩm bàn giao mong muốn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none"
            />
          </div>

          {/* Additional Amount & New Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Số tiền bổ sung (VND)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={additionalAmount}
                onChange={(e) => setAdditionalAmount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tổng giá mới: <span className="font-bold text-slate-900 dark:text-white">{formatVnd(currentPrice + (Number(additionalAmount) || 0))}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Hạn chót mới (nếu có)
              </label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Lý do điều chỉnh <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giải trình chi tiết lý do cần bổ sung công việc hoặc điều chỉnh..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition resize-none"
              required
            />
          </div>

          {/* Notice box */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300 text-xs space-y-1">
            <p className="font-semibold">Lưu ý thanh toán bổ sung (UC105 & UC109):</p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
              <li>Nếu có số tiền bổ sung (&gt; 0đ), sau khi hai bên xác nhận Ticket, Học viên sẽ cần thanh toán khoản tiền bổ sung trước khi các thay đổi có hiệu lực.</li>
              <li>Nếu không bổ sung tiền (0đ), nội dung điều chỉnh sẽ được áp dụng trực tiếp ngay khi bên còn lại xác nhận.</li>
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
              className="bg-amber-500 hover:bg-amber-600 text-white font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Gửi Ticket điều chỉnh
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
