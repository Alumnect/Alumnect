import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Chip, Empty, Input, Loading, Screen, Txt } from './ui'
import * as DocumentPicker from 'expo-document-picker'
import { Header } from './Header'
import { DateField } from './DateField'
import { WORKING_MODE_LABEL, mentoringApi } from '@/api/mentoring'
import type { WorkingMode } from '@/api/mentoring'
import { REQUEST_TASK_TYPES, requestApi } from '@/api/mentoringFlow'
import { toast, errMsg } from '@/lib/toast'
import { groupApi } from '@/api/mentoringGroups'
import http, { type ApiResponse } from '@/lib/http'
import { useMentoringTheme } from '@/theme/mentoringTheme'
import { FileText, Paperclip, Send, Users, Wallet } from '@/components/icons'

/** UC90 (mentorId rỗng) và UC91 (gửi trực tiếp cho mentor) - Meetup x KakaoStory Form Design */
export function RequestForm({
  mentorId,
  mentorName,
  initialGroupId,
}: {
  mentorId?: number
  mentorName?: string
  initialGroupId?: number
}) {
  const { colors, viridian, viridianSoft, isDark } = useMentoringTheme()
  const router = useRouter()
  const terms = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const [f, setF] = useState({ title: '', description: '', budgetMin: '', budgetMax: '' })
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [taskType, setTaskType] = useState('CAREER_ORIENTATION')
  const [deadline, setDeadline] = useState('')
  const [participation, setParticipation] = useState<'INDIVIDUAL' | 'GROUP'>(initialGroupId ? 'GROUP' : 'INDIVIDUAL')
  const [groupId, setGroupId] = useState<number | null>(initialGroupId ?? null)
  const groups = useQuery({
    queryKey: ['mentoring-groups', 'managed'],
    queryFn: () => groupApi.mine('MANAGED'),
    enabled: participation === 'GROUP',
  })
  const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string; fileSize: number; fileType: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [key] = useState(() => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    if (terms.data && !terms.data.accepted) {
      toast.info('Vui lòng đồng ý Điều khoản Hướng dẫn & Hỗ trợ trước khi tạo yêu cầu.')
      router.replace('/mentoring/terms')
    }
  }, [terms.data, router])

  const m = useMutation({
    mutationFn: () => {
      const payload = {
        title: f.title.trim(),
        description: f.description.trim(),
        industryId: industryId!,
        workingMode: mode,
        participationType: participation,
        groupId: participation === 'GROUP' ? groupId : null,
        taskType,
        budgetMin: f.budgetMin ? Number(f.budgetMin) : null,
        budgetMax: f.budgetMax ? Number(f.budgetMax) : null,
        expectedDeadline: deadline || null,
        clientRequestKey: key,
        attachments,
      }
      return mentorId ? requestApi.createDirect(mentorId, payload) : requestApi.create(payload)
    },
    onSuccess: () => {
      toast.success(mentorId ? 'Đã gửi yêu cầu tới mentor!' : 'Đã tạo yêu cầu mentoring thành công!')
      router.replace('/mentoring/my-requests')
    },
    onError: (e) => toast.error(errMsg(e)),
  })

  const addAttachment = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true })
    if (picked.canceled) return
    if (picked.assets.length + attachments.length > 5) {
      toast.error('Chỉ được đính kèm tối đa 5 tệp tin')
      return
    }
    if (picked.assets.some((file) => !file.size || file.size >= 10 * 1024 * 1024)) {
      toast.error('Mỗi tệp phải lớn hơn 0 và nhỏ hơn 10 MB')
      return
    }
    setUploading(true)
    try {
      for (const file of picked.assets) {
        const fileType = file.mimeType ?? 'application/octet-stream'
        const signed = await http.get<unknown, ApiResponse<{ uploadUrl: string; publicUrl: string }>>(
          '/files/presigned-url',
          { params: { fileName: file.name, contentType: fileType, folder: 'mentorship/requests' } },
        )
        const blob = await (await fetch(file.uri)).blob()
        const put = await fetch(signed.data.uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': fileType } })
        if (!put.ok) throw new Error('Tải tệp lên thất bại. Vui lòng thử lại.')
        setAttachments((a) => [...a, { fileName: file.name, fileUrl: signed.data.publicUrl, fileSize: file.size!, fileType }])
      }
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setUploading(false)
    }
  }

  const submit = () => {
    const e: Record<string, string> = {}
    if (!f.title.trim()) e.title = 'Tiêu đề yêu cầu không được để trống'
    else if (f.title.trim().length < 5 || f.title.trim().length > 200) e.title = 'Tiêu đề yêu cầu phải từ 5 đến 200 ký tự'
    if (!f.description.trim()) e.description = 'Mô tả chi tiết không được để trống'
    else if (f.description.trim().length < 20 || f.description.trim().length > 3000) e.description = 'Mô tả chi tiết phải từ 20 đến 3000 ký tự'
    if (!industryId) e.industry = 'Lĩnh vực cần hỗ trợ không được để trống'
    if (participation === 'GROUP' && !groups.data?.some((g) => g.id === groupId && g.canManage && g.status === 'ACTIVE'))
      e.group = 'Vui lòng chọn nhóm bạn đang quản lý'
    if (f.budgetMin && f.budgetMax && Number(f.budgetMin) > Number(f.budgetMax))
      e.budget = 'Ngân sách tối thiểu không được lớn hơn tối đa'
    if (deadline && new Date(deadline).getTime() <= Date.now())
      e.deadline = 'Thời hạn mong muốn phải ở trong tương lai'
    setErrors(e)
    if (!Object.keys(e).length) m.mutate()
  }

  if (terms.isLoading)
    return (
      <Screen bg={colors.bg}>
        <Header title="Tạo yêu cầu" />
        <Loading />
      </Screen>
    )
  if (terms.isError || industries.isError)
    return (
      <Screen bg={colors.bg}>
        <Header title="Tạo yêu cầu" />
        <Empty
          title="Không thể tải biểu mẫu"
          text="Vui lòng thử lại."
          error={terms.error ?? industries.error}
          onRetry={() => {
            void terms.refetch()
            void industries.refetch()
          }}
        />
      </Screen>
    )

  return (
    <Screen bg={colors.bg}>
      <Header title={mentorId ? 'Gửi yêu cầu cho Mentor' : 'Tạo yêu cầu Mentoring'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          {/* Target Mentor Header Banner */}
          {mentorName ? (
            <View style={[styles.targetCard, { backgroundColor: viridianSoft, borderColor: viridian }]}>
              <Txt size={12} weight="600" style={{ color: viridian }}>
                Người nhận yêu cầu:
              </Txt>
              <Txt size={16} weight="800" style={{ color: viridian, marginTop: 2 }}>
                {mentorName}
              </Txt>
            </View>
          ) : null}

          {/* Section 1: Hình thức tham gia */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Users size={16} color={viridian} />
              <Txt weight="700" size={14} style={{ color: colors.text }}>
                Hình thức tham gia
              </Txt>
            </View>
            <View style={styles.chipRow}>
              <Chip label="Cá nhân (1:1)" active={participation === 'INDIVIDUAL'} onPress={() => setParticipation('INDIVIDUAL')} />
              <Chip label="Theo nhóm" active={participation === 'GROUP'} onPress={() => setParticipation('GROUP')} />
            </View>

            {participation === 'GROUP' ? (
              <View style={{ marginTop: 12 }}>
                <Txt weight="600" size={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
                  Chọn nhóm bạn đại diện
                </Txt>
                {groups.isLoading ? (
                  <Loading />
                ) : groups.isError ? (
                  <Button title="Thử tải lại nhóm" variant="outline" onPress={() => void groups.refetch()} />
                ) : (
                  (groups.data ?? [])
                    .filter((g) => g.canManage && g.status === 'ACTIVE')
                    .map((g) => <Chip key={g.id} label={g.name} active={groupId === g.id} onPress={() => setGroupId(g.id)} />)
                )}
                {errors.group ? <Txt color="#EF4444" size={12} style={{ marginTop: 4 }}>{errors.group}</Txt> : null}
                <Button title="+ Tạo nhóm mới" variant="ghost" onPress={() => router.push('/mentoring/groups/create')} />
              </View>
            ) : null}
          </View>

          {/* Section 2: Nội dung & Mục tiêu */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <FileText size={16} color={viridian} />
              <Txt weight="700" size={14} style={{ color: colors.text }}>
                Nội dung trao đổi
              </Txt>
            </View>
            <Input
              label="Tiêu đề yêu cầu"
              placeholder="VD: Cố vấn định hướng nghề nghiệp Mobile Developer..."
              value={f.title}
              onChangeText={set('title')}
              error={errors.title}
            />
            <Input
              label="Mô tả chi tiết vấn đề & mong muốn của bạn"
              placeholder="Chia sẻ rõ hoàn cảnh, khó khăn hiện tại và những gì bạn cần mentor hướng dẫn..."
              value={f.description}
              onChangeText={set('description')}
              multiline
              numberOfLines={4}
              error={errors.description}
            />
          </View>

          {/* Section 3: Lĩnh vực & Loại hỗ trợ */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Txt weight="700" size={14} style={{ color: colors.text, marginBottom: 8 }}>
              Lĩnh vực chuyên môn
            </Txt>
            <View style={styles.chipWrap}>
              {(industries.data ?? []).map((i) => (
                <Chip key={i.id} label={i.name} active={industryId === i.id} onPress={() => setIndustryId(i.id)} />
              ))}
            </View>
            {errors.industry ? <Txt size={12} color="#EF4444" style={{ marginTop: 4 }}>{errors.industry}</Txt> : null}

            <Txt weight="700" size={14} style={{ color: colors.text, marginTop: 16, marginBottom: 8 }}>
              Loại hỗ trợ mong muốn
            </Txt>
            <View style={styles.chipWrap}>
              {REQUEST_TASK_TYPES.map((t) => (
                <Chip key={t.value} label={t.label} active={taskType === t.value} onPress={() => setTaskType(t.value)} />
              ))}
            </View>

            <Txt weight="700" size={14} style={{ color: colors.text, marginTop: 16, marginBottom: 8 }}>
              Hình thức làm việc
            </Txt>
            <View style={styles.chipWrap}>
              {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => (
                <Chip key={k} label={WORKING_MODE_LABEL[k]} active={mode === k} onPress={() => setMode(k)} />
              ))}
            </View>
          </View>

          {/* Section 4: Ngân sách & Thời hạn */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Wallet size={16} color={viridian} />
              <Txt weight="700" size={14} style={{ color: colors.text }}>
                Dự toán ngân sách & Thời hạn
              </Txt>
            </View>
            <Input
              label="Ngân sách tối thiểu (VND)"
              placeholder="VD: 100000"
              value={f.budgetMin}
              onChangeText={(v) => set('budgetMin')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <Input
              label="Ngân sách tối đa (VND)"
              placeholder="VD: 500000"
              value={f.budgetMax}
              onChangeText={(v) => set('budgetMax')(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
              error={errors.budget}
            />
            <DateField label="Thời hạn mong muốn hoàn thành (tùy chọn)" value={deadline} onChange={setDeadline} error={errors.deadline} />
          </View>

          {/* Section 5: Tài liệu đính kèm */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Paperclip size={16} color={viridian} />
              <Txt weight="700" size={14} style={{ color: colors.text }}>
                Tài liệu đính kèm ({attachments.length}/5)
              </Txt>
            </View>
            {attachments.map((a, i) => (
              <View key={a.fileUrl} style={[styles.attachmentRow, { backgroundColor: colors.surface }]}>
                <Txt numberOfLines={1} size={13} style={{ flex: 1, color: colors.text }}>
                  📎 {a.fileName}
                </Txt>
                <Button
                  title="Xóa"
                  variant="ghost"
                  onPress={() => setAttachments((files) => files.filter((_, j) => j !== i))}
                />
              </View>
            ))}
            <Button
              title="Thêm tài liệu (CV, bài tập, đề tài)"
              variant="outline"
              disabled={attachments.length >= 5 || m.isPending}
              loading={uploading}
              onPress={() => void addAttachment()}
              style={{ marginTop: 6 }}
            />
          </View>

          {/* Action CTA: Nút gửi yêu cầu sáng rõ, nổi bật */}
          <Button
            title="Gửi yêu cầu Mentoring"
            textColor="#FFFFFF"
            icon={<Send size={16} color="#FFFFFF" />}
            onPress={submit}
            loading={m.isPending}
            disabled={uploading || !terms.data?.accepted}
            style={{
              backgroundColor: terms.data?.accepted ? (isDark ? '#00A3BA' : '#008294') : colors.border,
              marginTop: 10,
              shadowColor: '#00A3BA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.4 : 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16,
    paddingBottom: 48,
  },
  targetCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  formCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 8,
  },
})
