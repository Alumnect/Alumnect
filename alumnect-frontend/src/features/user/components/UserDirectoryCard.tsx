import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Briefcase, GraduationCap, MessageCircle, UserPlus, UserCheck, Loader2 } from 'lucide-react'
import { Avatar, Badge, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { TiltCard } from '@/components/motion'
import { compact } from '@/lib/utils'
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
      <Card hover={false} className="relative flex h-full flex-col justify-between p-6 text-center transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 border border-plum-900/10 bg-white/80 backdrop-blur-sm">
        {/* Top-Right Role Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge
            tone={user.role === 'ALUMNI' ? 'brand' : 'aqua'}
            className="text-[10px] font-bold tracking-wide shadow-xs whitespace-nowrap"
          >
            {user.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
          </Badge>
        </div>

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
                verified={user.isAccountVerified}
                ring
                className="mx-auto"
              />
            </Link>
          </div>

          {/* Full Name & Headline */}
          <div>
            <Link
              to={`/app/profile?userId=${user.userId}`}
              className="text-base font-extrabold text-plum-900 transition-colors hover:text-brand-600 line-clamp-1"
            >
              {user.fullName}
            </Link>
            <p className="mt-1 text-xs text-plum-500 line-clamp-2 min-h-[34px] leading-relaxed">
              {user.headline || (user.role === 'ALUMNI' ? 'Cựu sinh viên FPT University' : 'Sinh viên FPT University')}
            </p>
          </div>

          {/* Major, Cohort & City Tags */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
            {user.major && (
              <span
                title={user.major.name}
                className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 font-semibold text-brand-700 whitespace-nowrap border border-brand-200/50"
              >
                <GraduationCap size={13} className="shrink-0 text-brand-500" />
                {user.major.code}
              </span>
            )}
            {user.cohort && (
              <span className="rounded-lg bg-plum-900/[0.04] px-2.5 py-1 font-semibold text-plum-700 whitespace-nowrap border border-plum-900/5">
                Khóa K{user.cohort}
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-plum-900/[0.04] px-2.5 py-1 text-plum-600 whitespace-nowrap border border-plum-900/5">
                <MapPin size={11} className="text-plum-400" />
                {user.city}
              </span>
            )}
          </div>

          {/* Primary Experience / Company */}
          {user.primaryExperience && (
            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-plum-600 font-medium line-clamp-1 bg-plum-900/[0.02] py-1 px-2 rounded-lg">
              <Briefcase size={12} className="shrink-0 text-plum-400" />
              <span>
                {user.primaryExperience.title} tại <strong className="text-plum-900">{user.primaryExperience.company}</strong>
              </span>
            </div>
          )}

          {/* Skills tags */}
          {user.skills && user.skills.length > 0 && (
            <div className="mt-3.5 flex flex-wrap justify-center gap-1">
              {user.skills.slice(0, 3).map((s) => (
                <span
                  key={s.id}
                  className="rounded-md bg-plum-900/[0.04] px-2 py-0.5 text-[10.5px] font-medium text-plum-600 whitespace-nowrap"
                >
                  {s.skillName}
                </span>
              ))}
              {user.skills.length > 3 && (
                <span className="rounded-md bg-plum-900/[0.04] px-1.5 py-0.5 text-[10px] font-semibold text-plum-400">
                  +{user.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 border-t border-plum-900/[0.08] pt-4">
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
                  variant={isFollowingLocal ? 'secondary' : 'primary'}
                  className="flex-1 text-xs font-semibold"
                  disabled={isPending}
                  leftIcon={
                    isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : isFollowingLocal ? (
                      <UserCheck size={13} />
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
                  className="border border-plum-900/10 text-xs px-2.5 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 transition-colors"
                  onClick={handleMessage}
                  title="Nhắn tin"
                >
                  <MessageCircle size={15} />
                </Button>
              </>
            )}
          </div>

          <p className="mt-2.5 text-[11px] text-plum-400 font-medium">
            <strong>{compact(followersCountLocal)}</strong> người theo dõi
          </p>
        </div>
      </Card>
    </TiltCard>
  )
}
