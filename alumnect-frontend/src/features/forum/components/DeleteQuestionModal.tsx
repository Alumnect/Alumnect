/**
 * DeleteQuestionModal — Modal xác nhận xóa câu hỏi (UC47 - Delete a question).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (mềm) — hành động không thể hoàn tác từ UI.
 *  - Chỉ mở được bởi chính tác giả câu hỏi (nút "Xóa" đã ẩn với người khác ở nơi gọi).
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
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
  const deleteQuestion = useDeleteQuestion()

  const handleDelete = () => {
    deleteQuestion.mutate(questionId, {
      onSuccess: () => {
        toast.success('Đã xóa câu hỏi thành công')
        onDeleted()
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Không thể xóa câu hỏi')
      }
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteQuestion.isPending}>
        Hủy
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteQuestion.isPending}
        leftIcon={deleteQuestion.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
      >
        {deleteQuestion.isPending ? 'Đang xóa…' : 'Xóa'}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={deleteQuestion.isPending ? () => {} : onClose}
      title="Xóa câu hỏi"
      icon={<AlertTriangle size={18} className="text-rose-500" />}
      footer={footer}
    >
      <p className="text-sm text-plum-600">Bạn có chắc muốn xóa câu hỏi này không?</p>
      {deleteQuestion.isError && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {(deleteQuestion.error as Error)?.message || 'Không thể xóa câu hỏi, vui lòng thử lại sau.'}
        </p>
      )}
    </Modal>
  )
}
