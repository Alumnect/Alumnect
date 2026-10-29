import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Modal } from '@/components/ui'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useCreateDeadlineExtension } from '../hooks/useMentoringTaskResolutions'
import { MentoringActionButton, MentoringField, MentoringFormError } from './MentoringUi'
import { MENTORING_INPUT, apiErrorMessage, toDateTimeLocal } from '../model/mentoringUiUtils'

interface MentoringDeadlineExtensionModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  currentDeadline: string
  onSuccess?: () => void
}

const QUICK_DAYS = [1, 3, 7]

/** Mentor đề xuất hạn chót mới cho Task; Học viên chấp nhận hoặc từ chối trong Chat. */
export function MentoringDeadlineExtensionModal({
  isOpen,
  onClose,
  taskId,
  currentDeadline,
  onSuccess,
}: MentoringDeadlineExtensionModalProps) {
  const { t } = useTranslation()
  const [proposedDeadline, setProposedDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const createMutation = useCreateDeadlineExtension(taskId)
  // Thời điểm mở form (cố định trong lúc render)
  const [openedAt] = useState(() => new Date())

  const current = new Date(currentDeadline)
  // Mốc tính nhanh: hạn chót hiện tại, hoặc thời điểm mở form nếu Task đã quá hạn
  const base = current.getTime() > openedAt.getTime() ? current : openedAt
  const currentLabel = (() => {
    try {
      return format(parseISO(currentDeadline), 'HH:mm dd/MM/yyyy')
    } catch {
      return currentDeadline
    }
  })()

  const close = () => {
    setProposedDeadline('')
    setReason('')
    setErrorMsg(null)
    onClose()
  }

  const submit = async () => {
    setErrorMsg(null)
    if (!proposedDeadline) return setErrorMsg(t('mentoring.selectNewDeadlinePrompt'))
    const proposed = new Date(proposedDeadline)
    if (proposed.getTime() <= current.getTime()) return setErrorMsg(t('mentoring.deadlineMustBeAfterCurrent', { current: currentLabel }))
    if (proposed.getTime() <= Date.now()) return setErrorMsg(t('mentoring.newDeadlineMustBeFuture'))
    if (reason.trim().length < 10) return setErrorMsg(t('mentoring.extensionReasonRequired10'))
    try {
      await createMutation.mutateAsync({ proposedDeadline: proposed.toISOString(), reason: reason.trim() })
      onSuccess?.()
      close()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, t('mentoring.cannotSendExtensionProposal')))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('mentoring.proposeExtensionModalTitle')}
      icon={<CalendarClock className="h-5 w-5" />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <MentoringActionButton intent="ghost" onClick={close} disabled={createMutation.isPending}>
            {t('common.cancel')}
          </MentoringActionButton>
          <MentoringActionButton intent="primary" icon={<Send className="h-3.5 w-3.5" />} loading={createMutation.isPending} onClick={submit}>
            {t('mentoring.sendProposal')}
          </MentoringActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <MentoringFormError message={errorMsg} />
        <div className="rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm dark:bg-white/[0.04]">
          <span className="text-text-subtle">{t('mentoring.currentDeadlineLabel')}</span>
          <span className="font-semibold text-text">{currentLabel}</span>
        </div>
        <MentoringField label={t('mentoring.newDeadlineLabel')} required>
          <DateTimePicker
            mode="datetime"
            value={proposedDeadline}
            min={toDateTimeLocal(openedAt)}
            onChange={setProposedDeadline}
          />
        </MentoringField>
        <div className="flex flex-wrap gap-2">
          {QUICK_DAYS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setProposedDeadline(toDateTimeLocal(new Date(base.getTime() + days * 86400000)))}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-text-muted transition hover:border-primary hover:text-primary-solid"
            >
              {t('mentoring.plusDays', { days })}
            </button>
          ))}
        </div>
        <MentoringField label={t('mentoring.reasonLabel')} required hint={t('mentoring.extensionReasonHint')}>
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('mentoring.extensionReasonPlaceholder')}
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
