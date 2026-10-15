import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, GraduationCap, MessageCircle, UserPlus, UserCheck, Loader2, Users } from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { TiltCard } from '@/components/motion'
import { compact, cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useFollowUser, useUnfollowUser } from '../hooks/useUserMutations'
import type { UserDirectoryResponse } from '../model/userTypes'

interface UserDirectoryCardProps {
  user: UserDirectoryResponse
}

export function UserDirectoryCard({ user }: UserDirectoryCardProps) {
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openLoginPrompt = useLoginPrompt((s) => s.open)

  const isOwn = currentUserId ? Number(currentUserId) === user.userId : false
  const [isFollowingLocal, setIsFollowingLocal] = useState(user.isFollowing ?? false)
  const [followersCountLocal, setFollowersCountLocal] = useState(user.followersCount ?? 0)

  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const isPending = followMutation.isPending || unfollowMutation.isPending

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      openLoginPrompt('Vui lòng đăng nhập để theo dõi và kết nối với thành viên này.')
      return
    }

    if (isFollowingLocal) {
      setIsFollowingLocal(false)
      setFollowersCountLocal((prev) => Math.max(0, prev - 1))
      unfollowMutation.mutate(user.userId, {
        onError: () => {
          setIsFollowingLocal(true)
          setFollowersCountLocal((prev) => prev + 1)
        },
      })
    } else {
      setIsFollowingLocal(true)
      setFollowersCountLocal((prev) => prev + 1)
      followMutation.mutate(user.userId, {
        onError: () => {
          setIsFollowingLocal(false)
          setFollowersCountLocal((prev) => Math.max(0, prev - 1))
        },
      })
    }
  }

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isAuthenticated) {
      openLoginPrompt('Vui lòng đăng nhập để gửi tin nhắn cho thành viên này.')
      return
    }
    navigate(`/app/messages?userId=${user.userId}`)
  }

  return (
    <TiltCard className="group h-full" max={5}>
      <Card hover={false} className="relative flex h-full flex-col justify-between p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 border border-border bg-surface/80 backdrop-blur-sm">
        <div>
          {/* Avatar Section */}
          <div className="mx-auto mt-2 mb-4 inline-block">
            <Link
              to={`/app/profile?userId=${user.userId}`}
              className="block transition-transform duration-300 group-hover:scale-105"
            >
              <Avatar
                src={user.avatarUrl || undefined}
                name={user.fullName}
                size={84}
                ring
                className="mx-auto"
              />
            </Link>
          </div>

          {/* Full Name & Headline */}
          <div>
            <Link
              to={`/app/profile?userId=${user.userId}`}
              className="text-base font-extrabold text-text transition-colors hover:text-primary-solid line-clamp-1"
            >
              {user.fullName}
            </Link>
            <p className="mt-1 text-xs text-text-subtle line-clamp-2 min-h-[34px] leading-relaxed">
              {user.headline || (user.role === 'ALUMNI' ? 'Cựu sinh viên FPT University' : 'Sinh viên FPT University')}
            </p>
          </div>

          {/* Major, Cohort & City Tags */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs">
            {user.major && (
              <span
                title={user.major.name}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 font-semibold text-primary-solid whitespace-nowrap border border-brand-200/50"
              >
                <GraduationCap size={13} className="shrink-0 text-primary-solid" />
                {user.major.code}
              </span>
            )}
            {user.cohort && (
              <span className="rounded-lg bg-surface-2 px-2.5 py-1 font-semibold text-text-muted whitespace-nowrap border border-border">
                Khóa K{user.cohort}
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-surface-2 px-2.5 py-1 text-text-muted whitespace-nowrap border border-border">
                <MapPin size={11} className="text-text-subtle" />
                {user.city}
              </span>
            )}
            {user.mutualFollowsCount && user.mutualFollowsCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success-soft px-2.5 py-1 font-semibold text-success whitespace-nowrap border border-success-border">
                <Users size={11} className="shrink-0 text-success" />
                {user.mutualFollowsCount} bạn chung
              </span>
            ) : null}
          </div>

          {/* Primary Experience / Company */}
          {user.primaryExperience && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-text-muted font-medium line-clamp-1 bg-surface-2 py-1 px-2 rounded-lg">
              <Briefcase size={12} className="shrink-0 text-text-subtle" />
              <span>
                {user.primaryExperience.title} tại <strong className="text-text">{user.primaryExperience.company}</strong>
              </span>
            </div>
          )}

          {/* Skills tags */}
          {user.skills && user.skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap justify-center gap-1">
              {user.skills.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-muted whitespace-nowrap"
                >
                  {s.skillName}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-semibold text-text-subtle">
                  +{user.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            {isOwn ? (
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs font-semibold"
                onClick={() => navigate('/app/profile')}
              >
                Hồ sơ của bạn
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isFollowingLocal ? 'secondary' : 'outline'}
                  className={cn(
                    'flex-1 text-xs font-semibold transition-all duration-200',
                    !isFollowingLocal && 'text-primary-solid border-primary-soft-border bg-primary-soft hover:bg-primary-solid hover:text-white shadow-xs'
                  )}
                  disabled={isPending}
                  leftIcon={
                    isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isFollowingLocal ? (
                      <UserCheck size={13} className="text-success" />
                    ) : (
                      <UserPlus size={13} />
                    )
                  }
                  onClick={handleToggleFollow}
                >
                  {isFollowingLocal ? 'Đang theo dõi' : 'Theo dõi'}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-border text-text-muted text-xs px-2.5 hover:bg-primary-soft hover:text-primary-solid hover:border-primary-soft-border transition-colors"
                  onClick={handleMessage}
                  title="Nhắn tin"
                >
                  <MessageCircle size={15} />
                </Button>
              </>
            )}
          </div>

          <p className="mt-2.5 text-xs text-text-subtle font-medium">
            <strong>{compact(followersCountLocal)}</strong> người theo dõi
          </p>
        </div>
      </Card>
    </TiltCard>
  )
}
