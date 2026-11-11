import React, { createContext, useContext, useEffect, useRef } from 'react'
import { Animated, Easing, View, StyleSheet, type DimensionValue, ActivityIndicator } from 'react-native'
import { useTheme, radius } from '@/theme'
import { useReducedMotion } from './Motion'
import { DURATION, EASING } from '@/theme/motion'
import { Txt } from './ui'

const PulseContext = createContext<Animated.Value | null>(null)

/**
 * Quản lý nhịp thở đồng bộ (Synchronized Pulse) cho toàn bộ khối Skeleton trên màn hình.
 * Dựa trên Motion Spec Meetup: dao động nhẹ 0.62 ↔ 1.0 chu kỳ 1200ms bằng Easing.inOut.
 */
export function SkeletonPulseProvider({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (reduced) return
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.62,
          duration: DURATION.pulse / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1.0,
          duration: DURATION.pulse / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    )
    loop.start()
    return () => loop.stop()
  }, [reduced, opacity])

  return <PulseContext.Provider value={opacity}>{children}</PulseContext.Provider>
}

/** Khối xám nhịp thở dùng làm placeholder khi đang tải (chuẩn dải màu Meetup #EBEBEE ↔ #DDDDE1). */
export function SkeletonBlock({
  width = '100%',
  height = 14,
  round = false,
  style,
  pulse = true,
}: {
  width?: DimensionValue
  height?: number
  round?: boolean
  style?: object
  pulse?: boolean
}) {
  const t = useTheme()
  const sharedPulse = useContext(PulseContext)
  const bgColor = t.isDark ? '#27272a' : '#E8E8ED'

  if (pulse && sharedPulse) {
    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius: round ? radius.full : radius.sm,
            backgroundColor: bgColor,
            opacity: sharedPulse,
          },
          style,
        ]}
      />
    )
  }

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: round ? radius.full : radius.sm,
          backgroundColor: bgColor,
        },
        style,
      ]}
    />
  )
}

function PostSkeleton() {
  const t = useTheme()
  return (
    <View style={{ backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: radius.lg, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <SkeletonBlock width={40} height={40} round />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBlock width="45%" height={12} />
          <SkeletonBlock width="25%" height={10} />
        </View>
      </View>
      <SkeletonBlock height={12} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="85%" height={12} style={{ marginBottom: 12 }} />
      <SkeletonBlock height={120} />
    </View>
  )
}

function RowSkeleton() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
      <SkeletonBlock width={44} height={44} round />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock width="55%" height={13} />
        <SkeletonBlock width="80%" height={11} />
      </View>
    </View>
  )
}

/** Danh sách placeholder: `post` cho thẻ bài viết/việc làm/sự kiện, `row` cho danh sách người, tin nhắn, thông báo. */
export function ListSkeleton({ variant = 'post', count }: { variant?: 'post' | 'row'; count?: number }) {
  const n = count ?? (variant === 'post' ? 3 : 7)
  return (
    <SkeletonPulseProvider>
      <View style={{ padding: 16 }} accessibilityLabel="Đang tải" accessibilityRole="progressbar">
        {Array.from({ length: n }, (_, i) => (variant === 'post' ? <PostSkeleton key={i} /> : <RowSkeleton key={i} />))}
      </View>
    </SkeletonPulseProvider>
  )
}

/** Vòng xoay tải mượt mà kèm thông điệp hỗ trợ. */
export function LoadingState({ message = 'Đang tải dữ liệu...' }: { message?: string }) {
  const t = useTheme()
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
      <ActivityIndicator size="large" color={t.primary} />
      <Txt size={13} color={t.textSubtle}>{message}</Txt>
    </View>
  )
}
