import React from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme, radius } from '@/theme'

export function Screen({ children, edges = ['top'] as ('top' | 'bottom')[] }: { children: React.ReactNode; edges?: ('top' | 'bottom')[] }) {
  const t = useTheme()
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }} edges={edges}>
      {children}
    </SafeAreaView>
  )
}

export function Txt({
  children,
  size = 15,
  weight = '400',
  muted,
  color,
  style,
  numberOfLines,
  onPress,
}: {
  children: React.ReactNode
  onPress?: () => void
  size?: number
  weight?: '400' | '500' | '600' | '700' | '800'
  muted?: boolean
  color?: string
  style?: object
  numberOfLines?: number
}) {
  const t = useTheme()
  return (
    <Text
      numberOfLines={numberOfLines}
      onPress={onPress}
      style={[{ fontSize: size, fontWeight: weight, color: color ?? (muted ? t.textMuted : t.text) }, style]}
    >
      {children}
    </Text>
  )
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  style?: ViewStyle
}) {
  const t = useTheme()
  const bg = variant === 'primary' ? t.primary : variant === 'danger' ? t.danger : 'transparent'
  const fg = variant === 'primary' || variant === 'danger' ? '#fff' : variant === 'outline' ? t.primary : t.textMuted
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: variant === 'outline' ? t.primary : 'transparent', opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{title}</Text>}
    </Pressable>
  )
}

export function Input({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  const t = useTheme()
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? (
        <Text style={{ color: t.text, fontWeight: '600', marginBottom: 6, fontSize: 13 }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={t.textMuted}
        {...props}
        style={[
          styles.input,
          { backgroundColor: t.inputBg, color: t.text, borderColor: error ? t.danger : t.border },
          props.multiline ? { minHeight: 100, textAlignVertical: 'top' } : null,
          props.style,
        ]}
      />
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  )
}

export function Avatar({ uri, name, size = 40 }: { uri?: string | null; name?: string; size?: number }) {
  const t = useTheme()
  const initial = (name ?? '?').trim().charAt(0).toUpperCase()
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" cachePolicy="disk" transition={150} />
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.primary, fontWeight: '700', fontSize: size * 0.42 }}>{initial}</Text>
    </View>
  )
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const t = useTheme()
  const body = { backgroundColor: t.card, borderColor: t.border }
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.card, body, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, body, style]}>{children}</View>
}

export function Center({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>{children}</View>
}

export function Loading() {
  const t = useTheme()
  return (
    <Center>
      <ActivityIndicator color={t.primary} size="large" />
    </Center>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <Center>
      <Txt muted style={{ textAlign: 'center' }}>
        {text}
      </Txt>
    </Center>
  )
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: radius.full,
        marginRight: 8,
        backgroundColor: active ? t.primary : t.inputBg,
      }}
    >
      <Text style={{ color: active ? '#fff' : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
  },
})
