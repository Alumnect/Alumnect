import React from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View, useWindowDimensions } from 'react-native'
import { ChevronLeft } from '@/components/icons'
import { ScrollView } from '@/components/ScrollView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Txt } from './ui'
import { Text } from './AppText'
import { Brand } from './Brand'
import { AuthIllustration } from './AuthIllustration'
import { radius, useTheme } from '@/theme'

/**
 * Khung chung cho các màn đăng nhập / đăng ký / khôi phục mật khẩu.
 * Đầu màn là mảng nền phẳng xanh nhạt (theo nhận diện FPT) có logo + tên Alumnect, tranh minh hoạ toà FPT University Đà Nẵng
 * và cột biển bốn hướng; biểu mẫu nằm trên tấm nền bo góc phía dưới, nút hành động ghim sát đáy.
 * `hero`: "tall" (đăng nhập) dùng tranh đầy đủ và khẩu hiệu; "short" (đăng ký, khôi phục mật khẩu) dùng dải tranh thấp.
 * `onBack` thêm nút quay lại ở góc trên.
 */
export function AuthScaffold({ title, subtitle, hero = 'tall', onBack, footer, children }: {
  title?: string
  subtitle?: string
  hero?: 'tall' | 'short'
  onBack?: () => void
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const field = t.isDark ? '#151D2A' : '#EAF0F8'
  const tall = hero === 'tall'
  return (
    <View style={{ flex: 1, backgroundColor: t.card }}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          // Luôn cho kéo: khi nội dung vừa màn hình thì chỉ giãn / nảy nhẹ rồi về chỗ cũ (cảm giác mượt), không trôi hay để lộ khoảng thừa.
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          <View style={{ backgroundColor: field, paddingTop: insets.top + (tall ? 16 : 12), paddingBottom: tall ? 0 : 24 }}>
            {onBack ? (
              <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={6} style={({ pressed }) => ({ marginLeft: 16, marginBottom: 6, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, opacity: pressed ? 0.8 : 1 })}>
                <ChevronLeft size={22} color={t.text} />
              </Pressable>
            ) : null}
            <View style={{ paddingHorizontal: 24 }}>
              {tall ? <Brand stacked /> : <Brand />}
            </View>
            <View style={{ marginTop: tall ? 0 : 6 }}>
              <AuthIllustration width={width} strip={!tall} />
            </View>
          </View>
          <View style={{ flex: 1, marginTop: -16, backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24 }}>
            <View style={{ flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24 }}>
              {title ? <Txt heading size={24} weight="600">{title}</Txt> : null}
              {subtitle ? <Txt muted size={14} style={{ marginTop: 6, lineHeight: 21 }}>{subtitle}</Txt> : null}
              {title || subtitle ? <View style={{ height: 18 }} /> : null}
              {children}
              <View style={{ flexGrow: 1, minHeight: 8 }} />
              {footer ? <View style={{ paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) + 12 }}>{footer}</View> : <View style={{ height: Math.max(insets.bottom, 12) + 12 }} />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

/** Nút chính của màn auth: bo tròn hoàn toàn, màu thương hiệu (cam), cao 52dp. */
export function AuthButton({ title, onPress, loading, disabled }: { title: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const t = useTheme()
  const off = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => ({ minHeight: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: t.primary, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}
    >
      {loading ? <ActivityIndicator color={t.onPrimary} /> : <Text style={{ color: t.onPrimary, fontWeight: '600', fontSize: 15, lineHeight: 22 }}>{title}</Text>}
    </Pressable>
  )
}

/** Nút phụ viền màu thương hiệu, dùng ở đáy màn để chuyển qua lại (Tạo tài khoản mới / Tôi đã có tài khoản). */
export function AuthFooterButton({ title, onPress }: { title: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => ({ minHeight: 52, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, borderWidth: 1.5, borderColor: t.primary, opacity: pressed ? 0.7 : 1 })}
    >
      <Text style={{ color: t.primary, fontWeight: '600', fontSize: 15, lineHeight: 22 }}>{title}</Text>
    </Pressable>
  )
}

/** Đường kẻ có chữ ở giữa ("HOẶC"), dùng chung cho các màn auth. */
export function OrDivider({ label = 'HOẶC' }: { label?: string }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginVertical: 14 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
      <Txt muted size={12} weight="600">{label}</Txt>
      <View style={{ flex: 1, height: 1, backgroundColor: t.border }} />
    </View>
  )
}

/** Liên kết chữ đậm căn giữa (VD: "Quên mật khẩu?"), vùng chạm cao >= 44dp. */
export function AuthLink({ title, onPress }: { title: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8} style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
      <Txt color={t.text} weight="600" size={14}>{title}</Txt>
    </Pressable>
  )
}
