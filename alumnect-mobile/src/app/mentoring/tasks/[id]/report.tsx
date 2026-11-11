import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'

function LedgerRow({
  label,
  value,
  highlight,
  last,
}: {
  label: string
  value: string
  highlight?: boolean
  last?: boolean
}) {
  const { colors, viridian } = useMentoringTheme()
  return (
    <View
      style={[
        styles.ledgerRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
      ]}
    >
      <Txt size={13} style={{ flex: 1, color: colors.textSecondary }}>
        {label}
      </Txt>
      <Txt
        weight={highlight ? '800' : '600'}
        size={highlight ? 15 : 13}
        style={{ color: highlight ? viridian : colors.text, fontVariant: ['tabular-nums'] }}
      >
        {value}
      </Txt>
    </View>
  )
}

/** UC104: báo cáo task và dòng tiền (KakaoPay / Meetup Ledger Style). */
export default function TaskReportScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const q = useQuery({ queryKey: ['mentoring-task-report', id], queryFn: () => taskApi.report(Number(id)) })
  const r = q.data
  if (q.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Báo cáo & Dòng tiền" />
        <Loading />
      </Screen>
    )
  if (!r)
    return (
      <Screen bg={colors.bg}>
        <Header title="Báo cáo & Dòng tiền" />
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không có dữ liệu báo cáo." />
      </Screen>
    )

  const pct = Math.min(100, Math.round(r.progressPercentage ?? 0))

  return (
    <Screen bg={colors.bg}>
      <Header title="Báo cáo & Dòng tiền" subtitle={`Task #${id}`} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Hero Card */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#24180E' : viridianSoft,
              borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Tag label={TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus} tone={statusTone(r.taskStatus)} />
            <BrandIcon name="coin" size={40} />
          </View>
          <Txt size={19} weight="800" style={{ color: colors.text, marginTop: 8 }}>
            {r.taskTitle}
          </Txt>
          <Txt size={12} weight="600" style={{ color: viridian, marginTop: 4 }}>
            Tổng giá trị thỏa thuận: {formatVnd(r.totalAgreedPrice)}
          </Txt>
        </View>

        {/* Progress Ledger Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Txt weight="800" size={15} style={{ color: colors.text, marginBottom: 8 }}>
            Tổng hợp Tiến độ
          </Txt>
          <LedgerRow label="Tỷ lệ hoàn thành" value={`${pct}%`} highlight />
          <LedgerRow label="Nhật ký công việc đã xác nhận" value={`${r.confirmedWorkLogs}/${r.totalWorkLogs} buổi`} />
          <LedgerRow label="Số lần gia hạn thời gian" value={`${r.extensionCount} lần (${r.totalExtensionDays} ngày)`} />
          <LedgerRow label="Số lần điều chỉnh phạm vi" value={`${r.amendmentCount} lần (+${formatVnd(r.totalAdditionalAmount)})`} last />
        </View>

        {/* Cashflow Ledger Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Txt weight="800" size={15} style={{ color: colors.text, marginBottom: 8 }}>
            Chi tiết Dòng tiền & Giải ngân
          </Txt>
          <LedgerRow label="Giá thỏa thuận ban đầu" value={formatVnd(r.originalPrice)} />
          <LedgerRow label="Tổng giá trị sau điều chỉnh" value={formatVnd(r.totalAgreedPrice)} />
          <LedgerRow label="Sinh viên đã thanh toán (Escrow)" value={formatVnd(r.studentTotalPaid)} />
          <LedgerRow label="Hoàn trả cho sinh viên" value={`${formatVnd(r.studentRefundAmount)} · ${r.studentRefundStatus}`} />
          <LedgerRow label="Thù lao Mentor được hưởng" value={formatVnd(r.mentorEarnedAmount)} />
          <LedgerRow label="Phí vận hành nền tảng" value={formatVnd(r.platformFee)} />
          <LedgerRow
            label="Mentor thực nhận (Net Payout)"
            value={`${formatVnd(r.mentorNetPayout)} · ${r.mentorPayoutStatus}`}
            highlight
            last
          />
        </View>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    gap: 12,
  },
})
