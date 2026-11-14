import React, { useState } from 'react'
import { Linking, Pressable, View } from 'react-native'
import { AlertTriangle, Calendar, CheckCircle2, ChevronDown, Clock, FileText, History, ImageIcon, Paperclip, Pencil, RotateCcw, ShieldAlert } from '@/components/icons'
import { Avatar, Input, Txt } from './ui'
import { useTheme } from '@/theme'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import type { WorkLog } from '@/api/mentoringTask'
import { toast } from '@/lib/toast'

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '')
const fmtDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
const fmtSize = (b?: number | null) => (!b ? '' : b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`)

const STATUS = {
  PENDING_CONFIRMATION: { label: 'Chờ học viên xác nhận', fg: '#B45309', bg: '#FEF3C7', border: '#F59E0B', soft: '#FFFBEB', icon: Clock },
  CONFIRMED: { label: 'Đã xác nhận', fg: '#15803D', bg: '#DCFCE7', border: '#86EFAC', soft: '#F0FDF4', icon: CheckCircle2 },
  REJECTED: { label: 'Yêu cầu điều chỉnh', fg: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5', soft: '#FEF2F2', icon: AlertTriangle },
} as const

function Block({ label, children, boxed }: { label: string; children: React.ReactNode; boxed?: boolean }) {
  const t = useTheme()
  return (
    <View style={boxed ? { borderRadius: 14, borderWidth: 1, borderColor: t.border, backgroundColor: t.card, padding: 12 } : undefined}>
      <Txt size={11.5} weight="700" style={{ color: t.textMuted }}>
        {label}
      </Txt>
      <View style={{ marginTop: 4 }}>{children}</View>
    </View>
  )
}

/** Thẻ nhật ký công việc (Work Log) — đồng bộ nội dung với web (MentoringWorkLogList). */
export function WorkLogCard({ log, number, isLatest, onEdit, onConfirm, onReject }: {
  log: WorkLog
  /** Số thứ tự Log #n (cũ nhất = 1) */
  number: number
  isLatest?: boolean
  onEdit?: () => void
  onConfirm?: (feedback?: string) => Promise<unknown> | void
  onReject?: (reason: string) => Promise<unknown> | void
}) {
  const t = useTheme()
  const { viridian } = useMentoringTheme()
  const st = STATUS[log.status] ?? STATUS.PENDING_CONFIRMATION
  const StatusIcon = st.icon
  const [historyOpen, setHistoryOpen] = useState(false)
  const [mode, setMode] = useState<'confirm' | 'reject' | null>(null)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const canReview = !!(log.canConfirm || log.canReject)
  const hasAudit = (log.feedbacks?.length ?? 0) > 0 || (log.revisions?.length ?? 0) > 1

  const submit = async () => {
    const text = note.trim()
    if (mode === 'reject' && text.length < 5) return toast.error('Vui lòng nhập lý do điều chỉnh tối thiểu 5 ký tự.')
    setBusy(true)
    try {
      if (mode === 'confirm') await onConfirm?.(text || undefined)
      else await onReject?.(text)
      setMode(null)
      setNote('')
    } catch {
      // lỗi đã được báo bằng toast ở màn cha; giữ nguyên nội dung để người dùng thử lại
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: st.border, backgroundColor: t.isDark ? t.card : st.soft, padding: 14, overflow: 'hidden' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: t.border }}>
        <View style={{ backgroundColor: t.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Txt size={11.5} weight="800" style={{ color: t.textMuted }}>{`Log #${number}`}</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar size={13} color={viridian} />
          <Txt size={11.5} weight="700" style={{ color: t.textMuted }}>{`Ngày thực hiện: ${fmtDate(log.logDate)}`}</Txt>
        </View>
        {log.revisionNumber && log.revisionNumber > 1 ? (
          <View style={{ backgroundColor: '#DBEAFE', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Txt size={11} weight="800" style={{ color: '#1D4ED8' }}>{`Phiên bản v${log.revisionNumber}`}</Txt>
          </View>
        ) : null}
        {isLatest ? (
          <View style={{ backgroundColor: t.isDark ? '#2E1C10' : '#FFEDD5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Txt size={11} weight="800" style={{ color: viridian }}>Mới nhất</Txt>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: st.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
          <StatusIcon size={12} color={st.fg} />
          <Txt size={11} weight="800" style={{ color: st.fg }}>{st.label}</Txt>
        </View>
        {log.canEdit ? (
          <Pressable onPress={onEdit} accessibilityRole="button" accessibilityLabel="Sửa nhật ký" hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: t.border, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Pencil size={12} color={t.textMuted} />
            <Txt size={11.5} weight="700" style={{ color: t.textMuted }}>Sửa</Txt>
          </Pressable>
        ) : null}
      </View>

      {/* Nội dung */}
      <View style={{ marginTop: 12, gap: 10 }}>
        <Block label="Mô tả tóm tắt">
          <Txt weight="700" style={{ lineHeight: 21 }}>{log.description}</Txt>
        </Block>
        <Block label="Nội dung công việc hoàn thành" boxed>
          <Txt size={13.5} style={{ lineHeight: 20 }}>{log.workCompleted}</Txt>
        </Block>
        <Block label="Kết quả & Sản phẩm đạt được" boxed>
          <Txt size={13.5} style={{ lineHeight: 20 }}>{log.result}</Txt>
        </Block>
        {log.nextAction ? (
          <Block label="Hành động tiếp theo">
            <Txt size={13} style={{ color: t.textMuted, lineHeight: 19 }}>{log.nextAction}</Txt>
          </Block>
        ) : null}

        {log.attachments?.length ? (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Paperclip size={13} color={t.textMuted} />
              <Txt size={11.5} weight="700" style={{ color: t.textMuted }}>{`Tài liệu minh chứng đính kèm (${log.attachments.length})`}</Txt>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
              {log.attachments.map((a) => {
                const isImage = a.mediaType === 'IMAGE' || /\.(jpe?g|png|webp|gif)$/i.test(a.fileUrl)
                const Icon = isImage ? ImageIcon : FileText
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => void Linking.openURL(a.fileUrl)}
                    accessibilityRole="link"
                    accessibilityLabel={`Mở ${a.fileName}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%', borderWidth: 1, borderColor: t.border, backgroundColor: t.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 }}
                  >
                    <Icon size={15} color={isImage ? viridian : '#1D4ED8'} />
                    <Txt size={12} weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>{a.fileName}</Txt>
                    {a.fileSize ? <Txt size={11} style={{ color: t.textMuted }}>{`(${fmtSize(a.fileSize)})`}</Txt> : null}
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}

        {log.status === 'CONFIRMED' ? (
          <View style={{ flexDirection: 'row', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: '#86EFAC', backgroundColor: t.isDark ? '#0F2A1A' : '#F0FDF4', padding: 12 }}>
            <ShieldAlert size={16} color="#15803D" />
            <View style={{ flex: 1 }}>
              <Txt size={12} weight="800" style={{ color: '#15803D' }}>
                {`Đã xác nhận nghiệm thu bởi ${log.confirmedByName || 'Học viên'} ${fmtDateTime(log.confirmedAt)}`}
              </Txt>
              {log.studentFeedback ? <Txt size={12} weight="600" style={{ color: '#15803D', marginTop: 4 }}>{`“${log.studentFeedback}”`}</Txt> : null}
              <Txt size={11.5} style={{ color: '#15803D', marginTop: 4 }}>
                Bản ghi này đã trở thành bằng chứng nghiệm thu được bảo vệ, Mentor không thể chỉnh sửa hoặc xóa bỏ.
              </Txt>
            </View>
          </View>
        ) : null}

        {log.status === 'REJECTED' ? (
          <View style={{ borderRadius: 14, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: t.isDark ? '#2B1414' : '#FEF2F2', padding: 12 }}>
            <Txt size={12} weight="800" style={{ color: '#B91C1C' }}>Yêu cầu điều chỉnh từ học viên</Txt>
            <Txt size={11.5} style={{ color: '#B91C1C', marginTop: 2 }}>Đang chờ Mentor bổ sung & gửi lại</Txt>
            {log.studentFeedback ? (
              <Txt size={12} weight="600" style={{ color: '#B91C1C', marginTop: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FCA5A5', backgroundColor: t.card }}>
                {`“${log.studentFeedback}”`}
              </Txt>
            ) : null}
          </View>
        ) : null}

        {hasAudit ? (
          <View>
            <Pressable onPress={() => setHistoryOpen((o) => !o)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <History size={13} color={t.textMuted} />
              <Txt size={12} weight="700" style={{ color: t.textMuted, flexShrink: 1 }}>
                {`Lịch sử phản hồi & các phiên bản sửa đổi (${log.feedbacks?.length ?? 0})`}
              </Txt>
              <View style={{ transform: [{ rotate: historyOpen ? '180deg' : '0deg' }] }}>
                <ChevronDown size={14} color={t.textMuted} />
              </View>
            </Pressable>
            {historyOpen ? (
              <View style={{ marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface, padding: 10, gap: 8 }}>
                {(log.feedbacks ?? []).map((fb) => (
                  <View key={fb.id}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                      <Txt size={12} weight="800" style={{ flexShrink: 1 }}>
                        {fb.action === 'CONFIRMED' ? 'Xác nhận nghiệm thu' : `Yêu cầu điều chỉnh (v${fb.revisionNumber})`}
                      </Txt>
                      <Txt size={11} style={{ color: t.textMuted }}>{fmtDateTime(fb.createdAt)}</Txt>
                    </View>
                    {fb.reason ? <Txt size={12} style={{ marginTop: 2 }}>{`“${fb.reason}”`}</Txt> : null}
                  </View>
                ))}
                {!log.feedbacks?.length ? <Txt size={12} style={{ color: t.textMuted }}>Chưa có phản hồi nào.</Txt> : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Học viên nghiệm thu */}
      {canReview ? (
        <View style={{ marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: '#86EFAC', backgroundColor: t.card, padding: 12, overflow: 'hidden' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <CheckCircle2 size={15} color="#15803D" />
            <Txt size={12.5} weight="800" style={{ color: '#15803D', flex: 1 }}>Học viên xác nhận nghiệm thu phần công việc này</Txt>
          </View>
          <Txt size={11.5} style={{ color: '#15803D', marginTop: 3 }}>
            Kiểm tra nội dung hoàn thành và tài liệu minh chứng để xác nhận nghiệm thu hoặc yêu cầu Mentor điều chỉnh.
          </Txt>
          {mode ? (
            <View style={{ marginTop: 10 }}>
              <Input
                value={note}
                onChangeText={setNote}
                multiline
                placeholder={mode === 'confirm' ? 'Nhận xét cho Mentor (không bắt buộc)' : 'Lý do cần điều chỉnh (tối thiểu 5 ký tự)'}
              />
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            {mode ? (
              <>
                <Pressable onPress={() => { setMode(null); setNote('') }} disabled={busy} style={[btn(t.card, t.border), { flex: 1, minWidth: 70, justifyContent: 'center' }]}>
                  <Txt size={12} weight="700">Hủy</Txt>
                </Pressable>
                <Pressable onPress={() => void submit()} disabled={busy} style={[btn(mode === 'confirm' ? viridian : '#DC2626', mode === 'confirm' ? viridian : '#DC2626'), { flex: 1, minWidth: 110, justifyContent: 'center', opacity: busy ? 0.6 : 1 }]}>
                  <Txt size={12} weight="800" style={{ color: '#FFFFFF' }} numberOfLines={1}>
                    {busy ? 'Đang gửi...' : mode === 'confirm' ? 'Gửi xác nhận' : 'Gửi yêu cầu'}
                  </Txt>
                </Pressable>
              </>
            ) : (
              <>
                {log.canReject ? (
                  <Pressable onPress={() => setMode('reject')} accessibilityRole="button" accessibilityLabel="Yêu cầu điều chỉnh" style={[btn(t.card, '#FCA5A5'), { flex: 1.1, minWidth: 120, justifyContent: 'center', paddingHorizontal: 8 }]}>
                    <RotateCcw size={13} color="#DC2626" />
                    <Txt size={11.5} weight="700" style={{ color: '#DC2626' }} numberOfLines={1}>Yêu cầu điều chỉnh</Txt>
                  </Pressable>
                ) : null}
                {log.canConfirm ? (
                  <Pressable onPress={() => setMode('confirm')} accessibilityRole="button" accessibilityLabel="Xác nhận" style={[btn(viridian, viridian), { flex: 1, minWidth: 100, justifyContent: 'center', paddingHorizontal: 8 }]}>
                    <CheckCircle2 size={13} color="#FFFFFF" />
                    <Txt size={11.5} weight="800" style={{ color: '#FFFFFF' }} numberOfLines={1}>Xác nhận</Txt>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        </View>
      ) : null}

      {/* Footer */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: t.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
          <Avatar uri={log.mentorAvatar} name={log.mentorName} size={20} />
          <Txt size={11.5} style={{ color: t.textMuted, flexShrink: 1 }} numberOfLines={1}>{`Ghi nhận bởi ${log.mentorName}`}</Txt>
        </View>
        {log.updatedAt || log.createdAt ? (
          <Txt size={11.5} style={{ color: t.textMuted }}>{`Cập nhật: ${fmtDateTime(log.updatedAt || log.createdAt)}`}</Txt>
        ) : null}
      </View>
    </View>
  )
}

const btn = (bg: string, border: string) => ({
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: 5,
  minHeight: 34,
  paddingHorizontal: 12,
  borderRadius: 10,
  borderWidth: 1,
  borderColor: border,
  backgroundColor: bg,
})
