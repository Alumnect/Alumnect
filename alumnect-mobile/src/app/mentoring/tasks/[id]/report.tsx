import React from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import type { Tone } from '@/components/ui'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { Enter } from '@/components/Motion'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'

/** Trạng thái hoàn tiền / giải ngân từ BE (MentoringTaskServiceImpl) → tiếng Việt + tông màu. */
const MONEY_STATUS: Record<string, [string, Tone]> = {
  NO_REFUND: ['Không hoàn tiền', 'neutral'],
  PENDING_REFUND: ['Chờ hoàn tiền', 'warning'],
  REFUNDED: ['Đã hoàn tiền', 'success'],
  PENDING_ESCROW: ['Đang tạm giữ', 'warning'],
  PROCESSING: ['Đang xử lý', 'info'],
  PAID: ['Đã chi trả', 'success'],
  FAILED: ['Thất bại', 'danger'],
  ON_HOLD: ['Tạm hoãn (tranh chấp)', 'danger'],
  CANCELLED: ['Đã hủy', 'neutral'],
}
const moneyStatus = (s?: string | null): [string, Tone] => (s ? MONEY_STATUS[s] ?? [s, 'neutral'] : ['—', 'neutral'])

function Row({ label, hint, value, strong, color, tag, last }: { label: string; hint?: string; value: string; strong?: boolean; color?: string; tag?: [string, Tone]; last?: boolean }) {
  const { colors } = useMentoringTheme()
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }]}>
      <View style={{ flex: 1 }}>
        <Txt size={13.5} weight={strong ? '700' : '400'} style={{ color: strong ? colors.text : colors.textSecondary }}>{label}</Txt>
        {hint ? <Txt size={11.5} style={{ color: colors.textTertiary, marginTop: 2 }}>{hint}</Txt> : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Txt size={strong ? 16 : 14} weight={strong ? '800' : '700'} style={{ color: color ?? colors.text, fontVariant: ['tabular-nums'] }}>{value}</Txt>
        {tag ? <Tag label={tag[0]} tone={tag[1]} /> : null}
      </View>
    </View>
  )
}

function Card({ title, brand, children }: { title: string; brand: BrandIconName; children: React.ReactNode }) {
  const { colors } = useMentoringTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <BrandIcon name={brand} size={28} />
        <Txt weight="800" size={15} style={{ color: colors.text }}>{title}</Txt>
      </View>
      {children}
    </View>
  )
}

function Metric({ value, label, color }: { value: string; label: string; color?: string }) {
  const { colors, isDark } = useMentoringTheme()
  return (
    <View style={[styles.metric, { backgroundColor: isDark ? colors.surface : '#F7F8FA' }]}>
      <Txt size={17} weight="800" style={{ color: color ?? colors.text, fontVariant: ['tabular-nums'] }}>{value}</Txt>
      <Txt size={11.5} style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 2 }}>{label}</Txt>
    </View>
  )
}

/** UC104: báo cáo nhiệm vụ & dòng tiền (Meetup Ledger Style, toàn bộ tiếng Việt). */
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
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Chưa có dữ liệu báo cáo." />
      </Screen>
    )

  const pct = Math.min(100, Math.round(r.progressPercentage ?? 0))
  const title = r.taskTitle.split('\n').map((s) => s.trim()).find(Boolean) ?? r.taskTitle
  const done = pct >= 100
  const delta = r.totalAgreedPrice - r.originalPrice

  return (
    <Screen bg={colors.bg}>
      <Header title="Báo cáo & Dòng tiền" subtitle={`Nhiệm vụ #${id}`} />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => { void q.refetch() }} tintColor={viridian} colors={[viridian]} />}
      >
        {/* Tổng quan */}
        <Enter>
          <View style={[styles.hero, { backgroundColor: isDark ? '#24180E' : viridianSoft, borderColor: isDark ? '#4A2C16' : '#FAD9C2' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Tag label={TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus} tone={statusTone(r.taskStatus)} />
              <BrandIcon name="coin" size={36} />
            </View>
            <Txt size={18} weight="800" style={{ color: colors.text, marginTop: 8 }} numberOfLines={2}>{title}</Txt>
            <Txt size={12} style={{ color: colors.textSecondary, marginTop: 10 }}>Tổng giá trị thỏa thuận</Txt>
            <Txt size={26} weight="800" style={{ color: viridian, fontVariant: ['tabular-nums'] }}>{formatVnd(r.totalAgreedPrice)}</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <View style={[styles.track, { backgroundColor: isDark ? '#3A2414' : '#FFFFFF' }]}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 4, backgroundColor: done ? '#16A34A' : viridian }} />
              </View>
              <Txt size={13} weight="800" style={{ color: done ? '#16A34A' : viridian }}>{`${pct}%`}</Txt>
            </View>
          </View>
        </Enter>

        {/* Tiến độ */}
        <Enter delay={60}>
          <Card title="Tổng hợp tiến độ" brand="task">
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <Metric value={`${r.confirmedWorkLogs}/${r.totalWorkLogs}`} label="Nhật ký đã xác nhận" />
              <Metric value={String(r.extensionCount)} label={r.totalExtensionDays ? `Lần gia hạn (+${r.totalExtensionDays} ngày)` : 'Lần gia hạn'} />
              <Metric value={String(r.amendmentCount)} label="Lần điều chỉnh" />
            </View>
          </Card>
        </Enter>

        {/* Giá trị thỏa thuận */}
        <Enter delay={120}>
          <Card title="Giá trị thỏa thuận" brand="writing">
            <Row label="Giá ban đầu" value={formatVnd(r.originalPrice)} />
            <Row label="Chi phí điều chỉnh thêm" hint={r.amendmentCount ? `Qua ${r.amendmentCount} lần điều chỉnh` : undefined} value={delta > 0 ? `+${formatVnd(delta)}` : formatVnd(0)} />
            <Row label="Tổng sau điều chỉnh" value={formatVnd(r.totalAgreedPrice)} strong last />
          </Card>
        </Enter>

        {/* Học viên */}
        <Enter delay={180}>
          <Card title="Phía Học viên" brand="people">
            <Row label="Đã thanh toán" hint="Nền tảng tạm giữ cho đến khi nghiệm thu" value={formatVnd(r.studentTotalPaid)} />
            <Row label="Được hoàn lại" value={formatVnd(r.studentRefundAmount)} tag={moneyStatus(r.studentRefundStatus)} last />
          </Card>
        </Enter>

        {/* Mentor */}
        <Enter delay={240}>
          <Card title="Phía Mentor" brand="suitcase">
            <Row label="Thù lao được hưởng" value={formatVnd(r.mentorEarnedAmount)} />
            <Row label="Phí vận hành nền tảng" value={r.platformFee ? `−${formatVnd(r.platformFee)}` : formatVnd(0)} />
            <Row label="Mentor thực nhận" hint="Sau khi trừ phí nền tảng" value={formatVnd(r.mentorNetPayout)} strong color={viridian} tag={moneyStatus(r.mentorPayoutStatus)} last />
          </Card>
        </Enter>

        <Txt size={11.5} style={{ color: colors.textTertiary, textAlign: 'center', marginTop: 4, lineHeight: 17 }}>
          Tiền của học viên được nền tảng tạm giữ và chỉ chi trả cho mentor khi nhiệm vụ được nghiệm thu hoặc hòa giải.
        </Txt>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  track: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  metric: { flex: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, gap: 12 },
})
