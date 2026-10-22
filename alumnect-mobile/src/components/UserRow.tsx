import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { Avatar, Txt } from './ui'
import { userApi } from '@/api/users'
import type { UserCard } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

export function FollowButton({ userId, initial, onChange }: { userId: number; initial: boolean; onChange?: (v: boolean) => void }) {
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
      style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: following ? t.inputBg : t.primary }}
    >
      <Txt size={13} weight="700" color={following ? t.text : '#fff'}>{following ? 'Đang theo dõi' : 'Theo dõi'}</Txt>
    </Pressable>
  )
}

export function UserRow({ user }: { user: UserCard }) {
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const isMe = me?.id === String(user.userId)
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(user.userId) } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}
    >
      <Avatar uri={user.avatarUrl} name={user.fullName} size={48} />
      <View style={{ flex: 1 }}>
        <Txt weight="700" numberOfLines={1}>{user.fullName}</Txt>
        <Txt muted size={13} numberOfLines={1}>{user.headline || user.major?.name || user.suggestionReason || ''}</Txt>
      </View>
      {!isMe ? <FollowButton userId={user.userId} initial={!!user.isFollowing} /> : null}
    </Pressable>
  )
}
