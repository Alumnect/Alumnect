import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Txt } from './ui'
import { useTheme, palette, radius } from '@/theme'

/** Khung chung cho màn đăng nhập / đăng ký: dải thương hiệu màu cam + tấm nội dung bo góc. */
export function AuthScaffold({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: palette.primary }}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={{ paddingTop: insets.top + 28, paddingHorizontal: 24, paddingBottom: 48, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: palette.primarySoft, opacity: 0.55, top: -80, right: -70 }} />
            <View style={{ position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: palette.primaryDark, opacity: 0.45, bottom: -60, left: -40 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Txt size={24} weight="800" color={palette.primary}>A</Txt>
              </View>
              <Txt size={22} weight="800" color="#fff" style={{ letterSpacing: -0.5 }}>alumnect</Txt>
            </View>
            <Txt size={14} color="#FFEDE0" style={{ marginTop: 14 }}>Cộng đồng sinh viên & cựu sinh viên FPT University</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: t.card, borderTopLeftRadius: radius.xl + 4, borderTopRightRadius: radius.xl + 4, marginTop: -24, padding: 24, paddingBottom: insets.bottom + 24 }}>
            <Txt size={26} weight="800">{title}</Txt>
            {subtitle ? <Txt muted style={{ marginTop: 6, marginBottom: 24 }}>{subtitle}</Txt> : <View style={{ height: 24 }} />}
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
