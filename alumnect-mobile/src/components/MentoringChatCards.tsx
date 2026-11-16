import React, { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownLeft, CalendarClock, Check, ChevronDown, ChevronRight, History, Clock, CreditCard, FileCheck2, FilePen, RotateCcw, Scale, X } from '@/components/icons'
import { ActionSheet } from './ActionSheet'
import { SheetModal } from './SheetModal'
import { ScrollView } from '@/components/ScrollView'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Avatar, Button, Input, Txt } from './ui'
import { useTheme } from '@/theme'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import type { DealSnapshot } from '@/api/chat'
import type { Deal } from '@/api/mentoringFlow'
import { taskTypeLabel } from '@/api/mentoringFlow'
import { WORKING_MODE_DETAIL_LABEL, formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TaskCheckout } from '@/api/mentoringTask'
import { PaymentSheet } from './PaymentSheet'
import { toast, errMsg } from '@/lib/toast'

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')
const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

/** Nút nhỏ dùng trong thẻ (cao 34px) — gọn hơn Button sm. */
function CardBtn({ label, onPress, tone = 'ghost', icon, loading, disabled }: {
  label: string
  onPress?: () => void
  tone?: 'primary' | 'ghost' | 'danger'
  icon?: React.ReactNode
  loading?: boolean
  disabled?: boolean
}) {
  const t = useTheme()
  const { viridian } = useMentoringTheme()
  const bg = tone === 'primary' ? viridian : t.card
  const fg = tone === 'primary' ? '#FFFFFF' : tone === 'danger' ? '#DC2626' : t.text
  const border = tone === 'primary' ? viridian : tone === 'danger' ? '#FCA5A5' : t.border
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        minHeight: 34,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: border,
        backgroundColor: bg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        opacity: disabled || loading ? 0.55 : pressed ? 0.8 : 1,
      })}
    >
      {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, { color: fg, size: 14 }) : null}
      <Txt size={12} weight="700" style={{ color: fg }}>
        {loading ? 'Đang xử lý...' : label}
      </Txt>
    </Pressable>
  )
}

function Fact({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const t = useTheme()
  return (
    <View style={{ width: '50%', paddingVertical: 8, paddingHorizontal: 10 }}>
      <Txt size={11} style={{ color: t.textMuted }}>
        {label}
      </Txt>
      <Txt size={strong ? 15 : 13} weight={strong ? '800' : '600'} style={{ marginTop: 1 }}>
        {value}
      </Txt>
    </View>
  )
}

/** Sheet nhập lý do (tùy chọn) trước khi từ chối / yêu cầu điều chỉnh / hủy đề xuất. */
export function ReasonSheet({ visible, title, message, confirmLabel, allowNote = true, loading, onConfirm, onClose }: {
  visible: boolean
  title: string
  message: string
  confirmLabel: string
  allowNote?: boolean
  loading?: boolean
  onConfirm: (note?: string) => void
  onClose: () => void
}) {
  const [note, setNote] = useState('')
  const close = () => {
    if (loading) return
    setNote('')
    onClose()
  }
  return (
    <ActionSheet visible={visible} title={title} onClose={close}>
      <Txt muted style={{ marginBottom: 12 }}>
        {message}
      </Txt>
      {allowNote ? <Input value={note} onChangeText={setNote} placeholder="Lý do (không bắt buộc)" multiline /> : null}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
        <Button title="Quay lại" variant="outline" disabled={loading} onPress={close} style={{ flex: 1 }} />
        <Button
          title={confirmLabel}
          variant="danger"
          loading={loading}
          onPress={() => {
            onConfirm(note.trim() || undefined)
            setNote('')
          }}
          style={{ flex: 1 }}
        />
      </View>
    </ActionSheet>
  )
}

export type DealCardStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'ADJUSTMENT' | 'SUPERSEDED'

export function dealCardStatus(snapshot: DealSnapshot, deal?: Deal | null): DealCardStatus {
  if (deal && snapshot.version < deal.version) return 'SUPERSEDED'
  if (deal?.status === 'DEAL_CONFIRMED') return 'CONFIRMED'
  if (deal?.status === 'REJECTED' || deal?.status === 'CANCELLED') return 'REJECTED'
  if (deal?.status === 'SUPERSEDED') return 'ADJUSTMENT'
  return 'PENDING'
}

/**
 * Thẻ Deal Ticket hiển thị ngay trong đoạn chat (giống web): điều khoản chính + nút phản hồi cho học viên.
 */
export function DealTicketCard({ snapshot, deal, mine, isStudent, isMentor, canReissue, busy, onConfirm, onReject, onAdjust, onPay, onReissue, onViewDetail }: {
  snapshot: DealSnapshot
  deal?: Deal | null
  mine: boolean
  isStudent: boolean
  isMentor: boolean
  canReissue?: boolean
  busy?: 'confirm' | 'reject' | 'adjust' | 'pay' | null
  onConfirm?: () => void
  onReject?: () => void
  onAdjust?: () => void
  onPay?: () => void
  onReissue?: () => void
  onViewDetail?: () => void
}) {
  const t = useTheme()
  const { viridian, viridianSoft } = useMentoringTheme()
  const status = dealCardStatus(snapshot, deal)
  const isLatest = !!deal && snapshot.version === deal.version
  const needsMyAnswer = isLatest && status === 'PENDING' && isStudent && !!deal?.canConfirm

  const badge = {
    CONFIRMED: { label: deal?.isPaid ? 'Đã thanh toán' : 'Đã xác nhận', bg: '#DCFCE7', fg: '#15803D' },
    REJECTED: { label: 'Đã từ chối', bg: '#FEE2E2', fg: '#B91C1C' },
    ADJUSTMENT: { label: 'Yêu cầu điều chỉnh', bg: '#FEF3C7', fg: '#B45309' },
    SUPERSEDED: { label: 'Đã thay thế', bg: t.surface, fg: t.textMuted },
    PENDING: { label: 'Chờ xác nhận', bg: '#FEF3C7', fg: '#B45309' },
  }[status]

  let actions: React.ReactNode = null
  if (needsMyAnswer) {
    actions = (
      <>
        {deal?.canReject ? <CardBtn label="Từ chối" tone="danger" onPress={onReject} loading={busy === 'reject'} disabled={!!busy} /> : null}
        {deal?.canRequestAdjustment ? <CardBtn label="Điều chỉnh" icon={<RotateCcw />} onPress={onAdjust} loading={busy === 'adjust'} disabled={!!busy} /> : null}
        <CardBtn label="Xác nhận & thanh toán" tone="primary" icon={<Check />} onPress={onConfirm} loading={busy === 'confirm'} disabled={!!busy} />
      </>
    )
  } else if (isLatest && status === 'PENDING') {
    actions = (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Clock size={13} color={t.textMuted} />
        <Txt size={12} style={{ color: t.textMuted }}>
          {isMentor ? 'Chờ học viên phản hồi' : 'Chờ phản hồi'}
        </Txt>
      </View>
    )
  } else if (isLatest && status === 'CONFIRMED' && !deal?.isPaid) {
    actions = deal?.canPay ? (
      <CardBtn label={`Thanh toán ${formatVnd(deal.agreedPrice)}`} tone="primary" icon={<CreditCard />} onPress={onPay} loading={busy === 'pay'} disabled={!!busy} />
    ) : (
      <Txt size={12} style={{ color: t.textMuted }}>
        Đã chốt · Chờ thanh toán
      </Txt>
    )
  } else if (isLatest && (status === 'REJECTED' || status === 'ADJUSTMENT')) {
    actions = isMentor && canReissue ? (
      <CardBtn label="Deal lại" icon={<RotateCcw />} onPress={onReissue} />
    ) : status === 'ADJUSTMENT' ? (
      <Txt size={12} style={{ color: t.textMuted }}>
        Chờ Mentor gửi phiên bản mới
      </Txt>
    ) : null
  }

  const time = new Date(snapshot.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginVertical: 6 }}>
      <View
        style={{
          width: '92%',
          maxWidth: 420,
          borderRadius: 16,
          borderWidth: needsMyAnswer ? 1.5 : 1,
          borderColor: needsMyAnswer ? viridian : t.border,
          backgroundColor: t.card,
          overflow: 'hidden',
          opacity: status === 'SUPERSEDED' ? 0.7 : 1,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 12, paddingTop: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt size={11} style={{ color: t.textMuted }}>
              {`${snapshot.modifiedByName || 'Mentor'} · ${time}`}
            </Txt>
            <Txt size={14} weight="800" style={{ marginTop: 1 }}>
              {`Deal Ticket `}
              <Txt size={13} weight="500" style={{ color: t.textMuted }}>{`· Phiên bản ${snapshot.version}`}</Txt>
            </Txt>
          </View>
          <View style={{ backgroundColor: badge.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Txt size={11} weight="700" style={{ color: badge.fg }}>
              {badge.label}
            </Txt>
          </View>
        </View>

        {status !== 'SUPERSEDED' ? (
          <>
            {snapshot.taskScope ? (
              <Txt size={13} numberOfLines={3} style={{ paddingHorizontal: 12, marginTop: 6, lineHeight: 19 }}>
                {snapshot.taskScope}
              </Txt>
            ) : null}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 12, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.isDark ? '#1A1A1A' : '#FAFAFB' }}>
              <Fact label="Giá thỏa thuận" value={formatVnd(snapshot.agreedPrice)} strong />
              <Fact label="Thời hạn" value={fmtDate(snapshot.deadline)} />
              <Fact
                label="Hình thức"
                value={`${WORKING_MODE_DETAIL_LABEL[snapshot.workingMode] ?? snapshot.workingMode} · ${snapshot.participationType === 'GROUP' ? 'Nhóm' : 'Cá nhân 1:1'}`}
              />
              <Fact label="Loại hỗ trợ" value={taskTypeLabel(snapshot.taskType)} />
            </View>
            {snapshot.expectedResult ? (
              <Txt size={12} numberOfLines={2} style={{ paddingHorizontal: 12, marginTop: 8, color: t.textMuted, lineHeight: 17 }}>
                <Txt size={12} weight="700" style={{ color: t.text }}>
                  Kết quả:{' '}
                </Txt>
                {snapshot.expectedResult}
              </Txt>
            ) : null}
          </>
        ) : (
          <Txt size={12} style={{ paddingHorizontal: 12, marginTop: 4, color: t.textMuted }}>
            {`${formatVnd(snapshot.agreedPrice)} · hạn ${fmtDate(snapshot.deadline)}`}
          </Txt>
        )}

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 10,
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderTopWidth: 1,
            borderTopColor: t.border,
            backgroundColor: needsMyAnswer ? viridianSoft : 'transparent',
          }}
        >
          <Pressable onPress={onViewDetail} accessibilityRole="button" accessibilityLabel="Xem chi tiết thỏa thuận" hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Txt size={12} weight="700" style={{ color: t.textMuted }}>
              Xem chi tiết
            </Txt>
            <ChevronRight size={14} color={t.textMuted} />
          </Pressable>
          {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, flexShrink: 1 }}>{actions}</View> : null}
        </View>
      </View>
    </View>
  )
}

type ProposalKind = 'EXTENSION' | 'AMENDMENT' | 'SETTLEMENT'
const KIND_LABEL: Record<ProposalKind, string> = { EXTENSION: 'gia hạn', AMENDMENT: 'điều chỉnh', SETTLEMENT: 'dừng Task' }

function ActionCard({ tone, icon, title, badge, children, actions }: {
  tone: string
  icon: React.ReactNode
  title: string
  badge?: string
  children?: React.ReactNode
  actions?: React.ReactNode
}) {
  const t = useTheme()
  return (
    <View style={{ flexDirection: 'row', borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, overflow: 'hidden' }}>
      <View style={{ width: 3, backgroundColor: tone }} />
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 9, gap: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, { color: tone, size: 15 }) : icon}
          <Txt size={12.5} weight="800" style={{ flex: 1 }} numberOfLines={2}>
            {title}
          </Txt>
        </View>
        {badge ? (
          <View style={{ alignSelf: 'flex-start', backgroundColor: `${tone}14`, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, marginTop: -1 }}>
            <Txt size={10.5} weight="700" style={{ color: tone }}>
              {badge}
            </Txt>
          </View>
        ) : null}
        {children}
        {actions ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 1 }}>{actions}</View> : null}
      </View>
    </View>
  )
}

type PanelItem = { key: string; mine: boolean; title: string; tone: string; node: React.ReactNode }

/**
 * Khung "Cần xử lý" trong chat Task (giống web): gia hạn deadline, điều chỉnh Task, dừng Task, nghiệm thu, Ticket.
 * Đồng ý / từ chối / hủy đề xuất ngay trong chat; các bước phức tạp (thanh toán bổ sung, nghiệm thu) mở trang Task.
 */
export function TaskActionPanel({ taskId, compact, onChanged }: { taskId: number; compact?: boolean; onChanged?: () => void }) {
  const t = useTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { viridian } = useMentoringTheme()
  const q = useQuery({ queryKey: ['mentoring-task', taskId], queryFn: () => taskApi.detail(taskId), refetchInterval: 15_000 })
  const [busy, setBusy] = useState<string | null>(null)
  const [dialog, setDialog] = useState<{ action: 'REJECT' | 'CANCEL' | 'DECLINE_TOPUP'; kind: ProposalKind; id: number } | null>(null)
  const [checkout, setCheckout] = useState<TaskCheckout | null>(null)
  /** null = tự động: mở khi có việc cần bạn xử lý, gọn khi chỉ đang chờ bên kia. */
  const [collapsedPref, setCollapsedPref] = useState<boolean | null>(null)

  const d = q.data
  if (!d) return null
  const finished = ['COMPLETED', 'CANCELLED', 'RESOLVED'].includes(d.overview.status)
  if (finished) return null

  const refresh = () => {
    void q.refetch()
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    onChanged?.()
  }
  const run = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key)
    try {
      await fn()
      toast.success(ok)
      refresh()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(null)
    }
  }
  const openTask = () => router.push({ pathname: '/mentoring/tasks/[id]', params: { id: String(taskId) } })
  /** Thanh toán bổ sung ngay trong chat: tạo đơn rồi mở mã QR (không chuyển sang trang Task). */
  const startTopUp = async (amendmentId: number) => {
    setBusy('topup')
    try {
      setCheckout(await taskApi.checkout(d.deal.id, amendmentId))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  const items: PanelItem[] = []

  const completionPending = d.overview.status === 'SUBMITTED' || d.latestCompletion?.status === 'PENDING'
  if (completionPending) {
    const canReview = !!d.permissions.canConfirmCompletion
    items.push({ key: 'completion', mine: canReview, title: 'Nghiệm thu kết quả', tone: '#16A34A', node:
      <ActionCard key="completion" tone="#16A34A" icon={<FileCheck2 />} title="Mentor đã nộp kết quả hoàn thành" badge={canReview ? 'Chờ bạn nghiệm thu' : 'Chờ học viên nghiệm thu'}
        actions={canReview ? <CardBtn label="Xem & nghiệm thu" tone="primary" icon={<Check />} onPress={openTask} /> : undefined}
      >
        {d.latestCompletion?.finalSummary ? <Txt size={12} numberOfLines={2} style={{ color: t.textMuted }}>{d.latestCompletion.finalSummary}</Txt> : null}
      </ActionCard> })
  }

  const ext = d.activeExtension
  if (ext?.status === 'PENDING') {
    items.push({ key: 'ext', mine: !!(ext.canConfirm || ext.canReject), title: 'Gia hạn deadline', tone: '#1D4ED8', node:
      <ActionCard key="ext" tone="#1D4ED8" icon={<CalendarClock />} title="Đề xuất gia hạn deadline" badge={`Từ ${ext.createdByName}`}
        actions={
          ext.canConfirm || ext.canReject ? (
            <>
              {ext.canReject ? <CardBtn label="Từ chối" tone="danger" icon={<X />} disabled={!!busy} onPress={() => setDialog({ action: 'REJECT', kind: 'EXTENSION', id: ext.id })} /> : null}
              {ext.canConfirm ? <CardBtn label="Đồng ý" tone="primary" icon={<Check />} loading={busy === 'ext-ok'} disabled={!!busy} onPress={() => run('ext-ok', () => taskApi.respondExtension(ext.id, true), 'Đã đồng ý gia hạn deadline.')} /> : null}
            </>
          ) : (
            <>
              <Txt size={12} style={{ color: t.textMuted }}>Chờ bên kia phản hồi</Txt>
              {ext.canCancel ? <CardBtn label="Hủy đề xuất" disabled={!!busy} onPress={() => setDialog({ action: 'CANCEL', kind: 'EXTENSION', id: ext.id })} /> : null}
            </>
          )
        }
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          <Txt size={12} style={{ color: t.textMuted }}>{fmtDateTime(ext.currentDeadline)}</Txt>
          <Txt size={12} style={{ color: t.textMuted }}>→</Txt>
          <Txt size={12} weight="800" style={{ color: '#1D4ED8' }}>{fmtDateTime(ext.proposedDeadline)}</Txt>
        </View>
        {ext.reason ? <Txt size={12} numberOfLines={2} style={{ color: t.textMuted }}>{`“${ext.reason}”`}</Txt> : null}
      </ActionCard> })
  }

  const amd = d.activeAmendment
  if (amd && (amd.status === 'PENDING' || amd.status === 'AWAITING_TOPUP')) {
    const awaitingTopUp = amd.status === 'AWAITING_TOPUP'
    let actions: React.ReactNode
    if (awaitingTopUp && amd.canTopUp) {
      actions = (
        <>
          {amd.canDeclineTopUp ? <CardBtn label="Không nạp thêm" tone="danger" disabled={!!busy} onPress={() => setDialog({ action: 'DECLINE_TOPUP', kind: 'AMENDMENT', id: amd.id })} /> : null}
          <CardBtn
            label={`Thanh toán ${formatVnd(amd.additionalAmount)}`}
            tone="primary"
            icon={<CreditCard />}
            loading={busy === 'topup'}
            disabled={!!busy}
            onPress={() => void startTopUp(amd.id)}
          />
        </>
      )
    } else if (!awaitingTopUp && (amd.canConfirm || amd.canReject)) {
      actions = (
        <>
          {amd.canReject ? <CardBtn label="Từ chối" tone="danger" icon={<X />} disabled={!!busy} onPress={() => setDialog({ action: 'REJECT', kind: 'AMENDMENT', id: amd.id })} /> : null}
          {amd.canConfirm ? <CardBtn label="Đồng ý" tone="primary" icon={<Check />} loading={busy === 'amd-ok'} disabled={!!busy} onPress={() => run('amd-ok', () => taskApi.respondAmendment(amd.id, true), 'Đã đồng ý điều chỉnh Task.')} /> : null}
        </>
      )
    } else {
      actions = (
        <>
          <Txt size={12} style={{ color: t.textMuted }}>{awaitingTopUp ? 'Chờ học viên thanh toán' : 'Chờ bên kia phản hồi'}</Txt>
          {amd.canCancel ? <CardBtn label="Hủy đề xuất" disabled={!!busy} onPress={() => setDialog({ action: 'CANCEL', kind: 'AMENDMENT', id: amd.id })} /> : null}
        </>
      )
    }
    items.push({ key: 'amd', mine: !!((awaitingTopUp && amd.canTopUp) || (!awaitingTopUp && (amd.canConfirm || amd.canReject))), title: 'Điều chỉnh Task', tone: '#B45309', node:
      <ActionCard key="amd" tone="#B45309" icon={<FilePen />} title="Đề xuất điều chỉnh Task" badge={awaitingTopUp ? 'Đã đồng ý · Chờ thanh toán bổ sung' : `Từ ${amd.createdByName}`} actions={actions}>
        {amd.additionalAmount > 0 || amd.newDeadline ? (
          <Txt size={12} style={{ color: t.textMuted }}>
            {[amd.additionalAmount > 0 ? `Thêm: ${formatVnd(amd.additionalAmount)}` : null, amd.newDeadline ? `Hạn mới: ${fmtDateTime(amd.newDeadline)}` : null].filter(Boolean).join(' · ')}
          </Txt>
        ) : null}
        {amd.newScope ? <Txt size={12} numberOfLines={2}>{`Phạm vi mới: ${amd.newScope}`}</Txt> : null}
        {amd.reason ? <Txt size={12} numberOfLines={2} style={{ color: t.textMuted }}>{`“${amd.reason}”`}</Txt> : null}
      </ActionCard> })
  }

  const prop = d.activeSettlementProposal
  if (prop?.status === 'PENDING') {
    items.push({ key: 'settle', mine: !!(prop.canAccept || prop.canReject), title: 'Dừng Task & chia tiền', tone: '#DC2626', node:
      <ActionCard key="settle" tone="#DC2626" icon={<Scale />} title="Đề xuất dừng Task & chia tiền" badge={`Từ ${prop.createdByName}`}
        actions={
          prop.canAccept || prop.canReject ? (
            <>
              {prop.canReject ? <CardBtn label="Từ chối" tone="danger" icon={<X />} disabled={!!busy} onPress={() => setDialog({ action: 'REJECT', kind: 'SETTLEMENT', id: prop.id })} /> : null}
              {prop.canAccept ? <CardBtn label="Đồng ý & Chi tiền" tone="primary" icon={<Check />} loading={busy === 'set-ok'} disabled={!!busy} onPress={() => run('set-ok', () => taskApi.respondSettlement(prop.id, true), 'Đã đồng ý dừng Task. Hệ thống đang tự động chi trả & hoàn tiền.')} /> : null}
            </>
          ) : (
            <>
              <Txt size={12} style={{ color: t.textMuted }}>Chờ bên kia phản hồi</Txt>
              {prop.canCancel ? <CardBtn label="Hủy đề xuất" disabled={!!busy} onPress={() => setDialog({ action: 'CANCEL', kind: 'SETTLEMENT', id: prop.id })} /> : null}
            </>
          )
        }
      >
        <Txt size={12} style={{ color: t.textMuted }}>
          {`Mentor nhận: `}
          <Txt size={12} weight="800">{formatVnd(prop.mentorAmount)}</Txt>
          {`  ·  Hoàn học viên: `}
          <Txt size={12} weight="800">{formatVnd(prop.studentRefund)}</Txt>
        </Txt>
        {prop.reason ? <Txt size={12} numberOfLines={2} style={{ color: t.textMuted }}>{`“${prop.reason}”`}</Txt> : null}
      </ActionCard> })
  }

  if (d.activeTicket) {
    const tk = d.activeTicket
    const isDispute = tk.ticketType === 'DISPUTE'
    items.push({ key: 'ticket', mine: false, title: isDispute ? `Khiếu nại ${tk.ticketCode}` : `Ticket ${tk.ticketCode}`, tone: isDispute ? '#DC2626' : '#1D4ED8', node:
      <ActionCard key="ticket" tone={isDispute ? '#DC2626' : '#1D4ED8'} icon={isDispute ? <Scale /> : <ArrowDownLeft />}
        title={`${isDispute ? 'Khiếu nại' : 'Thỏa thuận dừng Task'} ${tk.ticketCode}`}
        badge={tk.status === 'OPEN' ? 'Chờ tiếp nhận' : tk.status === 'IN_REVIEW' ? 'Đang xem xét' : 'Đã giải quyết'}
        actions={<CardBtn label="Xem Ticket" onPress={() => router.push({ pathname: '/mentoring/dispute/[ticketId]/chat', params: { ticketId: String(tk.id), taskId: String(taskId) } })} />}
      >
        <Txt size={12} style={{ color: t.textMuted }}>Ban Quản Trị đang xử lý Ticket này.</Txt>
      </ActionCard> })
  }

  if (!items.length) return null
  items.sort((a, b) => Number(b.mine) - Number(a.mine))
  const mineCount = items.filter((i) => i.mine).length
  // Khi bàn phím mở (compact) mặc định thu gọn để chừa chỗ chat, nhưng vẫn mở được khi chạm vào thanh.
  const collapsed = collapsedPref ?? (compact || mineCount === 0)
  const headTone = mineCount ? viridian : t.textMuted
  const headline = mineCount ? `${mineCount} việc cần bạn xử lý` : `Đang chờ phản hồi (${items.length})`
  const subline = items.map((i) => i.title).join(' · ')

  const dialogTitle = !dialog
    ? ''
    : dialog.action === 'REJECT'
      ? `Từ chối đề xuất ${KIND_LABEL[dialog.kind]}?`
      : dialog.action === 'DECLINE_TOPUP'
        ? 'Không thanh toán bổ sung?'
        : `Hủy đề xuất ${KIND_LABEL[dialog.kind]}?`
  const dialogMsg = !dialog
    ? ''
    : dialog.action === 'REJECT'
      ? 'Bên đề xuất sẽ nhận được thông báo kèm lý do của bạn.'
      : dialog.action === 'DECLINE_TOPUP'
        ? 'Đề xuất điều chỉnh sẽ bị hủy và Task giữ nguyên điều khoản cũ.'
        : 'Đề xuất sẽ bị thu hồi, bên kia không thể phản hồi nữa.'
  // API hủy gia hạn / hủy dừng Task không nhận lý do
  const allowNote = !!dialog && (dialog.action !== 'CANCEL' || dialog.kind === 'AMENDMENT')

  const submitDialog = async (note?: string) => {
    if (!dialog) return
    const { action, kind, id } = dialog
    if (action === 'REJECT') {
      await run(
        'dialog',
        () => (kind === 'EXTENSION' ? taskApi.respondExtension(id, false, note) : kind === 'AMENDMENT' ? taskApi.respondAmendment(id, false, note) : taskApi.respondSettlement(id, false, note)),
        `Đã từ chối đề xuất ${KIND_LABEL[kind]}.`,
      )
    } else {
      await run(
        'dialog',
        () => (kind === 'EXTENSION' ? taskApi.cancelExtension(id) : kind === 'AMENDMENT' ? taskApi.cancelAmendment(id, note) : taskApi.cancelSettlement(id)),
        action === 'DECLINE_TOPUP' ? 'Đã từ chối thanh toán bổ sung.' : `Đã hủy đề xuất ${KIND_LABEL[kind]}.`,
      )
    }
    setDialog(null)
  }

  return (
    <View style={{ marginTop: 6, gap: 6 }}>
      <Pressable
        onPress={() => setCollapsedPref(!collapsed)}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
        accessibilityLabel={`${headline}. ${collapsed ? 'Chạm để mở' : 'Chạm để thu gọn'}`}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 10,
          paddingVertical: 7,
          borderRadius: 12,
          backgroundColor: mineCount ? `${viridian}12` : t.isDark ? '#1F1F1F' : '#F4F5F7',
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <View style={{ flexDirection: 'row' }}>
          {items.slice(0, 3).map((i, idx) => (
            <View key={i.key} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i.tone, marginLeft: idx ? -2 : 0, borderWidth: 1, borderColor: t.card }} />
          ))}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={12} weight="800" style={{ color: headTone }} numberOfLines={1}>
            {headline}
            {collapsed ? <Txt size={11.5} weight="500" style={{ color: t.textMuted }}>{`  ·  ${subline}`}</Txt> : null}
          </Txt>
        </View>
        <ChevronDown size={16} color={t.textMuted} style={{ transform: [{ rotate: collapsed ? '0deg' : '180deg' }] }} />
      </Pressable>
      {!collapsed ? (
        <ScrollView style={{ maxHeight: compact ? 190 : 340 }} contentContainerStyle={{ gap: 6 }} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {items.map((i) => <React.Fragment key={i.key}>{i.node}</React.Fragment>)}
        </ScrollView>
      ) : null}
      <ReasonSheet
        visible={!!dialog}
        title={dialogTitle}
        message={dialogMsg}
        confirmLabel="Xác nhận"
        allowNote={allowNote}
        loading={busy === 'dialog'}
        onConfirm={(note) => void submitDialog(note)}
        onClose={() => setDialog(null)}
      />
      <PaymentSheet
        checkout={checkout}
        poll={taskApi.paymentStatus}
        onPaid={() => {
          setCheckout(null)
          toast.success('Đã thanh toán bổ sung thành công.')
          refresh()
        }}
        onClose={() => setCheckout(null)}
        onCancel={async () => {
          if (checkout) await taskApi.cancelPayment(checkout.orderCode).catch(() => {})
          setCheckout(null)
        }}
      />
    </View>
  )
}

/** Dòng thời gian các phiên bản Deal (giống MentoringDealHistoryTimeline trên web). */
export function DealHistorySheet({ visible, onClose, dealId, snapshots, currentVersion, statusLabel, onOpenDeal }: {
  visible: boolean
  onClose: () => void
  dealId: number
  snapshots: DealSnapshot[]
  currentVersion: number
  statusLabel?: string
  onOpenDeal?: () => void
}) {
  const t = useTheme()
  const insets = useSafeAreaInsets()
  const { viridian, viridianSoft } = useMentoringTheme()
  const sorted = [...snapshots].sort((a, b) => b.version - a.version)
  return (
    <SheetModal visible={visible} onClose={onClose} maxHeight={0.85}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: t.divider }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' }}>
          <History size={17} color="#1D4ED8" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={16} weight="800">{`Lịch sử điều chỉnh (${snapshots.length} phiên bản)`}</Txt>
          <Txt size={12} style={{ color: t.textMuted }} numberOfLines={1}>
            {`Thỏa thuận #${dealId} · Hiện tại v${currentVersion}${statusLabel ? ` · ${statusLabel}` : ''}`}
          </Txt>
        </View>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Đóng" style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' }}>
          <X size={18} color={t.textMuted} />
        </Pressable>
      </View>
      <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: Math.max(16, insets.bottom + 12) }}>
        {sorted.length === 0 ? (
          <Txt style={{ color: t.textMuted, textAlign: 'center', padding: 24 }}>Chưa có lịch sử phiên bản nào được ghi nhận.</Txt>
        ) : (
          sorted.map((sn, i) => {
            const isLatest = sn.version === currentVersion
            return (
              <View key={sn.id} style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ alignItems: 'center', width: 20 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, marginTop: 10, backgroundColor: isLatest ? viridian : t.surface, borderWidth: isLatest ? 0 : 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isLatest ? '#FFFFFF' : t.textMuted }} />
                  </View>
                  {i < sorted.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: t.border }} /> : null}
                </View>
                <View style={{ flex: 1, marginBottom: 12, borderRadius: 14, borderWidth: 1, borderColor: isLatest ? viridian : t.border, backgroundColor: isLatest ? (t.isDark ? '#2E1C10' : viridianSoft) : t.card, padding: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: t.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Txt size={13} weight="800">{`Phiên bản v${sn.version}`}</Txt>
                      {isLatest ? (
                        <View style={{ backgroundColor: viridian, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1 }}>
                          <Txt size={10.5} weight="800" style={{ color: '#FFFFFF' }}>Hiện tại</Txt>
                        </View>
                      ) : null}
                    </View>
                    <Txt size={11.5} style={{ color: t.textMuted }}>{fmtDateTime(sn.createdAt)}</Txt>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
                      <Avatar uri={sn.modifiedByAvatar} name={sn.modifiedByName || 'Thành viên'} size={22} />
                      <Txt size={12.5} weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{sn.modifiedByName || 'Thành viên'}</Txt>
                    </View>
                    <Txt size={13} weight="800" style={{ color: '#15803D' }}>{formatVnd(sn.agreedPrice)}</Txt>
                  </View>
                  {sn.changeNote ? (
                    <Txt size={12} style={{ marginTop: 8, padding: 8, borderRadius: 10, backgroundColor: t.surface, fontStyle: 'italic', color: t.textMuted }}>{`“${sn.changeNote}”`}</Txt>
                  ) : null}
                  <Txt size={12} numberOfLines={2} style={{ marginTop: 8, color: t.textMuted }}>
                    <Txt size={12} weight="700">Phạm vi: </Txt>
                    {sn.taskScope}
                  </Txt>
                  <Txt size={12} style={{ marginTop: 4, color: t.textMuted }}>
                    {`Hạn: ${fmtDate(sn.deadline)} · ${WORKING_MODE_DETAIL_LABEL[sn.workingMode] ?? sn.workingMode}`}
                  </Txt>
                </View>
              </View>
            )
          })
        )}
        {onOpenDeal ? (
          <Button title="Xem chi tiết thỏa thuận" variant="outline" size="sm" onPress={onOpenDeal} style={{ marginTop: 4 }} />
        ) : null}
      </ScrollView>
    </SheetModal>
  )
}
