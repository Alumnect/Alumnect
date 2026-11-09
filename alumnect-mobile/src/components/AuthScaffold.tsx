import React from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Txt } from './ui'
import { Brand } from './Brand'
import { useTheme } from '@/theme'

/**
 * Khung chung cho các màn đăng nhập / đăng ký / khôi phục mật khẩu: logo, (tuỳ chọn) khẩu hiệu thương hiệu, tiêu đề rồi tới biểu mẫu.
 * `compact` bỏ khẩu hiệu để biểu mẫu dài (đăng ký) không bị đẩy xuống quá thấp.
 */
export function AuthScaffold({ title, subtitle, compact = false, children }: { title: string; subtitle?: string; compact?: boolean; children: React.ReactNode }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: t.card }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" bounces={false}>
          <View style={{ paddingTop: insets.top + (compact ? 16 : 24), paddingHorizontal: 24 }}>
            <Brand />
            {compact ? null : (
              <View style={{ marginTop: 24, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: t.primary }}>
                <Txt size={16} weight="500">Cùng một khởi đầu. Mở nhiều hướng đi.</Txt>
                <Txt muted size={12} style={{ marginTop: 4 }}>Cộng đồng sinh viên & cựu sinh viên FPT University</Txt>
              </View>
            )}
          </View>
          <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: compact ? 20 : 28, paddingBottom: insets.bottom + 32 }}>
            <Txt heading size={26} weight="600">{title}</Txt>
            {subtitle ? <Txt muted style={{ marginTop: 6, marginBottom: 24 }}>{subtitle}</Txt> : <View style={{ height: 24 }} />}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/** Đường kẻ có chữ ở giữa ("hoặc"), dùng chung cho các màn auth. */
export function OrDivider({ label = 'hoặc' }: { label?: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
      <Txt muted size={12}>{label}</Txt>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
    </View>
  )
}

/** Dòng chuyển qua lại giữa đăng nhập và đăng ký; vùng chạm cao >= 44dp. */
export function AuthSwitch({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, flexWrap: 'wrap' }}>
      <Txt muted>{question} </Txt>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={{ paddingVertical: 12 }}>
        <Txt color={t.primary} weight="700">{action}</Txt>
      </Pressable>
    </View>
  )
}
