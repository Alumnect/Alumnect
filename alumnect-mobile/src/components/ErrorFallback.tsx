import React from 'react'
import { View } from 'react-native'
import { AlertTriangle } from 'lucide-react-native'
import { Button, Screen, Txt } from './ui'
import { useTheme } from '@/theme'

// Dùng làm `ErrorBoundary` của expo-router: hiện khi một màn hình bị lỗi khi render.
export function ErrorFallback({ error, retry }: { error: Error; retry: () => Promise<void> | void }) {
  const t = useTheme()
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
        <AlertTriangle size={44} color={t.danger} />
        <Txt size={18} weight="700">Đã có lỗi xảy ra</Txt>
        <Txt muted style={{ textAlign: 'center' }}>Ứng dụng gặp sự cố khi hiển thị màn hình này. Vui lòng thử lại.</Txt>
        {__DEV__ ? <Txt muted size={12} style={{ textAlign: 'center' }}>{error.message}</Txt> : null}
        <Button title="Thử lại" onPress={() => void retry()} style={{ alignSelf: 'stretch', marginTop: 8 }} />
      </View>
    </Screen>
  )
}
