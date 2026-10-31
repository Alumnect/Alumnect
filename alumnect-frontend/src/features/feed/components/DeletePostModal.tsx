import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDeletePost } from '../hooks/useDeletePost'
import type { Post } from '../model/post'

export function DeletePostModal({
  open,
  onClose,
  post,
  onDeleted
}: {
  open: boolean
  onClose: () => void
  post: Post
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const deletePost = useDeletePost()

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        toast.success(t('feed.deletePostSuccess'))
        onClose()
        if (onDeleted) onDeleted()
      },
      onError: (err) => {
        toast.error(err.message || t('feed.deletePostError'))
      }
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deletePost.isPending}>
        {t('common.cancel')}
      </Button>
      <Button 
        variant="primary" 
        onClick={handleDelete}
        disabled={deletePost.isPending}
        leftIcon={deletePost.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="bg-danger hover:opacity-90 border-danger text-text-inverse"
      >
        {deletePost.isPending ? t('feed.deleting') : t('common.delete')}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={open}
      onClose={deletePost.isPending ? () => {} : onClose}
      title={t('feed.deletePostTitle')}
      icon={<AlertTriangle size={18} className="text-danger" />}
      footer={footer}
    >
      <p className="text-sm text-text-muted">
        {t('feed.deletePostConfirm')}
      </p>
    </Modal>
  )
}
