import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

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

  if (q.isLoading) return <Screen><Header title="Deal" /><Loading /></Screen>
  if (!deal) return <Screen><Header title="Deal" /><Empty text="Không tìm thấy deal." /></Screen>

  const goTask = async () => {
    try {
      const td = await taskApi.byDeal(deal.id)
      router.replace({ pathname: '/mentoring/tasks/[id]', params: { id: String(td.overview.id) } })
    } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <Screen>
      <Header title={`Deal #${deal.id}`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Txt weight="800" size={20} color={t.primary}>{DEAL_STATUS_LABEL[deal.status] ?? deal.status}</Txt>
        <Txt muted size={13}>Phiên bản {deal.version} · {deal.studentName} ↔ {deal.mentorName}</Txt>
        <Card style={{ marginTop: 12, gap: 6 }}>
          <Txt muted size={13}>Phạm vi công việc</Txt><Txt>{deal.taskScope}</Txt>
          <Txt muted size={13} style={{ marginTop: 6 }}>Kết quả kỳ vọng</Txt><Txt>{deal.expectedResult}</Txt>
          <View style={{ height: 1, backgroundColor: t.border, marginVertical: 6 }} />
          <Txt>Giá thỏa thuận: <Txt weight="800" color={t.primary}>{formatVnd(deal.agreedPrice)}</Txt></Txt>
          <Txt>Hạn chót: {new Date(deal.deadline).toLocaleString('vi-VN')}</Txt>
          <Txt>Hình thức: {WORKING_MODE_LABEL[deal.workingMode]} · {deal.participationType === 'GROUP' ? 'Nhóm' : 'Cá nhân'}</Txt>
          <Txt>Loại: {taskTypeLabel(deal.taskType)}</Txt>
          <Txt muted size={12}>Sinh viên {deal.studentConfirmed ? '✓ đã xác nhận' : 'chưa xác nhận'} · Mentor {deal.mentorConfirmed ? '✓ đã xác nhận' : 'chưa xác nhận'}</Txt>
        </Card>
        {deal.readOnlyReason ? <Txt muted size={13} style={{ marginTop: 8 }}>{deal.readOnlyReason}</Txt> : null}

        {(q.data?.snapshots?.length ?? 0) > 1 ? (
          <Card style={{ marginTop: 12 }}>
            <Txt weight="700" style={{ marginBottom: 6 }}>Lịch sử thương lượng</Txt>
            {q.data!.snapshots.map((s) => (
              <Txt key={s.id} muted size={12}>v{s.version} · {s.modifiedByName} · {formatVnd(s.agreedPrice)}{s.changeNote ? ` · ${s.changeNote}` : ''}</Txt>
            ))}
          </Card>
        ) : null}

        <View style={{ gap: 10, marginTop: 16 }}>
          {deal.canConfirm ? <Button title="Xác nhận deal" onPress={run(() => dealApi.confirm(deal.id, deal.version), 'Đã xác nhận deal.')} /> : null}
          {deal.canEdit ? <Button title="Chỉnh sửa điều khoản" variant="outline" onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { dealId: String(deal.id) } })} /> : null}
          {deal.canPay ? <Button title={`Thanh toán ${formatVnd(deal.agreedPrice)}`} onPress={() => pay.mutate()} loading={pay.isPending} /> : null}
          {deal.isPaid || deal.taskId ? <Button title="Mở task" variant="outline" onPress={goTask} /> : null}
          {deal.canReject || deal.canRequestAdjustment ? <Input label="Ghi chú / lý do" value={note} onChangeText={setNote} multiline /> : null}
          {deal.canRequestAdjustment ? <Button title="Yêu cầu điều chỉnh" variant="outline" onPress={run(() => dealApi.requestAdjustment(deal.id, note || undefined, deal.version), 'Đã gửi yêu cầu điều chỉnh.')} /> : null}
          {deal.canReject ? <Button title="Từ chối deal" variant="danger" onPress={run(() => dealApi.reject(deal.id, note || undefined, deal.version), 'Đã từ chối deal.')} /> : null}
        </View>
      </ScrollView>
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
