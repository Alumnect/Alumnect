import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { TRANSITION } from '@/lib/motion'
import { MoreHorizontal, Pencil, Trash2, Ban } from 'lucide-react'
import type { Post } from '../model/post'

interface PostActionMenuProps {
  post: Post
  isAuthor: boolean
  canInteract?: boolean
  onEdit?: (post: Post) => void
  onDelete?: (post: Post) => void
  onCancelEvent?: (post: Post) => void
  onReport?: (post: Post) => void
  className?: string
}

export function PostActionMenu({
  post,
  isAuthor,
  onEdit,
  onDelete,
  onCancelEvent,
  className = '',
}: PostActionMenuProps) {
  const { t } = useTranslation()
  // Khi không phải chính tác giả bài viết thì không cần hiển thị menu "..."
  // vì các hành động Chia sẻ, Báo cáo, Lưu, Thích, Bình luận đã có đầy đủ ở thanh bên dưới.
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Đóng dropdown khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const isEventCancelled = post.type === 'event' && post.event?.status === 'CANCELLED'
  const isEventEnded =
    post.type === 'event' &&
    post.event != null &&
    Boolean(
      (post.event.endTime && new Date(post.event.endTime).getTime() < Date.now()) ||
      (!post.event.endTime && post.event.startTime && new Date(post.event.startTime).getTime() < Date.now())
    )
  const isEventImmutable = isEventCancelled || isEventEnded

  if (!isAuthor) return null

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        aria-label={t('common.actions')}
        aria-expanded={isOpen}
        className="grid h-8 w-8 place-items-center rounded-lg text-text-subtle transition-colors hover:bg-border hover:text-text"
      >
        <MoreHorizontal size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4, transition: TRANSITION.exit }}
            transition={TRANSITION.pop}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 z-30 mt-1 w-44 origin-top-right rounded-xl border border-border bg-surface py-1.5 shadow-lg shadow-plum-950/10 ring-1 ring-black/5 focus:outline-none dark:shadow-black/50"
          >
            {/* Chỉnh sửa bài viết */}
            {onEdit && (
              <button
                type="button"
                disabled={isEventImmutable}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsOpen(false)
                  if (!isEventImmutable) onEdit(post)
                }}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold transition-colors ${
                  isEventImmutable
                    ? 'cursor-not-allowed text-plum-300 dark:text-text-disabled'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                }`}
                title={
                  isEventCancelled
                    ? t('feed.eventCancelledWarning')
                    : isEventEnded
                    ? t('feed.eventEndedWarning')
                    : t('feed.editPost')
                }
              >
                <Pencil size={14} className={isEventImmutable ? 'text-plum-300 dark:text-text-disabled' : 'text-text-subtle'} />
                <span>{t('feed.editPost')}</span>
              </button>
            )}

            {/* Hủy sự kiện (nếu là bài event chưa bị hủy và chưa kết thúc) */}
            {post.type === 'event' && !isEventCancelled && !isEventEnded && onCancelEvent && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsOpen(false)
                  onCancelEvent(post)
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-warning transition-colors hover:bg-warning-soft hover:text-warning"
              >
                <Ban size={14} className="text-warning" />
                <span>{t('event.cancelEvent')}</span>
              </button>
            )}

            {/* Phân cách trước nút Xóa */}
            {onDelete && <div className="my-1 border-t border-border" />}

            {/* Xóa bài viết */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsOpen(false)
                  onDelete(post)
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 size={14} className="text-danger" />
                <span>{t('feed.deletePostTitle')}</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
