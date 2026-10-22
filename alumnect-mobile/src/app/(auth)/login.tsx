import React, { useState } from 'react'
import { View } from 'react-native'
import { Link } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input, Txt } from '@/components/ui'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { toast, errMsg } from '@/lib/toast'

const CRED_KEY = 'alumnect.biometric.cred'

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [hasBio, setHasBio] = useState(false)

  React.useEffect(() => {
    void (async () => {
      const [hw, enrolled, cred] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync(CRED_KEY),
      ])
      setHasBio(hw && enrolled && !!cred)
    })()
  }, [])

  const mutation = useMutation({
    mutationFn: (v: { email: string; password: string }) => authApi.login(v),
    onSuccess: async (data, v) => {
      if (data.user.role === 'ADMIN') {
        toast.error('Tài khoản Quản trị viên vui lòng sử dụng trên phiên bản Web máy tính để quản trị hệ thống.')
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
        <Txt color="#F27124" weight="600" size={13}>Quên mật khẩu?</Txt>
      </Link>
      <Button title="Đăng nhập" onPress={() => submit()} loading={mutation.isPending} />
      {hasBio ? <Button title="Đăng nhập bằng vân tay / khuôn mặt" variant="outline" onPress={biometric} style={{ marginTop: 12 }} /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
        <Txt muted>Chưa có tài khoản?</Txt>
        <Link href="/(auth)/register"><Txt color="#F27124" weight="700">Đăng ký</Txt></Link>
      </View>
    </AuthScaffold>
  )
}
