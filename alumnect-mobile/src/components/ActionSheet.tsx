import React from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text } from '@/components/AppText'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/theme'
import { SheetModal } from './SheetModal'
import { X } from './icons'

export type SheetAction = { label: string; onPress: () => void; danger?: boolean }

/** Bottom sheet thao tác dùng chung (menu bài viết, báo cáo, ...). */
export function ActionSheet({
  visible,
  onClose,
  title,
  actions,
  children,
}: {
  visible: boolean
  onClose: () => void
  title?: string
  actions?: SheetAction[]
  children?: React.ReactNode
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <SheetModal visible={visible} onClose={onClose}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, minHeight: 52, borderBottomWidth: 1, borderBottomColor: t.divider }}>
        <Text accessibilityRole="header" style={{ flex: 1, color: t.text, fontWeight: '600', fontSize: 18, lineHeight: 26 }}>{title ?? 'Thao tác'}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}><X size={20} color={t.textMuted} /></Pressable>
      </View>
      <ScrollView style={{ flexShrink: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: Math.max(16, insets.bottom + 12) }}>
        {actions?.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => {
              onClose()
              a.onPress()
            }}
            style={({ pressed }) => ({ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, backgroundColor: pressed ? t.inputBg : 'transparent' })}
          >
            <Text style={{ color: a.danger ? t.danger : t.text, fontSize: 15, fontWeight: '500', lineHeight: 22 }}>{a.label}</Text>
          </Pressable>
        ))}
        {children}
      </ScrollView>
    </SheetModal>
  )
}
