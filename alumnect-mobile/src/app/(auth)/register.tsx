import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AuthButton, AuthScaffold } from '@/components/AuthScaffold'
import { Button, Input, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { Check, GraduationCap, IdCard, ImagePlus, Lock, MailIcon, UserRound, X } from '@/components/icons'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { pickImage, uploadImage } from '@/lib/upload'
import { radius, useTheme } from '@/theme'

const PASS_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/

/** Công tắc hai lựa chọn Sinh viên / Cựu sinh viên, gọn một hàng. */
function RoleSwitch({ value, onChange }: { value: 'STUDENT' | 'ALUMNI'; onChange: (v: 'STUDENT' | 'ALUMNI') => void }) {
  const t = useTheme()
  const items: ['STUDENT' | 'ALUMNI', string][] = [['STUDENT', 'Sinh viên'], ['ALUMNI', 'Cựu sinh viên']]
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: t.inputBg, marginBottom: 16 }}>
      {items.map(([k, label]) => {
        const active = value === k
        return (
          <Pressable
            key={k}
            onPress={() => onChange(k)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            style={{ flex: 1, minHeight: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.card : 'transparent', borderWidth: active ? 1 : 0, borderColor: t.controlBorder }}
          >
            <Txt weight={active ? '600' : '400'} color={active ? t.text : t.textMuted}>{label}</Txt>
          </Pressable>
        )
      })}
    </View>
  )
}

/** Yêu cầu mật khẩu: vòng rỗng khi chưa đạt, chuyển xanh lá kèm dấu tích khi đạt. */
function PasswordRules({ password }: { password: string }) {
  const t = useTheme()
  const rules: [string, boolean][] = [
    ['Từ 8 ký tự', password.length >= 8],
    ['Có chữ cái', /[A-Za-z]/.test(password)],
    ['Có chữ số', /\d/.test(password)],
  ]
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4, marginTop: -4, marginBottom: 14 }}>
      {rules.map(([label, ok]) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {ok ? <Check size={13} color={t.success} weight="bold" /> : <View style={{ width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: t.controlBorder, marginHorizontal: 1 }} />}
          <Txt size={12} color={ok ? t.success : t.textMuted}>{label}</Txt>
        </View>
      ))}
    </View>
  )
}

export default function RegisterScreen() {
  const t = useTheme()
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

  const back = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))
  const majorOptions = (majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))

  return (
    <AuthScaffold
      hero="short"
      title="Tạo tài khoản"
      subtitle={isGoogle ? 'Bạn đang đăng ký bằng tài khoản Google.' : 'Tham gia mạng lưới cựu sinh viên FPTU'}
      footer={
        <View>
          <AuthButton title="Đăng ký" onPress={submit} loading={mutation.isPending || googleMutation.isPending} disabled={uploading} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 }}>
            <Txt muted size={14}>Đã có tài khoản? </Txt>
            <Pressable onPress={back} accessibilityRole="link" hitSlop={8} style={{ paddingVertical: 12 }}>
              <Txt color={t.primary} weight="700" size={14}>Đăng nhập</Txt>
            </Pressable>
          </View>
        </View>
      }
    >
      <RoleSwitch value={role} onChange={setRole} />
      {role === 'ALUMNI' ? <Txt muted size={13} style={{ marginTop: -6, marginBottom: 14 }}>Tài khoản cựu sinh viên cần được quản trị viên xác minh trước khi dùng đầy đủ.</Txt> : null}

      <Input variant="float" icon={<UserRound size={20} />} label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" error={errors.fullName} />
      {isGoogle ? (
        <Input variant="float" icon={<MailIcon size={20} />} label="Email (từ Google)" value={f.email} onChangeText={() => {}} editable={false} autoCapitalize="none" />
      ) : (
        <>
          <Input variant="float" icon={<MailIcon size={20} />} label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" keyboardType="email-address" returnKeyType="next" error={errors.email} />
          <Input variant="float" icon={<Lock size={20} />} label="Mật khẩu" value={f.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" error={errors.password} />
          <PasswordRules password={f.password} />
        </>
      )}
      <SelectField variant="float" icon={<GraduationCap size={20} />} label="Chuyên ngành" placeholder="Chọn chuyên ngành" value={majorId == null ? null : String(majorId)} options={majorOptions} onChange={(v) => setMajorId(v == null ? null : Number(v))} clearable={false} error={errors.majorId} />
      {majors.isError ? (
        <Pressable onPress={() => { void majors.refetch() }} accessibilityRole="button" style={{ marginTop: -6, marginBottom: 10, minHeight: 44, justifyContent: 'center' }}>
          <Txt size={13} color={t.danger}>Không tải được danh sách chuyên ngành. <Txt size={13} weight="700" color={t.primary}>Thử lại</Txt></Txt>
        </Pressable>
      ) : null}
      <Input variant="float" icon={<IdCard size={20} />} label="Mã số sinh viên" value={f.studentCode} onChangeText={set('studentCode')} autoCapitalize="characters" autoCorrect={false} returnKeyType="done" error={errors.studentCode} hint={errors.studentCode ? undefined : 'Ví dụ SE123456'} />

      {role === 'ALUMNI' ? (
        <View style={{ marginTop: 2, marginBottom: 8 }}>
          <Txt weight="500" size={14} style={{ marginBottom: 8 }}>Ảnh minh chứng</Txt>
          {proofUrl ? (
            <View>
              <Image source={{ uri: proofUrl }} style={{ height: 160, borderRadius: radius.lg, backgroundColor: t.inputBg }} contentFit="cover" />
              <Pressable onPress={() => setProofUrl('')} accessibilityRole="button" accessibilityLabel="Bỏ ảnh minh chứng" hitSlop={6} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <X size={16} color="#fff" />
              </Pressable>
              <Button title="Chọn ảnh khác" variant="outline" onPress={pickProof} loading={uploading} style={{ marginTop: 10, borderRadius: 999 }} />
            </View>
          ) : (
            <Pressable
              onPress={pickProof}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Chọn ảnh minh chứng"
              style={({ pressed }) => ({ alignItems: 'center', gap: 6, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1.5, borderStyle: 'dashed', borderColor: errors.proofUrl ? t.danger : t.controlBorder, backgroundColor: t.surface, opacity: pressed || uploading ? 0.7 : 1 })}
            >
              <ImagePlus size={26} color={t.textMuted} />
              <Txt weight="600" size={14}>{uploading ? 'Đang tải ảnh lên...' : 'Chọn ảnh minh chứng'}</Txt>
              <Txt muted size={12} style={{ textAlign: 'center' }}>Bằng tốt nghiệp hoặc thẻ sinh viên</Txt>
            </Pressable>
          )}
          {errors.proofUrl ? <Txt size={12} color={t.danger} style={{ marginTop: 4 }}>{errors.proofUrl}</Txt> : null}
        </View>
      ) : null}
    </AuthScaffold>
  )
}
