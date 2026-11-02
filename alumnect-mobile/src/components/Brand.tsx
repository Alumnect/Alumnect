import React from 'react'
import { View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { Text } from './AppText'
import { useTheme } from '@/theme'

/** The existing FPT University identity, paired with the Alumnect name. */
export function Brand({ compact = false }: { compact?: boolean }) {
  const t = useTheme()
  const { width } = useWindowDimensions()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityLabel="Alumnect · FPT University">
      {width >= 360 || compact ? <Image source={require('../../assets/fpt-university-logo.png')} style={{ width: 48, height: 30 }} contentFit="contain" /> : null}
      {!compact ? <Text style={{ fontSize: 22, lineHeight: 30, fontWeight: '700', color: t.text, letterSpacing: -0.7 }}>alumnect<Text style={{ color: t.primary }}>.</Text></Text> : null}
    </View>
  )
}
