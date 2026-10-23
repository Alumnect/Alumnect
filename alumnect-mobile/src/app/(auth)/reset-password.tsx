import React, { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input } from '@/components/ui'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const { email, token } = useLocalSearchParams<{ email: string; token: string }>()
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<{ pw?: string; confirm?: string }>({})

  const reset = useMutation({
    mutationFn: () => authApi.resetPassword({ email: email!, token: token!, newPassword: pw }),
    onSuccess: () => {
      toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.')
      router.replace('/(auth)/login')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: typeof errors = {}
    if (!pw) e.pw = 'Mật khẩu mới không được để trống'
    else if (pw.length < 8) e.pw = 'Mật khẩu phải có độ dài từ 8 đến 100 ký tự'
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(pw)) e.pw = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'
    if (!confirm) e.confirm = 'Xác nhận mật khẩu không được để trống'
    else if (confirm !== pw) e.confirm = 'Mật khẩu xác nhận không trùng khớp'
    setErrors(e)
    if (!Object.keys(e).length) reset.mutate()
  }

  return (
    <AuthScaffold title="Đặt lại mật khẩu" subtitle="Tạo mật khẩu mới cho tài khoản của bạn">
      <Input label="Mật khẩu mới" value={pw} onChangeText={setPw} secureTextEntry error={errors.pw} />
      <Input label="Xác nhận mật khẩu" value={confirm} onChangeText={setConfirm} secureTextEntry error={errors.confirm} />
      <Button title="Đặt lại mật khẩu" onPress={submit} loading={reset.isPending} />
    </AuthScaffold>
  )
}
