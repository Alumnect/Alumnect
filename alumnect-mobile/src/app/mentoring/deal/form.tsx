import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DateField } from '@/components/DateField'
import { DEAL_TASK_TYPES, dealApi } from '@/api/mentoringFlow'
import type { DealPayload } from '@/api/mentoringFlow'
import { chatApi } from '@/api/chat'
import { WORKING_MODE_LABEL } from '@/api/mentoring'
import type { WorkingMode } from '@/api/mentoring'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { Check, Handshake, Send } from '@/components/icons'

function DealChip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
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
      {active && <Check size={13} color={isDark ? '#FFFFFF' : colors.actionText} weight="bold" />}
      <Txt size={13} weight={active ? '700' : '500'} style={{ color: active ? (isDark ? '#FFFFFF' : colors.actionText) : colors.text }}>
        {label}
      </Txt>
    </Pressable>
  )
}

/** UC94: đề xuất deal mới (conversationId) hoặc chỉnh sửa điều khoản (dealId) — Meetup x Kakao Form. */
export default function DealFormScreen() {
  const { colors, viridian } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { conversationId, dealId } = useLocalSearchParams<{ conversationId?: string; dealId?: string }>()
  const existing = useQuery({ queryKey: ['mentoring-deal', dealId], queryFn: () => dealApi.detail(Number(dealId)), enabled: !!dealId })
  const chatContext = useQuery({
    queryKey: ['mentoring-chat-context', conversationId],
    queryFn: () => chatApi.mentoringContext(Number(conversationId)),
    enabled: !!conversationId && !dealId,
  })

  const [f, setF] = useState({ taskScope: '', expectedResult: '', price: '', changeNote: '' })
  const [deadline, setDeadline] = useState('')
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [participation, setParticipation] = useState<'INDIVIDUAL' | 'GROUP'>('INDIVIDUAL')
  const [taskType, setTaskType] = useState('CONSULTATION')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)

  const d = existing.data?.deal
  const ctx = chatContext.data
  if (d && !loaded) {
    setLoaded(true)
    setF({ taskScope: d.taskScope, expectedResult: d.expectedResult, price: String(d.agreedPrice), changeNote: '' })
    setDeadline(d.deadline.slice(0, 19))
    setMode(d.workingMode)
    setParticipation(d.participationType)
    setTaskType(d.taskType)
  } else if (!dealId && ctx && !loaded) {
    setLoaded(true)
    const defaultScope = [ctx.requestTitle, ctx.requestDescription].filter(Boolean).join('\n\n')
    const defaultExpected = ctx.requestTitle ? `Hoàn thành yêu cầu "${ctx.requestTitle}" theo đúng mục tiêu đã thống nhất.` : ''
    const defaultPrice = ctx.budgetMax != null ? String(ctx.budgetMax) : ctx.budgetMin != null ? String(ctx.budgetMin) : ''
    const futureDeadline = ctx.expectedDeadline && new Date(ctx.expectedDeadline).getTime() > Date.now()
      ? ctx.expectedDeadline.slice(0, 19)
      : ''
    setF({
      taskScope: defaultScope,
      expectedResult: defaultExpected,
      price: defaultPrice,
      changeNote: '',
    })
    if (futureDeadline) setDeadline(futureDeadline)
    if (ctx.workingMode) setMode(ctx.workingMode)
    if (ctx.participationType) setParticipation(ctx.participationType === 'GROUP' ? 'GROUP' : 'INDIVIDUAL')
    if (ctx.taskType) setTaskType(ctx.taskType)
  }

  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  const m = useMutation({
    mutationFn: () => {
      const parsedDeadline = new Date(deadline)
      if (Number.isNaN(parsedDeadline.getTime())) {
        throw new Error('Hạn chót hoàn thành (Deadline) không hợp lệ.')
      }
      const p: DealPayload = {
        taskScope: f.taskScope.trim(),
        agreedPrice: Number(f.price),
        deadline: parsedDeadline.toISOString(),
        workingMode: mode,
        participationType: participation,
        taskType,
        expectedResult: f.expectedResult.trim(),
        changeNote: f.changeNote.trim() || undefined,
      }
      return dealId
        ? dealApi.update(Number(dealId), p)
        : dealApi.propose({ ...p, conversationId: Number(conversationId), proposalSource: 'RENEGOTIATION' })
    },
    onSuccess: (deal) => {
      toast.success(dealId ? 'Đã cập nhật điều khoản thỏa thuận.' : 'Đã gửi đề xuất thỏa thuận.')
      qc.invalidateQueries({ queryKey: ['mentoring-deal'] })
      qc.invalidateQueries({ queryKey: ['mentoring-deal-conv'] })
      qc.invalidateQueries({ queryKey: ['mentoring-chat-context'] })
      if (dealId) router.back()
      else router.replace({ pathname: '/mentoring/deal/[id]', params: { id: String(deal.id) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    if (f.taskScope.trim().length < 10 || f.taskScope.trim().length > 5000) e.taskScope = 'Phạm vi công việc phải từ 10 đến 5000 ký tự.'
    if (f.price === '' || Number(f.price) < 0) e.price = 'Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.'
    if (!deadline || Number.isNaN(new Date(deadline).getTime()) || new Date(deadline).getTime() <= Date.now()) {
      e.deadline = 'Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.'
    }
    if (f.expectedResult.trim().length < 10 || f.expectedResult.trim().length > 3000) e.expectedResult = 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.'
    if (f.changeNote.length > 255) e.changeNote = 'Ghi chú không được vượt quá 255 ký tự.'
    setErrors(e)
    if (!Object.keys(e).length) {
      m.mutate()
    } else {
      const firstError = Object.values(e)[0]
      if (firstError) toast.error(firstError)
    }
  }

  if (dealId && existing.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Chỉnh sửa thỏa thuận" />
        <Loading />
      </Screen>
    )
  if (dealId && !d)
    return (
      <Screen bg={colors.bg}>
        <Header title="Chỉnh sửa thỏa thuận" />
        <Empty text="Không tìm thấy thỏa thuận." error={existing.error} onRetry={() => { void existing.refetch() }} />
      </Screen>
    )

  if (dealId && d && !d.canEdit) {
    return (
      <Screen bg={colors.bg}>
        <Header title="Chi tiết thỏa thuận" />
        <Empty
          title="Không thể chỉnh sửa"
          text="Chỉ Mentor mới có quyền chỉnh sửa điều khoản thỏa thuận. Học viên vui lòng phản hồi hoặc từ chối trên chi tiết thỏa thuận."
          action="Xem chi tiết thỏa thuận"
          onAction={() => router.replace({ pathname: '/mentoring/deal/[id]', params: { id: String(dealId) } })}
        />
      </Screen>
    )
  }

  if (!dealId && ctx && !ctx.canCreateDealTicket) {
    return (
      <Screen bg={colors.bg}>
        <Header title="Đề xuất thỏa thuận" />
        <Empty
          title="Không có quyền đề xuất"
          text="Chỉ Mentor mới có quyền khởi tạo thỏa thuận. Học viên vui lòng trao đổi với Mentor qua tin nhắn."
          action="Quay lại trò chuyện"
          onAction={() => router.back()}
        />
      </Screen>
    )
  }

  return (
    <Screen bg={colors.bg}>
      <Header
        title={dealId ? 'Chỉnh sửa thỏa thuận' : 'Đề xuất thỏa thuận hợp tác'}
        subtitle="Xác lập phạm vi, ngân sách & thời hạn cố vấn"
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Handshake size={18} color={viridian} weight="bold" />
              <Txt weight="800" size={16} style={{ color: colors.text }}>
                Nội dung & Cam kết bàn giao
              </Txt>
            </View>
            <Input
              label="Phạm vi công việc (10 - 5000 ký tự)"
              placeholder="Mô tả rõ các hạng mục cố vấn, số buổi trao đổi..."
              value={f.taskScope}
              onChangeText={set('taskScope')}
              multiline
              error={errors.taskScope}
            />
            <Input
              label="Kết quả kỳ vọng đầu ra (10 - 3000 ký tự)"
              placeholder="Sản phẩm hoặc mục tiêu học viên đạt được sau khóa cố vấn..."
              value={f.expectedResult}
              onChangeText={set('expectedResult')}
              multiline
              error={errors.expectedResult}
            />
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Txt weight="800" size={16} style={{ color: colors.text, marginBottom: 12 }}>
              Chi phí & Thời hạn
            </Txt>
            <Input
              label="Giá trị thỏa thuận (VND)"
              placeholder="VD: 300000"
              value={f.price}
              onChangeText={(v) => set('price')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              error={errors.price}
            />
            <DateField label="Hạn chót hoàn thành (Deadline)" value={deadline} onChange={setDeadline} error={errors.deadline} />
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Hình thức làm việc
            </Txt>
            <View style={styles.chipWrap}>
              {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => (
                <DealChip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />
              ))}
            </View>

            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
              Quy mô tham gia
            </Txt>
            <View style={styles.chipWrap}>
              <DealChip label="Cá nhân (1:1)" active={participation === 'INDIVIDUAL'} onPress={() => setParticipation('INDIVIDUAL')} />
              <DealChip label="Theo nhóm" active={participation === 'GROUP'} onPress={() => setParticipation('GROUP')} />
            </View>

            <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8 }}>
              Loại nhiệm vụ cố vấn
            </Txt>
            <View style={styles.chipWrap}>
              {DEAL_TASK_TYPES.map((tt) => (
                <DealChip key={tt.value} label={tt.label} active={taskType === tt.value} onPress={() => setTaskType(tt.value)} />
              ))}
            </View>

            <View style={{ marginTop: 16 }}>
              <Input
                label="Ghi chú thay đổi / thương lượng (tùy chọn)"
                placeholder="Ghi chú thêm cho đối phương..."
                value={f.changeNote}
                onChangeText={set('changeNote')}
                error={errors.changeNote}
              />
            </View>
          </View>

          <Button
            title={dealId ? 'Lưu cập nhật thỏa thuận' : 'Gửi đề xuất thỏa thuận'}
            textColor="#FFFFFF"
            icon={<Send size={16} color="#FFFFFF" weight="fill" />}
            onPress={submit}
            loading={m.isPending}
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
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
})
