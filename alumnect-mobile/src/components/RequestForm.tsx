import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Chip, Input, Loading, Screen, Txt } from './ui'
import { Header } from './Header'
import { DateField } from './DateField'
import { WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { WorkingMode } from '@/api/mentoring'
import { REQUEST_TASK_TYPES, requestApi } from '@/api/mentoringFlow'
import { toast, errMsg } from '@/lib/toast'

/** UC90 (mentorId rỗng) và UC91 (gửi trực tiếp cho mentor). */
export function RequestForm({ mentorId, mentorName }: { mentorId?: number; mentorName?: string }) {
  const router = useRouter()
  const terms = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const [f, setF] = useState({ title: '', description: '', budgetMin: '', budgetMax: '' })
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [taskType, setTaskType] = useState('CAREER_ORIENTATION')
  const [deadline, setDeadline] = useState('')
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
        title: f.title.trim(), description: f.description.trim(), industryId: industryId!, workingMode: mode, participationType: 'INDIVIDUAL' as const, taskType,
        budgetMin: f.budgetMin ? Number(f.budgetMin) : null, budgetMax: f.budgetMax ? Number(f.budgetMax) : null,
        expectedDeadline: deadline || null, clientRequestKey: key, attachments: [],
      }
      return mentorId ? requestApi.createDirect(mentorId, payload) : requestApi.create(payload)
    },
    onSuccess: () => {
      toast.success(mentorId ? 'Đã gửi yêu cầu tới mentor!' : 'Đã tạo yêu cầu mentoring thành công!')
      router.replace('/mentoring/my-requests')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Tiêu đề yêu cầu không được để trống'
    else if (f.title.trim().length < 5 || f.title.trim().length > 200) e.title = 'Tiêu đề yêu cầu phải từ 5 đến 200 ký tự'
    if (!f.description.trim()) e.description = 'Mô tả chi tiết không được để trống'
    else if (f.description.trim().length < 20 || f.description.trim().length > 3000) e.description = 'Mô tả chi tiết phải từ 20 đến 3000 ký tự'
    if (!industryId) e.industry = 'Lĩnh vực cần hỗ trợ không được để trống'
    if (f.budgetMin && f.budgetMax && Number(f.budgetMin) > Number(f.budgetMax)) e.budget = 'Ngân sách tối thiểu không được lớn hơn tối đa'
    if (deadline && new Date(deadline).getTime() <= Date.now()) e.deadline = 'Thời hạn mong muốn phải ở trong tương lai'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (terms.isLoading) return <Screen><Header title="Tạo yêu cầu" /><Loading /></Screen>

  return (
    <Screen>
      <Header title={mentorId ? 'Gửi yêu cầu cho mentor' : 'Tạo yêu cầu mentoring'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {mentorName ? <Txt muted style={{ marginBottom: 12 }}>Gửi tới: <Txt weight="700">{mentorName}</Txt></Txt> : null}
          <Input label="Tiêu đề" value={f.title} onChangeText={set('title')} error={errors.title} />
          <Input label="Mô tả chi tiết" value={f.description} onChangeText={set('description')} multiline error={errors.description} />
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Lĩnh vực cần hỗ trợ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 4 }}>
            {(industries.data ?? []).map((i) => <Chip key={i.id} label={i.name} active={industryId === i.id} onPress={() => setIndustryId(i.id)} />)}
          </View>
          {errors.industry ? <Txt size={12} color="#DC2626" style={{ marginBottom: 8 }}>{errors.industry}</Txt> : <View style={{ height: 10 }} />}
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Loại hỗ trợ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {REQUEST_TASK_TYPES.map((t) => <Chip key={t.value} label={t.label} active={taskType === t.value} onPress={() => setTaskType(t.value)} />)}
          </View>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Hình thức làm việc</Txt>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />)}
          </View>
          <Input label="Ngân sách tối thiểu (VND)" value={f.budgetMin} onChangeText={(v) => set('budgetMin')(v.replace(/\D/g, ''))} keyboardType="number-pad" />
          <Input label="Ngân sách tối đa (VND)" value={f.budgetMax} onChangeText={(v) => set('budgetMax')(v.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.budget} />
          <DateField label="Thời hạn mong muốn (tùy chọn)" value={deadline} onChange={setDeadline} error={errors.deadline} />
          <Button title="Gửi yêu cầu" onPress={submit} loading={m.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
