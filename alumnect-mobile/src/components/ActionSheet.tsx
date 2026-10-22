import React from 'react'
import { Modal, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme, radius } from '@/theme'

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: t.card,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.border, marginBottom: 12 }} />
        {title ? <Text style={{ color: t.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{title}</Text> : null}
        {actions?.map((a) => (
          <Pressable
            key={a.label}
            onPress={() => {
              onClose()
              a.onPress()
            }}
            style={{ paddingVertical: 14 }}
          >
            <Text style={{ color: a.danger ? t.danger : t.text, fontSize: 16, fontWeight: '500' }}>{a.label}</Text>
          </Pressable>
        ))}
        {children}
      </View>
    </Modal>
  )
}
