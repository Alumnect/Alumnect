import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AuthScaffold, AuthSwitch } from '@/components/AuthScaffold'
import { Button, Input, Txt } from '@/components/ui'
import { SelectField } from '@/components/SelectField'
import { Check, GraduationCap, ImagePlus, Info, Student, X } from '@/components/icons'
import { authApi } from '@/api/auth'
import { toast, errMsg } from '@/lib/toast'
import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import { pickImage, uploadImage } from '@/lib/upload'
import { radius, useTheme } from '@/theme'

const PASS_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/

/** Thẻ chọn vai trò: biểu tượng, tên vai trò, mô tả ngắn và dấu chọn. */
function RoleCard({ icon, title, desc, active, onPress }: { icon: React.ReactNode; title: string; desc: string; active: boolean; onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, checked: active }}
      accessibilityLabel={`${title}. ${desc}`}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 112,
        padding: 14,
        borderRadius: radius.lg,
        borderWidth: active ? 2 : 1,
        borderColor: active ? t.text : t.controlBorder,
        backgroundColor: active ? t.surface : t.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {icon}
        <View style={{ width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? t.text : 'transparent', borderWidth: active ? 0 : 1, borderColor: t.controlBorder }}>
          {active ? <Check size={12} color={t.card} weight="bold" /> : null}
        </View>
      </View>
      <Txt weight="600" style={{ marginTop: 10 }}>{title}</Txt>
      <Txt muted size={12}>{desc}</Txt>
    </Pressable>
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

  const majorOptions = (majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: m.name }))

  return (
    <AuthScaffold title="Tạo tài khoản" subtitle="Tham gia mạng lưới cựu sinh viên FPTU" compact>
      {isGoogle ? (
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: radius.md, backgroundColor: t.infoTint, marginBottom: 20 }}>
          <Info size={18} color={t.info} />
          <Txt size={13} style={{ flex: 1 }}>Bạn đang đăng ký bằng tài khoản Google. Hoàn tất vài thông tin bên dưới để tiếp tục.</Txt>
        </View>
      ) : null}
      <Txt weight="500" size={14} style={{ marginBottom: 8 }}>Bạn là</Txt>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
        <RoleCard icon={<Student size={26} color={t.text} />} title="Sinh viên" desc="Đang học tại FPTU" active={role === 'STUDENT'} onPress={() => setRole('STUDENT')} />
        <RoleCard icon={<GraduationCap size={26} color={t.text} />} title="Cựu sinh viên" desc="Đã tốt nghiệp FPTU" active={role === 'ALUMNI'} onPress={() => setRole('ALUMNI')} />
      </View>
      <Input label="Họ và tên" value={f.fullName} onChangeText={set('fullName')} autoComplete="name" textContentType="name" autoCapitalize="words" returnKeyType="next" error={errors.fullName} placeholder="Nguyễn Văn A" />
      {isGoogle ? (
        <Input label="Email (từ Google)" value={f.email} onChangeText={() => {}} editable={false} autoCapitalize="none" />
      ) : (
        <>
          <Input label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="username" keyboardType="email-address" returnKeyType="next" error={errors.email} placeholder="you@fpt.edu.vn" />
          <Input label="Mật khẩu" value={f.password} onChangeText={set('password')} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" error={errors.password} hint="Từ 8 ký tự, gồm ít nhất 1 chữ cái và 1 chữ số" placeholder="Tạo mật khẩu" />
        </>
      )}
      <SelectField
        label="Chuyên ngành"
        placeholder="Chọn chuyên ngành"
        value={majorId == null ? null : String(majorId)}
        options={majorOptions}
        onChange={(v) => setMajorId(v == null ? null : Number(v))}
        clearable={false}
        error={errors.majorId}
      />
      {majors.isError ? (
        <Pressable onPress={() => { void majors.refetch() }} accessibilityRole="button" style={{ marginTop: -8, marginBottom: 14, minHeight: 44, justifyContent: 'center' }}>
          <Txt size={13} color={t.danger}>Không tải được danh sách chuyên ngành. <Txt size={13} weight="700" color={t.primary}>Thử lại</Txt></Txt>
        </Pressable>
      ) : null}
      <Input label="Mã số sinh viên" value={f.studentCode} onChangeText={set('studentCode')} autoCapitalize="characters" autoCorrect={false} error={errors.studentCode} placeholder="VD: SE123456" />
      {role === 'ALUMNI' ? (
        <View style={{ marginBottom: 18 }}>
          <Txt weight="500" size={14} style={{ marginBottom: 8 }}>Ảnh minh chứng</Txt>
          {proofUrl ? (
            <View>
              <Image source={{ uri: proofUrl }} style={{ height: 180, borderRadius: radius.md, backgroundColor: t.inputBg }} contentFit="cover" />
              <Pressable onPress={() => setProofUrl('')} accessibilityRole="button" accessibilityLabel="Bỏ ảnh minh chứng" hitSlop={6} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                <X size={16} color="#fff" />
              </Pressable>
              <Button title="Chọn ảnh khác" variant="outline" onPress={pickProof} loading={uploading} style={{ marginTop: 10 }} />
            </View>
          ) : (
            <Pressable
              onPress={pickProof}
              disabled={uploading}
              accessibilityRole="button"
              accessibilityLabel="Chọn ảnh minh chứng"
              style={({ pressed }) => ({
                alignItems: 'center',
                gap: 6,
                paddingVertical: 22,
                paddingHorizontal: 16,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: errors.proofUrl ? t.danger : t.controlBorder,
                backgroundColor: t.surface,
                opacity: pressed || uploading ? 0.7 : 1,
              })}
            >
              <ImagePlus size={28} color={t.textMuted} />
              <Txt weight="600" size={14}>{uploading ? 'Đang tải ảnh lên...' : 'Chọn ảnh minh chứng'}</Txt>
              <Txt muted size={12} style={{ textAlign: 'center' }}>Bằng tốt nghiệp hoặc thẻ sinh viên để quản trị viên xác minh</Txt>
            </Pressable>
          )}
          {errors.proofUrl ? <Txt size={12} color={t.danger} style={{ marginTop: 4 }}>{errors.proofUrl}</Txt> : null}
        </View>
      ) : null}
      <Button title="Đăng ký" size="lg" onPress={submit} loading={mutation.isPending || googleMutation.isPending} style={{ marginTop: 6 }} />
      <AuthSwitch question="Đã có tài khoản?" action="Đăng nhập" onPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))} />
    </AuthScaffold>
  )
}
