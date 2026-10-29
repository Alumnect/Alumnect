import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const handleClose = () => {
    if (!isPending) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('event.cancelRsvpModalTitle')}
      icon={<CalendarX size={18} className="text-danger" />}
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
            {t('event.keepRsvp')}
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
            className="border-danger bg-danger text-text-inverse hover:opacity-90"
          >
            {isPending ? t('common.processing') : t('event.confirmCancelRsvp')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-warning-border bg-warning-soft p-3 text-xs text-warning">
          <AlertTriangle size={16} className="shrink-0 text-warning" />
          <p className="text-warning">
            {t('event.cancelRsvpWarning')}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-text-muted">
          {t('event.cancelRsvpConfirmText', { title: eventTitle || t('event.thisEvent') })}
        </p>
      </div>
    </Modal>
  )
}
