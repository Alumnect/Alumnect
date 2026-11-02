import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Chip, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DateField } from '@/components/DateField'
import { DEAL_TASK_TYPES, dealApi } from '@/api/mentoringFlow'
import type { DealPayload } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL } from '@/api/mentoring'
import type { WorkingMode } from '@/api/mentoring'
import { toast, errMsg } from '@/lib/toast'

/** UC94: đề xuất deal mới (conversationId) hoặc chỉnh sửa điều khoản (dealId). */
export default function DealFormScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { conversationId, dealId, renegotiate } = useLocalSearchParams<{ conversationId?: string; dealId?: string; renegotiate?: string }>()
  const existing = useQuery({ queryKey: ['mentoring-deal', dealId], queryFn: () => dealApi.detail(Number(dealId)), enabled: !!dealId })

  const [f, setF] = useState({ taskScope: '', expectedResult: '', price: '', changeNote: '' })
  const [deadline, setDeadline] = useState('')
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [participation, setParticipation] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL')
  const [taskType, setTaskType] = useState('CONSULTATION')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const d = existing.data?.deal
  if (d && !loaded) {
    setLoaded(true)
    setF({ taskScope: d.taskScope, expectedResult: d.expectedResult, price: String(d.agreedPrice), changeNote: '' })
    setDeadline(d.deadline.slice(0, 19)); setMode(d.workingMode); setParticipation(d.participationType); setTaskType(d.taskType)
  }
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const m = useMutation({
    mutationFn: () => {
      const p: DealPayload = { taskScope: f.taskScope.trim(), agreedPrice: Number(f.price), deadline, workingMode: mode, participationType: participation, taskType, expectedResult: f.expectedResult.trim(), changeNote: f.changeNote.trim() || undefined }
      return dealId ? dealApi.update(Number(dealId), p) : dealApi.propose({ ...p, conversationId: Number(conversationId), proposalSource: renegotiate ? 'RENEGOTIATION' : 'REQUEST_ACCEPTANCE' })
    },
    onSuccess: (deal) => {
      toast.success(dealId ? 'Đã cập nhật điều khoản deal.' : 'Đã gửi đề xuất deal.')
      qc.invalidateQueries({ queryKey: ['mentoring-deal'] })
      qc.invalidateQueries({ queryKey: ['mentoring-deal-conv'] })
      if (dealId) router.back()
      else router.replace({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (f.taskScope.trim().length < 10 || f.taskScope.trim().length > 5000) e.taskScope = 'Phạm vi công việc phải từ 10 đến 5000 ký tự.'
    if (f.price === '' || Number(f.price) < 0) e.price = 'Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.'
    if (!deadline || new Date(deadline).getTime() <= Date.now()) e.deadline = 'Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.'
    if (f.expectedResult.trim().length < 10 || f.expectedResult.trim().length > 3000) e.expectedResult = 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.'
    if (f.changeNote.length > 255) e.changeNote = 'Ghi chú không được vượt quá 255 ký tự.'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (dealId && existing.isLoading) return <Screen><Header title="Chỉnh sửa deal" /><Loading /></Screen>
  if (dealId && !d) return <Screen><Header title="Chỉnh sửa deal" /><Empty text="Không tìm thấy thỏa thuận." error={existing.error} onRetry={() => { void existing.refetch() }} /></Screen>

  return (
    <Screen>
      <Header title={dealId ? 'Chỉnh sửa deal' : 'Đề xuất deal'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Input label="Phạm vi công việc" value={f.taskScope} onChangeText={set('taskScope')} multiline error={errors.taskScope} />
          <Input label="Kết quả kỳ vọng" value={f.expectedResult} onChangeText={set('expectedResult')} multiline error={errors.expectedResult} />
          <Input label="Giá thỏa thuận (VND)" value={f.price} onChangeText={(v) => set('price')(v.replace(/\D/g, ''))} keyboardType="number-pad" error={errors.price} />
          <DateField label="Hạn chót" value={deadline} onChange={setDeadline} error={errors.deadline} />
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Hình thức</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />)}
          </View>
          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <Chip label="Cá nhân" active={participation === 'INDIVIDUAL'} onPress={() => setParticipation('INDIVIDUAL')} />
            <Chip label="Nhóm" active={participation === 'GROUP'} onPress={() => setParticipation('GROUP')} />
          </View>
          <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Loại nhiệm vụ</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, marginBottom: 12 }}>
            {DEAL_TASK_TYPES.map((tt) => <Chip key={tt.value} label={tt.label} active={taskType === tt.value} onPress={() => setTaskType(tt.value)} />)}
          </View>
          <Input label="Ghi chú thay đổi (tùy chọn)" value={f.changeNote} onChangeText={set('changeNote')} error={errors.changeNote} />
          <Button title={dealId ? 'Lưu thay đổi' : 'Gửi đề xuất'} onPress={submit} loading={m.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
