import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BottomBar, InfoRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import {
  CalendarClock,
  Check,
  ChevronRight,
  ClipboardList,
  Laptop,
  Layers,
  MessageCircle,
  Wallet,
} from '@/components/icons'
import { Header } from '@/components/Header'
import { RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'

/** UC93: mentor xem chi tiết, chấp nhận / từ chối yêu cầu (Meetup x Kakao 2026). */
export default function IncomingDetailScreen() {
  const { colors, viridian } = useMentoringTheme()
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
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu.')
      done()
    },
    onError: (e) => toast.error(errMsg(e)),
  })
  const r = q.data
  if (q.isLoading)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Chi tiết yêu cầu đến" />
        <Loading />
      </Screen>
    )
  if (!r)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Chi tiết yêu cầu đến" />
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy yêu cầu." />
      </Screen>
    )

  return (
    <Screen keyboard bg={colors.bg}>
      <Header title="Chi tiết yêu cầu đến" subtitle={`Sinh viên: ${r.studentName}`} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
        {/* Student & Request Summary Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(r.studentId) } })}
            style={[styles.studentRow, { backgroundColor: colors.surface }]}
          >
            <Avatar uri={r.studentAvatar} name={r.studentName} size={46} ring />
            <View style={{ flex: 1 }}>
              <Txt weight="800" size={15} style={{ color: colors.text }}>
                {r.studentName}
              </Txt>
              <Txt size={12} style={{ color: viridian, fontWeight: '600' }}>
                Sinh viên · Chạm để xem hồ sơ
              </Txt>
            </View>
            <Tag label={RESPONSE_STATUS_LABEL[r.responseStatus] ?? r.responseStatus} tone={statusTone(r.responseStatus)} />
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>

          <Txt size={20} weight="800" style={{ color: colors.text, marginTop: 14, lineHeight: 27 }}>
            {r.title}
          </Txt>
          <Txt size={14} style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
            {r.description}
          </Txt>
        </View>

        {/* Metadata Card */}
        <Card style={{ marginHorizontal: 16, marginBottom: 14, paddingVertical: 6 }}>
          <InfoRow icon={<ClipboardList size={17} color={viridian} />} label="Loại hỗ trợ" value={taskTypeLabel(r.taskType)} />
          <InfoRow icon={<Layers size={17} color={viridian} />} label="Lĩnh vực chuyên môn" value={r.industryName ?? '—'} />
          <InfoRow
            icon={<Laptop size={17} color={viridian} />}
            label="Hình thức làm việc"
            value={WORKING_MODE_LABEL[r.workingMode] ?? '—'}
            last={r.budgetMin == null && r.budgetMax == null && !r.expectedDeadline}
          />
          {r.budgetMin != null || r.budgetMax != null ? (
            <InfoRow
              icon={<Wallet size={17} color={viridian} />}
              label="Dự toán ngân sách"
              value={`${formatVnd(r.budgetMin)} – ${formatVnd(r.budgetMax)}`}
              last={!r.expectedDeadline}
            />
          ) : null}
          {r.expectedDeadline ? (
            <InfoRow
              icon={<CalendarClock size={17} color={viridian} />}
              label="Hạn mong muốn"
              value={new Date(r.expectedDeadline).toLocaleString('vi-VN')}
              last
            />
          ) : null}
        </Card>

        {r.canRespond ? (
          <Card style={{ marginHorizontal: 16 }}>
            <Input
              label="Lời nhắn phản hồi cho sinh viên (tuỳ chọn)"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="VD: Chào bạn, mình có kinh nghiệm thực chiến phần này, hẹn trao đổi chi tiết trong chat nhé!"
            />
          </Card>
        ) : null}
      </ScrollView>

      {r.canRespond ? (
        <BottomBar>
          <Button
            title="Từ chối"
            variant="outline"
            onPress={() => decline.mutate()}
            loading={decline.isPending}
            style={{ flex: 1 }}
          />
          <Button
            title="Chấp nhận cố vấn"
            textColor="#FFFFFF"
            icon={<Check size={17} color="#FFFFFF" weight="bold" />}
            onPress={() => accept.mutate()}
            loading={accept.isPending}
            style={{ flex: 1.6, backgroundColor: viridian, borderColor: viridian }}
          />
        </BottomBar>
      ) : r.canMessage && r.conversationId ? (
        <BottomBar>
          <Button
            title="Mở phòng chat với sinh viên"
            textColor="#FFFFFF"
            icon={<MessageCircle size={17} color="#FFFFFF" weight="fill" />}
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(r.conversationId) } })}
            style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
          />
        </BottomBar>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 14,
  },
})
