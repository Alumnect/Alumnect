import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ExternalLink, Calendar, Briefcase, Award, FileText } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { postApi } from '@/features/post/api/postApi'
import type { Post } from '@/features/feed'

interface SharedPostBubbleCardProps {
  postId: string
  isMe?: boolean
}

// In-memory cache để tránh fetch lặp lại nhiều lần cho cùng 1 postId trong phiên chat
const postCache = new Map<string, Post>()

export function SharedPostBubbleCard({ postId, isMe }: SharedPostBubbleCardProps) {
  const { t } = useTranslation()
  const [post, setPost] = useState<Post | null>(() => postCache.get(postId) || null)
  const [loading, setLoading] = useState(!postCache.has(postId))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (postCache.has(postId)) {
      setPost(postCache.get(postId)!)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    postApi
      .getPostDetail(postId)
      .then((data) => {
        if (!isMounted) return
        postCache.set(postId, data)
        setPost(data)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Không thể tải thông tin bài viết chia sẻ:', err)
        if (!isMounted) return
        setError(true)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [postId])

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

  if (error || !post) {
    return (
      <div className="mt-1">
        <Link
          to={`/app/posts/${postId}`}
          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-primary-solid hover:text-primary-solid"
        >
          <span>{t('messages.viewPostWithId', { id: postId, defaultValue: `Xem bài viết #${postId}` })}</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    )
  }

  const thumbnail = post.image || (post.images && post.images.length > 0 ? post.images[0] : null)

  const renderBadge = () => {
    if (post.type === 'event' || post.event) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <Calendar size={10} />
          {t('feed.event', 'Sự kiện')}
        </span>
      )
    }
    if (post.type === 'recruitment' || post.job) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-success-soft px-1.5 py-0.5 text-xs font-semibold text-success">
          <Briefcase size={10} />
          {t('feed.recruitment', 'Tuyển dụng')}
        </span>
      )
    }
    if (post.type === 'achievement') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-semibold text-warning">
          <Award size={10} />
          {t('feed.achievement', 'Thành tích')}
        </span>
      )
    }
    return null
  }

  return (
    <Link
      to={`/app/posts/${postId}`}
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
            alt="Post preview"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">{renderBadge()}</div>
        </div>
      )}

      <div className="p-3">
        {/* Tác giả bài viết */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar src={post.avatar || undefined} name={post.author} size={24} />
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold leading-tight text-text">
                {post.author}
              </p>
              {post.role && (
                <p className="truncate text-xs text-text-subtle">{post.role}</p>
              )}
            </div>
          </div>
          {!thumbnail && renderBadge()}
        </div>

        {/* Nội dung tóm tắt bài viết */}
        {post.text && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">
            {post.text}
          </p>
        )}

        {/* Thông tin sự kiện / việc làm nếu có */}
        {post.event && (
          <div className="mt-2 rounded-lg bg-purple-50 p-2 text-xs text-purple-900 dark:bg-purple-950/40 dark:text-purple-200">
            <p className="font-semibold truncate">{post.event.title}</p>
            {post.event.location && (
              <p className="text-xs text-purple-700 dark:text-purple-300 truncate mt-0.5">
                {post.event.location}
              </p>
            )}
          </div>
        )}

        {post.job && (
          <div className="mt-2 rounded-lg bg-success-soft p-2 text-xs text-success">
            <p className="font-semibold truncate">{post.job.title}</p>
            {post.job.company && (
              <p className="text-xs text-success truncate mt-0.5">
                {post.job.company}
              </p>
            )}
          </div>
        )}

        {/* Footer xem bài viết */}
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2 text-xs font-medium text-primary-solid">
          <span className="inline-flex items-center gap-1">
            <FileText size={12} />
            {t('messages.viewPost', 'Xem bài viết')}
          </span>
          <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
