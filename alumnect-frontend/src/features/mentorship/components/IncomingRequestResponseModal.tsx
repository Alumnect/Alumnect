import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { MentoringActionButton, MentoringField, MentoringFormError } from './MentoringUi'
import { MENTORING_INPUT, apiErrorMessage } from '../model/mentoringUiUtils'

interface IncomingRequestResponseModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'ACCEPT' | 'DECLINE'
  requestTitle: string
  studentName: string
  onSubmit: (responseNote?: string) => Promise<void>
  isLoading: boolean
}

const MAX_NOTE = 500

/**
 * Mentor xác nhận Đồng ý trao đổi / Từ chối một yêu cầu (UC103).
 * Đồng ý chỉ mở trao đổi, không tạo thỏa thuận hay thu tiền.
 */
export function IncomingRequestResponseModal({
  isOpen,
  onClose,
  type,
  requestTitle,
  studentName,
  onSubmit,
  isLoading,
}: IncomingRequestResponseModalProps) {
  const [responseNote, setResponseNote] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const isAccept = type === 'ACCEPT'

  const handleClose = () => {
    if (isLoading) return
    setResponseNote('')
    setErrorMsg(null)
    onClose()
  }

  const handleSubmit = async () => {
    setErrorMsg(null)
    try {
      await onSubmit(responseNote.trim() || undefined)
      setResponseNote('')
    } catch (err) {
      // Giữ modal mở và báo lỗi (vd: gói Mentor hết hạn, đã đủ số Task đang chạy)
      setErrorMsg(apiErrorMessage(err, isAccept ? 'Không thể đồng ý yêu cầu.' : 'Không thể từ chối yêu cầu.'))
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isAccept ? 'Đồng ý trao đổi?' : 'Từ chối yêu cầu?'}
      icon={isAccept ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <MentoringActionButton intent="ghost" onClick={handleClose} disabled={isLoading}>
            Quay lại
          </MentoringActionButton>
          {isAccept ? (
            <MentoringActionButton intent="primary" loading={isLoading} icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={handleSubmit}>
              Đồng ý trao đổi
            </MentoringActionButton>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSubmit}
              disabled={isLoading}
              leftIcon={<XCircle className="h-3.5 w-3.5" />}
              className="h-8 rounded-lg bg-danger px-3 text-xs text-text-inverse hover:opacity-90 hover:text-white"
            >
              {isLoading ? 'Đang gửi...' : 'Từ chối yêu cầu'}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <MentoringFormError message={errorMsg} />
        <div className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm dark:bg-white/[0.04]">
          <p className="font-semibold text-text">{requestTitle}</p>
          <p className="mt-0.5 text-xs text-text-subtle">Người gửi: {studentName}</p>
        </div>

        <p className="text-sm leading-relaxed text-text-muted">
          {isAccept
            ? 'Hai bên sẽ được mở phần trao đổi. Việc này chưa tạo thỏa thuận và không thu tiền của người học.'
            : 'Người học sẽ thấy bạn đã từ chối. Quyết định này không thể hoàn tác.'}
        </p>

        <MentoringField
          label={isAccept ? 'Lời nhắn cho người học' : 'Lý do từ chối'}
          hint={`${isAccept ? "Sẽ hiển thị như tin nhắn đầu tiên trong khung chat · " : ""}Không bắt buộc · ${responseNote.length}/${MAX_NOTE} ký tự`}
        >
          <textarea
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            maxLength={MAX_NOTE}
            rows={3}
            disabled={isLoading}
            placeholder={
              isAccept
                ? 'Ví dụ: Chào bạn, mình sẵn lòng trao đổi về chủ đề này...'
                : 'Ví dụ: Hiện mình đang kín lịch, hẹn bạn dịp khác nhé...'
            }
            className={`${MENTORING_INPUT} resize-none`}
          />
        </MentoringField>
      </div>
    </Modal>
  )
}
