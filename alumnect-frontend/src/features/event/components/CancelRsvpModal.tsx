import { AlertTriangle, CalendarX, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'

interface CancelRsvpModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
  eventTitle?: string
}

/**
 * Modal xác nhận hủy tham gia sự kiện (UC26 - Cancel event attendance).
 * Cảnh báo người dùng về việc hủy đăng ký có thể làm mất suất tham dự nếu sự kiện đã giới hạn sức chứa.
 */
export function CancelRsvpModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  eventTitle,
}: CancelRsvpModalProps) {
  const handleClose = () => {
    if (!isPending) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hủy đăng ký sự kiện"
      icon={<CalendarX size={18} className="text-rose-500" />}
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
            Giữ lại đăng ký
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
                <CalendarX size={16} />
              )
            }
            className="border-rose-500 bg-rose-600 text-white hover:bg-rose-700"
          >
            {isPending ? 'Đang hủy…' : 'Xác nhận hủy'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <p className="text-amber-800">
            <strong>Lưu ý:</strong> Bạn có thể mất suất tham dự nếu sự kiện hết chỗ khi đăng ký lại.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-plum-700">
          Bạn có chắc chắn muốn hủy đăng ký tham gia sự kiện{' '}
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
