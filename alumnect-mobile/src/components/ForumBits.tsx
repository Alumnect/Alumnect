import React, { useEffect, useState } from 'react'
import { Animated, Easing, View } from 'react-native'
import { BrandIcon, type BrandIconName } from './BrandIcon'
import { MotionPressable, useReducedMotion } from './Motion'
import { Txt } from './ui'
import { normalize } from '@/constants/filters'
import { radius, useTheme } from '@/theme'

// References: E:/Clone UIUX/{export,instagram-clone,kakaostory-clone}.
// Meetup: watercolour category illustrations; Instagram: story rail (ring = selected);
// Kakao: pill pickers in the composer.

const TOPIC_ICONS: [RegExp, BrandIconName][] = [
  [/phong van|interview/, 'people2'],
  [/su nghiep|nghe nghiep|viec lam|thuc tap|career/, 'suitcase'],
  [/luong|thu nhap|dai ngo|tai chinh/, 'coin'],
  [/hoc|chung chi|on thi|do an/, 'writing'],
  [/cong nghe|lap trinh|ky thuat|ai|code/, 'computer'],
  [/ky nang|ngoai ngu/, 'star'],
  [/khoi nghiep|startup|y tuong/, 'sparkle'],
  [/su kien|workshop/, 'calendar'],
  [/thiet ke|ui|ux|sang tao|ve|hoi hoa/, 'painting'],
  [/am nhac|nghe thuat|van nghe|hat|guitar/, 'music'],
  [/tam ly|suc khoe|tam su|tinh than/, 'mentalhealth'],
  [/game|esport|tro choi|giai tri/, 'videogame'],
  [/the thao|bong da|bong ro|gym/, 'ball'],
  [/moi truong|thien nhien|cay xanh/, 'tree'],
  [/khoa hoc|nghien cuu|lab/, 'potion'],
  [/thu cung|meo|cho/, 'cat'],
  [/am thuc|an uong|review/, 'pizza'],
  [/chung|khac|doi song|chia se/, 'world'],
]
const FALLBACK: BrandIconName[] = ['chat', 'sparkle', 'star', 'list', 'heart', 'pencil', 'painting', 'music', 'potion', 'mentalhealth']

/** Minh hoạ Meetup cho một chủ đề hỏi đáp: khớp theo từ khoá trong tên, không khớp thì xoay vòng ổn định theo id. */
export function topicIcon(name: string, id = 0): BrandIconName {
  const key = normalize(name)
  return TOPIC_ICONS.find(([re]) => re.test(key))?.[1] ?? FALLBACK[Math.abs(id) % FALLBACK.length]
}

/** Vòng tròn chủ đề kiểu story Instagram: viền cam bật nảy khi được chọn. */
export function TopicStory({ icon, label, active, onPress }: { icon: BrandIconName; label: string; active: boolean; onPress: () => void }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [ring] = useState(() => new Animated.Value(active ? 1 : 0))
  useEffect(() => {
    const animation = reduced
      ? Animated.timing(ring, { toValue: active ? 1 : 0, duration: 0, useNativeDriver: true })
      : active
        ? Animated.spring(ring, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true })
        : Animated.timing(ring, { toValue: 0, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [active, reduced, ring])
  return (
    <MotionPressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} style={{ width: 76, alignItems: 'center', gap: 6 }}>
      <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 32, borderWidth: 1, borderColor: t.border }} />
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 32, borderWidth: 2, borderColor: t.primary, opacity: ring, transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }] }} />
        <View style={{ width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.primaryTint : t.surface }}>
          <BrandIcon name={icon} size={32} />
        </View>
      </View>
      <Txt size={12} weight={active ? '700' : '500'} color={active ? t.primary : t.text} numberOfLines={2} style={{ textAlign: 'center', lineHeight: 16 }}>{label}</Txt>
    </MotionPressable>
  )
}

/** Viên chọn chủ đề trong form (kiểu bộ chọn loại bài của Kakao), kèm minh hoạ Meetup. */
export function TopicPill({ icon, label, active, onPress }: { icon: BrandIconName; label: string; active: boolean; onPress: () => void }) {
  const t = useTheme()
  return (
    <MotionPressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: active }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingVertical: 8, paddingLeft: 10, paddingRight: 14, borderRadius: radius.full, borderWidth: 1.5, borderColor: active ? t.primary : 'transparent', backgroundColor: active ? t.primaryTint : t.inputBg }}
    >
      <BrandIcon name={icon} size={24} />
      <Txt size={13} weight={active ? '700' : '500'} color={active ? t.primary : t.text}>{label}</Txt>
    </MotionPressable>
  )
}
