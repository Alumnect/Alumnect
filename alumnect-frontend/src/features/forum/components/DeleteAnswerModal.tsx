/**
 * DeleteAnswerModal — Modal xác nhận xóa câu trả lời/reply (UC49 - Delete an answer).
 *
 * Trách nhiệm:
 *  - Hiển thị cảnh báo, chờ xác nhận trước khi gọi API xóa (mềm) — hành động không thể hoàn tác từ UI.
 *  - Chỉ mở được bởi chính tác giả câu trả lời (nút "Xóa" đã ẩn với người khác ở nơi gọi).
 */
import { AlertTriangle, Loader2 } from 'lucide-react'
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
  const deleteAnswer = useDeleteAnswer(questionId)

  const handleDelete = () => {
    deleteAnswer.mutate(answerId, {
      onSuccess: () => {
        toast.success('Đã xóa câu trả lời thành công')
        onDeleted()
      },
      onError: (err: any) => {
        toast.error(err?.message || 'Không thể xóa câu trả lời')
      },
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deleteAnswer.isPending}>
        Hủy
      </Button>
      <Button
        variant="primary"
        onClick={handleDelete}
        disabled={deleteAnswer.isPending}
        leftIcon={deleteAnswer.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
      >
        {deleteAnswer.isPending ? 'Đang xóa…' : 'Xóa'}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen
      onClose={deleteAnswer.isPending ? () => {} : onClose}
      title="Xóa câu trả lời"
      icon={<AlertTriangle size={18} className="text-rose-500" />}
      footer={footer}
    >
      <p className="text-sm text-plum-600">Bạn có chắc muốn xóa câu trả lời này không?</p>
      {deleteAnswer.isError && (
        <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600">
          {(deleteAnswer.error as Error)?.message || 'Không thể xóa câu trả lời, vui lòng thử lại sau.'}
        </p>
      )}
    </Modal>
  )
}
