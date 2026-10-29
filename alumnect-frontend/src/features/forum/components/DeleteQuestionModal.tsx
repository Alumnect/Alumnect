/**
 * DeleteQuestionModal — Modal xác nhận xóa câu hỏi (UC47 - Delete a question).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (mềm) — hành động không thể hoàn tác từ UI.
 *  - Chỉ mở được bởi chính tác giả câu hỏi (nút "Xóa" đã ẩn với người khác ở nơi gọi).
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDeleteQuestion } from '../hooks/useQuestions'

export function DeleteQuestionModal({
  questionId,
  onClose,
  onDeleted,
}: {
  questionId: string
  onClose: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const deleteQuestion = useDeleteQuestion()

  const handleDelete = () => {
    deleteQuestion.mutate(questionId, {
      onSuccess: () => {
        toast.success(t('forum.deleteQuestionSuccess'))
        onDeleted()
      },
      onError: (err: any) => {
        toast.error(err?.message || t('forum.deleteQuestionError'))
      }
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteQuestion.isPending}>
        {t('common.cancel')}
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteQuestion.isPending}
        leftIcon={deleteQuestion.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-danger bg-danger text-text-inverse hover:opacity-90"
      >
        {deleteQuestion.isPending ? t('common.processing') : t('common.delete')}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={deleteQuestion.isPending ? () => {} : onClose}
      title={t('forum.deleteQuestionTitle')}
      icon={<AlertTriangle size={18} className="text-danger" />}
      footer={footer}
    >
      <p className="text-sm text-text-muted">{t('forum.deleteQuestionConfirm')}</p>
      {deleteQuestion.isError && (
        <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {(deleteQuestion.error as Error)?.message || t('forum.deleteQuestionError')}
        </p>
      )}
    </Modal>
  )
}
