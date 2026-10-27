import React from 'react'
import { View } from 'react-native'
import { ActionSheet } from './ActionSheet'
import { Button, Txt } from './ui'

export function ConfirmSheet({ visible, title, message, confirmLabel = 'Xác nhận xóa', loading, onConfirm, onClose }: {
  visible: boolean; title: string; message: string; confirmLabel?: string; loading?: boolean; onConfirm: () => void; onClose: () => void
}) {
  return <ActionSheet visible={visible} title={title} onClose={() => { if (!loading) onClose() }}>
    <Txt muted style={{ marginBottom: 20 }}>{message}</Txt>
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Button title="Giữ lại" variant="outline" disabled={loading} onPress={onClose} style={{ flex: 1 }} />
      <Button title={confirmLabel} variant="danger" loading={loading} onPress={onConfirm} style={{ flex: 1 }} />
    </View>
  </ActionSheet>
}
