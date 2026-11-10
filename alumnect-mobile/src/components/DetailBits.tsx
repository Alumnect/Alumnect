import React from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { Card, Txt } from './ui'
import { useTheme } from '@/theme'
import Svg, { Circle, Path } from 'react-native-svg'

/** Dải nền màu thương hiệu có hoạ tiết tròn, dùng làm ảnh bìa mặc định. */
export function BrandCover({ height = 120, style }: { height?: number; style?: ViewStyle }) {
  const t = useTheme()
  return (
    <View style={[{ height, backgroundColor: t.isDark ? '#2D263A' : '#EEE8F6', justifyContent: 'center', paddingHorizontal: 24, overflow: 'hidden' }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
        <Circle cx="355" cy="110" r="110" fill={t.isDark ? '#42304B' : '#E1D4F0'} />
        <Circle cx="370" cy="-10" r="98" fill={t.isDark ? '#624332' : '#F7C9AB'} />
        <Path d="M220 170 C180 110 270 20 400 45 M245 180 C210 110 285 45 410 65 M270 190 C240 110 310 70 420 85" stroke={t.isDark ? '#A282B9' : '#B6A0CB'} strokeWidth="1.5" fill="none" />
        <Circle cx="282" cy="78" r="7" fill="#CE4A09" />
        <Circle cx="346" cy="125" r="5" fill={t.isDark ? '#D4BBE8' : '#806291'} />
      </Svg>
      <Txt size={11} weight="600" color={t.isDark ? '#D4BBE8' : '#715784'} style={{ letterSpacing: 2 }}>FPT UNIVERSITY</Txt>
      <Txt size={27} weight="700" color={t.isDark ? '#F7F1FF' : '#382844'} style={{ marginTop: 3 }}>Stay connected<Txt size={27} color={t.primary}>.</Txt></Txt>
      <Txt size={12} color={t.isDark ? '#D4BBE8' : '#715784'} style={{ marginTop: 3 }}>Mỗi kết nối, một hành trình.</Txt>
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
