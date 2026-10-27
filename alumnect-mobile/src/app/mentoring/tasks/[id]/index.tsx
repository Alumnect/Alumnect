import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { SectionCard, StatBox, StatRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import { BarChart3, CalendarDays, CalendarPlus, ChevronRight, FileCheck2, FilePen, History, MessageCircle, NotebookPen, PackageCheck, Plus, Scale, ShieldAlert, Star, Target, Zap } from '@/components/icons'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useTheme, palette } from '@/theme'
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
  if (q.isLoading) return <Screen keyboard><Header title="Task" /><Loading /></Screen>
  if (!d) return <Screen keyboard><Header title="Task" /><Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy task." /></Screen>
  const { overview: o, permissions: p } = d
  const other = p.isStudent ? d.mentor : d.student

  const pct = Math.min(100, o.progressPercentage ?? 0)
  const actions: { key: string; label: string; icon: React.ReactNode; onPress: () => void; tone?: string }[] = [
    ...(d.conversationId ? [{ key: 'chat', label: 'Chat', icon: <MessageCircle size={20} color={palette.info} />, tone: palette.info, onPress: () => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } }) }] : []),
    { key: 'report', label: 'Báo cáo & dòng tiền', icon: <BarChart3 size={20} color={palette.success} />, tone: palette.success, onPress: () => router.push({ pathname: '/mentoring/tasks/[id]/report', params: { id: String(tid) } }) },
    ...(p.canSubmitCompletion ? [{ key: 'completion', label: 'Nộp kết quả', icon: <PackageCheck size={20} color={palette.primary} />, onPress: () => go('completion') }] : []),
    ...(p.canRequestExtension ? [{ key: 'extension', label: 'Gia hạn', icon: <CalendarPlus size={20} color={palette.warning} />, tone: palette.warning, onPress: () => go('extension') }] : []),
    ...(p.canRequestAmendment ? [{ key: 'amendment', label: 'Điều chỉnh task', icon: <FilePen size={20} color={t.textMuted} />, onPress: () => go('amendment') }] : []),
    ...(p.canProposeSettlement ? [{ key: 'settlement', label: 'Đề xuất hòa giải', icon: <Scale size={20} color="#0891B2" />, tone: '#0891B2', onPress: () => go('settlement') }] : []),
    ...(p.canSubmitSettlementTicket ? [{ key: 'ticket', label: 'Gửi biên bản hòa giải', icon: <FileCheck2 size={20} color="#0891B2" />, tone: '#0891B2', onPress: () => go('settlement-ticket') }] : []),
    ...(p.isStudent && o.status === 'COMPLETED' ? [{ key: 'review', label: 'Đánh giá mentor', icon: <Star size={20} color={palette.star} />, tone: palette.star, onPress: () => go('review') }] : []),
    ...(p.canCreateDisputeTicket ? [{ key: 'dispute', label: 'Khiếu nại', icon: <ShieldAlert size={20} color={palette.danger} />, tone: palette.danger, onPress: () => go('dispute') }] : []),
  ]

  return (
    <Screen keyboard bg={t.card}>
      <Header title="Chi tiết task" />
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ backgroundColor: t.card, padding: 16, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Tag label={TASK_STATUS_LABEL[o.status] ?? o.status} tone={statusTone(o.status)} />
            {o.isOverdue ? <Tag label="Quá hạn" tone="danger" /> : null}
          </View>
          <Txt size={21} weight="800" style={{ marginTop: 10, lineHeight: 28 }}>{o.taskTitle}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <View style={{ flex: 1, height: 10, backgroundColor: t.inputBg, borderRadius: 5, overflow: 'hidden' }}>
              <View style={{ width: `${pct}%`, height: 10, borderRadius: 5, backgroundColor: pct >= 100 ? t.success : t.primary }} />
            </View>
            <Txt weight="800">{`${pct}%`}</Txt>
          </View>
          <StatRow style={{ marginTop: 14 }}>
            <StatBox value={`${o.confirmedWorkLogs}/${o.totalWorkLogs}`} label="Nhật ký đã duyệt" />
            <StatBox value={o.daysRemaining} label="Ngày còn lại" color={o.isOverdue ? t.danger : undefined} />
            <StatBox value={formatVnd(o.agreedPrice)} label="Ngân sách" color={t.primary} />
          </StatRow>
          <Txt muted size={12} style={{ marginTop: 8 }}>{`Hạn chót: ${new Date(o.deadline).toLocaleString('vi-VN')}`}</Txt>
        </View>

        <Card style={{ marginHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(other.id) } })}>
          <Avatar uri={other.avatarUrl} name={other.fullName} size={46} />
          <View style={{ flex: 1 }}>
            <Txt muted size={12}>{p.isStudent ? 'Mentor của bạn' : 'Sinh viên'}</Txt>
            <Txt weight="700">{other.fullName}</Txt>
          </View>
          <ChevronRight size={18} color={t.textSubtle} />
        </Card>

        <SectionCard title="Phạm vi & kết quả" icon={<Target size={18} color={t.primary} />}>
          <Txt muted size={12} weight="700">PHẠM VI</Txt>
          <Txt style={{ lineHeight: 21, marginTop: 2 }}>{o.taskScope}</Txt>
          <Txt muted size={12} weight="700" style={{ marginTop: 10 }}>KẾT QUẢ KỲ VỌNG</Txt>
          <Txt style={{ lineHeight: 21, marginTop: 2 }}>{d.deal.expectedResult}</Txt>
        </SectionCard>

        <SectionCard title="Thao tác" icon={<Zap size={18} color={t.primary} />}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                accessibilityRole="button"
                style={({ pressed }) => ({ width: '50%', padding: 4, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: t.surface }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${a.tone ?? palette.primary}1A` }}>{a.icon}</View>
                  <Txt size={13} weight="700" style={{ flex: 1 }} numberOfLines={2}>{a.label}</Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {d.activeExtension && d.activeExtension.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: t.warning }}>
            <Txt weight="700">Yêu cầu gia hạn</Txt>
            <Txt size={13}>{d.activeExtension.createdByName} đề xuất hạn mới {new Date(d.activeExtension.proposedDeadline).toLocaleString('vi-VN')}</Txt>
            <Txt muted size={13}>Lý do: {d.activeExtension.reason}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {d.activeExtension.canConfirm ? <Button title="Đồng ý" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, true), 'Đã chấp nhận gia hạn.')} /> : null}
              {d.activeExtension.canReject ? <Button title="Từ chối" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, false), 'Đã từ chối gia hạn.')} /> : null}
              {d.activeExtension.canCancel ? <Button title="Hủy đề xuất" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.cancelExtension(d.activeExtension!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}

        {d.activeAmendment && ['PENDING', 'AWAITING_TOPUP'].includes(d.activeAmendment.status) ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: t.warning }}>
            <Txt weight="700">Đề xuất điều chỉnh task ({d.activeAmendment.status === 'AWAITING_TOPUP' ? 'chờ nạp thêm' : 'chờ phản hồi'})</Txt>
            {d.activeAmendment.newScope ? <Txt size={13}>Phạm vi mới: {d.activeAmendment.newScope}</Txt> : null}
            {d.activeAmendment.additionalAmount ? <Txt size={13}>Phát sinh: {formatVnd(d.activeAmendment.additionalAmount)}</Txt> : null}
            <Txt muted size={13}>Lý do: {d.activeAmendment.reason}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {d.activeAmendment.canConfirm ? <Button title="Đồng ý" style={{ minHeight: 44 }} onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, true), 'Đã chấp nhận điều chỉnh.')} /> : null}
              {d.activeAmendment.canReject ? <Button title="Từ chối" variant="outline" style={{ minHeight: 44 }} onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, false), 'Đã từ chối điều chỉnh.')} /> : null}
              {d.activeAmendment.canTopUp ? <Button title="Nạp thêm" style={{ minHeight: 44 }} onPress={() => topup.mutate(d.activeAmendment!.id)} loading={topup.isPending} /> : null}
              {d.activeAmendment.canCancel ? <Button title="Hủy đề xuất" variant="outline" style={{ minHeight: 44 }} onPress={() => run(() => taskApi.cancelAmendment(d.activeAmendment!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}

        {d.activeSettlementProposal && d.activeSettlementProposal.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: t.warning }}>
            <Txt weight="700">Đề xuất hòa giải</Txt>
            <Txt size={13}>Mentor nhận {formatVnd(d.activeSettlementProposal.mentorAmount)} · Sinh viên hoàn {formatVnd(d.activeSettlementProposal.studentRefund)}</Txt>
            <Txt muted size={13}>Lý do: {d.activeSettlementProposal.reason}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              {d.activeSettlementProposal.canAccept ? <Button title="Đồng ý" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, true), 'Đã chấp nhận hòa giải.')} /> : null}
              {d.activeSettlementProposal.canReject ? <Button title="Từ chối" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, false), 'Đã từ chối hòa giải.')} /> : null}
              {d.activeSettlementProposal.canCancel ? <Button title="Hủy" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.cancelSettlement(d.activeSettlementProposal!.id), 'Đã hủy đề xuất.')} /> : null}
            </View>
          </Card>
        ) : null}

        {d.latestCompletion && d.latestCompletion.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: t.warning }}>
            <Txt weight="700">Kết quả được nộp</Txt>
            <Txt>{d.latestCompletion.finalSummary}</Txt>
            {d.latestCompletion.deliverables ? <Txt muted size={13}>Sản phẩm: {d.latestCompletion.deliverables}</Txt> : null}
            {p.canConfirmCompletion && d.latestCompletion.canConfirm ? (
              <View style={{ marginTop: 8 }}>
                <Input value={feedback[-1] ?? ''} onChangeText={(v) => setFeedback({ ...feedback, [-1]: v })} placeholder="Nhận xét (tùy chọn)" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button title="Nghiệm thu" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, true, feedback[-1]), 'Đã nghiệm thu task.')} />
                  <Button title="Yêu cầu làm lại" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, false, feedback[-1]), 'Đã yêu cầu làm lại.')} />
                </View>
              </View>
            ) : null}
          </Card>
        ) : null}

        {d.activeTicket ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: t.danger }} onPress={() => router.push({ pathname: '/mentoring/dispute/[ticketId]/chat', params: { ticketId: String(d.activeTicket!.id), taskId: String(tid) } })}>
            <Txt weight="700" color={t.danger}>Ticket {d.activeTicket.ticketCode} · {d.activeTicket.status}</Txt>
            <Txt>{d.activeTicket.title}</Txt>
            <Txt muted size={12}>Chạm để trao đổi & nộp minh chứng</Txt>
          </Card>
        ) : null}

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 }}>
          <Txt weight="800" size={16} style={{ flex: 1 }}>Nhật ký công việc</Txt>
          {p.canAddWorkLog ? <Button title="Thêm nhật ký" size="sm" icon={<Plus size={15} color="#fff" />} onPress={() => go('worklog')} /> : null}
        </View>
        {d.workLogs.length === 0 ? <Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<NotebookPen size={26} color={t.primary} />} title="Chưa có nhật ký" text="Mentor ghi nhật ký sau mỗi buổi làm việc để theo dõi tiến độ." /> : null}
        {d.workLogs.map((w) => (
          <Card key={w.id} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={15} color={t.textMuted} />
              <Txt weight="800" style={{ flex: 1 }}>{new Date(w.logDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}</Txt>
              <Tag
                label={w.status === 'CONFIRMED' ? 'Đã xác nhận' : w.status === 'REJECTED' ? 'Cần làm rõ' : 'Chờ xác nhận'}
                tone={w.status === 'CONFIRMED' ? 'success' : w.status === 'REJECTED' ? 'danger' : 'warning'}
              />
            </View>
            <Txt style={{ marginTop: 8, lineHeight: 21 }}>{w.description}</Txt>
            <View style={{ marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: t.surface, gap: 4 }}>
              <Txt size={13}><Txt size={13} weight="700">Đã làm: </Txt>{w.workCompleted}</Txt>
              <Txt size={13}><Txt size={13} weight="700">Kết quả: </Txt>{w.result}</Txt>
              {w.nextAction ? <Txt size={13}><Txt size={13} weight="700">Tiếp theo: </Txt>{w.nextAction}</Txt> : null}
            </View>
            {w.studentFeedback ? <Txt size={13} color={t.warning} style={{ marginTop: 6 }}>{`Phản hồi: ${w.studentFeedback}`}</Txt> : null}
            {w.canConfirm || w.canReject ? (
              <View style={{ marginTop: 8 }}>
                <Input value={feedback[w.id] ?? ''} onChangeText={(v) => setFeedback({ ...feedback, [w.id]: v })} placeholder="Phản hồi (bắt buộc khi yêu cầu làm rõ)" />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {w.canConfirm ? <Button title="Xác nhận" style={{ flex: 1, minHeight: 44 }} onPress={() => run(() => taskApi.confirmWorkLog(tid, w.id, feedback[w.id]), 'Đã xác nhận nhật ký.')} /> : null}
                  {w.canReject ? <Button title="Yêu cầu làm rõ" variant="outline" style={{ flex: 1, minHeight: 44 }} onPress={() => (feedback[w.id]?.trim() ? run(() => taskApi.rejectWorkLog(tid, w.id, feedback[w.id]), 'Đã gửi yêu cầu làm rõ.') : toast.error('Vui lòng nhập lý do cần làm rõ.'))} /> : null}
                </View>
              </View>
            ) : null}
            {w.canEdit ? <Button title="Sửa nhật ký" variant="ghost" onPress={() => go('worklog', { workLogId: String(w.id) })} /> : null}
          </Card>
        ))}

        {d.history.length ? (
          <>
            <SectionCard title="Lịch sử hoạt động" icon={<History size={18} color={t.primary} />} style={{ marginTop: 8 }}>
              {d.history.slice(0, 15).map((h, i, arr) => (
                <View key={h.id} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, marginTop: 5, backgroundColor: i === 0 ? t.primary : t.border }} />
                    {i < arr.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.divider }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 12 }}>
                    <Txt size={13} weight="600">{h.title}</Txt>
                    <Txt muted size={12}>{`${h.actorName} · ${new Date(h.timestamp).toLocaleString('vi-VN')}`}</Txt>
                  </View>
                </View>
              ))}
            </SectionCard>
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
