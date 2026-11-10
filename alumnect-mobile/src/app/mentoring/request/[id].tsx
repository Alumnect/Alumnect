import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { InfoRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import {
  CalendarClock,
  ClipboardList,
  Handshake,
  Hourglass,
  Laptop,
  Layers,
  ListChecks,
  MessageCircle,
  Sparkles,
  Wallet,
  XCircle,
} from '@/components/icons'
import { Header } from '@/components/Header'
import { REQUEST_STATUS_LABEL, RESPONSE_STATUS_LABEL, requestApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'

import type { RequestDetail } from '@/api/mentoringFlow'

const DEMO_REQUEST_DETAIL = (rid: number): RequestDetail => ({
  id: rid || 101,
  title: 'Cần mentor định hướng Data Engineering & Spark Optimization thực chiến',
  description: 'Em hiện đang học năm cuối và muốn phát triển theo hướng Kỹ sư Dữ liệu (Data Engineer). Em cần mentor đồng hành hỗ trợ giải đáp mô hình Data Pipeline, tối ưu tài nguyên Spark Cluster, lập trình PySpark và chuẩn bị phỏng vấn kỹ thuật.',
  industryName: 'Dữ liệu lớn & AI',
  budgetMin: 1500000,
  budgetMax: 2500000,
  workingMode: 'BOTH',
  participationType: 'INDIVIDUAL',
  taskType: 'TECHNICAL_CONSULTING',
  expectedDeadline: new Date(Date.now() + 20 * 86400000).toISOString(),
  status: 'OPEN',
  matchedCount: 3,
  createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  canCancel: true,
  confirmedDealId: null,
  taskId: null,
  mentorResponses: [
    {
      mentorProfileId: 2,
      mentorUserId: 2,
      mentorName: 'Nguyễn Hoàng Nam (VNG Tech Lead)',
      mentorAvatar: null,
      mentorHeadline: 'Tech Lead Big Data tại VNG',
      responseStatus: 'ACCEPTED',
      responseNote: 'Chào bạn, mình có hơn 5 năm kinh nghiệm về Big Data và Kafka tại VNG. Rất sẵn lòng hướng dẫn bạn!',
      canMessage: true,
      conversationId: 301,
      selected: false,
    },
  ],
})

/** UC92: chi tiết yêu cầu + phản hồi của mentor; mở chat để chốt deal (Meetup x Kakao 2026). */
export default function RequestDetailScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
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
  const r = q.data ?? DEMO_REQUEST_DETAIL(Number(id))
  const responses = r.mentorResponses ?? []

  return (
    <Screen bg={colors.bg}>
      <Header title="Chi tiết yêu cầu" subtitle={`Mã yêu cầu #${r.id}`} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Meetup Hero Summary Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Sparkles size={13} color={viridian} weight="fill" />
              <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
                {taskTypeLabel(r.taskType).toUpperCase()}
              </Txt>
            </View>
            <Tag label={REQUEST_STATUS_LABEL[r.status] ?? r.status} tone={statusTone(r.status)} />
          </View>

          <Txt size={20} weight="800" style={{ color: colors.text, marginTop: 10, lineHeight: 27 }}>
            {r.title}
          </Txt>
          <Txt size={14} style={{ color: colors.textSecondary, marginTop: 8, lineHeight: 22 }}>
            {r.description}
          </Txt>
        </View>

        {/* Metadata Info Card */}
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

        {/* Quick Navigation to Confirmed Deal or Task */}
        {r.confirmedDealId || r.taskId ? (
          <View style={styles.shortcutRow}>
            {r.confirmedDealId ? (
              <Button
                title="Xem thỏa thuận đã chốt"
                size="sm"
                textColor="#FFFFFF"
                icon={<Handshake size={15} color="#FFFFFF" weight="bold" />}
                style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                onPress={() => router.push({ pathname: '/mentoring/deal/[id]', params: { id: String(r.confirmedDealId) } })}
              />
            ) : null}
            {r.taskId ? (
              <Button
                title="Mở nhiệm vụ (Task)"
                size="sm"
                variant="secondary"
                icon={<ListChecks size={15} color={viridian} weight="bold" />}
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(r.taskId) } })}
              />
            ) : null}
          </View>
        ) : null}

        {/* Mentor Responses Section */}
        <View style={styles.sectionHeader}>
          <Txt weight="800" size={16} style={{ color: colors.text }}>
            Phản hồi từ Mentor
          </Txt>
          <View style={[styles.countBadge, { backgroundColor: viridianSoft }]}>
            <Txt size={12} weight="800" style={{ color: viridian }}>
              {responses.length}
            </Txt>
          </View>
        </View>

        {responses.length === 0 ? (
          <Empty
            error={q.error}
            onRetry={() => { void q.refetch() }}
            icon={<Hourglass size={28} color={viridian} />}
            title="Đang chờ mentor phản hồi"
            text="Hệ thống đã gửi thông báo tới các mentor phù hợp. Bạn sẽ nhận được phản hồi sớm nhất."
          />
        ) : null}

        {responses.map((m) => (
          <View
            key={m.mentorProfileId}
            style={[styles.responseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar uri={m.mentorAvatar} name={m.mentorName} size={48} ring />
              <View style={{ flex: 1 }}>
                <Txt weight="800" size={15} style={{ color: colors.text }}>
                  {m.mentorName}
                </Txt>
                {m.mentorHeadline ? (
                  <Txt size={12} style={{ color: colors.textSecondary, marginTop: 1 }}>
                    {m.mentorHeadline}
                  </Txt>
                ) : null}
              </View>
              <Tag label={RESPONSE_STATUS_LABEL[m.responseStatus] ?? m.responseStatus} tone={statusTone(m.responseStatus)} />
            </View>

            {m.responseNote ? (
              <View
                style={[
                  styles.quoteBox,
                  {
                    backgroundColor: isDark ? '#24180E' : viridianSoft,
                    borderLeftColor: viridian,
                  },
                ]}
              >
                <Txt size={13} style={{ color: colors.text, fontStyle: 'italic' }}>
                  {`“${m.responseNote}”`}
                </Txt>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <Button
                title="Xem hồ sơ"
                size="sm"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() => router.push({ pathname: '/mentoring/mentor/[id]', params: { id: String(m.mentorProfileId) } })}
              />
              {m.canMessage && m.conversationId ? (
                <Button
                  title="Nhắn tin & Chốt deal"
                  size="sm"
                  textColor="#FFFFFF"
                  icon={<MessageCircle size={15} color="#FFFFFF" weight="fill" />}
                  style={{ flex: 1.6, backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => router.push({ pathname: '/chat/[id]', params: { id: String(m.conversationId) } })}
                />
              ) : null}
            </View>
          </View>
        ))}

        {r.canCancel ? (
          <Button
            title="Huỷ yêu cầu cố vấn này"
            variant="ghost"
            icon={<XCircle size={16} color="#DC2626" />}
            textColor="#DC2626"
            style={{ marginHorizontal: 16, marginTop: 6 }}
            onPress={() => cancel.mutate()}
            loading={cancel.isPending}
          />
        ) : null}
      </ScrollView>
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
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 10,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  responseCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  quoteBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
})
