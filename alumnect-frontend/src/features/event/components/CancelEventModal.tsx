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
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-rose-900">
          <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="text-xs leading-5">
            <p className="font-semibold text-rose-950">Lưu ý quan trọng</p>
            <p className="mt-0.5 text-rose-800">
              Hành động này sẽ hủy bỏ sự kiện này. Danh sách đăng ký của tất cả người tham gia sẽ bị hủy và bạn không thể mở lại sự kiện sau khi đã hủy.
            </p>
          </div>
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
