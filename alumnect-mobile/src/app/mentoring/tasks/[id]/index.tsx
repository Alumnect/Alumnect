import React, { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC96–101, 104: trung tâm quản lý một task — nhật ký, gia hạn, điều chỉnh, nghiệm thu, hòa giải, tranh chấp. */
export default function TaskDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const tid = Number(id)
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)

  const q = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-task', tid] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
  }
  const run = (fn: () => Promise<unknown>, ok: string) =>
    fn().then(() => { toast.success(ok); refresh() }).catch((e) => toast.error(errMsg(e)))
  const go = (type: string, extra?: Record<string, string>) =>
    router.push({ pathname: '/mentoring/tasks/[id]/action', params: { id: String(tid), type, ...extra } })

  const topup = useMutation({
    mutationFn: (amendmentId: number) => taskApi.checkout(q.data!.deal.id, amendmentId),
    onSuccess: setCheckout,
    onError: (e) => toast.error(errMsg(e)),
  })

  const d = q.data
  if (q.isLoading) return <Screen><Header title="Task" /><Loading /></Screen>
  if (!d) return <Screen><Header title="Task" /><Empty text="Không tìm thấy task." /></Screen>
  const { overview: o, permissions: p } = d
  const other = p.isStudent ? d.mentor : d.student

  return (
    <Screen>
      <Header title="Chi tiết task" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        <Txt size={20} weight="800">{o.taskTitle}</Txt>
        <Txt weight="700" color={t.primary} style={{ marginTop: 2 }}>{TASK_STATUS_LABEL[o.status] ?? o.status}{o.isOverdue ? ' · Quá hạn' : ''}</Txt>
        <View style={{ height: 8, backgroundColor: t.inputBg, borderRadius: 4, marginTop: 10, overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(100, o.progressPercentage)}%`, height: 8, backgroundColor: t.primary }} />
        </View>
        <Txt muted size={12} style={{ marginTop: 4 }}>{o.confirmedWorkLogs}/{o.totalWorkLogs} nhật ký đã xác nhận · Hạn {new Date(o.deadline).toLocaleString('vi-VN')} ({o.daysRemaining} ngày)</Txt>

        <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(other.id) } })}>
          <Avatar uri={other.avatarUrl} name={other.fullName} size={44} />
          <View style={{ flex: 1 }}>
            <Txt muted size={12}>{p.isStudent ? 'Mentor' : 'Sinh viên'}</Txt>
            <Txt weight="700">{other.fullName}</Txt>
          </View>
          <Txt weight="800" color={t.primary}>{formatVnd(o.agreedPrice)}</Txt>
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700">Phạm vi</Txt><Txt>{o.taskScope}</Txt>
          <Txt weight="700" style={{ marginTop: 8 }}>Kết quả kỳ vọng</Txt><Txt>{d.deal.expectedResult}</Txt>
        </Card>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {d.conversationId ? <Button title="Chat" variant="outline" style={{ height: 40 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } })} /> : null}
          <Button title="Báo cáo & dòng tiền" variant="outline" style={{ height: 40 }} onPress={() => router.push({ pathname: '/mentoring/tasks/[id]/report', params: { id: String(tid) } })} />
          {p.canRequestExtension ? <Button title="Gia hạn" variant="outline" style={{ height: 40 }} onPress={() => go('extension')} /> : null}
          {p.canRequestAmendment ? <Button title="Điều chỉnh task" variant="outline" style={{ height: 40 }} onPress={() => go('amendment')} /> : null}
          {p.canProposeSettlement ? <Button title="Đề xuất hòa giải" variant="outline" style={{ height: 40 }} onPress={() => go('settlement')} /> : null}
          {p.canSubmitCompletion ? <Button title="Nộp kết quả" style={{ height: 40 }} onPress={() => go('completion')} /> : null}
          {p.canCreateDisputeTicket ? <Button title="Khiếu nại" variant="danger" style={{ height: 40 }} onPress={() => go('dispute')} /> : null}
          {p.isStudent && o.status === 'COMPLETED' ? <Button title="Đánh giá mentor" style={{ height: 40 }} onPress={() => go('review')} /> : null}
        </View>

        {d.activeExtension && d.activeExtension.status === 'PENDING' ? (
          <Card style={{ marginTop: 14 }}>
            <Txt weight="700">Yêu cầu gia hạn</Txt>
            <Txt size={13}>{d.activeExtension.createdByName} đề xuất hạn mới {new Date(d.activeExtension.proposedDeadline).toLocaleString('vi-VN')}</Txt>
            <Txt muted size={13}>Lý do: {d.activeExtension.reason}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {d.activeExtension.canConfirm ? <Button title="Đồng ý" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, true), 'Đã chấp nhận gia hạn.')} /> : null}
              {d.activeExtension.canReject ? <Button title="Từ chối" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, false), 'Đã từ chối gia hạn.')} /> : null}
              {d.activeExtension.canCancel ? <Button title="Hủy đề xuất" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.cancelExtension(d.activeExtension!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}

        {d.activeAmendment && ['PENDING', 'AWAITING_TOPUP'].includes(d.activeAmendment.status) ? (
          <Card style={{ marginTop: 14 }}>
            <Txt weight="700">Đề xuất điều chỉnh task ({d.activeAmendment.status === 'AWAITING_TOPUP' ? 'chờ nạp thêm' : 'chờ phản hồi'})</Txt>
            {d.activeAmendment.newScope ? <Txt size={13}>Phạm vi mới: {d.activeAmendment.newScope}</Txt> : null}
            {d.activeAmendment.additionalAmount ? <Txt size={13}>Phát sinh: {formatVnd(d.activeAmendment.additionalAmount)}</Txt> : null}
            <Txt muted size={13}>Lý do: {d.activeAmendment.reason}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {d.activeAmendment.canConfirm ? <Button title="Đồng ý" style={{ height: 38 }} onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, true), 'Đã chấp nhận điều chỉnh.')} /> : null}
              {d.activeAmendment.canReject ? <Button title="Từ chối" variant="outline" style={{ height: 38 }} onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, false), 'Đã từ chối điều chỉnh.')} /> : null}
              {d.activeAmendment.canTopUp ? <Button title="Nạp thêm" style={{ height: 38 }} onPress={() => topup.mutate(d.activeAmendment!.id)} loading={topup.isPending} /> : null}
              {d.activeAmendment.canCancel ? <Button title="Hủy đề xuất" variant="outline" style={{ height: 38 }} onPress={() => run(() => taskApi.cancelAmendment(d.activeAmendment!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}

        {d.activeSettlementProposal && d.activeSettlementProposal.status === 'PENDING' ? (
          <Card style={{ marginTop: 14 }}>
            <Txt weight="700">Đề xuất hòa giải</Txt>
            <Txt size={13}>Mentor nhận {formatVnd(d.activeSettlementProposal.mentorAmount)} · Sinh viên hoàn {formatVnd(d.activeSettlementProposal.studentRefund)}</Txt>
            <Txt muted size={13}>Lý do: {d.activeSettlementProposal.reason}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {d.activeSettlementProposal.canAccept ? <Button title="Đồng ý" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, true), 'Đã chấp nhận hòa giải.')} /> : null}
              {d.activeSettlementProposal.canReject ? <Button title="Từ chối" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, false), 'Đã từ chối hòa giải.')} /> : null}
              {d.activeSettlementProposal.canCancel ? <Button title="Hủy" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.cancelSettlement(d.activeSettlementProposal!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}
        {p.canSubmitSettlementTicket ? <Button title="Gửi biên bản hòa giải" variant="outline" style={{ marginTop: 10 }} onPress={() => go('settlement-ticket')} /> : null}

        {d.latestCompletion && d.latestCompletion.status === 'PENDING' ? (
          <Card style={{ marginTop: 14 }}>
            <Txt weight="700">Kết quả được nộp</Txt>
            <Txt>{d.latestCompletion.finalSummary}</Txt>
            {d.latestCompletion.deliverables ? <Txt muted size={13}>Sản phẩm: {d.latestCompletion.deliverables}</Txt> : null}
            {p.canConfirmCompletion && d.latestCompletion.canConfirm ? (
              <View style={{ marginTop: 8 }}>
                <Input value={feedback[-1] ?? ''} onChangeText={(v) => setFeedback({ ...feedback, [-1]: v })} placeholder="Nhận xét (tùy chọn)" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title="Nghiệm thu" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, true, feedback[-1]), 'Đã nghiệm thu task.')} />
                  <Button title="Yêu cầu làm lại" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, false, feedback[-1]), 'Đã yêu cầu làm lại.')} />
                </View>
              </View>
            ) : null}
          </Card>
        ) : null}

        {d.activeTicket ? (
          <Card style={{ marginTop: 14, borderColor: t.danger }} onPress={() => router.push({ pathname: '/mentoring/dispute/[ticketId]/chat', params: { ticketId: String(d.activeTicket!.id), taskId: String(tid) } })}>
            <Txt weight="700" color={t.danger}>Ticket {d.activeTicket.ticketCode} · {d.activeTicket.status}</Txt>
            <Txt>{d.activeTicket.title}</Txt>
            <Txt muted size={12}>Chạm để trao đổi & nộp minh chứng</Txt>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 8 }}>
          <Txt weight="700" size={16} style={{ flex: 1 }}>Nhật ký công việc</Txt>
          {p.canAddWorkLog ? <Button title="Thêm" style={{ height: 36, paddingHorizontal: 16 }} onPress={() => go('worklog')} /> : null}
        </View>
        {d.workLogs.length === 0 ? <Txt muted>Chưa có nhật ký nào.</Txt> : null}
        {d.workLogs.map((w) => (
          <Card key={w.id} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt weight="700">{new Date(w.logDate).toLocaleDateString('vi-VN')}</Txt>
              <Txt size={12} weight="700" color={w.status === 'CONFIRMED' ? t.success : w.status === 'REJECTED' ? t.danger : t.warning}>
                {w.status === 'CONFIRMED' ? 'Đã xác nhận' : w.status === 'REJECTED' ? 'Cần làm rõ' : 'Chờ xác nhận'}
              </Txt>
            </View>
            <Txt style={{ marginTop: 4 }}>{w.description}</Txt>
            <Txt muted size={13} style={{ marginTop: 4 }}>Đã làm: {w.workCompleted}</Txt>
            <Txt muted size={13}>Kết quả: {w.result}</Txt>
            {w.nextAction ? <Txt muted size={13}>Tiếp theo: {w.nextAction}</Txt> : null}
            {w.studentFeedback ? <Txt size={13} color={t.warning}>Phản hồi: {w.studentFeedback}</Txt> : null}
            {w.canConfirm || w.canReject ? (
              <View style={{ marginTop: 8 }}>
                <Input value={feedback[w.id] ?? ''} onChangeText={(v) => setFeedback({ ...feedback, [w.id]: v })} placeholder="Phản hồi (bắt buộc khi yêu cầu làm rõ)" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {w.canConfirm ? <Button title="Xác nhận" style={{ flex: 1, height: 38 }} onPress={() => run(() => taskApi.confirmWorkLog(tid, w.id, feedback[w.id]), 'Đã xác nhận nhật ký.')} /> : null}
                  {w.canReject ? <Button title="Yêu cầu làm rõ" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => (feedback[w.id]?.trim() ? run(() => taskApi.rejectWorkLog(tid, w.id, feedback[w.id]), 'Đã gửi yêu cầu làm rõ.') : toast.error('Vui lòng nhập lý do cần làm rõ.'))} /> : null}
                </View>
              </View>
            ) : null}
            {w.canEdit ? <Button title="Sửa nhật ký" variant="ghost" onPress={() => go('worklog', { workLogId: String(w.id) })} /> : null}
          </Card>
        ))}

        {d.history.length ? (
          <>
            <Txt weight="700" size={16} style={{ marginTop: 16, marginBottom: 8 }}>Lịch sử</Txt>
            {d.history.slice(0, 15).map((h) => (
              <Txt key={h.id} muted size={12} style={{ marginBottom: 4 }}>{new Date(h.timestamp).toLocaleString('vi-VN')} · {h.title} ({h.actorName})</Txt>
            ))}
          </>
        ) : null}
      </ScrollView>
      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => { setCheckout(null); refresh() }}
        onClose={() => setCheckout(null)}
        onCancel={async () => { if (checkout) await taskApi.cancelPayment(checkout.orderCode).catch(() => {}); setCheckout(null) }}
      />
    </Screen>
  )
}
