import React from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { Screen, Txt } from './ui'
import { useTheme } from '@/theme'

export function AuthScaffold({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const t = useTheme()
  return (
    <Screen edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40 }} keyboardShouldPersistTaps="handled">
          <View
            style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
          >
            <Txt size={28} weight="800" color="#fff">A</Txt>
          </View>
          <Txt size={26} weight="800">{title}</Txt>
          {subtitle ? <Txt muted style={{ marginTop: 6, marginBottom: 24 }}>{subtitle}</Txt> : <View style={{ height: 24 }} />}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
