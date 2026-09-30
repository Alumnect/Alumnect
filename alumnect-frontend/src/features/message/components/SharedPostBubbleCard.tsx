import { useState, useEffect } from 'react'
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
      <div className="mt-2 w-64 sm:w-72 animate-pulse rounded-xl border border-plum-900/10 bg-plum-900/5 p-3 dark:border-white/10 dark:bg-white/5">
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
          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          <span>Xem bài viết #{postId}</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    )
  }

  const thumbnail = post.image || (post.images && post.images.length > 0 ? post.images[0] : null)

  const renderBadge = () => {
    if (post.type === 'event' || post.event) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
          <Calendar size={10} />
          Sự kiện
        </span>
      )
    }
    if (post.type === 'recruitment' || post.job) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <Briefcase size={10} />
          Tuyển dụng
        </span>
      )
    }
    if (post.type === 'achievement') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
          <Award size={10} />
          Thành tích
        </span>
      )
    }
    return null
  }

  return (
    <Link
      to={`/app/posts/${postId}`}
      className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-xl border text-left transition-all hover:shadow-md ${
        isMe
          ? 'border-brand-400/40 bg-white/95 text-plum-900 shadow-2xs hover:bg-white dark:border-brand-500/30 dark:bg-[#242526] dark:text-[#f0f2f5]'
          : 'border-plum-900/10 bg-slate-50/80 text-plum-900 hover:bg-white dark:border-[#3a3b3c] dark:bg-[#242526] dark:text-[#f0f2f5]'
      }`}
    >
      {/* Thumbnail nếu bài viết có hình */}
      {thumbnail && (
        <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
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
              <p className="truncate text-xs font-semibold leading-tight text-plum-900 dark:text-[#f0f2f5]">
                {post.author}
              </p>
              {post.role && (
                <p className="truncate text-[10px] text-plum-500 dark:text-[#b0b3b8]">{post.role}</p>
              )}
            </div>
          </div>
          {!thumbnail && renderBadge()}
        </div>

        {/* Nội dung tóm tắt bài viết */}
        {post.text && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-plum-700 dark:text-[#e4e6eb]">
            {post.text}
          </p>
        )}

        {/* Thông tin sự kiện / việc làm nếu có */}
        {post.event && (
          <div className="mt-2 rounded-lg bg-purple-50 p-2 text-[11px] text-purple-900 dark:bg-purple-950/40 dark:text-purple-200">
            <p className="font-semibold truncate">{post.event.title}</p>
            {post.event.location && (
              <p className="text-[10px] text-purple-700 dark:text-purple-300 truncate mt-0.5">
                {post.event.location}
              </p>
            )}
          </div>
        )}

        {post.job && (
          <div className="mt-2 rounded-lg bg-emerald-50 p-2 text-[11px] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <p className="font-semibold truncate">{post.job.title}</p>
            {post.job.company && (
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate mt-0.5">
                {post.job.company}
              </p>
            )}
          </div>
        )}

        {/* Footer xem bài viết */}
        <div className="mt-2.5 flex items-center justify-between border-t border-plum-900/5 pt-2 text-[11px] font-medium text-brand-600 dark:border-white/10 dark:text-brand-400">
          <span className="inline-flex items-center gap-1">
            <FileText size={12} />
            Xem bài viết
          </span>
          <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
