import React from 'react'
import { View } from 'react-native'
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
        <Text style={{ ...font, color: nect }}>{'Nect\u00A0\u00A0'}</Text>
      </Text>
    </View>
  )
}

/** Biểu tượng thương hiệu AlumNect: Chữ viết tay "AlumNect" (Caveat). */
export function Brand({ compact = false, centered = false, stacked = false }: { compact?: boolean; centered?: boolean; stacked?: boolean }) {
  const t = useTheme()
  const alum = t.isDark ? '#7CB7FF' : '#004F9E'
  const nect = t.isDark ? '#FF8C38' : '#C2410C'

  if (stacked) {
    // Bản lớn ở đầu màn đăng nhập
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Alumnect">
        <Wordmark size={44} alum={alum} nect={nect} />
      </View>
    )
  }

  if (centered) {
    // Bản giữa trên thanh topbar: Chữ AlumNect thanh thoát, không kèm logo vuông
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }} accessibilityLabel="Alumnect">
        <Wordmark size={32} alum={alum} nect={nect} />
      </View>
    )
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }} accessibilityLabel="Alumnect">
      <Wordmark size={compact ? 24 : 28} alum={alum} nect={nect} />
    </View>
  )
}
