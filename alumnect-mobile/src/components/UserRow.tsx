import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { BadgeCheck, Check, UserPlus } from '@/components/icons'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { Avatar, Txt } from './ui'
import { BrandIcon } from './BrandIcon'
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
}: {
  userId: number
  initial: boolean
  onChange?: (v: boolean) => void
  block?: boolean
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
    <Pressable
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
        minHeight: block ? 44 : 34,
        paddingHorizontal: block ? 16 : 14,
        borderRadius: block ? 12 : 9999,
        backgroundColor: isFollowing
          ? (t.isDark ? '#262626' : '#F1F3F5')
          : t.primary,
        borderWidth: isFollowing ? 1 : 0,
        borderColor: isFollowing ? t.border : 'transparent',
        opacity: pressed || m.isPending ? 0.75 : 1,
        ...(block ? { width: '100%' } : { minWidth: 96 }),
      })}
    >
      {isFollowing ? (
        <Check size={14} color={t.textMuted} weight="bold" />
      ) : (
        <UserPlus size={14} color="#FFFFFF" weight="bold" />
      )}
      <Txt
        size={12}
        weight="700"
        style={{
          color: isFollowing ? t.textMuted : '#FFFFFF',
        }}
      >
        {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </Txt>
    </Pressable>
  )
}

function UserRowImpl({ user, compact }: { user: UserCard; compact?: boolean }) {
  const t = useTheme()
  const router = useRouter()
  const me = useAuthStore((s) => s.user)
  const isMe = me?.id === String(user.userId)

  const metaItems = [
    user.major?.name,
    user.cohort ? `K${user.cohort}` : null,
    user.city,
  ].filter(Boolean)
  const meta = metaItems.join(' · ')

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(user.userId) } })}
      accessibilityRole="link"
      accessibilityLabel={`Trang cá nhân ${user.fullName}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: pressed ? (t.isDark ? '#1C1C1E' : '#F8F9FA') : t.card,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: t.divider,
      })}
    >
      {/* Left: Avatar with Ring (Instagram / Kakao style) */}
      <View style={{ position: 'relative' }}>
        <Avatar uri={user.avatarUrl} name={user.fullName} size={compact ? 44 : 52} ring />
      </View>

      {/* Center: User information */}
      <View style={{ flex: 1, minWidth: 0, marginHorizontal: 12, justifyContent: 'center' }}>
        {/* Name + Verified badge + Role tag */}
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', gap: 6 }}>
          <Txt weight="700" size={15} numberOfLines={1} style={{ flexShrink: 1, color: t.text }}>
            {user.fullName}
          </Txt>
          {user.isAccountVerified ? (
            <BadgeCheck size={15} color={t.info} weight="fill" />
          ) : null}
          {user.role === 'ALUMNI' ? (
            <View
              style={{
                backgroundColor: t.isDark ? '#3D2214' : '#FFF0E6',
                paddingHorizontal: 6,
                paddingVertical: 1.5,
                borderRadius: 6,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.isDark ? '#5C331E' : '#FFD9C4',
              }}
            >
              <Txt size={10} weight="700" style={{ color: t.primary }}>
                CỰU SV
              </Txt>
            </View>
          ) : user.role === 'STUDENT' ? (
            <View
              style={{
                backgroundColor: t.isDark ? '#16283D' : '#EFF6FF',
                paddingHorizontal: 6,
                paddingVertical: 1.5,
                borderRadius: 6,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: t.isDark ? '#234466' : '#DBEAFE',
              }}
            >
              <Txt size={10} weight="700" style={{ color: '#0284C7' }}>
                SINH VIÊN
              </Txt>
            </View>
          ) : null}
        </View>

        {/* Headline / Job */}
        {user.headline ? (
          <Txt size={13} weight="500" numberOfLines={1} style={{ color: t.textMuted, marginTop: 2 }}>
            {user.headline}
          </Txt>
        ) : null}

        {/* Meetup & Kakao Match Capsule or Meta info */}
        {user.suggestionReason ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginTop: 4,
              backgroundColor: t.isDark ? '#2B1C14' : '#FFF7F2',
              alignSelf: 'flex-start',
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: t.isDark ? '#4D2F20' : '#FFE2D1',
              maxWidth: '100%',
            }}
          >
            <BrandIcon name="people" size={13} />
            <Txt
              size={11}
              weight="600"
              numberOfLines={1}
              style={{ color: t.isDark ? '#FF9E66' : '#B83A00', flexShrink: 1 }}
            >
              {user.suggestionReason}
            </Txt>
          </View>
        ) : meta ? (
          <Txt muted size={12} numberOfLines={1} style={{ marginTop: 2 }}>
            {meta}
          </Txt>
        ) : null}
      </View>

      {/* Right: Instagram-style Follow Button */}
      {!isMe ? (
        <View style={{ flexShrink: 0 }}>
          <FollowButton userId={user.userId} initial={!!user.isFollowing} />
        </View>
      ) : null}
    </Pressable>
  )
}

export const UserRow = React.memo(UserRowImpl)
