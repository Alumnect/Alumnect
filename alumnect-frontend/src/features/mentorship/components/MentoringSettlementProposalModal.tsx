import { useState } from 'react'
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
    if (blockedByRefundAccount) return setErrorMsg('Vui lòng khai báo tài khoản nhận hoàn tiền trước khi đề xuất có hoàn tiền.')
    if (reason.trim().length < 10) return setErrorMsg('Vui lòng nêu lý do dừng Task (tối thiểu 10 ký tự).')
    try {
      await createMutation.mutateAsync({ mentorAmount, studentRefund, reason: reason.trim() })
      onSuccess?.()
      close()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, 'Không thể gửi đề xuất dừng Task.'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Dừng Task & chia quỹ"
      icon={<Scale className="h-5 w-5" />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <MentoringActionButton intent="ghost" onClick={close} disabled={createMutation.isPending}>
            Hủy
          </MentoringActionButton>
          <MentoringActionButton
            intent="primary"
            icon={<Send className="h-3.5 w-3.5" />}
            loading={createMutation.isPending}
            disabled={blockedByRefundAccount}
            onClick={submit}
          >
            Gửi đề xuất
          </MentoringActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <MentoringFormError message={errorMsg} />

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cream-300 bg-cream-100 px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.04]">
          <div>
            <p className="text-xs text-plum-500 dark:text-plum-400">Quỹ đang giữ của Task</p>
            <p className="font-display text-xl font-bold text-plum-900 dark:text-white">{formatVnd(total)}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setMentor((total * p) / 100)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  mentorPercent === p
                    ? 'bg-brand-600 text-white'
                    : 'border border-cream-300 bg-white text-plum-700 hover:border-brand-500 dark:border-white/10 dark:bg-transparent dark:text-[#e4e6eb]'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-cream-200 dark:bg-white/10">
            <div className="h-full bg-brand-600 transition-all" style={{ width: `${mentorPercent}%` }} />
            <div className="h-full bg-violet-500 transition-all" style={{ width: `${100 - mentorPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-brand-600">Mentor {mentorPercent}%</span>
            <span className="text-violet-500 dark:text-violet-300">Học viên {100 - mentorPercent}%</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MentoringField label="Mentor nhận (VND)">
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
          <MentoringField label="Hoàn Học viên (VND)">
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
          <div className="rounded-xl border border-coral-200 bg-coral-50 px-3.5 py-2.5 text-sm text-coral-700 dark:border-coral-700/40 dark:bg-coral-900/20 dark:text-coral-300">
            Bạn cần khai báo tài khoản nhận hoàn tiền trước khi đề xuất có hoàn tiền.{' '}
            <Link to="/app/mentoring/refunds" className="font-semibold underline">Khai báo ngay</Link>
          </div>
        )}

        <MentoringField label="Lý do" required hint="Hai bên đồng ý thì Task dừng ngay và hồ sơ được gửi Ban Quản Trị để chi trả, hoàn tiền.">
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Khối lượng công việc đã hoàn thành, lý do không thể tiếp tục..."
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
