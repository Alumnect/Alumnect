import React, { useEffect, useState } from 'react'
import { Animated, Pressable, View, type LayoutChangeEvent } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Txt } from './ui'
import { BrandIcon, type BrandIconName } from './BrandIcon'
import { useReducedMotion } from './Motion'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { DURATION, EASING } from '@/theme/motion'

export type MentoringView = 'mine' | 'discover'

/**
 * Thanh chuyển 2 phần của tab Cố vấn (Meetup segmented pill): nền xám, "viên" trắng trượt mượt theo lựa chọn
 * (native driver, FastOutSlowIn 250ms), kèm số đếm việc cần xử lý trên "Của tôi".
 */
export function MentoringSwitch({ value, onChange, badge }: { value: MentoringView; onChange: (v: MentoringView) => void; badge?: number }) {
  const { colors, viridian, isDark } = useMentoringTheme()
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(0)
  const [x] = useState(() => new Animated.Value(value === 'mine' ? 0 : 1))

  useEffect(() => {
    const a = Animated.timing(x, { toValue: value === 'mine' ? 0 : 1, duration: reduced ? 0 : DURATION.normal, easing: EASING.legacy, useNativeDriver: true })
    a.start()
    return () => a.stop()
  }, [value, reduced, x])

  const half = Math.max(0, (width - 8) / 2)
  const items: [MentoringView, string, BrandIconName][] = [['mine', 'Của tôi', 'task'], ['discover', 'Tìm mentor', 'binoculars']]

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: isDark ? colors.surface : '#F1F2F4', borderWidth: 1, borderColor: isDark ? colors.border : '#E8EAED' }}
    >
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 4, bottom: 4, left: 4, width: half, borderRadius: 12,
            backgroundColor: colors.card,
            shadowColor: '#000', shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
            transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, half] }) }],
          }}
        />
      ) : null}
      {items.map(([k, label, brand]) => {
        const active = value === k
        return (
          <Pressable
            key={k}
            onPress={() => {
              if (active) return
              Haptics.selectionAsync()
              onChange(k)
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={{ flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <BrandIcon name={brand} size={20} />
            <Txt size={13.5} weight={active ? '800' : '600'} style={{ color: active ? colors.text : colors.textSecondary }}>{label}</Txt>
            {k === 'mine' && badge ? (
              <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: viridian }}>
                <Txt size={11} weight="800" style={{ color: '#FFFFFF' }}>{badge > 99 ? '99+' : badge}</Txt>
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

/** Khung hiển thị một phần: ẩn bằng display none (giữ trạng thái cuộn), hiện lại bằng fade + trượt nhẹ. */
export function SwitchPane({ visible, direction, children }: { visible: boolean; direction: 1 | -1; children: React.ReactNode }) {
  const reduced = useReducedMotion()
  const [p] = useState(() => new Animated.Value(visible ? 1 : 0))
  useEffect(() => {
    if (!visible) {
      p.setValue(0)
      return
    }
    const a = Animated.timing(p, { toValue: 1, duration: reduced ? 0 : DURATION.smooth, easing: EASING.legacy, useNativeDriver: true })
    a.start()
    return () => a.stop()
  }, [visible, reduced, p])
  return (
    <Animated.View
      style={{
        flex: 1,
        display: visible ? 'flex' : 'none',
        opacity: p,
        transform: [{ translateX: p.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 18 * direction, 0] }) }],
      }}
    >
      {children}
    </Animated.View>
  )
}
