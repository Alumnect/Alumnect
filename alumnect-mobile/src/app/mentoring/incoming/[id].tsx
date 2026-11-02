import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BottomBar, InfoRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import { useTheme } from '@/theme'
import { CalendarClock, Check, ClipboardList, Laptop, Layers, MessageCircle, Wallet } from '@/components/icons'
import { Header } from '@/components/Header'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { toast, errMsg } from '@/lib/toast'

/** UC93: mentor xem chi tiết, chấp nhận / từ chối yêu cầu. */
export default function IncomingDetailScreen() {
  const t = useTheme()
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
  if (q.isLoading) return <Screen keyboard><Header title="Yêu cầu" /><Loading /></Screen>
  if (!r) return <Screen keyboard><Header title="Yêu cầu" /><Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy yêu cầu." /></Screen>
  return (
    <Screen keyboard bg={t.card}>
      <Header title="Chi tiết yêu cầu" />
      <ScrollView style={{ backgroundColor: t.bg }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: t.card, padding: 16, marginBottom: 16 }}>
          <Pressable onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(r.studentId) } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Avatar uri={r.studentAvatar} name={r.studentName} size={48} />
            <View style={{ flex: 1 }}>
              <Txt weight="700">{r.studentName}</Txt>
              <Txt muted size={12}>Sinh viên · xem hồ sơ</Txt>
            </View>
            <Tag label={RESPONSE_STATUS_LABEL[r.responseStatus] ?? r.responseStatus} tone={statusTone(r.responseStatus)} />
          </Pressable>
          <Txt size={21} weight="800" style={{ marginTop: 14, lineHeight: 28 }}>{r.title}</Txt>
          <Txt style={{ marginTop: 8, lineHeight: 22 }}>{r.description}</Txt>
        </View>
        <Card style={{ marginHorizontal: 16, marginBottom: 16, paddingVertical: 4 }}>
          <InfoRow icon={<ClipboardList size={16} color={t.primary} />} label="Loại hỗ trợ" value={taskTypeLabel(r.taskType)} />
          <InfoRow icon={<Layers size={16} color={t.primary} />} label="Lĩnh vực" value={r.industryName ?? '—'} />
          <InfoRow icon={<Laptop size={16} color={t.primary} />} label="Hình thức" value={WORKING_MODE_LABEL[r.workingMode] ?? '—'} last={r.budgetMin == null && r.budgetMax == null && !r.expectedDeadline} />
          {r.budgetMin != null || r.budgetMax != null ? <InfoRow icon={<Wallet size={16} color={t.primary} />} label="Ngân sách" value={`${formatVnd(r.budgetMin)} – ${formatVnd(r.budgetMax)}`} last={!r.expectedDeadline} /> : null}
          {r.expectedDeadline ? <InfoRow icon={<CalendarClock size={16} color={t.primary} />} label="Hạn mong muốn" value={new Date(r.expectedDeadline).toLocaleString('vi-VN')} last /> : null}
        </Card>
        {r.canRespond ? (
          <Card style={{ marginHorizontal: 16 }}>
            <Input label="Lời nhắn cho sinh viên (tuỳ chọn)" value={note} onChangeText={setNote} multiline placeholder="VD: Mình có kinh nghiệm phần này, hẹn trao đổi chi tiết nhé!" />
          </Card>
        ) : null}
      </ScrollView>
      {r.canRespond ? (
        <BottomBar>
          <Button title="Từ chối" variant="outline" onPress={() => decline.mutate()} loading={decline.isPending} style={{ flex: 1 }} />
          <Button title="Chấp nhận" icon={<Check size={17} color="#fff" />} onPress={() => accept.mutate()} loading={accept.isPending} style={{ flex: 1.5 }} />
        </BottomBar>
      ) : r.canMessage && r.conversationId ? (
        <BottomBar>
          <Button title="Mở chat với sinh viên" icon={<MessageCircle size={16} color="#fff" />} onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })} style={{ flex: 1 }} />
        </BottomBar>
      ) : null}
    </Screen>
  )
}
