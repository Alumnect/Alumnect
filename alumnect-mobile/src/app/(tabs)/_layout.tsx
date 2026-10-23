import React from 'react'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { GraduationCap, HelpCircle, Home, Users } from '@/components/icons'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { FONT, useTheme } from '@/theme'

function ProfileIcon({ focused, size }: { focused: boolean; size: number }) {
  const t = useTheme()
  const user = useAuthStore((s) => s.user)
  return (
    <View style={{ padding: 1.5, borderRadius: size, borderWidth: 2, borderColor: focused ? t.primary : 'transparent' }}>
      <Avatar uri={user?.avatarUrl} name={user?.name} size={size - 3} />
    </View>
  )
}

/** Icon tab: viền mảnh khi chưa chọn, đặc khi đang chọn (dễ nhận biết hơn đổi màu đơn thuần, kể cả với người khó phân biệt màu). */
const tabIcon = (Icon: typeof Home) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return <Icon color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />
  }

export default function TabsLayout() {
  const t = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth, elevation: 0, height: undefined, paddingTop: 6 },
        tabBarLabelStyle: { fontFamily: FONT.semibold, fontSize: 11, marginBottom: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bảng tin', tabBarIcon: tabIcon(Home) }} />
      <Tabs.Screen name="network" options={{ title: 'Mạng lưới', tabBarIcon: tabIcon(Users) }} />
      <Tabs.Screen name="mentoring" options={{ title: 'Cố vấn', tabBarIcon: tabIcon(GraduationCap) }} />
      <Tabs.Screen name="forum" options={{ title: 'Hỏi đáp', tabBarIcon: tabIcon(HelpCircle) }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} size={26} /> }} />
    </Tabs>
  )
}
