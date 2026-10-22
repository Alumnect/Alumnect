import React, { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import Toast, { BaseToast, ErrorToast, type ToastConfig } from 'react-native-toast-message'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/lib/toast'
import { useTheme, palette } from '@/theme'
import { OfflineBanner } from '@/components/OfflineBanner'
import { startRealtime } from '@/lib/socket'

const toastConfig: ToastConfig = {
  success: (p) => <BaseToast {...p} style={{ borderLeftColor: palette.success }} text1Style={{ fontSize: 14 }} text1NumberOfLines={3} />,
  error: (p) => <ErrorToast {...p} style={{ borderLeftColor: palette.danger }} text1Style={{ fontSize: 14 }} text1NumberOfLines={3} />,
  info: (p) => <BaseToast {...p} style={{ borderLeftColor: palette.info }} text1Style={{ fontSize: 14 }} text1NumberOfLines={3} />,
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const { hydrated, isAuthenticated, user, logout } = useAuthStore()
  const t = useTheme()

  useEffect(() => {
    void useAuthStore.getState().hydrate()
  }, [])

  useEffect(() => startRealtime(), [])

  useEffect(() => {
    if (!hydrated) return
    // Admin chỉ dùng được trên Web.
    if (isAuthenticated && user?.role === 'ADMIN') {
      toast.error('Tài khoản Quản trị viên vui lòng sử dụng trên phiên bản Web máy tính để quản trị hệ thống.')
      logout()
      return
    }
    const inAuth = segments[0] === '(auth)'
    if (!isAuthenticated && !inAuth) router.replace('/(auth)/login')
    else if (isAuthenticated && inAuth) router.replace('/(tabs)')
  }, [hydrated, isAuthenticated, user, segments, router, logout])

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    )
  }
  return <>{children}</>
}

export default function RootLayout() {
  const t = useTheme()
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={t.isDark ? 'light' : 'dark'} />
          <AuthGate>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />
          </AuthGate>
          <Toast config={toastConfig} topOffset={50} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
