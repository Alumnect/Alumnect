import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [error, setError] = useState('')

  const send = useMutation({
    mutationFn: () => authApi.forgotPassword({ email: email.trim() }),
    onSuccess: () => {
      toast.success('Đã gửi mã OTP khôi phục mật khẩu tới email của bạn.')
      setStep('otp')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const verify = useMutation({
    mutationFn: () => authApi.verifyResetOtp({ email: email.trim(), token: otp }),
    onSuccess: () => router.replace({ pathname: '/(auth)/reset-password', params: { email: email.trim(), token: otp } }),
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    if (step === 'email') {
      if (!email.trim()) return setError('Email không được để trống')
      if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Email không hợp lệ')
      setError('')
      send.mutate()
    } else {
      if (otp.length !== 6) return setError('Mã OTP phải có đúng 6 chữ số')
      setError('')
      verify.mutate()
    }
  }

  return (
    <AuthScaffold title="Quên mật khẩu" subtitle={step === 'email' ? 'Nhập email để nhận mã OTP' : `Nhập mã OTP đã gửi tới ${email}`}>
      {step === 'email' ? (
        <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={error} />
      ) : (
        <Input label="Mã OTP" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} error={error} />
      )}
      <Button title={step === 'email' ? 'Gửi mã OTP' : 'Xác minh'} onPress={submit} loading={send.isPending || verify.isPending} />
      <Button title="Quay lại đăng nhập" variant="ghost" onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 8 }} />
    </AuthScaffold>
  )
}
