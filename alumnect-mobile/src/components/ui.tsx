import React, { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View, type TextInputProps, type ViewStyle } from 'react-native'
import { Text, TextInput } from '@/components/AppText'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, Search, X } from '@/components/icons'
import { useTheme, radius, shadow, lineHeightFor } from '@/theme'

/* ------------------------------------------------------------------ */
/* Khung màn hình & chữ                                               */
/* ------------------------------------------------------------------ */

/**
 * Khung màn hình. Vùng tai thỏ / thanh trạng thái phía trên luôn cùng màu thẻ (trắng) để liền với thanh tiêu đề,
 * phần thân dùng màu nền xám nhạt để các thẻ nổi lên.
 */
export function Screen({ children, edges = ['top'] as ('top' | 'bottom')[], bg }: { children: React.ReactNode; edges?: ('top' | 'bottom')[]; bg?: string }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: bg ?? t.bg }}>
      {edges.includes('top') ? <View style={{ height: insets.top, backgroundColor: t.card }} /> : null}
      <View style={{ flex: 1, paddingBottom: edges.includes('bottom') ? insets.bottom : 0 }}>{children}</View>
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
      style={[{ fontSize: size, lineHeight: lineHeightFor(size), fontWeight: weight, color: color ?? (muted ? t.textMuted : t.text), letterSpacing: size >= 20 ? -0.3 : 0 }, style]}
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
  const bg = { primary: t.primary, secondary: t.primaryTint, outline: 'transparent', ghost: 'transparent', danger: t.danger }[variant]
  const fg = { primary: t.onPrimary, secondary: t.primary, outline: t.text, ghost: t.textMuted, danger: t.isDark ? '#1C1917' : '#fff' }[variant]
  const height = { sm: 36, md: 46, lg: 52 }[size]
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
          height,
          paddingHorizontal: size === 'sm' ? 14 : 18,
          backgroundColor: bg,
          borderColor: variant === 'outline' ? t.border : 'transparent',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: fg }) : icon}
          <Text style={{ color: fg, fontWeight: '700', fontSize: size === 'sm' ? 13 : 15 }}>{title}</Text>
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
        { width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: filled ? t.inputBg : 'transparent', opacity: pressed ? 0.7 : 1 },
        style,
      ]}
    >
      {icon}
      {badge && badge > 0 ? (
        <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: t.danger, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.card }}>
          <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{badge > 99 ? '99+' : badge}</Text>
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
  return (
    <View style={{ marginBottom: 14 }}>
      {label ? <Text style={{ color: t.text, fontWeight: '600', marginBottom: 6, fontSize: 13 }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.textSubtle}
        {...props}
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
          { backgroundColor: focus ? t.card : t.inputBg, color: t.text, borderColor: error ? t.danger : focus ? t.primary : 'transparent' },
          props.multiline ? { minHeight: 110, textAlignVertical: 'top' } : null,
          props.style,
        ]}
      />
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
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 42, backgroundColor: t.inputBg, borderRadius: radius.full, paddingHorizontal: 14 }}>
        <Search size={18} color={t.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.textSubtle}
          autoFocus={autoFocus}
          returnKeyType="search"
          style={{ flex: 1, color: t.text, fontSize: 15, paddingHorizontal: 8, paddingVertical: 0 }}
        />
        {value ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Xoá tìm kiếm">
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
  const initial = (name ?? '?').trim().charAt(0).toUpperCase()
  const inner = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.inputBg }} contentFit="cover" cachePolicy="disk" transition={150} />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: t.primary, fontWeight: '800', fontSize: size * 0.4 }}>{initial}</Text>
    </View>
  )
  if (!ring) return inner
  return <View style={{ padding: 2, borderRadius: size, borderWidth: 2, borderColor: t.primary }}>{inner}</View>
}

export function Card({ children, style, onPress, flat }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; flat?: boolean }) {
  const t = useTheme()
  const body: ViewStyle = { backgroundColor: t.card, borderColor: t.border, ...(flat ? {} : shadow(1, t.isDark)) }
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, body, { opacity: pressed ? 0.92 : 1 }, style]}>
        {children}
      </Pressable>
    )
  }
  return <View style={[styles.card, body, style]}>{children}</View>
}

type Tone = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

/** Nhãn nhỏ dạng viên thuốc (loại bài, trạng thái...). */
export function Tag({ label, tone = 'primary', icon, style }: { label: string; tone?: Tone; icon?: React.ReactNode; style?: ViewStyle }) {
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
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: bg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 }, style]}>
      {icon}
      <Text style={{ color: fg, fontSize: 12, fontWeight: '700' }}>{label}</Text>
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
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, backgroundColor: t.card, gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Txt size={26} weight="800">{title}</Txt>
        {subtitle ? <Txt muted size={13}>{subtitle}</Txt> : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: 8 }}>{right}</View> : null}
    </View>
  )
}

export function SectionHeader({ title, action, onAction, style }: { title: string; action?: string; onAction?: () => void; style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, style]}>
      <Txt size={17} weight="800">{title}</Txt>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
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
  const items = tabs.map(([k, label]) => {
    const active = k === value
    return (
      <Pressable
        key={k}
        onPress={() => onChange(k)}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        style={{ flex: scrollable ? undefined : 1, paddingHorizontal: scrollable ? 14 : 4, alignItems: 'center', paddingTop: 10 }}
      >
        <Text style={{ fontSize: 14, fontWeight: active ? '800' : '600', color: active ? t.primary : t.textMuted }} numberOfLines={1}>{label}</Text>
        <View style={{ height: 3, alignSelf: 'stretch', marginTop: 9, borderRadius: 2, backgroundColor: active ? t.primary : 'transparent' }} />
      </Pressable>
    )
  })
  const box: ViewStyle = { backgroundColor: t.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }
  if (scrollable) {
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
        height: 36,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        marginRight: 8,
        backgroundColor: active ? t.text : t.inputBg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      {icon}
      <Text style={{ color: active ? t.card : t.text, fontWeight: '600', fontSize: 13 }}>{label}</Text>
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
      <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? t.dangerTint : tint ?? t.primaryTint }}>{icon}</View>
      <View style={{ flex: 1 }}>
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
export function Empty({ text, title, icon, action, onAction }: { text: string; title?: string; icon?: React.ReactNode; action?: string; onAction?: () => void }) {
  const t = useTheme()
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32, gap: 8 }}>
      {icon ? <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>{icon}</View> : null}
      {title ? <Txt size={16} weight="700" style={{ textAlign: 'center' }}>{title}</Txt> : null}
      <Txt muted style={{ textAlign: 'center' }}>{text}</Txt>
      {action ? <Button title={action} size="sm" variant="secondary" onPress={onAction} style={{ marginTop: 8 }} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 14,
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

/* ------------------------------------------------------------------ */
/* Ô lối tắt (lưới tính năng)                                         */
/* ------------------------------------------------------------------ */

/** Ô lối tắt: icon trong khối nền cam nhạt bo góc + nhãn, dùng cho lưới tính năng. Chỉ một tông màu để màn hình không bị rối. */
export function QuickTile({ icon, label, onPress, width = 76 }: { icon: React.ReactNode; label: string; onPress: () => void; color?: string; width?: number }) {
  const t = useTheme()
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: 'center', width, gap: 6, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
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
      style={({ pressed }) => ({ height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, marginRight: 8, borderRadius: 20, backgroundColor: pressed ? t.border : t.primaryTint })}
    >
      {icon}
      <Txt size={13} weight="600" color={t.primary}>{label}</Txt>
    </Pressable>
  )
}
