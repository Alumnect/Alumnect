import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as Haptics from 'expo-haptics'
import { ImagePlus, Info, Send, Star, X } from '@/components/icons'
import { Button, Empty, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DateField } from '@/components/DateField'
import { BottomBar } from '@/components/DetailBits'
import { BrandIcon, type BrandIconName } from '@/components/BrandIcon'
import { MotionPressable } from '@/components/Motion'
import { formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { TaskDetail, WorkLogPayload } from '@/api/mentoringTask'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'

type ActionType = 'worklog' | 'extension' | 'amendment' | 'settlement' | 'settlement-ticket' | 'completion' | 'dispute' | 'review'

/** Nội dung giới thiệu cho từng loại thao tác: tiêu đề, icon Meetup, mô tả điều gì xảy ra sau khi gửi, nhãn nút. */
const META: Record<ActionType, { title: string; brand: BrandIconName; intro: string; submit: string; success: string }> = {
  worklog: { title: 'Nhật ký công việc', brand: 'list', intro: 'Ghi lại nội dung buổi làm việc. Học viên sẽ xác nhận nhật ký để cập nhật tiến độ nhiệm vụ.', submit: 'Lưu nhật ký', success: 'Đã thêm nhật ký công việc.' },
  extension: { title: 'Xin gia hạn', brand: 'alarm_clock', intro: 'Đề xuất hạn chót mới. Bên còn lại cần đồng ý thì hạn mới mới có hiệu lực.', submit: 'Gửi đề xuất gia hạn', success: 'Đã gửi đề xuất gia hạn.' },
  amendment: { title: 'Điều chỉnh nhiệm vụ', brand: 'pencil', intro: 'Thay đổi phạm vi, kết quả, chi phí hoặc thời hạn. Nếu có chi phí phát sinh, học viên thanh toán thêm sau khi đồng ý.', submit: 'Gửi đề xuất điều chỉnh', success: 'Đã gửi đề xuất điều chỉnh.' },
  settlement: { title: 'Đề xuất hòa giải', brand: 'fist', intro: 'Dừng nhiệm vụ và chia số tiền đang giữ giữa Mentor và Học viên. Bên còn lại cần đồng ý phương án này.', submit: 'Gửi đề xuất hòa giải', success: 'Đã gửi đề xuất hòa giải.' },
  'settlement-ticket': { title: 'Gửi biên bản hòa giải', brand: 'writing', intro: 'Hai bên đã đồng ý phương án hòa giải. Gửi biên bản để Ban Quản Trị xét duyệt và giải ngân.', submit: 'Gửi biên bản', success: 'Đã gửi biên bản hòa giải.' },
  completion: { title: 'Nộp kết quả bàn giao', brand: 'badge_pro', intro: 'Tổng kết kết quả để học viên nghiệm thu. Khi được chấp nhận, nhiệm vụ hoàn thành và thù lao được giải ngân.', submit: 'Nộp kết quả', success: 'Đã nộp kết quả, đang chờ học viên nghiệm thu.' },
  dispute: { title: 'Khiếu nại / Tranh chấp', brand: 'mentalhealth', intro: 'Gửi khiếu nại đến Ban Quản Trị khi hai bên không tự thống nhất được. Hãy mô tả rõ và đính kèm bằng chứng.', submit: 'Gửi khiếu nại', success: 'Đã tạo ticket khiếu nại.' },
  review: { title: 'Đánh giá Mentor', brand: 'star', intro: 'Đánh giá của bạn giúp cộng đồng chọn được mentor phù hợp và ghi nhận công sức của mentor.', submit: 'Gửi đánh giá', success: 'Cảm ơn bạn đã đánh giá mentor!' },
}

const RATING_LABEL = ['', 'Rất không hài lòng', 'Chưa hài lòng', 'Bình thường', 'Hài lòng', 'Tuyệt vời']
const PRESETS = [0, 25, 50, 75, 100]

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const addDays = (iso: string, days: number) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}
const dmy = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—')
const group = (digits: string) => (digits ? new Intl.NumberFormat('vi-VN').format(Number(digits)) : '')

/* ------------------------------------------------------------------ */
/* Khối giao diện dùng chung của form                                  */
/* ------------------------------------------------------------------ */

function IntroCard({ meta }: { meta: (typeof META)[ActionType] }) {
  const { colors, viridianSoft, isDark } = useMentoringTheme()
  return (
    <View style={[styles.intro, { backgroundColor: isDark ? '#24180E' : viridianSoft, borderColor: isDark ? '#4A2C16' : '#FAD9C2' }]}>
      <BrandIcon name={meta.brand} size={44} />
      <View style={{ flex: 1 }}>
        <Txt size={15} weight="800" style={{ color: colors.text }}>{meta.title}</Txt>
        <Txt size={12.5} style={{ color: colors.textSecondary, marginTop: 3, lineHeight: 18 }}>{meta.intro}</Txt>
      </View>
    </View>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  const { colors } = useMentoringTheme()
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {title ? <Txt size={12} weight="800" style={{ color: colors.textSecondary, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 }}>{title}</Txt> : null}
      {children}
    </View>
  )
}

/** Thông tin hiện tại của nhiệm vụ để đối chiếu khi điều chỉnh / gia hạn / nộp kết quả. */
function InfoGrid({ rows }: { rows: [string, string, string?][] }) {
  const { colors } = useMentoringTheme()
  return (
    <View style={{ gap: 8 }}>
      {rows.map(([label, value, color]) => (
        <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
          <Txt size={13} style={{ color: colors.textSecondary }}>{label}</Txt>
          <Txt size={13} weight="700" style={{ color: color ?? colors.text, flexShrink: 1, textAlign: 'right' }} numberOfLines={2}>{value}</Txt>
        </View>
      ))}
    </View>
  )
}

/** Ô nhập kiểu Meetup: nhãn + dấu bắt buộc, placeholder gợi ý, viền cam khi chọn, đếm ký tự, chip gợi ý chạm để điền. */
function Field({
  label, value, onChange, placeholder, required, multiline = true, minLength, maxLength, hint, error, chips, lines = 4,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; multiline?: boolean
  minLength?: number; maxLength?: number; hint?: string; error?: string; chips?: string[]; lines?: number
}) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const [focus, setFocus] = useState(false)
  const len = value.trim().length
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Txt size={13.5} weight="700" style={{ color: colors.text, flex: 1 }}>
          {label}
          {required ? <Txt size={13.5} weight="700" style={{ color: viridian }}> *</Txt> : <Txt size={12} style={{ color: colors.textTertiary }}> (tùy chọn)</Txt>}
        </Txt>
        {maxLength ? <Txt size={11} style={{ color: minLength && len > 0 && len < minLength ? '#DC2626' : colors.textTertiary }}>{`${len}/${maxLength}`}</Txt> : null}
      </View>
      {chips?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }} contentContainerStyle={{ gap: 6 }}>
          {chips.map((c) => {
            const used = value.includes(c)
            return (
              <Pressable
                key={c}
                onPress={() => {
                  Haptics.selectionAsync()
                  onChange(used ? value : value.trim() ? `${value.trim()}\n${c}` : c)
                }}
                style={{ paddingHorizontal: 12, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: used ? viridianSoft : isDark ? colors.surface : '#F4F5F7', borderWidth: 1, borderColor: used ? viridian : 'transparent' }}
              >
                <Txt size={12} weight="600" style={{ color: used ? viridian : colors.text }}>{c}</Txt>
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={multiline}
        maxLength={maxLength}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        selectionColor={viridian}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: focus ? colors.card : isDark ? colors.surface : '#F7F8FA',
            borderColor: error ? '#DC2626' : focus ? viridian : isDark ? colors.border : '#E6E8EB',
          },
          multiline ? { minHeight: 22 * lines + 24, textAlignVertical: 'top' } : { height: 48 },
        ]}
      />
      {error ? <Txt size={12} style={{ color: '#DC2626', marginTop: 6 }}>{error}</Txt> : hint ? <Txt size={12} style={{ color: colors.textTertiary, marginTop: 6 }}>{hint}</Txt> : null}
    </View>
  )
}

/** Ô nhập số tiền: tự chèn dấu chấm phân cách nghìn, hậu tố ₫. */
function MoneyField({ label, value, onChange, required, hint, error }: { label: string; value: string; onChange: (digits: string) => void; required?: boolean; hint?: string; error?: string }) {
  const { colors, viridian, isDark } = useMentoringTheme()
  const [focus, setFocus] = useState(false)
  return (
    <View style={{ marginBottom: 16 }}>
      <Txt size={13.5} weight="700" style={{ color: colors.text, marginBottom: 8 }}>
        {label}
        {required ? <Txt size={13.5} weight="700" style={{ color: viridian }}> *</Txt> : <Txt size={12} style={{ color: colors.textTertiary }}> (tùy chọn)</Txt>}
      </Txt>
      <View style={[styles.input, styles.moneyBox, { backgroundColor: focus ? colors.card : isDark ? colors.surface : '#F7F8FA', borderColor: error ? '#DC2626' : focus ? viridian : isDark ? colors.border : '#E6E8EB' }]}>
        <TextInput
          value={group(value)}
          onChangeText={(v) => onChange(v.replace(/\D/g, '').replace(/^0+(?=\d)/, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          selectionColor={viridian}
          style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text, paddingVertical: 0, fontVariant: ['tabular-nums'] }}
        />
        <Txt size={15} weight="700" style={{ color: colors.textSecondary }}>₫</Txt>
      </View>
      {error ? <Txt size={12} style={{ color: '#DC2626', marginTop: 6 }}>{error}</Txt> : hint ? <Txt size={12} style={{ color: colors.textTertiary, marginTop: 6 }}>{hint}</Txt> : null}
    </View>
  )
}

/** Ảnh đính kèm dạng lưới thumbnail + ô thêm ảnh. */
function Attachments({ files, onAdd, onRemove, uploading, label }: { files: { fileUrl: string; fileName: string }[]; onAdd: () => void; onRemove: (i: number) => void; uploading: boolean; label: string }) {
  const { colors, viridian, isDark } = useMentoringTheme()
  return (
    <View>
      <Txt size={13.5} weight="700" style={{ color: colors.text, marginBottom: 8 }}>
        {label} <Txt size={12} style={{ color: colors.textTertiary }}>{`(${files.length}/6)`}</Txt>
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {files.map((x, i) => (
          <View key={`${x.fileUrl}-${i}`} style={styles.thumb}>
            <Image source={{ uri: x.fileUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Pressable onPress={() => onRemove(i)} hitSlop={6} accessibilityLabel="Xóa ảnh" style={styles.thumbRemove}>
              <X size={12} color="#FFFFFF" weight="bold" />
            </Pressable>
          </View>
        ))}
        {files.length < 6 ? (
          <MotionPressable
            onPress={onAdd}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel="Thêm ảnh"
            style={[styles.thumb, { alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderStyle: 'dashed', borderColor: isDark ? colors.border : '#D7DADF', backgroundColor: isDark ? colors.surface : '#FAFAFB' }]}
          >
            <ImagePlus size={22} color={viridian} />
            <Txt size={11} weight="700" style={{ color: viridian }}>{uploading ? 'Đang tải...' : 'Thêm ảnh'}</Txt>
          </MotionPressable>
        ) : null}
      </View>
    </View>
  )
}

/* ------------------------------------------------------------------ */
/* Màn hình                                                            */
/* ------------------------------------------------------------------ */

/** Form dùng chung cho các thao tác của nhiệm vụ: UC97, 99, 100, 101, 102, 112 (Meetup x Kakao Form Design). */
export default function TaskActionScreen() {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const params = useLocalSearchParams<{ id: string; type: string; workLogId?: string }>()
  const type = (params.type ?? 'worklog') as ActionType
  const workLogId = params.workLogId
  const tid = Number(params.id)
  const meta = META[type] ?? META.worklog
  const task = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const snapshot = useQuery({ queryKey: ['settlement-snapshot', tid], queryFn: () => taskApi.settlementSnapshot(tid), enabled: type === 'settlement-ticket' })

  const [f, setF] = useState<Record<string, string>>({})
  const [date, setDate] = useState('')
  const [rating, setRating] = useState(0)
  const [files, setFiles] = useState<{ fileUrl: string; fileName: string; mediaType?: 'IMAGE' | 'VIDEO' | 'FILE'; fileSize?: number | null }[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const set = (k: string) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }
  const v = (k: string) => f[k] ?? ''

  const d: TaskDetail | undefined = task.data
  const existing = workLogId ? d?.workLogs.find((w) => w.id === Number(workLogId)) : undefined
  if (existing && !loaded) {
    setLoaded(true)
    setF({ description: existing.description, workCompleted: existing.workCompleted, result: existing.result, nextAction: existing.nextAction ?? '' })
    setDate(existing.logDate)
    setFiles(existing.attachments.map((a) => ({ fileUrl: a.fileUrl, fileName: a.fileName, mediaType: a.mediaType, ...(a.fileSize != null ? { fileSize: a.fileSize } : {}) })))
  }
  // Tổng tiền đang giữ (escrow) dùng cho hòa giải; thiếu thì lấy giá thỏa thuận.
  const total = Math.max(0, Math.round(d?.overview.escrowBalance ?? d?.overview.agreedPrice ?? 0))
  const mentorAmount = Math.min(total, Number(f.mentor || 0))
  const refundAmount = total - mentorAmount

  const done = (msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    toast.success(msg)
    qc.invalidateQueries({ queryKey: ['mentoring-task', tid] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    qc.invalidateQueries({ queryKey: ['mentoring-task-report', String(tid)] })
    qc.invalidateQueries({ queryKey: ['mentoring-review', tid] })
    router.back()
  }

  const addFile = async () => {
    const [img] = await pickImage()
    if (!img) return
    setUploading(true)
    try {
      const url = await uploadImage(img, type === 'dispute' ? 'evidence' : 'common')
      setFiles((x) => [...x, { fileUrl: url, fileName: img.name, mediaType: 'IMAGE' }])
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const m = useMutation({
    mutationFn: async () => {
      const urls = files.filter((x) => x.fileUrl)
      switch (type) {
        case 'worklog': {
          const p: WorkLogPayload = {
            logDate: (date || today()).slice(0, 10),
            description: v('description').trim(),
            workCompleted: v('workCompleted').trim(),
            result: v('result').trim(),
            nextAction: v('nextAction').trim() || undefined,
            attachments: urls.map((u) => ({ ...u, mediaType: u.mediaType ?? 'IMAGE' })),
          }
          return workLogId ? taskApi.updateWorkLog(tid, Number(workLogId), p) : taskApi.createWorkLog(tid, p)
        }
        case 'extension':
          return taskApi.createExtension(tid, { proposedDeadline: date, reason: v('reason').trim() })
        case 'amendment':
          return taskApi.createAmendment(tid, {
            newScope: v('newScope').trim() || undefined,
            newExpectedResult: v('newResult').trim() || undefined,
            additionalAmount: f.amount ? Number(f.amount) : undefined,
            newDeadline: date || undefined,
            reason: v('reason').trim(),
          })
        case 'settlement':
          return taskApi.createSettlementProposal(tid, { mentorAmount, studentRefund: refundAmount, reason: v('reason').trim() })
        case 'settlement-ticket':
          return taskApi.submitSettlementTicket(tid, { proposalId: snapshot.data!.settlementProposalId, note: v('note').trim() || undefined })
        case 'completion':
          return taskApi.submitCompletion(tid, { finalSummary: v('summary').trim(), deliverables: v('deliverables').trim() || undefined, attachmentUrls: urls.map((u) => u.fileUrl) })
        case 'dispute':
          return taskApi.createDispute(tid, {
            title: v('title').trim(),
            disputeReason: v('reason').trim(),
            description: v('description').trim(),
            desiredSolution: v('solution').trim(),
            initialEvidences: urls.map((u) => ({ fileUrl: u.fileUrl, fileName: u.fileName, title: u.fileName })),
          })
        case 'review':
          return taskApi.review({ taskId: tid, rating, comment: v('comment').trim() || undefined })
        default:
          throw new Error('Hành động không hợp lệ')
      }
    },
    onSuccess: () => done(type === 'worklog' && workLogId ? 'Đã cập nhật nhật ký.' : meta.success),
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    const req = (k: string, msg: string, min = 1) => {
      if (v(k).trim().length < min) e[k] = msg
    }
    if (type === 'worklog') {
      req('description', 'Mô tả buổi làm việc cần ít nhất 5 ký tự', 5)
      req('workCompleted', 'Công việc đã hoàn thành cần ít nhất 5 ký tự', 5)
      req('result', 'Kết quả đạt được cần ít nhất 5 ký tự', 5)
    }
    if (type === 'extension') {
      req('reason', 'Vui lòng nêu lý do xin gia hạn')
      if (!date || new Date(date).getTime() <= Date.now()) e.date = 'Hạn chót mới phải ở trong tương lai'
      else if (d && new Date(date).getTime() <= new Date(d.overview.deadline).getTime()) e.date = 'Hạn chót mới phải sau hạn hiện tại'
    }
    if (type === 'amendment') {
      req('reason', 'Vui lòng nêu lý do điều chỉnh')
      if (!v('newScope').trim() && !v('newResult').trim() && !f.amount && !date) e.newScope = 'Cần thay đổi ít nhất một nội dung: phạm vi, kết quả, chi phí hoặc hạn chót'
    }
    if (type === 'settlement') {
      req('reason', 'Vui lòng nêu lý do đề xuất hòa giải')
      if (Number(f.mentor || 0) > total) e.mentor = `Không vượt quá tổng ${formatVnd(total)}`
    }
    if (type === 'completion') req('summary', 'Tóm tắt kết quả cần ít nhất 10 ký tự', 10)
    if (type === 'dispute') {
      req('title', 'Tiêu đề không được để trống')
      req('reason', 'Vui lòng chọn hoặc nêu lý do tranh chấp')
      req('description', 'Mô tả sự việc cần ít nhất 20 ký tự', 20)
      req('solution', 'Vui lòng nêu phương án mong muốn')
    }
    if (type === 'review' && rating < 1) e.rating = 'Vui lòng chọn số sao đánh giá'
    setErrors(e)
    if (Object.keys(e).length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      return
    }
    m.mutate()
  }

  if (task.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title={meta.title} />
        <Loading />
      </Screen>
    )
  if (!d)
    return (
      <Screen bg={colors.bg}>
        <Header title={meta.title} />
        <Empty text="Không tìm thấy nhiệm vụ." error={task.error} onRetry={() => { void task.refetch() }} />
      </Screen>
    )
  if (workLogId && !existing)
    return (
      <Screen bg={colors.bg}>
        <Header title={meta.title} />
        <Empty text="Không tìm thấy nhật ký công việc." />
      </Screen>
    )

  const o = d.overview
  const firstLine = (s: string) => s.split('\n').map((x) => x.trim()).find(Boolean) ?? s

  return (
    <Screen bg={colors.bg}>
      <Header title={workLogId ? 'Sửa nhật ký công việc' : meta.title} subtitle={firstLine(o.taskTitle)} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          <IntroCard meta={meta} />

          {/* ---------- Nhật ký công việc ---------- */}
          {type === 'worklog' ? (
            <>
              <Section title="Buổi làm việc">
                <DateField dateOnly label="Ngày làm việc" value={date || today()} onChange={setDate} minimumDate={null} />
                <Field label="Nội dung buổi làm việc" required value={v('description')} onChange={set('description')} minLength={5} maxLength={5000} lines={3}
                  placeholder="VD: Buổi 3 — ôn tập lập trình hướng đối tượng, giải đáp thắc mắc về kế thừa và đa hình." error={errors.description} />
                <Field label="Công việc đã hoàn thành" required value={v('workCompleted')} onChange={set('workCompleted')} minLength={5} maxLength={5000} lines={3}
                  placeholder="VD: Chữa 5 bài tập class/interface, review code bài tập tuần trước." error={errors.workCompleted} />
                <Field label="Kết quả đạt được" required value={v('result')} onChange={set('result')} minLength={5} maxLength={5000} lines={3}
                  placeholder="VD: Học viên tự viết được class hoàn chỉnh, hiểu cách override phương thức." error={errors.result} />
                <Field label="Kế hoạch buổi tiếp theo" value={v('nextAction')} onChange={set('nextAction')} maxLength={2000} lines={2}
                  placeholder="VD: Bài tập về Collection, chuẩn bị mini project quản lý sinh viên." />
              </Section>
              <Section title="Hình ảnh minh chứng">
                <Attachments label="Ảnh buổi làm việc" files={files} onAdd={addFile} onRemove={(i) => setFiles((a) => a.filter((_, j) => j !== i))} uploading={uploading} />
              </Section>
            </>
          ) : null}

          {/* ---------- Gia hạn ---------- */}
          {type === 'extension' ? (
            <>
              <Section title="Thời hạn hiện tại">
                <InfoGrid rows={[['Hạn chót hiện tại', dmy(o.deadline), o.isOverdue ? '#DC2626' : undefined], ['Số ngày còn lại', o.isOverdue ? 'Đã quá hạn' : `${o.daysRemaining} ngày`], ['Tiến độ', `${o.progressPercentage}%`]]} />
              </Section>
              <Section title="Đề xuất mới">
                <Txt size={13.5} weight="700" style={{ color: colors.text, marginBottom: 8 }}>Gia hạn nhanh</Txt>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {[3, 7, 14, 30].map((n) => {
                    const target = addDays(o.deadline, n)
                    const active = !!date && new Date(date).toDateString() === new Date(target).toDateString()
                    return (
                      <Pressable key={n} onPress={() => { Haptics.selectionAsync(); setDate(target); setErrors((x) => ({ ...x, date: '' })) }}
                        style={[styles.preset, { backgroundColor: active ? viridian : isDark ? colors.surface : '#F4F5F7', borderColor: active ? viridian : 'transparent' }]}>
                        <Txt size={13} weight="800" style={{ color: active ? '#FFFFFF' : colors.text }}>{`+${n} ngày`}</Txt>
                      </Pressable>
                    )
                  })}
                </View>
                <DateField label="Hạn chót mới" value={date} onChange={(x) => { setDate(x); setErrors((e) => ({ ...e, date: '' })) }} error={errors.date} />
                {date && !errors.date ? <Txt size={12} style={{ color: viridian, marginTop: -6, marginBottom: 12 }}>{`Dời hạn từ ${dmy(o.deadline)} sang ${dmy(date)}`}</Txt> : null}
                <Field label="Lý do xin gia hạn" required value={v('reason')} onChange={set('reason')} maxLength={1000} lines={3} error={errors.reason}
                  placeholder="Giải thích ngắn gọn vì sao cần thêm thời gian và kế hoạch hoàn thành."
                  chips={['Cần thêm thời gian luyện tập', 'Lịch học / công việc bận đột xuất', 'Phạm vi phát sinh nội dung mới', 'Chờ tài liệu từ học viên']} />
              </Section>
            </>
          ) : null}

          {/* ---------- Điều chỉnh ---------- */}
          {type === 'amendment' ? (
            <>
              <Section title="Thỏa thuận hiện tại">
                <InfoGrid rows={[['Ngân sách', formatVnd(o.agreedPrice), viridian], ['Hạn chót', dmy(o.deadline)]]} />
                <Txt size={12} style={{ color: colors.textSecondary, marginTop: 10 }} numberOfLines={3}>{`Phạm vi: ${o.taskScope}`}</Txt>
              </Section>
              <Section title="Nội dung thay đổi">
                {errors.newScope ? (
                  <View style={[styles.alert, { backgroundColor: isDark ? '#3A1616' : '#FDECEC' }]}>
                    <Txt size={12.5} style={{ color: '#DC2626' }}>{errors.newScope}</Txt>
                  </View>
                ) : null}
                <Field label="Phạm vi công việc mới" value={v('newScope')} onChange={set('newScope')} maxLength={2000} lines={3}
                  placeholder="Để trống nếu giữ nguyên. VD: Bổ sung thêm phần Spring Boot cơ bản." />
                <Field label="Kết quả kỳ vọng mới" value={v('newResult')} onChange={set('newResult')} maxLength={2000} lines={2}
                  placeholder="Để trống nếu giữ nguyên. VD: Hoàn thành 1 REST API CRUD." />
                <MoneyField label="Chi phí phát sinh thêm" value={f.amount ?? ''} onChange={set('amount')}
                  hint={f.amount ? `Tổng mới: ${formatVnd(o.agreedPrice + Number(f.amount))} — học viên thanh toán phần chênh lệch sau khi đồng ý.` : 'Để trống nếu không phát sinh chi phí.'} />
                <DateField label="Hạn chót mới (tùy chọn)" value={date} onChange={setDate} />
                <Field label="Lý do điều chỉnh" required value={v('reason')} onChange={set('reason')} maxLength={1000} lines={3} error={errors.reason}
                  placeholder="Vì sao cần điều chỉnh thỏa thuận ban đầu?"
                  chips={['Học viên muốn mở rộng nội dung', 'Phạm vi ban đầu chưa sát thực tế', 'Thay đổi mục tiêu đầu ra']} />
              </Section>
            </>
          ) : null}

          {/* ---------- Hòa giải ---------- */}
          {type === 'settlement' ? (
            <Section title="Phân chia số tiền đang giữ">
              <View style={[styles.totalBox, { backgroundColor: viridianSoft }]}>
                <Txt size={12} style={{ color: colors.textSecondary }}>Tổng số tiền đang giữ</Txt>
                <Txt size={22} weight="800" style={{ color: viridian, fontVariant: ['tabular-nums'] }}>{formatVnd(total)}</Txt>
              </View>
              <Txt size={13.5} weight="700" style={{ color: colors.text, marginBottom: 8 }}>Mentor nhận bao nhiêu phần trăm?</Txt>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
                {PRESETS.map((p) => {
                  const active = total > 0 && Math.round((mentorAmount / total) * 100) === p && f.mentor !== undefined
                  return (
                    <Pressable key={p} onPress={() => { Haptics.selectionAsync(); set('mentor')(String(Math.round((total * p) / 100))) }}
                      style={[styles.preset, { backgroundColor: active ? viridian : isDark ? colors.surface : '#F4F5F7', borderColor: active ? viridian : 'transparent' }]}>
                      <Txt size={13} weight="800" style={{ color: active ? '#FFFFFF' : colors.text }}>{`${p}%`}</Txt>
                    </Pressable>
                  )
                })}
              </View>
              <MoneyField label="Mentor nhận" required value={f.mentor ?? ''} onChange={set('mentor')} error={errors.mentor} />
              {/* Thanh chia tỷ lệ */}
              <View style={[styles.splitBar, { backgroundColor: isDark ? colors.surface : '#F1F2F4' }]}>
                <View style={{ width: `${total ? (mentorAmount / total) * 100 : 0}%`, backgroundColor: viridian }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 16 }}>
                <Txt size={12.5} weight="700" style={{ color: viridian }}>{`Mentor: ${formatVnd(mentorAmount)}`}</Txt>
                <Txt size={12.5} weight="700" style={{ color: colors.text }}>{`Học viên được hoàn: ${formatVnd(refundAmount)}`}</Txt>
              </View>
              <Field label="Lý do đề xuất dừng & hòa giải" required value={v('reason')} onChange={set('reason')} maxLength={1000} lines={3} error={errors.reason}
                placeholder="Mô tả phần việc đã làm được và lý do chia tiền như trên."
                chips={['Hai bên thống nhất dừng sớm', 'Đã hoàn thành một phần nội dung', 'Học viên thay đổi kế hoạch']} />
            </Section>
          ) : null}

          {/* ---------- Biên bản hòa giải ---------- */}
          {type === 'settlement-ticket' ? (
            snapshot.isLoading ? (
              <Loading />
            ) : snapshot.data ? (
              <Section title="Phương án đã thống nhất">
                <InfoGrid rows={[
                  ['Tổng ngân sách', formatVnd(snapshot.data.totalBudget)],
                  ['Mentor nhận', formatVnd(snapshot.data.mentorAmount), viridian],
                  ['Học viên được hoàn', formatVnd(snapshot.data.studentRefund)],
                ]} />
                <View style={[styles.quote, { backgroundColor: isDark ? colors.surface : '#F7F8FA', borderLeftColor: viridian }]}>
                  <Txt size={12.5} style={{ color: colors.textSecondary, lineHeight: 19 }}>{`“${snapshot.data.reason}”`}</Txt>
                </View>
                <Field label="Ghi chú gửi Ban Quản Trị" value={v('note')} onChange={set('note')} maxLength={1000} lines={3}
                  placeholder="Thông tin bổ sung giúp Ban Quản Trị xét duyệt nhanh hơn (nếu có)." />
              </Section>
            ) : (
              <Section>
                <Empty text="Chưa có phương án hòa giải nào được hai bên đồng ý." />
              </Section>
            )
          ) : null}

          {/* ---------- Nộp kết quả ---------- */}
          {type === 'completion' ? (
            <>
              <Section title="Tổng quan nhiệm vụ">
                <InfoGrid rows={[
                  ['Tiến độ', `${o.progressPercentage}%`, o.progressPercentage >= 100 ? '#16A34A' : viridian],
                  ['Nhật ký đã xác nhận', `${o.confirmedWorkLogs}/${o.totalWorkLogs} buổi`],
                  ['Hạn chót', dmy(o.deadline), o.isOverdue ? '#DC2626' : undefined],
                ]} />
                <Txt size={12} style={{ color: colors.textSecondary, marginTop: 10 }} numberOfLines={3}>{`Kết quả kỳ vọng: ${d.deal.expectedResult}`}</Txt>
                {o.totalWorkLogs > o.confirmedWorkLogs ? (
                  <View style={[styles.alert, { marginTop: 12, marginBottom: 0, backgroundColor: isDark ? '#3A2E12' : '#FFF6E0', flexDirection: 'row', gap: 8 }]}>
                    <Info size={16} color="#B45309" />
                    <Txt size={12.5} style={{ color: '#B45309', flex: 1 }}>{`Còn ${o.totalWorkLogs - o.confirmedWorkLogs} nhật ký chưa được xác nhận. Học viên có thể xem lại trước khi nghiệm thu.`}</Txt>
                  </View>
                ) : null}
              </Section>
              <Section title="Kết quả bàn giao">
                <Field label="Tóm tắt kết quả hoàn thành" required value={v('summary')} onChange={set('summary')} minLength={10} maxLength={5000} lines={5} error={errors.summary}
                  placeholder={'VD:\n• Hoàn thành 8 buổi hướng dẫn Java cơ bản\n• Học viên làm xong mini project quản lý sinh viên\n• Nắm vững OOP, Collection, xử lý ngoại lệ'} />
                <Field label="Đường dẫn / sản phẩm bàn giao" value={v('deliverables')} onChange={set('deliverables')} maxLength={2000} lines={2}
                  placeholder="VD: https://github.com/... , link Google Drive tài liệu, slide tổng kết." hint="Mỗi đường dẫn một dòng." />
                <Attachments label="Ảnh minh chứng" files={files} onAdd={addFile} onRemove={(i) => setFiles((a) => a.filter((_, j) => j !== i))} uploading={uploading} />
              </Section>
            </>
          ) : null}

          {/* ---------- Khiếu nại ---------- */}
          {type === 'dispute' ? (
            <>
              <Section title="Nội dung khiếu nại">
                <Field label="Tiêu đề" required multiline={false} value={v('title')} onChange={set('title')} maxLength={255} error={errors.title}
                  placeholder="VD: Mentor không tham gia buổi hẹn đã thống nhất" />
                <Field label="Lý do tranh chấp" required value={v('reason')} onChange={set('reason')} maxLength={255} lines={2} error={errors.reason}
                  placeholder="Chọn nhanh bên trên hoặc tự nhập."
                  chips={['Không đúng phạm vi đã thỏa thuận', 'Chậm tiến độ kéo dài', 'Không phản hồi / vắng mặt', 'Chất lượng không đạt cam kết']} />
                <Field label="Mô tả chi tiết sự việc" required value={v('description')} onChange={set('description')} minLength={20} maxLength={3000} lines={5} error={errors.description}
                  placeholder="Trình bày theo thời gian: đã thống nhất gì, điều gì đã xảy ra, hai bên đã trao đổi ra sao." />
                <Field label="Phương án mong muốn" required value={v('solution')} onChange={set('solution')} maxLength={255} lines={2} error={errors.solution}
                  chips={['Hoàn tiền toàn bộ', 'Hoàn tiền một phần', 'Tiếp tục với cam kết mới', 'Đổi mentor khác']} />
              </Section>
              <Section title="Bằng chứng">
                <Attachments label="Ảnh chụp tin nhắn, tài liệu..." files={files} onAdd={addFile} onRemove={(i) => setFiles((a) => a.filter((_, j) => j !== i))} uploading={uploading} />
              </Section>
            </>
          ) : null}

          {/* ---------- Đánh giá ---------- */}
          {type === 'review' ? (
            <Section>
              <View style={{ alignItems: 'center', marginBottom: 6 }}>
                <Txt size={14} weight="700" style={{ color: colors.text }}>{`Bạn thấy mentor ${d.mentor.fullName} thế nào?`}</Txt>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => { Haptics.selectionAsync(); setRating(n); setErrors((e) => ({ ...e, rating: '' })) }} accessibilityRole="button" accessibilityLabel={`${n} sao`} hitSlop={4} style={{ padding: 4 }}>
                      <Star size={40} color={n <= rating ? '#F59E0B' : colors.border} weight={n <= rating ? 'fill' : 'regular'} />
                    </Pressable>
                  ))}
                </View>
                <Txt size={13} weight="700" style={{ color: errors.rating ? '#DC2626' : rating ? viridian : colors.textTertiary, marginBottom: 14 }}>
                  {errors.rating || (rating ? RATING_LABEL[rating] : 'Chạm để chọn số sao')}
                </Txt>
              </View>
              <Field label="Nhận xét" value={v('comment')} onChange={set('comment')} maxLength={1000} lines={4}
                placeholder="Điều bạn thích nhất, điều mentor có thể làm tốt hơn..."
                chips={['Nhiệt tình, tận tâm', 'Giải thích dễ hiểu', 'Đúng giờ, đúng cam kết', 'Kiến thức thực tế', 'Phản hồi nhanh']} />
            </Section>
          ) : null}
        </ScrollView>

        <BottomBar>
          <Button
            title={meta.submit}
            textColor="#FFFFFF"
            icon={<Send size={16} color="#FFFFFF" weight="fill" />}
            onPress={submit}
            loading={m.isPending}
            disabled={uploading || (type === 'settlement-ticket' && !snapshot.data)}
            style={{ flex: 1, backgroundColor: viridian, borderColor: viridian }}
          />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 14 },
  section: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 14 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14.5, lineHeight: 22 },
  moneyBox: { flexDirection: 'row', alignItems: 'center', height: 52, paddingVertical: 0, gap: 8 },
  preset: { flex: 1, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  totalBox: { borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 16, gap: 2 },
  splitBar: { height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  alert: { padding: 12, borderRadius: 12, marginBottom: 14 },
  quote: { borderLeftWidth: 3, borderRadius: 8, padding: 12, marginTop: 12, marginBottom: 16 },
  thumb: { width: 76, height: 76, borderRadius: 14, overflow: 'hidden' },
  thumbRemove: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 6 },
})
