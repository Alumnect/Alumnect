import { useEffect } from 'react'
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, toast } from '@/components/ui'
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
  const { t } = useTranslation()
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
        toast.success(t('feed.deleteCommentSuccess'))
        onDeleted?.()
        onClose()
      },
      onError: (err: any) => {
        toast.error(err?.message || t('feed.deleteCommentError'))
      }
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('feed.deleteCommentTitle')}
      icon={<Trash2 size={18} className="text-danger" />}
      maxWidthClassName="max-w-md"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="md" onClick={close} disabled={deleteComment.isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={confirmDelete}
            disabled={deleteComment.isPending || !comment}
            leftIcon={deleteComment.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            className="border-danger bg-danger text-text-inverse hover:opacity-90"
          >
            {deleteComment.isPending ? t('feed.deleting') : t('common.delete')}
          </Button>
        </div>
      }
    >
      {deleteComment.isError && (
        <div role="alert" className="mb-3 flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          <AlertTriangle size={16} className="shrink-0" /> {(deleteComment.error as Error).message}
        </div>
      )}
      <p className="text-sm leading-relaxed text-text-muted">
        {t('feed.deleteCommentConfirm')}
      </p>
    </Modal>
  )
}
