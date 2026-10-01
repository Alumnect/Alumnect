import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'

/** Hộp thoại xác nhận trước các thao tác quan trọng (rời nhóm, xóa thành viên, xóa/đóng hội nhóm...). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal
      isOpen={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      icon={<AlertTriangle size={16} />}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'from-rose-600 to-rose-500 shadow-none' : undefined}
            leftIcon={loading ? <Loader2 size={16} className="animate-spin" /> : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm leading-relaxed">{message}</div>
    </Modal>
  )
}
