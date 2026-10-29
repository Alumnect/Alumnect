import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { UserPlus, UserCheck, Loader2, Users } from 'lucide-react'
import { Avatar, Card } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { TiltCard } from '@/components/motion'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useFollowUser, useUnfollowUser } from '../hooks/useUserMutations'
import type { ConnectionSuggestionResponse } from '../model/userTypes'

interface ConnectionSuggestionCardProps {
  user: ConnectionSuggestionResponse
}

export function ConnectionSuggestionCard({ user }: ConnectionSuggestionCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const openLoginPrompt = useLoginPrompt((s) => s.open)

  const isOwn = currentUserId ? Number(currentUserId) === user.userId : false
  const [isFollowingLocal, setIsFollowingLocal] = useState(user.isFollowing ?? false)

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
      unfollowMutation.mutate(user.userId, {
        onError: () => {
          setIsFollowingLocal(true)
        },
      })
    } else {
      setIsFollowingLocal(true)
      followMutation.mutate(user.userId, {
        onError: () => {
          setIsFollowingLocal(false)
        },
      })
    }
  }

  // Tiêu đề chức vụ/công việc hoặc headline
  const primaryRole = user.primaryExperience
    ? t('profile.experienceAt', {
        title: user.primaryExperience.title,
        company: user.primaryExperience.company,
        defaultValue: `${user.primaryExperience.title} tại ${user.primaryExperience.company}`
      })
    : user.headline || (user.role === 'ALUMNI' ? t('profile.roleAlumniFpt', 'Cựu sinh viên FPT University') : t('profile.roleStudentFpt', 'Sinh viên FPT University'))

  // Dòng ngữ cảnh kết nối: ưu tiên bạn chung, nếu không có thì hiện Khóa/Chuyên ngành/Địa phương
  const contextLine = user.mutualFollowsCount && user.mutualFollowsCount > 0 ? (
    <span className="inline-flex items-center gap-1 font-medium text-success">
      <Users size={12} className="shrink-0" />
      {t('profile.mutualFriendsCount', { count: user.mutualFollowsCount, defaultValue: `${user.mutualFollowsCount} bạn chung` })}
    </span>
  ) : (
    <span className="text-text-subtle">
      {user.cohort ? t('profile.cohortFormat', { cohort: user.cohort, defaultValue: `Khóa K${user.cohort}` }) : ''}
      {user.cohort && (user.major?.code || user.city) ? ' • ' : ''}
      {user.major?.code || user.city || ''}
    </span>
  )

  return (
    <TiltCard className="group h-full" max={4}>
      <Card
        hover={false}
        className="relative flex h-full flex-col justify-between p-5 text-center transition duration-300 border border-border bg-surface backdrop-blur-sm"
      >
        <div>
          {/* Avatar Section */}
          <div className="mx-auto mt-1 mb-3 inline-block">
            <Link
              to={`/app/profile?userId=${user.userId}`}
              className="block transition-transform duration-200 group-hover:scale-105"
            >
              <Avatar
                src={user.avatarUrl || undefined}
                name={user.fullName}
                size={76}
                verified={user.isAccountVerified}
                ring
                className="mx-auto shadow-sm"
              />
            </Link>
          </div>

          {/* Full Name */}
          <Link
            to={`/app/profile?userId=${user.userId}`}
            className="block text-base font-bold text-text hover:text-primary-solid line-clamp-1 transition-colors"
          >
            {user.fullName}
          </Link>

          {/* Primary Job / Headline (1 dòng gọn gàng) */}
          <p
            className="mt-1 text-xs text-text-muted line-clamp-1 font-medium"
            title={primaryRole}
          >
            {primaryRole}
          </p>

          {/* Context Line: Bạn chung hoặc Khóa / Ngành (1 dòng tự nhiên như Facebook/Instagram) */}
          <div className="mt-1.5 flex items-center justify-center text-xs min-h-[18px]">
            {contextLine}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-4 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            {!isOwn && (
              <Button
                variant={isFollowingLocal ? 'secondary' : 'primary'}
                size="sm"
                className="flex-1 font-semibold text-xs shadow-xs"
                disabled={isPending}
                onClick={handleToggleFollow}
                leftIcon={
                  isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : isFollowingLocal ? (
                    <UserCheck size={13} className="text-success" />
                  ) : (
                    <UserPlus size={13} />
                  )
                }
              >
                {isFollowingLocal ? t('profile.following', 'Đang theo dõi') : t('profile.follow', 'Theo dõi')}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className={isOwn ? 'w-full text-xs' : 'px-3 text-xs text-text-muted hover:text-text'}
              onClick={() => navigate(`/app/profile?userId=${user.userId}`)}
            >
              {t('profile.profileBtn', 'Hồ sơ')}
            </Button>
          </div>
        </div>
      </Card>
    </TiltCard>
  )
}
