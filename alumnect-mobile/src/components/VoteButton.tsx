import React, { useState } from 'react'
import { Animated, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useMutation } from '@tanstack/react-query'
import { ArrowBigUp } from '@/components/icons'
import { Txt } from './ui'
import { useReducedMotion } from './Motion'
import { radius, useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/**
 * Nút upvote có cập nhật lạc quan, dùng cho câu hỏi và câu trả lời.
 * `pill`: viên thuốc có nền (thẻ câu hỏi ở danh sách). Mũi tên nảy lên mỗi lần bấm.
 * Trong danh sách tái sử dụng ô (FlashList) phải truyền `key` theo id để số phiếu không dính sang mục khác.
 */
export function VoteButton({ voted, votes, onVote, onUnvote, compact, pill }: { voted: boolean; votes: number; onVote: () => Promise<unknown>; onUnvote: () => Promise<unknown>; compact?: boolean; pill?: boolean }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [state, setState] = useState({ voted, votes })
  const [bump] = useState(() => new Animated.Value(1))
  const m = useMutation({
    mutationFn: (next: boolean) => (next ? onVote() : onUnvote()),
    onSuccess: (_d, next) => {
      if (next) toast.success('Đã ghi nhận bình chọn!')
    },
    onError: (e, next) => {
      setState((p) => ({ voted: !next, votes: p.votes + (next ? -1 : 1) }))
      toast.error(errMsg(e))
    },
  })
  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const next = !state.voted
    setState((p) => ({ voted: next, votes: p.votes + (next ? 1 : -1) }))
    if (!reduced) {
      bump.setValue(0)
      Animated.spring(bump, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start()
    }
    m.mutate(next)
  }
  const tint = state.voted ? t.primary : t.textMuted
  const arrow = {
    transform: [
      { translateY: bump.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -5, 0], extrapolate: 'clamp' }) },
      { scale: bump.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1], extrapolate: 'clamp' }) },
    ],
  }
  return (
    <Pressable
      onPress={(e) => { e.stopPropagation(); toggle() }}
      hitSlop={compact ? 10 : pill ? 4 : 0}
      accessibilityRole="button"
      accessibilityLabel={state.voted ? `Bỏ bình chọn, ${state.votes} phiếu` : `Bình chọn, ${state.votes} phiếu`}
      accessibilityState={{ selected: state.voted }}
      style={({ pressed }) => [
        { flexDirection: 'row', alignItems: 'center', gap: compact ? 2 : 4, minHeight: compact ? 24 : 44, minWidth: compact ? 0 : 44 },
        pill ? { minHeight: 36, minWidth: 0, gap: 6, paddingLeft: 10, paddingRight: 13, borderRadius: radius.full, backgroundColor: state.voted ? t.primaryTint : t.inputBg, opacity: pressed ? 0.8 : 1 } : null,
      ]}
    >
      <Animated.View style={arrow}>
        <ArrowBigUp size={compact ? 20 : pill ? 20 : 24} color={tint} fill={state.voted ? t.primary : 'transparent'} />
      </Animated.View>
      <Txt weight="700" size={compact ? 12 : pill ? 13 : 15} color={tint}>{state.votes}</Txt>
    </Pressable>
  )
}
