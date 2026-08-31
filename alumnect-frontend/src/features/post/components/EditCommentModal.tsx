import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AlertTriangle, CheckCircle2, Loader2, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { Comment } from '../model/comment'
import { useUpdateComment } from '../hooks/useUpdateComment'

/** Giới hạn nội dung phải khớp tuyệt đối @Size phía Backend. */
const COMMENT_MAX = 2000

const editCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung bình luận không được để trống')
    .max(COMMENT_MAX, 'Nội dung bình luận không được vượt quá 2000 ký tự'),
})

type EditCommentInput = z.infer<typeof editCommentSchema>

/**
 * Modal chỉnh sửa bình luận của chính tác giả (UC19).
 * Component chỉ được render khi UI đã xác nhận role Student/Alumni và quyền sở hữu; backend vẫn kiểm tra lại.
 */
export function EditCommentModal({
  isOpen,
  onClose,
  onUpdated,
  postId,
  comment,
}: {
  isOpen: boolean
  onClose: () => void
  onUpdated?: () => void
  postId: string
  comment: Comment | null
}) {
  const {
    mutate,
    reset: resetMutation,
    isPending,
    isError,
    error,
  } = useUpdateComment(postId)
  const commentId = comment?.id
  const commentText = comment?.text ?? ''
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<EditCommentInput>({
    resolver: zodResolver(editCommentSchema),
    defaultValues: { content: '' },
  })

  useEffect(() => {
    if (isOpen && commentId) {
      resetMutation()
      reset({ content: commentText })
    }
  }, [isOpen, commentId, commentText, reset, resetMutation])

  const content = watch('content') ?? ''
  const close = () => {
    if (!isPending) onClose()
  }

  const onSubmit = (values: EditCommentInput) => {
    if (!commentId) return
    mutate(
      { commentId, content: values.content.trim() },
      {
        onSuccess: () => {
          onUpdated?.()
          onClose()
        },
      },
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title="Chỉnh sửa bình luận"
      icon={<Pencil size={18} />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="md" onClick={close} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="submit"
            form="edit-comment-form"
            variant="primary"
            size="md"
            disabled={isPending}
            leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          >
            {isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
          </Button>
        </div>
      }
    >
      <form id="edit-comment-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {isError && (
          <div role="alert" className="mb-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">
            <AlertTriangle size={16} className="shrink-0" /> {(error as Error).message}
          </div>
        )}
        <label htmlFor="edit-comment-content" className="mb-1.5 block text-sm font-bold text-plum-800">
          Nội dung bình luận
        </label>
        <textarea
          id="edit-comment-content"
          {...register('content')}
          autoFocus
          rows={5}
          maxLength={COMMENT_MAX}
          aria-invalid={!!errors.content}
          aria-describedby="edit-comment-content-error"
          className="w-full resize-y rounded-xl border border-plum-900/10 bg-plum-900/[0.03] px-4 py-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {errors.content && <p id="edit-comment-content-error" className="mt-1 text-xs font-medium text-rose-600">{errors.content.message}</p>}
        <p className="mt-2 text-right text-xs text-plum-400">
          {content.length.toLocaleString('vi-VN')}/{COMMENT_MAX.toLocaleString('vi-VN')}
        </p>
      </form>
    </Modal>
  )
}
