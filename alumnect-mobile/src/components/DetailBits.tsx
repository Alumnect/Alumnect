import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Card, Txt } from './ui'
import { useTheme, palette } from '@/theme'

/** Dải nền màu thương hiệu có hoạ tiết tròn, dùng làm ảnh bìa mặc định. */
export function BrandCover({ height = 120, style }: { height?: number; style?: ViewStyle }) {
  return (
    <View style={[{ height, backgroundColor: palette.primary, overflow: 'hidden' }, style]}>
      <View style={{ position: 'absolute', width: height * 2, height: height * 2, borderRadius: height, backgroundColor: palette.primarySoft, opacity: 0.55, top: -height, right: -height * 0.4 }} />
      <View style={{ position: 'absolute', width: height * 1.3, height: height * 1.3, borderRadius: height, backgroundColor: palette.primaryDark, opacity: 0.45, bottom: -height * 0.7, left: height * 0.2 }} />
    </View>
  )
}

/** Ô số liệu trong hàng thống kê. */
export function StatBox({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
      <Txt size={18} weight="800" color={color}>{value}</Txt>
      <Txt muted size={12} style={{ textAlign: 'center' }}>{label}</Txt>
    </View>
  )
}

/** Hàng thống kê có vạch ngăn giữa các ô. */
export function StatRow({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme()
  const items = React.Children.toArray(children)
  return (
    <View style={[{ flexDirection: 'row', borderRadius: 14, backgroundColor: t.surface, paddingVertical: 6 }, style]}>
      {items.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={{ width: 1, backgroundColor: t.border, marginVertical: 8 }} /> : null}
          {c}
        </React.Fragment>
      ))}
    </View>
  )
}

/** Thẻ mục có tiêu đề + icon. */
export function SectionCard({ title, icon, right, children, style }: { title: string; icon?: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Card style={{ marginHorizontal: 12, marginBottom: 10, ...style }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {icon}
        <Txt weight="800" size={16} style={{ flex: 1 }}>{title}</Txt>
        {right}
      </View>
      {children}
    </Card>
  )
}

/** Một dòng thông tin: icon tròn + nhãn + giá trị. */
export function InfoRow({ icon, label, value, last }: { icon: React.ReactNode; label: string; value: React.ReactNode; last?: boolean }) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: t.divider }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.primaryTint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Txt muted size={12}>{label}</Txt>
        {typeof value === 'string' ? <Txt weight="600">{value}</Txt> : value}
      </View>
    </View>
  )
}

/** Thanh nút hành động cố định ở đáy màn hình. */
export function BottomBar({ children }: { children: React.ReactNode }) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10), backgroundColor: t.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }}>
      {children}
    </View>
  )
}
