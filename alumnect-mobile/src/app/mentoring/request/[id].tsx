import React from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Loading, Screen, Txt } from '@/components/ui'
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
  if (!r) return <Screen><Header title="Yêu cầu" /><Empty text="Không tìm thấy yêu cầu." /></Screen>
  return (
    <Screen>
      <Header title="Chi tiết yêu cầu" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Txt size={20} weight="800">{r.title}</Txt>
        <Txt weight="700" color={t.primary} style={{ marginTop: 4 }}>{REQUEST_STATUS_LABEL[r.status] ?? r.status}</Txt>
        <Txt style={{ marginTop: 10, lineHeight: 21 }}>{r.description}</Txt>
        <Card style={{ marginTop: 12, gap: 4 }}>
          <Txt muted size={13}>Loại hỗ trợ: {taskTypeLabel(r.taskType)}</Txt>
          <Txt muted size={13}>Lĩnh vực: {r.industryName}</Txt>
          <Txt muted size={13}>Hình thức: {WORKING_MODE_LABEL[r.workingMode]}</Txt>
          {r.budgetMin != null || r.budgetMax != null ? <Txt muted size={13}>Ngân sách: {formatVnd(r.budgetMin)} – {formatVnd(r.budgetMax)}</Txt> : null}
          {r.expectedDeadline ? <Txt muted size={13}>Hạn mong muốn: {new Date(r.expectedDeadline).toLocaleString('vi-VN')}</Txt> : null}
        </Card>

        {r.confirmedDealId ? <Button title="Xem deal đã chốt" style={{ marginTop: 12 }} onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(r.confirmedDealId) } })} /> : null}
        {r.taskId ? <Button title="Mở task" variant="outline" style={{ marginTop: 8 }} onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(r.taskId) } })} /> : null}

        <Txt weight="700" size={16} style={{ marginTop: 20, marginBottom: 8 }}>Phản hồi từ mentor ({r.mentorResponses?.length ?? 0})</Txt>
        {(r.mentorResponses ?? []).map((m) => (
          <Card key={m.mentorProfileId} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar uri={m.mentorAvatar} name={m.mentorName} size={44} />
              <View style={{ flex: 1 }}>
                <Txt weight="700">{m.mentorName}</Txt>
                <Txt muted size={12} numberOfLines={1}>{m.mentorHeadline ?? ''}</Txt>
              </View>
              <Txt size={12} weight="700" color={m.responseStatus === 'ACCEPTED' ? t.success : t.textMuted}>{RESPONSE_STATUS_LABEL[m.responseStatus] ?? m.responseStatus}</Txt>
            </View>
            {m.responseNote ? <Txt muted size={13} style={{ marginTop: 6 }}>“{m.responseNote}”</Txt> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <Button title="Hồ sơ" variant="outline" style={{ flex: 1, height: 38 }} onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorProfileId) } })} />
              {m.canMessage && m.conversationId ? <Button title="Nhắn tin & chốt deal" style={{ flex: 1.4, height: 38 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(m.conversationId) } })} /> : null}
            </View>
          </Card>
        ))}
        {r.canCancel ? <Button title="Hủy yêu cầu" variant="danger" style={{ marginTop: 12 }} onPress={() => cancel.mutate()} loading={cancel.isPending} /> : null}
      </ScrollView>
    </Screen>
  )
}
