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
      onPress={(e) => { e.stopPropagation(); toggle() }}
      disabled={m.isPending}
      accessibilityRole="button"
      accessibilityLabel={following ? 'Bỏ theo dõi' : 'Theo dõi'}
      accessibilityState={{ selected: following, busy: m.isPending }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, paddingHorizontal: block ? 16 : 12, borderRadius: 12, backgroundColor: following ? t.inputBg : t.card, borderWidth: 1, borderColor: following ? t.border : t.controlBorder, opacity: pressed || m.isPending ? 0.65 : 1 })}
    >
      {following ? <Check size={16} color={t.text} /> : <UserPlus size={16} color={t.text} />}
      <Txt size={13} weight="500">{following ? 'Đã theo dõi' : 'Theo dõi'}</Txt>
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
      accessibilityRole="link"
      accessibilityLabel={`Trang cá nhân ${user.fullName}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16, backgroundColor: pressed ? t.inputBg : t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.divider })}
    >
      <Avatar uri={user.avatarUrl} name={user.fullName} size={compact ? 40 : 48} />
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt weight="600" numberOfLines={2} style={{ flexShrink: 1 }}>{user.fullName}</Txt>
          {user.isAccountVerified ? <BadgeCheck size={14} color={t.info} /> : null}
        </View>
        {user.headline ? <Txt size={13} numberOfLines={1}>{user.headline}</Txt> : null}
        <Txt muted size={12} numberOfLines={2}>{user.suggestionReason || meta}</Txt>
        {!isMe ? <View style={{ alignSelf: 'flex-start', marginTop: 6 }}><FollowButton userId={user.userId} initial={!!user.isFollowing} /></View> : null}
      </View>
    </Pressable>
  )
}

export const UserRow = React.memo(UserRowImpl)
