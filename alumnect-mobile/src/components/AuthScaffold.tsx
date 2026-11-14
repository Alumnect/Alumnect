import React, { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar as StatusBarRN,
  TextInput,
  View,
  findNodeHandle,
  useWindowDimensions,
  type ScrollViewInstance,
} from 'react-native'
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
 * - Tự động tính toán khoảng an toàn với Status Bar trên Android & iOS (tránh đè đồng hồ / pin).
 * - "tall" (đăng nhập): Tỷ lệ tranh minh hoạ FPT University cân đối, giữ form gọn gàng.
 * - "short" (đăng ký / OTP): Thanh header tinh gọn, tối ưu không gian hiển thị biểu mẫu khi mở bàn phím.
 * - Tự động đo độ cao bàn phím trên Android Edge-to-Edge và cuộn mượt đến ô nhập liệu đang focus.
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
  const statusBarH = Platform.OS === 'android' ? (StatusBarRN.currentHeight ?? 24) : insets.top
  const topSafe = Math.max(insets.top, statusBarH)

  const scrollRef = useRef<ScrollViewInstance>(null)
  const [kbHeight, setKbHeight] = useState(0)
  const [baseH, setBaseH] = useState(0)
  const [rootH, setRootH] = useState(0)

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setKbHeight(e.endCoordinates.height)
      setTimeout(() => {
        try {
          const focused = TextInput.State.currentlyFocusedInput()
          if (focused && scrollRef.current) {
            const handle = findNodeHandle(focused) ?? (focused as any)
            scrollRef.current.scrollResponderScrollNativeHandleToKeyboard(handle, 70, true)
          }
        } catch {}
      }, 60)
    })
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setKbHeight(0)
    })
    return () => {
      show.remove()
      hide.remove()
    }
  }, [])

  const windowResized = baseH > 0 && rootH > 0 && rootH < baseH - 80
  const androidBottomInset = kbHeight > 0 && !windowResized ? kbHeight : 0

  return (
    <View
      style={{ flex: 1, backgroundColor: t.card }}
      onLayout={(e) => {
        const h = e.nativeEvent.layout.height
        setRootH(h)
        if (kbHeight === 0 && h > baseH) setBaseH(h)
      }}
    >
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          bounces
          alwaysBounceVertical
          overScrollMode="always"
        >
          {tall ? (
            <View style={{ backgroundColor: field, paddingTop: topSafe + 14, paddingBottom: 0 }}>
              {onBack ? (
                <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={6} style={({ pressed }) => ({ marginLeft: 16, marginBottom: 8, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, opacity: pressed ? 0.8 : 1 })}>
                  <ChevronLeft size={22} color={t.text} />
                </Pressable>
              ) : null}
              <View style={{ paddingHorizontal: 24, marginBottom: 6 }}>
                <Brand stacked />
              </View>
              <View style={{ overflow: 'hidden', alignItems: 'center', marginTop: 2 }}>
                <AuthIllustration width={width} maxHeight={135} />
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: field, paddingTop: topSafe + 10, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                {onBack ? (
                  <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={6} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, opacity: pressed ? 0.8 : 1 })}>
                    <ChevronLeft size={22} color={t.text} />
                  </Pressable>
                ) : <View style={{ width: 40 }} />}
                <Brand centered />
                <View style={{ width: 40 }} />
              </View>
            </View>
          )}

          <View style={{ flex: 1, marginTop: -14, backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 22 }}>
            <View style={{ flex: 1, width: '100%', maxWidth: 440, alignSelf: 'center', paddingHorizontal: 24 }}>
              {title ? <Txt heading size={24} weight="700" style={{ letterSpacing: -0.3 }}>{title}</Txt> : null}
              {subtitle ? <Txt muted size={14} style={{ marginTop: 6, lineHeight: 21 }}>{subtitle}</Txt> : null}
              {title || subtitle ? <View style={{ height: 16 }} /> : null}
              {children}
              <View style={{ flexGrow: 1, minHeight: 8 }} />
              {footer ? <View style={{ paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12) + 12 }}>{footer}</View> : <View style={{ height: Math.max(insets.bottom, 12) + 12 }} />}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'android' && androidBottomInset > 0 ? (
        <View style={{ height: androidBottomInset }} />
      ) : null}
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
