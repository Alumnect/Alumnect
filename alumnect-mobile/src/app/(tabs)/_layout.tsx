import React, { useEffect, useRef, useState } from 'react'
import { Tabs } from 'expo-router'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import { CreativeNavGlyph, type NavTabKey } from '@/components/FeedNavIcons'
import { Avatar } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useTheme } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { dealApi } from '@/api/mentoringFlow'
import { chatApi } from '@/api/chat'

/** Chấm báo trên tab Cố vấn: có tin nhắn mentoring chưa đọc hoặc thỏa thuận chờ bạn xác nhận / thanh toán (dùng chung cache với mục "Của tôi"). */
function useMentoringAttention() {
  const authed = useAuthStore((s) => s.isAuthenticated)
  const conv = useQuery({ queryKey: ['conversations', 'mentoring'], queryFn: () => chatApi.conversations('primary', 'MENTORING'), enabled: authed, staleTime: 60_000, refetchInterval: 60_000 })
  const deals = useQuery({ queryKey: ['mentoring-deals', 'hub'], queryFn: () => dealApi.mine(undefined, 0), enabled: authed, staleTime: 60_000 })
  const unread = (conv.data?.data ?? []).some((c) => (c.unreadCount ?? 0) > 0)
  const pending = (deals.data?.content ?? []).some((d) => d.canPay || d.canConfirm)
  return unread || pending
}

function AnimatedTabWrap({
  focused,
  pulse = 0,
  children,
}: {
  focused: boolean
  pulse?: number
  children: React.ReactNode
}) {
  const t = useTheme()
  const scale = useRef(new Animated.Value(focused ? 1.12 : 1)).current
  const lift = useRef(new Animated.Value(focused ? -2 : 0)).current
  const tilt = useRef(new Animated.Value(0)).current
  const dot = useRef(new Animated.Value(focused ? 1 : 0)).current
  const halo = useRef(new Animated.Value(focused ? 1 : 0)).current
  const ripple = useRef(new Animated.Value(0)).current
  const [rippling, setRippling] = useState(false)

  useEffect(() => {
    if (focused || pulse > 0) {
      scale.setValue(0.76)
      tilt.setValue(-1)
      setRippling(true)
      ripple.setValue(0)
      Animated.timing(ripple, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRippling(false)
      })
    }

    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.12 : 1,
        friction: 4,
        tension: 190,
        useNativeDriver: true,
      }),
      Animated.spring(lift, {
        toValue: focused ? -2 : 0,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.spring(tilt, {
        toValue: 0,
        friction: 3.5,
        tension: 200,
        useNativeDriver: true,
      }),
      Animated.spring(halo, {
        toValue: focused ? 1 : 0,
        friction: 6,
        tension: 160,
        useNativeDriver: true,
      }),
      Animated.timing(dot, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [focused, pulse, scale, lift, tilt, dot, halo, ripple])

  const rotate = tilt.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-14deg', '0deg', '14deg'],
  })

  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.9],
  })
  const rippleOpacity = ripple.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.65, 0.4, 0],
  })

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 3 }}>
      <View style={{ width: 44, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        {/* Nền hào quang mềm khi tab đang chọn */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 42,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.primaryTint,
            opacity: halo,
            transform: [{ scale: halo }],
          }}
        />
        {/* Vòng sóng lan toả khi chạm */}
        {rippling && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              borderColor: t.primary,
              opacity: rippleOpacity,
              transform: [{ scale: rippleScale }],
            }}
          />
        )}
        <Animated.View style={{ transform: [{ translateY: lift }, { scale }, { rotate }] }}>
          {children}
        </Animated.View>
      </View>

      <Animated.View
        style={{
          width: 16,
          height: 3.5,
          borderRadius: 2,
          backgroundColor: t.primary,
          opacity: dot,
          transform: [{ scaleX: dot }],
        }}
      />
    </View>
  )
}

function ProfileIcon({ focused, pulse, size }: { focused: boolean; pulse: number; size: number }) {
  const t = useTheme()
  const user = useAuthStore((s) => s.user)
  return (
    <AnimatedTabWrap focused={focused} pulse={pulse}>
      <View
        style={{
          padding: 1.5,
          borderRadius: size,
          borderWidth: 2,
          borderColor: focused ? t.primary : t.border,
          backgroundColor: t.card,
        }}
      >
        <Avatar uri={user?.avatarUrl} name={user?.name} size={size - 4} />
      </View>
    </AnimatedTabWrap>
  )
}

export default function TabsLayout() {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const [pulses, setPulses] = useState<Record<string, number>>({})

  const bumpPulse = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setPulses((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }))
  }

  const mentoringAttention = useMentoringAttention()

  const makeNavIcon = (tab: NavTabKey) =>
    function TabIcon({ focused }: { color: unknown; focused: boolean }) {
      return (
        <AnimatedTabWrap focused={focused} pulse={pulses[tab] ?? 0}>
          <CreativeNavGlyph tab={tab} focused={focused} size={26} />
          {tab === 'mentoring' && mentoringAttention ? (
            <View style={{ position: 'absolute', top: -2, right: -4, width: 9, height: 9, borderRadius: 4.5, backgroundColor: t.primary, borderWidth: 1.5, borderColor: t.card }} />
          ) : null}
        </AnimatedTabWrap>
      )
    }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: t.bg },
        animation: 'fade',
        tabBarActiveTintColor: t.text,
        tabBarInactiveTintColor: t.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: t.card,
          borderTopColor: t.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
          height: 62 + insets.bottom,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 6,
        },
        tabBarIconStyle: { width: 44, height: 40 },
        tabBarItemStyle: { flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        listeners={{ tabPress: () => bumpPulse('home') }}
        options={{
          title: 'Bảng tin',
          tabBarAccessibilityLabel: 'Bảng tin',
          tabBarIcon: makeNavIcon('home'),
        }}
      />
      <Tabs.Screen
        name="network"
        listeners={{ tabPress: () => bumpPulse('network') }}
        options={{
          title: 'Mạng lưới',
          tabBarLabel: 'Kết nối',
          tabBarAccessibilityLabel: 'Mạng lưới',
          tabBarIcon: makeNavIcon('network'),
        }}
      />
      <Tabs.Screen
        name="map"
        listeners={{ tabPress: () => bumpPulse('map') }}
        options={{
          title: 'Bản đồ',
          tabBarAccessibilityLabel: 'Bản đồ cựu sinh viên',
          tabBarIcon: makeNavIcon('map'),
        }}
      />
      <Tabs.Screen
        name="mentoring"
        listeners={{ tabPress: () => bumpPulse('mentoring') }}
        options={{
          title: 'Cố vấn',
          tabBarAccessibilityLabel: 'Cố vấn',
          tabBarIcon: makeNavIcon('mentoring'),
        }}
      />
      <Tabs.Screen
        name="forum"
        listeners={{ tabPress: () => bumpPulse('forum') }}
        options={{
          title: 'Hỏi đáp',
          tabBarAccessibilityLabel: 'Hỏi đáp',
          tabBarIcon: makeNavIcon('forum'),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{ tabPress: () => bumpPulse('profile') }}
        options={{
          title: 'Cá nhân',
          tabBarAccessibilityLabel: 'Cá nhân',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} pulse={pulses.profile ?? 0} size={28} />,
        }}
      />
    </Tabs>
  )
}
