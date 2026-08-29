import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Avatar, Button, Card, Skeleton } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useConnectionSuggestions } from '../hooks/useUserQueries'
import { useFollowUser, useUnfollowUser } from '../hooks/useUserMutations'
import type { ConnectionSuggestionResponse } from '../model/userTypes'
import { cn } from '@/lib/utils'

interface ConnectionSuggestionItemProps {
  user: ConnectionSuggestionResponse
}

function ConnectionSuggestionItem({ user }: ConnectionSuggestionItemProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openLoginPrompt = useLoginPrompt((s) => s.open)

  const [isFollowing, setIsFollowing] = useState(user.isFollowing ?? false)
  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const isPending = followMutation.isPending || unfollowMutation.isPending

  const handleFollowToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      openLoginPrompt('Vui lòng đăng nhập để theo dõi và kết nối với thành viên này.')
      return
    }

    if (isFollowing) {
      setIsFollowing(false)
      unfollowMutation.mutate(user.userId, {
        onError: () => setIsFollowing(true),
      })
    } else {
      setIsFollowing(true)
      followMutation.mutate(user.userId, {
        onError: () => setIsFollowing(false),
      })
    }
  }

  return (
    <li className="flex items-center gap-3">
      <Link
        to={`/app/profile?userId=${user.userId}`}
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        title={`Xem hồ sơ của ${user.fullName}`}
      >
        <Avatar
          src={user.avatarUrl || undefined}
          name={user.fullName}
          size={40}
          verified={user.isAccountVerified}
        />
      </Link>
      
      <div className="min-w-0 flex-1">
        <Link
          to={`/app/profile?userId=${user.userId}`}
          className="block truncate text-sm font-bold text-plum-900 hover:underline"
          title={user.fullName}
        >
          {user.fullName}
        </Link>
        <p className="truncate text-xs text-plum-400">
          {user.cohort
            ? `Khóa K${user.cohort}${user.major?.code ? ` • ${user.major.code}` : ''}`
            : user.major?.code || (user.role === 'ALUMNI' ? 'Cựu sinh viên FPTU' : 'Sinh viên FPTU')}
        </p>

      </div>

      <Button
        size="sm"
        variant={isFollowing ? 'secondary' : 'secondary'}
        className={cn(
          'shrink-0 text-xs font-semibold',
          isFollowing
            ? 'bg-plum-900/[0.06] text-plum-500 hover:bg-plum-900/[0.08]'
            : 'border border-plum-900/10 text-plum-700 hover:bg-plum-900/[0.05] hover:text-plum-900',
        )}
        disabled={isPending}
        onClick={handleFollowToggle}
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isFollowing ? (
          'Đang theo dõi'
        ) : (
          'Theo dõi'
        )}
      </Button>
    </li>
  )
}

interface ConnectionSuggestionsWidgetProps {
  limit?: number
  className?: string
}

export function ConnectionSuggestionsWidget({ limit = 4, className }: ConnectionSuggestionsWidgetProps) {
  const { data: suggestions = [], isLoading, isError } = useConnectionSuggestions(limit)

  if (isLoading) {
    return (
      <Card hover={false} className={cn('p-5', className)}>
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (isError || suggestions.length === 0) {
    return null
  }

  return (
    <Card hover={false} className={cn('p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-plum-900">Gợi ý kết nối</h3>
        <Link
          to="/app/alumni"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Xem tất cả
        </Link>
      </div>

      <ul className="space-y-4">
        {suggestions.map((user) => (
          <ConnectionSuggestionItem key={user.userId} user={user} />
        ))}
      </ul>
    </Card>
  )
}

