import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { Button, Input, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BottomBar } from '@/components/DetailBits'
import { Check, Lock } from '@/components/icons'
import { Enter } from '@/components/Motion'
import { useTheme } from '@/theme'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'

export default function ChangePasswordScreen() {
  const router = useRouter()
  const t = useTheme()
  const [f, setF] = useState({ oldPassword: '', newPassword: '', confirmNewPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }))
    setErrors((p) => ({ ...p, [k]: '', ...(k === 'newPassword' ? { confirmNewPassword: '' } : {}) }))
  }
  const rules = [
    { label: 'Từ 8 đến 100 ký tự', ok: f.newPassword.length >= 8 && f.newPassword.length <= 100 },
    { label: 'Có chữ cái và chữ số', ok: /[A-Za-z]/.test(f.newPassword) && /\d/.test(f.newPassword) },
    { label: 'Khác mật khẩu hiện tại', ok: !!f.newPassword && f.newPassword !== f.oldPassword },
  ]

  const m = useMutation({
    mutationFn: () => authApi.changePassword(f),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!')
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    if (m.isPending) return
    const e: Record<string, string> = {}
    if (!f.oldPassword) e.oldPassword = 'Mật khẩu hiện tại không được để trống'
    if (!f.newPassword) e.newPassword = 'Mật khẩu mới không được để trống'
    else if (f.newPassword.length < 8 || f.newPassword.length > 100) e.newPassword = 'Mật khẩu phải có độ dài từ 8 đến 100 ký tự'
    else if (!/^(?=.*[A-Za-z])(?=.*\d).+$/.test(f.newPassword)) e.newPassword = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'
    else if (f.newPassword === f.oldPassword) e.newPassword = 'Hãy chọn mật khẩu khác mật khẩu hiện tại'
    if (f.confirmNewPassword !== f.newPassword) e.confirmNewPassword = 'Mật khẩu xác nhận không trùng khớp'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  return (
    <Screen keyboard bg={t.card}>
      <Header title="Đổi mật khẩu" />
      <ScrollView contentContainerStyle={{ padding: 24, gap: 6 }}>
        <Enter>
          <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: t.isDark ? '#302540' : '#F0EAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            <Lock size={30} color={t.isDark ? '#C4A7FF' : '#7250A2'} />
          </View>
          <Txt size={24} weight="700">An tâm kết nối.</Txt>
          <Txt muted size={13} style={{ lineHeight: 21, marginTop: 6, marginBottom: 26 }}>Một mật khẩu riêng cho Alumnect giúp bảo vệ những kết nối của bạn.</Txt>
        </Enter>
        <Input label="Mật khẩu hiện tại" placeholder="Nhập mật khẩu đang dùng" value={f.oldPassword} onChangeText={set('oldPassword')} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!m.isPending} error={errors.oldPassword} />
        <Input label="Mật khẩu mới" placeholder="Tạo mật khẩu mới" value={f.newPassword} onChangeText={set('newPassword')} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={100} editable={!m.isPending} error={errors.newPassword} />
        <View style={{ gap: 8, marginTop: -8, marginBottom: 22 }} accessibilityLiveRegion="polite">
          {rules.map((rule) => <View key={rule.label} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: rule.ok ? t.primaryTint : t.surface, alignItems: 'center', justifyContent: 'center' }}><Check size={12} color={rule.ok ? t.primary : t.textSubtle} /></View>
            <Txt size={12} color={rule.ok ? t.primary : t.textMuted}>{rule.label}</Txt>
          </View>)}
        </View>
        <Input label="Xác nhận mật khẩu mới" placeholder="Nhập lại mật khẩu mới" value={f.confirmNewPassword} onChangeText={set('confirmNewPassword')} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" maxLength={100} editable={!m.isPending} error={errors.confirmNewPassword} onSubmitEditing={submit} />
      </ScrollView>
      <BottomBar>
        <Button title="Cập nhật mật khẩu" onPress={submit} loading={m.isPending} icon={<Lock size={18} color={t.onAction} />} />
      </BottomBar>
    </Screen>
  )
}
