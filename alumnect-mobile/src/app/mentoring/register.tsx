import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
import { uploadFile } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { Briefcase, Check, FileText, Landmark, UserRound } from '@/components/icons'

interface Bank {
  bin: string
  name: string
}

async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch('https://api.vietqr.io/v2/banks')
  const body = (await res.json()) as { code: string; data: { bin: string; shortName: string; transferSupported: number }[] }
  return body.data
    .filter((b) => b.transferSupported === 1 && /^\d{6}$/.test(b.bin))
    .map((b) => ({ bin: b.bin, name: b.shortName }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

function RegChip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { colors, viridian, isDark } = useMentoringTheme()
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? (isDark ? viridian : colors.actionBg) : colors.surface,
          borderColor: active ? (isDark ? viridian : colors.actionBg) : colors.border,
        },
      ]}
    >
      {active && <Check size={12} color={isDark ? '#FFFFFF' : colors.actionText} weight="bold" />}
      <Txt size={12.5} weight={active ? '700' : '500'} style={{ color: active ? (isDark ? '#FFFFFF' : colors.actionText) : colors.text }}>
        {label}
      </Txt>
    </Pressable>
  )
}

/** UC81: đăng ký / cập nhật hồ sơ mentor (Meetup x Kakao Form — Cam - Trắng - Đen). */
export default function RegisterMentorScreen() {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const reg = useQuery({ queryKey: ['mentor-registration'], queryFn: mentoringApi.registration })
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const banks = useQuery({ queryKey: ['vietqr-banks'], queryFn: fetchBanks, staleTime: Infinity })

  const [f, setF] = useState({ phone: '', campus: '', graduationYear: '', bio: '', topics: '', accountNumber: '', accountHolder: '' })
  const [mode, setMode] = useState<WorkingMode | null>(null)
  const [type, setType] = useState<MentoringType | null>(null)
  const [fieldIds, setFieldIds] = useState<number[]>([])
  const [cv, setCv] = useState('')
  const [cvName, setCvName] = useState('')
  const [bank, setBank] = useState<Bank | null>(null)
  const [bankQ, setBankQ] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const r = reg.data
  if (r && !loaded) {
    setLoaded(true)
    setF({
      phone: r.personalInfo.phone ?? '',
      campus: r.personalInfo.campus ?? '',
      graduationYear: r.personalInfo.graduationYear ? String(r.personalInfo.graduationYear) : '',
      bio: r.professionalInfo.bio ?? '',
      topics: r.mentoringInfo.mentoringTopics.join(', '),
      accountNumber: r.payoutAccount.bankAccountNumber ?? '',
      accountHolder: r.payoutAccount.bankAccountHolder ?? '',
    })
    setMode(r.mentoringInfo.workingMode ?? null)
    setType(r.mentoringInfo.mentoringType ?? null)
    setFieldIds(r.mentoringInfo.supportedIndustries.map((i) => i.id))
    setCv(r.cvInfo.cvFileKey ?? '')
    if (r.payoutAccount.bankBin) setBank({ bin: r.payoutAccount.bankBin, name: r.payoutAccount.bankName ?? r.payoutAccount.bankBin })
  }

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      copyToCacheDirectory: true,
    })
    if (res.canceled) return
    const file = res.assets[0]
    setUploading(true)
    try {
      const uploaded = await uploadFile(file, 'mentorship/cvs')
      setCv(uploaded.url)
      setCvName(file.name)
      toast.success('Đã tải CV lên')
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const save = useMutation({
    mutationFn: () =>
      mentoringApi.saveRegistration({
        phone: f.phone || null,
        campus: f.campus || null,
        graduationYear: f.graduationYear ? Number(f.graduationYear) : null,
        bio: f.bio.trim() || null,
        workingMode: mode,
        mentoringType: type,
        supportedIndustryIds: fieldIds,
        mentoringTopics: f.topics
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        cvFileKey: cv || null,
        bankName: bank?.name ?? null,
        bankBin: bank?.bin ?? null,
        bankAccountNumber: f.accountNumber.trim() || null,
        bankAccountHolder: f.accountHolder.trim().toUpperCase() || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['mentoring-status'] })
      qc.invalidateQueries({ queryKey: ['mentor-registration'] })
      if (reg.data?.mentorStatus === 'ACTIVE') {
        toast.success('Đã cập nhật hồ sơ Mentor thành công!')
        router.back()
        return
      }
      toast.success('Đã lưu hồ sơ Mentor.')
      router.replace(res.isComplete ? '/mentoring/plans' : '/mentoring/status')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const missing: string[] = []
    if (!f.bio.trim()) missing.push('Giới thiệu bản thân')
    if (!mode) missing.push('Hình thức làm việc')
    if (!type) missing.push('Loại hình hướng dẫn')
    if (!fieldIds.length) missing.push('Ít nhất 1 lĩnh vực ngành nghề hỗ trợ')
    if (!cv) missing.push('Tệp CV đính kèm')
    if (!bank || !f.accountNumber.trim() || !f.accountHolder.trim()) missing.push('Thông tin tài khoản ngân hàng nhận chi trả')
    if (missing.length) return toast.error(`Bạn cần điền đủ: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`)
    save.mutate()
  }

  if (reg.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ Mentor" />
        <Loading />
      </Screen>
    )
  if (!reg.data)
    return (
      <Screen bg={colors.bg}>
        <Header title="Hồ sơ Mentor" />
        <Empty text="Không tải được hồ sơ mentor." error={reg.error} onRetry={() => { void reg.refetch() }} />
      </Screen>
    )
  const shownBanks = (banks.data ?? []).filter((b) => b.name.toLowerCase().includes(bankQ.toLowerCase())).slice(0, 8)

  return (
    <Screen bg={colors.bg}>
      <Header title="Hồ sơ chuyên môn Mentor" subtitle="Cập nhật thông tin cố vấn & tài khoản nhận thù lao" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Section 1: Thông tin cá nhân */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <UserRound size={17} color={viridian} weight="bold" />
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                Thông tin Cựu sinh viên & Giới thiệu
              </Txt>
            </View>
            <Input label="Số điện thoại liên hệ" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input label="Cơ sở (Campus)" placeholder="VD: Hòa Lạc, TP.HCM" value={f.campus} onChangeText={set('campus')} />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Năm tốt nghiệp" placeholder="VD: 2022" value={f.graduationYear} onChangeText={set('graduationYear')} keyboardType="number-pad" />
              </View>
            </View>
            <Input
              label="Giới thiệu bản thân & Thế mạnh chuyên môn"
              placeholder="Chia sẻ kinh nghiệm làm việc và những giá trị bạn có thể hỗ trợ đàn em..."
              value={f.bio}
              onChangeText={set('bio')}
              multiline
            />
          </View>

          {/* Section 2: Lĩnh vực & Phương thức */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Briefcase size={17} color={viridian} weight="bold" />
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                Chuyên môn & Hình thức hướng dẫn
              </Txt>
            </View>

            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Hình thức làm việc
            </Txt>
            <View style={styles.chipWrap}>
              {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => (
                <RegChip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />
              ))}
            </View>

            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
              Loại hình hướng dẫn
            </Txt>
            <View style={styles.chipWrap}>
              {(Object.keys(MENTORING_TYPE_LABEL) as MentoringType[]).map((k) => (
                <RegChip key={k} label={MENTORING_TYPE_LABEL[k]} active={type === k} onPress={() => setType(k)} />
              ))}
            </View>

            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
              Lĩnh vực nhận cố vấn (chọn một hoặc nhiều)
            </Txt>
            <View style={styles.chipWrap}>
              {(industries.data ?? []).map((i) => (
                <RegChip
                  key={i.id}
                  label={i.name}
                  active={fieldIds.includes(i.id)}
                  onPress={() => setFieldIds((x) => (x.includes(i.id) ? x.filter((y) => y !== i.id) : [...x, i.id]))}
                />
              ))}
            </View>

            <View style={{ marginTop: 16 }}>
              <Input
                label="Chủ đề hướng dẫn cụ thể (cách nhau bằng dấu phẩy)"
                placeholder="VD: System Design, Mock Interview, Review CV..."
                value={f.topics}
                onChangeText={set('topics')}
              />
            </View>
          </View>

          {/* Section 3: Hồ sơ năng lực (CV) */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <FileText size={17} color={viridian} weight="bold" />
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                Hồ sơ năng lực (CV)
              </Txt>
            </View>
            <View style={[styles.cvBox, { backgroundColor: viridianSoft }]}>
              <Txt size={13} weight="700" style={{ color: viridian }}>
                {cv ? `📎 ${cvName || 'Đã có tệp CV tải lên hệ thống'}` : 'Chưa tải lên tệp CV (Hỗ trợ PDF / DOC / DOCX)'}
              </Txt>
            </View>
            <Button title={cv ? 'Tải lên tệp CV khác' : 'Chọn tệp CV từ thiết bị'} variant="outline" size="sm" onPress={() => void pickCv()} loading={uploading} />
          </View>

          {/* Section 4: Tài khoản nhận chi trả */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Landmark size={17} color={viridian} weight="bold" />
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                Tài khoản ngân hàng nhận thù lao
              </Txt>
            </View>
            <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginBottom: 6 }}>
              Ngân hàng đã chọn: <Txt size={12} weight="800" style={{ color: viridian }}>{bank?.name ?? 'Chưa chọn'}</Txt>
            </Txt>
            <Input value={bankQ} onChangeText={setBankQ} placeholder="Tìm nhanh ngân hàng..." />
            <View style={[styles.chipWrap, { marginBottom: 14 }]}>
              {shownBanks.map((b) => (
                <RegChip key={b.bin} label={b.name} active={bank?.bin === b.bin} onPress={() => setBank(b)} />
              ))}
            </View>
            <Input
              label="Số tài khoản ngân hàng"
              value={f.accountNumber}
              onChangeText={(v) => set('accountNumber')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <Input
              label="Tên chủ tài khoản (Không dấu, IN HOA)"
              value={f.accountHolder}
              onChangeText={set('accountHolder')}
              autoCapitalize="characters"
            />
          </View>

          <Button
            title="Lưu hồ sơ Cố vấn"
            textColor="#FFFFFF"
            onPress={submit}
            loading={save.isPending}
            disabled={uploading}
            style={{ backgroundColor: viridian, borderColor: viridian, minHeight: 52 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  cvBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
})
