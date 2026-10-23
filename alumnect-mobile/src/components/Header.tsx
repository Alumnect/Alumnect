import React from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronLeft } from 'lucide-react-native'
import { Txt } from './ui'
import { useTheme } from '@/theme'

export function Header({ title, right }: { title: string; right?: React.ReactNode }) {
  const t = useTheme()
  const router = useRouter()
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 52, borderBottomWidth: 1, borderBottomColor: t.border, backgroundColor: t.bg }}>
      <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 36 }} accessibilityRole="button" accessibilityLabel="Quay lại">
        <ChevronLeft size={26} color={t.text} />
      </Pressable>
      <Txt size={17} weight="700" style={{ flex: 1 }} numberOfLines={1}>{title}</Txt>
      {right}
    </View>
  )
}
