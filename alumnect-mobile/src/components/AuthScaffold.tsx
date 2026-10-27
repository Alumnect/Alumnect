import React from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Txt } from './ui'
import { Brand } from './Brand'
import { useTheme } from '@/theme'

/** Khung chung cho màn đăng nhập / đăng ký: dải thương hiệu màu cam + tấm nội dung bo góc. */
export function AuthScaffold({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: t.card }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: 520, alignSelf: 'center' }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" bounces={false}>
          <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 24, paddingBottom: 28 }}>
            <Brand />
            <View style={{ marginTop: 28, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: t.primary }}>
              <Txt size={16} weight="500">Cùng một khởi đầu.</Txt>
              <Txt size={16} weight="500">Mở nhiều hướng đi.</Txt>
              <Txt muted size={12} style={{ marginTop: 8 }}>Cộng đồng sinh viên & cựu sinh viên FPT University</Txt>
            </View>
          </View>
          <View style={{ flex: 1, backgroundColor: t.card, paddingHorizontal: 24, paddingTop: 8, paddingBottom: insets.bottom + 32 }}>
            <Txt heading size={26} weight="600">{title}</Txt>
            {subtitle ? <Txt muted style={{ marginTop: 6, marginBottom: 24 }}>{subtitle}</Txt> : <View style={{ height: 24 }} />}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
