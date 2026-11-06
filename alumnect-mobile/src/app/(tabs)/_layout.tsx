import React from 'react'
import { Tabs, useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { GraduationCap, HelpCircle, Home, Plus, Users } from '@/components/icons'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
    return <Icon color={color as string} size={24} weight={focused ? 'fill' : 'regular'} />
  }

/** Nút tạo bài ở giữa thanh tab: ô bo tròn màu cam nổi bật, bấm mở màn đăng bài (không phải một tab thật). */
function CreateIcon() {
  const t = useTheme()
  return (
    <View style={{ width: 40, height: 30, borderRadius: 10, backgroundColor: t.primary, alignItems: 'center', justifyContent: 'center' }}>
      <Plus size={20} color={t.onPrimary} weight="bold" />
    </View>
  )
}

export default function TabsLayout() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: { backgroundColor: t.card, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth, elevation: 0, height: 52 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) },
        tabBarIconStyle: { width: 28, height: 28 },
        tabBarItemStyle: { minHeight: 44 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bảng tin', tabBarIcon: tabIcon(Home) }} />
      <Tabs.Screen name="network" options={{ title: 'Mạng lưới', tabBarLabel: 'Kết nối', tabBarAccessibilityLabel: 'Mạng lưới', tabBarIcon: tabIcon(Users) }} />
      <Tabs.Screen
        name="create"
        options={{ title: 'Tạo bài viết', tabBarAccessibilityLabel: 'Tạo bài viết', tabBarIcon: () => <CreateIcon /> }}
        listeners={{ tabPress: (e) => { e.preventDefault(); router.push('/post/create') } }}
      />
      <Tabs.Screen name="mentoring" options={{ title: 'Cố vấn', tabBarIcon: tabIcon(GraduationCap) }} />
      <Tabs.Screen name="forum" options={{ title: 'Hỏi đáp', tabBarIcon: tabIcon(HelpCircle) }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} size={26} /> }} />
    </Tabs>
  )
}
