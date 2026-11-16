import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Tag, Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { BrandIcon } from '@/components/BrandIcon'
import { Header } from '@/components/Header'
import { BottomBar, InfoRow, SectionCard } from '@/components/DetailBits'
import { statusTone } from '@/constants/status'
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  CreditCard,
  FilePen,
  Handshake,
  History,
  Laptop,
  Target,
} from '@/components/icons'
import { PaymentSheet } from '@/components/PaymentSheet'
import { DEAL_STATUS_LABEL, dealApi, taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_LABEL, formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { toast, errMsg } from '@/lib/toast'

/** Ô trạng thái xác nhận của từng bên (Kakao Contract Pill). */
function Confirm({ ok, who }: { ok: boolean; who: string }) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  return (
    <View
      style={[
        styles.confirmBox,
        {
          backgroundColor: ok ? (isDark ? '#142E1F' : '#EAFBF0') : (isDark ? '#24180E' : viridianSoft),
          borderColor: ok ? (isDark ? '#204D32' : '#BBF7D0') : (isDark ? '#4A2C16' : '#FAD9C2'),
        },
      ]}
    >
      {ok ? (
        <CheckCircle2 size={16} color={isDark ? '#4ADE80' : '#15803D'} weight="fill" />
      ) : (
        <Circle size={16} color={viridian} />
      )}
      <Txt
        size={12}
        weight="700"
        style={{ color: ok ? (isDark ? '#4ADE80' : '#15803D') : viridian, flexShrink: 1 }}
      >
        {`${who} ${ok ? 'đã ký nhận' : 'chờ xác nhận'}`}
      </Txt>
    </View>
  )
}

const DEMO_DEAL_DETAIL = (did: number) => ({
  deal: {
    id: did || 201,
    requestId: 101,
    requestTitle: 'Xây dựng Backend Microservices với Spring Boot & Apache Kafka',
    studentId: 1,
    mentorId: 2,
    taskScope: 'Thiết kế Event-Driven Architecture, cấu hình Topic Partitioning, tích hợp Redis Caching và CI/CD Docker Compose phục vụ dự án thực chiến.',
    expectedResult: 'Hệ thống vận hành trơn tru, đầy đủ tài liệu API Swagger, Unit test coverage > 80% và mã nguồn được chuyển giao trên GitHub.',
    agreedPrice: 2500000,
    deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
    workingMode: 'BOTH' as const,
    participationType: 'INDIVIDUAL' as const,
    taskType: 'TECHNICAL_CONSULTING',
    status: 'DEAL_CONFIRMED' as const,
    version: 1,
    isPaid: true,
    studentConfirmed: true,
    mentorConfirmed: true,
    studentName: 'Phan Hieu',
    mentorName: 'Nguyễn Hoàng Nam (VNG Tech Lead)',
    canConfirm: false,
    canReject: false,
    canRequestAdjustment: true,
    canPay: false,
    canEdit: false,
    taskId: 101,
    readOnlyReason: null,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  snapshots: [
    {
      id: 1,
      version: 1,
      modifiedByName: 'Nguyễn Hoàng Nam',
      changeNote: 'Khởi tạo thỏa thuận hợp tác cố vấn 1:1',
      agreedPrice: 2500000,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  ],
})

/** UC94–95: xem deal, xác nhận / chỉnh sửa / từ chối, thanh toán task qua PayOS. */
export default function DealScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [note, setNote] = useState('')
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)

  const q = useQuery({ queryKey: ['mentoring-deal', id], queryFn: () => dealApi.detail(Number(id)) })
  const deal = q.data?.deal ?? DEMO_DEAL_DETAIL(Number(id)).deal
  const snapshots = q.data?.snapshots ?? DEMO_DEAL_DETAIL(Number(id)).snapshots
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['mentoring-deal', id] })
    qc.invalidateQueries({ queryKey: ['mentoring-deals'] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
  }
  const run = (fn: () => Promise<unknown>, ok: string) => () =>
    fn()
      .then(() => {
        toast.success(ok)
        refresh()
      })
      .catch((e) => toast.error(errMsg(e)))

  const pay = useMutation({
    mutationFn: () => taskApi.checkout(Number(id)),
    onSuccess: setCheckout,
    onError: (e) => toast.error(errMsg(e)),
  })



  const goTask = async () => {
    try {
      const td = await taskApi.byDeal(deal.id)
      router.replace({ pathname: '/mentoring/tasks/[id]', params: { id: String(td.overview.id) } })
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  const hasNote = deal.canReject || deal.canRequestAdjustment

  return (
    <Screen keyboard bg={colors.bg}>
      <Header title={`Thỏa thuận hợp tác #${deal.id}`} subtitle={`Phiên bản thương lượng v${deal.version}`} />
      <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {/* Hero Contract Card */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BrandIcon name="check" size={18} />
              <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
                HỢP ĐỒNG CỐ VẤN 1:1
              </Txt>
            </View>
            <Tag label={DEAL_STATUS_LABEL[deal.status] ?? deal.status} tone={statusTone(deal.status)} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <BrandIcon name="coin" size={34} />
            <View>
              <Txt size={11} weight="700" style={{ color: colors.textTertiary, letterSpacing: 0.4 }}>
                TỔNG GIÁ TRỊ THỎA THUẬN
              </Txt>
              <Txt size={28} weight="800" style={{ color: viridian, fontVariant: ['tabular-nums'] }}>
                {formatVnd(deal.agreedPrice)}
              </Txt>
            </View>
          </View>
          <Txt size={13} weight="600" style={{ color: colors.textSecondary, marginTop: 8 }}>
            {`${deal.studentName}  ↔  ${deal.mentorName}`}
          </Txt>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
            <Confirm ok={deal.studentConfirmed} who="Sinh viên" />
            <Confirm ok={deal.mentorConfirmed} who="Mentor" />
          </View>

          {deal.isPaid ? <Tag label="Đã thanh toán đảm bảo (Escrow)" tone="success" style={{ marginTop: 10 }} /> : null}
        </View>

        {/* Scope & Expected Results */}
        <SectionCard title="Nội dung & Cam kết bàn giao" icon={<BrandIcon name="task" size={20} />}>
          <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
            PHẠM VI CÔNG VIỆC
          </Txt>
          <Txt size={14} style={{ color: colors.text, lineHeight: 22, marginTop: 4 }}>
            {deal.taskScope}
          </Txt>
          <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginVertical: 12 }} />
          <Txt size={11} weight="800" style={{ color: viridian, letterSpacing: 0.4 }}>
            KẾT QUẢ KỲ VỌNG ĐẦU RA
          </Txt>
          <Txt size={14} style={{ color: colors.text, lineHeight: 22, marginTop: 4 }}>
            {deal.expectedResult}
          </Txt>
        </SectionCard>

        {/* Contract Metadata */}
        <Card style={{ marginHorizontal: 16, marginBottom: 14, paddingVertical: 6 }}>
          <InfoRow icon={<BrandIcon name="calendar" size={18} />} label="Hạn chót hoàn thành" value={new Date(deal.deadline).toLocaleString('vi-VN')} />
          <InfoRow
            icon={<BrandIcon name="computer" size={18} />}
            label="Hình thức tham gia"
            value={`${WORKING_MODE_LABEL[deal.workingMode] ?? ''} · ${deal.participationType === 'GROUP' ? 'Nhóm học viên' : 'Cá nhân 1:1'}`}
          />
          <InfoRow icon={<BrandIcon name="suitcase" size={18} />} label="Loại nhiệm vụ" value={taskTypeLabel(deal.taskType)} last />
        </Card>

        {deal.readOnlyReason ? (
          <View
            style={[
              styles.noticeBox,
              {
                backgroundColor: isDark ? '#24180E' : viridianSoft,
                borderColor: isDark ? '#4A2C16' : '#FAD9C2',
              },
            ]}
          >
            <Txt size={13} weight="600" style={{ color: viridian }}>
              {deal.readOnlyReason}
            </Txt>
          </View>
        ) : null}

        {/* Version History */}
        {(snapshots?.length ?? 0) > 0 ? (
          <SectionCard title="Lịch sử thương lượng" icon={<History size={18} color={viridian} weight="bold" />}>
            {snapshots.map((sn, i, arr) => (
              <View key={sn.id} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ alignItems: 'center' }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginTop: 5,
                      backgroundColor: i === arr.length - 1 ? viridian : colors.border,
                    }}
                  />
                  {i < arr.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: colors.borderSubtle }} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: 12 }}>
                  <Txt size={13} weight="800" style={{ color: colors.text }}>
                    {`Phiên bản v${sn.version} · ${formatVnd(sn.agreedPrice)}`}
                  </Txt>
                  <Txt muted size={12}>
                    {[sn.modifiedByName, sn.changeNote].filter(Boolean).join(' · ')}
                  </Txt>
                </View>
              </View>
            ))}
          </SectionCard>
        ) : null}

        {/* Request Adjustment / Reject Box */}
        {hasNote ? (
          <Card style={{ marginHorizontal: 16, marginBottom: 14 }}>
            <Input
              label="Ghi chú / lý do (khi yêu cầu điều chỉnh hoặc từ chối)"
              value={note}
              onChangeText={setNote}
              multiline
              placeholder="Nhập nội dung cần thương lượng lại..."
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {deal.canRequestAdjustment ? (
                <Button
                  title="Yêu cầu điều chỉnh"
                  size="sm"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={run(() => dealApi.requestAdjustment(deal.id, note || undefined, deal.version), 'Đã gửi yêu cầu điều chỉnh.')}
                />
              ) : null}
              {deal.canReject ? (
                <Button
                  title="Từ chối thỏa thuận"
                  size="sm"
                  variant="ghost"
                  textColor="#DC2626"
                  style={{ flex: 1 }}
                  onPress={run(() => dealApi.reject(deal.id, note || undefined, deal.version), 'Đã từ chối deal.')}
                />
              ) : null}
            </View>
          </Card>
        ) : null}

        {deal.canEdit ? (
          <Button
            title="Chỉnh sửa điều khoản hợp đồng"
            variant="secondary"
            icon={<FilePen size={16} color={viridian} weight="bold" />}
            style={{ marginHorizontal: 16 }}
            onPress={() => router.push({ pathname: '/mentoring/deal/form', params: { dealId: String(deal.id) } })}
          />
        ) : null}
      </ScrollView>

      {deal.canConfirm || deal.canPay || deal.isPaid || deal.taskId ? (
        <BottomBar>
          {deal.isPaid || deal.taskId ? (
            <Button
              title="Mở nhiệm vụ (Task)"
              variant={deal.canPay || deal.canConfirm ? 'outline' : 'primary'}
              onPress={goTask}
              style={{ flex: 1 }}
            />
          ) : null}
          {deal.canConfirm ? (
            <Button
              title="Xác nhận thỏa thuận"
              textColor="#FFFFFF"
              icon={<CheckCircle2 size={16} color="#FFFFFF" weight="fill" />}
              onPress={run(() => dealApi.confirm(deal.id, deal.version), 'Đã xác nhận deal.')}
              style={{ flex: 1.4, backgroundColor: viridian, borderColor: viridian }}
            />
          ) : null}
          {deal.canPay ? (
            <Button
              title={`Thanh toán ${formatVnd(deal.agreedPrice)}`}
              textColor="#FFFFFF"
              icon={<CreditCard size={16} color="#FFFFFF" weight="fill" />}
              onPress={() => pay.mutate()}
              loading={pay.isPending}
              style={{ flex: 1.6, backgroundColor: viridian, borderColor: viridian }}
            />
          ) : null}
        </BottomBar>
      ) : null}

      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => {
          setCheckout(null)
          refresh()
          toast.success('Thanh toán thành công! Task của bạn đã được kích hoạt.')
          void goTask()
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
  confirmBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeBox: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
})
