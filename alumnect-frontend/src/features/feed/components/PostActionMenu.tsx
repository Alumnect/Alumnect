import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  // Khi không phải chính tác giả bài viết thì không cần hiển thị menu "..."
  // vì các hành động Chia sẻ, Báo cáo, Lưu, Thích, Bình luận đã có đầy đủ ở thanh bên dưới.
  if (!isAuthor) return null

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

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        aria-label="Tùy chọn bài viết"
        aria-expanded={isOpen}
        className="grid h-8 w-8 place-items-center rounded-lg text-plum-400 transition-colors hover:bg-plum-900/[0.06] hover:text-plum-900"
      >
        <MoreHorizontal size={18} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 z-30 mt-1 w-44 origin-top-right rounded-xl border border-plum-900/10 bg-white py-1.5 shadow-lg shadow-plum-950/10 ring-1 ring-black/5 focus:outline-none"
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
                    ? 'cursor-not-allowed text-plum-300'
                    : 'text-plum-700 hover:bg-plum-50 hover:text-plum-900'
                }`}
                title={
                  isEventCancelled
                    ? 'Sự kiện đã bị hủy, không thể chỉnh sửa'
                    : isEventEnded
                    ? 'Sự kiện đã kết thúc, không thể chỉnh sửa'
                    : 'Chỉnh sửa bài viết'
                }
              >
                <Pencil size={14} className={isEventImmutable ? 'text-plum-300' : 'text-plum-500'} />
                <span>Chỉnh sửa bài viết</span>
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
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-50 hover:text-amber-800"
              >
                <Ban size={14} className="text-amber-600" />
                <span>Hủy tổ chức sự kiện</span>
              </button>
            )}

            {/* Phân cách trước nút Xóa */}
            {onDelete && <div className="my-1 border-t border-plum-900/10" />}

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
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 size={14} className="text-rose-500" />
                <span>Xóa bài viết</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
