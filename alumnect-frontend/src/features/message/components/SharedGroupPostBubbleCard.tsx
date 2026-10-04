import { useState, useEffect } from 'react'
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

  // Trường hợp bài viết trong nhóm riêng tư mà người xem chưa là thành viên
  if (isForbidden) {
    return (
      <div
        className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-2xl border text-left p-4 transition-all shadow-xs ${
          isMe
            ? 'border-brand-400/40 bg-white/95 text-plum-900 dark:border-brand-500/30 dark:bg-[#242526] dark:text-[#f0f2f5]'
            : 'border-plum-900/10 bg-slate-50/90 text-plum-900 dark:border-[#3a3b3c] dark:bg-[#242526] dark:text-[#f0f2f5]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Lock size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
              Bài viết trong nhóm riêng tư
            </h5>
            <p className="mt-1 text-[11px] leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
              Nội dung này thuộc nhóm riêng tư. Chỉ thành viên được duyệt mới có quyền xem bài viết.
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-plum-900/5 pt-2.5 dark:border-white/10">
          <Link
            to={`/app/groups/${groupId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-50 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-100 dark:bg-brand-950/60 dark:text-brand-300 dark:hover:bg-brand-900/50"
          >
            <Users size={13} />
            <span>Đi tới hội nhóm</span>
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
        className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-2xl border text-left p-4 transition-all shadow-xs ${
          isMe
            ? 'border-brand-400/40 bg-white/95 text-plum-900 dark:border-brand-500/30 dark:bg-[#242526] dark:text-[#f0f2f5]'
            : 'border-plum-900/10 bg-slate-50/90 text-plum-900 dark:border-[#3a3b3c] dark:bg-[#242526] dark:text-[#f0f2f5]'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-500/10 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5]">
              Nội dung không khả dụng
            </h5>
            <p className="mt-1 text-[11px] leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
              Bài viết này có thể đã bị xóa hoặc không còn khả dụng trên hệ thống.
            </p>
          </div>
        </div>

        <div className="mt-3 border-t border-plum-900/5 pt-2.5 dark:border-white/10">
          <Link
            to={`/app/groups/${groupId}`}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-[#f0f2f5] dark:hover:bg-white/15"
          >
            <Users size={13} />
            <span>Xem hội nhóm</span>
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
          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          <span>Xem bài viết nhóm #{postId}</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    )
  }

  const thumbnail = (post.imageUrls && post.imageUrls.length > 0) ? post.imageUrls[0] : null

  return (
    <Link
      to={`/app/groups/${groupId}/posts/${postId}`}
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
            alt="Group post preview"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {post.topic && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
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
              <p className="truncate text-xs font-semibold leading-tight text-plum-900 dark:text-[#f0f2f5]">
                {post.author.fullName}
              </p>
              <p className="truncate text-[10px] text-plum-500 dark:text-[#b0b3b8]">
                {(post.author as any).headline || 'Bài viết hội nhóm'}
              </p>
            </div>
          </div>
          {!thumbnail && post.topic && (
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
              #{post.topic}
            </span>
          )}
        </div>

        {/* Nội dung tóm tắt bài viết */}
        {post.content && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-plum-700 dark:text-[#e4e6eb]">
            {post.content}
          </p>
        )}

        {/* Footer xem bài viết */}
        <div className="mt-2.5 flex items-center justify-between border-t border-plum-900/5 pt-2 text-[11px] font-medium text-brand-600 dark:border-white/10 dark:text-brand-400">
          <span className="inline-flex items-center gap-1">
            <FileText size={12} />
            Xem bài viết nhóm
          </span>
          <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
