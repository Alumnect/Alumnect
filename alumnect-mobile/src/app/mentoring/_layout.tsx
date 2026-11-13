import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Stack, usePathname } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { MentoringTermsGate } from '@/components/MentoringTermsGate'
import { mentoringApi } from '@/api/mentoring'

export default function MentoringLayout() {
  const { colors } = useMentoringTheme()
  const pathname = usePathname()
  const terms = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus, staleTime: 60_000 })
  // Giống Web: mọi màn hình Mentoring yêu cầu đã đồng ý điều khoản (trừ chính trang điều khoản).
  // Cổng được phủ lên trên Stack để không làm mất trạng thái điều hướng khi mở trang điều khoản.
  const gated = !terms.data?.accepted && pathname !== '/mentoring/terms'
  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'ios_from_right',
          animationDuration: 240,
        }}
      />
      {gated ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]}>
          <MentoringTermsGate>{null}</MentoringTermsGate>
        </View>
      ) : null}
    </View>
  )
}
