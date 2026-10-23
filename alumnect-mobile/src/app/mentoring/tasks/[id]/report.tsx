import React from 'react'
import { ScrollView, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Card, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 }}>
    <Txt muted size={13} style={{ flex: 1 }}>{label}</Txt>
    <Txt weight={bold ? '800' : '600'} size={13}>{value}</Txt>
  </View>
)

/** UC104: báo cáo task và dòng tiền. */
export default function TaskReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentoring-task-report', id], queryFn: () => taskApi.report(Number(id)) })
  const r = q.data
  if (q.isLoading) return <Screen><Header title="Báo cáo task" /><Loading /></Screen>
  if (!r) return <Screen><Header title="Báo cáo task" /><Empty text="Không có dữ liệu báo cáo." /></Screen>
  return (
    <Screen>
      <Header title="Báo cáo task" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Txt size={18} weight="800">{r.taskTitle}</Txt>
        <Txt muted>{TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus}</Txt>
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700" style={{ marginBottom: 4 }}>Tiến độ</Txt>
          <Row label="Hoàn thành" value={`${Math.round(r.progressPercentage)}%`} />
          <Row label="Nhật ký đã xác nhận" value={`${r.confirmedWorkLogs}/${r.totalWorkLogs}`} />
          <Row label="Số lần gia hạn" value={`${r.extensionCount} (${r.totalExtensionDays} ngày)`} />
          <Row label="Số lần điều chỉnh" value={`${r.amendmentCount} (+${formatVnd(r.totalAdditionalAmount)})`} />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Txt weight="700" style={{ marginBottom: 4 }}>Dòng tiền</Txt>
          <Row label="Giá gốc" value={formatVnd(r.originalPrice)} />
          <Row label="Tổng giá thỏa thuận" value={formatVnd(r.totalAgreedPrice)} />
          <Row label="Sinh viên đã thanh toán" value={formatVnd(r.studentTotalPaid)} />
          <Row label="Hoàn cho sinh viên" value={`${formatVnd(r.studentRefundAmount)} · ${r.studentRefundStatus}`} />
          <Row label="Mentor được hưởng" value={formatVnd(r.mentorEarnedAmount)} />
          <Row label="Phí nền tảng" value={formatVnd(r.platformFee)} />
          <Row label="Mentor thực nhận" value={`${formatVnd(r.mentorNetPayout)} · ${r.mentorPayoutStatus}`} bold />
        </Card>
      </ScrollView>
    </Screen>
  )
}
