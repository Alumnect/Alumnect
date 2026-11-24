import React, { useState } from 'react'
import { Platform, Pressable, RefreshControl, Share, StyleSheet, TextInput, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
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
import { shareOrDownloadInvoicePdf } from '@/lib/invoicePdf'

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
  const { id, party } = useLocalSearchParams<{ id: string; party?: string }>()
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
  const [previewParty, setPreviewParty] = useState<'student' | 'mentor' | null>(null)

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

  // Số tiền phân chia gốc & sau khi khấu trừ -3.000 ₫ phí nền tảng
  const mentorGross = (r.mentorEarnedAmount && r.mentorEarnedAmount > 0)
    ? r.mentorEarnedAmount
    : (resolvedTicket?.mentorAmount ?? snap?.mentorAmount ?? 0)
  const mentorFee = r.mentorPlatformFee != null
    ? r.mentorPlatformFee
    : (mentorGross > 0 ? Math.min(3000, mentorGross) : 0)
  const mentorNet = Math.max(0, mentorGross - mentorFee)

  const studentGross = (r.studentGrossRefundAmount != null && r.studentGrossRefundAmount > 0)
    ? r.studentGrossRefundAmount
    : (resolvedTicket?.studentRefund ?? snap?.studentRefund ?? r.studentRefundAmount ?? 0)
  const studentFee = r.studentPlatformFee != null
    ? r.studentPlatformFee
    : (studentGross > 0 ? Math.min(3000, studentGross) : 0)
  const studentNet = Math.max(0, studentGross - studentFee)

  const mentorSplit = mentorNet
  const studentSplit = studentNet
  const invoiceCode = r.invoiceCode || `INV-TASK-${id}`

  const buildPartyInvoiceText = (party: 'student' | 'mentor') => {
    const issuedAt = new Date(r.invoiceIssuedAt || Date.now()).toLocaleString('vi-VN')
    const partyCode = `${invoiceCode}-${party === 'student' ? 'HV' : 'CV'}`
    if (party === 'student') {
      return [
        '================================================',
        '       AlumNect - HÓA ĐƠN PHÍA HỌC VIÊN         ',
        '================================================',
        `Mã hóa đơn : ${partyCode}`,
        `Nhiệm vụ   : #${id} - ${title}`,
        `Ngày xuất  : ${issuedAt}`,
        `Trạng thái : ${TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus}`,
        '------------------------------------------------',
        `• Giá thỏa thuận gốc        : ${formatVnd(r.originalPrice)}`,
        `• Điều chỉnh bổ sung        : +${formatVnd(Math.max(0, delta))}`,
        `• Phí nền tảng khi thanh toán: ${formatVnd(0)}`,
        `• Tổng tiền đã thanh toán   : ${formatVnd(r.studentTotalPaid)}`,
        ...(studentGross > 0
          ? [
              '------------------------------------------------',
              `• Khoản hoàn phân bổ gốc    : ${formatVnd(studentGross)}`,
              `• Phí nền tảng              : -${formatVnd(studentFee)}`,
              `• SỐ TIỀN HOÀN THỰC NHẬN    : ${formatVnd(studentNet)}`,
            ]
          : []),
        '================================================',
      ].join('\n')
    }
    return [
      '================================================',
      '        AlumNect - HÓA ĐƠN PHÍA CỐ VẤN          ',
      '================================================',
      `Mã hóa đơn : ${partyCode}`,
      `Nhiệm vụ   : #${id} - ${title}`,
      `Ngày xuất  : ${issuedAt}`,
      `Trạng thái : ${TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus}`,
      '------------------------------------------------',
      `• Thù lao công việc gốc     : ${formatVnd(mentorGross)}`,
      `• Phí nền tảng              : ${mentorFee > 0 ? '-' + formatVnd(mentorFee) : formatVnd(0)}`,
      `• THÙ LAO THỰC NHẬN         : ${formatVnd(mentorNet)}`,
      '================================================',
    ].join('\n')
  }

  const buildPartyInvoiceHtml = (party: 'student' | 'mentor') => {
    const issuedAt = new Date(r.invoiceIssuedAt || Date.now()).toLocaleString('vi-VN')
    const partyCode = `${invoiceCode}-${party === 'student' ? 'HV' : 'CV'}`
    const partyTitle = party === 'student' ? 'HÓA ĐƠN PHÍA HỌC VIÊN' : 'HÓA ĐƠN PHÍA CỐ VẤN'
    const statusLabel = TASK_STATUS_LABEL[r.taskStatus] ?? r.taskStatus

    const bodyRows = party === 'student'
      ? `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
          <span>Giá thỏa thuận gốc:</span>
          <strong>${formatVnd(r.originalPrice)}</strong>
        </div>
        ${delta > 0 ? `
          <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px; color:#d97706;">
            <span>Bổ sung điều chỉnh:</span>
            <strong>+${formatVnd(delta)}</strong>
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
          <span>Phí nền tảng khi thanh toán:</span>
          <strong style="color:#16a34a;">${formatVnd(0)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:10px 0 6px; font-size:15px; font-weight:bold; border-top:1px dashed #cbd5e1; color:#0284c7;">
          <span>Tổng tiền đã thanh toán:</span>
          <span>${formatVnd(r.studentTotalPaid)}</span>
        </div>
        ${studentGross > 0 ? `
          <div style="margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0;">
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
              <span>Khoản hoàn phân bổ gốc:</span>
              <strong>${formatVnd(studentGross)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px; color:#dc2626; font-weight:bold;">
              <span>Phí nền tảng:</span>
              <span>-${formatVnd(studentFee)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 0 6px; font-size:16px; font-weight:bold; border-top:1px dashed #cbd5e1; color:#0284c7;">
              <span>SỐ TIỀN HOÀN THỰC NHẬN:</span>
              <span>${formatVnd(studentNet)}</span>
            </div>
          </div>
        ` : ''}
      `
      : `
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
          <span>Thù lao công việc gốc:</span>
          <strong>${formatVnd(mentorGross)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px; color:#dc2626; font-weight:bold;">
          <span>Phí nền tảng:</span>
          <span>${mentorFee > 0 ? '-' + formatVnd(mentorFee) : formatVnd(0)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; padding:10px 0 6px; font-size:16px; font-weight:bold; border-top:1px dashed #cbd5e1; color:#16a34a;">
          <span>THÙ LAO THỰC NHẬN:</span>
          <span>${formatVnd(mentorNet)}</span>
        </div>
      `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${partyTitle} - ${partyCode}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #ffffff; color: #0f172a; margin: 0; padding: 24px; }
          .invoice { max-width: 640px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f27024; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { font-size: 32px; font-weight: bold; line-height: 1; }
          .sub { font-size: 13px; font-weight: bold; color: #475569; margin-top: 6px; }
          .meta { text-align: right; font-size: 13px; color: #334155; line-height: 1.5; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-top: 16px; }
          .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="logo"><span style="color:#0a58ca;">Alum</span><span style="color:#c84b11;">Nect</span></div>
              <div class="sub">${partyTitle}</div>
            </div>
            <div class="meta">
              <div>Mã HĐ: <strong>${partyCode}</strong></div>
              <div>Nhiệm vụ: <strong>#${id}</strong></div>
              <div>Ngày xuất: <strong>${issuedAt}</strong></div>
              <div>Trạng thái: <strong>${statusLabel}</strong></div>
            </div>
          </div>
          <div style="font-size: 14px; margin-bottom: 12px;"><strong>Nhiệm vụ:</strong> ${title}</div>
          <div class="card">
            ${bodyRows}
          </div>
          <div class="footer">
            Chứng từ đối soát điện tử được trích xuất tự động từ hệ thống sổ giao dịch AlumNect.
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handleDownloadPartyInvoice = async (party: 'student' | 'mentor') => {
    const partyCode = `${invoiceCode}-${party === 'student' ? 'HV' : 'CV'}`
    const partyLabel = party === 'student' ? 'Hóa đơn Phía Học viên' : 'Hóa đơn Phía Cố vấn'
    const fileName = `${party === 'student' ? 'Hoa-don-Phia-Hoc-vien' : 'Hoa-don-Phia-Co-van'}-Task-${id}.pdf`
    try {
      const html = buildPartyInvoiceHtml(party)
      toast.info('Đang khởi tạo hóa đơn PDF...')
      await shareOrDownloadInvoicePdf(html, fileName)
      toast.success(`Đã xuất ${partyLabel} (${partyCode}) thành công!`)
    } catch {
      toast.error(`Không thể xuất ${partyLabel} PDF.`)
    }
  }

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
      <Header
        title={party === 'mentor' ? 'Hóa đơn Phía Cố vấn' : party === 'student' ? 'Hóa đơn Phía Học viên' : 'Báo cáo & Dòng tiền'}
        subtitle={`Nhiệm vụ #${id}`}
      />
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

        {/* Hóa đơn Phía Học viên */}
        {(!party || party === 'student') && (
          <Enter delay={180}>
            <Card title="Hóa đơn Phía Học viên" brand="people">
              <Row label="Phí nền tảng khi thanh toán" value={formatVnd(0)} color="#16A34A" />
              <Row label="Tổng tiền đã thanh toán" hint="Tạm giữ nguyên vẹn trên PayOS" value={formatVnd(r.studentTotalPaid)} strong />
              {studentGross > 0 ? (
                <>
                  <Row label="Khoản hoàn phân bổ gốc" value={formatVnd(studentGross)} />
                  <Row
                    label="Phí nền tảng"
                    value={`-${formatVnd(studentFee)}`}
                    color="#DC2626"
                  />
                  <Row
                    label="Số tiền hoàn thực nhận"
                    value={formatVnd(studentNet)}
                    strong
                    color="#0284C7"
                  />
                </>
              ) : null}
              <Row
                label={studentGross > 0 ? 'Trạng thái hoàn tiền' : 'Trạng thái quỹ'}
                hint={studentStatusHint}
                tag={moneyStatus(effectiveStudentStatus)}
                last
              />
              <View style={{ marginTop: 12 }}>
                <Button
                  title="Xem & Tải hóa đơn Phía Học viên"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ backgroundColor: '#0284C7', borderColor: '#0284C7' }}
                  onPress={() => setPreviewParty('student')}
                />
              </View>
            </Card>
          </Enter>
        )}

        {/* Hóa đơn Phía Cố vấn */}
        {(!party || party === 'mentor') && (
          <Enter delay={240}>
            <Card title="Hóa đơn Phía Cố vấn" brand="suitcase">
              <Row label="Thù lao công việc gốc" value={formatVnd(mentorGross)} />
              <Row
                label="Phí nền tảng"
                value={mentorFee > 0 ? `-${formatVnd(mentorFee)}` : formatVnd(0)}
                color={mentorFee > 0 ? '#DC2626' : colors.textSecondary}
              />
              <Row
                label="Thù lao thực nhận"
                value={formatVnd(mentorNet)}
                strong
                color={viridian}
              />
              <Row
                label="Trạng thái chi trả"
                hint={mentorStatusHint}
                tag={moneyStatus(effectiveMentorStatus)}
                last
              />
              <View style={{ marginTop: 12 }}>
                <Button
                  title="Xem & Tải hóa đơn Phía Cố vấn"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => setPreviewParty('mentor')}
                />
              </View>
            </Card>
          </Enter>
        )}

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

      {/* Sheet Hóa đơn điện tử tách riêng kèm Logo AlumNect trên Mobile */}
      <SheetModal visible={previewParty !== null} onClose={() => setPreviewParty(null)}>
        {previewParty ? (
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#F27024', paddingBottom: 14, marginBottom: 16 }}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Txt size={28} weight="800" style={{ color: '#0A58CA', fontStyle: 'italic' }}>Alum</Txt>
                  <Txt size={28} weight="800" style={{ color: '#C84B11', fontStyle: 'italic' }}>Nect</Txt>
                </View>
                <Txt size={11.5} weight="800" style={{ color: colors.textSecondary, marginTop: 4, letterSpacing: 0.4 }}>
                  {previewParty === 'student' ? 'HÓA ĐƠN PHÍA HỌC VIÊN' : 'HÓA ĐƠN PHÍA CỐ VẤN'}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt size={11.5} style={{ color: colors.textSecondary }}>
                  Mã: <Txt size={11.5} weight="800" style={{ color: colors.text }}>{`${invoiceCode}-${previewParty === 'student' ? 'HV' : 'CV'}`}</Txt>
                </Txt>
                <Txt size={11.5} style={{ color: colors.textSecondary, marginTop: 2 }}>
                  Nhiệm vụ: <Txt size={11.5} weight="800" style={{ color: colors.text }}>{`#${id}`}</Txt>
                </Txt>
              </View>
            </View>

            <Txt size={13} style={{ color: colors.text, marginBottom: 12 }} numberOfLines={2}>
              <Txt size={13} weight="800">Tên nhiệm vụ: </Txt>{title}
            </Txt>

            <View style={{ backgroundColor: isDark ? colors.surface : '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
              {previewParty === 'student' ? (
                <>
                  <Row label="Giá thỏa thuận gốc" value={formatVnd(r.originalPrice)} />
                  <Row label="Điều chỉnh bổ sung" value={`+${formatVnd(Math.max(0, delta))}`} />
                  <Row label="Phí nền tảng khi thanh toán" value={formatVnd(0)} color="#16A34A" />
                  <Row label="Tổng tiền đã thanh toán (Giữ trên PayOS)" value={formatVnd(r.studentTotalPaid)} strong color="#0284C7" last={studentGross <= 0} />
                  {studentGross > 0 ? (
                    <>
                      <Row label="Khoản hoàn trả phân bổ gốc" value={formatVnd(studentGross)} />
                      <Row label="Phí nền tảng" value={`-${formatVnd(studentFee)}`} color="#DC2626" />
                      <Row label="Số tiền hoàn thực nhận" value={formatVnd(studentNet)} strong color="#0284C7" last />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <Row label="Thù lao công việc gốc" value={formatVnd(mentorGross)} />
                  <Row label="Phí nền tảng" value={mentorFee > 0 ? `-${formatVnd(mentorFee)}` : formatVnd(0)} color={mentorFee > 0 ? '#DC2626' : colors.textSecondary} />
                  <Row label="Thù lao thực nhận" value={formatVnd(mentorNet)} strong color={viridian} />
                  <Row label="Trạng thái chi trả" tag={moneyStatus(effectiveMentorStatus)} last />
                </>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Button
                title="Đóng"
                variant="outline"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => setPreviewParty(null)}
              />
              <Button
                title="Tải hóa đơn về máy"
                size="sm"
                textColor="#FFFFFF"
                style={{ flex: 2, backgroundColor: previewParty === 'student' ? '#0284C7' : viridian, borderColor: previewParty === 'student' ? '#0284C7' : viridian }}
                onPress={() => { void handleDownloadPartyInvoice(previewParty) }}
              />
            </View>
          </View>
        ) : null}
      </SheetModal>

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
