import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const handleClose = () => {
    if (!isPending) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('event.cancelEventModalTitle')}
      icon={<Ban size={18} className="text-danger" />}
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
            {t('event.keepEvent')}
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
            className="border-danger bg-danger text-text-inverse hover:opacity-90"
          >
            {isPending ? t('common.processing') : t('event.confirmCancelEvent')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 rounded-xl border border-danger-border bg-danger-soft p-3 text-xs text-danger">
          <AlertTriangle size={16} className="shrink-0 text-danger" />
          <p className="text-danger">
            {t('event.cancelEventWarning')}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-text-muted">
          {t('event.cancelEventConfirmText', { title: eventTitle || t('event.thisEvent') })}
        </p>
      </div>
    </Modal>
  )
}
