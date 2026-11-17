import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Loader2, Send, X } from 'lucide-react'
import { Button, DialogFrame, toast } from '@/components/ui'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { vnd } from '@/lib/utils'
import type { MentoringWalletItem } from '../model/mentoringWalletTypes'

const QUICK_REASONS = [
  'Chưa nhận được tiền thù lao / hoàn tiền vào tài khoản ngân hàng',
  'Lệnh chi trả / hoàn tiền báo lỗi (FAILED) trên cổng PayOS',
  'Số tiền thực nhận sai lệch so với thỏa thuận đã thống nhất',
  'Tài khoản ngân hàng gặp sự cố / Cần Ban Quản Trị hỗ trợ chuyển thủ công',
  'Khác (vui lòng mô tả chi tiết bên dưới)',
]

interface Props {
  isOpen: boolean
  onClose: () => void
  item: MentoringWalletItem | null
}

export function MentoringFinanceReportModal({ isOpen, onClose, item }: Props) {
  const queryClient = useQueryClient()
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null)
  const [detailReason, setDetailReason] = useState('')

  const pingMutation = useMutation({
    mutationFn: (payload: { reason: string; issueType?: string }) => {
      if (!item?.taskId) throw new Error('Không xác định được mã nhiệm vụ')
      return mentoringTaskApi.pingAdminFinance(item.taskId, payload)
    },
    onSuccess: () => {
      toast.success('Đã gửi phản ánh sự cố dòng tiền đến Ban Quản Trị!')
      onClose()
      setSelectedQuick(null)
      setDetailReason('')
      queryClient.invalidateQueries({ queryKey: ['mentoring-wallet'] })
      if (item?.taskId) {
        queryClient.invalidateQueries({ queryKey: ['mentoring-task', item.taskId] })
        queryClient.invalidateQueries({ queryKey: ['mentoring-task-report', item.taskId] })
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gửi phản ánh sự cố. Vui lòng thử lại!')
    },
  })

  if (!isOpen || !item) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = detailReason.trim() || selectedQuick || ''
    if (text.length < 5) {
      toast.error('Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }

    let issueType = 'OTHER'
    if (selectedQuick?.includes('hoàn tiền')) issueType = 'REFUND_NOT_RECEIVED'
    else if (selectedQuick?.includes('thù lao')) issueType = 'PAYOUT_NOT_RECEIVED'
    else if (selectedQuick?.includes('sai lệch')) issueType = 'WRONG_AMOUNT'
    else if (selectedQuick?.includes('ngân hàng')) issueType = 'ACCOUNT_ERROR'

    pingMutation.mutate({ reason: text, issueType })
  }

  return (
    <DialogFrame onClose={onClose} maxWidthClassName="max-w-lg" className="p-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5 text-danger">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger/10 text-danger">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text">Báo cáo sự cố dòng tiền</h3>
            <p className="text-xs text-text-subtle">Gửi thông báo tới Ban Quản Trị để đối soát & xử lý</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-subtle hover:bg-surface-2 hover:text-text transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Thông tin Task phát sinh lỗi */}
      <div className="mt-4 rounded-xl border border-danger/20 bg-danger-soft/40 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-danger font-mono font-bold">#{item.taskId ? `Task #${item.taskId}` : 'Giao dịch'}</span>
          <span className="font-bold text-text">{vnd(item.amount)}</span>
        </div>
        {item.taskTitle && (
          <p className="text-xs text-text line-clamp-1 font-medium">{item.taskTitle}</p>
        )}
        {item.note && (
          <p className="text-xs text-danger font-medium">
            <strong>Chi tiết lỗi:</strong> {item.note}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">
            Chọn nhanh lý do
          </label>
          <div className="space-y-1.5">
            {QUICK_REASONS.map((reason) => {
              const isSelected = selectedQuick === reason
              return (
                <button
                  type="button"
                  key={reason}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedQuick(null)
                    } else {
                      setSelectedQuick(reason)
                      if (!detailReason.trim()) {
                        setDetailReason(reason)
                      }
                    }
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition border cursor-pointer ${
                    isSelected
                      ? 'border-danger bg-danger/10 text-danger font-semibold'
                      : 'border-border bg-surface hover:bg-surface-2 text-text'
                  }`}
                >
                  {reason}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-subtle mb-1.5">
            Mô tả chi tiết sự cố <span className="text-danger">*</span>
          </label>
          <textarea
            rows={3}
            value={detailReason}
            onChange={(e) => setDetailReason(e.target.value)}
            placeholder="Mô tả cụ thể sự cố (ví dụ: ngày giờ kiểm tra tài khoản, mã lệnh chi bị từ chối, số tài khoản cần chuyển lại...)"
            className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-text placeholder:text-text-subtle focus:border-danger focus:outline-hidden focus:ring-1 focus:ring-danger"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={pingMutation.isPending}
            className="text-xs cursor-pointer"
          >
            Hủy
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={pingMutation.isPending}
            className="bg-danger hover:bg-danger/90 text-white font-bold text-xs gap-1.5 cursor-pointer"
          >
            {pingMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Gửi cho Admin
              </>
            )}
          </Button>
        </div>
      </form>
    </DialogFrame>
  )
}

