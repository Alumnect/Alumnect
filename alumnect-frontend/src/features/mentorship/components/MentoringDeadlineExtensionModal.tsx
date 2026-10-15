import { useState } from 'react'
import { CalendarClock, Send } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Modal } from '@/components/ui'
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
    if (!proposedDeadline) return setErrorMsg('Vui lòng chọn hạn chót mới.')
    const proposed = new Date(proposedDeadline)
    if (proposed.getTime() <= current.getTime()) return setErrorMsg(`Hạn chót mới phải sau hạn hiện tại (${currentLabel}).`)
    if (proposed.getTime() <= Date.now()) return setErrorMsg('Hạn chót mới phải ở trong tương lai.')
    if (reason.trim().length < 10) return setErrorMsg('Vui lòng nêu lý do gia hạn (tối thiểu 10 ký tự).')
    try {
      await createMutation.mutateAsync({ proposedDeadline: proposed.toISOString(), reason: reason.trim() })
      onSuccess?.()
      close()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err, 'Không thể gửi đề xuất gia hạn.'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Đề xuất gia hạn deadline"
      icon={<CalendarClock className="h-5 w-5" />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <MentoringActionButton intent="ghost" onClick={close} disabled={createMutation.isPending}>
            Hủy
          </MentoringActionButton>
          <MentoringActionButton intent="primary" icon={<Send className="h-3.5 w-3.5" />} loading={createMutation.isPending} onClick={submit}>
            Gửi đề xuất
          </MentoringActionButton>
        </div>
      }
    >
      <div className="space-y-4">
        <MentoringFormError message={errorMsg} />
        <div className="rounded-xl border border-cream-300 bg-cream-100 px-3.5 py-2.5 text-sm dark:border-white/10 dark:bg-white/[0.04]">
          <span className="text-plum-500 dark:text-plum-400">Hạn chót hiện tại: </span>
          <span className="font-semibold text-plum-900 dark:text-white">{currentLabel}</span>
        </div>
        <MentoringField label="Hạn chót mới" required>
          <input
            type="datetime-local"
            value={proposedDeadline}
            min={toDateTimeLocal(openedAt)}
            onChange={(e) => setProposedDeadline(e.target.value)}
            className={MENTORING_INPUT}
          />
        </MentoringField>
        <div className="flex flex-wrap gap-2">
          {QUICK_DAYS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setProposedDeadline(toDateTimeLocal(new Date(base.getTime() + days * 86400000)))}
              className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-semibold text-plum-700 transition hover:border-brand-500 hover:text-brand-600 dark:border-white/10 dark:text-[#e4e6eb]"
            >
              +{days} ngày
            </button>
          ))}
        </div>
        <MentoringField label="Lý do" required hint="Học viên sẽ thấy lý do này khi xem đề xuất.">
          <textarea
            rows={3}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ví dụ: cần thêm thời gian để hoàn thiện phần kiểm thử theo góp ý..."
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
