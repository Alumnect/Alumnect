import React, { useState } from 'react'
import {  } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { Button, Input, Screen } from '@/components/ui'
import { Header } from '@/components/Header'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const [f, setF] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const m = useMutation({
    mutationFn: () => authApi.changePassword(f),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.oldPassword) e.oldPassword = 'Mật khẩu hiện tại không được để trống'
    if (!f.newPassword) e.newPassword = 'Mật khẩu mới không được để trống'
    else if (f.newPassword.length < 8) e.newPassword = 'Mật khẩu phải có độ dài từ 8 đến 100 ký tự'
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(f.newPassword)) e.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'
    if (f.confirmNewPassword !== f.newPassword) e.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  return (
    <Screen keyboard>
      <Header title="Đổi mật khẩu" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Input label="Mật khẩu hiện tại" value={f.oldPassword} onChangeText={set('oldPassword')} secureTextEntry error={errors.oldPassword} />
        <Input label="Mật khẩu mới" value={f.newPassword} onChangeText={set('newPassword')} secureTextEntry error={errors.newPassword} />
        <Input label="Xác nhận mật khẩu mới" value={f.confirmNewPassword} onChangeText={set('confirmNewPassword')} secureTextEntry error={errors.confirmNewPassword} />
        <Button title="Đổi mật khẩu" onPress={submit} loading={m.isPending} />
      </ScrollView>
    </Screen>
  )
}
