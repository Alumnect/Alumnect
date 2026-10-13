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
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Điều chỉnh Task & Bổ sung tiền</h3>
              <p className="text-xs text-muted-foreground">Task Amendment Ticket trong Chat for Task (UC109, mục 5.8)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current Budget & Deadline summary */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Ngân sách hiện tại của Task</span>
              <span className="font-bold text-foreground text-base">{formatVnd(currentPrice)}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Hạn chót hiện tại</span>
              <span className="font-medium text-foreground">{formattedCurrentDeadline}</span>
            </div>
          </div>

          {/* New Scope */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Phạm vi công việc mới đề xuất
            </label>
            <textarea
              rows={3}
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              placeholder="Cập nhật hoặc bổ sung các hạng mục công việc cần làm..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
            />
          </div>

          {/* New Expected Result */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Kết quả kỳ vọng đầu ra mới
            </label>
            <textarea
              rows={2}
              value={newExpectedResult}
              onChange={(e) => setNewExpectedResult(e.target.value)}
              placeholder="Kết quả, sản phẩm bàn giao mong muốn..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
            />
          </div>

          {/* Additional Amount & New Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
              <p className="text-xs text-muted-foreground">
                Tổng giá mới: <span className="font-bold text-foreground">{formatVnd(currentPrice + (Number(additionalAmount) || 0))}</span>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Hạn chót mới (nếu có)
              </label>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Lý do điều chỉnh <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giải trình chi tiết lý do cần bổ sung công việc hoặc điều chỉnh..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              required
            />
          </div>

          {/* Notice box */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs space-y-1">
            <p className="font-semibold">Lưu ý thanh toán bổ sung (UC105 & UC109):</p>
            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
              <li>Nếu có số tiền bổ sung (&gt; 0đ), sau khi hai bên xác nhận Ticket, Học viên sẽ cần thanh toán khoản tiền bổ sung trước khi các thay đổi có hiệu lực.</li>
              <li>Nếu không bổ sung tiền (0đ), nội dung điều chỉnh sẽ được áp dụng trực tiếp ngay khi bên còn lại xác nhận.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
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
              className="bg-amber-500 text-white hover:bg-amber-600 font-semibold"
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
