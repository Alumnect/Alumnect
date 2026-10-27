import React, { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View, useWindowDimensions, type TextInputProps, type ViewStyle } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { Text, TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSegments } from 'expo-router'
import { ChevronRight, Search, X, Eye, EyeOff } from '@/components/icons'
import { useTheme, radius, shadow, lineHeightFor, avatarColors, layout } from '@/theme'

/* ------------------------------------------------------------------ */
/* Khung màn hình & chữ                                               */
/* ------------------------------------------------------------------ */

/**
 * Khung màn hình. Vùng tai thỏ / thanh trạng thái phía trên luôn cùng màu thẻ (trắng) để liền với thanh tiêu đề,
 * phần thân dùng màu nền xám nhạt để các thẻ nổi lên.
 */
export function Screen({ children, edges, bg, keyboard = false }: { children: React.ReactNode; edges?: ('top' | 'bottom')[]; bg?: string; keyboard?: boolean }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const segments = useSegments()
  // Tabs own the bottom inset; stack screens must protect their last control too.
  const safeEdges = edges ?? (segments[0] === '(tabs)' ? ['top'] : ['top', 'bottom'])
  return (
    <View style={{ flex: 1, backgroundColor: bg ?? t.bg }}>
      {safeEdges.includes('top') ? <View style={{ height: insets.top, backgroundColor: t.card }} /> : null}
      {keyboard ? <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{children}</KeyboardAvoidingView> : <View style={{ flex: 1 }}>{children}</View>}
      {safeEdges.includes('bottom') ? <View style={{ height: insets.bottom, backgroundColor: t.card }} /> : null}
    </View>
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
  heading,
}: {
  children: React.ReactNode
  onPress?: () => void
  heading?: boolean
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
      accessibilityRole={heading ? 'header' : undefined}
      numberOfLines={numberOfLines}
      onPress={onPress}
      style={[{ fontSize: Math.max(12, size), lineHeight: lineHeightFor(Math.max(12, size)), fontWeight: weight, color: color ?? (muted ? t.textMuted : t.text), letterSpacing: size >= 20 ? -0.3 : 0 }, style]}
    >
      {children}
    </Text>
  )
}

/* ------------------------------------------------------------------ */
/* Nút                                                                */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  size = 'md',
  icon,
  style,
}: {
  title: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: ButtonVariant
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  style?: ViewStyle
}) {
  const t = useTheme()
  const bg = { primary: t.action, secondary: t.inputBg, outline: t.card, ghost: 'transparent', danger: t.danger }[variant]
  const fg = { primary: t.onAction, secondary: t.text, outline: t.text, ghost: t.textMuted, danger: t.isDark ? '#1C1917' : '#fff' }[variant]
  const height = { sm: 44, md: 48, lg: 52 }[size]
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        {
          minHeight: height,
          paddingVertical: 10,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          backgroundColor: bg,
          borderColor: variant === 'outline' ? t.controlBorder : 'transparent',
          opacity: disabled ? 0.65 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: '100%' }}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: fg }) : icon}
          <Text style={{ color: fg, fontWeight: '600', fontSize: size === 'sm' ? 13 : 15, lineHeight: 22, flexShrink: 1, textAlign: 'center' }}>{title}</Text>
        </View>
      )}
    </Pressable>
  )
}

/** Nút tròn chỉ có icon (thông báo, tin nhắn, đóng...), kèm số đếm nếu có. */
export function IconButton({
  icon,
  onPress,
  label,
  badge,
  size = 44,
  filled = true,
  style,
}: {
  icon: React.ReactNode
  onPress?: () => void
  label: string
  badge?: number
  size?: number
  filled?: boolean
  style?: ViewStyle
}) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        { width: Math.max(layout.touch, size), height: Math.max(layout.touch, size), borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? t.inputBg : 'transparent', opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {icon}
      {badge && badge > 0 ? (
        <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 22, height: 22, paddingHorizontal: 4, borderRadius: 11, backgroundColor: t.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.card }}>
          <Text style={{ color: t.isDark ? t.bg : '#fff', fontSize: 11, fontWeight: '600' }}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  )
}

/* ------------------------------------------------------------------ */
/* Ô nhập                                                             */
/* ------------------------------------------------------------------ */

export function Input({ label, error, ...props }: TextInputProps & { label?: string; error?: string }) {
  const t = useTheme()
  const [focus, setFocus] = useState(false)
  const [revealed, setRevealed] = useState(false)
  return (
    <View style={{ marginBottom: 18 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '500', marginBottom: 8, fontSize: 14 }}>{label}</Text> : null}
      <View style={{ justifyContent: 'center' }}>
      <TextInput
        placeholderTextColor={t.textSubtle}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
        secureTextEntry={props.secureTextEntry && !revealed}
        selectionColor={t.primary}
        onFocus={(e) => {
          setFocus(true)
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocus(false)
          props.onBlur?.(e)
        }}
        style={[
          styles.input,
          { backgroundColor: t.card, color: t.text, borderColor: error ? t.danger : focus ? t.primary : t.controlBorder },
          props.multiline ? { minHeight: 110, textAlignVertical: 'top' } : null,
          props.secureTextEntry ? { paddingRight: 52 } : null,
          props.style,
        ]}
      />
      {props.secureTextEntry ? <Pressable onPress={() => setRevealed(!revealed)} accessibilityRole="button" accessibilityLabel={revealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} style={{ position: 'absolute', right: 2, width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>{revealed ? <EyeOff size={20} color={t.textMuted} /> : <Eye size={20} color={t.textMuted} />}</Pressable> : null}
      </View>
      {error ? <Text style={{ color: t.danger, fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  )
}

/** Ô tìm kiếm bo tròn, có nút xoá nhanh. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm...',
  style,
  autoFocus,
  right,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  style?: ViewStyle
  autoFocus?: boolean
  right?: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 8 }, style]}>
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', minHeight: 48, backgroundColor: t.inputBg, borderRadius: radius.md, paddingLeft: 14, paddingRight: 4 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textSubtle}
          autoFocus={autoFocus}
          accessibilityLabel={placeholder}
          returnKeyType="search"
          style={{ flex: 1, minWidth: 0, color: t.text, fontSize: 15, paddingHorizontal: 8, paddingVertical: 12 }}
        />
        {value ? (
          <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm" style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={t.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {right}
    </View>
  )
}

/* ------------------------------------------------------------------ */
/* Ảnh đại diện, thẻ, nhãn                                            */
/* ------------------------------------------------------------------ */

export function Avatar({ uri, name, size = 40, ring }: { uri?: string | null; name?: string; size?: number; ring?: boolean }) {
  const t = useTheme()
  const parts = (name ?? '?').trim().split(/\s+/)
  const initial = parts.slice(-2).map((p) => p.charAt(0)).join('').toUpperCase()
  const [avatarBg, avatarInk] = avatarColors(name ?? '?', t.isDark)
  const inner = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" transition={150} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: avatarInk, fontWeight: '600', fontSize: size * 0.33 }}>{initial}</Text>
    </View>
  )
  if (!ring) return inner
  return <View style={{ padding: 2, borderRadius: size, borderWidth: 2, borderColor: t.primary }}>{inner}</View>
}

export function Card({ children, style, onPress, flat, accessibilityRole = 'button' }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; flat?: boolean; accessibilityRole?: 'button' | 'link' }) {
  const t = useTheme()
  const body: ViewStyle = { backgroundColor: t.card, borderColor: t.border, ...(flat ? {} : shadow(1, t.isDark)) }
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole={accessibilityRole} style={({ pressed }) => [styles.card, body, { opacity: pressed ? 0.92 : 1 }, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, body, style]}>{children}</View>
}

type Tone = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

/** Nhãn nhỏ dạng viên thuốc (loại bài, trạng thái...). */
export function Tag({ label, tone = 'neutral', icon, style }: { label: string; tone?: Tone; icon?: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme()
  const map: Record<Tone, [string, string]> = {
    primary: [t.primaryTint, t.primary],
    success: [t.successTint, t.success],
    danger: [t.dangerTint, t.danger],
    info: [t.infoTint, t.info],
    warning: [t.warningTint, t.warning],
    neutral: [t.inputBg, t.textMuted],
  }
  const [bg, fg] = map[tone]
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, alignSelf: 'flex-start', backgroundColor: bg, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 4 }, style]}>
      {icon}
      <Text style={{ color: fg, fontSize: 12, lineHeight: 17, fontWeight: '500', flexShrink: 1 }}>{label}</Text>
    </View>
  )
}

export function Divider({ style }: { style?: ViewStyle }) {
  const t = useTheme()
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.border }, style]} />
}

/* ------------------------------------------------------------------ */
/* Tiêu đề trang & tiêu đề mục                                        */
/* ------------------------------------------------------------------ */

/** Tiêu đề lớn ở đầu các tab chính, kèm nút hành động bên phải. */
export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, backgroundColor: t.card, gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text accessibilityRole="header" style={{ fontSize: 24, lineHeight: 32, fontWeight: '600', color: t.text, letterSpacing: -0.5 }}>{title}</Text>
        {subtitle ? <Txt muted size={13}>{subtitle}</Txt> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 8, flexShrink: 1 }}>{right}</View> : null}
    </View>
  )
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, style]}>
      <Txt size={16} weight="600" style={{ flex: 1 }}>{title}</Txt>
      {action ? (
        <Pressable onPress={onAction} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
          <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/* ------------------------------------------------------------------ */
/* Tab, chip                                                          */
/* ------------------------------------------------------------------ */

/** Thanh tab gạch chân (kiểu Facebook/LinkedIn). */
export function Segmented<K extends string>({
  tabs,
  value,
  onChange,
  style,
  scrollable,
}: {
  tabs: [K, string][]
  value: K
  onChange: (k: K) => void
  style?: ViewStyle
  scrollable?: boolean
}) {
  const t = useTheme()
  const { width } = useWindowDimensions()
  // Give long labels their natural width instead of truncating a navigation destination.
  const shouldScroll = scrollable || tabs.some(([, label]) => label.length * 7.5 + 16 > (width - 16) / tabs.length)
  const items = tabs.map(([k, label]) => {
    const active = k === value
    return (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={{ flex: shouldScroll ? undefined : 1, minHeight: 48, paddingHorizontal: shouldScroll ? 16 : 6, justifyContent: 'center', alignItems: 'center', paddingTop: 12 }}
      >
        <Text style={{ fontSize: 13, lineHeight: 20, fontWeight: active ? '600' : '400', color: active ? t.text : t.textMuted }} numberOfLines={1}>{label}</Text>
        <View style={{ height: 2, alignSelf: 'stretch', marginTop: 12, backgroundColor: active ? t.text : 'transparent' }} />
      </Pressable>
    )
  })
  const box: ViewStyle = { backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }
  if (shouldScroll) {
    return (
      <View style={[box, style]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 6 }}>
          {items}
        </ScrollView>
      </View>
    )
  }
  return <View style={[box, { flexDirection: 'row', paddingHorizontal: 8 }, style]}>{items}</View>
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        maxWidth: '100%',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        marginRight: 8,
        backgroundColor: active ? t.text : t.inputBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon}
      <Text style={{ color: active ? t.card : t.text, fontWeight: '500', fontSize: 13, lineHeight: 20, flexShrink: 1 }}>{label}</Text>
    </Pressable>
  )
}

/** Hàng chip cuộn ngang. */
export function ChipRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={style}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {children}
      </ScrollView>
    </View>
  )
}

/* ------------------------------------------------------------------ */
/* Hàng menu, trạng thái                                              */
/* ------------------------------------------------------------------ */

export function MenuRow({
  icon,
  label,
  hint,
  onPress,
  danger,
  tint,
  last,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  onPress: () => void
  danger?: boolean
  tint?: string
  last?: boolean
}) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, backgroundColor: pressed ? t.inputBg : 'transparent', borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.divider })}
    >
      <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: danger ? t.danger : t.textMuted }) : icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="600" color={danger ? t.danger : undefined}>{label}</Txt>
        {hint ? <Txt muted size={12}>{hint}</Txt> : null}
      </View>
      {!danger ? <ChevronRight size={18} color={t.textSubtle} /> : null}
    </Pressable>
  )
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

/** Trạng thái rỗng, có thể kèm icon và nút hành động. */
export function Empty({ text, title, icon, action, onAction, error, onRetry }: { text: string; title?: string; icon?: React.ReactNode; action?: string; onAction?: () => void; error?: unknown; onRetry?: () => void }) {
  if (error) return (
    <View accessibilityRole="alert" style={{ paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center', gap: 10 }}>
      <Txt size={16} weight="600">Không tải được nội dung</Txt>
      <Txt muted style={{ textAlign: 'center' }}>{error instanceof Error ? error.message : 'Kiểm tra kết nối rồi thử lại.'}</Txt>
      {onRetry ? <Button title="Thử lại" variant="outline" onPress={onRetry} style={{ marginTop: 6 }} /> : null}
    </View>
  )
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 8 }}>
      {icon ? <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>{icon}</View> : null}
      {title ? <Txt size={16} weight="700" style={{ textAlign: 'center' }}>{title}</Txt> : null}
      <Txt muted style={{ textAlign: 'center' }}>{text}</Txt>
      {action ? <Button title={action} size="sm" variant="secondary" onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
  },
})

/* ------------------------------------------------------------------ */
/* Ô lối tắt (lưới tính năng)                                         */
/* ------------------------------------------------------------------ */

/** Ô lối tắt: icon trong khối nền cam nhạt bo góc + nhãn, dùng cho lưới tính năng. Chỉ một tông màu để màn hình không bị rối. */
export function QuickTile({ icon, label, onPress, width = 76 }: { icon: React.ReactNode; label: string; onPress: () => void; color?: string; width?: number }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: 'center', width, gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>{React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: t.textMuted }) : icon}</View>
      <Txt size={12} weight="600" style={{ textAlign: 'center' }} numberOfLines={2}>{label}</Txt>
    </Pressable>
  )
}

/** Lối tắt dạng viên thuốc: icon + nhãn trên một dòng (cao 40), dùng cho hàng lối tắt cuộn ngang. */
export function PillLink({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, marginRight: 8, borderRadius: radius.md, borderWidth: 1, borderColor: t.border, backgroundColor: pressed ? t.inputBg : t.card })}
    >
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: t.textMuted }) : icon}
      <Txt size={13} weight="500">{label}</Txt>
    </Pressable>
  )
}
