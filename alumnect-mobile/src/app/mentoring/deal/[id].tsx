import React, { useState } from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tag, Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { BottomBar, InfoRow, SectionCard } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import { CalendarClock, CheckCircle2, Circle, ClipboardList, CreditCard, FilePen, History, Laptop, Target } from '@/components/icons'
import { PaymentSheet } from '@/components/PaymentSheet'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** Ô trạng thái xác nhận của từng bên. */
function Confirm({ ok, who }: { ok: boolean; who: string }) {
  const t = useTheme()
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, backgroundColor: ok ? t.successTint : t.surface }}>
      {ok ? <CheckCircle2 size={16} color={t.success} /> : <Circle size={16} color={t.textSubtle} />}
      <Txt size={12} weight="700" color={ok ? t.success : t.textMuted}>{`${who} ${ok ? 'đã xác nhận' : 'chưa xác nhận'}`}</Txt>
    </View>
  )
}

/** UC94–95: xem deal, xác nhận / chỉnh sửa / từ chối, thanh toán task qua PayOS. */
export default function DealScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [note, setNote] = useState('')
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)

  const q = useQuery({ queryKey: ['mentoring-deal', id], queryFn: () => dealApi.detail(Number(id)) })
  const deal = q.data?.deal
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-deal', id] })
    qc.invalidateQueries({ queryKey: ['mentoring-deals'] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
  }
  const run = (fn: () => Promise<unknown>, ok: string) => () =>
    fn().then(() => { toast.success(ok); refresh() }).catch((e) => toast.error(errMsg(e)))

  const pay = useMutation({ mutationFn: () => taskApi.checkout(Number(id)), onSuccess: setCheckout, onError: (e) => toast.error(errMsg(e)) })

  if (q.isLoading) return <Screen keyboard><Header title="Deal" /><Loading /></Screen>
  if (!deal) return <Screen keyboard><Header title="Deal" /><Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy deal." /></Screen>

  const goTask = async () => {
    try {
      const td = await taskApi.byDeal(deal.id)
      router.replace({ pathname: '/mentoring/tasks/[id]', params: { id: String(td.overview.id) } })
    } catch (e) { toast.error(errMsg(e)) }
  }

  const hasNote = deal.canReject || deal.canRequestAdjustment

  return (
    <Screen keyboard bg={t.card}>
      <Header title={`Thỏa thuận #${deal.id}`} subtitle={`Phiên bản ${deal.version}`} />
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: t.card, padding: 16, marginBottom: 16 }}>
          <Tag label={DEAL_STATUS_LABEL[deal.status] ?? deal.status} tone={statusTone(deal.status)} />
          <Txt muted size={12} style={{ marginTop: 12 }}>GIÁ THỎA THUẬN</Txt>
          <Txt size={30} weight="800" color={t.primary}>{formatVnd(deal.agreedPrice)}</Txt>
          <Txt muted size={13} style={{ marginTop: 2 }}>{`${deal.studentName} ↔ ${deal.mentorName}`}</Txt>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Confirm ok={deal.studentConfirmed} who="Sinh viên" />
            <Confirm ok={deal.mentorConfirmed} who="Mentor" />
          </View>
          {deal.isPaid ? <Tag label="Đã thanh toán" tone="success" style={{ marginTop: 10 }} /> : null}
        </View>

        <SectionCard title="Nội dung công việc" icon={<Target size={18} color={t.primary} />}>
          <Txt muted size={12} weight="700">PHẠM VI</Txt>
          <Txt style={{ lineHeight: 21, marginTop: 2 }}>{deal.taskScope}</Txt>
          <Txt muted size={12} weight="700" style={{ marginTop: 10 }}>KẾT QUẢ KỲ VỌNG</Txt>
          <Txt style={{ lineHeight: 21, marginTop: 2 }}>{deal.expectedResult}</Txt>
        </SectionCard>

        <Card style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 4 }}>
          <InfoRow icon={<CalendarClock size={16} color={t.primary} />} label="Hạn chót" value={new Date(deal.deadline).toLocaleString('vi-VN')} />
          <InfoRow icon={<Laptop size={16} color={t.primary} />} label="Hình thức" value={`${WORKING_MODE_LABEL[deal.workingMode] ?? ''} · ${deal.participationType === 'GROUP' ? 'Nhóm' : 'Cá nhân'}`} />
          <InfoRow icon={<ClipboardList size={16} color={t.primary} />} label="Loại công việc" value={taskTypeLabel(deal.taskType)} last />
        </Card>
        {deal.readOnlyReason ? (
          <View style={{ marginHorizontal: 16, marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: t.infoTint }}>
            <Txt size={13} color={t.info}>{deal.readOnlyReason}</Txt>
          </View>
        ) : null}

        {(q.data?.snapshots?.length ?? 0) > 1 ? (
          <SectionCard title="Lịch sử thương lượng" icon={<History size={18} color={t.primary} />}>
            {q.data!.snapshots.map((sn, i, arr) => (
              <View key={sn.id} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: i === arr.length - 1 ? t.primary : t.border }} />
                  {i < arr.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.divider }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 12 }}>
                  <Txt size={13} weight="700">{`v${sn.version} · ${formatVnd(sn.agreedPrice)}`}</Txt>
                  <Txt muted size={12}>{[sn.modifiedByName, sn.changeNote].filter(Boolean).join(' · ')}</Txt>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {hasNote ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <Input label="Ghi chú / lý do (khi yêu cầu điều chỉnh hoặc từ chối)" value={note} onChangeText={setNote} multiline />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {deal.canRequestAdjustment ? <Button title="Yêu cầu điều chỉnh" size="sm" variant="outline" style={{ flex: 1 }} onPress={run(() => dealApi.requestAdjustment(deal.id, note || undefined, deal.version), 'Đã gửi yêu cầu điều chỉnh.')} /> : null}
              {deal.canReject ? <Button title="Từ chối" size="sm" variant="ghost" style={{ flex: 1 }} onPress={run(() => dealApi.reject(deal.id, note || undefined, deal.version), 'Đã từ chối deal.')} /> : null}
            </View>
          </Card>
        ) : null}
        {deal.canEdit ? (
          <Button title="Chỉnh sửa điều khoản" variant="secondary" icon={<FilePen size={16} color={t.primary} />} style={{ marginHorizontal: 16 }} onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { dealId: String(deal.id) } })} />
        ) : null}
      </ScrollView>
      {deal.canConfirm || deal.canPay || deal.isPaid || deal.taskId ? (
        <BottomBar>
          {deal.isPaid || deal.taskId ? <Button title="Mở task" variant={deal.canPay || deal.canConfirm ? 'outline' : 'primary'} onPress={goTask} style={{ flex: 1 }} /> : null}
          {deal.canConfirm ? <Button title="Xác nhận deal" icon={<CheckCircle2 size={16} color="#fff" />} onPress={run(() => dealApi.confirm(deal.id, deal.version), 'Đã xác nhận deal.')} style={{ flex: 1.4 }} /> : null}
          {deal.canPay ? <Button title={`Thanh toán ${formatVnd(deal.agreedPrice)}`} icon={<CreditCard size={16} color="#fff" />} onPress={() => pay.mutate()} loading={pay.isPending} style={{ flex: 1.6 }} /> : null}
        </BottomBar>
      ) : null}
      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => { setCheckout(null); refresh(); toast.success('Thanh toán thành công! Task của bạn đã được kích hoạt.'); goTask() }}
        onClose={() => setCheckout(null)}
        onCancel={async () => { if (checkout) await taskApi.cancelPayment(checkout.orderCode).catch(() => {}); setCheckout(null) }}
      />
    </Screen>
  )
}
