import React, { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Avatar, Button, Card, Empty, Input, Loading, Screen, Tag, Txt } from '@/components/ui'
import { SectionCard, StatBox, StatRow } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import {
  BarChart3,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
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
import { TASK_STATUS_LABEL, taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { formatVnd } from '@/api/mentoring'
import { useAuthStore } from '@/store/authStore'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'
import type { TaskDetail } from '@/api/mentoringTask'

export function buildDemoTaskDetail(tid: number, isStudent: boolean): TaskDetail {
  return {
    overview: {
      id: tid || 101,
      taskTitle: 'Xây dựng Backend Microservices với Spring Boot & Apache Kafka',
      taskScope: 'Thiết kế Event-Driven Architecture, tích hợp Redis Caching và CI/CD Docker Compose phục vụ dự án thực chiến.',
      agreedPrice: 2500000,
      status: 'IN_PROGRESS',
      progressPercentage: 65,
      workingMode: 'BOTH' as const,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      daysRemaining: 7,
      isOverdue: false,
      totalWorkLogs: 5,
      confirmedWorkLogs: 3,
      pendingWorkLogs: 1,
      escrowBalance: 2500000,
    },
    deal: {
      id: 201,
      expectedResult: 'Hệ thống vận hành trơn tru, đầy đủ tài liệu API Swagger, Unit test coverage > 80% và mã nguồn trên GitHub.',
      isPaid: true,
    },
    student: {
      id: 1,
      fullName: 'Phan Hieu',
      avatarUrl: null,
      email: 'hieu.phan@alumnect.vn',
      role: 'STUDENT',
      headline: 'Sinh viên Kỹ thuật Phần mềm · FPT University',
    },
    mentor: {
      id: 2,
      fullName: 'Nguyễn Hoàng Nam',
      avatarUrl: null,
      email: 'nam.nguyen@vng.com.vn',
      role: 'ALUMNI',
      headline: 'VNG Tech Lead · Cựu sinh viên FPT (Khóa 12)',
    },
    conversationId: 301,
    workLogs: [
      {
        id: 1,
        taskId: tid || 101,
        mentorName: 'Nguyễn Hoàng Nam',
        logDate: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
        description: 'Buổi 1: Thống nhất Kiến trúc Microservices & Data Model',
        workCompleted: 'Hoàn thiện sơ đồ kiến trúc hệ thống, thống nhất Entity Relationship Diagram và cài đặt khung Spring Boot 3.',
        result: 'Đã tạo xong repo GitHub, cấu hình Gradle và Docker Compose PostgreSQL.',
        nextAction: 'Buổi tiếp theo sẽ cài đặt Kafka Cluster và viết Message Producer.',
        status: 'CONFIRMED',
        studentFeedback: 'Mentor giải thích rất dễ hiểu, hướng dẫn chi tiết cách tổ chức package.',
        attachments: [],
        canEdit: false,
        canConfirm: false,
        canReject: false,
      },
      {
        id: 2,
        taskId: tid || 101,
        mentorName: 'Nguyễn Hoàng Nam',
        logDate: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
        description: 'Buổi 2: Tích hợp Apache Kafka Message Broker & Retry Mechanism',
        workCompleted: 'Cấu hình Kafka topic partitioning, viết Consumer với DLQ (Dead Letter Queue) xử lý lỗi tin nhắn.',
        result: 'Broker nhận và xử lý sự kiện mua hàng tức thì, tự động retry khi mất kết nối.',
        nextAction: 'Buổi tiếp theo sẽ cài đặt Redis Caching Sentinel.',
        status: 'CONFIRMED',
        studentFeedback: 'Thực hành rất thực tế, nắm rõ nguyên lý idempotent.',
        attachments: [],
        canEdit: false,
        canConfirm: false,
        canReject: false,
      },
      {
        id: 3,
        taskId: tid || 101,
        mentorName: 'Nguyễn Hoàng Nam',
        logDate: new Date().toISOString().slice(0, 10),
        description: 'Buổi 3: Tối ưu hiệu năng truy vấn Database & Connection Pool',
        workCompleted: 'Áp dụng HikariCP, lập chỉ mục Composite Index trên các bảng giao dịch lớn, benchmark Apache JMeter.',
        result: 'Thời gian phản hồi giảm từ 320ms xuống còn 48ms với 1000 người dùng đồng thời.',
        nextAction: 'Sinh viên hoàn thiện kiểm thử và nộp báo cáo nghiệm thu.',
        status: 'PENDING_CONFIRMATION',
        attachments: [],
        canEdit: !isStudent,
        canConfirm: isStudent,
        canReject: isStudent,
      },
    ],
    permissions: {
      canAddWorkLog: !isStudent,
      canEditWorkLog: !isStudent,
      canConfirmWorkLog: isStudent,
      isReadOnly: false,
      isStudent,
      isMentor: !isStudent,
      isDisputed: false,
      canRequestExtension: true,
      canRequestAmendment: true,
      canProposeSettlement: true,
      canSubmitCompletion: !isStudent,
      canConfirmCompletion: isStudent,
      canSubmitSettlementTicket: true,
      canCreateDisputeTicket: true,
      canSubmitDisputeEvidence: true,
    },
    activeExtension: {
      id: 501,
      createdByName: 'Phan Hieu',
      currentDeadline: new Date(Date.now() + 7 * 86400000).toISOString(),
      proposedDeadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      reason: 'Học viên vướng lịch thi bảo vệ đồ án giữa kỳ nên đề xuất dời hạn thêm 7 ngày để hoàn thiện kỹ thuật tốt nhất.',
      status: 'PENDING',
      canConfirm: !isStudent,
      canReject: !isStudent,
      canCancel: isStudent,
    },
    activeAmendment: {
      id: 601,
      createdByName: 'Nguyễn Hoàng Nam',
      newScope: 'Bổ sung hướng dẫn cài đặt giám sát hệ thống với Prometheus & Grafana dashboard.',
      additionalAmount: 500000,
      reason: 'Phục vụ yêu cầu mở rộng phục vụ báo cáo đồ án doanh nghiệp thực tế.',
      status: 'PENDING',
      canConfirm: isStudent,
      canReject: isStudent,
      canTopUp: isStudent,
      canCancel: !isStudent,
    },
    activeSettlementProposal: {
      id: 701,
      createdByName: 'Nguyễn Hoàng Nam',
      mentorAmount: 1750000,
      studentRefund: 750000,
      totalAmount: 2500000,
      reason: 'Phương án hòa giải: Khối lượng công việc đã hoàn thành 70%, hoàn 30% ngân sách cho sinh viên.',
      status: 'PENDING',
      canAccept: true,
      canReject: true,
      canCancel: true,
    },
    latestCompletion: {
      id: 801,
      submittedBy: {
        id: 2,
        fullName: 'Nguyễn Hoàng Nam',
        email: 'nam.nguyen@vng.com.vn',
        role: 'ALUMNI',
      },
      finalSummary: 'Đã hoàn tất toàn bộ 5 buổi cố vấn theo cam kết, mã nguồn và tài liệu đã được chuyển giao đầy đủ.',
      deliverables: 'Mã nguồn GitHub repo: https://github.com/alumnect/demo-project-spring-kafka kèm video demo.',
      attachmentUrls: [],
      status: 'PENDING',
    },
    activeTicket: {
      id: 901,
      ticketCode: 'TK-101',
      ticketType: 'DISPUTE',
      taskId: tid || 101,
      title: 'Hồ sơ Hòa giải & Hỗ trợ kỹ thuật Ban Quản Trị',
      disputeReason: 'Hai bên đã thống nhất tỷ lệ hoàn tất công việc, chuyển Ban Quản Trị xác nhận phân giải dòng tiền.',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    },
    history: [
      {
        id: 'h1',
        timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
        title: 'Kích hoạt nhiệm vụ',
        description: 'Học viên đã thanh toán ký quỹ 2.500.000 đ qua cổng PayOS an toàn.',
        actorName: 'Hệ thống PayOS Escrow',
      },
      {
        id: 'h2',
        timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
        title: 'Xác nhận Nhật ký #1',
        description: 'Học viên đã duyệt nghiệm thu buổi học đầu tiên.',
        actorName: 'Phan Hieu',
      },
    ],
  }
}

/** UC96–101, 104: trung tâm quản lý một task — nhật ký, gia hạn, điều chỉnh, nghiệm thu, hòa giải, tranh chấp. */
export default function TaskDetailScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const tid = Number(id)
  const [feedback, setFeedback] = useState<Record<number, string>>({})
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)

  const q = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-task', tid] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
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

  const topup = useMutation({
    mutationFn: (amendmentId: number) => taskApi.checkout(q.data!.deal.id, amendmentId),
    onSuccess: setCheckout,
    onError: (e) => toast.error(errMsg(e)),
  })

  const me = useAuthStore((s) => s.user)
  const d = q.data ?? buildDemoTaskDetail(tid, me?.role === 'STUDENT')
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
            label: 'Điều chỉnh Task',
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
    ...(p.isStudent && o.status === 'COMPLETED'
      ? [
          {
            key: 'review',
            label: 'Đánh giá Mentor',
            icon: <Star size={19} color={viridian} weight="fill" />,
            onPress: () => go('review'),
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
      <Header title="Không gian Nhiệm vụ" subtitle={`Task #${tid}`} />
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

          <Txt size={20} weight="800" style={{ color: colors.text, marginTop: 10, lineHeight: 27 }}>
            {o.taskTitle}
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
            {actions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                accessibilityRole="button"
                style={({ pressed }) => ({ width: '50%', padding: 4, opacity: pressed ? 0.78 : 1 })}
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
                  title="Đồng ý"
                  size="sm"
                  textColor="#FFFFFF"
                  style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                  onPress={() => run(() => taskApi.respondSettlement(d.activeSettlementProposal!.id, true), 'Đã chấp nhận hòa giải.')}
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
              <View style={{ marginTop: 10 }}>
                <Input
                  value={feedback[-1] ?? ''}
                  onChangeText={(v) => setFeedback({ ...feedback, [-1]: v })}
                  placeholder="Nhận xét nghiệm thu (tùy chọn)"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    title="Nghiệm thu hoàn tất"
                    size="sm"
                    textColor="#FFFFFF"
                    style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                    onPress={() => run(() => taskApi.respondCompletion(tid, d.latestCompletion!.id, true, feedback[-1]), 'Đã nghiệm thu task.')}
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
              Ticket tranh chấp #{d.activeTicket.ticketCode} · {d.activeTicket.status}
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

        {d.workLogs.map((w) => (
          <Card key={w.id} style={{ marginHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CalendarDays size={15} color={viridian} weight="bold" />
              <Txt weight="800" style={{ flex: 1, color: colors.text }}>
                {new Date(w.logDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </Txt>
              <Tag
                label={w.status === 'CONFIRMED' ? 'Đã xác nhận' : w.status === 'REJECTED' ? 'Cần làm rõ' : 'Chờ xác nhận'}
                tone={w.status === 'CONFIRMED' ? 'success' : w.status === 'REJECTED' ? 'danger' : 'warning'}
              />
            </View>
            <Txt style={{ marginTop: 8, lineHeight: 21, color: colors.text }}>{w.description}</Txt>
            <View style={{ marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: colors.surface, gap: 4 }}>
              <Txt size={13}>
                <Txt size={13} weight="700" style={{ color: viridian }}>Đã làm: </Txt>
                {w.workCompleted}
              </Txt>
              <Txt size={13}>
                <Txt size={13} weight="700" style={{ color: viridian }}>Kết quả: </Txt>
                {w.result}
              </Txt>
              {w.nextAction ? (
                <Txt size={13}>
                  <Txt size={13} weight="700" style={{ color: viridian }}>Tiếp theo: </Txt>
                  {w.nextAction}
                </Txt>
              ) : null}
            </View>
            {w.studentFeedback ? (
              <Txt size={13} color={viridian} weight="600" style={{ marginTop: 6 }}>
                {`Phản hồi: ${w.studentFeedback}`}
              </Txt>
            ) : null}
            {w.canConfirm || w.canReject ? (
              <View style={{ marginTop: 10 }}>
                <Input
                  value={feedback[w.id] ?? ''}
                  onChangeText={(v) => setFeedback({ ...feedback, [w.id]: v })}
                  placeholder="Nhập phản hồi (bắt buộc khi yêu cầu làm rõ)"
                />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {w.canConfirm ? (
                    <Button
                      title="Xác nhận tiến độ"
                      size="sm"
                      textColor="#FFFFFF"
                      style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
                      onPress={() => run(() => taskApi.confirmWorkLog(tid, w.id, feedback[w.id]), 'Đã xác nhận nhật ký.')}
                    />
                  ) : null}
                  {w.canReject ? (
                    <Button
                      title="Yêu cầu làm rõ"
                      size="sm"
                      variant="outline"
                      style={{ flex: 1 }}
                      onPress={() =>
                        feedback[w.id]?.trim()
                          ? run(() => taskApi.rejectWorkLog(tid, w.id, feedback[w.id]), 'Đã gửi yêu cầu làm rõ.')
                          : toast.error('Vui lòng nhập lý do cần làm rõ.')
                      }
                    />
                  ) : null}
                </View>
              </View>
            ) : null}
            {w.canEdit ? (
              <Button title="Chỉnh sửa nhật ký" size="sm" variant="ghost" onPress={() => go('worklog', { workLogId: String(w.id) })} />
            ) : null}
          </Card>
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
