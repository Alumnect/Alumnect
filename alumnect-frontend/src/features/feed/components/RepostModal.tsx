import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Repeat2, Loader2 } from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { Post } from '../model/post'
import { useRepostPost } from '../hooks/useRepostPost'
import type { AuthUser } from '@/store/authStore'
import { cn } from '@/lib/utils'

export function RepostModal({
  open,
  onClose,
  post,
  viewer,
}: {
  open: boolean
  onClose: () => void
  post?: Post
  viewer: AuthUser
}) {
  const [content, setContent] = useState('')
  const repostMutation = useRepostPost()

  // Nguồn gốc bài viết (để tránh tạo lồng nhiều cấp)
  const originalPost = post?.originalPost ?? post

  const handleClose = () => {
    if (!repostMutation.isPending) {
      setContent('')
      onClose()
    }
  }

  const handleRepost = () => {
    if (!originalPost) return
    repostMutation.mutate(
      { postId: originalPost.id, content: content.trim() || null },
      {
        onSuccess: () => {
          handleClose()
        },
      }
    )
  }

  if (!open || !originalPost) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-plum-900/10 px-5 py-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-plum-900">
              <Repeat2 className="text-[#F27024]" /> Đăng lại bài viết
            </h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={repostMutation.isPending}
              className="grid h-8 w-8 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-50 hover:text-plum-900 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {/* Soạn nội dung (Quote) */}
            <div className="flex gap-3 mb-5">
              <Avatar src={viewer.avatarUrl ?? undefined} name={viewer.name} size={40} verified={viewer.verified} />
              <div className="flex-1">
                <p className="font-bold text-plum-900 text-sm mb-1">{viewer.name}</p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Thêm suy nghĩ của bạn về bài viết này..."
                  className="w-full resize-none bg-transparent text-[15px] outline-hidden placeholder:text-plum-400 min-h-[80px]"
                  autoFocus
                />
              </div>
            </div>

            {/* Bài viết gốc */}
            <div className="rounded-xl border border-plum-900/10 p-4 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Avatar src={originalPost.avatar} name={originalPost.author} size={24} verified={originalPost.verified} />
                <span className="font-bold text-plum-900 text-sm truncate">{originalPost.author}</span>
                <span className="text-xs text-plum-400">{originalPost.time}</span>
              </div>
              {originalPost.text && (
                <p className="text-sm text-plum-700 line-clamp-3 mb-2">{originalPost.text}</p>
              )}
              {originalPost.type === 'recruitment' && originalPost.job && (
                <div className="text-sm font-semibold text-brand-700">💼 {originalPost.job.title}</div>
              )}
              {originalPost.type === 'event' && originalPost.event && (
                <div className="text-sm font-semibold text-violet-700">📅 {originalPost.event.title}</div>
              )}
              {((originalPost.images && originalPost.images.length > 0) || originalPost.image) && (
                <div className="mt-2 text-xs text-plum-500 italic">Có đính kèm hình ảnh</div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-plum-900/10 p-4 flex justify-end gap-3 bg-slate-50/50">
            <Button variant="secondary" onClick={handleClose} disabled={repostMutation.isPending}>
              Hủy
            </Button>
            <Button
              className="bg-[#F27024] hover:bg-[#d96010] text-white"
              onClick={handleRepost}
              disabled={repostMutation.isPending}
            >
              {repostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang đăng...
                </>
              ) : (
                'Đăng lại'
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
