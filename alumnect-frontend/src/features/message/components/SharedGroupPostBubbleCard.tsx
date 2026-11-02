import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ExternalLink, FileText, Tag, Lock, Users, AlertCircle } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { groupApi } from '@/features/group/api/groupApi'
import type { GroupPost } from '@/features/group/model/group'

interface SharedGroupPostBubbleCardProps {
  groupId: string | number
  postId: string | number
  isMe?: boolean
}

// In-memory cache để tránh fetch lặp lại
const groupPostCache = new Map<string, GroupPost>()

export function SharedGroupPostBubbleCard({ groupId, postId, isMe }: SharedGroupPostBubbleCardProps) {
  const { t } = useTranslation()
  const cacheKey = `${groupId}_${postId}`
  const [post, setPost] = useState<GroupPost | null>(() => groupPostCache.get(cacheKey) || null)
  const [loading, setLoading] = useState(!groupPostCache.has(cacheKey))
  const [isForbidden, setIsForbidden] = useState(false)
  const [isNotFound, setIsNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (groupPostCache.has(cacheKey)) {
      setPost(groupPostCache.get(cacheKey)!)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    groupApi
      .getPostDetail(Number(groupId), Number(postId))
      .then((data) => {
        if (!isMounted) return
        groupPostCache.set(cacheKey, data)
        setPost(data)
        setLoading(false)
      })
      .catch((err: any) => {
        if (!isMounted) return
        const status = err?.response?.status || err?.status
        if (status === 403 || status === 401) {
          setIsForbidden(true)
        } else if (status === 404) {
          setIsNotFound(true)
        }
        setError(true)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [cacheKey, groupId, postId])

  if (loading) {
    return (
      <div className="mt-2 w-64 sm:w-72 animate-pulse rounded-xl border border-border bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-300 dark:bg-slate-700" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3 w-24 rounded bg-slate-300 dark:bg-slate-700" />
            <div className="h-2 w-16 rounded bg-slate-300 dark:bg-slate-700" />
          </div>
        </div>
        <div className="mt-2.5 space-y-1">
          <div className="h-2.5 w-full rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2.5 w-3/4 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
    )
  }

  // Trường hợp bài viết trong nhóm riêng tư mà người xem chưa là thành viên
  if (isForbidden) {
    return (
      <div
        className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-2xl border text-left p-4 transition shadow-xs ${
          isMe
            ? 'border-brand-400/40 bg-surface text-text dark:border-brand-500/30'
            : 'border-border bg-slate-50/90 text-text dark:bg-surface'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
            <Lock size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-text">
              {t('messages.privateGroupPost', 'Bài viết trong nhóm riêng tư')}
            </h5>
            <p className="mt-1 text-xs leading-relaxed text-text-subtle">
              {t('messages.privateGroupPostDesc', 'Nội dung này thuộc nhóm riêng tư. Chỉ thành viên được duyệt mới có quyền xem bài viết.')}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-2.5">
          <Link
            to={`/app/groups/${groupId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-soft py-1.5 text-xs font-semibold text-primary-solid transition-colors hover:bg-primary-soft"
          >
            <Users size={13} />
            <span>{t('messages.goToGroup', 'Đi tới hội nhóm')}</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    )
  }

  // Trường hợp bài viết đã bị xóa / không tìm thấy
  if (isNotFound) {
    return (
      <div
        className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-2xl border text-left p-4 transition shadow-xs ${
          isMe
            ? 'border-brand-400/40 bg-surface text-text dark:border-brand-500/30'
            : 'border-border bg-slate-50/90 text-text dark:bg-surface'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-500/10 text-text-subtle dark:bg-slate-500/20">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-text">
              {t('messages.contentUnavailable', 'Nội dung không khả dụng')}
            </h5>
            <p className="mt-1 text-xs leading-relaxed text-text-subtle">
              {t('messages.contentUnavailableDesc', 'Bài viết này có thể đã bị xóa hoặc không còn khả dụng trên hệ thống.')}
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-2.5">
          <Link
            to={`/app/groups/${groupId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:bg-surface-3"
          >
            <Users size={13} />
            <span>{t('messages.viewGroup', 'Xem hội nhóm')}</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="mt-1">
        <Link
          to={`/app/groups/${groupId}/posts/${postId}`}
          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-primary-solid hover:text-primary-solid"
        >
          <span>{t('messages.viewGroupPostWithId', { id: postId, defaultValue: `Xem bài viết nhóm #${postId}` })}</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    )
  }

  const thumbnail = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : null

  return (
    <Link
      to={`/app/groups/${groupId}/posts/${postId}`}
      className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-xl border text-left transition ${
        isMe
          ? 'border-brand-400/40 bg-surface text-text shadow-2xs hover:bg-surface dark:border-brand-500/30'
          : 'border-border bg-surface-2 text-text hover:bg-surface'
      }`}
    >
      {/* Thumbnail nếu bài viết có hình */}
      {thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-surface-3">
          <img
            src={thumbnail}
            alt="Group post preview"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {post.topic && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-xs">
                <Tag size={10} />
                {post.topic}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        {/* Tác giả bài viết */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={post.author.avatarUrl || undefined} name={post.author.fullName} size={24} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold leading-tight text-text">
                {post.author.fullName}
              </p>
              <p className="truncate text-xs text-text-subtle">
                {post.author.headline || t('messages.groupPostFallback', 'Bài viết hội nhóm')}
              </p>
            </div>
          </div>
          {!thumbnail && post.topic && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-xs font-semibold text-primary-solid">
              #{post.topic}
            </span>
          )}
        </div>

        {/* Nội dung tóm tắt bài viết */}
        {post.content && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
            {post.content}
          </p>
        )}

        {/* Footer xem bài viết */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-xs font-medium text-primary-solid">
          <span className="inline-flex items-center gap-1">
            <FileText size={12} />
            {t('messages.viewGroupPost', 'Xem bài viết nhóm')}
          </span>
          <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
