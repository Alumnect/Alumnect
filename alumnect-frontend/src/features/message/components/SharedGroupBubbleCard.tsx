import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Users, Globe, Lock } from 'lucide-react'
import { groupApi } from '@/features/group/api/groupApi'
import { type GroupDetail, categoryLabel } from '@/features/group/model/group'

interface SharedGroupBubbleCardProps {
  groupId: string | number
  isMe?: boolean
}

// In-memory cache để tránh gọi lặp lại cho cùng 1 groupId trong phiên chat
const groupCache = new Map<string, GroupDetail>()

export function SharedGroupBubbleCard({ groupId, isMe }: SharedGroupBubbleCardProps) {
  const idStr = String(groupId)
  const [group, setGroup] = useState<GroupDetail | null>(() => groupCache.get(idStr) || null)
  const [loading, setLoading] = useState(!groupCache.has(idStr))
  const [error, setError] = useState(false)

  useEffect(() => {
    if (groupCache.has(idStr)) {
      setGroup(groupCache.get(idStr)!)
      setLoading(false)
      return
    }

    let isMounted = true
    setLoading(true)
    groupApi
      .getById(idStr)
      .then((data) => {
        if (!isMounted) return
        groupCache.set(idStr, data)
        setGroup(data)
        setLoading(false)
      })
      .catch((err) => {
        console.warn('Không thể tải thông tin hội nhóm chia sẻ:', err)
        if (!isMounted) return
        setError(true)
        setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [idStr])

  if (loading) {
    return (
      <div className="mt-2 w-64 sm:w-72 animate-pulse rounded-xl border border-plum-900/10 bg-plum-900/5 p-3 dark:border-white/10 dark:bg-white/5">
        <div className="h-28 w-full rounded-lg bg-slate-300 dark:bg-slate-700" />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-3 w-36 rounded bg-slate-300 dark:bg-slate-700" />
          <div className="h-2 w-20 rounded bg-slate-300 dark:bg-slate-700" />
        </div>
      </div>
    )
  }

  if (error || !group) {
    return (
      <div className="mt-1">
        <Link
          to={`/app/groups/${groupId}`}
          className="inline-flex items-center gap-1.5 text-xs underline font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
        >
          <span>Xem hội nhóm #{groupId}</span>
          <ExternalLink size={12} />
        </Link>
      </div>
    )
  }

  return (
    <Link
      to={`/app/groups/${groupId}`}
      className={`group mt-2 block w-full max-w-[300px] sm:max-w-xs overflow-hidden rounded-xl border text-left transition-all hover:shadow-md ${
        isMe
          ? 'border-brand-400/40 bg-white/95 text-plum-900 shadow-2xs hover:bg-white dark:border-brand-500/30 dark:bg-[#242526] dark:text-[#f0f2f5]'
          : 'border-plum-900/10 bg-slate-50/80 text-plum-900 hover:bg-white dark:border-[#3a3b3c] dark:bg-[#242526] dark:text-[#f0f2f5]'
      }`}
    >
      {/* Ảnh bìa nhóm */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-200 dark:bg-slate-800">
        {group.coverImageUrl ? (
          <img
            src={group.coverImageUrl}
            alt={group.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-600 flex items-center justify-center text-white">
            <Users size={36} className="opacity-70" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-xs">
            {(group.privacy ?? (group as any).visibility) === 'PUBLIC' ? (
              <>
                <Globe size={10} />
                Công khai
              </>
            ) : (
              <>
                <Lock size={10} />
                Riêng tư
              </>
            )}
          </span>
        </div>
      </div>

      <div className="p-3">
        <h4 className="font-bold text-sm text-plum-900 truncate leading-snug dark:text-[#f0f2f5]">
          {group.name}
        </h4>

        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-plum-500 dark:text-[#b0b3b8]">
          <Users size={12} className="text-brand-500 shrink-0" />
          <span>{group.memberCount} thành viên</span>
          {group.category && (
            <>
              <span>•</span>
              <span className="truncate">{categoryLabel(group.category)}</span>
            </>
          )}
        </div>

        {(group.shortDescription || group.description) && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-plum-700 dark:text-[#e4e6eb]">
            {group.shortDescription || group.description}
          </p>
        )}

        <div className="mt-2.5 flex items-center justify-between border-t border-plum-900/5 pt-2 text-[11px] font-medium text-brand-600 dark:border-white/10 dark:text-brand-400">
          <span className="inline-flex items-center gap-1">
            <Users size={12} />
            Xem hội nhóm
          </span>
          <ExternalLink size={12} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  )
}
