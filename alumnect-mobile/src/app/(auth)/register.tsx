import React, { useState } from 'react'
import { View } from 'react-native'
import { Image } from 'expo-image'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AuthScaffold } from '@/components/AuthScaffold'
import { Button, Chip, Input, Txt } from '@/components/ui'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { pickImage, uploadImage } from '@/lib/upload'
import { palette } from '@/theme'

const PASS_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/

export default function RegisterScreen() {
  const router = useRouter()
  // UC03: đăng ký qua Google — nhận token/email/tên từ màn hình đăng nhập (không cần email + mật khẩu).
  const g = useLocalSearchParams<{ googleToken?: string; email?: string; fullName?: string }>()
  const googleToken = g.googleToken || ''
  const isGoogle = googleToken.length > 0
  const login = useAuthStore((s) => s.login)
  const [role, setRole] = useState<'STUDENT' | 'ALUMNI'>('STUDENT')
  const [f, setF] = useState({ fullName: g.fullName ?? '', email: g.email ?? '', password: '', studentCode: '' })
  const [majorId, setMajorId] = useState<number | null>(null)
  const [proofUrl, setProofUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors })

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const googleMutation = useMutation({
    mutationFn: () =>
      authApi.registerWithGoogle({
        token: googleToken,
        fullName: f.fullName.trim(),
        role,
        majorId: majorId!,
        studentCode: f.studentCode.trim(),
        proofUrl: proofUrl || undefined,
      }),
    onSuccess: (data) => {
      if (data.accessToken && data.user.role !== 'ADMIN') {
        queryClient.clear()
        login(data)
        toast.success('Đăng ký thành công!')
      } else {
        toast.success('Đăng ký thành công! Tài khoản cựu sinh viên của bạn đang chờ quản trị viên phê duyệt.')
        router.replace('/(auth)/login')
      }
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const mutation = useMutation({
    mutationFn: () =>
      authApi.register({
        fullName: f.fullName.trim(),
        email: f.email.trim(),
        password: f.password,
        role,
        majorId: majorId!,
        studentCode: f.studentCode.trim(),
        proofUrl: proofUrl || undefined,
      }),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng nhập mã OTP gửi tới email.')
      router.replace({ pathname: '/(auth)/verify-otp', params: { email: f.email.trim(), role } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const pickProof = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try {
      setProofUrl(await uploadImage(img, 'proofs'))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.fullName.trim()) e.fullName = 'Họ và tên không được để trống'
    if (!isGoogle) {
      if (!f.email.trim()) e.email = 'Email không được để trống'
      else if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Định dạng email không hợp lệ'
      if (!f.password) e.password = 'Mật khẩu không được để trống'
      else if (f.password.length < 8) e.password = 'Mật khẩu phải có độ dài từ 8 đến 100 ký tự'
      else if (!PASS_RE.test(f.password)) e.password = 'Mật khẩu phải chứa ít nhất 1 chữ cái và 1 chữ số'
    }
    if (!majorId) e.majorId = 'Chuyên ngành không được để trống'
    if (!f.studentCode.trim()) e.studentCode = 'Mã số sinh viên không được để trống'
    if (role === 'ALUMNI' && !proofUrl) e.proofUrl = 'Ảnh minh chứng là bắt buộc khi đăng ký với vai trò Cựu sinh viên'
    setErrors(e)
    if (Object.keys(e).length === 0) (isGoogle ? googleMutation : mutation).mutate()
  }

  return (
    <AuthScaffold title="Tạo tài khoản" subtitle="Tham gia mạng lưới cựu sinh viên FPTU">
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <Chip label="Sinh viên" active={role === 'STUDENT'} onPress={() => setRole('STUDENT')} />
        <Chip label="Cựu sinh viên" active={role === 'ALUMNI'} onPress={() => setRole('ALUMNI')} />
      </View>
      <Input label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} error={errors.fullName} />
      {isGoogle ? (
        <Input label="Email (từ Google)" value={f.email} onChangeText={() => {}} editable={false} autoCapitalize="none" />
      ) : (
        <>
          <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
          <Input label="Mật khẩu" value={f.password} onChangeText={set('password')} secureTextEntry error={errors.password} />
        </>
      )}
      <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Chuyên ngành</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 4 }}>
        {(majors.data?.data ?? []).map((m) => (
          <Chip key={m.id} label={m.name} active={majorId === m.id} onPress={() => setMajorId(m.id)} />
        ))}
      </View>
      {errors.majorId ? <Txt size={12} color={palette.danger} style={{ marginBottom: 16 }}>{errors.majorId}</Txt> : <View style={{ height: 10 }} />}
      <Input label="Mã số sinh viên" value={f.studentCode} onChangeText={set('studentCode')} autoCapitalize="characters" error={errors.studentCode} />
      {role === 'ALUMNI' ? (
        <View style={{ marginBottom: 14 }}>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Ảnh minh chứng (bằng tốt nghiệp / thẻ SV)</Txt>
          {proofUrl ? <Image source={{ uri: proofUrl }} style={{ height: 160, borderRadius: 12, marginBottom: 8 }} contentFit="cover" /> : null}
          <Button title={proofUrl ? 'Chọn ảnh khác' : 'Chọn ảnh minh chứng'} variant="outline" onPress={pickProof} loading={uploading} />
          {errors.proofUrl ? <Txt size={12} color={palette.danger} style={{ marginTop: 4 }}>{errors.proofUrl}</Txt> : null}
        </View>
      ) : null}
      <Button title="Đăng ký" onPress={submit} loading={mutation.isPending || googleMutation.isPending} />
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24, gap: 6 }}>
        <Txt muted>Đã có tài khoản?</Txt>
        <Link href="/(auth)/login"><Txt color={palette.primary} weight="700">Đăng nhập</Txt></Link>
      </View>
    </AuthScaffold>
  )
}
