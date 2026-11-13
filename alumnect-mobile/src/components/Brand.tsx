import React from 'react'
import { View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Text } from './AppText'
import { useTheme } from '@/theme'

/**
 * Chữ viết tay "AlumNect" (Caveat, giống logo web): "Alum" xanh FPT, "Nect" cam.
 * Caveat nghiêng nên nét cuối chữ "t" nhô ra ngoài khung chữ và Android cắt phần nhô đó; vì vậy thêm một khoảng trắng
 * cứng (U+00A0) sau chữ cuối để khung chữ dài hơn nét thật, và bọc khung có đệm phải, không co lại.
 */
function Wordmark({ size, alum, nect }: { size: number; alum: string; nect: string }) {
  const font = { fontFamily: 'Caveat_700Bold' as const }
  return (
    <View style={{ flexShrink: 0, paddingRight: Math.round(size * 0.2), overflow: 'visible' }}>
      <Text style={{ ...font, fontSize: size, lineHeight: Math.round(size * 1.13), includeFontPadding: false }}>
        <Text style={{ ...font, color: alum }}>Alum</Text>
        <Text style={{ ...font, color: nect }}>{'Nect  '}</Text>
      </Text>
    </View>
  )
}

/** The existing FPT University identity, paired with the Alumnect name. `stacked` là bản lớn (logo FPT + tên Alumnect to) dùng ở đầu màn đăng nhập. */
export function Brand({ compact = false, centered = false, stacked = false }: { compact?: boolean; centered?: boolean; stacked?: boolean }) {
  const t = useTheme()
  const { width } = useWindowDimensions()
  const alum = t.isDark ? '#7CB7FF' : '#004F9E'
  const nect = t.isDark ? '#FF8C38' : '#C2410C'
  if (stacked) {
    // Bản lớn ở đầu màn đăng nhập: logo FPT và tên Alumnect trên một hàng.
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accessibilityLabel="Alumnect · FPT University">
        <Image source={require('../../assets/fpt-university-logo.png')} style={{ width: 62, height: 39 }} contentFit="contain" />
        <Wordmark size={46} alum={alum} nect={nect} />
      </View>
    )
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: centered ? 'center' : 'flex-start', gap: 10 }} accessibilityLabel="Alumnect · FPT University">
      {!centered && (width >= 360 || compact) ? <Image source={require('../../assets/fpt-university-logo.png')} style={{ width: 48, height: 30 }} contentFit="contain" /> : null}
      {!compact ? (
        <Wordmark size={centered ? 31 : 30} alum={alum} nect={nect} />
      ) : null}
    </View>
  )
}
