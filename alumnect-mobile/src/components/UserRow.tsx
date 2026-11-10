import React, { useState } from 'react'
import { View } from 'react-native'
import { BadgeCheck, Check, UserPlus, Users } from '@/components/icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { Avatar, Txt } from './ui'
import { MotionPressable } from './Motion'
import { userApi } from '@/api/users'
import type { UserCard } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

export function FollowButton({
  userId,
  initial,
  onChange,
  block,
  minimal,
}: {
  userId: number
  initial: boolean
  onChange?: (v: boolean) => void
  block?: boolean
  minimal?: boolean
}) {
  const t = useTheme()
  const [following, setFollowing] = useState(initial)
  const m = useMutation({
    mutationFn: (next: boolean) => (next ? userApi.follow(userId) : userApi.unfollow(userId)),
    onError: (e, next) => {
      setFollowing(!next)
      onChange?.(!next)
      toast.error(errMsg(e))
    },
  })

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = !following
    setFollowing(next)
    onChange?.(next)
    m.mutate(next)
  }

  const isFollowing = following

  return (
    <MotionPressable
      onPress={(e) => {
        e.stopPropagation()
        toggle()
      }}
      disabled={m.isPending}
      accessibilityRole="button"
      accessibilityLabel={isFollowing ? 'Bỏ theo dõi' : 'Theo dõi'}
      accessibilityState={{ selected: isFollowing, busy: m.isPending }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minHeight: 44,
        paddingHorizontal: minimal ? 10 : block ? 16 : 14,
        borderRadius: block ? 12 : 9999,
        backgroundColor: isFollowing
          ? (t.isDark ? '#262626' : '#F1F3F5')
          : t.primary,
        borderWidth: isFollowing ? 1 : 0,
        borderColor: isFollowing ? t.border : 'transparent',
        opacity: pressed || m.isPending ? 0.75 : 1,
        ...(block ? { width: '100%' } : { minWidth: minimal ? (isFollowing ? 44 : 80) : 96 }),
      })}
    >
      {isFollowing ? (
        <Check size={14} color={t.textMuted} weight="bold" />
      ) : (
        <UserPlus size={14} color="#FFFFFF" weight="bold" />
      )}
      {!(minimal && isFollowing) ? <Txt
        size={12}
        weight="700"
        style={{
          color: isFollowing ? t.textMuted : '#FFFFFF',
        }}
      >
        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </Txt> : null}
    </MotionPressable>
  )
}

function UserRowImpl({ user, compact }: { user: UserCard; compact?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const mutual = user.suggestionReason?.match(/(\d+)\s+kết nối chung/i)
  const reason = mutual ? `${mutual[1]} kết nối chung` : user.suggestionReason?.split(/[·;\n]/)[0]
  const meta = [user.cohort ? `K${user.cohort}` : user.role === 'ALUMNI' ? 'Cựu sinh viên' : user.role === 'STUDENT' ? 'Sinh viên' : null, user.city].filter(Boolean).join(' · ')
  return (
    <MotionPressable
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(user.userId) } })}
      accessibilityRole="link"
      accessibilityLabel={`${user.fullName}${user.suggestionReason ? `, ${user.suggestionReason}` : ''}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, backgroundColor: pressed ? t.surface : t.card })}
    >
      <Avatar uri={user.avatarUrl} name={user.fullName} size={compact ? 44 : 52} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="600" size={14} numberOfLines={2} style={{ flexShrink: 1 }}>{user.fullName}</Txt>
          {user.isAccountVerified ? <BadgeCheck size={14} color={t.info} weight="fill" /> : null}
        </View>
        {user.headline ? <Txt muted size={12} numberOfLines={1}>{user.headline}</Txt> : null}
        {reason ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Users size={12} color={t.textMuted} />
            <Txt muted size={12} numberOfLines={1} style={{ flex: 1 }}>{reason}</Txt>
          </View>
        ) : meta ? <Txt muted size={12} numberOfLines={1}>{meta}</Txt> : null}
      </View>
      {me?.id !== String(user.userId) ? <FollowButton userId={user.userId} initial={!!user.isFollowing} minimal /> : null}
    </MotionPressable>
  )
}

export const UserRow = React.memo(UserRowImpl)
