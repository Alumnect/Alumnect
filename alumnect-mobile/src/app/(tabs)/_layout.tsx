import React from 'react'
import { Tabs } from 'expo-router'
import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'
import { HelpCircle, Home, Handshake, User, Users } from 'lucide-react-native'
import { useTheme } from '@/theme'

export default function TabsLayout() {
  const t = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarStyle: { position: 'absolute', borderTopColor: t.border, backgroundColor: 'transparent', elevation: 0 },
        tabBarBackground: () => <BlurView intensity={80} tint={t.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bảng tin', tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }} />
      <Tabs.Screen name="network" options={{ title: 'Mạng lưới', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Tabs.Screen name="forum" options={{ title: 'Hỏi đáp', tabBarIcon: ({ color, size }) => <HelpCircle color={color} size={size} /> }} />
      <Tabs.Screen name="mentoring" options={{ title: 'Cố vấn', tabBarIcon: ({ color, size }) => <Handshake color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Cá nhân', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tabs>
  )
}
