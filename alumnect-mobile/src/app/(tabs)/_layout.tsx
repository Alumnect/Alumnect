import React, { useEffect, useState } from 'react'
import { Tabs } from 'expo-router'
import { Animated, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { GraduationCap, HelpCircle, Home, Map, Users } from '@/components/icons'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function AnimatedTabWrap({ focused, pulse = 0, children }: { focused: boolean; pulse?: number; children: React.ReactNode }) {
  const t = useTheme()
  const [scale] = useState(() => new Animated.Value(focused ? 1.1 : 1))
  const [dot] = useState(() => new Animated.Value(focused ? 1 : 0))

  useEffect(() => {
    if (pulse > 0 && focused) {
      scale.setValue(0.86)
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(dot, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start()
  }, [focused, pulse, scale, dot])

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
      <Animated.View
        style={{
          width: 14,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: t.primary,
          opacity: dot,
          transform: [{ scaleX: dot }],
        }}
      />
    </View>
  )
}

function ProfileIcon({ focused, size }: { focused: boolean; size: number }) {
  const t = useTheme()
  const user = useAuthStore((s) => s.user)
  return (
    <AnimatedTabWrap focused={focused}>
      <View style={{ padding: 1.5, borderRadius: size, borderWidth: 2, borderColor: focused ? t.primary : 'transparent' }}>
        <Avatar uri={user?.avatarUrl} name={user?.name} size={size - 3} />
      </View>
    </AnimatedTabWrap>
  )
}

/** Icon tab: viền mảnh khi chưa chọn, đặc khi đang chọn, kèm hiệu ứng nhún nhẹ và gạch chân cam. */
const tabIcon = (Icon: typeof Home) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    return (
      <AnimatedTabWrap focused={focused}>
        <Icon color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />
      </AnimatedTabWrap>
    )
  }

export default function TabsLayout() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [homePulse, setHomePulse] = useState(0)
  const onTabPress = () => {
    Haptics.selectionAsync().catch(() => {})
  }
  return (
    <Tabs
      screenListeners={{
        tabPress: onTabPress,
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 6,
        },
        tabBarIconStyle: { width: 32, height: 34 },
        tabBarItemStyle: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{
          tabPress: () => setHomePulse((n) => n + 1),
        }}
        options={{
          title: 'Bảng tin',
          tabBarAccessibilityLabel: 'Bảng tin',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabWrap focused={focused} pulse={homePulse}>
              <Home color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />
            </AnimatedTabWrap>
          ),
        }}
      />
      <Tabs.Screen name="network" options={{ title: 'Mạng lưới', tabBarLabel: 'Kết nối', tabBarAccessibilityLabel: 'Mạng lưới', tabBarIcon: tabIcon(Users) }} />
      <Tabs.Screen name="map" options={{ title: 'Bản đồ', tabBarAccessibilityLabel: 'Bản đồ cựu sinh viên', tabBarIcon: tabIcon(Map) }} />
      <Tabs.Screen name="mentoring" options={{ title: 'Cố vấn', tabBarAccessibilityLabel: 'Cố vấn', tabBarIcon: tabIcon(GraduationCap) }} />
      <Tabs.Screen name="forum" options={{ title: 'Hỏi đáp', tabBarAccessibilityLabel: 'Hỏi đáp', tabBarIcon: tabIcon(HelpCircle) }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarAccessibilityLabel: 'Cá nhân', tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} size={28} /> }} />
    </Tabs>
  )
}
