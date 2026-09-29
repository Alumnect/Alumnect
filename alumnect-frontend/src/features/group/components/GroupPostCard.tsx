import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Crown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Repeat,
  Send,
  ShieldCheck,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { toast } from '@/components/ui'
import { Avatar, Badge, Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { TRANSITION } from '@/lib/motion'
import { useAuthStore } from '@/store/authStore'
import { ConfirmDialog } from './ConfirmDialog'
import type { GroupPost } from '../model/group'
import {
  useDeleteGroupPostMutation,
  useToggleGroupPostLikeMutation,
  useToggleGroupPostPinMutation,
  useGroupCommentsQuery,
  useCreateGroupCommentMutation,
  useDeleteGroupCommentMutation,
} from '../hooks/useGroupPosts'

interface GroupPostCardProps {
  post: GroupPost
  groupId: number
  isActiveMember: boolean
}

export function GroupPostCard({ post, groupId, isActiveMember }: GroupPostCardProps) {
  const currentUser = useAuthStore((s) => s.user)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Mutations
  const likeMutation = useToggleGroupPostLikeMutation(groupId)
  const pinMutation = useToggleGroupPostPinMutation(groupId)
  const deleteMutation = useDeleteGroupPostMutation(groupId)

  // Comments
  const { data: commentsData, isLoading: commentsLoading } = useGroupCommentsQuery(
    groupId,
    post.id,
    0,
    50,
    showComments, // chỉ tải bình luận khi người dùng mở khung bình luận
  )
  const createCommentMutation = useCreateGroupCommentMutation(groupId, post.id)
  const deleteCommentMutation = useDeleteGroupCommentMutation(groupId, post.id)

  const handleToggleLike = () => {
    if (!isActiveMember) {
      toast.error('Vui lòng tham gia hội nhóm để thích bài viết!')
      return
    }
    likeMutation.mutate(post.id)
  }

  const handleTogglePin = () => {
    pinMutation.mutate(post.id)
    setMenuOpen(false)
  }

  const handleDeletePost = () => {
    deleteMutation.mutate(post.id, {
      onSuccess: () => setConfirmDelete(false),
    })
  }

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return
    if (!isActiveMember) {
      toast.error('Vui lòng tham gia hội nhóm để bình luận!')
      return
    }

    try {
      await createCommentMutation.mutateAsync(trimmed)
      setCommentText('')
    } catch {
      // toast handled in mutation
    }
  }

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    toast.success('Đã sao chép liên kết bài viết!')
  }

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      const diffMin = Math.round((Date.now() - d.getTime()) / 60000)
      if (diffMin < 1) return 'Vừa xong'
      if (diffMin < 60) return `${diffMin} phút trước`
      const diffHour = Math.round(diffMin / 60)
      if (diffHour < 24) return `${diffHour} giờ trước`
      const diffDay = Math.round(diffHour / 24)
      if (diffDay < 7) return `${diffDay} ngày trước`
      return d.toLocaleDateString('vi-VN')
    } catch {
      return ''
    }
  }

  return (
    <>
      <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-5 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
        {/* Header: Author + Role + Time + Pinned status + Menu */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/app/profile?userId=${post.author.userId}`}>
              <Avatar
                src={post.author.avatarUrl}
                name={post.author.fullName}
                size={42}
                className="transition-transform hover:scale-105"
              />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/app/profile?userId=${post.author.userId}`}
                  className="text-sm font-extrabold text-plum-900 hover:underline dark:text-white"
                >
                  {post.author.fullName}
                </Link>

                {post.author.groupRole === 'OWNER' && (
                  <Badge tone="gold" icon={<Crown size={11} />} className="px-1.5 py-0.5 text-[10px]">
                    Sáng lập
                  </Badge>
                )}

                {post.author.groupRole === 'ADMIN' && (
                  <Badge tone="brand" icon={<ShieldCheck size={11} />} className="px-1.5 py-0.5 text-[10px]">
                    Quản trị viên
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-plum-400">
                <span>{formatTime(post.createdAt)}</span>
                {post.isPinned && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Pin size={11} /> Đã ghim
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Menu (Pin, Delete) */}
          {(post.canPin || post.canDelete) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="grid h-8 w-8 place-items-center rounded-full text-plum-400 transition-colors hover:bg-plum-900/[0.05] hover:text-plum-900 dark:hover:bg-[#3a3b3c] dark:hover:text-white"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="post-menu"
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -4, transition: TRANSITION.exit }}
                    transition={TRANSITION.pop}
                    className="absolute right-0 top-9 z-30 min-w-[170px] origin-top-right overflow-hidden rounded-2xl border border-plum-900/10 bg-white p-1.5 shadow-xl dark:border-[#393a3b] dark:bg-[#242526]"
                  >
                    {post.canPin && (
                      <button
                        type="button"
                        onClick={handleTogglePin}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-plum-700 transition-colors hover:bg-plum-900/[0.05] dark:text-plum-200 dark:hover:bg-[#3a3b3c]"
                      >
                        <Pin size={14} className={post.isPinned ? 'text-amber-500' : ''} />
                        <span>{post.isPinned ? 'Bỏ ghim bài viết' : 'Ghim bài viết'}</span>
                      </button>
                    )}

                    {post.canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setConfirmDelete(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 size={14} />
                        <span>Xóa bài viết</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Nội dung bài viết */}
        <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-plum-800 dark:text-plum-200">
          {post.content}
        </p>

        {/* Thư viện hình ảnh đính kèm */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div className="mt-3.5 overflow-hidden rounded-2xl border border-plum-900/10 dark:border-[#393a3b]">
            {post.imageUrls.length === 1 && (
              <img
                src={post.imageUrls[0]}
                alt="Đính kèm"
                loading="lazy"
                decoding="async"
                onClick={() => setPreviewImage(post.imageUrls[0])}
                className="max-h-[460px] w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
              />
            )}

            {post.imageUrls.length === 2 && (
              <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                {post.imageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Đính kèm"
                    loading="lazy"
                    decoding="async"
                    onClick={() => setPreviewImage(url)}
                    className="h-64 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                  />
                ))}
              </div>
            )}

            {post.imageUrls.length === 3 && (
              <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                <img
                  src={post.imageUrls[0]}
                  alt="Đính kèm"
                  loading="lazy"
                  decoding="async"
                  onClick={() => setPreviewImage(post.imageUrls[0])}
                  className="col-span-2 h-64 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                />
                {post.imageUrls.slice(1).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Đính kèm"
                    loading="lazy"
                    decoding="async"
                    onClick={() => setPreviewImage(url)}
                    className="h-44 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                  />
                ))}
              </div>
            )}

            {post.imageUrls.length >= 4 && (
              <div className="grid grid-cols-2 gap-1 bg-black/5 dark:bg-black/40">
                {post.imageUrls.slice(0, 3).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt="Đính kèm"
                    loading="lazy"
                    decoding="async"
                    onClick={() => setPreviewImage(url)}
                    className="h-44 w-full cursor-pointer object-cover transition-opacity hover:opacity-95"
                  />
                ))}
                <div
                  className="relative h-44 cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(post.imageUrls[3])}
                >
                  <img
                    src={post.imageUrls[3]}
                    alt="Đính kèm"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-opacity hover:opacity-95"
                  />
                  {post.imageUrls.length > 4 && (
                    <div className="absolute inset-0 grid place-items-center bg-black/50 text-xl font-black text-white">
                      +{post.imageUrls.length - 3}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Thanh tương tác: Like, Bình luận, Chia sẻ */}
        <div className="mt-4 flex items-center justify-between border-t border-plum-900/[0.06] pt-3 text-xs font-bold text-plum-500 dark:border-[#393a3b] dark:text-[#b0b3b8]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleLike}
              className={cn(
                'inline-flex items-center gap-1.5 transition-colors',
                post.likedByViewer
                  ? 'text-rose-500 font-extrabold'
                  : 'hover:text-rose-500',
              )}
            >
              {/* Tim nảy nhẹ mỗi khi đổi trạng thái thích (không animate ở lần hiển thị đầu tiên) */}
              <AnimatePresence initial={false}>
                <motion.span
                  key={post.likedByViewer ? 'liked' : 'unliked'}
                  className="inline-flex"
                  initial={{ scale: 0.55, opacity: 0.4 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={TRANSITION.bounce}
                >
                  <Heart size={16} className={cn(post.likedByViewer && 'fill-rose-500 text-rose-500')} />
                </motion.span>
              </AnimatePresence>
              <span>{post.likeCount} thích</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="inline-flex items-center gap-1.5 hover:text-brand-500"
            >
              <MessageCircle size={16} />
              <span>{post.commentCount} phản hồi</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-violet-500"
            >
              <Repeat size={16} />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Phần bình luận (Collapsible): mở / đóng bằng chuyển động chiều cao mềm */}
        <AnimatePresence initial={false}>
          {showComments && (
            <motion.div
              key="comments"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION.height}
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="mt-4 space-y-3.5 border-t border-plum-900/[0.06] pt-3.5 dark:border-[#393a3b]">
                {/* Input gửi bình luận mới (chỉ thành viên) */}
                {isActiveMember ? (
                  <form onSubmit={handleSendComment} className="flex items-center gap-2.5">
                    <Avatar
                      src={currentUser?.avatarUrl ?? ''}
                      name={currentUser?.name ?? 'Thành viên'}
                      size={32}
                      className="shrink-0"
                    />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Viết phản hồi của bạn..."
                        className="w-full rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] py-2 pl-3.5 pr-10 text-xs text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#393a3b] dark:bg-[#18191a] dark:text-white dark:placeholder:text-[#8a8d91]"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || createCommentMutation.isPending}
                        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-40 dark:text-brand-400"
                      >
                        {createCommentMutation.isPending ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-center text-xs text-plum-400 dark:text-[#8a8d91]">
                    Vui lòng tham gia hội nhóm để tham gia bình luận.
                  </p>
                )}

                {/* Danh sách bình luận */}
                {commentsLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 size={18} className="animate-spin text-brand-500" />
                  </div>
                ) : commentsData?.content && commentsData.content.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {commentsData.content.map((c) => (
                      <div key={c.id} className="group flex items-start gap-2.5">
                        <Link to={`/app/profile?userId=${c.author.userId}`}>
                          <Avatar
                            src={c.author.avatarUrl}
                            name={c.author.fullName}
                            size={28}
                            className="shrink-0"
                          />
                        </Link>

                        <div className="flex-1 rounded-2xl bg-plum-900/[0.03] p-3 dark:bg-[#3a3b3c]/50">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/app/profile?userId=${c.author.userId}`}
                                className="text-xs font-bold text-plum-900 hover:underline dark:text-white"
                              >
                                {c.author.fullName}
                              </Link>

                              {c.author.groupRole === 'OWNER' && (
                                <span className="text-[9px] font-black text-amber-500">👑 Sáng lập</span>
                              )}
                              {c.author.groupRole === 'ADMIN' && (
                                <span className="text-[9px] font-black text-brand-500">🛡️ Quản trị</span>
                              )}

                              <span className="text-[10px] text-plum-400">
                                • {formatTime(c.createdAt)}
                              </span>
                            </div>

                            {c.canDelete && (
                              <button
                                type="button"
                                onClick={() => deleteCommentMutation.mutate(c.id)}
                                className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500 text-plum-400"
                                title="Xóa bình luận"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-plum-800 dark:text-plum-200">
                            {c.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs text-plum-400 dark:text-[#8a8d91]">
                    Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nghĩ!
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Modal xác nhận xóa bài viết */}
      <ConfirmDialog
        open={confirmDelete}
        title="Xóa bài viết thảo luận"
        message="Bạn có chắc chắn muốn xóa bài viết này không? Toàn bộ hình ảnh và bình luận liên quan cũng sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa bài viết"
        danger
        loading={deleteMutation.isPending}
        onConfirm={handleDeletePost}
        onClose={() => setConfirmDelete(false)}
      />

      {/* Modal phóng to ảnh */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: TRANSITION.exit }}
            transition={TRANSITION.overlay}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={TRANSITION.pop}
              className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl"
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X size={18} />
              </button>
              <img src={previewImage} alt="Phóng to" className="max-h-[90vh] max-w-[90vw] object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
