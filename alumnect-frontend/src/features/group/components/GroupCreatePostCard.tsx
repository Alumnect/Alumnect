import { useState, useRef } from 'react'
import { ImagePlus, Loader2, Send, X } from 'lucide-react'
import { toast } from '@/components/ui'
import { Avatar, Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { groupApi } from '../api/groupApi'
import { useCreateGroupPostMutation } from '../hooks/useGroupPosts'

interface GroupCreatePostCardProps {
  groupId: number
  groupName: string
}

export function GroupCreatePostCard({ groupId, groupName }: GroupCreatePostCardProps) {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createPostMutation = useCreateGroupPostMutation(groupId)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    if (images.length + files.length > 10) {
      toast.error('Chỉ được đính kèm tối đa 10 hình ảnh cho mỗi bài viết.')
      return
    }

    setUploading(true)
    try {
      const uploadPromises = files.map((file) => groupApi.uploadPostImage(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedUrls])
      toast.success(`Đã tải lên ${uploadedUrls.length} hình ảnh`)
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      toast.error('Vui lòng nhập nội dung bài viết')
      return
    }

    try {
      await createPostMutation.mutateAsync({
        content: trimmed,
        imageUrls: images.length > 0 ? images : undefined,
      })
      setContent('')
      setImages([])
      setIsFocused(false)
    } catch {
      // toast is already handled in mutation
    }
  }

  return (
    <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-5 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="flex items-start gap-3.5">
        <Avatar
          src={user?.avatarUrl ?? ''}
          name={user?.name ?? 'Thành viên'}
          size={42}
          className="shrink-0 ring-2 ring-brand-500/20"
        />

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={`Bạn muốn chia sẻ điều gì với cộng đồng ${groupName} hôm nay?`}
              rows={isFocused || images.length > 0 ? 3 : 2}
              className="w-full resize-none rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-3 text-sm text-plum-900 transition-all placeholder:text-plum-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#18191a] dark:text-white dark:placeholder:text-[#8a8d91] dark:focus:border-brand-400 dark:focus:bg-[#242526]"
            />

            {/* Danh sách ảnh đính kèm xem trước */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-plum-900/10 dark:border-[#393a3b]">
                    <img src={img} alt="Đính kèm" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-plum-900/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-rose-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Thanh công cụ đính kèm & Đăng bài */}
            <div className="mt-3 flex items-center justify-between border-t border-plum-900/[0.06] pt-3 dark:border-[#393a3b]">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id={`group-post-file-input-${groupId}`}
                />
                <label
                  htmlFor={`group-post-file-input-${groupId}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-plum-600 transition-colors hover:bg-plum-900/[0.05] hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:bg-[#3a3b3c] dark:hover:text-brand-400"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin text-brand-500" />
                  ) : (
                    <ImagePlus size={16} className="text-emerald-500" />
                  )}
                  <span>Ảnh {images.length > 0 ? `(${images.length}/10)` : ''}</span>
                </label>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={!content.trim() || uploading || createPostMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 font-bold shadow-sm"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang đăng...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Đăng thảo luận</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  )
}
