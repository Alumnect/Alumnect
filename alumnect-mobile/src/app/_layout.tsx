import React, { useEffect } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Text } from '@/components/AppText'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useFonts } from 'expo-font'
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular'
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium'
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold'
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold'
import { BeVietnamPro_800ExtraBold } from '@expo-google-fonts/be-vietnam-pro/800ExtraBold'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import Toast, { type ToastConfig } from 'react-native-toast-message'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/lib/toast'
import { authApi } from '@/api/auth'
import { useTheme, FONT } from '@/theme'
import { AlertTriangle, CheckCircle2, Info, XCircle } from '@/components/icons'
import { OfflineBanner } from '@/components/OfflineBanner'
import { startRealtime } from '@/lib/socket'

export { ErrorFallback as ErrorBoundary } from '@/components/ErrorFallback'

type ToastAction = { label: string; secondary?: boolean; onPress: () => void }
type AppToastTone = 'success' | 'error' | 'info' | 'warning'

function AppToast({ text, tone, actions = [] }: { text?: string; tone: AppToastTone; actions?: ToastAction[] }) {
  const t = useTheme()
  const styles = {
    success: { color: t.success, tint: t.successTint, Icon: CheckCircle2 },
    error: { color: t.danger, tint: t.dangerTint, Icon: XCircle },
    info: { color: t.info, tint: t.infoTint, Icon: Info },
    warning: { color: t.warning, tint: t.warningTint, Icon: AlertTriangle },
  }
  const { color, tint, Icon } = styles[tone]
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ width: '92%', maxWidth: 480, backgroundColor: t.card, borderRadius: 16, borderWidth: 1, borderColor: t.border, padding: 14, elevation: 8, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: tint }}>
          <Icon size={21} color={color} />
        </View>
        <Text style={{ flex: 1, color: t.text, fontSize: 14, lineHeight: 21, fontFamily: FONT.medium }} numberOfLines={3}>{text}</Text>
      </View>
      {actions.length ? <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
        {actions.map((a) => (
          <Pressable key={a.label} onPress={() => { Toast.hide(); a.onPress() }} style={{ flex: 1, minHeight: 42, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: a.secondary ? t.inputBg : t.primary }}>
            <Text style={{ color: a.secondary ? t.text : t.onPrimary, fontWeight: '700', fontSize: 13 }}>{a.label}</Text>
          </Pressable>
        ))}
      </View> : null}
    </View>
  )
}

const toastConfig: ToastConfig = {
  action: ({ text1, props }) => <AppToast text={text1} tone="info" actions={(props as { actions?: ToastAction[] }).actions ?? []} />,
  success: ({ text1 }) => <AppToast text={text1} tone="success" />,
  error: ({ text1 }) => <AppToast text={text1} tone="error" />,
  info: ({ text1 }) => <AppToast text={text1} tone="info" />,
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
      void authApi.revokeSession(useAuthStore.getState().refreshToken)
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
  // Giữ màn hình nền cho tới khi font tải xong để chữ không bị nhảy font; nếu lỗi thì dùng font hệ thống.
  const [fontsLoaded, fontError] = useFonts({
    [FONT.regular]: BeVietnamPro_400Regular,
    [FONT.medium]: BeVietnamPro_500Medium,
    [FONT.semibold]: BeVietnamPro_600SemiBold,
    [FONT.bold]: BeVietnamPro_700Bold,
    [FONT.extrabold]: BeVietnamPro_800ExtraBold,
  })
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: t.bg }} />
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style={t.isDark ? 'light' : 'dark'} />
          <AuthGate>
            <OfflineBanner />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg }, animation: 'slide_from_right' }} />
          </AuthGate>
          <Toast config={toastConfig} topOffset={50} />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
