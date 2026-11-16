import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Chip, ChipRow, Empty, Loading, Screen, Tag, Txt } from '@/components/ui'
import type { Tone } from '@/components/ui'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { Enter } from '@/components/Motion'
import { SheetModal } from '@/components/SheetModal'
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import { walletApi } from '@/api/mentoringWallet'
import { formatVnd } from '@/api/mentoring'
import { statusTone } from '@/constants/status'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { errMsg, toast } from '@/lib/toast'

/** Trạng thái hoàn tiền / giải ngân từ BE (MentoringTaskServiceImpl) → tiếng Việt + tông màu. */
const MONEY_STATUS: Record<string, [string, Tone]> = {
  NO_REFUND: ['Không hoàn tiền', 'neutral'],
  NO_PAYOUT: ['Không chi trả', 'neutral'],
  PENDING_REFUND: ['Chờ hoàn tiền', 'warning'],
  PROCESSING: ['Đang xử lý', 'info'],
  REFUNDED: ['Đã hoàn tiền', 'success'],
  PENDING_ESCROW: ['Đang tạm giữ', 'warning'],
  PAID: ['Đã chi trả', 'success'],
  FAILED: ['Thất bại', 'danger'],
  ON_HOLD: ['Tạm hoãn (tranh chấp)', 'danger'],
  CANCELLED: ['Đã hủy', 'neutral'],
}
const moneyStatus = (s?: string | null): [string, Tone] => (s ? MONEY_STATUS[s] ?? [s, 'neutral'] : ['—', 'neutral'])

function Row({
  label,
  hint,
  value,
  strong,
  color,
  tag,
  last,
}: {
  label: string
  hint?: string
  value?: string
  strong?: boolean
  color?: string
  tag?: [string, Tone]
  last?: boolean
}) {
  const { colors } = useMentoringTheme()
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle }]}>
      <View style={{ flex: 1 }}>
        <Txt size={13.5} weight={strong ? '700' : '400'} style={{ color: strong ? colors.text : colors.textSecondary }}>{label}</Txt>
        {hint ? <Txt size={11.5} style={{ color: colors.textTertiary, marginTop: 2 }}>{hint}</Txt> : null}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center', gap: 4 }}>
        {value ? (
          <Txt size={strong ? 16 : 14} weight={strong ? '800' : '700'} style={{ color: color ?? colors.text, fontVariant: ['tabular-nums'] }}>
            {value}
          </Txt>
        ) : null}
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

const QUICK_REASONS = [
  'Chưa nhận được tiền hoàn trả về tài khoản',
  'Số tiền hoàn / chi trả bị sai lệch',
  'Chưa nhận được thù lao Mentor sau khi Task hoàn thành',
  'Tài khoản nhận tiền báo lỗi giao dịch',
]

/** UC104: báo cáo nhiệm vụ & dòng tiền (Meetup Ledger Style, toàn bộ tiếng Việt). */
export default function TaskReportScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const q = useQuery({ queryKey: ['mentoring-task-report', id], queryFn: () => taskApi.report(Number(id)) })
  const qSnap = useQuery({ queryKey: ['mentoring-task-snapshot', id], queryFn: () => taskApi.settlementSnapshot(Number(id)), enabled: !!id })
  const qTickets = useQuery({ queryKey: ['mentoring-task-tickets', id], queryFn: () => taskApi.tickets(Number(id)), enabled: !!id })
  const qEarnings = useQuery({ queryKey: ['mentoring-wallet-earnings'], queryFn: () => walletApi.earnings() })
  const qRefunds = useQuery({ queryKey: ['mentoring-wallet-refunds'], queryFn: () => walletApi.refunds() })

  const r = q.data
  const snap = qSnap.data
  const ticketsList = qTickets.data
  const earnings = qEarnings.data
  const refunds = qRefunds.data

  const [pingOpen, setPingOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [selectedQuick, setSelectedQuick] = useState<string | null>(null)

  const pingMutation = useMutation({
    mutationFn: ({ reason: text, issueType }: { reason: string; issueType?: string }) =>
      taskApi.pingAdminFinance(Number(id), { reason: text, issueType }),
    onSuccess: () => {
      toast.success('Đã gửi phản ánh sự cố dòng tiền đến Ban Quản Trị!')
      setPingOpen(false)
      setReason('')
      setSelectedQuick(null)
      void q.refetch()
      void queryClient.invalidateQueries({ queryKey: ['mentoring-task-detail', id] })
    },
    onError: (e) => {
      toast.error(errMsg(e, 'Không thể gửi phản ánh, vui lòng thử lại sau.'))
    },
  })

  const submitPing = () => {
    const text = reason.trim() || selectedQuick || ''
    if (text.length < 5) {
      toast.info('Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }
    let issueType = 'OTHER'
    if (selectedQuick?.includes('hoàn trả')) issueType = 'REFUND_NOT_RECEIVED'
    else if (selectedQuick?.includes('thù lao')) issueType = 'PAYOUT_NOT_RECEIVED'
    else if (selectedQuick?.includes('sai lệch')) issueType = 'WRONG_AMOUNT'
    else if (selectedQuick?.includes('lỗi giao dịch')) issueType = 'ACCOUNT_ERROR'

    pingMutation.mutate({ reason: text, issueType })
  }

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

  const hasDispute = r.isDisputed || r.taskStatus === 'DISPUTED'
  const isResolved = r.taskStatus === 'RESOLVED' || r.latestTicket?.status === 'RESOLVED'

  // Tìm ticket đã giải quyết / phân xử (nếu có)
  const resolvedTicket = ticketsList?.find((t) => t.status === 'RESOLVED') ?? ticketsList?.[0]
  const isSettledOrAgreed =
    (snap?.isAgreed && snap.proposalId) ||
    resolvedTicket?.decision === 'PARTIAL_SPLIT' ||
    r.resolutionDecision === 'PARTIAL_SPLIT'

  // Số tiền phân chia: ưu tiên từ r (nếu backend trả > 0), fallback sang snapshot và ticket
  const mentorSplit = (r.mentorEarnedAmount && r.mentorEarnedAmount > 0)
    ? r.mentorEarnedAmount
    : (resolvedTicket?.mentorAmount ?? snap?.mentorAmount ?? 0)

  const studentSplit = (r.studentRefundAmount && r.studentRefundAmount > 0)
    ? r.studentRefundAmount
    : (resolvedTicket?.studentRefund ?? snap?.studentRefund ?? 0)

  // Tiêu đề & nội dung quyết định giải quyết
  const resolutionTitle =
    r.resolutionDecision === 'FULL_MENTOR_PAYMENT'
      ? 'Chi trả toàn bộ thù lao cho Mentor'
      : r.resolutionDecision === 'FULL_STUDENT_REFUND'
        ? 'Hoàn trả toàn bộ học phí cho Học viên'
        : (isSettledOrAgreed || (mentorSplit > 0 && studentSplit > 0))
          ? 'Hòa giải phân chia quỹ'
          : (r.resolutionDecision ?? 'Hòa giải phân chia quỹ')

  const ticketCode = r.latestTicket?.ticketCode || resolvedTicket?.ticketCode
  const resolutionReason = r.resolutionNote || resolvedTicket?.resolutionNote || snap?.reason

  // Trạng thái tài chính 2 phía
  const earningItem = earnings?.items?.find((it) => it.taskId === Number(id))
  const refundItem = refunds?.items?.find((it) => it.taskId === Number(id))

  // 1. Phía Mentor
  let effectiveMentorStatus = r.mentorPayoutStatus
  let mentorStatusHint: string | undefined = r.mentorPayoutNote || undefined

  if (effectiveMentorStatus === 'FAILED' || (r.hasFailedLedger && mentorSplit > 0)) {
    effectiveMentorStatus = 'FAILED'
    mentorStatusHint = r.mentorPayoutNote || earningItem?.note || 'Lệnh chi PayOS thất bại'
  } else if (earningItem?.status === 'FAILED') {
    effectiveMentorStatus = 'FAILED'
    mentorStatusHint = earningItem.note || r.mentorPayoutNote || 'Lệnh chi PayOS bị từ chối/thất bại'
  } else if (earningItem?.status === 'SUCCEEDED') {
    effectiveMentorStatus = 'PAID'
  } else if (earningItem?.status === 'PENDING') {
    effectiveMentorStatus = 'PROCESSING'
  } else if (effectiveMentorStatus === 'PAID') {
    effectiveMentorStatus = 'PAID'
  } else if (mentorSplit > 0) {
    effectiveMentorStatus = 'PENDING_ESCROW'
  } else {
    effectiveMentorStatus = 'NO_PAYOUT'
  }

  // 2. Phía Học viên
  let effectiveStudentStatus = r.studentRefundStatus
  let studentStatusHint: string | undefined = r.studentRefundNote || undefined

  if (effectiveStudentStatus === 'FAILED' || (r.hasFailedLedger && studentSplit > 0)) {
    effectiveStudentStatus = 'FAILED'
    studentStatusHint = r.studentRefundNote || refundItem?.note || 'Lệnh hoàn PayOS thất bại'
  } else if (refundItem?.status === 'FAILED') {
    effectiveStudentStatus = 'FAILED'
    studentStatusHint = refundItem.note || r.studentRefundNote || 'Lệnh hoàn PayOS bị từ chối/thất bại'
  } else if (refundItem?.status === 'SUCCEEDED') {
    effectiveStudentStatus = 'REFUNDED'
  } else if (refundItem?.status === 'PENDING') {
    effectiveStudentStatus = 'PROCESSING'
  } else if (effectiveStudentStatus === 'REFUNDED') {
    effectiveStudentStatus = 'REFUNDED'
  } else if (studentSplit > 0) {
    effectiveStudentStatus = 'PENDING_REFUND'
  } else {
    effectiveStudentStatus = 'NO_REFUND'
  }

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

        {/* Cảnh báo Tranh chấp (nếu có) */}
        {hasDispute ? (
          <Enter delay={30}>
            <Card title="Trạng thái tranh chấp" brand="alarm_clock">
              <View style={{ backgroundColor: isDark ? '#2E1515' : '#FEF2F2', padding: 14, borderRadius: 14, borderColor: '#FCA5A5', borderWidth: 1, marginTop: 4 }}>
                <View style={{ gap: 6, marginBottom: 8 }}>
                  <Txt weight="800" size={15} style={{ color: '#DC2626' }}>
                    Nhiệm vụ đang tranh chấp
                  </Txt>
                  {ticketCode ? (
                    <View style={{ alignSelf: 'flex-start' }}>
                      <Tag label={ticketCode} tone="danger" />
                    </View>
                  ) : null}
                </View>
                {r.activeTicket?.disputeReason || r.latestTicket?.disputeReason ? (
                  <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
                    Lý do: {r.activeTicket?.disputeReason || r.latestTicket?.disputeReason}
                  </Txt>
                ) : null}
                <Txt size={12} style={{ color: '#DC2626', marginTop: 8, fontWeight: '600', lineHeight: 17 }}>
                  Toàn bộ tiền đang được đóng băng an toàn trong quỹ ký quỹ Escrow chờ Ban Quản Trị phân xử.
                </Txt>
              </View>
            </Card>
          </Enter>
        ) : null}

        {/* Khối Phán quyết & Giải quyết dòng tiền (nếu RESOLVED) */}
        {isResolved ? (
          <Enter delay={40}>
            <Card title="Phán quyết & Kết quả giải quyết" brand="badge_pro">
              <View style={{ backgroundColor: isDark ? '#14261C' : '#F0FDF4', padding: 14, borderRadius: 14, borderColor: viridian, borderWidth: 1, marginTop: 4 }}>
                <View style={{ gap: 6, marginBottom: 8 }}>
                  <Txt weight="800" size={15} style={{ color: viridian }}>
                    {resolutionTitle}
                  </Txt>
                  {ticketCode ? (
                    <View style={{ alignSelf: 'flex-start' }}>
                      <Tag label={ticketCode} tone="success" />
                    </View>
                  ) : null}
                </View>
                {resolutionReason ? (
                  <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
                    Căn cứ giải quyết: {resolutionReason}
                  </Txt>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? '#2D4A38' : '#D1FAE5' }}>
                  <View style={{ flex: 1, backgroundColor: isDark ? '#1C3325' : '#FFFFFF', padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#2D4A38' : '#D1FAE5' }}>
                    <Txt size={11.5} style={{ color: colors.textTertiary }}>Mentor nhận</Txt>
                    <Txt size={16} weight="800" style={{ color: viridian, marginTop: 2 }}>{formatVnd(mentorSplit)}</Txt>
                  </View>
                  <View style={{ flex: 1, backgroundColor: isDark ? '#1C3325' : '#FFFFFF', padding: 10, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? '#2D4A38' : '#D1FAE5' }}>
                    <Txt size={11.5} style={{ color: colors.textTertiary }}>Học viên nhận hoàn</Txt>
                    <Txt size={16} weight="800" style={{ color: '#0284C7', marginTop: 2 }}>{formatVnd(studentSplit)}</Txt>
                  </View>
                </View>
              </View>
            </Card>
          </Enter>
        ) : null}

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

        {/* Phía Học viên */}
        <Enter delay={180}>
          <Card title="Phía Học viên" brand="people">
            <Row label="Đã thanh toán" hint="Nền tảng tạm giữ cho đến khi nghiệm thu" value={formatVnd(r.studentTotalPaid)} />
            <Row
              label="Được hoàn lại"
              value={formatVnd(studentSplit)}
              color={studentSplit > 0 ? '#0284C7' : undefined}
            />
            <Row
              label="Trạng thái hoàn tiền"
              hint={studentStatusHint}
              tag={moneyStatus(effectiveStudentStatus)}
              last
            />
          </Card>
        </Enter>

        {/* Phía Mentor */}
        <Enter delay={240}>
          <Card title="Phía Mentor" brand="suitcase">
            <Row
              label="Thù lao thực nhận"
              value={formatVnd(mentorSplit)}
              strong
              color={viridian}
            />
            <Row
              label="Trạng thái chi trả"
              hint={mentorStatusHint}
              tag={moneyStatus(effectiveMentorStatus)}
              last
            />
          </Card>
        </Enter>

        {/* Nút Ping lại Admin khi có sự cố */}
        {r.canPingAdminFinance !== false ? (
          <Enter delay={300}>
            <View style={{ marginTop: 8, marginBottom: 16 }}>
              <Button
                title="Báo cáo sự cố dòng tiền"
                variant="outline"
                textColor="#DC2626"
                style={{ borderColor: '#FCA5A5', backgroundColor: isDark ? '#2A1215' : '#FEF2F2' }}
                onPress={() => setPingOpen(true)}
              />
            </View>
          </Enter>
        ) : null}
      </ScrollView>

      {/* Modal Ping lại Admin về sự cố dòng tiền */}
      <SheetModal visible={pingOpen} onClose={() => setPingOpen(false)}>
        <View style={{ padding: 20 }}>
          <Txt weight="800" size={17} style={{ color: colors.text }}>
            Phản ánh sự cố dòng tiền
          </Txt>
          <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 4 }}>
            Gửi yêu cầu tới Ban Quản Trị để đối soát và xử lý lại giao dịch hoàn tiền hoặc thù lao cho Nhiệm vụ #{id}.
          </Txt>

          <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 8, textTransform: 'uppercase' }}>
            Chọn nhanh sự cố
          </Txt>
          <View style={{ gap: 6 }}>
            {QUICK_REASONS.map((item) => {
              const active = selectedQuick === item
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    setSelectedQuick(active ? null : item)
                    if (!active) setReason(item)
                  }}
                  style={{
                    paddingVertical: 9,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: active ? viridian : colors.borderSubtle,
                    backgroundColor: active ? (isDark ? '#14261C' : viridianSoft) : colors.card,
                  }}
                >
                  <Txt size={12.5} weight={active ? '700' : '400'} style={{ color: active ? viridian : colors.text }}>
                    {item}
                  </Txt>
                </Pressable>
              )
            })}
          </View>

          <Txt size={12} weight="700" style={{ color: colors.textSecondary, marginTop: 14, marginBottom: 6, textTransform: 'uppercase' }}>
            Chi tiết phản ánh
          </Txt>
          <TextInput
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            placeholder="Mô tả cụ thể sự cố (ví dụ: ngày giờ kiểm tra tài khoản, số tiền chưa khớp...)"
            placeholderTextColor={colors.textTertiary}
            style={{
              minHeight: 80,
              textAlignVertical: 'top',
              padding: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: isDark ? colors.surface : '#F8F9FA',
              color: colors.text,
              fontSize: 13,
            }}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Button
              title="Đóng"
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => setPingOpen(false)}
            />
            <Button
              title={pingMutation.isPending ? 'Đang gửi...' : 'Gửi cho Admin'}
              size="sm"
              textColor="#FFFFFF"
              disabled={pingMutation.isPending}
              style={{ flex: 2, backgroundColor: '#DC2626', borderColor: '#DC2626' }}
              onPress={submitPing}
            />
          </View>
        </View>
      </SheetModal>
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
