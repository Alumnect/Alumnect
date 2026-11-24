import React, { useState } from 'react'
import { Platform, Pressable, Share, StyleSheet, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { SectionCard, StatBox, StatRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import {
  BarChart3,
  CalendarPlus,
  ChevronRight,
  Clock,
  CreditCard,
  FileCheck2,
  FilePen,
  History,
  MessageCircle,
  NotebookPen,
  PackageCheck,
  Plus,
  Scale,
  ShieldAlert,
  Star,
  Target,
  Zap,
} from '@/components/icons'
import { Header } from '@/components/Header'
import { PaymentSheet } from '@/components/PaymentSheet'
import { SheetModal } from '@/components/SheetModal'
import { WorkLogCard } from '@/components/WorkLogCard'
import { TASK_STATUS_LABEL, TICKET_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'
import { shareOrDownloadInvoicePdf } from '@/lib/invoicePdf'

/** UC96–101, 104: trung tâm quản lý một task — nhật ký, gia hạn, điều chỉnh, nghiệm thu, hòa giải, tranh chấp. */
export default function TaskDetailScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const tid = Number(id)
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [completionRating, setCompletionRating] = useState<number>(5)
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)
  const [showPaymentInvoice, setShowPaymentInvoice] = useState<boolean>(false)

  const q = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-task', tid] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    qc.invalidateQueries({ queryKey: ['mentoring-review', tid] })
  }
  const run = (fn: () => Promise<unknown>, ok: string) =>
    fn()
      .then(() => {
        toast.success(ok)
        refresh()
      })
      .catch((e) => toast.error(errMsg(e)))
  const go = (type: string, extra?: Record<string, string>) =>
    router.push({ pathname: '/mentoring/tasks/[id]/action', params: { id: String(tid), type, ...extra } })

  const buildPaymentInvoiceText = () => {
    const issuedAt = new Date().toLocaleString('vi-VN')
    const price = q.data?.overview.agreedPrice ?? 0
    return [
      '================================================',
      '   AlumNect - HÓA ĐƠN XÁC NHẬN THANH TOÁN DEAL  ',
      '================================================',
      `Mã hóa đơn : INV-PAY-${tid}`,
      `Nhiệm vụ   : #${tid} - ${q.data?.overview.taskScope || 'Nhiệm vụ Mentoring'}`,
      `Người thanh toán : ${q.data?.student?.fullName || 'Học viên'}`,
      `Người nhận dự kiến: ${q.data?.mentor?.fullName || 'Cố vấn'}`,
      `Thời gian  : ${issuedAt}`,
      `Cổng thanh toán  : PayOS (Tích hợp bảo đảm Escrow)`,
      '------------------------------------------------',
      `• Giá trị thỏa thuận gốc     : ${formatVnd(price)}`,
      `• Phí vận hành nền tảng      : ${formatVnd(0)} (Miễn phí)`,
      `• TỔNG TIỀN ĐÃ THANH TOÁN    : ${formatVnd(price)}`,
      '------------------------------------------------',
      'Ghi chú an toàn dòng tiền:',
      '- Phí nền tảng khi thanh toán là 0đ.',
      '- Toàn bộ số tiền đang được tạm giữ nguyên vẹn',
      '  trên PayOS và chỉ giải ngân hoặc hoàn trả theo',
      '  kết quả nghiệm thu/hòa giải hợp lệ.',
      '================================================',
    ].join('\n')
  }

  const buildPaymentInvoiceHtml = () => {
    const title = q.data?.overview.taskTitle || q.data?.overview.taskScope || 'Nhiệm vụ Cố vấn'
    const code = `PAY-TASK-${tid}`
    const price = q.data?.overview.agreedPrice ?? 0
    const paidAt = new Date().toLocaleString('vi-VN')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Hóa đơn thanh toán - ${code}</title>
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
              <div class="sub">HÓA ĐƠN THANH TOÁN YÊU CẦU CỐ VẤN</div>
            </div>
            <div class="meta">
              <div>Mã GD: <strong>${code}</strong></div>
              <div>Nhiệm vụ: <strong>#${tid}</strong></div>
              <div>Ngày TT: <strong>${paidAt}</strong></div>
            </div>
          </div>
          <div style="font-size: 14px; margin-bottom: 12px;"><strong>Nhiệm vụ:</strong> ${title}</div>
          <div class="card">
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
              <span>Giá trị thỏa thuận gốc:</span>
              <strong>${formatVnd(price)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:14px;">
              <span>Phí nền tảng khi thanh toán:</span>
              <strong style="color:#16a34a;">${formatVnd(0)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; padding:10px 0 6px; font-size:16px; font-weight:bold; border-top:1px dashed #cbd5e1; color:#16a34a;">
              <span>TỔNG TIỀN ĐÃ THANH TOÁN:</span>
              <span>${formatVnd(price)}</span>
            </div>
            <div style="margin-top:10px; padding-top:8px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b;">
              Trạng thái tiền: Đang tạm giữ nguyên vẹn trên PayOS (Ký quỹ Escrow bảo vệ hai bên).
            </div>
          </div>
          <div class="footer">
            Hóa đơn thanh toán điện tử được khởi tạo tự động qua cổng PayOS & hệ thống AlumNect.
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handleDownloadPaymentInvoice = async () => {
    const code = `PAY-TASK-${tid}`
    const fileName = `Hoa-don-Thanh-toan-${code}.pdf`
    try {
      const html = buildPaymentInvoiceHtml()
      toast.info('Đang khởi tạo hóa đơn PDF...')
      await shareOrDownloadInvoicePdf(html, fileName)
      toast.success('Đã xuất hóa đơn thanh toán PDF thành công!')
    } catch {
      toast.error('Không thể xuất hóa đơn thanh toán PDF.')
    }
  }

  const topup = useMutation({
    mutationFn: (amendmentId: number) => taskApi.checkout(q.data!.deal.id, amendmentId),
    onSuccess: setCheckout,
    onError: (e) => toast.error(errMsg(e)),
  })

  const d = q.data
  // Cho phép đánh giá ngay từ khi Mentor nộp kết quả (SUBMITTED) trước khi Confirm nghiệm thu, hoặc khi COMPLETED.
  const canReviewMentor = !!d?.permissions.isStudent && (d?.overview.status === 'COMPLETED' || d?.overview.status === 'SUBMITTED')
  const myReview = useQuery({
    queryKey: ['mentoring-review', tid],
    queryFn: () => taskApi.myReview(tid),
    enabled: canReviewMentor,
  })
  if (q.isLoading)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Chi tiết nhiệm vụ" />
        <Loading />
      </Screen>
    )
  if (!d)
    return (
      <Screen keyboard bg={colors.bg}>
        <Header title="Chi tiết nhiệm vụ" />
        <Empty error={q.error} onRetry={() => { void q.refetch() }} text="Không tìm thấy nhiệm vụ." />
      </Screen>
    )
  const { overview: o, permissions: p } = d
  const other = p.isStudent ? d.mentor : d.student

  const pct = Math.min(100, o.progressPercentage ?? 0)
  const actions: { key: string; label: string; icon: React.ReactNode; onPress: () => void; primary?: boolean; danger?: boolean }[] = [
    ...(d.conversationId
      ? [
          {
            key: 'chat',
            label: 'Phòng Chat',
            icon: <MessageCircle size={19} color="#FFFFFF" weight="fill" />,
            primary: true,
            onPress: () => router.push({ pathname: '/chat/[id]', params: { id: String(d.conversationId) } }),
          },
        ]
      : []),
    {
      key: 'report',
      label: 'Báo cáo & Dòng tiền',
      icon: <BarChart3 size={19} color={viridian} weight="bold" />,
      onPress: () => router.push({ pathname: '/mentoring/tasks/[id]/report', params: { id: String(tid) } }),
    },
    ...(p.canSubmitCompletion
      ? [
          {
            key: 'completion',
            label: 'Nộp kết quả',
            icon: <PackageCheck size={19} color={viridian} weight="bold" />,
            onPress: () => go('completion'),
          },
        ]
      : []),
    ...(p.canRequestExtension
      ? [
          {
            key: 'extension',
            label: 'Xin gia hạn',
            icon: <CalendarPlus size={19} color={viridian} weight="bold" />,
            onPress: () => go('extension'),
          },
        ]
      : []),
    ...(p.canRequestAmendment
      ? [
          {
            key: 'amendment',
            label: 'Điều chỉnh nhiệm vụ',
            icon: <FilePen size={19} color={colors.text} />,
            onPress: () => go('amendment'),
          },
        ]
      : []),
    ...(p.canProposeSettlement
      ? [
          {
            key: 'settlement',
            label: 'Đề xuất hòa giải',
            icon: <Scale size={19} color={viridian} weight="bold" />,
            onPress: () => go('settlement'),
          },
        ]
      : []),
    ...(p.canSubmitSettlementTicket
      ? [
          {
            key: 'ticket',
            label: 'Biên bản hòa giải',
            icon: <FileCheck2 size={19} color={viridian} weight="bold" />,
            onPress: () => go('settlement-ticket'),
          },
        ]
      : []),
    ...(p.canCreateDisputeTicket
      ? [
          {
            key: 'dispute',
            label: 'Khiếu nại / Tranh chấp',
            icon: <ShieldAlert size={19} color="#DC2626" weight="bold" />,
            danger: true,
            onPress: () => go('dispute'),
          },
        ]
      : []),
  ]

  return (
    <Screen keyboard bg={colors.bg}>
      <Header title="Không gian Nhiệm vụ" subtitle={`Nhiệm vụ #${tid}`} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Overview Card (Meetup x Kakao Bento) */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Tag label={TASK_STATUS_LABEL[o.status] ?? o.status} tone={statusTone(o.status)} />
              {o.isOverdue ? <Tag label="Quá hạn" tone="danger" /> : null}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={13} color={colors.textTertiary} />
              <Txt size={11} weight="600" style={{ color: colors.textTertiary }}>
                {new Date(o.deadline).toLocaleDateString('vi-VN')}
              </Txt>
            </View>
          </View>

          {/* Tiêu đề: chỉ lấy dòng đầu (phần còn lại là mô tả, đã hiện ở mục Phạm vi) */}
          <Txt size={18} weight="800" style={{ color: colors.text, marginTop: 10, lineHeight: 25 }} numberOfLines={2}>
            {o.taskTitle.split('\n').map((x) => x.trim()).find(Boolean) ?? o.taskTitle}
          </Txt>

          {/* Progress Bar */}
          <View style={styles.progressWrap}>
            <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${pct}%`,
                    backgroundColor: pct >= 100 ? '#16A34A' : viridian,
                  },
                ]}
              />
            </View>
            <Txt weight="800" size={14} style={{ color: pct >= 100 ? '#16A34A' : viridian }}>
              {`${pct}%`}
            </Txt>
          </View>

          <StatRow style={{ marginTop: 14 }}>
            <StatBox value={`${o.confirmedWorkLogs}/${o.totalWorkLogs}`} label="Nhật ký duyệt" />
            <StatBox value={o.daysRemaining} label="Ngày còn lại" color={o.isOverdue ? '#DC2626' : undefined} />
            <StatBox value={formatVnd(o.agreedPrice)} label="Ngân sách" color={viridian} />
          </StatRow>
        </View>

        {/* Counterpart Profile Card */}
        <Pressable
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: String(other.id) } })}
          style={({ pressed }) => [
            styles.counterpartCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Avatar uri={other.avatarUrl} name={other.fullName} size={46} ring />
          <View style={{ flex: 1 }}>
            <Txt size={11} weight="700" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {p.isStudent ? 'Mentor hướng dẫn' : 'Học viên đồng hành'}
            </Txt>
            <Txt weight="800" size={15} style={{ color: colors.text, marginTop: 2 }}>
              {other.fullName}
            </Txt>
          </View>
          <ChevronRight size={18} color={colors.textTertiary} weight="bold" />
        </Pressable>

        {canReviewMentor && myReview.data ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: viridianSoft }}>
            <Star size={16} color={viridian} weight="fill" />
            <Txt size={13} weight="700" style={{ color: viridian, flex: 1 }} numberOfLines={2}>
              {`Bạn đã đánh giá mentor ${myReview.data.rating}/5 sao${myReview.data.comment ? ` · “${myReview.data.comment}”` : ''}`}
            </Txt>
          </View>
        ) : null}

        {/* Thông tin thanh toán ban đầu (0đ phí nền tảng, tiền giữ an toàn trên PayOS) */}
        {p.isStudent ? (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CreditCard size={18} color={viridian} />
                <Txt size={14} weight="800" style={{ color: colors.text }}>
                  Thông tin thanh toán
                </Txt>
              </View>
              <View
                style={{
                  backgroundColor: '#DCFCE7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                }}
              >
                <Txt size={11} weight="800" style={{ color: '#15803D' }}>
                  Đã thanh toán (0đ phí)
                </Txt>
              </View>
            </View>

            <Txt size={12} style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Tạm giữ an toàn trên PayOS · Chưa giải ngân cho Cố vấn
            </Txt>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <Txt size={13} style={{ color: colors.textSecondary }}>
                Số tiền đã thanh toán:
              </Txt>
              <Txt size={16} weight="800" style={{ color: '#0284C7' }}>
                {formatVnd(o.agreedPrice)}
              </Txt>
            </View>

            <Button
              title="Tải / Xem hóa đơn thanh toán"
              size="sm"
              variant="outline"
              style={{ borderColor: '#0284C7' }}
              textColor="#0284C7"
              onPress={() => setShowPaymentInvoice(true)}
            />
          </View>
        ) : null}

        {/* Scope & Deliverables */}
        <SectionCard title="Phạm vi & Kết quả kỳ vọng" icon={<Target size={18} color={viridian} weight="bold" />}>
          <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
            PHẠM VI CÔNG VIỆC
          </Txt>
          <Txt size={14} style={{ color: colors.text, lineHeight: 22, marginTop: 4 }}>
            {o.taskScope}
          </Txt>
          <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 12 }} />
          <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
            KẾT QUẢ KỲ VỌNG ĐẦU RA
          </Txt>
          <Txt size={14} style={{ color: colors.text, lineHeight: 22, marginTop: 4 }}>
            {d.deal.expectedResult}
          </Txt>
        </SectionCard>

        {/* Bento Action Grid */}
        <SectionCard title="Bảng điều khiển Nhiệm vụ" icon={<Zap size={18} color={viridian} weight="fill" />}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
            {actions.map((a, i) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                accessibilityRole="button"
                // Ô lẻ cuối cùng trải đủ chiều ngang để lưới cân đối.
                style={({ pressed }) => ({ width: actions.length % 2 === 1 && i === actions.length - 1 ? '100%' : '50%', padding: 4, opacity: pressed ? 0.78 : 1 })}
              >
                <View
                  style={[
                    styles.actionTile,
                    a.primary
                      ? { backgroundColor: viridian, borderColor: viridian }
                      : a.danger
                        ? { backgroundColor: isDark ? '#2B1414' : '#FEF2F2', borderColor: isDark ? '#5C2323' : '#FECACA' }
                        : { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
                  ]}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      {
                        backgroundColor: a.primary
                          ? 'rgba(255,255,255,0.2)'
                          : a.danger
                            ? 'rgba(220,38,38,0.12)'
                            : viridianSoft,
                      },
                    ]}
                  >
                    {a.icon}
                  </View>
                  <Txt
                    size={13}
                    weight="700"
                    style={{
                      flex: 1,
                      color: a.primary ? '#FFFFFF' : a.danger ? '#DC2626' : colors.text,
                    }}
                    numberOfLines={2}
                  >
                    {a.label}
                  </Txt>
                </View>
              </Pressable>
            ))}
          </View>
        </SectionCard>

        {/* Pending Alerts: Extension / Amendment / Settlement / Completion / Dispute */}
        {d.activeExtension && d.activeExtension.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: viridian }}>
            <Txt weight="800" size={15} style={{ color: viridian }}>
              Yêu cầu gia hạn thời gian
            </Txt>
            <Txt size={13} style={{ marginTop: 4 }}>
              {d.activeExtension.createdByName} đề xuất hạn mới:{' '}
              <Txt weight="700" size={13}>
                {new Date(d.activeExtension.proposedDeadline).toLocaleString('vi-VN')}
              </Txt>
            </Txt>
            <Txt muted size={13} style={{ marginTop: 2 }}>
              Lý do: {d.activeExtension.reason}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {d.activeExtension.canConfirm ? (
                <Button
                  title="Đồng ý"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, true), 'Đã chấp nhận gia hạn.')}
                />
              ) : null}
              {d.activeExtension.canReject ? (
                <Button
                  title="Từ chối"
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => run(() => taskApi.respondExtension(d.activeExtension!.id, false), 'Đã từ chối gia hạn.')}
                />
              ) : null}
              {d.activeExtension.canCancel ? (
                <Button
                  title="Hủy đề xuất"
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => run(() => taskApi.cancelExtension(d.activeExtension!.id), 'Đã hủy đề xuất.')}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {d.activeAmendment && ['PENDING', 'AWAITING_TOPUP'].includes(d.activeAmendment.status) ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: viridian }}>
            <Txt weight="800" size={15} style={{ color: viridian }}>
              Đề xuất điều chỉnh Task ({d.activeAmendment.status === 'AWAITING_TOPUP' ? 'Chờ nạp thêm' : 'Chờ phản hồi'})
            </Txt>
            {d.activeAmendment.newScope ? <Txt size={13} style={{ marginTop: 4 }}>Phạm vi mới: {d.activeAmendment.newScope}</Txt> : null}
            {d.activeAmendment.additionalAmount ? (
              <Txt size={13} weight="700" style={{ color: viridian, marginTop: 2 }}>
                Phát sinh thêm: {formatVnd(d.activeAmendment.additionalAmount)}
              </Txt>
            ) : null}
            <Txt muted size={13} style={{ marginTop: 2 }}>
              Lý do: {d.activeAmendment.reason}
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {d.activeAmendment.canConfirm ? (
                <Button
                  title="Đồng ý"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, true), 'Đã chấp nhận điều chỉnh.')}
                />
              ) : null}
              {d.activeAmendment.canReject ? (
                <Button
                  title="Từ chối"
                  size="sm"
                  variant="outline"
                  onPress={() => run(() => taskApi.respondAmendment(d.activeAmendment!.id, false), 'Đã từ chối điều chỉnh.')}
                />
              ) : null}
              {d.activeAmendment.canTopUp ? (
                <Button
                  title="Thanh toán bổ sung"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => topup.mutate(d.activeAmendment!.id)}
                  loading={topup.isPending}
                />
              ) : null}
              {d.activeAmendment.canCancel ? (
                <Button
                  title="Hủy đề xuất"
                  size="sm"
                  variant="outline"
                  onPress={() => run(() => taskApi.cancelAmendment(d.activeAmendment!.id), 'Đã hủy đề xuất.')}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {d.activeSettlementProposal && d.activeSettlementProposal.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: viridian }}>
            <Txt weight="800" size={15} style={{ color: viridian }}>
              Đề xuất hòa giải dừng Task
            </Txt>
            <Txt size={13} style={{ marginTop: 4 }}>
              Mentor nhận {formatVnd(d.activeSettlementProposal.mentorAmount)} · Sinh viên hoàn {formatVnd(d.activeSettlementProposal.studentRefund)}
            </Txt>
            <Txt muted size={13} style={{ marginTop: 2 }}>
              Lý do: {d.activeSettlementProposal.reason}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {d.activeSettlementProposal.canAccept ? (
                <Button
                  title="Đồng ý & Nhận tiền tự động"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, true), 'Đã chấp nhận hòa giải. Hệ thống đang tự động chi trả & hoàn tiền.')}
                />
              ) : null}
              {d.activeSettlementProposal.canReject ? (
                <Button
                  title="Từ chối"
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, false), 'Đã từ chối hòa giải.')}
                />
              ) : null}
              {d.activeSettlementProposal.canCancel ? (
                <Button
                  title="Hủy"
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => run(() => taskApi.cancelSettlement(d.activeSettlementProposal!.id), 'Đã hủy đề xuất.')}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {d.latestCompletion && d.latestCompletion.status === 'PENDING' ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: viridian }}>
            <Txt weight="800" size={15} style={{ color: viridian }}>
              Kết quả bàn giao chờ nghiệm thu
            </Txt>
            <Txt style={{ marginTop: 4 }}>{d.latestCompletion.finalSummary}</Txt>
            {d.latestCompletion.deliverables ? (
              <Txt muted size={13} style={{ marginTop: 2 }}>
                Sản phẩm: {d.latestCompletion.deliverables}
              </Txt>
            ) : null}
            {p.canConfirmCompletion && d.latestCompletion.canConfirm ? (
              <View style={{ marginTop: 12 }}>
                <View style={{ padding: 12, borderRadius: 12, backgroundColor: isDark ? colors.surface : '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', marginBottom: 10 }}>
                  <Txt size={12.5} weight="800" style={{ color: colors.text, marginBottom: 6 }}>
                    Đánh giá Cố vấn trước khi xác nhận nghiệm thu *
                  </Txt>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        onPress={() => setCompletionRating(star)}
                        hitSlop={6}
                        style={{ padding: 2 }}
                      >
                        <Star
                          size={28}
                          color={star <= completionRating ? '#F59E0B' : colors.border}
                          weight={star <= completionRating ? 'fill' : 'regular'}
                        />
                      </Pressable>
                    ))}
                    <Txt size={12.5} weight="700" style={{ color: '#D97706', marginLeft: 4 }}>
                      {`${completionRating}/5 sao`}
                    </Txt>
                  </View>
                </View>

                <Input
                  value={feedback[-1] ?? ''}
                  onChangeText={(v) => setFeedback({ ...feedback, [-1]: v })}
                  placeholder="Nhận xét đánh giá Mentor / Lý do yêu cầu làm lại"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Đánh giá & Nghiệm thu"
                    size="sm"
                    textColor="#FFFFFF"
                    style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                    onPress={() =>
                      run(
                        () => taskApi.respondCompletion(tid, d.latestCompletion!.id, true, feedback[-1], completionRating, feedback[-1]),
                        'Đã đánh giá Mentor và nghiệm thu hoàn tất nhiệm vụ!'
                      )
                    }
                  />
                  <Button
                    title="Yêu cầu làm lại"
                    size="sm"
                    variant="outline"
                    style={{ flex: 1 }}
                    onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, false, feedback[-1]), 'Đã yêu cầu làm lại.')}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        ) : null}

        {d.activeTicket ? (
          <Card
            style={{ marginHorizontal: 16, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#DC2626' }}
            onPress={() =>
              router.push({
                pathname: '/mentoring/dispute/[ticketId]/chat',
                params: { ticketId: String(d.activeTicket!.id), taskId: String(tid) },
              })
            }
          >
            <Txt weight="800" color="#DC2626">
              Phiếu tranh chấp #{d.activeTicket.ticketCode} · {TICKET_STATUS_LABEL[d.activeTicket.status] ?? d.activeTicket.status}
            </Txt>
            <Txt weight="600" style={{ marginTop: 4 }}>{d.activeTicket.title}</Txt>
            <Txt size={12} style={{ color: viridian, fontWeight: '700', marginTop: 6 }}>
              Chạm để vào phòng giải quyết tranh chấp & nộp minh chứng →
            </Txt>
          </Card>
        ) : null}

        {/* Work Logs Section */}
        <View style={styles.sectionHeaderRow}>
          <Txt weight="800" size={16} style={{ flex: 1, color: colors.text }}>
            Nhật ký công việc ({d.workLogs.length})
          </Txt>
          {p.canAddWorkLog ? (
            <Button
              title="Thêm nhật ký"
              size="sm"
              textColor="#FFFFFF"
              icon={<Plus size={15} color="#FFFFFF" weight="bold" />}
              style={{ backgroundColor: viridian, borderColor: viridian }}
              onPress={() => go('worklog')}
            />
          ) : null}
        </View>

        {d.workLogs.length === 0 ? (
          <Empty
            error={q.error}
            onRetry={() => { void q.refetch() }}
            icon={<NotebookPen size={28} color={viridian} />}
            title="Chưa có nhật ký công việc"
            text="Mentor ghi lại nhật ký sau mỗi buổi làm việc để học viên xác nhận tiến độ."
          />
        ) : null}

        {d.workLogs.map((w, i) => (
          <WorkLogCard
            key={w.id}
            log={w}
            number={d.workLogs.length - i}
            isLatest={i === 0}
            onEdit={() => go('worklog', { workLogId: String(w.id) })}
            onConfirm={async (fb) => {
              try {
                await taskApi.confirmWorkLog(tid, w.id, fb)
                toast.success('Đã xác nhận nghiệm thu nhật ký.')
                refresh()
              } catch (e) {
                toast.error(errMsg(e))
                throw e
              }
            }}
            onReject={async (reason) => {
              try {
                await taskApi.rejectWorkLog(tid, w.id, reason)
                toast.success('Đã gửi yêu cầu điều chỉnh.')
                refresh()
              } catch (e) {
                toast.error(errMsg(e))
                throw e
              }
            }}
          />
        ))}

        {/* Activity Timeline */}
        {d.history.length ? (
          <SectionCard title="Lịch sử hoạt động" icon={<History size={18} color={viridian} weight="bold" />} style={{ marginTop: 6 }}>
            {d.history.slice(0, 15).map((h, i, arr) => (
              <View key={h.id} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginTop: 5,
                      backgroundColor: i === 0 ? viridian : colors.border,
                    }}
                  />
                  {i < arr.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: colors.borderSubtle }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 12 }}>
                  <Txt size={13} weight="700" style={{ color: colors.text }}>
                    {h.title}
                  </Txt>
                  <Txt muted size={12}>
                    {`${h.actorName} · ${new Date(h.timestamp).toLocaleString('vi-VN')}`}
                  </Txt>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}
      </ScrollView>

      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => {
          setCheckout(null)
          refresh()
        }}
        onClose={() => setCheckout(null)}
        onCancel={async () => {
          if (checkout) await taskApi.cancelPayment(checkout.orderCode).catch(() => {})
          setCheckout(null)
        }}
      />

      {/* Sheet Hóa đơn thanh toán ban đầu (0đ phí, giữ trên PayOS) */}
      <SheetModal visible={showPaymentInvoice} onClose={() => setShowPaymentInvoice(false)}>
        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#F27024', paddingBottom: 14, marginBottom: 16 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Txt size={28} weight="800" style={{ color: '#0A58CA', fontStyle: 'italic' }}>Alum</Txt>
                <Txt size={28} weight="800" style={{ color: '#C84B11', fontStyle: 'italic' }}>Nect</Txt>
              </View>
              <Txt size={11.5} weight="800" style={{ color: colors.textSecondary, marginTop: 4, letterSpacing: 0.4 }}>
                HÓA ĐƠN THANH TOÁN YÊU CẦU
              </Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt size={11.5} style={{ color: colors.textSecondary }}>
                Mã: <Txt size={11.5} weight="800" style={{ color: colors.text }}>{`INV-PAY-${tid}`}</Txt>
              </Txt>
              <Txt size={11.5} style={{ color: colors.textSecondary, marginTop: 2 }}>
                Nhiệm vụ: <Txt size={11.5} weight="800" style={{ color: colors.text }}>{`#${tid}`}</Txt>
              </Txt>
            </View>
          </View>

          <View style={{ backgroundColor: isDark ? colors.surface : '#F8FAFC', borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={13} style={{ color: colors.textSecondary }}>Giá thỏa thuận:</Txt>
              <Txt size={13} weight="700" style={{ color: colors.text }}>{formatVnd(o.agreedPrice)}</Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt size={13} style={{ color: colors.textSecondary }}>Phí nền tảng thanh toán:</Txt>
              <Txt size={13} weight="700" style={{ color: '#16A34A' }}>0 ₫ (Miễn phí)</Txt>
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Txt size={13.5} weight="800" style={{ color: colors.text }}>Tổng thanh toán:</Txt>
              <Txt size={16} weight="800" style={{ color: '#0284C7' }}>{formatVnd(o.agreedPrice)}</Txt>
            </View>
            <View style={{ marginTop: 4, padding: 10, borderRadius: 10, backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
              <Txt size={11.5} style={{ color: '#1E40AF', lineHeight: 16 }}>
                Trạng thái: Đang tạm giữ nguyên vẹn trên PayOS (chưa giải ngân cho Cố vấn).
              </Txt>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <Button
              title="Đóng"
              variant="outline"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => setShowPaymentInvoice(false)}
            />
            <Button
              title="Tải hóa đơn về máy"
              size="sm"
              textColor="#FFFFFF"
              style={{ flex: 2, backgroundColor: '#0284C7', borderColor: '#0284C7' }}
              onPress={() => { void handleDownloadPaymentInvoice() }}
            />
          </View>
        </View>
      </SheetModal>
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
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  counterpartCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
  },
})
