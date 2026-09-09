import { AlertTriangle, Ban, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'

interface CancelEventModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  eventTitle?: string
}

/**
 * Modal xác nhận hủy tổ chức sự kiện (UC27 - Cancel an event).
 * Dành riêng cho người tổ chức (organizer) hủy toàn bộ sự kiện.
 */
export function CancelEventModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  eventTitle,
}: CancelEventModalProps) {
  const handleClose = () => {
    if (!isPending) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hủy tổ chức sự kiện"
      icon={<Ban size={18} className="text-rose-500" />}
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isPending}
          >
            Giữ lại sự kiện
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isPending}
            leftIcon={
              isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Ban size={16} />
              )
            }
            className="border-rose-500 bg-rose-600 text-white hover:bg-rose-700"
          >
            {isPending ? 'Đang hủy…' : 'Xác nhận hủy sự kiện'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-900">
          <AlertTriangle size={16} className="shrink-0 text-rose-600" />
          <p className="text-rose-800">
            <strong>Lưu ý:</strong> Sự kiện và danh sách đăng ký sẽ bị hủy vĩnh viễn, không thể mở lại.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-plum-700">
          Bạn có chắc chắn muốn hủy sự kiện{' '}
          {eventTitle ? (
            <span className="font-bold text-plum-900">"{eventTitle}"</span>
          ) : (
            'này'
          )}{' '}
          không?
        </p>
      </div>
    </Modal>
  )
}
