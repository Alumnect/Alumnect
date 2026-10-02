import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Check, ChevronDown, ImagePlus, Loader2, Pencil, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { groupApi } from '../api/groupApi'
import { useUpdateGroupPostMutation } from '../hooks/useGroupPosts'
import type { GroupPost } from '../model/group'
import { validateGroupMedia } from '../lib/groupMedia'

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
  const [topicOpen, setTopicOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [images, setImages] = useState<string[]>(post.imageUrls ?? [])
  const [videos, setVideos] = useState<string[]>(post.videoUrls ?? [])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateGroupPostMutation(groupId)
  const busy = uploading || updateMutation.isPending

  useEffect(() => {
    if (!topicOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setTopicOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [topicOpen])

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    setUploading(true)
    try {
      await validateGroupMedia(files, images.length + videos.length)
      const urls = await Promise.all(files.map((file) => groupApi.uploadPostImage(file)))
      setImages((current) => [...current, ...urls.filter((_, index) => files[index].type.startsWith('image/'))])
      setVideos((current) => [...current, ...urls.filter((_, index) => files[index].type.startsWith('video/'))])
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
      { postId: post.id, payload: { content: trimmed, topic: topic || null, imageUrls: images, videoUrls: videos } },
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

        {topics.length > 0 && (
          <div className="relative">
            <label className="mb-1.5 block text-sm font-semibold text-plum-900 dark:text-white">
              Chủ đề / sở thích
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setTopicOpen((prev) => !prev)}
                className="flex h-10 w-full items-center justify-between rounded-xl border border-plum-900/10 bg-white px-3.5 text-xs text-plum-900 transition-all hover:border-brand-500/50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#3a3b3c] dark:text-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {topic ? (
                    <span className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                      #{topic}
                    </span>
                  ) : (
                    <span className="text-plum-500 dark:text-[#b0b3b8]">Không chọn chủ đề</span>
                  )}
                </div>
                <ChevronDown
                  size={15}
                  className={cn(
                    'text-plum-400 transition-transform duration-200',
                    topicOpen && 'rotate-180 text-brand-500',
                  )}
                />
              </button>

              <AnimatePresence>
                {topicOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-brand-500/15 bg-white p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#242526]"
                  >
                    <div className="mb-1 flex items-center justify-between px-2 py-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-plum-400">
                        Chọn chủ đề
                      </span>
                      <span className="text-[9px] font-medium text-plum-400">
                        {topics.length} lựa chọn
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTopic('')
                        setTopicOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer',
                        !topic
                          ? 'bg-brand-500/10 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                          : 'font-medium text-plum-700 hover:bg-plum-900/[0.04] dark:text-plum-200 dark:hover:bg-[#3a3b3c]',
                      )}
                    >
                      <span>Không chọn chủ đề</span>
                      {!topic && (
                        <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-brand-500 text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>

                    {topics.map((item) => {
                      const selected = topic === item
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            setTopic(item)
                            setTopicOpen(false)
                          }}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all cursor-pointer',
                            selected
                              ? 'bg-brand-500/10 font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                              : 'font-medium text-plum-700 hover:bg-plum-900/[0.04] dark:text-plum-200 dark:hover:bg-[#3a3b3c]',
                          )}
                        >
                          <span>#{item}</span>
                          {selected && (
                            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-brand-500 text-white">
                              <Check size={11} strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold">Ảnh/video đính kèm ({images.length + videos.length}/{MAX_IMAGES})</p>
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
          {videos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {videos.map((url, index) => (
                <div key={`${url}-${index}`} className="relative h-20 w-28 overflow-hidden rounded-xl bg-black">
                  <video src={url} muted preload="metadata" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setVideos((current) => current.filter((_, videoIndex) => videoIndex !== index))}
                    aria-label={`Gỡ video ${index + 1}`} className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleUpload} />
          <Button type="button" variant="secondary" size="sm" disabled={busy || images.length + videos.length >= MAX_IMAGES} onClick={() => fileInputRef.current?.click()} leftIcon={<ImagePlus size={15} />}>
            Thêm ảnh/video
          </Button>
        </div>
      </form>
    </Modal>
  )
}
