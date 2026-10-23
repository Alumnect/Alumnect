import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { BadgeCheck, Check, UserPlus } from '@/components/icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { Avatar, Txt } from './ui'
import { userApi } from '@/api/users'
import type { UserCard } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

export function FollowButton({ userId, initial, onChange, block }: { userId: number; initial: boolean; onChange?: (v: boolean) => void; block?: boolean }) {
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
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={following ? 'Bỏ theo dõi' : 'Theo dõi'}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: block ? 38 : 34, paddingHorizontal: 14, borderRadius: 999, backgroundColor: following ? t.inputBg : 'transparent', borderWidth: following ? 0 : 1.5, borderColor: t.primary, opacity: pressed ? 0.8 : 1 })}
    >
      {following ? <Check size={14} color={t.text} /> : <UserPlus size={14} color={t.primary} weight="bold" />}
      <Txt size={13} weight="700" color={following ? t.text : t.primary}>{following ? 'Đang theo dõi' : 'Theo dõi'}</Txt>
    </Pressable>
  )
}

function UserRowImpl({ user, compact }: { user: UserCard; compact?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const isMe = me?.id === String(user.userId)
  const meta = [user.role === 'ALUMNI' ? 'Cựu SV' : user.role === 'STUDENT' ? 'Sinh viên' : null, user.major?.name, user.cohort ? `K${user.cohort}` : null, user.city]
    .filter(Boolean)
    .join(' · ')
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(user.userId) } })}
      accessibilityRole="button"
      accessibilityLabel={`Trang cá nhân ${user.fullName}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: pressed ? t.inputBg : t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider })}
    >
      <Avatar uri={user.avatarUrl} name={user.fullName} size={compact ? 48 : 56} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{user.fullName}</Txt>
          {user.isAccountVerified ? <BadgeCheck size={14} color={t.info} /> : null}
        </View>
        {user.headline ? <Txt size={13} numberOfLines={1}>{user.headline}</Txt> : null}
        <Txt muted size={12} numberOfLines={1}>{user.suggestionReason || meta}</Txt>
      </View>
      {!isMe ? <FollowButton userId={user.userId} initial={!!user.isFollowing} /> : null}
    </Pressable>
  )
}

export const UserRow = React.memo(UserRowImpl)
