import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImagePlus, Loader2, Pencil, X } from 'lucide-react'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { groupApi } from '../api/groupApi'
import { useUpdateGroupPostMutation } from '../hooks/useGroupPosts'
import type { GroupPost } from '../model/group'

const MAX_IMAGES = 10
const MAX_CONTENT = 5000

export function GroupEditPostModal({ post, groupId, topics, onClose }: {
  post: GroupPost
  groupId: number
  topics: string[]
  onClose: () => void
}) {
  const [content, setContent] = useState(post.content)
  const [topic, setTopic] = useState(topics.includes(post.topic ?? '') ? post.topic ?? '' : '')
  const [images, setImages] = useState<string[]>(post.imageUrls ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateGroupPostMutation(groupId)
  const busy = uploading || updateMutation.isPending

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    if (images.length + files.length > MAX_IMAGES) {
      toast.error(`Chỉ được đính kèm tối đa ${MAX_IMAGES} hình ảnh.`)
      return
    }
    setUploading(true)
    try {
      const urls = await Promise.all(files.map((file) => groupApi.uploadPostImage(file)))
      setImages((current) => [...current, ...urls])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập nội dung bài viết.')
      return
    }
    updateMutation.mutate(
      { postId: post.id, payload: { content: trimmed, topic: topic || null, imageUrls: images } },
      { onSuccess: onClose },
    )
  }

  return (
    <Modal
      isOpen
      onClose={busy ? () => undefined : onClose}
      title="Chỉnh sửa bài viết"
      icon={<Pencil size={17} />}
      maxWidthClassName="max-w-xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Hủy</Button>
          <Button type="submit" form={`group-edit-post-${post.id}`} disabled={busy || !content.trim()} leftIcon={busy ? <Loader2 size={16} className="animate-spin" /> : undefined}>
            {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </div>
      }
    >
      <form id={`group-edit-post-${post.id}`} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor={`group-edit-content-${post.id}`} className="mb-1.5 block text-sm font-semibold">Nội dung bài viết</label>
          <textarea
            id={`group-edit-content-${post.id}`}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={MAX_CONTENT}
            rows={5}
            className="w-full resize-y rounded-2xl border border-plum-900/10 bg-plum-900/[0.03] p-3 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-white"
          />
          <p className="text-right text-xs text-plum-400">{content.length}/{MAX_CONTENT}</p>
        </div>

        <div>
          <label htmlFor={`group-edit-topic-${post.id}`} className="mb-1.5 block text-sm font-semibold">Chủ đề / sở thích</label>
          <select
            id={`group-edit-topic-${post.id}`}
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="w-full rounded-2xl border border-plum-900/10 bg-white p-3 text-sm text-plum-900 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-white"
          >
            <option value="">Không chọn chủ đề</option>
            {topics.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">Ảnh đính kèm ({images.length}/{MAX_IMAGES})</p>
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((url, index) => (
                <div key={`${url}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl">
                  <img src={url} alt={`Ảnh ${index + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                    aria-label={`Gỡ ảnh ${index + 1}`}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                  ><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />
          <Button type="button" variant="secondary" size="sm" disabled={busy || images.length >= MAX_IMAGES} onClick={() => fileInputRef.current?.click()} leftIcon={<ImagePlus size={15} />}>
            Thêm ảnh
          </Button>
        </div>
      </form>
    </Modal>
  )
}
