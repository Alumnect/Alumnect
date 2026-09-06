import { AlertTriangle, Loader2 } from 'lucide-react'
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
  const deletePost = useDeletePost()

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        toast.success('Đã xóa bài viết thành công')
        onClose()
        if (onDeleted) onDeleted()
      },
      onError: (err) => {
        toast.error(err.message || 'Không thể xóa bài viết, vui lòng thử lại sau.')
      }
    })
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <Button variant="secondary" onClick={onClose} disabled={deletePost.isPending}>
        Hủy
      </Button>
      <Button 
        variant="primary" 
        onClick={handleDelete}
        disabled={deletePost.isPending}
        leftIcon={deletePost.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}
        className="bg-rose-500 hover:bg-rose-600 border-rose-500 text-white"
      >
        {deletePost.isPending ? 'Đang xóa...' : 'Xóa'}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={open}
      onClose={deletePost.isPending ? () => {} : onClose}
      title="Xóa bài viết"
      icon={<AlertTriangle size={18} className="text-rose-500" />}
      footer={footer}
    >
      <p className="text-sm text-plum-600">
        Bạn có chắc muốn xóa bài viết này không?
      </p>
    </Modal>
  )
}
