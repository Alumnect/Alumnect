import { useState, useSyncExternalStore } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Loader2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast, ImageViewerModal, ImageCarousel } from '@/components/ui'
import { Avatar, Badge, Card } from '@/components/ui/primitives'
import { cn } from '@/lib/utils'
import { TRANSITION } from '@/lib/motion'
import { useAuthStore } from '@/store/authStore'
import { ShareModal } from '@/features/feed/components/ShareModal'
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
  /** Chế độ trang chi tiết bài viết: mở sẵn khung bình luận, thời gian không còn là liên kết. */
  detailMode?: boolean
  /** Gọi sau khi xóa bài viết thành công (trang chi tiết dùng để quay về hội nhóm). */
  onDeleted?: () => void
}

export function GroupPostCard({ post, groupId, isActiveMember, isGroupActive, topics, detailMode = false, onDeleted }: GroupPostCardProps) {
  const { t, i18n } = useTranslation()
  const now = useSyncExternalStore(subscribeToMinute, getMinuteSnapshot, getMinuteSnapshot) * 60000
  const currentUser = useAuthStore((s) => s.user)
  const [showComments, setShowComments] = useState(detailMode)
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingPost, setEditingPost] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null)
  const [previewIndex, setPreviewIndex] = useState<number | null>(null)
  const imageCount = post.imageUrls?.length ?? 0
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const navigate = useNavigate()

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

  const handleToggleLike = () => {
    if (!isGroupActive) return
    if (!isActiveMember) {
      toast.error(t('groups.mustJoinToLike'))
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
      onSuccess: () => {
        setConfirmDelete(false)
        onDeleted?.()
      },
    })
  }

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = commentText.trim()
    if (!trimmed) return
    if (!isActiveMember) {
      toast.error(t('groups.mustJoinToComment'))
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
    const trimmed = replyText.trim()
    if (!trimmed) return
    const selectedComment = loadedComments.find((comment) => comment.id === parentId)
    const rootParentId = selectedComment?.parentId ?? parentId
    const targetName = selectedComment?.author.fullName
    const content =
      targetName && !trimmed.toLowerCase().startsWith(`@${targetName.toLowerCase()}`)
        ? `@${targetName} ${trimmed}`
        : trimmed
    try {
      await createCommentMutation.mutateAsync({ content, parentId: rootParentId })
      setReplyText('')
      setReplyingTo(null)
    } catch {
      // Lỗi đã được hiển thị trong mutation.
    }
  }

  // Bấm vào thẻ bài viết (ngoài các phần tương tác) thì mở trang chi tiết — giống bài viết ở bảng tin.
  const handleCardClick = (e: React.MouseEvent) => {
    if (detailMode) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, select, video, [role="button"], [data-interactive]')) return
    navigate(`/app/groups/${groupId}/posts/${post.id}`)
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
      if (diffMin < 1) return t('common.justNow')
      if (diffMin < 60) return t('common.minutesAgo', { count: diffMin })
      const diffHour = Math.round(diffMin / 60)
      if (diffHour < 24) return t('common.hoursAgo', { count: diffHour })
      const diffDay = Math.round(diffHour / 24)
      if (diffDay < 7) return t('common.daysAgo', { count: diffDay })
      return d.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')
    } catch {
      return ''
    }
  }

  return (
    <>
      <Card hover={false} id={`group-post-${post.id}`} onClick={handleCardClick} className={cn('rounded-3xl border border-border p-5 shadow-card dark:bg-surface', !detailMode && 'cursor-pointer')}>
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
                  className="text-sm font-extrabold text-text hover:underline"
                >
                  {post.author.fullName}
                </Link>

                {post.author.groupRole === 'OWNER' && (
                  <Badge tone="gold" icon={<Crown size={11} />} className="px-1.5 py-0.5 text-xs">
                    {t('groups.ownerRole')}
                  </Badge>
                )}

                {post.author.groupRole === 'ADMIN' && (
                  <Badge tone="brand" icon={<ShieldCheck size={11} />} className="px-1.5 py-0.5 text-xs">
                    {t('groups.adminRole')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-text-subtle">
                {detailMode ? (
                  <span>{formatTime(post.createdAt)}</span>
                ) : (
                  <Link to={`/app/groups/${groupId}/posts/${post.id}`} className="hover:underline" title={t('groups.viewPostDetails')}>
                    {formatTime(post.createdAt)}
                  </Link>
                )}
                {post.updatedAt && new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 10000 && (
                  <span>• {t('common.edited')}</span>
                )}
                {post.isPinned && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 font-bold text-warning">
                      <Pin size={11} /> {t('groups.pinned')}
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
                aria-label={t('groups.postOptions')}
                aria-expanded={menuOpen}
                className="grid h-8 w-8 place-items-center rounded-full text-text-subtle transition-colors hover:bg-surface-2 hover:text-text"
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && <div data-interactive className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="post-menu"
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -4, transition: TRANSITION.exit }}
                    transition={TRANSITION.pop}
                    className="absolute right-0 top-9 z-30 min-w-[170px] origin-top-right overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-xl"
                  >
                    {post.canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setEditingPost(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-text-muted transition-colors hover:bg-surface-2"
                      >
                        <Pencil size={14} /> {t('groups.editPost')}
                      </button>
                    )}
                    {post.canPin && (
                      <button
                        type="button"
                        onClick={handleTogglePin}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-text-muted transition-colors hover:bg-surface-2"
                      >
                        <Pin size={14} className={post.isPinned ? 'text-warning' : ''} />
                        <span>{post.isPinned ? t('groups.unpinPost') : t('groups.pinPost')}</span>
                      </button>
                    )}

                    {post.canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false)
                          setConfirmDelete(true)
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-danger transition-colors hover:bg-danger-soft"
                      >
                        <Trash2 size={14} />
                        <span>{t('groups.deletePost')}</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {post.topic && (
          <span className="mt-3 inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-solid">
            #{post.topic}
          </span>
        )}

        {/* Nội dung bài viết */}
        <p className="mt-3.5 whitespace-pre-line text-sm leading-relaxed text-text">
          {post.content}
        </p>

        {/* Ảnh đính kèm: băng chuyền có nút Trước/Sau, kéo/vuốt để chuyển ảnh, bấm ảnh để xem phóng to (giống bài viết thường) */}
        {post.imageUrls && post.imageUrls.length > 0 && (
          <div data-interactive className="mt-3.5 overflow-hidden rounded-2xl border border-border">
            <ImageCarousel
              images={post.imageUrls}
              height={detailMode ? 520 : 420}
              altPrefix={t('groups.postImageAltPrefix')}
              onImageClick={(_url, index) => setPreviewIndex(index)}
            />
          </div>
        )}

        {(post.videoUrls ?? []).length > 0 && (
          <div data-interactive className="mt-3.5 grid gap-2 sm:grid-cols-2">
            {post.videoUrls.map((url, index) => (
              <video key={`${url}-${index}`} src={url} controls preload="metadata"
                aria-label={t('groups.attachedVideoAria', { index: index + 1 })}
                className="max-h-[460px] w-full rounded-2xl bg-black" />
            ))}
          </div>
        )}

        {/* Thanh tương tác: Like, Bình luận, Chia sẻ */}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs font-bold text-text-subtle">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={!isGroupActive || likeMutation.isPending}
              aria-pressed={post.likedByViewer}
              className={cn(
                'inline-flex items-center gap-1.5 transition-colors',
                post.likedByViewer
                  ? 'text-danger font-extrabold'
                  : 'hover:text-danger',
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
                  <Heart size={16} className={cn(post.likedByViewer && 'fill-danger text-danger')} />
                </motion.span>
              </AnimatePresence>
              <span>{t('groups.likesCount', { count: post.likeCount })}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments(!showComments)}
              className="inline-flex items-center gap-1.5 hover:text-primary-solid"
            >
              <MessageCircle size={16} />
              <span>{t('groups.commentsCount', { count: post.commentCount })}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 hover:text-info"
            >
              <Repeat size={16} />
              <span>{t('groups.share')}</span>
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
              data-interactive
              className="-mx-1 overflow-hidden px-1"
            >
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {/* Input gửi bình luận mới (chỉ thành viên) */}
                {isActiveMember && isGroupActive ? (
                  <form onSubmit={handleSendComment} className="flex items-center gap-3">
                    <Avatar
                      src={currentUser?.avatarUrl ?? ''}
                      name={currentUser?.name ?? t('groups.memberAvatar')}
                      size={36}
                      className="shrink-0"
                    />
                    <div className="relative flex-1">
                      <input
                        aria-label={t('groups.commentInputPlaceholder')}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        maxLength={1000}
                        placeholder={t('groups.commentInputPlaceholder')}
                        className="w-full rounded-full border border-border bg-surface-2/60 py-2.5 pl-4 pr-11 text-sm text-text shadow-2xs transition placeholder:text-text-subtle focus:border-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 dark:placeholder:text-text-subtle"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || createCommentMutation.isPending}
                        aria-label={t('groups.sendCommentAria')}
                        className={cn(
                          'absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full transition-all',
                          commentText.trim()
                            ? 'bg-primary-solid text-on-primary shadow-2xs hover:bg-primary-hover'
                            : 'text-text-subtle opacity-45 disabled:cursor-not-allowed'
                        )}
                      >
                        {createCommentMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="text-center text-xs text-text-subtle dark:text-text-subtle">
                    {isGroupActive ? t('groups.mustJoinToCommentMsg') : t('groups.groupPausedCommentsMsg')}
                  </p>
                )}

                {/* Danh sách bình luận */}
                {commentsLoading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 size={18} className="animate-spin text-primary-solid" />
                  </div>
                ) : loadedComments.length > 0 ? (
                  <div className="space-y-4 pt-1">
                    {roots.map((root: GroupComment) => {
                      const replies = loadedComments.filter((comment) => comment.parentId === root.id)
                      const threadAuthors = Array.from(
                        new Set([root.author.fullName, ...replies.map((r) => r.author.fullName)])
                      ).sort((a, b) => b.length - a.length)
                      const activeReplyTarget =
                        replyingTo !== null
                          ? root.id === replyingTo
                            ? root
                            : replies.find((r) => r.id === replyingTo)
                          : undefined
                      const hasThread = replies.length > 0 || !!activeReplyTarget

                      const renderGroupCommentItem = (
                        c: GroupComment,
                        isReplyItem: boolean,
                        showSpine?: boolean,
                        parentAuthorName?: string
                      ) => {
                        const isEdited =
                          c.updatedAt &&
                          new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime() > 10000
                        const canReplyHere = isActiveMember && isGroupActive && editingCommentId !== c.id
                        const canEditHere = isGroupActive && c.canEdit && editingCommentId !== c.id
                        const canDeleteHere = isGroupActive && c.canDelete && editingCommentId !== c.id

                        let displayMention = parentAuthorName
                        let displayContent = c.content?.trim() ?? ''
                        if (isReplyItem && displayContent) {
                          for (const candidate of threadAuthors) {
                            const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                            const prefixRegex = new RegExp(`^(@${escaped}(?:\\s+|$))+`, 'i')
                            if (prefixRegex.test(displayContent)) {
                              displayMention = candidate
                              displayContent = displayContent.replace(prefixRegex, '').trim()
                              break
                            }
                          }
                          if (displayMention) {
                            const escaped = displayMention.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                            displayContent = displayContent.replace(new RegExp(`^(@${escaped}\\s*)+`, 'i'), '').trim()
                          }
                        }

                        return (
                          <div className="group flex items-start gap-3">
                            <div className="flex shrink-0 flex-col items-center self-stretch">
                              <Link
                                to={`/app/profile?userId=${c.author.userId}`}
                                className="mt-0.5 flex shrink-0 rounded-full transition-opacity hover:opacity-85"
                              >
                                <Avatar
                                  src={c.author.avatarUrl}
                                  name={c.author.fullName}
                                  size={isReplyItem ? 30 : 36}
                                  className="shrink-0"
                                />
                              </Link>
                              {!isReplyItem && showSpine && (
                                <div className="mt-1.5 w-0.5 flex-1 rounded-full bg-border-strong/80 dark:bg-border-strong" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="rounded-2xl border border-border bg-surface-2/65 px-4 py-2.5 shadow-2xs transition-colors dark:border-border dark:bg-surface-2/80">
                                <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                  <Link
                                    to={`/app/profile?userId=${c.author.userId}`}
                                    className="text-[13.5px] font-bold leading-5 text-text transition-colors hover:text-primary-solid hover:underline"
                                  >
                                    {c.author.fullName}
                                  </Link>

                                  {c.author.groupRole === 'OWNER' && (
                                    <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-[11px] font-semibold leading-none text-warning">
                                      {t('groups.ownerRole')}
                                    </span>
                                  )}
                                  {c.author.groupRole === 'ADMIN' && (
                                    <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-solid">
                                      {t('groups.adminRole')}
                                    </span>
                                  )}

                                  <span className="shrink-0 text-xs font-medium text-text-subtle">
                                    · {formatTime(c.createdAt)}
                                  </span>
                                  {isEdited && (
                                    <span className="text-xs text-text-subtle">· {t('common.edited')}</span>
                                  )}
                                </div>

                                {editingCommentId === c.id ? (
                                  <form
                                    onSubmit={(event) => {
                                      event.preventDefault()
                                      saveCommentEdit(c.id)
                                    }}
                                    className="mt-2.5 space-y-2"
                                  >
                                    <textarea
                                      value={editingCommentText}
                                      onChange={(event) => setEditingCommentText(event.target.value)}
                                      maxLength={1000}
                                      rows={3}
                                      autoFocus
                                      className="w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingCommentId(null)}
                                        disabled={updateCommentMutation.isPending}
                                        className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:bg-surface-2"
                                      >
                                        {t('common.cancel')}
                                      </button>
                                      <button
                                        type="submit"
                                        disabled={!editingCommentText.trim() || updateCommentMutation.isPending}
                                        className="cursor-pointer rounded-xl bg-primary-solid px-3.5 py-1.5 text-xs font-semibold text-on-primary shadow-2xs transition hover:bg-primary-hover disabled:opacity-50"
                                      >
                                        {updateCommentMutation.isPending ? t('common.processing') : t('common.saveChanges')}
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <div className="mt-1 text-[13.5px] sm:text-sm leading-relaxed text-text">
                                    {displayMention && (
                                      <span className="mr-1.5 font-semibold text-primary-solid">
                                        @{displayMention}
                                      </span>
                                    )}
                                    <span className="whitespace-pre-wrap break-words">{displayContent || c.content}</span>
                                  </div>
                                )}
                              </div>

                              {(canReplyHere || canEditHere || canDeleteHere) && (
                                <div className="mt-1 flex items-center gap-3 pl-2 text-xs">
                                  {canReplyHere && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(c.id)
                                        setReplyText('')
                                      }}
                                      className="cursor-pointer font-semibold text-text-muted transition-colors hover:text-primary-solid"
                                    >
                                      {t('groups.reply')}
                                    </button>
                                  )}
                                  {canEditHere && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingCommentId(c.id)
                                        setEditingCommentText(c.content)
                                      }}
                                      aria-label={t('groups.editCommentAria')}
                                      className="inline-flex cursor-pointer items-center gap-1 font-medium text-text-subtle transition-colors hover:text-primary-solid"
                                    >
                                      <Pencil size={11} />
                                      <span>{t('common.edit')}</span>
                                    </button>
                                  )}
                                  {canDeleteHere && (
                                    <button
                                      type="button"
                                      onClick={() => setDeletingCommentId(c.id)}
                                      aria-label={t('groups.deleteCommentAria')}
                                      className="inline-flex cursor-pointer items-center gap-1 font-medium text-text-subtle transition-colors hover:text-danger"
                                    >
                                      <Trash2 size={11} />
                                      <span>{t('common.delete')}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={root.id}>
                          {renderGroupCommentItem(root, false, hasThread)}

                          {hasThread && (
                            <div className="ml-[17px]">
                              {replies.map((reply, idx) => {
                                const isLast = idx === replies.length - 1 && !activeReplyTarget
                                return (
                                  <div key={reply.id} className="relative pl-6 pt-2.5">
                                    {!isLast && (
                                      <span
                                        aria-hidden
                                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-border-strong/80 dark:bg-border-strong"
                                      />
                                    )}
                                    <span
                                      aria-hidden
                                      className="absolute left-0 top-0 h-[27px] w-4 rounded-bl-xl border-b-2 border-l-2 border-border-strong/80 dark:border-border-strong"
                                    />
                                    {renderGroupCommentItem(reply, true, false, root.author.fullName)}
                                  </div>
                                )
                              })}

                              {activeReplyTarget && (
                                <div className="relative pl-6 pt-2.5">
                                  <span
                                    aria-hidden
                                    className="absolute left-0 top-0 h-[27px] w-4 rounded-bl-xl border-b-2 border-l-2 border-border-strong/80 dark:border-border-strong"
                                  />
                                  <form
                                    onSubmit={(event) => handleSendReply(event, activeReplyTarget.id)}
                                    className="flex items-start gap-3"
                                  >
                                    <Avatar
                                      src={currentUser?.avatarUrl ?? ''}
                                      name={currentUser?.name ?? t('groups.memberAvatar')}
                                      size={30}
                                      className="mt-0.5 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1 space-y-2 rounded-2xl border border-border bg-surface-2/65 p-3.5 shadow-2xs dark:border-border dark:bg-surface-2/80">
                                      <div className="flex items-center justify-between text-xs text-text-subtle">
                                        <span className="font-medium text-text-muted">
                                          {t('groups.replyTo', { name: activeReplyTarget.author.fullName })}
                                        </span>
                                        <button
                                          type="button"
                                          aria-label={t('common.close')}
                                          onClick={() => setReplyingTo(null)}
                                          className="cursor-pointer rounded-md p-0.5 hover:bg-surface-2 hover:text-text"
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                      <textarea
                                        value={replyText}
                                        onChange={(event) => setReplyText(event.target.value)}
                                        maxLength={1000}
                                        rows={2}
                                        autoFocus
                                        className="w-full rounded-xl border border-border bg-surface p-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                      />
                                      <div className="flex justify-end gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setReplyingTo(null)}
                                          className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:bg-surface-2"
                                        >
                                          {t('common.cancel')}
                                        </button>
                                        <button
                                          type="submit"
                                          disabled={!replyText.trim() || createCommentMutation.isPending}
                                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-primary-solid px-3.5 py-1.5 text-xs font-semibold text-on-primary shadow-2xs transition hover:bg-primary-hover disabled:opacity-50"
                                        >
                                          {createCommentMutation.isPending ? (
                                            <Loader2 size={13} className="animate-spin" />
                                          ) : (
                                            <Send size={13} />
                                          )}
                                          <span>{t('groups.sendReply')}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </form>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {hasMoreComments && (
                      <button type="button" onClick={() => fetchMoreComments()} disabled={isFetchingNextPage}
                        className="block w-full py-2 text-center text-xs font-semibold text-primary-solid hover:underline">
                        {isFetchingNextPage ? t('common.loading') : t('groups.loadMoreComments')}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="py-2 text-center text-xs text-text-subtle dark:text-text-subtle">
                    {t('groups.noCommentsYet')}
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
        title={t('groups.deletePostModalTitle')}
        message={t('groups.deletePostModalMsg')}
        confirmLabel={t('groups.deletePost')}
        danger
        loading={deleteMutation.isPending}
        onConfirm={handleDeletePost}
        onClose={() => setConfirmDelete(false)}
      />

      <ConfirmDialog
        open={deletingCommentId !== null}
        title={t('groups.deleteCommentModalTitle')}
        message={t('groups.deleteCommentModalMsg')}
        confirmLabel={t('groups.deleteComment')}
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
        isOpen={previewIndex !== null}
        onClose={() => setPreviewIndex(null)}
        src={previewIndex !== null ? (post.imageUrls[previewIndex] ?? '') : ''}
        onPrev={imageCount > 1 ? () => setPreviewIndex((i) => ((i ?? 0) - 1 + imageCount) % imageCount) : undefined}
        onNext={imageCount > 1 ? () => setPreviewIndex((i) => ((i ?? 0) + 1) % imageCount) : undefined}
        counter={imageCount > 1 && previewIndex !== null ? `${previewIndex + 1} / ${imageCount}` : undefined}
        alt={t('groups.postImageAlt')}
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
            subtitle: post.content || t('groups.postInGroup'),
            thumbnail: post.imageUrls?.[0] ?? null,
            avatarUrl: post.author.avatarUrl,
            url: `${window.location.origin}/app/groups/${groupId}?postId=${post.id}`,
            typeLabel: t('groups.groupPostNoun'),
          }}
        />
      )}
    </>
  )
}
