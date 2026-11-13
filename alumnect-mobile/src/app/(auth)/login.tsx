import React, { useState } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { AuthButton, AuthFooterButton, AuthLink, AuthScaffold, OrDivider } from '@/components/AuthScaffold'
import { Button, Input } from '@/components/ui'
import { Lock, MailIcon } from '@/components/icons'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { getGoogleIdToken, isGoogleConfigured } from '@/lib/google'
import { toast, errMsg } from '@/lib/toast'
import { useTheme } from '@/theme'

/** Biểu tượng "G" nhiều màu theo nhận diện của Google, dùng trên nút đăng nhập bằng Google. */
function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </Svg>
  )
}

const ADMIN_MSG = 'Tài khoản Quản trị viên vui lòng sử dụng trên phiên bản Web máy tính để quản trị hệ thống.'

export default function LoginScreen() {
  const t = useTheme()
  const router = useRouter()
  const passwordRef = React.useRef<{ focus: () => void } | null>(null)
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const mutation = useMutation({
    mutationFn: (v: { email: string; password: string }) => authApi.login(v),
    onSuccess: async (data) => {
      if (data.user.role === 'ADMIN') {
        void authApi.revokeSession(data.refreshToken)
        toast.error(ADMIN_MSG)
        return
      }
      queryClient.clear()
      login(data)
      toast.success('Đăng nhập thành công!')
    },
    onError: (e) => toast.error(errMsg(e, 'Email hoặc mật khẩu không chính xác')),
  })

  // UC03: đăng nhập Google. Tài khoản chưa tồn tại (404) → chuyển sang đăng ký, điền sẵn thông tin.
  const google = useMutation({
    mutationFn: async () => {
      const idToken = await getGoogleIdToken()
      if (!idToken) return null
      try {
        return { idToken, auth: await authApi.loginWithGoogle(idToken) }
      } catch (e) {
        const err = e as Error & { status?: number; data?: { error?: number; data?: { email?: string; fullName?: string } } }
        if (err.status === 404 || err.data?.error === 404) {
          const meta = err.data?.data
          router.push({ pathname: '/(auth)/register', params: { googleToken: idToken, email: meta?.email ?? '', fullName: meta?.fullName ?? '' } })
          return null
        }
        throw e
      }
    },
    onSuccess: (res) => {
      if (!res) return
      if (res.auth.user.role === 'ADMIN') {
        void authApi.revokeSession(res.auth.refreshToken)
        toast.error(ADMIN_MSG)
        return
      }
      queryClient.clear()
      login(res.auth)
      toast.success('Đăng nhập thành công!')
    },
    onError: (e) => toast.error(errMsg(e, 'Không thể đăng nhập bằng Google. Vui lòng thử lại.')),
  })

  const submit = (v = { email: email.trim(), password }) => {
    const next: typeof errors = {}
    if (!v.email) next.email = 'Email không được để trống'
    else if (!/^\S+@\S+\.\S+$/.test(v.email)) next.email = 'Email không hợp lệ'
    if (!v.password) next.password = 'Mật khẩu không được để trống'
    setErrors(next)
    if (Object.keys(next).length) return
    mutation.mutate(v)
  }

  const googleOn = isGoogleConfigured()

  return (
    <AuthScaffold footer={<AuthFooterButton title="Tạo tài khoản mới" onPress={() => router.push('/(auth)/register')} />}>
      <Input
        variant="float"
        icon={<MailIcon size={20} />}
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="username"
        keyboardType="email-address"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        submitBehavior="submit"
        error={errors.email}
      />
      <Input
        variant="float"
        icon={<Lock size={20} />}
        label="Mật khẩu"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={() => submit()}
        inputRef={(r) => { passwordRef.current = r }}
        error={errors.password}
      />
      <View style={{ marginTop: 6 }}>
        <AuthButton title="Đăng nhập" onPress={() => submit()} loading={mutation.isPending} />
      </View>
      <View style={{ marginTop: 6, marginBottom: 2 }}>
        <AuthLink title="Quên mật khẩu?" onPress={() => router.push('/(auth)/forgot-password')} />
      </View>
      {googleOn ? <OrDivider /> : null}
      {googleOn ? (
        <View style={{ marginTop: 2 }}>
          <Button
            title="Tiếp tục với Google"
            variant="outline"
            size="lg"
            icon={<GoogleMark />}
            onPress={() => google.mutate()}
            loading={google.isPending}
            style={{ borderRadius: 999, minHeight: 48 }}
          />
        </View>
      ) : null}
    </AuthScaffold>
  )
}
