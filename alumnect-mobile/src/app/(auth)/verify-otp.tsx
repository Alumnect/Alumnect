import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input, Txt } from '@/components/ui'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'

export default function VerifyOtpScreen() {
  const router = useRouter()
  const { email, role } = useLocalSearchParams<{ email: string; role?: string }>()
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(60)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const verify = useMutation({
    mutationFn: () => authApi.verifyEmail(email!, otp),
    onSuccess: () => {
      toast.success('Xác thực email thành công! Đang chuyển hướng...')
      if (role === 'ALUMNI') toast.info('Tài khoản cựu sinh viên của bạn đang chờ quản trị viên phê duyệt.')
      router.replace('/(auth)/login')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const resend = useMutation({
    mutationFn: () => authApi.resendOtp(email!),
    onSuccess: () => {
      toast.success('Đã gửi lại mã OTP.')
      setCooldown(60)
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    if (!otp) return setError('Mã OTP không được để trống')
    if (otp.length !== 6) return setError('Mã OTP phải có đúng 6 chữ số')
    setError('')
    verify.mutate()
  }

  return (
    <AuthScaffold title="Xác thực email" subtitle={`Nhập mã OTP 6 chữ số đã gửi tới ${email ?? 'email của bạn'}`}>
      <Input label="Mã OTP" value={otp} onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} error={error} placeholder="••••••" />
      <Button title="Xác nhận" onPress={submit} loading={verify.isPending} />
      <Button
        title={cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
        variant="ghost"
        disabled={cooldown > 0}
        loading={resend.isPending}
        onPress={() => resend.mutate()}
        style={{ marginTop: 8 }}
      />
      <Txt muted size={12} style={{ textAlign: 'center', marginTop: 12 }}>Kiểm tra cả hộp thư rác nếu chưa thấy email.</Txt>
    </AuthScaffold>
  )
}
