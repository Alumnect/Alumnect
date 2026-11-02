import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Chip, Empty, Input, Loading, Screen, Txt } from './ui'
import * as DocumentPicker from 'expo-document-picker'
import { Header } from './Header'
import { DateField } from './DateField'
import { WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { WorkingMode } from '@/api/mentoring'
import { REQUEST_TASK_TYPES, requestApi } from '@/api/mentoringFlow'
import { toast, errMsg } from '@/lib/toast'
import { palette } from '@/theme'
import { groupApi } from '@/api/mentoringGroups'
import http, { type ApiResponse } from '@/lib/http'

/** UC90 (mentorId rỗng) và UC91 (gửi trực tiếp cho mentor). */
export function RequestForm({ mentorId, mentorName, initialGroupId }: { mentorId?: number; mentorName?: string; initialGroupId?: number }) {
  const router = useRouter()
  const terms = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const [f, setF] = useState({ title: '', description: '', budgetMin: '', budgetMax: '' })
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [taskType, setTaskType] = useState('CAREER_ORIENTATION')
  const [deadline, setDeadline] = useState('')
  const [participation, setParticipation] = useState<'INDIVIDUAL' | 'GROUP'>(initialGroupId ? 'GROUP' : 'INDIVIDUAL')
  const [groupId, setGroupId] = useState<number | null>(initialGroupId ?? null)
  const groups = useQuery({ queryKey: ['mentoring-groups', 'managed'], queryFn: () => groupApi.mine('MANAGED'), enabled: participation === 'GROUP' })
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (terms.data && !terms.data.accepted) {
      toast.info('Vui lòng đồng ý Điều khoản Hướng dẫn & Hỗ trợ trước khi tạo yêu cầu.')
      router.replace('/mentoring/terms')
    }
  }, [terms.data, router])

  const m = useMutation({
    mutationFn: () => {
      const payload = {
        title: f.title.trim(), description: f.description.trim(), industryId: industryId!, workingMode: mode, participationType: participation, groupId: participation === 'GROUP' ? groupId : null, taskType,
        budgetMin: f.budgetMin ? Number(f.budgetMin) : null, budgetMax: f.budgetMax ? Number(f.budgetMax) : null,
        expectedDeadline: deadline || null, clientRequestKey: key, attachments,
      }
      return mentorId ? requestApi.createDirect(mentorId, payload) : requestApi.create(payload)
    },
    onSuccess: () => {
      toast.success(mentorId ? 'Đã gửi yêu cầu tới mentor!' : 'Đã tạo yêu cầu mentoring thành công!')
      router.replace('/mentoring/my-requests')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const addAttachment = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true })
    if (picked.canceled) return
    if (picked.assets.length + attachments.length > 5) { toast.error('Chỉ được đính kèm tối đa 5 tệp tin'); return }
    if (picked.assets.some((f) => !f.size || f.size >= 10 * 1024 * 1024)) { toast.error('Mỗi tệp phải lớn hơn 0 và nhỏ hơn 10 MB'); return }
    setUploading(true)
    try {
      // Retain each successful upload if a later file fails.
      for (const file of picked.assets) {
        const fileType = file.mimeType ?? 'application/octet-stream'
        const signed = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>('/files/presigned-url', { params: { fileName: file.name, contentType: fileType, folder: 'mentorship/requests' } })
        const blob = await (await fetch(file.uri)).blob()
        const put = await fetch(signed.data.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': fileType } })
        if (!put.ok) throw new Error('Tải tệp lên thất bại. Vui lòng thử lại.')
        setAttachments((a) => [...a, { fileName: file.name, fileUrl: signed.data.publicUrl, fileSize: file.size!, fileType }])
      }
    } catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Tiêu đề yêu cầu không được để trống'
    else if (f.title.trim().length < 5 || f.title.trim().length > 200) e.title = 'Tiêu đề yêu cầu phải từ 5 đến 200 ký tự'
    if (!f.description.trim()) e.description = 'Mô tả chi tiết không được để trống'
    else if (f.description.trim().length < 20 || f.description.trim().length > 3000) e.description = 'Mô tả chi tiết phải từ 20 đến 3000 ký tự'
    if (!industryId) e.industry = 'Lĩnh vực cần hỗ trợ không được để trống'
    if (participation === 'GROUP' && !groups.data?.some((g) => g.id === groupId && g.canManage && g.status === 'ACTIVE')) e.group = 'Vui lòng chọn nhóm bạn đang quản lý'
    if (f.budgetMin && f.budgetMax && Number(f.budgetMin) > Number(f.budgetMax)) e.budget = 'Ngân sách tối thiểu không được lớn hơn tối đa'
    if (deadline && new Date(deadline).getTime() <= Date.now()) e.deadline = 'Thời hạn mong muốn phải ở trong tương lai'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (terms.isLoading) return <Screen><Header title="Tạo yêu cầu" /><Loading /></Screen>
  if (terms.isError || industries.isError) return <Screen><Header title="Tạo yêu cầu" /><Empty title="Không thể tải biểu mẫu" text="Vui lòng thử lại." error={terms.error ?? industries.error} onRetry={() => { void terms.refetch(); void industries.refetch() }} /></Screen>

  return (
    <Screen>
      <Header title={mentorId ? 'Gửi yêu cầu cho mentor' : 'Tạo yêu cầu mentoring'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {mentorName ? <Txt muted style={{ marginBottom: 12 }}>Gửi tới: <Txt weight="700">{mentorName}</Txt></Txt> : null}
          <Txt weight="600" size={13} style={{ marginBottom: 8 }}>Hình thức tham gia</Txt>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Chip label="Cá nhân" active={participation === 'INDIVIDUAL'} onPress={() => setParticipation('INDIVIDUAL')} />
            <Chip label="Theo nhóm" active={participation === 'GROUP'} onPress={() => setParticipation('GROUP')} />
          </View>
          {participation === 'GROUP' ? <View style={{ marginBottom: 16 }}>
            <Txt weight="600" style={{ marginBottom: 8 }}>Chọn nhóm của bạn</Txt>
            {groups.isLoading ? <Loading /> : groups.isError ? <Button title="Thử tải lại nhóm" variant="outline" onPress={() => void groups.refetch()} /> : (groups.data ?? []).filter((g) => g.canManage && g.status === 'ACTIVE').map((g) => <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />)}
            {errors.group ? <Txt color={palette.danger} size={12}>{errors.group}</Txt> : null}
            <Button title="Tạo nhóm mới" variant="ghost" onPress={() => router.push('/mentoring/groups/create')} />
          </View> : null}
          <Input label="Tiêu đề" value={f.title} onChangeText={set('title')} error={errors.title} />
          <Input label="Mô tả chi tiết" value={f.description} onChangeText={set('description')} multiline error={errors.description} />
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Lĩnh vực cần hỗ trợ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 4 }}>
            {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={industryId === i.id} onPress={() => setIndustryId(i.id)} />)}
          </View>
          {errors.industry ? <Txt size={12} color={palette.danger} style={{ marginBottom: 8 }}>{errors.industry}</Txt> : <View style={{ height: 10 }} />}
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Loại hỗ trợ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {REQUEST_TASK_TYPES.map((t) => <Chip key={t.value} label={t.label} active={taskType === t.value} onPress={() => setTaskType(t.value)} />)}
          </View>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Hình thức làm việc</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />)}
          </View>
          <Input label="Ngân sách tối thiểu (VND)" value={f.budgetMin} onChangeText={(v) => set('budgetMin')(v.replace(/\D/g, ''))} keyboardType="number-pad" />
          <Input label="Ngân sách tối đa (VND)" value={f.budgetMax} onChangeText={(v) => set('budgetMax')(v.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.budget} />
          <DateField label="Thời hạn mong muốn (tùy chọn)" value={deadline} onChange={setDeadline} error={errors.deadline} />
          <Txt weight="600" style={{ marginBottom: 8 }}>Tài liệu đính kèm ({attachments.length}/5)</Txt>
          {attachments.map((a, i) => <View key={a.fileUrl} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}><Txt numberOfLines={1} style={{ flex: 1 }}>{a.fileName}</Txt><Button title="Xóa" variant="ghost" onPress={() => setAttachments((files) => files.filter((_, j) => j !== i))} /></View>)}
          <Button title="Thêm tài liệu" variant="outline" disabled={attachments.length >= 5 || m.isPending} loading={uploading} onPress={() => void addAttachment()} style={{ marginBottom: 16 }} />
          <Button title="Gửi yêu cầu" onPress={submit} loading={m.isPending} disabled={uploading || !terms.data?.accepted} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
