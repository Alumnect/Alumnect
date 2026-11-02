import React from 'react'
import { View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { InfoRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import { CalendarClock, ClipboardList, Handshake, Hourglass, Laptop, Layers, ListChecks, MessageCircle, Wallet, XCircle } from '@/components/icons'
import { Header } from '@/components/Header'
import { REQUEST_STATUS_LABEL, RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { useTheme } from '@/theme'
import { toast, errMsg } from '@/lib/toast'

/** UC92: chi tiết yêu cầu + phản hồi của mentor; mở chat để chốt deal. */
export default function RequestDetailScreen() {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentoring-request', id], queryFn: () => requestApi.detail(Number(id)) })
  const cancel = useMutation({
    mutationFn: () => requestApi.cancel(Number(id)),
    onSuccess: () => {
      toast.success('Đã hủy yêu cầu.')
      qc.invalidateQueries({ queryKey: ['mentoring-request', id] })
      qc.invalidateQueries({ queryKey: ['mentoring-requests'] })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const r = q.data
  if (q.isLoading) return <Screen><Header title="Yêu cầu" /><Loading /></Screen>
  if (!r) return <Screen><Header title="Yêu cầu" /><Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy yêu cầu." /></Screen>
  const responses = r.mentorResponses ?? []
  return (
    <Screen bg={t.card}>
      <Header title="Chi tiết yêu cầu" />
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ backgroundColor: t.card, padding: 16, marginBottom: 16 }}>
          <Tag label={REQUEST_STATUS_LABEL[r.status] ?? r.status} tone={statusTone(r.status)} />
          <Txt size={21} weight="800" style={{ marginTop: 10, lineHeight: 28 }}>{r.title}</Txt>
          <Txt style={{ marginTop: 10, lineHeight: 22 }}>{r.description}</Txt>
        </View>
        <Card style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 4 }}>
          <InfoRow icon={<ClipboardList size={16} color={t.primary} />} label="Loại hỗ trợ" value={taskTypeLabel(r.taskType)} />
          <InfoRow icon={<Layers size={16} color={t.primary} />} label="Lĩnh vực" value={r.industryName ?? '—'} />
          <InfoRow icon={<Laptop size={16} color={t.primary} />} label="Hình thức" value={WORKING_MODE_LABEL[r.workingMode] ?? '—'} last={r.budgetMin == null && r.budgetMax == null && !r.expectedDeadline} />
          {r.budgetMin != null || r.budgetMax != null ? <InfoRow icon={<Wallet size={16} color={t.primary} />} label="Ngân sách" value={`${formatVnd(r.budgetMin)} – ${formatVnd(r.budgetMax)}`} last={!r.expectedDeadline} /> : null}
          {r.expectedDeadline ? <InfoRow icon={<CalendarClock size={16} color={t.primary} />} label="Hạn mong muốn" value={new Date(r.expectedDeadline).toLocaleString('vi-VN')} last /> : null}
        </Card>

        {r.confirmedDealId || r.taskId ? (
          <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 16 }}>
            {r.confirmedDealId ? <Button title="Xem deal đã chốt" size="sm" icon={<Handshake size={15} color="#fff" />} style={{ flex: 1, height: 42 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(r.confirmedDealId) } })} /> : null}
            {r.taskId ? <Button title="Mở task" size="sm" variant="secondary" icon={<ListChecks size={15} color={t.primary} />} style={{ flex: 1, height: 42 }} onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(r.taskId) } })} /> : null}
          </View>
        ) : null}

        <Txt weight="800" size={16} style={{ paddingHorizontal: 16, marginVertical: 8 }}>{`Phản hồi từ mentor (${responses.length})`}</Txt>
        {responses.length === 0 ? (
          <Empty error={q.error} onRetry={() => { void q.refetch() }} icon={<Hourglass size={26} color={t.primary} />} title="Đang chờ mentor phản hồi" text="Bạn sẽ nhận thông báo khi có mentor chấp nhận yêu cầu." />
        ) : null}
        {responses.map((m) => (
          <Card key={m.mentorProfileId} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar uri={m.mentorAvatar} name={m.mentorName} size={46} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{m.mentorName}</Txt>
                <Txt muted size={12} numberOfLines={1}>{m.mentorHeadline ?? ''}</Txt>
              </View>
              <Tag label={RESPONSE_STATUS_LABEL[m.responseStatus] ?? m.responseStatus} tone={statusTone(m.responseStatus)} />
            </View>
            {m.responseNote ? (
              <View style={{ marginTop: 10, padding: 10, borderRadius: 12, backgroundColor: t.surface }}>
                <Txt size={13} style={{ fontStyle: 'italic' }}>{`“${m.responseNote}”`}</Txt>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button title="Hồ sơ" size="sm" variant="outline" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorProfileId) } })} />
              {m.canMessage && m.conversationId ? <Button title="Nhắn tin & chốt deal" size="sm" icon={<MessageCircle size={14} color="#fff" />} style={{ flex: 1.6 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(m.conversationId) } })} /> : null}
            </View>
          </Card>
        ))}
        {r.canCancel ? <Button title="Huỷ yêu cầu" variant="ghost" icon={<XCircle size={16} color={t.danger} />} style={{ marginHorizontal: 16, marginTop: 4 }} onPress={() => cancel.mutate()} loading={cancel.isPending} /> : null}
      </ScrollView>
    </Screen>
  )
}
