import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
      openLoginPrompt(t('auth.loginPromptNotice') || 'Vui lòng đăng nhập để theo dõi và kết nối với thành viên này.')
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

  const subtitle = user.mutualFollowsCount && user.mutualFollowsCount > 0
    ? t('feed.mutualFriends', { count: user.mutualFollowsCount })
    : user.cohort
    ? `K${user.cohort}${user.major?.code ? ` • ${user.major.code}` : ''}`
    : user.major?.code || (user.role === 'ALUMNI' ? t('common.alumni') : t('common.student'))

  return (
    <li className="flex items-center gap-3">
      <Link
        to={`/app/profile?userId=${user.userId}`}
        className="shrink-0 transition-transform duration-200 hover:scale-105"
        title={t('feed.viewProfile', { name: user.fullName })}
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
          className="line-clamp-2 break-words text-sm font-bold leading-tight text-text hover:underline"
          title={user.fullName}
        >
          {user.fullName}
        </Link>
        <p className="truncate text-xs text-text-subtle">
          {subtitle}
        </p>
      </div>

      <Button
        size="sm"
        variant={isFollowing ? 'secondary' : 'secondary'}
        className={cn(
          'h-8 shrink-0 px-3 text-xs font-semibold',
          isFollowing
            ? 'bg-border text-text-subtle hover:bg-surface-3'
            : 'border border-border text-text-muted hover:bg-surface-2 hover:text-text',
        )}
        disabled={isPending}
        onClick={handleFollowToggle}
      >
        {isPending ? (
          <Loader2 size={13} className="animate-spin" />
        ) : isFollowing ? (
          t('profile.following')
        ) : (
          t('profile.follow')
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
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: suggestions = [], isLoading, isError } = useConnectionSuggestions(limit, {
    enabled: isAuthenticated,
  })

  // Người dùng chưa đăng nhập thì không hiển thị widget gợi ý kết nối cá nhân
  if (!isAuthenticated) {
    return null
  }

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

  const displayedSuggestions = currentUserId
    ? suggestions.filter((s) => Number(s.userId) !== Number(currentUserId))
    : suggestions
  if (isError || displayedSuggestions.length === 0) {
    return null
  }

  return (
    <Card hover={false} className={cn('p-5', className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-text">{t('feed.suggestedConnections')}</h3>
        <Link
          to="/app/alumni"
          className="text-xs font-semibold text-primary-solid hover:text-primary-solid"
        >
          {t('common.viewAll')}
        </Link>
      </div>

      <ul className="space-y-4">
        {displayedSuggestions.map((user) => (
          <ConnectionSuggestionItem key={user.userId} user={user} />
        ))}
      </ul>
    </Card>
  )
}

