import React, { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { useReducedMotion } from './Motion'
import { DURATION, EASING } from '@/theme/motion'

/**
 * Radio button phong cách Meetup (MOTION-SPEC.md §7.2):
 * Khi chọn (Off → On):
 * - Điểm tròn trung tâm phóng nhanh lên 1.45× (overshoot) ở 35ms.
 * - Sau đó nảy nhẹ và ổn định về 1.0 trong 270ms bằng FastOutSlowIn.
 */
export function MeetupRadio({
  checked,
  onPress,
  size = 22,
  color,
  style,
  disabled,
}: {
  checked: boolean
  onPress?: () => void
  size?: number
  color?: string
  style?: ViewStyle
  disabled?: boolean
}) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const activeColor = color ?? t.primary
  const dotScale = useRef(new Animated.Value(checked ? 1 : 0)).current

  useEffect(() => {
    if (reduced) {
      dotScale.setValue(checked ? 1 : 0)
      return
    }

    if (checked) {
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.45,
          duration: 35,
          easing: EASING.linear,
          useNativeDriver: true,
        }),
        Animated.timing(dotScale, {
          toValue: 1.0,
          duration: 270,
          easing: EASING.legacy,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.timing(dotScale, {
        toValue: 0,
        duration: 180,
        easing: EASING.legacy,
        useNativeDriver: true,
      }).start()
    }
  }, [checked, reduced, dotScale])

  const dotSize = Math.round(size * 0.5)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked, disabled: !!disabled }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: checked ? activeColor : t.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t.card,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: activeColor,
          transform: [{ scale: dotScale }],
        }}
      />
    </Pressable>
  )
}

