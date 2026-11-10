import React, { useState } from 'react'
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ScrollView } from '@/components/ScrollView'
import { AlertTriangle, BadgeCheck, Check, ChevronLeft, ChevronRight, Clock, GraduationCap, IdCard, ImagePlus, Lock, X } from '@/components/icons'
import { Avatar, Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { SelectField } from '@/components/SelectField'
import { AuthIllustration } from '@/components/AuthIllustration'
import { AuthButton } from '@/components/AuthScaffold'
import { BrandIcon } from '@/components/BrandIcon'
import type { BrandIconName } from '@/components/BrandIcon'
import { MIN_GRADUATION_YEAR, verificationApi } from '@/api/verification'
import type { VerificationStatus } from '@/api/verification'
import { authApi } from '@/api/auth'
import { userApi } from '@/api/users'
import { useMyVerification } from '@/lib/verificationHooks'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { radius, useTheme } from '@/theme'

const FIELD_BG = { light: '#EAF0F8', dark: '#151D2A' }

const fmtDate = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Quyền lợi chỉ dành cho Cựu sinh viên, đều là chức năng có thật trong app (Hội nhóm, Khảo sát lương, nhãn vai trò). */
const PERKS: { icon: BrandIconName; title: string; desc: string }[] = [
  { icon: 'people', title: 'Hội nhóm cựu sinh viên', desc: 'Tạo và tham gia các nhóm theo ngành, khoá, sở thích.' },
  { icon: 'coin', title: 'Đóng góp khảo sát lương', desc: 'Chia sẻ mức lương ẩn danh để khoá sau tham khảo.' },
  { icon: 'suitcase', title: 'Nhãn Cựu sinh viên trên hồ sơ', desc: 'Sinh viên khoá sau dễ nhận ra và kết nối với bạn.' },
]

/** Thẻ "Sinh viên → Cựu sinh viên": ảnh đại diện, tên, mã số và hai nhãn vai trò trước / sau khi duyệt. */
function RoleShift({ name, avatar, code, done }: { name: string; avatar?: string | null; code?: string | null; done: boolean }) {
  const t = useTheme()
  const pill = (label: string, active: boolean) => (
    <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: active ? t.primary : t.inputBg }}>
      <Txt size={13} weight="600" color={active ? t.onPrimary : t.textMuted}>{label}</Txt>
    </View>
  )
  return (
    <View style={{ padding: 16, borderRadius: 24, backgroundColor: t.card, borderWidth: 1, borderColor: t.border }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar uri={avatar} name={name} size={52} ring />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Txt weight="700" size={17} numberOfLines={1} style={{ flexShrink: 1 }}>{name}</Txt>
            {done ? <BadgeCheck size={17} color={t.info} weight="fill" /> : null}
          </View>
          {code ? <Txt muted size={13}>MSSV {code}</Txt> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.divider }}>
        {pill('Sinh viên', false)}
        <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: done ? t.primary : t.border }} />
        <ChevronRight size={16} color={done ? t.primary : t.textMuted} />
        {pill('Cựu sinh viên', done)}
      </View>
    </View>
  )
}

type StepState = 'done' | 'active' | 'error' | 'todo'

/** Tiến trình 3 bước theo trạng thái phiếu thật: gửi minh chứng → Admin xét duyệt → trở thành Cựu sinh viên. */
function Timeline({ steps }: { steps: { title: string; desc: string; state: StepState }[] }) {
  const t = useTheme()
  return (
    <View>
      {steps.map((s, i) => {
        const color = s.state === 'done' ? t.success : s.state === 'active' ? t.primary : s.state === 'error' ? t.danger : t.controlBorder
        const last = i === steps.length - 1
        return (
          <View key={s.title} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', width: 28 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: s.state === 'todo' ? t.card : color, borderWidth: s.state === 'todo' ? 2 : 0, borderColor: color }}>
                {s.state === 'done' ? <Check size={15} color="#fff" weight="bold" /> : s.state === 'error' ? <X size={14} color="#fff" weight="bold" /> : s.state === 'active' ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#fff' }} /> : null}
              </View>
              {last ? null : <View style={{ flex: 1, width: 2, minHeight: 22, marginVertical: 4, backgroundColor: s.state === 'done' ? t.success : t.border }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : 18, paddingTop: 3 }}>
              <Txt weight="600" color={s.state === 'todo' ? t.textMuted : t.text}>{s.title}</Txt>
              <Txt muted size={13} style={{ marginTop: 2, lineHeight: 19 }}>{s.desc}</Txt>
            </View>
          </View>
        )
      })}
    </View>
  )
}

/** Tiêu đề mục trong tấm nền. */
function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ marginTop: 28 }, style]}>
      <Txt weight="700" size={18} style={{ marginBottom: 14 }}>{title}</Txt>
      {children}
    </View>
  )
}

/** UC08: Sinh viên gửi / gửi lại yêu cầu nâng cấp tài khoản lên Cựu sinh viên (cần Admin duyệt). */
export default function UpgradeAlumniScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const status = useMyVerification()
  const profile = useQuery({ queryKey: ['profile', 'me'], queryFn: userApi.me })
  const majors = useQuery({ queryKey: ['majors'], queryFn: authApi.getMajors })

  const now = new Date().getFullYear()
  // Người dùng chỉnh gì thì dùng nấy; chưa chỉnh thì điền sẵn từ phiếu gần nhất, rồi từ hồ sơ (như Web).
  const [majorEdit, setMajorEdit] = useState<string | null | undefined>(undefined)
  const [yearEdit, setYearEdit] = useState<string | undefined>(undefined)
  const [proofUrl, setProofUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const v: VerificationStatus | undefined = status.data
  const me = profile.data?.data
  const state = v?.status ?? 'NONE'
  const defaultMajor = v?.majorId ?? me?.major?.id ?? null
  const majorId = majorEdit !== undefined ? majorEdit : defaultMajor == null ? null : String(defaultMajor)
  const year = yearEdit ?? String(v?.graduationYear ?? me?.graduationYear ?? now)
  const editable = state === 'NONE' || state === 'REJECTED'

  const submit = useMutation({
    mutationFn: () => verificationApi.submitUpgrade({ proofUrl: proofUrl.trim(), graduationYear: Number(year), majorId: Number(majorId) }),
    onSuccess: (res) => {
      toast.success(res.message || 'Đã gửi yêu cầu nâng cấp. Hồ sơ của bạn đang chờ Quản trị viên xét duyệt.')
      setProofUrl('')
      void qc.invalidateQueries({ queryKey: ['verification'] })
      void qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: (e) => toast.error(errMsg(e, 'Đã xảy ra lỗi khi gửi yêu cầu nâng cấp Cựu sinh viên.')),
  })

  const pickProof = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try {
      setProofUrl(await uploadImage(img, 'proofs'))
      setErrors((p) => ({ ...p, proofUrl: '' }))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  // Thông điệp lỗi khớp schema Web và SubmitVerificationRequestDto.
  const send = () => {
    const e: Record<string, string> = {}
    if (!majorId) e.majorId = 'Vui lòng chọn chuyên ngành tốt nghiệp'
    const y = Number(year)
    if (!year.trim() || !Number.isInteger(y)) e.year = 'Năm tốt nghiệp không được để trống'
    else if (y < MIN_GRADUATION_YEAR) e.year = `Năm tốt nghiệp phải từ năm ${MIN_GRADUATION_YEAR} trở đi`
    else if (y > now + 1) e.year = 'Năm tốt nghiệp không được lớn hơn năm hiện tại quá 1 năm.'
    if (!proofUrl.trim()) e.proofUrl = 'Vui lòng tải lên tài liệu minh chứng tốt nghiệp'
    setErrors(e)
    if (Object.keys(e).length === 0) submit.mutate()
  }

  if (status.isLoading || profile.isLoading) return <Screen><Header title="Nâng cấp Cựu sinh viên" /><Loading /></Screen>
  if (status.isError) return <Screen><Header title="Nâng cấp Cựu sinh viên" /><Empty text="Không tải được trạng thái xác minh." error={status.error} onRetry={() => { void status.refetch() }} /></Screen>

  const steps: { title: string; desc: string; state: StepState }[] = [
    {
      title: state === 'REJECTED' ? 'Bổ sung minh chứng' : 'Gửi minh chứng tốt nghiệp',
      desc: state === 'REJECTED' ? 'Yêu cầu trước chưa được duyệt, hãy gửi lại.' : v?.createdAt ? `Đã gửi lúc ${fmtDate(v.createdAt)}` : 'Chuyên ngành, năm tốt nghiệp và ảnh bằng.',
      state: state === 'NONE' ? 'active' : state === 'REJECTED' ? 'error' : 'done',
    },
    { title: 'Quản trị viên xét duyệt', desc: state === 'PENDING' ? 'Hồ sơ đang được xem xét. Bạn vẫn dùng tài khoản Sinh viên bình thường.' : 'Thường trong vài ngày làm việc.', state: state === 'PENDING' ? 'active' : state === 'APPROVED' ? 'done' : 'todo' },
    { title: 'Trở thành Cựu sinh viên', desc: 'Mở khoá các quyền lợi bên dưới.', state: state === 'APPROVED' ? 'done' : 'todo' },
  ]

  const heroTitle = state === 'APPROVED' ? 'Chào mừng Cựu sinh viên' : state === 'PENDING' ? 'Hồ sơ đang được xét duyệt' : 'Nâng cấp lên Cựu sinh viên'
  const heroSub = state === 'APPROVED' ? 'Tài khoản của bạn đã được nâng cấp.' : state === 'PENDING' ? 'Bạn sẽ nhận thông báo ngay khi có kết quả.' : 'Đã tốt nghiệp FPTU? Xác minh để kết nối cùng cộng đồng cựu sinh viên.'

  return (
    <Screen bg={t.card} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" bounces>
          {/* Phần đầu: nền xanh nhạt, tranh toà FPT và tiêu đề theo trạng thái */}
          <View style={{ backgroundColor: t.isDark ? FIELD_BG.dark : FIELD_BG.light, paddingTop: insets.top + 8, paddingBottom: 28 }}>
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} accessibilityRole="button" accessibilityLabel="Quay lại" hitSlop={6} style={({ pressed }) => ({ marginLeft: 16, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.card, opacity: pressed ? 0.8 : 1 })}>
              <ChevronLeft size={22} color={t.text} />
            </Pressable>
            <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
              <Txt heading size={26} weight="700" style={{ lineHeight: 32 }}>{heroTitle}</Txt>
              <Txt muted size={15} style={{ marginTop: 6, lineHeight: 22 }}>{heroSub}</Txt>
            </View>
            <View style={{ marginTop: 8 }}>
              <AuthIllustration width={width} strip />
            </View>
          </View>

          {/* Tấm nền nội dung */}
          <View style={{ marginTop: -28, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: t.card, paddingHorizontal: 20, paddingTop: 20 }}>
            <RoleShift name={me?.fullName ?? 'Bạn'} avatar={me?.avatarUrl} code={me?.studentCode} done={state === 'APPROVED'} />

            <Section title="Tiến trình">
              <Timeline steps={steps} />
            </Section>

            {state === 'REJECTED' && v?.reviewNote ? (
              <View style={{ flexDirection: 'row', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: t.dangerTint, marginTop: 20 }}>
                <AlertTriangle size={20} color={t.danger} />
                <View style={{ flex: 1 }}>
                  <Txt weight="600" color={t.danger}>Lý do từ chối lần trước</Txt>
                  <Txt size={14} style={{ marginTop: 2 }}>“{v.reviewNote}”</Txt>
                </View>
              </View>
            ) : null}

            {state === 'PENDING' ? (
              <Section title="Thông tin đã gửi">
                <View style={{ borderRadius: 20, borderWidth: 1, borderColor: t.border, overflow: 'hidden' }}>
                  {v?.proofUrl ? (
                    <Pressable onPress={() => { void Linking.openURL(v.proofUrl!) }} accessibilityRole="link" accessibilityLabel="Xem minh chứng đã nộp">
                      <Image source={{ uri: v.proofUrl }} style={{ height: 170, backgroundColor: t.inputBg }} contentFit="cover" />
                    </Pressable>
                  ) : null}
                  <View style={{ padding: 16, gap: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Txt muted size={14}>Chuyên ngành</Txt><Txt weight="600" size={14} style={{ flexShrink: 1, textAlign: 'right' }}>{v?.majorName ?? '—'}</Txt></View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Txt muted size={14}>Năm tốt nghiệp</Txt><Txt weight="600" size={14}>{v?.graduationYear ?? '—'}</Txt></View>
                  </View>
                </View>
              </Section>
            ) : null}

            {editable ? (
              <Section title="Thông tin tốt nghiệp">
                {me?.studentCode ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, minHeight: 56, borderRadius: 16, backgroundColor: t.inputBg, marginBottom: 14 }}>
                    <IdCard size={20} color={t.textMuted} />
                    <Txt muted size={14} style={{ flex: 1 }}>Mã số sinh viên</Txt>
                    <Txt weight="700">{me.studentCode}</Txt>
                  </View>
                ) : null}
                <SelectField
                  variant="float"
                  icon={<GraduationCap size={20} />}
                  label="Chuyên ngành tốt nghiệp"
                  placeholder="Chọn chuyên ngành tốt nghiệp"
                  value={majorId}
                  options={(majors.data?.data ?? []).map((m) => ({ value: String(m.id), label: `${m.name} (${m.code})` }))}
                  onChange={(x) => { setMajorEdit(x); setErrors((p) => ({ ...p, majorId: '' })) }}
                  clearable={false}
                  error={errors.majorId || undefined}
                />
                <Input
                  variant="float"
                  icon={<Clock size={20} />}
                  label="Năm tốt nghiệp"
                  value={year}
                  onChangeText={(x) => { setYearEdit(x.replace(/\D/g, '').slice(0, 4)); setErrors((p) => ({ ...p, year: '' })) }}
                  keyboardType="number-pad"
                  maxLength={4}
                  error={errors.year || undefined}
                  hint={errors.year ? undefined : `Từ ${MIN_GRADUATION_YEAR} đến ${now + 1}`}
                />

                {/* Ô ảnh minh chứng: khung lớn có minh hoạ, xem trước ảnh đã chọn */}
                {proofUrl ? (
                  <View style={{ marginTop: 6 }}>
                    <Image source={{ uri: proofUrl }} style={{ height: 190, borderRadius: 20, backgroundColor: t.inputBg }} contentFit="cover" />
                    <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.6)' }}>
                      <Check size={14} color="#fff" weight="bold" />
                      <Txt size={12} weight="600" color="#fff">Đã tải lên minh chứng</Txt>
                    </View>
                    <Pressable onPress={() => setProofUrl('')} accessibilityRole="button" accessibilityLabel="Bỏ ảnh minh chứng" hitSlop={6} style={{ position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }}>
                      <X size={16} color="#fff" />
                    </Pressable>
                    <Button title="Chọn ảnh khác" variant="outline" onPress={pickProof} loading={uploading} style={{ marginTop: 10, borderRadius: 999 }} />
                  </View>
                ) : (
                  <Pressable
                    onPress={pickProof}
                    disabled={uploading}
                    accessibilityRole="button"
                    accessibilityLabel="Tải ảnh minh chứng tốt nghiệp"
                    style={({ pressed }) => ({ marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: errors.proofUrl ? t.danger : t.controlBorder, backgroundColor: t.surface, opacity: pressed || uploading ? 0.75 : 1 })}
                  >
                    <BrandIcon name="task" size={52} />
                    <View style={{ flex: 1 }}>
                      <Txt weight="600">{uploading ? 'Đang tải ảnh lên...' : 'Tải ảnh bằng tốt nghiệp'}</Txt>
                      <Txt muted size={13} style={{ marginTop: 2 }}>Ảnh rõ nét bằng hoặc giấy chứng nhận tốt nghiệp</Txt>
                    </View>
                    <ImagePlus size={22} color={t.primary} />
                  </Pressable>
                )}
                {errors.proofUrl ? <Txt size={12} color={t.danger} style={{ marginTop: 6 }}>{errors.proofUrl}</Txt> : null}
              </Section>
            ) : null}

            <Section title={state === 'APPROVED' ? 'Quyền lợi đã mở khoá' : 'Quyền lợi khi là cựu sinh viên'}>
              <View style={{ gap: 10 }}>
                {PERKS.map((p) => (
                  <View key={p.title} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: t.surface }}>
                    <BrandIcon name={p.icon} size={44} />
                    <View style={{ flex: 1 }}>
                      <Txt weight="600">{p.title}</Txt>
                      <Txt muted size={13} style={{ marginTop: 2, lineHeight: 19 }}>{p.desc}</Txt>
                    </View>
                    {state === 'APPROVED' ? <Check size={18} color={t.success} weight="bold" /> : null}
                  </View>
                ))}
              </View>
            </Section>
          </View>
        </ScrollView>
        {/* Dải che thanh trạng thái để nội dung cuộn không đè lên đồng hồ / pin */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: t.isDark ? FIELD_BG.dark : FIELD_BG.light }} />

        {/* Thanh hành động ghim đáy */}
        {editable ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: t.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border }}>
            <AuthButton title={state === 'REJECTED' ? 'Gửi lại yêu cầu xét duyệt' : 'Gửi yêu cầu xét duyệt'} onPress={send} loading={submit.isPending} disabled={uploading} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              <Lock size={13} color={t.textMuted} />
              <Txt muted size={12}>Sau khi được duyệt, không thể quay lại vai trò Sinh viên</Txt>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  )
}
