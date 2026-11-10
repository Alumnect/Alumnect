import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ImagePlus, Send, Star, X } from '@/components/icons'
import { Button, Card, Empty, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DateField } from '@/components/DateField'
import { formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { WorkLogPayload } from '@/api/mentoringTask'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { buildDemoTaskDetail } from './index'

const TITLES: Record<string, string> = {
  worklog: 'Nhật ký công việc',
  extension: 'Đề xuất gia hạn',
  amendment: 'Điều chỉnh nhiệm vụ',
  settlement: 'Đề xuất hòa giải',
  'settlement-ticket': 'Gửi biên bản hòa giải',
  completion: 'Nộp kết quả bàn giao',
  dispute: 'Tạo ticket khiếu nại',
  review: 'Đánh giá Mentor',
}

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Form dùng chung cho các hành động của task: UC97, 99, 100, 101, 102, 112 (Meetup x Kakao Form Design). */
export default function TaskActionScreen() {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  const router = useRouter()
  const qc = useQueryClient()
  const { id, type, workLogId } = useLocalSearchParams<{ id: string; type: string; workLogId?: string }>()
  const tid = Number(id)
  const task = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const snapshot = useQuery({
    queryKey: ['settlement-snapshot', tid],
    queryFn: () => taskApi.settlementSnapshot(tid),
    enabled: type === 'settlement-ticket',
  })

  const [f, setF] = useState<Record<string, string>>({})
  const [date, setDate] = useState('')
  const [rating, setRating] = useState(0)
  const [files, setFiles] = useState<{ fileUrl: string; fileName: string; mediaType?: 'IMAGE' | 'VIDEO' | 'FILE'; fileSize?: number | null }[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }))
  const num = (k: string) => (f[k] ? Number(f[k]) : 0)

  const currentTask = task.data ?? buildDemoTaskDetail(tid, false)

  const existing = workLogId ? currentTask?.workLogs.find((w) => w.id === Number(workLogId)) : undefined
  if (existing && !loaded) {
    setLoaded(true)
    setF({
      description: existing.description,
      workCompleted: existing.workCompleted,
      result: existing.result,
      nextAction: existing.nextAction ?? '',
    })
    setDate(existing.logDate)
    setFiles(
      existing.attachments.map((a) => ({
        fileUrl: a.fileUrl,
        fileName: a.fileName,
        mediaType: a.mediaType,
        ...(a.fileSize != null ? { fileSize: a.fileSize } : {}),
      })),
    )
  }

  const done = (msg: string) => {
    toast.success(msg)
    qc.invalidateQueries({ queryKey: ['mentoring-task', tid] })
    qc.invalidateQueries({ queryKey: ['mentoring-tasks'] })
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
            description: f.description.trim(),
            workCompleted: f.workCompleted.trim(),
            result: f.result.trim(),
            nextAction: f.nextAction?.trim() || undefined,
            attachments: urls.map((u) => ({ ...u, mediaType: u.mediaType ?? 'IMAGE' })),
          }
          return workLogId ? taskApi.updateWorkLog(tid, Number(workLogId), p) : taskApi.createWorkLog(tid, p)
        }
        case 'extension':
          return taskApi.createExtension(tid, { proposedDeadline: date, reason: f.reason.trim() })
        case 'amendment':
          return taskApi.createAmendment(tid, {
            newScope: f.newScope?.trim() || undefined,
            newExpectedResult: f.newResult?.trim() || undefined,
            additionalAmount: f.amount ? Number(f.amount) : undefined,
            newDeadline: date || undefined,
            reason: f.reason.trim(),
          })
        case 'settlement':
          return taskApi.createSettlementProposal(tid, {
            mentorAmount: num('mentor'),
            studentRefund: num('refund'),
            reason: f.reason.trim(),
          })
        case 'settlement-ticket':
          return taskApi.submitSettlementTicket(tid, {
            proposalId: snapshot.data!.settlementProposalId,
            note: f.note?.trim() || undefined,
          })
        case 'completion':
          return taskApi.submitCompletion(tid, {
            finalSummary: f.summary.trim(),
            deliverables: f.deliverables?.trim() || undefined,
            attachmentUrls: urls.map((u) => u.fileUrl),
          })
        case 'dispute':
          return taskApi.createDispute(tid, {
            title: f.title.trim(),
            disputeReason: f.reason.trim(),
            description: f.description.trim(),
            desiredSolution: f.solution.trim(),
            initialEvidences: urls.map((u) => ({ fileUrl: u.fileUrl, fileName: u.fileName, title: u.fileName })),
          })
        case 'review':
          return taskApi.review({ taskId: tid, rating, comment: f.comment?.trim() || undefined })
        default:
          throw new Error('Hành động không hợp lệ')
      }
    },
    onSuccess: () =>
      done(
        {
          worklog: workLogId ? 'Đã cập nhật nhật ký.' : 'Đã thêm nhật ký công việc.',
          extension: 'Đã gửi đề xuất gia hạn.',
          amendment: 'Đã gửi đề xuất điều chỉnh.',
          settlement: 'Đã gửi đề xuất hòa giải.',
          'settlement-ticket': 'Đã gửi biên bản hòa giải.',
          completion: 'Đã nộp kết quả task.',
          dispute: 'Đã tạo ticket khiếu nại.',
          review: 'Cảm ơn bạn đã đánh giá mentor!',
        }[type!] ?? 'Thành công',
      ),
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    const req = (k: string, msg: string, min = 1) => {
      if ((f[k] ?? '').trim().length < min) e[k] = msg
    }
    if (type === 'worklog') {
      req('description', 'Mô tả không được để trống')
      req('workCompleted', 'Công việc đã hoàn thành không được để trống')
      req('result', 'Kết quả không được để trống')
    }
    if (type === 'extension') {
      req('reason', 'Lý do gia hạn không được để trống')
      if (!date || new Date(date).getTime() <= Date.now()) e.date = 'Hạn mới phải ở trong tương lai'
    }
    if (type === 'amendment') {
      req('reason', 'Lý do điều chỉnh không được để trống')
      if (!f.newScope && !f.newResult && !f.amount && !date) e.newScope = 'Cần thay đổi ít nhất một nội dung'
    }
    if (type === 'settlement') {
      req('reason', 'Lý do không được để trống')
      if (!f.mentor && !f.refund) e.mentor = 'Nhập số tiền chia cho mentor và/hoặc hoàn cho sinh viên'
    }
    if (type === 'completion') req('summary', 'Tóm tắt kết quả không được để trống', 10)
    if (type === 'dispute') {
      req('title', 'Tiêu đề không được để trống')
      req('reason', 'Lý do tranh chấp không được để trống')
      req('description', 'Mô tả không được để trống')
      req('solution', 'Giải pháp mong muốn không được để trống')
    }
    if (type === 'review' && rating < 1) e.rating = 'Số sao đánh giá không được để trống'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  const showFiles = type === 'worklog' || type === 'completion' || type === 'dispute'
  const money = (k: string, label: string) => (
    <Input label={label} value={f[k] ?? ''} onChangeText={(v) => set(k)(v.replace(/\D/g, ''))} keyboardType="number-pad" error={errors[k]} />
  )
  const field = (k: string, label: string, multiline = true) => (
    <Input label={label} value={f[k] ?? ''} onChangeText={set(k)} multiline={multiline} error={errors[k]} />
  )

  if (task.isLoading && !currentTask)
    return (
      <Screen bg={colors.bg}>
        <Header title={TITLES[type!] ?? 'Task'} />
        <Loading />
      </Screen>
    )
  if (!currentTask)
    return (
      <Screen bg={colors.bg}>
        <Header title={TITLES[type!] ?? 'Task'} />
        <Empty text="Không tìm thấy task." error={task.error} onRetry={() => { void task.refetch() }} />
      </Screen>
    )
  if (workLogId && !existing)
    return (
      <Screen bg={colors.bg}>
        <Header title="Nhật ký công việc" />
        <Empty text="Không tìm thấy nhật ký công việc." />
      </Screen>
    )

  return (
    <Screen bg={colors.bg}>
      <Header title={TITLES[type!] ?? 'Thao tác nhiệm vụ'} subtitle={currentTask.overview.taskTitle} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {type === 'worklog' ? (
              <>
                <DateField label="Ngày làm việc" value={date} onChange={setDate} minimumDate={null} />
                {field('description', 'Mô tả nội dung buổi làm việc')}
                {field('workCompleted', 'Công việc đã hoàn thành')}
                {field('result', 'Kết quả đạt được')}
                {field('nextAction', 'Kế hoạch buổi tiếp theo (tùy chọn)')}
              </>
            ) : null}

            {type === 'extension' ? (
              <>
                <DateField label="Đề xuất hạn chót mới" value={date} onChange={setDate} error={errors.date} />
                {field('reason', 'Lý do xin gia hạn')}
              </>
            ) : null}

            {type === 'amendment' ? (
              <>
                {field('newScope', 'Phạm vi công việc mới (tùy chọn)')}
                {field('newResult', 'Kết quả kỳ vọng mới (tùy chọn)')}
                {money('amount', 'Chi phí phát sinh thêm (VND)')}
                <DateField label="Hạn chót mới (tùy chọn)" value={date} onChange={setDate} />
                {field('reason', 'Lý do điều chỉnh')}
              </>
            ) : null}

            {type === 'settlement' ? (
              <>
                <View style={[styles.budgetBanner, { backgroundColor: viridianSoft }]}>
                  <Txt size={12} weight="700" style={{ color: viridian }}>
                    Tổng ngân sách thỏa thuận: {formatVnd(task.data?.overview.agreedPrice)}
                  </Txt>
                </View>
                {money('mentor', 'Số tiền Mentor nhận (VND)')}
                {money('refund', 'Số tiền hoàn lại cho Sinh viên (VND)')}
                {field('reason', 'Lý do đề xuất dừng & hòa giải')}
              </>
            ) : null}

            {type === 'settlement-ticket' ? (
              snapshot.isLoading ? (
                <Loading />
              ) : snapshot.data ? (
                <>
                  <Card style={{ marginBottom: 14, backgroundColor: colors.surface }}>
                    <Txt weight="800" size={15}>{snapshot.data.taskTitle}</Txt>
                    <Txt size={13} style={{ marginTop: 4 }}>Mentor nhận: <Txt weight="700" color={viridian}>{formatVnd(snapshot.data.mentorAmount)}</Txt></Txt>
                    <Txt size={13}>Sinh viên hoàn: <Txt weight="700" color={viridian}>{formatVnd(snapshot.data.studentRefund)}</Txt></Txt>
                    <Txt muted size={13} style={{ marginTop: 2 }}>Lý do: {snapshot.data.reason}</Txt>
                  </Card>
                  {field('note', 'Ghi chú gửi Ban Quản Trị (tùy chọn)')}
                </>
              ) : (
                <Txt muted>Không có thỏa thuận hòa giải để gửi.</Txt>
              )
            ) : null}

            {type === 'completion' ? (
              <>
                {field('summary', 'Tóm tắt kết quả hoàn thành (tối thiểu 10 ký tự)')}
                {field('deliverables', 'Đường dẫn / sản phẩm bàn giao (tùy chọn)')}
              </>
            ) : null}

            {type === 'dispute' ? (
              <>
                {field('title', 'Tiêu đề khiếu nại', false)}
                {field('reason', 'Lý do tranh chấp')}
                {field('description', 'Mô tả chi tiết sự việc')}
                {field('solution', 'Giải pháp / phương án xử lý mong muốn')}
              </>
            ) : null}

            {type === 'review' ? (
              <>
                <Txt weight="800" size={15} style={{ color: colors.text, marginBottom: 10, textAlign: 'center' }}>
                  Đánh giá chất lượng hướng dẫn của Mentor
                </Txt>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setRating(n)}
                      accessibilityRole="button"
                      accessibilityLabel={`${n} sao`}
                      style={{ padding: 4 }}
                    >
                      <Star size={38} color={viridian} fill={n <= rating ? viridian : 'transparent'} />
                    </Pressable>
                  ))}
                </View>
                {errors.rating ? (
                  <Txt size={12} color="#DC2626" style={{ marginBottom: 10, textAlign: 'center' }}>
                    {errors.rating}
                  </Txt>
                ) : null}
                {field('comment', 'Chia sẻ trải nghiệm & nhận xét của bạn (tùy chọn)')}
              </>
            ) : null}

            {showFiles ? (
              <View style={{ marginBottom: 12 }}>
                {files.map((x, i) => (
                  <View key={i} style={[styles.fileRow, { backgroundColor: colors.surface }]}>
                    <Txt size={13} weight="600" style={{ flex: 1, color: colors.text }} numberOfLines={1}>
                      📎 {x.fileName}
                    </Txt>
                    <Pressable onPress={() => setFiles((arr) => arr.filter((_, j) => j !== i))} hitSlop={8}>
                      <X size={15} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                ))}
                <Button
                  title="Đính kèm hình ảnh minh chứng"
                  variant="outline"
                  size="sm"
                  icon={<ImagePlus size={16} color={colors.text} />}
                  onPress={addFile}
                  loading={uploading}
                  style={{ marginTop: 6 }}
                />
              </View>
            ) : null}

            <Button
              title="Xác nhận & Gửi"
              textColor="#FFFFFF"
              icon={<Send size={16} color="#FFFFFF" weight="fill" />}
              onPress={submit}
              loading={m.isPending}
              disabled={uploading || (type === 'settlement-ticket' && !snapshot.data)}
              style={{ backgroundColor: viridian, borderColor: viridian, marginTop: 6 }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  budgetBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
})
