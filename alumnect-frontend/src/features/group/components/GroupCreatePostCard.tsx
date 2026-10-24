import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, ImagePlus, Loader2, Send, X } from 'lucide-react'
import { toast } from '@/components/ui'
import { Avatar, Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { groupApi } from '../api/groupApi'
import { useCreateGroupPostMutation } from '../hooks/useGroupPosts'
import { validateGroupMedia } from '../lib/groupMedia'

interface GroupCreatePostCardProps {
  groupId: number
  groupName: string
  topics: string[]
}

export function GroupCreatePostCard({ groupId, groupName, topics }: GroupCreatePostCardProps) {
  const user = useAuthStore((s) => s.user)
  const [content, setContent] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [videos, setVideos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [topicMenuOpen, setTopicMenuOpen] = useState(false)
  const [topicMenuPosition, setTopicMenuPosition] = useState({ top: 0, left: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const topicButtonRef = useRef<HTMLButtonElement>(null)
  const topicMenuRef = useRef<HTMLDivElement>(null)

  const createPostMutation = useCreateGroupPostMutation(groupId)
  const currentTopic = topics.find((topic) => topic === selectedTopic) ?? null

  const updateTopicMenuPosition = useCallback(() => {
    const rect = topicButtonRef.current?.getBoundingClientRect()
    if (!rect) return
    const menuWidth = Math.min(230, window.innerWidth - 24)
    setTopicMenuPosition({
      top: rect.bottom + 6,
      left: Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12)),
    })
  }, [])

  const toggleTopicMenu = () => {
    if (topicMenuOpen) {
      setTopicMenuOpen(false)
    } else {
      updateTopicMenuPosition()
      setTopicMenuOpen(true)
    }
  }

  useEffect(() => {
    if (!topicMenuOpen) return

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        topicButtonRef.current?.contains(target) ||
        topicMenuRef.current?.contains(target)
      ) {
        return
      }
      setTopicMenuOpen(false)
    }

    const reposition = () => updateTopicMenuPosition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [topicMenuOpen, updateTopicMenuPosition])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    try {
      await validateGroupMedia(files, images.length + videos.length)
      const uploadPromises = files.map((file) => groupApi.uploadPostImage(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages((prev) => [...prev, ...uploadedUrls.filter((_, index) => files[index].type.startsWith('image/'))])
      setVideos((prev) => [...prev, ...uploadedUrls.filter((_, index) => files[index].type.startsWith('video/'))])
      toast.success(`Đã tải lên ${uploadedUrls.length} tệp`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.')
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
        topic: currentTopic,
        imageUrls: images.length > 0 ? images : undefined,
        videoUrls: videos.length > 0 ? videos : undefined,
      })
      setContent('')
      setImages([])
      setVideos([])
      setSelectedTopic(null)
      setTopicMenuOpen(false)
      setIsFocused(false)
    } catch {
      // toast is already handled in mutation
    }
  }

  return (
    <Card hover={false} className="rounded-3xl border border-border p-5 shadow-card dark:bg-surface">
      <div className="flex items-start gap-3.5">
        <Avatar
          src={user?.avatarUrl ?? ''}
          name={user?.name ?? 'Thành viên'}
          size={42}
          className="shrink-0 ring-2 ring-primary/20"
        />

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                id="group-create-post-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                aria-label="Nội dung bài thảo luận"
                placeholder={`Bạn muốn chia sẻ điều gì với cộng đồng ${groupName} hôm nay?`}
                rows={isFocused || images.length > 0 ? 3 : 2}
                className="w-full resize-none rounded-2xl border border-border bg-surface-2 p-3 text-sm text-text transition placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle"
              />
            </div>

            {topics.length > 0 && (
              <div className="relative mt-3 inline-block">
                <button
                  ref={topicButtonRef}
                  type="button"
                  id={`group-post-topic-${groupId}`}
                  aria-haspopup="listbox"
                  aria-expanded={topicMenuOpen}
                  onClick={toggleTopicMenu}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-muted transition-colors hover:text-primary-solid focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  <span>Chủ đề bài viết</span>
                  {currentTopic && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-bold text-primary-solid">
                      #{currentTopic}
                    </span>
                  )}
                  <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${topicMenuOpen ? 'rotate-180 text-brand-500' : 'text-plum-400'}`} />
                </button>

                {typeof document !== 'undefined' && createPortal(
                  <AnimatePresence>
                    {topicMenuOpen && (
                      <motion.div
                        ref={topicMenuRef}
                        role="listbox"
                        aria-labelledby={`group-post-topic-${groupId}`}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ top: topicMenuPosition.top, left: topicMenuPosition.left, transformOrigin: 'top' }}
                        className="fixed z-[100] w-56 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-brand-500/15 bg-surface p-1.5 shadow-[0_12px_36px_rgba(31,24,48,0.14)] backdrop-blur-xl dark:border-white/10"
                      >
                      <div className="mb-1 flex items-center justify-between px-2 py-1">
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-text-subtle">Chọn chủ đề</span>
                        <span className="text-xs font-medium text-text-subtle">{topics.length} lựa chọn</span>
                      </div>
                      {[null, ...topics].map((topic, index) => {
                        const selected = currentTopic === topic
                        return (
                          <motion.button
                            key={topic ?? 'none'}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.025 * index, duration: 0.15, ease: 'easeOut' }}
                            onClick={() => {
                              setSelectedTopic(topic)
                              setTopicMenuOpen(false)
                            }}
                            className={`group/topic flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition duration-150 cursor-pointer ${
                              selected
                                ? 'bg-primary-soft font-bold text-primary-solid'
                                : 'font-medium text-text-muted hover:bg-surface-2 hover:text-primary-solid'
                            }`}
                          >
                            <span>{topic ? `#${topic}` : 'Không chọn chủ đề'}</span>
                            <span className={`grid h-4.5 w-4.5 place-items-center rounded-full transition ${selected ? 'scale-100 bg-brand-500 text-white' : 'scale-75 bg-transparent text-transparent group-hover/topic:scale-100 group-hover/topic:bg-brand-500/10'}`}>
                              <Check size={11} strokeWidth={3} />
                            </span>
                          </motion.button>
                        )
                      })}
                      </motion.div>
                    )}
                  </AnimatePresence>,
                  document.body,
                )}
              </div>
            )}

            {/* Danh sách ảnh đính kèm xem trước */}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {images.map((img, idx) => (
                  <div key={idx} className="group relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                    <img src={img} alt="Đính kèm" className="h-full w-full object-cover" />
                    <button aria-label="Đóng"
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-plum-900/80 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-90"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {videos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2.5">
                {videos.map((url, idx) => (
                  <div key={url} className="group relative h-20 w-28 overflow-hidden rounded-xl bg-black">
                    <video src={url} className="h-full w-full object-cover" muted preload="metadata" />
                    <button type="button" onClick={() => setVideos((prev) => prev.filter((_, i) => i !== idx))}
                      aria-label={`Gỡ video ${idx + 1}`}
                      className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-plum-900/80 text-white">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Thanh công cụ đính kèm & Đăng bài */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id={`group-post-file-input-${groupId}`}
                />
                <label
                  htmlFor={`group-post-file-input-${groupId}`}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-text-muted transition-colors hover:bg-surface-2 hover:text-primary-solid"
                >
                  {uploading ? (
                    <Loader2 size={16} className="animate-spin text-primary-solid" />
                  ) : (
                    <ImagePlus size={16} className="text-success" />
                  )}
                  <span>Ảnh/video {images.length + videos.length > 0 ? `(${images.length + videos.length}/10)` : ''}</span>
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
