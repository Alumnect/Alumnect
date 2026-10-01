import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Crown,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Pencil,
  Repeat,
  Send,
  ShieldCheck,
  Trash2,
  X,
  Loader2,
} from 'lucide-react'
import { toast, ImageViewerModal } from '@/components/ui'
import { Avatar, Badge, Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { TRANSITION } from '@/lib/motion'
import { useAuthStore } from '@/store/authStore'
import { ShareModal } from '@/features/feed'
import { ConfirmDialog } from './ConfirmDialog'
import { GroupEditPostModal } from './GroupEditPostModal'
import type { GroupComment, GroupPost } from '../model/group'
import {
  useDeleteGroupPostMutation,
  useToggleGroupPostLikeMutation,
  useToggleGroupPostPinMutation,
  useGroupCommentsQuery,
  useCreateGroupCommentMutation,
  useDeleteGroupCommentMutation,
  useUpdateGroupCommentMutation,
} from '../hooks/useGroupPosts'

let minuteSnapshot = Math.floor(Date.now() / 60000)
const minuteListeners = new Set<() => void>()
let minuteTimer: ReturnType<typeof setInterval> | null = null

function subscribeToMinute(listener: () => void) {
  minuteListeners.add(listener)
  const refreshMinute = () => {
    const next = Math.floor(Date.now() / 60000)
    if (next === minuteSnapshot) return
    minuteSnapshot = next
    minuteListeners.forEach((notify) => notify())
  }
  if (!minuteTimer) {
    queueMicrotask(refreshMinute)
    minuteTimer = setInterval(refreshMinute, 15_000)
  }
  return () => {
    minuteListeners.delete(listener)
    if (minuteListeners.size === 0 && minuteTimer) {
      clearInterval(minuteTimer)
      minuteTimer = null
    }
  }
}

const getMinuteSnapshot = () => minuteSnapshot

interface GroupPostCardProps {
  post: GroupPost
  groupId: number
  isActiveMember: boolean
  isGroupActive: boolean
  topics: string[]
}

export function GroupPostCard({ post, groupId, isActiveMember, isGroupActive, topics }: GroupPostCardProps) {
  const now = useSyncExternalStore(subscribeToMinute, getMinuteSnapshot, getMinuteSnapshot) * 60000
  const currentUser = useAuthStore((s) => s.user)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingPost, setEditingPost] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  // Mutations
  const likeMutation = useToggleGroupPostLikeMutation(groupId)
  const pinMutation = useToggleGroupPostPinMutation(groupId)
  const deleteMutation = useDeleteGroupPostMutation(groupId)

  // Comments
  const { data: commentsData, isLoading: commentsLoading, hasNextPage: hasMoreComments, fetchNextPage: fetchMoreComments, isFetchingNextPage } = useGroupCommentsQuery(
    groupId,
    post.id,
    50,
    showComments, // chỉ tải bình luận khi người dùng mở khung bình luận
  )
  const createCommentMutation = useCreateGroupCommentMutation(groupId, post.id)
  const deleteCommentMutation = useDeleteGroupCommentMutation(groupId, post.id)
  const updateCommentMutation = useUpdateGroupCommentMutation(groupId, post.id)
  const loadedComments = commentsData?.pages.flatMap((page) => page.content) ?? []
  const roots = loadedComments.filter((comment) => !comment.parentId || !loadedComments.some((item) => item.id === comment.parentId))
  const orderedComments: GroupComment[] = roots.flatMap((root) => [
    root,
    ...loadedComments.filter((comment) => comment.parentId === root.id),
  ])

  const handleToggleLike = () => {
    if (!isGroupActive) return
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
      await createCommentMutation.mutateAsync({ content: trimmed })
      setCommentText('')
    } catch {
      // toast handled in mutation
    }
  }

  const handleSendReply = async (event: React.FormEvent, parentId: number) => {
    event.preventDefault()
    const content = replyText.trim()
    if (!content) return
    const selectedComment = loadedComments.find((comment) => comment.id === parentId)
    const rootParentId = selectedComment?.parentId ?? parentId
    try {
      await createCommentMutation.mutateAsync({ content, parentId: rootParentId })
      setReplyText('')
      setReplyingTo(null)
    } catch {
      // Lỗi đã được hiển thị trong mutation.
    }
  }

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const saveCommentEdit = async (commentId: number) => {
    const content = editingCommentText.trim()
    if (!content) return
    try {
      await updateCommentMutation.mutateAsync({ commentId, content })
      setEditingCommentId(null)
    } catch {
      // Lỗi đã được hiển thị trong mutation.
    }
  }

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso)
      const diffMin = Math.round((now - d.getTime()) / 60000)
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
      <Card hover={false} id={`group-post-${post.id}`} className="rounded-3xl border border-plum-900/[0.08] p-5 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
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
                {post.updatedAt && new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 10000 && (
                  <span>• Đã chỉnh sửa</span>
                )}
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

          {/* Action Menu (Edit, Pin, Delete) */}
          {isGroupActive && (post.canEdit || post.canPin || post.canDelete) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Tùy chọn bài viết"
                aria-expanded={menuOpen}
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
                    {post.canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setEditingPost(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-plum-700 transition-colors hover:bg-plum-900/[0.05] dark:text-plum-200 dark:hover:bg-[#3a3b3c]"
                      >
                        <Pencil size={14} /> Chỉnh sửa bài viết
                      </button>
                    )}
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

        {post.topic && (
          <span className="mt-3 inline-flex rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:text-brand-300">
            #{post.topic}
          </span>
        )}

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

        {(post.videoUrls ?? []).length > 0 && (
          <div className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {post.videoUrls.map((url, index) => (
              <video key={`${url}-${index}`} src={url} controls preload="metadata"
                aria-label={`Video đính kèm ${index + 1}`}
                className="max-h-[460px] w-full rounded-2xl bg-black" />
            ))}
          </div>
        )}

        {/* Thanh tương tác: Like, Bình luận, Chia sẻ */}
        <div className="mt-4 flex items-center justify-between border-t border-plum-900/[0.06] pt-3 text-xs font-bold text-plum-500 dark:border-[#393a3b] dark:text-[#b0b3b8]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={!isGroupActive || likeMutation.isPending}
              aria-pressed={post.likedByViewer}
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
              <span>{post.commentCount} bình luận</span>
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
                {isActiveMember && isGroupActive ? (
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
                        maxLength={1000}
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
                    {isGroupActive ? 'Vui lòng tham gia hội nhóm để tham gia bình luận.' : 'Hội nhóm đang tạm ngừng tương tác.'}
                  </p>
                )}

                {/* Danh sách bình luận */}
                {commentsLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 size={18} className="animate-spin text-brand-500" />
                  </div>
                ) : loadedComments.length > 0 ? (
                  <div className="space-y-2.5 pt-1">
                    {orderedComments.map((c) => {
                      const parentComment = c.parentId ? loadedComments.find((comment) => comment.id === c.parentId) : undefined
                      return (
                      <div key={c.id} className={cn('group flex items-start gap-2.5', c.parentId && 'relative ml-8 border-l-2 border-brand-500/20 pl-4 before:absolute before:-left-0.5 before:top-0 before:h-4 before:w-4 before:-translate-x-full before:rounded-bl-xl before:border-b-2 before:border-l-2 before:border-brand-500/20')}>
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
                              {c.updatedAt && new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 10000 && (
                                <span className="text-[10px] text-plum-400">• Đã chỉnh sửa</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isGroupActive && c.canEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(c.id)
                                    setEditingCommentText(c.content)
                                  }}
                                  className="text-plum-400 hover:text-brand-600"
                                  aria-label="Chỉnh sửa bình luận"
                                ><Pencil size={13} /></button>
                              )}
                              {isGroupActive && c.canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setDeletingCommentId(c.id)}
                                  className="text-plum-400 hover:text-rose-500"
                                  aria-label="Xóa bình luận"
                                ><Trash2 size={13} /></button>
                              )}
                            </div>
                          </div>

                          {editingCommentId === c.id ? (
                            <form
                              onSubmit={(event) => {
                                event.preventDefault()
                                saveCommentEdit(c.id)
                              }}
                              className="mt-2 space-y-2"
                            >
                              <textarea
                                value={editingCommentText}
                                onChange={(event) => setEditingCommentText(event.target.value)}
                                maxLength={1000}
                                rows={3}
                                autoFocus
                                className="w-full rounded-xl border border-plum-900/10 bg-white p-2 text-xs text-plum-900 focus:border-brand-500 focus:outline-none dark:border-[#393a3b] dark:bg-[#242526] dark:text-white"
                              />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setEditingCommentId(null)} disabled={updateCommentMutation.isPending} className="text-xs text-plum-500">Hủy</button>
                                <button type="submit" disabled={!editingCommentText.trim() || updateCommentMutation.isPending} className="text-xs font-bold text-brand-600 disabled:opacity-50">
                                  {updateCommentMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                              </div>
                            </form>
                          ) : (
                            <div className="mt-1">
                              {parentComment && (
                                <span className="mr-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                                  @{parentComment.author.fullName}
                                </span>
                              )}
                              <span className="whitespace-pre-wrap text-xs text-plum-800 dark:text-plum-200">{c.content}</span>
                            </div>
                          )}
                          {isActiveMember && isGroupActive && editingCommentId !== c.id && (
                            <button type="button" onClick={() => {
                              setReplyingTo(c.id)
                              setReplyText('')
                            }} className="mt-1.5 text-[11px] font-semibold text-brand-600 hover:underline dark:text-brand-400">
                              Trả lời
                            </button>
                          )}
                          {replyingTo === c.id && (
                            <form onSubmit={(event) => handleSendReply(event, c.id)} className="mt-2 space-y-2">
                              <label className="block text-[11px] text-plum-500">Trả lời {c.author.fullName}</label>
                              <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)}
                                maxLength={1000} rows={2} autoFocus
                                className="w-full rounded-xl border border-plum-900/10 bg-white p-2 text-xs text-plum-900 focus:border-brand-500 focus:outline-none dark:border-[#393a3b] dark:bg-[#242526] dark:text-white" />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setReplyingTo(null)} className="text-xs text-plum-500">Hủy</button>
                                <button type="submit" disabled={!replyText.trim() || createCommentMutation.isPending}
                                  className="text-xs font-bold text-brand-600 disabled:opacity-50">Gửi trả lời</button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>
                      )
                    })}
                    {hasMoreComments && (
                      <button type="button" onClick={() => fetchMoreComments()} disabled={isFetchingNextPage}
                        className="block w-full py-2 text-center text-xs font-semibold text-brand-600 hover:underline">
                        {isFetchingNextPage ? 'Đang tải...' : 'Xem thêm bình luận'}
                      </button>
                    )}
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

      <ConfirmDialog
        open={deletingCommentId !== null}
        title="Xóa bình luận"
        message="Bạn có chắc chắn muốn xóa bình luận này không?"
        confirmLabel="Xóa bình luận"
        danger
        loading={deleteCommentMutation.isPending}
        onConfirm={() => {
          if (deletingCommentId === null) return
          deleteCommentMutation.mutate(deletingCommentId, { onSuccess: () => setDeletingCommentId(null) })
        }}
        onClose={() => setDeletingCommentId(null)}
      />

      {editingPost && <GroupEditPostModal post={post} groupId={groupId} topics={topics} onClose={() => setEditingPost(false)} />}

      {/* Lightbox xem ảnh toàn màn hình chuẩn Messenger với Zoom, Pan, Rotate, Download */}
      <ImageViewerModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        src={previewImage || ''}
        alt="Ảnh bài viết hội nhóm"
        senderName={post.author.fullName}
        senderAvatar={post.author.avatarUrl}
        time={formatTime(post.createdAt)}
      />

      {shareModalOpen && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          shareItem={{
            title: post.author.fullName,
            subtitle: post.content || 'Bài viết trong nhóm',
            thumbnail: post.imageUrls?.[0] ?? null,
            avatarUrl: post.author.avatarUrl,
            url: `${window.location.origin}/app/groups/${groupId}?postId=${post.id}`,
            typeLabel: 'bài viết nhóm',
          }}
        />
      )}
    </>
  )
}
