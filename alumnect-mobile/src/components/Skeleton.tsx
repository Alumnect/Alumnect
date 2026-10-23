import React, { useEffect, useState } from 'react'
import { Animated, View, type DimensionValue } from 'react-native'
import { useTheme, radius } from '@/theme'

/** Khối xám nhấp nháy dùng làm placeholder khi đang tải. */
export function SkeletonBlock({ width = '100%', height = 14, round = false, style }: { width?: DimensionValue; height?: number; round?: boolean; style?: object }) {
  const t = useTheme()
  const [opacity] = useState(() => new Animated.Value(0.45))
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: true }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [opacity])
  return <Animated.View style={[{ width, height, borderRadius: round ? radius.full : radius.sm, backgroundColor: t.border, opacity }, style]} />
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
    <View style={{ padding: 16 }} accessibilityLabel="Đang tải" accessibilityRole="progressbar">
      {Array.from({ length: n }, (_, i) => (variant === 'post' ? <PostSkeleton key={i} /> : <RowSkeleton key={i} />))}
    </View>
  )
}
