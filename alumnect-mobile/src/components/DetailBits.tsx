import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { Card, Txt } from './ui'
import { useTheme } from '@/theme'

/** Dải nền màu thương hiệu có hoạ tiết tròn, dùng làm ảnh bìa mặc định. */
export function BrandCover({ height = 120, style }: { height?: number; style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View style={[{ height, backgroundColor: t.surface, justifyContent: 'center', paddingHorizontal: 24, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: t.border }, style]}>
      <Txt size={24} weight="600" color={t.textMuted}>alumnect<Txt size={24} color={t.primary}>.</Txt></Txt>
      <Txt size={12} muted>FPT University · Kết nối những thế hệ</Txt>
    </View>
  )
}

/** Ô số liệu trong hàng thống kê. */
export function StatBox({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
      <Txt size={22} weight="500" color={color} style={{ fontVariant: ['tabular-nums'] }}>{value}</Txt>
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
    <Card style={{ marginHorizontal: 16, marginBottom: 16, ...style }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {icon}
        <Txt weight="600" size={16} style={{ flex: 1 }}>{title}</Txt>
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
      <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
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
  return (
    <View style={{ flexDirection: 'row', gap: 12, padding: 16, backgroundColor: t.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }}>
      {children}
    </View>
  )
}
