import React, { useState } from 'react'
import { View } from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input, Txt } from '@/components/ui'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { getGoogleIdToken, isGoogleConfigured } from '@/lib/google'
import { toast, errMsg } from '@/lib/toast'
import { palette } from '@/theme'

const CRED_KEY = 'alumnect.biometric.cred'

const ADMIN_MSG = 'Tài khoản Quản trị viên vui lòng sử dụng trên phiên bản Web máy tính để quản trị hệ thống.'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [hasBio, setHasBio] = useState(false)

  React.useEffect(() => {
    void (async () => {
      if (!(await SecureStore.isAvailableAsync())) return
      const [hw, enrolled, cred] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync(CRED_KEY),
      ])
      setHasBio(hw && enrolled && !!cred)
    })().catch(() => setHasBio(false))
  }, [])

  const mutation = useMutation({
    mutationFn: (v: { email: string; password: string }) => authApi.login(v),
    onSuccess: async (data, v) => {
      if (data.user.role === 'ADMIN') {
        void authApi.revokeSession(data.refreshToken)
        toast.error(ADMIN_MSG)
        return
      }
      queryClient.clear()
      // Lưu thông tin để mở khóa nhanh bằng sinh trắc học lần sau.
      SecureStore.setItemAsync(CRED_KEY, JSON.stringify(v)).catch(() => {})
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

  const biometric = async () => {
    const res = await LocalAuthentication.authenticateAsync({ promptMessage: 'Mở khóa Alumnect' })
    if (!res.success) return
    const raw = await SecureStore.getItemAsync(CRED_KEY)
    if (raw) submit(JSON.parse(raw))
  }

  return (
    <AuthScaffold title="Đăng nhập" subtitle="Chào mừng trở lại cộng đồng cựu sinh viên FPTU">
      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} placeholder="you@fpt.edu.vn" />
      <Input label="Mật khẩu" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} placeholder="••••••••" />
      <Link href="/(auth)/forgot-password" style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
        <Txt color={palette.primary} weight="600" size={13}>Quên mật khẩu?</Txt>
      </Link>
      <Button title="Đăng nhập" onPress={() => submit()} loading={mutation.isPending} />
      {isGoogleConfigured() || hasBio ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.primary + '22' }} />
          <Txt muted size={12}>hoặc</Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: palette.primary + '22' }} />
        </View>
      ) : null}
      {isGoogleConfigured() ? (
        <Button title="Tiếp tục với Google" variant="outline" icon={<Txt size={16} weight="800" color="#4285F4">G</Txt>} onPress={() => google.mutate()} loading={google.isPending} />
      ) : null}
      {hasBio ? <Button title="Đăng nhập bằng vân tay / khuôn mặt" variant="outline" onPress={biometric} style={{ marginTop: 12 }} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
        <Txt muted>Chưa có tài khoản?</Txt>
        <Link href="/(auth)/register"><Txt color={palette.primary} weight="700">Đăng ký</Txt></Link>
      </View>
    </AuthScaffold>
  )
}
