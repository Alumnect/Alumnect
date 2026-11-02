import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import * as DocumentPicker from 'expo-document-picker'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Chip, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { MENTORING_TYPE_LABEL, WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { MentoringType, WorkingMode } from '@/api/mentoring'
import http from '@/lib/http'
import type { ApiResponse } from '@/lib/http'
import { toast, errMsg } from '@/lib/toast'

interface Bank { bin: string; name: string }

async function fetchBanks(): Promise<Bank[]> {
  const res = await fetch('https://api.vietqr.io/v2/banks')
  const body = (await res.json()) as { code: string; data: { bin: string; shortName: string; transferSupported: number }[] }
  return body.data
    .filter((b) => b.transferSupported === 1 && /^\d{6}$/.test(b.bin))
    .map((b) => ({ bin: b.bin, name: b.shortName }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

/** UC81: đăng ký / cập nhật hồ sơ mentor. */
export default function RegisterMentorScreen() {
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
      phone: r.personalInfo.phone ?? '', campus: r.personalInfo.campus ?? '', graduationYear: r.personalInfo.graduationYear ? String(r.personalInfo.graduationYear) : '',
      bio: r.professionalInfo.bio ?? '', topics: r.mentoringInfo.mentoringTopics.join(', '),
      accountNumber: r.payoutAccount.bankAccountNumber ?? '', accountHolder: r.payoutAccount.bankAccountHolder ?? '',
    })
    setMode(r.mentoringInfo.workingMode ?? null); setType(r.mentoringInfo.mentoringType ?? null)
    setFieldIds(r.mentoringInfo.supportedIndustries.map((i) => i.id))
    setCv(r.cvInfo.cvFileKey ?? '')
    if (r.payoutAccount.bankBin) setBank({ bin: r.payoutAccount.bankBin, name: r.payoutAccount.bankName ?? r.payoutAccount.bankBin })
  }

  const pickCv = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], copyToCacheDirectory: true })
    if (res.canceled) return
    const file = res.assets[0]
    setUploading(true)
    try {
      const type = file.mimeType ?? 'application/pdf'
      const p = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', { params: { fileName: file.name, contentType: type, folder: 'mentorship/cvs' } })
      const blob = await (await fetch(file.uri)).blob()
      const put = await fetch(p.data.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': type } })
      if (!put.ok) throw new Error('Tải CV thất bại, vui lòng thử lại.')
      setCv(p.data.publicUrl); setCvName(file.name)
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
        phone: f.phone || null, campus: f.campus || null, graduationYear: f.graduationYear ? Number(f.graduationYear) : null,
        bio: f.bio.trim() || null, workingMode: mode, mentoringType: type, supportedIndustryIds: fieldIds,
        mentoringTopics: f.topics.split(',').map((s) => s.trim()).filter(Boolean), cvFileKey: cv || null,
        bankName: bank?.name ?? null, bankBin: bank?.bin ?? null, bankAccountNumber: f.accountNumber.trim() || null, bankAccountHolder: f.accountHolder.trim().toUpperCase() || null,
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['mentoring-status'] })
      qc.invalidateQueries({ queryKey: ['mentor-registration'] })
      if (reg.data?.mentorStatus === 'ACTIVE') { toast.success('Đã cập nhật hồ sơ Mentor thành công!'); router.back(); return }
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

  if (reg.isLoading) return <Screen><Header title="Đăng ký mentor" /><Loading /></Screen>
  if (!reg.data) return <Screen><Header title="Hồ sơ mentor" /><Empty text="Không tải được hồ sơ mentor." error={reg.error} onRetry={() => { void reg.refetch() }} /></Screen>
  const shownBanks = (banks.data ?? []).filter((b) => b.name.toLowerCase().includes(bankQ.toLowerCase())).slice(0, 8)

  return (
    <Screen>
      <Header title="Hồ sơ mentor" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Input label="Số điện thoại" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
          <Input label="Cơ sở" value={f.campus} onChangeText={set('campus')} />
          <Input label="Năm tốt nghiệp" value={f.graduationYear} onChangeText={set('graduationYear')} keyboardType="number-pad" />
          <Input label="Giới thiệu bản thân" value={f.bio} onChangeText={set('bio')} multiline />
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Hình thức làm việc</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />)}
          </View>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Loại hình hướng dẫn</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {(Object.keys(MENTORING_TYPE_LABEL) as MentoringType[]).map((k) => <Chip key={k} label={MENTORING_TYPE_LABEL[k]} active={type === k} onPress={() => setType(k)} />)}
          </View>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Lĩnh vực hỗ trợ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={fieldIds.includes(i.id)} onPress={() => setFieldIds((x) => (x.includes(i.id) ? x.filter((y) => y !== i.id) : [...x, i.id]))} />)}
          </View>
          <Input label="Chủ đề hướng dẫn (cách nhau bằng dấu phẩy)" value={f.topics} onChangeText={set('topics')} />

          <Card style={{ marginBottom: 14 }}>
            <Txt weight="700">CV</Txt>
            <Txt muted size={13} style={{ marginVertical: 6 }}>{cv ? (cvName || 'Đã có CV tải lên') : 'Chưa có CV (PDF/DOC/DOCX)'}</Txt>
            <Button title={cv ? 'Tải CV khác' : 'Chọn tệp CV'} variant="outline" onPress={pickCv} loading={uploading} />
          </Card>

          <Card style={{ marginBottom: 14 }}>
            <Txt weight="700" style={{ marginBottom: 8 }}>Tài khoản nhận chi trả</Txt>
            <Txt muted size={13} style={{ marginBottom: 6 }}>Ngân hàng: {bank?.name ?? 'Chưa chọn'}</Txt>
            <Input value={bankQ} onChangeText={setBankQ} placeholder="Tìm ngân hàng..." />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
              {shownBanks.map((b) => <Chip key={b.bin} label={b.name} active={bank?.bin === b.bin} onPress={() => setBank(b)} />)}
            </View>
            <Input label="Số tài khoản" value={f.accountNumber} onChangeText={(v) => set('accountNumber')(v.replace(/\D/g, ''))} keyboardType="number-pad" />
            <Input label="Chủ tài khoản (không dấu, in hoa)" value={f.accountHolder} onChangeText={set('accountHolder')} autoCapitalize="characters" />
          </Card>
          <Button title="Lưu hồ sơ mentor" onPress={submit} loading={save.isPending} disabled={uploading} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
