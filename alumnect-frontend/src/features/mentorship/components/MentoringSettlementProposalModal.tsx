import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Scale, Send } from 'lucide-react'
import { Modal } from '@/components/ui'
import { useCreateSettlementProposal } from '../hooks/useMentoringTaskResolutions'
import { MentoringActionButton, MentoringField, MentoringFormError } from './MentoringUi'
import { MENTORING_INPUT, apiErrorMessage } from '../model/mentoringUiUtils'

interface MentoringSettlementProposalModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  /** Số tiền đang giữ trong quỹ Task (tổng phải chia hết đúng số này) */
  totalBudget: number
  /** Học viên chưa khai báo tài khoản nhận hoàn tiền */
  requiresRefundAccount?: boolean
  onSuccess?: () => void
}

const PRESETS = [0, 30, 50, 70, 100]

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}

/** Đề xuất dừng Task sớm và chia quỹ đang giữ giữa Mentor và Học viên. */
export function MentoringSettlementProposalModal({
  isOpen,
  onClose,
  taskId,
  totalBudget,
  requiresRefundAccount,
  onSuccess,
}: MentoringSettlementProposalModalProps) {
  const { t } = useTranslation()
  const total = Math.max(0, Math.round(totalBudget))
  const [mentorAmount, setMentorAmount] = useState(Math.round(total / 2))
  const [reason, setReason] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const createMutation = useCreateSettlementProposal(taskId)

  const studentRefund = total - mentorAmount
  const mentorPercent = total > 0 ? Math.round((mentorAmount / total) * 100) : 0
  const blockedByRefundAccount = Boolean(requiresRefundAccount && studentRefund > 0)

  const setMentor = (value: number) => setMentorAmount(Math.max(0, Math.min(total, Math.round(value) || 0)))

  const close = () => {
    setErrorMsg(null)
    onClose()
  }

  const submit = async () => {
    setErrorMsg(null)
    if (blockedByRefundAccount) return setErrorMsg(t('mentoring.declareRefundAccountFirst'))
    if (reason.trim().length < 10) return setErrorMsg(t('mentoring.settlementReasonRequired10'))
    try {
      await createMutation.mutateAsync({ mentorAmount, studentRefund, reason: reason.trim() })
      onSuccess?.()
      close()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, t('mentoring.cannotSendSettlementProposal')))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('mentoring.settlementModalTitle')}
      icon={<Scale className="h-5 w-5" />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <MentoringActionButton intent="ghost" onClick={close} disabled={createMutation.isPending}>
            {t('common.cancel')}
          </MentoringActionButton>
          <MentoringActionButton
            intent="primary"
            icon={<Send className="h-3.5 w-3.5" />}
            loading={createMutation.isPending}
            disabled={blockedByRefundAccount}
            onClick={submit}
          >
            {t('mentoring.sendProposal')}
          </MentoringActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <MentoringFormError message={errorMsg} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-3 dark:bg-white/[0.04]">
          <div>
            <p className="text-xs text-text-subtle">{t('mentoring.holdingFundOfTask')}</p>
            <p className="font-display text-xl font-bold text-text">{formatVnd(total)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMentor((total * p) / 100)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  mentorPercent === p
                    ? 'bg-primary-solid text-on-primary'
                    : 'border border-border bg-surface text-text-muted hover:border-primary dark:bg-transparent'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full bg-primary-solid transition" style={{ width: `${mentorPercent}%` }} />
            <div className="h-full bg-info transition" style={{ width: `${100 - mentorPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-primary-solid">Mentor {mentorPercent}%</span>
            <span className="text-info">{t('common.student')} {100 - mentorPercent}%</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MentoringField label={t('mentoring.mentorReceivesVnd')}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={total}
              step={1000}
              value={mentorAmount}
              onChange={(e) => setMentor(Number(e.target.value))}
              className={MENTORING_INPUT}
            />
          </MentoringField>
          <MentoringField label={t('mentoring.menteeRefundVnd')}>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={total}
              step={1000}
              value={studentRefund}
              onChange={(e) => setMentor(total - Number(e.target.value))}
              className={MENTORING_INPUT}
            />
          </MentoringField>
        </div>

        {blockedByRefundAccount && (
          <div className="rounded-xl border border-danger-border bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {t('mentoring.refundAccountRequiredNotice')}{' '}
            <Link to="/app/mentoring/refunds" className="font-semibold underline">{t('mentoring.declareNow')}</Link>
          </div>
        )}

        <MentoringField label={t('mentoring.reasonLabel')} required hint={t('mentoring.settlementReasonHint')}>
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('mentoring.settlementReasonPlaceholder')}
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
