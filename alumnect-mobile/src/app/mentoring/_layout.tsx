import React from 'react'
import { Stack } from 'expo-router'
import { useMentoringTheme } from '@/theme/mentoringTheme'

export default function MentoringLayout() {
  const { colors } = useMentoringTheme()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'ios_from_right',
        animationDuration: 240,
      }}
    />
  )
}
