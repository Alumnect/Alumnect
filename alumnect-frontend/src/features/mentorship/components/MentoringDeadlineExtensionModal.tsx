import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CalendarClock,
  X,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { format, parseISO, isAfter } from 'date-fns'
import { useCreateDeadlineExtension } from '../hooks/useMentoringTaskResolutions'

interface MentoringDeadlineExtensionModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  currentDeadline: string
  onSuccess?: () => void
}

export function MentoringDeadlineExtensionModal({
  isOpen,
  onClose,
  taskId,
  currentDeadline,
  onSuccess,
}: MentoringDeadlineExtensionModalProps) {
  const [proposedDeadline, setProposedDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const createMutation = useCreateDeadlineExtension(taskId)

  if (!isOpen) return null

  const formattedCurrentDeadline = (() => {
    try {
      return format(parseISO(currentDeadline), 'dd/MM/yyyy HH:mm')
    } catch {
      return currentDeadline
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!proposedDeadline) {
      setErrorMsg('Vui lòng chọn thời hạn gia hạn mới.')
      return
    }

    try {
      const propDate = new Date(proposedDeadline)
      const curDate = new Date(currentDeadline)

      if (!isAfter(propDate, curDate)) {
        setErrorMsg('Thời hạn mới phải sau hạn chót hiện tại (' + formattedCurrentDeadline + ').')
        return
      }

      if (propDate <= new Date()) {
        setErrorMsg('Thời hạn mới phải ở trong tương lai.')
        return
      }

      if (!reason.trim() || reason.trim().length < 10) {
        setErrorMsg('Vui lòng nhập lý do gia hạn cụ thể (tối thiểu 10 ký tự).')
        return
      }

      await createMutation.mutateAsync({
        proposedDeadline: propDate.toISOString(),
        reason: reason.trim(),
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi đề xuất.')
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Đề xuất gia hạn Deadline</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tạo Ticket đề xuất hạn chót mới trong Chat for Task (UC109)</p>
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

          {/* Current Deadline Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Hạn chót hiện tại của Task:</span>
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{formattedCurrentDeadline}</span>
          </div>

          {/* Proposed Deadline Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Hạn chót mới đề xuất <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={proposedDeadline}
              onChange={(e) => setProposedDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              required
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thời hạn đề xuất phải muộn hơn hạn chót hiện tại.
            </p>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Lý do xin gia hạn <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giải trình lý do cụ thể cần gia hạn (khối lượng phát sinh, vấn đề kỹ thuật, lịch trình...)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
              required
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Tối thiểu 10 ký tự</span>
              <span>{reason.length}/1000</span>
            </div>
          </div>

          {/* Notice box */}
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-300 text-xs space-y-1">
            <p className="font-semibold">Quy tắc nghiệp vụ UC109:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
              <li>Người gửi Ticket đồng nghĩa với việc đã xác nhận thời hạn mới này.</li>
              <li>Bên còn lại sẽ nhận được thẻ Ticket trong Chat for Task để Chấp nhận hoặc Từ chối.</li>
              <li>Khi bên còn lại Chấp nhận, Deadline của Task sẽ được cập nhật chính thức.</li>
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
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Gửi đề xuất gia hạn
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
