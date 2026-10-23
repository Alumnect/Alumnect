import React, { useState } from 'react'
import { ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { toast, errMsg } from '@/lib/toast'

/** UC93: mentor xem chi tiết, chấp nhận / từ chối yêu cầu. */
export default function IncomingDetailScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [note, setNote] = useState('')
  const q = useQuery({ queryKey: ['mentoring-incoming-detail', id], queryFn: () => requestApi.incomingDetail(Number(id)) })
  const done = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-incoming-detail', id] })
    qc.invalidateQueries({ queryKey: ['mentoring-incoming'] })
  }
  const accept = useMutation({
    mutationFn: () => requestApi.accept(Number(id), note.trim() || undefined),
    onSuccess: (r) => {
      toast.success('Đã chấp nhận yêu cầu. Hãy nhắn tin để thỏa thuận deal.')
      done()
      if (r.conversationId) router.replace({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const decline = useMutation({
    mutationFn: () => requestApi.decline(Number(id), note.trim() || undefined),
    onSuccess: () => { toast.success('Đã từ chối yêu cầu.'); done() },
    onError: (e) => toast.error(errMsg(e)),
  })
  const r = q.data
  if (q.isLoading) return <Screen><Header title="Yêu cầu" /><Loading /></Screen>
  if (!r) return <Screen><Header title="Yêu cầu" /><Empty text="Không tìm thấy yêu cầu." /></Screen>
  return (
    <Screen>
      <Header title="Chi tiết yêu cầu" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }} onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(r.studentId) } })}>
          <Avatar uri={r.studentAvatar} name={r.studentName} size={48} />
          <Txt weight="700">{r.studentName}</Txt>
        </Card>
        <Txt size={20} weight="800">{r.title}</Txt>
        <Txt style={{ marginTop: 8, lineHeight: 21 }}>{r.description}</Txt>
        <Card style={{ marginTop: 12, gap: 4 }}>
          <Txt muted size={13}>Loại hỗ trợ: {taskTypeLabel(r.taskType)}</Txt>
          <Txt muted size={13}>Lĩnh vực: {r.industryName}</Txt>
          <Txt muted size={13}>Hình thức: {WORKING_MODE_LABEL[r.workingMode]}</Txt>
          {r.budgetMin != null || r.budgetMax != null ? <Txt muted size={13}>Ngân sách: {formatVnd(r.budgetMin)} – {formatVnd(r.budgetMax)}</Txt> : null}
          {r.expectedDeadline ? <Txt muted size={13}>Hạn mong muốn: {new Date(r.expectedDeadline).toLocaleString('vi-VN')}</Txt> : null}
          <Txt weight="700" size={13}>Phản hồi của bạn: {RESPONSE_STATUS_LABEL[r.responseStatus] ?? r.responseStatus}</Txt>
        </Card>
        {r.canRespond ? (
          <>
            <Input label="Ghi chú phản hồi (tùy chọn)" value={note} onChangeText={setNote} multiline style={{ marginTop: 14 }} />
            <Button title="Chấp nhận" onPress={() => accept.mutate()} loading={accept.isPending} />
            <Button title="Từ chối" variant="outline" style={{ marginTop: 8 }} onPress={() => decline.mutate()} loading={decline.isPending} />
          </>
        ) : null}
        {r.canMessage && r.conversationId ? <Button title="Mở chat" variant="outline" style={{ marginTop: 12 }} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })} /> : null}
      </ScrollView>
    </Screen>
  )
}
