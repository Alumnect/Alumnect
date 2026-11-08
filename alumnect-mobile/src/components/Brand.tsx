import React from 'react'
import { View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Text } from './AppText'
import { useTheme } from '@/theme'

/** The existing FPT University identity, paired with the Alumnect name. */
export function Brand({ compact = false, centered = false }: { compact?: boolean; centered?: boolean }) {
  const t = useTheme()
  const { width } = useWindowDimensions()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: centered ? 'center' : 'flex-start', gap: 10 }} accessibilityLabel="Alumnect · FPT University">
      {!centered && (width >= 360 || compact) ? <Image source={require('../../assets/fpt-university-logo.png')} style={{ width: 48, height: 30 }} contentFit="contain" /> : null}
      {!compact ? (
        // Giống logo web: chữ viết tay Caveat, "Alum" xanh FPT và "Nect" cam.
        <Text style={{ fontFamily: 'Caveat_700Bold', fontSize: centered ? 31 : 30, lineHeight: centered ? 35 : 34, includeFontPadding: false }}>
          <Text style={{ fontFamily: 'Caveat_700Bold', color: t.isDark ? '#7CB7FF' : '#004F9E' }}>Alum</Text>
          <Text style={{ fontFamily: 'Caveat_700Bold', color: t.isDark ? '#FF8C38' : '#C2410C' }}>Nect</Text>
        </Text>
      ) : null}
    </View>
  )
}
