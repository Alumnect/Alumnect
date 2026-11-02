/**
 * DeleteAnswerModal — Modal xác nhận xóa câu trả lời/reply (UC49 - Delete an answer).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (mềm) — hành động không thể hoàn tác từ UI.
 *  - Chỉ mở được bởi chính tác giả câu trả lời (nút "Xóa" đã ẩn với người khác ở nơi gọi).
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDeleteAnswer } from '../hooks/useAnswers'

export function DeleteAnswerModal({
  questionId,
  answerId,
  onClose,
  onDeleted,
}: {
  questionId: string
  answerId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const deleteAnswer = useDeleteAnswer(questionId)

  const handleDelete = () => {
    deleteAnswer.mutate(answerId, {
      onSuccess: () => {
        toast.success(t('forum.deleteAnswerSuccess'))
        onDeleted()
      },
      onError: (err: any) => {
        toast.error(err?.message || t('forum.deleteAnswerError'))
      },
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteAnswer.isPending}>
        {t('common.cancel')}
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteAnswer.isPending}
        leftIcon={deleteAnswer.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-danger bg-danger text-text-inverse hover:opacity-90"
      >
        {deleteAnswer.isPending ? t('common.processing') : t('common.delete')}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={deleteAnswer.isPending ? () => {} : onClose}
      title={t('forum.deleteAnswerTitle')}
      icon={<AlertTriangle size={18} className="text-danger" />}
      footer={footer}
    >
      <p className="text-sm text-text-muted">{t('forum.deleteAnswerConfirm')}</p>
      {deleteAnswer.isError && (
        <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {(deleteAnswer.error as Error)?.message || t('forum.deleteAnswerError')}
        </p>
      )}
    </Modal>
  )
}
