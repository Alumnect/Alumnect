import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react-native'
import { Avatar, Button, Card, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { userApi } from '@/api/users'
import { experienceApi } from '@/api/explore'
import { useAuthStore } from '@/store/authStore'
import { pickImage, uploadImage } from '@/lib/upload'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC07: chỉnh sửa hồ sơ cá nhân và timeline kinh nghiệm. */
export default function EditProfileScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: userApi.me })
  const exps = useQuery({ queryKey: ['experiences'], queryFn: experienceApi.list })

  const [f, setF] = useState({ fullName: '', headline: '', biography: '', phone: '', city: '' })
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const p = profile.data?.data
  if (p && !loaded) {
    setLoaded(true)
    setF({ fullName: p.fullName ?? '', headline: p.headline ?? '', biography: p.biography ?? '', phone: p.phone ?? '', city: p.city ?? '' })
    setAvatar(p.avatarUrl || null)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }))

  const save = useMutation({
    mutationFn: () => userApi.update({ fullName: f.fullName.trim(), headline: f.headline.trim() || null, biography: f.biography.trim() || null, phone: f.phone.trim() || null, city: f.city.trim() || null, avatarUrl: avatar }),
    onSuccess: (res) => {
      toast.success('Cập nhật hồ sơ thành công!')
      if (user) setUser({ ...user, name: res.data.fullName, avatarUrl: res.data.avatarUrl || undefined })
      qc.invalidateQueries({ queryKey: ['profile'] })
      router.back()
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const changeAvatar = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try { setAvatar(await uploadImage(img, 'avatars')) } catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.fullName.trim()) e.fullName = 'Họ và tên không được để trống'
    else if (f.fullName.length > 150) e.fullName = 'Họ và tên không được vượt quá 150 ký tự'
    if (f.phone && !/^[0-9+\-\s]{8,15}$/.test(f.phone)) e.phone = 'Số điện thoại không hợp lệ'
    setErrors(e)
    if (!Object.keys(e).length) save.mutate()
  }

  if (profile.isLoading) return <Screen><Header title="Chỉnh sửa hồ sơ" /><Loading /></Screen>

  return (
    <Screen>
      <Header title="Chỉnh sửa hồ sơ" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Avatar uri={avatar} name={f.fullName} size={92} />
            <Button title="Đổi ảnh đại diện" variant="ghost" onPress={changeAvatar} loading={uploading} />
          </View>
          <Input label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} />
          <Input label="Tiêu đề hồ sơ (headline)" value={f.headline} onChangeText={set('headline')} />
          <Input label="Giới thiệu" value={f.biography} onChangeText={set('biography')} multiline />
          <Input label="Số điện thoại" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" error={errors.phone} />
          <Input label="Thành phố" value={f.city} onChangeText={set('city')} />
          <Button title="Lưu hồ sơ" onPress={submit} loading={save.isPending} disabled={uploading} />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 8 }}>
            <Txt weight="700" size={16} style={{ flex: 1 }}>Kinh nghiệm làm việc</Txt>
            <Pressable onPress={() => router.push('/profile/experience')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Plus size={18} color={t.primary} /><Txt color={t.primary} weight="700">Thêm</Txt>
            </Pressable>
          </View>
          {(exps.data ?? []).map((e) => (
            <Card key={e.id} style={{ marginBottom: 8 }} onPress={() => router.push({ pathname: '/profile/experience', params: { id: String(e.id) } })}>
              <Txt weight="700">{e.title}{e.isPrimary ? ' ★' : ''}</Txt>
              <Txt muted size={13}>{e.company}</Txt>
              <Txt muted size={12}>{e.startDate} — {e.isCurrent ? 'Hiện tại' : e.endDate}</Txt>
            </Card>
          ))}
          {exps.data?.length === 0 ? <Txt muted>Chưa có kinh nghiệm nào.</Txt> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
