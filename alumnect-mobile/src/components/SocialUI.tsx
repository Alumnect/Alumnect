import React, { useEffect, useState } from 'react'
import { Animated, Easing, View, type ViewStyle } from 'react-native'
import { BrandIcon, type BrandIconName } from './BrandIcon'
import { Enter, MotionPressable, useReducedMotion } from './Motion'
import { Txt } from './ui'
import { useTheme } from '@/theme'

// References: E:/Clone UIUX/{kakaostory-clone,instagram-clone,export}.
// Kakao: grouped surfaces and quiet spacing; Instagram: compact people-first
// lists; Meetup: illustrated section markers and a persistent form action.

/** Compact community introduction, using the existing Meetup illustration assets. */
export function CommunityIntro({ icon, eyebrow, title, description }: { icon: BrandIconName; eyebrow?: string; title: string; description: string }) {
  const t = useTheme()
  return <Enter style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, marginBottom: 20, borderRadius: 22, backgroundColor: t.primaryTint }}>
    <View style={{ flex: 1, gap: 5 }}>
      {eyebrow ? <Txt size={11} weight="600" color={t.primary} style={{ letterSpacing: 1 }}>{eyebrow}</Txt> : null}
      <Txt size={20} weight="700" heading>{title}</Txt>
      <Txt size={12} muted>{description}</Txt>
    </View>
    <BrandIcon name={icon} size={58} />
  </Enter>
}

export function FormSection({ icon, title, caption, children, style }: { icon: BrandIconName; title: string; caption?: string; children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme()
  return <View style={[{ padding: 18, borderRadius: 20, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, marginBottom: 16 }, style]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <BrandIcon name={icon} size={36} />
      <View style={{ flex: 1 }}>
        <Txt size={16} weight="600" heading>{title}</Txt>
        {caption ? <Txt muted size={12} style={{ marginTop: 3 }}>{caption}</Txt> : null}
      </View>
    </View>
    {children}
  </View>
}

/** Equal-width tabs with a sliding selection; labels can wrap at larger font sizes. */
export function SoftTabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (value: T) => void }) {
  const t = useTheme()
  const reduced = useReducedMotion()
  const [width, setWidth] = useState(0)
  const [position] = useState(() => new Animated.Value(0))
  const selected = Math.max(0, tabs.findIndex(([key]) => key === value))
  const cell = Math.max(0, (width - 8) / tabs.length)
  useEffect(() => {
    const animation = Animated.timing(position, { toValue: selected * cell, duration: reduced ? 0 : 210, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    animation.start()
    return () => animation.stop()
  }, [selected, cell, position, reduced])
  return <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: t.card }}>
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: t.inputBg }}>
      {cell > 0 ? <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 4, top: 4, bottom: 4, width: cell, borderRadius: 12, backgroundColor: t.card, borderWidth: 1, borderColor: t.border, transform: [{ translateX: position }] }} /> : null}
      {tabs.map(([key, label]) => <MotionPressable key={key} accessibilityRole="tab" accessibilityState={{ selected: key === value }} onPress={() => onChange(key)} style={{ flex: 1, minHeight: 44, paddingVertical: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' }}>
        <Txt size={12} weight={key === value ? '600' : '400'} color={key === value ? t.text : t.textMuted} style={{ textAlign: 'center' }}>{label}</Txt>
      </MotionPressable>)}
    </View>
  </View>
}
