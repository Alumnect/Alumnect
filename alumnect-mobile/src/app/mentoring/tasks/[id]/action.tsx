import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Star } from '@/components/icons'
import { Button, Card, Input, Loading, Screen, Txt } from '@/components/ui'
import { Header } from '@/components/Header'
import { DateField } from '@/components/DateField'
import { formatVnd } from '@/api/mentoring'
import { taskApi } from '@/api/mentoringTask'
import type { WorkLogPayload } from '@/api/mentoringTask'
import { pickImage, uploadImage } from '@/lib/upload'
import { toast, errMsg } from '@/lib/toast'
import { palette } from '@/theme'

const TITLES: Record<string, string> = {
  worklog: 'Nhật ký công việc', extension: 'Đề xuất gia hạn', amendment: 'Điều chỉnh task', settlement: 'Đề xuất hòa giải',
  'settlement-ticket': 'Gửi biên bản hòa giải', completion: 'Nộp kết quả', dispute: 'Tạo ticket khiếu nại', review: 'Đánh giá mentor',
}

const today = () => new Date().toISOString().slice(0, 10)

/** Form dùng chung cho các hành động của task: UC97, 99, 100, 101, 102, 112. */
export default function TaskActionScreen() {
  const router = useRouter()
  const qc = useQueryClient()
  const { id, type, workLogId } = useLocalSearchParams<{ id: string; type: string; workLogId?: string }>()
  const tid = Number(id)
  const task = useQuery({ queryKey: ['mentoring-task', tid], queryFn: () => taskApi.detail(tid) })
  const snapshot = useQuery({ queryKey: ['settlement-snapshot', tid], queryFn: () => taskApi.settlementSnapshot(tid), enabled: type === 'settlement-ticket' })

  const [f, setF] = useState<Record<string, string>>({})
  const [date, setDate] = useState('')
  const [rating, setRating] = useState(0)
  const [files, setFiles] = useState<{ fileUrl: string; fileName: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loaded, setLoaded] = useState(false)
  const set = (k: string) => (v: string) => setF((p) => ({ ...p, [k]: v }))
  const num = (k: string) => (f[k] ? Number(f[k]) : 0)

  const existing = workLogId ? task.data?.workLogs.find((w) => w.id === Number(workLogId)) : undefined
  if (existing && !loaded) {
    setLoaded(true)
    setF({ description: existing.description, workCompleted: existing.workCompleted, result: existing.result, nextAction: existing.nextAction ?? '' })
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
    try { const url = await uploadImage(img, type === 'dispute' ? 'evidence' : 'common'); setFiles((x) => [...x, { fileUrl: url, fileName: img.name }]) }
    catch (e) { toast.error(errMsg(e)) } finally { setUploading(false) }
  }

  const m = useMutation({
    mutationFn: async () => {
      const urls = files.filter((x) => x.fileUrl)
      switch (type) {
        case 'worklog': {
          const p: WorkLogPayload = { logDate: date || today(), description: f.description.trim(), workCompleted: f.workCompleted.trim(), result: f.result.trim(), nextAction: f.nextAction?.trim() || undefined, attachments: urls.map((u) => ({ fileUrl: u.fileUrl, fileName: u.fileName, mediaType: 'IMAGE' as const })) }
          return workLogId ? taskApi.updateWorkLog(tid, Number(workLogId), p) : taskApi.createWorkLog(tid, p)
        }
        case 'extension': return taskApi.createExtension(tid, { proposedDeadline: date, reason: f.reason.trim() })
        case 'amendment': return taskApi.createAmendment(tid, { newScope: f.newScope?.trim() || undefined, newExpectedResult: f.newResult?.trim() || undefined, additionalAmount: f.amount ? Number(f.amount) : undefined, newDeadline: date || undefined, reason: f.reason.trim() })
        case 'settlement': return taskApi.createSettlementProposal(tid, { mentorAmount: num('mentor'), studentRefund: num('refund'), reason: f.reason.trim() })
        case 'settlement-ticket': return taskApi.submitSettlementTicket(tid, { proposalId: snapshot.data!.settlementProposalId, note: f.note?.trim() || undefined })
        case 'completion': return taskApi.submitCompletion(tid, { finalSummary: f.summary.trim(), deliverables: f.deliverables?.trim() || undefined, attachmentUrls: urls.map((u) => u.fileUrl) })
        case 'dispute': return taskApi.createDispute(tid, { title: f.title.trim(), disputeReason: f.reason.trim(), description: f.description.trim(), desiredSolution: f.solution.trim(), initialEvidences: urls.map((u) => ({ fileUrl: u.fileUrl, fileName: u.fileName, title: u.fileName })) })
        case 'review': return taskApi.review({ taskId: tid, rating, comment: f.comment?.trim() || undefined })
        default: throw new Error('Hành động không hợp lệ')
      }
    },
    onSuccess: () => done(
      { worklog: workLogId ? 'Đã cập nhật nhật ký.' : 'Đã thêm nhật ký công việc.', extension: 'Đã gửi đề xuất gia hạn.', amendment: 'Đã gửi đề xuất điều chỉnh.', settlement: 'Đã gửi đề xuất hòa giải.', 'settlement-ticket': 'Đã gửi biên bản hòa giải.', completion: 'Đã nộp kết quả task.', dispute: 'Đã tạo ticket khiếu nại.', review: 'Cảm ơn bạn đã đánh giá mentor!' }[type!] ?? 'Thành công',
    ),
    onError: (e) => toast.error(errMsg(e)),
  })

  const submit = () => {
    const e: Record<string, string> = {}
    const req = (k: string, msg: string, min = 1) => { if ((f[k] ?? '').trim().length < min) e[k] = msg }
    if (type === 'worklog') { req('description', 'Mô tả không được để trống'); req('workCompleted', 'Công việc đã hoàn thành không được để trống'); req('result', 'Kết quả không được để trống') }
    if (type === 'extension') { req('reason', 'Lý do gia hạn không được để trống'); if (!date || new Date(date).getTime() <= Date.now()) e.date = 'Hạn mới phải ở trong tương lai' }
    if (type === 'amendment') { req('reason', 'Lý do điều chỉnh không được để trống'); if (!f.newScope && !f.newResult && !f.amount && !date) e.newScope = 'Cần thay đổi ít nhất một nội dung' }
    if (type === 'settlement') { req('reason', 'Lý do không được để trống'); if (!f.mentor && !f.refund) e.mentor = 'Nhập số tiền chia cho mentor và/hoặc hoàn cho sinh viên' }
    if (type === 'completion') req('summary', 'Tóm tắt kết quả không được để trống', 10)
    if (type === 'dispute') { req('title', 'Tiêu đề không được để trống'); req('reason', 'Lý do tranh chấp không được để trống'); req('description', 'Mô tả không được để trống'); req('solution', 'Giải pháp mong muốn không được để trống') }
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

  if (task.isLoading) return <Screen><Header title={TITLES[type!] ?? 'Task'} /><Loading /></Screen>

  return (
    <Screen>
      <Header title={TITLES[type!] ?? 'Task'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {type === 'worklog' ? (<><DateField label="Ngày làm việc" value={date} onChange={setDate} />{field('description', "Mô tả")}{field('workCompleted', "Công việc đã hoàn thành")}{field('result', "Kết quả đạt được")}{field('nextAction', "Việc tiếp theo (tùy chọn)")}</>) : null}
          {type === 'extension' ? (<><DateField label="Hạn chót mới" value={date} onChange={setDate} error={errors.date} />{field('reason', "Lý do")}</>) : null}
          {type === 'amendment' ? (<>{field('newScope', "Phạm vi mới (tùy chọn)")}{field('newResult', "Kết quả kỳ vọng mới (tùy chọn)")}{money('amount', "Chi phí phát sinh thêm (VND)")}<DateField label="Hạn chót mới (tùy chọn)" value={date} onChange={setDate} />{field('reason', "Lý do")}</>) : null}
          {type === 'settlement' ? (<><Txt muted size={13} style={{ marginBottom: 8 }}>Tổng ngân sách task: {formatVnd(task.data?.overview.agreedPrice)}</Txt>{money('mentor', "Mentor nhận (VND)")}{money('refund', "Hoàn cho sinh viên (VND)")}{field('reason', "Lý do")}</>) : null}
          {type === 'settlement-ticket' ? (
            snapshot.isLoading ? <Loading /> : snapshot.data ? (
              <>
                <Card style={{ marginBottom: 12 }}>
                  <Txt weight="700">{snapshot.data.taskTitle}</Txt>
                  <Txt>Mentor nhận: {formatVnd(snapshot.data.mentorAmount)}</Txt>
                  <Txt>Sinh viên hoàn: {formatVnd(snapshot.data.studentRefund)}</Txt>
                  <Txt muted size={13}>Lý do: {snapshot.data.reason}</Txt>
                </Card>
                {field('note', "Ghi chú cho quản trị viên (tùy chọn)")}
              </>
            ) : <Txt muted>Không có thỏa thuận hòa giải để gửi.</Txt>
          ) : null}
          {type === 'completion' ? (<>{field('summary', "Tóm tắt kết quả")}{field('deliverables', "Sản phẩm bàn giao (tùy chọn)")}</>) : null}
          {type === 'dispute' ? (<>{field('title', "Tiêu đề", false)}{field('reason', "Lý do tranh chấp")}{field('description', "Mô tả chi tiết")}{field('solution', "Giải pháp mong muốn")}</>) : null}
          {type === 'review' ? (
            <>
              <Txt weight="600" size={13} style={{ marginBottom: 6 }}>Chất lượng hướng dẫn</Txt>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => <Pressable key={n} onPress={() => setRating(n)} accessibilityRole="button" accessibilityLabel={`${n} sao`}><Star size={36} color={palette.star} fill={n <= rating ? palette.star : 'transparent'} /></Pressable>)}
              </View>
              {errors.rating ? <Txt size={12} color={palette.danger} style={{ marginBottom: 8 }}>{errors.rating}</Txt> : null}
              {field('comment', "Nhận xét (tùy chọn)")}
            </>
          ) : null}

          {showFiles ? (
            <View style={{ marginBottom: 12 }}>
              {files.map((x, i) => <Txt key={i} muted size={13}>• {x.fileName}</Txt>)}
              <Button title="Đính kèm ảnh" variant="outline" onPress={addFile} loading={uploading} style={{ marginTop: 6 }} />
            </View>
          ) : null}
          <Button title="Gửi" onPress={submit} loading={m.isPending} disabled={uploading || (type === 'settlement-ticket' && !snapshot.data)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
