import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from '@/components/icons'
import { Txt } from './ui'
import { Text } from './AppText'
import { useTheme } from '@/theme'

/** Thanh tiêu đề cho các màn hình con: nút quay lại tròn, tiêu đề, khu vực hành động bên phải. */
export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, minHeight: 64, backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
      <Pressable
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Quay lại"
        style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.inputBg : 'transparent' })}
      >
        <ChevronLeft size={26} color={t.text} />
      </Pressable>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" numberOfLines={2} style={{ fontSize: 18, lineHeight: 25, fontWeight: '600', color: t.text }}>{title}</Text>
        {subtitle ? <Txt muted size={12} numberOfLines={2}>{subtitle}</Txt> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 4 }}>{right}</View> : null}
    </View>
  )
}
