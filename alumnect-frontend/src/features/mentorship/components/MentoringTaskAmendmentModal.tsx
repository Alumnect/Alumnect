import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileEdit, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Modal } from '@/components/ui'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { useCreateTaskAmendment } from '../hooks/useMentoringTaskResolutions'
import { MentoringActionButton, MentoringField, MentoringFormError } from './MentoringUi'
import { MENTORING_INPUT, apiErrorMessage, toDateTimeLocal } from '../model/mentoringUiUtils'

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

/** Số tiền tối thiểu cho một khoản thu qua PayOS (khớp app.mentoring.min-amount phía backend). */
const MIN_TOPUP = 2000

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/**
 * Mentor đề xuất điều chỉnh Task: phạm vi, kết quả, deadline và/hoặc tiền bổ sung.
 * Có tiền bổ sung thì Học viên thanh toán sau khi đồng ý; điều chỉnh có hiệu lực khi thanh toán xong.
 */
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
  const { t } = useTranslation()
  const [newScope, setNewScope] = useState(currentScope)
  const [newExpectedResult, setNewExpectedResult] = useState(currentExpectedResult)
  const [additionalAmount, setAdditionalAmount] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const createMutation = useCreateTaskAmendment(taskId)
  const [openedAt] = useState(() => new Date())

  const amount = additionalAmount === '' ? 0 : Number(additionalAmount)
  const deadlineLabel = (() => {
    if (!currentDeadline) return t('mentoring.notSet')
    try {
      return format(parseISO(currentDeadline), 'HH:mm dd/MM/yyyy')
    } catch {
      return currentDeadline
    }
  })()

  const close = () => {
    setErrorMsg(null)
    onClose()
  }

  const submit = async () => {
    setErrorMsg(null)
    const scopeChanged = newScope.trim() !== currentScope.trim()
    const resultChanged = newExpectedResult.trim() !== currentExpectedResult.trim()
    if (!Number.isInteger(amount) || amount < 0) return setErrorMsg(t('mentoring.additionalAmountNonNegative'))
    if (amount > 0 && amount < MIN_TOPUP) return setErrorMsg(t('mentoring.additionalAmountMin', { amount: formatVnd(MIN_TOPUP) }))
    let isoDeadline: string | undefined
    if (newDeadline) {
      const d = new Date(newDeadline)
      if (d.getTime() <= Date.now()) return setErrorMsg(t('mentoring.newDeadlineMustBeFuture'))
      isoDeadline = d.toISOString()
    }
    if (!scopeChanged && !resultChanged && amount === 0 && !isoDeadline) {
      return setErrorMsg(t('mentoring.noChangeDetected'))
    }
    if (reason.trim().length < 10) return setErrorMsg(t('mentoring.reasonRequired10'))
    try {
      await createMutation.mutateAsync({
        newScope: scopeChanged ? newScope.trim() : undefined,
        newExpectedResult: resultChanged ? newExpectedResult.trim() : undefined,
        additionalAmount: amount,
        newDeadline: isoDeadline,
        reason: reason.trim(),
      })
      onSuccess?.()
      close()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, t('mentoring.cannotSendAmendmentProposal')))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('mentoring.taskAmendmentModalTitle')}
      icon={<FileEdit className="h-5 w-5" />}
      maxWidthClassName="max-w-xl"
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
        <div className="grid gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm dark:bg-white/[0.04] sm:grid-cols-2">
          <p>
            <span className="text-text-subtle">{t('mentoring.currentPrice')}</span>
            <span className="font-semibold text-text">{formatVnd(currentPrice)}</span>
            {amount > 0 && <span className="font-semibold text-primary-solid"> → {formatVnd(currentPrice + amount)}</span>}
          </p>
          <p>
            <span className="text-text-subtle">{t('mentoring.deadlineLabel')}</span>
            <span className="font-semibold text-text">{deadlineLabel}</span>
          </p>
        </div>

        <MentoringField label={t('mentoring.scopeOfWork')}>
          <textarea rows={3} value={newScope} onChange={(e) => setNewScope(e.target.value)} className={`${MENTORING_INPUT} resize-none`} />
        </MentoringField>
        <MentoringField label={t('mentoring.expectedDeliverable')}>
          <textarea rows={2} value={newExpectedResult} onChange={(e) => setNewExpectedResult(e.target.value)} className={`${MENTORING_INPUT} resize-none`} />
        </MentoringField>
        <div className="grid gap-4 sm:grid-cols-2">
          <MentoringField label={t('mentoring.additionalAmountVnd')} hint={t('mentoring.additionalAmountHint', { amount: formatVnd(MIN_TOPUP) })}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={additionalAmount}
              onChange={(e) => setAdditionalAmount(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="0"
              className={MENTORING_INPUT}
            />
          </MentoringField>
          <MentoringField label={t('mentoring.newDeadline')} hint={t('mentoring.keepCurrentDeadlineHint')}>
            <DateTimePicker
              mode="datetime"
              value={newDeadline}
              min={toDateTimeLocal(openedAt)}
              clearable
              onChange={setNewDeadline}
            />
          </MentoringField>
        </div>
        <MentoringField label={t('mentoring.reasonLabel')} required hint={t('mentoring.amendmentReasonHint')}>
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('mentoring.amendmentReasonPlaceholder')}
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
