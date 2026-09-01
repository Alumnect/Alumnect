import { useEffect } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { Comment } from '../model/comment'
import { useDeleteComment } from '../hooks/useDeleteComment'

/**
 * Modal xác nhận xóa bình luận của chính tác giả (UC20).
 * Component hiển thị trạng thái đang xử lý và lỗi từ backend; quyền sở hữu vẫn được kiểm tra lại phía server.
 */
export function DeleteCommentModal({
  isOpen,
  onClose,
  onDeleted,
  postId,
  comment,
}: {
  isOpen: boolean
  onClose: () => void
  onDeleted?: () => void
  postId: string
  comment: Comment | null
}) {
  const deleteComment = useDeleteComment(postId)
  const resetMutation = deleteComment.reset

  useEffect(() => {
    if (isOpen) resetMutation()
  }, [isOpen, resetMutation])

  const close = () => {
    if (!deleteComment.isPending) onClose()
  }

  const confirmDelete = () => {
    if (!comment) return
    deleteComment.mutate(comment.id, {
      onSuccess: () => {
        onDeleted?.()
        onClose()
      },
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Xóa bình luận"
      icon={<Trash2 size={18} className="text-rose-500" />}
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="md" onClick={close} disabled={deleteComment.isPending}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={confirmDelete}
            disabled={deleteComment.isPending || !comment}
            leftIcon={deleteComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            className="border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
          >
            {deleteComment.isPending ? 'Đang xóa…' : 'Xóa bình luận'}
          </Button>
        </div>
      }
    >
      {deleteComment.isError && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
          <AlertTriangle size={16} className="shrink-0" /> {(deleteComment.error as Error).message}
        </div>
      )}
      <p className="text-sm leading-relaxed text-plum-600">
        Bạn có chắc chắn muốn xóa bình luận này không? Bình luận sẽ không còn hiển thị sau khi xóa.
      </p>
    </Modal>
  )
}
