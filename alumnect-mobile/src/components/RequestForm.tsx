import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { ScrollView } from '@/components/ScrollView'
import { useRouter } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Empty, Input, Loading, Screen, Txt } from './ui'
import { BrandIcon, type BrandIconName } from './BrandIcon'
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
import { Check, FileText, Paperclip, Plus, Send, X } from '@/components/icons'

/** Chip lựa chọn theo phong cách MeetupChip (Core.kt) x Kakao (Tone Cam - Đen - Trắng) */
function FormChip({
  label,
  active,
  onPress,
}: {
  label: string
  active?: boolean
  onPress: () => void
}) {
  const { colors, viridian, isDark } = useMentoringTheme()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        styles.formChip,
        {
          backgroundColor: active ? (isDark ? viridian : colors.actionBg) : colors.surface,
          borderColor: active ? (isDark ? viridian : colors.actionBg) : colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      {active && <Check size={13} color={isDark ? '#FFFFFF' : colors.actionText} weight="bold" />}
      <Txt
        size={13}
        weight={active ? '700' : '500'}
        style={{ color: active ? (isDark ? '#FFFFFF' : colors.actionText) : colors.text }}
      >
        {label}
      </Txt>
    </Pressable>
  )
}

function StepBadge({
  step,
  title,
  subtitle,
  brandIcon,
  done,
  active,
}: {
  step: string
  title: string
  subtitle?: string
  brandIcon: BrandIconName
  done?: boolean
  active?: boolean
}) {
  const { colors, viridian, viridianSoft } = useMentoringTheme()
  return (
    <View style={styles.sectionHeaderRow}>
      <View
        style={[
          styles.brandIconBox,
          {
            backgroundColor: viridianSoft,
            borderWidth: active || done ? 1 : 0,
            borderColor: viridian,
          },
        ]}
      >
        <BrandIcon name={brandIcon} size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={[
              styles.stepPill,
              {
                backgroundColor: done ? viridian : active ? viridianSoft : colors.surface,
                borderWidth: active && !done ? 1 : 0,
                borderColor: viridian,
              },
            ]}
          >
            <Txt size={10} weight="800" style={{ color: done ? '#FFFFFF' : active ? viridian : colors.textSecondary }}>
              {done ? `✓ BƯỚC ${step}` : `BƯỚC ${step}`}
            </Txt>
          </View>
          <Txt weight="800" size={15} style={{ color: colors.text, flex: 1 }} numberOfLines={1}>
            {title}
          </Txt>
        </View>
        {subtitle ? (
          <Txt size={11} style={{ color: colors.textTertiary, marginTop: 2 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
    </View>
  )
}

/** UC90 (mentorId rỗng) và UC91 (gửi trực tiếp cho mentor) - Meetup x Instagram x Kakao 2026 Form Design */
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
  const insets = useSafeAreaInsets()
  const terms = useQuery({ queryKey: ['mentoring-terms'], queryFn: mentoringApi.termsStatus })
  const industries = useQuery({ queryKey: ['mentoring-industries'], queryFn: mentoringApi.industries })
  const [f, setF] = useState({ title: '', description: '', budgetMin: '', budgetMax: '' })
  const [industryId, setIndustryId] = useState<number | null>(null)
  const [mode, setMode] = useState<WorkingMode>('ONLINE')
  const [taskType, setTaskType] = useState('CAREER_ORIENTATION')
  const [deadline, setDeadline] = useState('')
  const [participation, setParticipation] = useState<'INDIVIDUAL' | 'GROUP'>(initialGroupId ? 'GROUP' : 'INDIVIDUAL')
  const [groupId, setGroupId] = useState<number | null>(initialGroupId ?? null)
  const [activeStep, setActiveStep] = useState<number>(1)

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
    setActiveStep(5)
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

  const hasContentInput = f.title.trim().length > 0 || f.description.trim().length > 0
  const isContentComplete = f.title.trim().length > 0 && f.description.trim().length > 0

  const steps = [
    { num: 1, idx: '01', label: 'Hình thức', done: participation === 'INDIVIDUAL' || Boolean(groupId), active: activeStep === 1 },
    { num: 2, idx: '02', label: 'Nội dung', done: isContentComplete, active: activeStep === 2 || hasContentInput },
    { num: 3, idx: '03', label: 'Chuyên môn', done: Boolean(industryId), active: activeStep === 3 },
    { num: 4, idx: '04', label: 'Ngân sách', done: Boolean(f.budgetMin || f.budgetMax || deadline), active: activeStep === 4 },
    { num: 5, idx: '05', label: 'Tài liệu', done: attachments.length > 0, active: activeStep === 5 },
  ]

  return (
    <Screen keyboard bg={colors.bg}>
      <Header
        title={mentorId ? 'Gửi yêu cầu trực tiếp' : 'Tạo yêu cầu Cố vấn'}
        subtitle={mentorName ? `Gửi tới ${mentorName}` : 'Hệ thống tự động ghép nối mentor phù hợp'}
      />

      {/* Kakao / Instagram 5-Column Connected Stepper (Không bao giờ chèn chữ hay tràn lề) */}
      <View style={[styles.stepperContainer, { backgroundColor: colors.card, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.stepperRow}>
          {steps.map((s, i) => {
            const lit = s.done || s.active
            return (
              <React.Fragment key={s.idx}>
                <View style={styles.stepCol}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: s.done ? viridian : s.active ? viridianSoft : colors.surface,
                        borderColor: lit ? viridian : colors.border,
                        borderWidth: s.active && !s.done ? 2 : 1,
                      },
                    ]}
                  >
                    {s.done ? (
                      <Check size={12} color="#FFFFFF" weight="bold" />
                    ) : (
                      <Txt size={10} weight="800" style={{ color: lit ? viridian : colors.textTertiary }}>
                        {s.idx}
                      </Txt>
                    )}
                  </View>
                  <Txt
                    size={10}
                    weight={lit ? '800' : '500'}
                    numberOfLines={1}
                    style={{
                      color: lit ? viridian : colors.textTertiary,
                      marginTop: 4,
                      textAlign: 'center',
                    }}
                  >
                    {s.label}
                  </Txt>
                </View>
                {i < steps.length - 1 && (
                  <View
                    style={[
                      styles.stepConnector,
                      {
                        backgroundColor: s.done ? viridian : colors.borderSubtle,
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            )
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Meetup Hero Banner with BrandIcon (pencil / chat) */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? '#24180E' : viridianSoft,
              borderColor: isDark ? '#4A2C16' : '#FAD9C2',
            },
          ]}
        >
          <View style={[styles.heroIconWrap, { backgroundColor: colors.card, borderColor: colors.borderSubtle }]}>
            <BrandIcon name={mentorName ? 'chat' : 'pencil'} size={42} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <BrandIcon name="sparkle" size={14} />
              <Txt size={11} weight="800" style={{ color: viridian, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {mentorName ? 'Yêu cầu trực tiếp 1:1' : 'Đăng bài toán cần cố vấn'}
              </Txt>
            </View>
            <Txt size={15} weight="800" style={{ color: colors.text, marginTop: 3 }}>
              {mentorName ? `Người nhận: ${mentorName}` : 'Mô tả rõ mục tiêu để kết nối nhanh nhất'}
            </Txt>
            <Txt size={12} style={{ color: colors.textSecondary, marginTop: 2 }}>
              {mentorName
                ? 'Mentor sẽ nhận thông báo ngay và phản hồi yêu cầu của bạn.'
                : 'Các mentor cùng lĩnh vực sẽ nhận đề xuất và gửi phản hồi cho bạn.'}
            </Txt>
          </View>
        </View>

        {/* Section 01: Hình thức tham gia */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: activeStep === 1 ? viridian : colors.border,
            },
          ]}
        >
          <StepBadge
            step="01"
            title="Hình thức tham gia"
            subtitle="Chọn học 1 kèm 1 hoặc đại diện cho nhóm học tập"
            brandIcon="people2"
            done={steps[0].done}
            active={steps[0].active}
          />
          <View style={styles.chipWrap}>
            <FormChip
              label="Cá nhân (1:1)"
              active={participation === 'INDIVIDUAL'}
              onPress={() => {
                setActiveStep(1)
                setParticipation('INDIVIDUAL')
              }}
            />
            <FormChip
              label="Theo nhóm học viên"
              active={participation === 'GROUP'}
              onPress={() => {
                setActiveStep(1)
                setParticipation('GROUP')
              }}
            />
          </View>

          {participation === 'GROUP' ? (
            <View style={[styles.subBox, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <Txt weight="700" size={13} style={{ color: colors.text, marginBottom: 8 }}>
                Chọn nhóm bạn đang đại diện
              </Txt>
              {groups.isLoading ? (
                <Loading />
              ) : groups.isError ? (
                <Button title="Thử tải lại nhóm" variant="outline" size="sm" onPress={() => void groups.refetch()} />
              ) : (
                <View style={styles.chipWrap}>
                  {(groups.data ?? [])
                    .filter((g) => g.canManage && g.status === 'ACTIVE')
                    .map((g) => (
                      <FormChip
                        key={g.id}
                        label={g.name}
                        active={groupId === g.id}
                        onPress={() => {
                          setActiveStep(1)
                          setGroupId(g.id)
                        }}
                      />
                    ))}
                </View>
              )}
              {errors.group ? <Txt color="#DC2626" size={12} style={{ marginTop: 6 }}>{errors.group}</Txt> : null}
              <Pressable
                onPress={() => router.push('/mentoring/groups/create')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}
              >
                <Plus size={14} color={viridian} weight="bold" />
                <Txt size={13} weight="700" style={{ color: viridian }}>
                  Tạo nhóm Cố vấn mới
                </Txt>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Section 02: Nội dung & Mục tiêu */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: activeStep === 2 ? viridian : colors.border,
            },
          ]}
        >
          <StepBadge
            step="02"
            title="Nội dung & Mục tiêu trao đổi"
            subtitle="Nêu rõ bài toán và kết quả mong đợi sau khóa cố vấn"
            brandIcon="pencil"
            done={steps[1].done}
            active={steps[1].active}
          />
          <View style={styles.fieldLabelRow}>
            <Txt size={13} weight="700" style={{ color: colors.text }}>
              Tiêu đề yêu cầu
            </Txt>
            <Txt size={11} weight="600" style={{ color: f.title.trim().length >= 5 ? viridian : colors.textTertiary }}>
              {`${f.title.trim().length}/200 ký tự (tối thiểu 5)`}
            </Txt>
          </View>
          <Input
            placeholder="VD: Cố vấn định hướng lộ trình Backend / Review CV..."
            value={f.title}
            onFocus={() => setActiveStep(2)}
            onChangeText={(v) => {
              setActiveStep(2)
              set('title')(v)
            }}
            error={errors.title}
          />

          <View style={styles.fieldLabelRow}>
            <Txt size={13} weight="700" style={{ color: colors.text }}>
              Mô tả chi tiết bài toán & mong muốn
            </Txt>
            <Txt size={11} weight="600" style={{ color: f.description.trim().length >= 20 ? viridian : colors.textTertiary }}>
              {`${f.description.trim().length}/3000 ký tự (tối thiểu 20)`}
            </Txt>
          </View>
          <Input
            placeholder="Chia sẻ rõ hoàn cảnh, khó khăn hiện tại và kết quả bạn kỳ vọng sau buổi cố vấn..."
            value={f.description}
            onFocus={() => setActiveStep(2)}
            onChangeText={(v) => {
              setActiveStep(2)
              set('description')(v)
            }}
            multiline
            numberOfLines={4}
            error={errors.description}
          />
        </View>

        {/* Section 03: Lĩnh vực & Loại hỗ trợ */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: activeStep === 3 ? viridian : colors.border,
            },
          ]}
        >
          <StepBadge
            step="03"
            title="Lĩnh vực & Phương thức"
            subtitle="Giúp thuật toán chọn đúng chuyên gia phù hợp nhất"
            brandIcon="computer"
            done={steps[2].done}
            active={steps[2].active}
          />
          <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginBottom: 8 }}>
            Lĩnh vực chuyên môn cần hỗ trợ
          </Txt>
          <View style={styles.chipWrap}>
            {(industries.data ?? []).map((i) => (
              <FormChip
                key={i.id}
                label={i.name}
                active={industryId === i.id}
                onPress={() => {
                  setActiveStep(3)
                  setIndustryId(i.id)
                }}
              />
            ))}
          </View>
          {errors.industry ? <Txt size={12} color="#DC2626" style={{ marginTop: 6 }}>{errors.industry}</Txt> : null}

          <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 16, marginBottom: 8 }}>
            Loại hình hỗ trợ mong muốn
          </Txt>
          <View style={styles.chipWrap}>
            {REQUEST_TASK_TYPES.map((t) => (
              <FormChip
                key={t.value}
                label={t.label}
                active={taskType === t.value}
                onPress={() => {
                  setActiveStep(3)
                  setTaskType(t.value)
                }}
              />
            ))}
          </View>

          <Txt weight="700" size={13} style={{ color: colors.textSecondary, marginTop: 16, marginBottom: 8 }}>
            Hình thức làm việc
          </Txt>
          <View style={styles.chipWrap}>
            {(Object.keys(WORKING_MODE_LABEL) as WorkingMode[]).map((k) => (
              <FormChip
                key={k}
                label={WORKING_MODE_LABEL[k]}
                active={mode === k}
                onPress={() => {
                  setActiveStep(3)
                  setMode(k)
                }}
              />
            ))}
          </View>
        </View>

        {/* Section 04: Ngân sách & Thời hạn */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: activeStep === 4 ? viridian : colors.border,
            },
          ]}
        >
          <StepBadge
            step="04"
            title="Dự toán Ngân sách & Thời hạn"
            subtitle="Khung thù lao dự kiến dành cho Mentor (không bắt buộc)"
            brandIcon="coin"
            done={steps[3].done}
            active={steps[3].active}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Tối thiểu (VND)"
                placeholder="VD: 100000"
                value={f.budgetMin}
                onFocus={() => setActiveStep(4)}
                onChangeText={(v) => {
                  setActiveStep(4)
                  set('budgetMin')(v.replace(/\D/g, ''))
                }}
                keyboardType="number-pad"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Tối đa (VND)"
                placeholder="VD: 500000"
                value={f.budgetMax}
                onFocus={() => setActiveStep(4)}
                onChangeText={(v) => {
                  setActiveStep(4)
                  set('budgetMax')(v.replace(/\D/g, ''))
                }}
                keyboardType="number-pad"
                error={errors.budget}
              />
            </View>
          </View>
          <DateField
            label="Thời hạn mong muốn hoàn thành (tùy chọn)"
            value={deadline}
            onChange={(d) => {
              setActiveStep(4)
              setDeadline(d)
            }}
            error={errors.deadline}
          />
        </View>

        {/* Section 05: Tài liệu đính kèm */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: colors.card,
              borderColor: activeStep === 5 ? viridian : colors.border,
            },
          ]}
        >
          <StepBadge
            step="05"
            title={`Tài liệu đính kèm (${attachments.length}/5)`}
            subtitle="Đính kèm CV, đề cương dự án hoặc câu hỏi chuẩn bị trước"
            brandIcon="copy"
            done={steps[4].done}
            active={steps[4].active}
          />
          {attachments.map((a, i) => (
            <View key={a.fileUrl} style={[styles.attachmentRow, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <FileText size={16} color={viridian} />
              <Txt numberOfLines={1} size={13} weight="600" style={{ flex: 1, color: colors.text, marginLeft: 8 }}>
                {a.fileName}
              </Txt>
              <Pressable
                onPress={() => setAttachments((files) => files.filter((_, j) => j !== i))}
                hitSlop={8}
                style={{ padding: 4 }}
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          ))}
          <Button
            title="Đính kèm tệp (CV, đề cương, tài liệu < 10MB)"
            variant="outline"
            size="sm"
            icon={<Paperclip size={15} color={colors.text} />}
            disabled={attachments.length >= 5 || m.isPending}
            loading={uploading}
            onPress={() => void addAttachment()}
            style={{ marginTop: 4 }}
          />
        </View>
      </ScrollView>

      {/* Meetup Sticky Bottom Action Bar */}
      <View
        style={[
          styles.stickyFooter,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.borderSubtle,
            paddingBottom: Math.max(12, insets.bottom + 8),
          },
        ]}
      >
        <Button
          title={mentorId ? 'Gửi yêu cầu tới Mentor' : 'Đăng yêu cầu Cố vấn'}
          textColor="#FFFFFF"
          icon={<Send size={17} color="#FFFFFF" weight="fill" />}
          onPress={submit}
          loading={m.isPending}
          disabled={uploading || !terms.data?.accepted}
          style={{
            backgroundColor: terms.data?.accepted ? viridian : colors.border,
            borderColor: terms.data?.accepted ? viridian : colors.border,
            minHeight: 50,
          }}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  stepperContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    height: 2,
    width: 14,
    marginBottom: 14,
    borderRadius: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  brandIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  stickyFooter: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
