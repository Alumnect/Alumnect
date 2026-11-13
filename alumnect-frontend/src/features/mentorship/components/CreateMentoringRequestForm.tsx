import React, { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  DollarSign,
  Laptop,
  Briefcase,
  Calendar,
  Paperclip,
  UploadCloud,
  X,
  AlertTriangle,
  Loader2,
  Send,
  FileCheck,
  Users,
  Plus,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react'
import { Card, toast, SelectDropdown, type SelectOption } from '@/components/ui'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import {
  createMentoringRequestSchema,
  type CreateMentoringRequestFormInput,
} from '../model/mentoringRequestSchema'
import {
  TASK_TYPE_OPTIONS,
  WORKING_MODE_LABELS,
  PARTICIPATION_TYPE_LABELS,
  type MentoringWorkingMode,
  type MentoringAttachmentItem,
  type CreateMentoringRequestData,
  type MentoringGroupMemberData,
} from '../model/mentoringRequestTypes'
import { mentorRegistrationApi } from '../api/mentorRegistrationApi'
import { mentoringRequestApi } from '../api/mentoringRequestApi'
import { mentoringGroupApi } from '../api/mentoringGroupApi'
import { useCreateMentoringRequest } from '../hooks/useCreateMentoringRequest'
import type { SupportedIndustryItem } from '../model/mentorRegistrationTypes'
import type { MentorDetailData } from '../model/mentorDetailTypes'
import { CreateMentoringGroupModal } from './CreateMentoringGroupModal'

interface CreateMentoringRequestFormProps {
  onSuccess: (data: CreateMentoringRequestData) => void
  onCancel?: () => void
  targetMentor?: MentorDetailData | null
  isDirectRequest?: boolean
  initialGroupId?: number
}

interface LocalFileItem {
  id: string
  file: File
  uploading: boolean
  uploadedUrl?: string
  error?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Biểu mẫu tạo yêu cầu Mentoring (UC100 - General Request & UC101 - Direct Request).
 * Thiết kế tuân thủ nghiêm ngặt Pastel Premium Design System của AlumNect.
 * Áp dụng mô hình GROUP-FIRST: Tạo/chọn nhóm trước khi tạo Mentoring Request dạng nhóm.
 */
export const CreateMentoringRequestForm: React.FC<CreateMentoringRequestFormProps> = ({
  onSuccess,
  onCancel,
  targetMentor,
  isDirectRequest = false,
  initialGroupId,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryGroupId = searchParams.get('groupId') ? Number(searchParams.get('groupId')) : undefined
  const effectiveInitialGroupId = initialGroupId || queryGroupId

  const [industries, setIndustries] = useState<SupportedIndustryItem[]>(() =>
    isDirectRequest && targetMentor?.supportedFields
      ? targetMentor.supportedFields.map((field) => ({ id: field.id, name: field.name })) : []
  )
  const [loadingIndustries, setLoadingIndustries] = useState(() => !(isDirectRequest && targetMentor))
  const [attachedFiles, setAttachedFiles] = useState<LocalFileItem[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [clientRequestKey, setClientRequestKey] = useState(() => crypto.randomUUID())
  const [minimumDeadline] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0])

  const createMutation = useCreateMentoringRequest()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<CreateMentoringRequestFormInput>({
    resolver: zodResolver(createMentoringRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      industryId: (isDirectRequest && targetMentor?.supportedFields?.[0]?.id) || 0,
      mentorId: (isDirectRequest && targetMentor?.mentorId) || null,
      groupId: effectiveInitialGroupId || null,
      budgetMin: null,
      budgetMax: null,
      workingMode: 'ONLINE',
      participationType: effectiveInitialGroupId ? 'GROUP' : 'INDIVIDUAL',
      taskType: 'CAREER_ORIENTATION',
      expectedDeadline: null,
      attachments: [],
      memberIds: [],
    },
  })

  const currentUser = useAuthStore((s) => s.user)
  const isSelfMentor = Boolean(
    isDirectRequest && targetMentor && currentUser && String(currentUser.id) === String(targetMentor.userId)
  )
  const groupUnsupportedByTargetMentor = Boolean(
    isDirectRequest && targetMentor?.mentoringType === 'INDIVIDUAL'
  )
  const selectedWorkingMode = useWatch({ control, name: 'workingMode' })
  const selectedParticipationType = useWatch({ control, name: 'participationType' })
  const selectedTaskType = useWatch({ control, name: 'taskType' })
  const selectedGroupId = useWatch({ control, name: 'groupId' }) as number | null | undefined
  const selectedIndustryId = useWatch({ control, name: 'industryId' }) as number | undefined
  const descriptionValue = useWatch({ control, name: 'description' })
  const expectedDeadlineValue = useWatch({ control, name: 'expectedDeadline' }) as string | null | undefined

  // Tải danh sách nhóm do user quản lý khi chọn loại hình GROUP
  const { data: managedGroups = [], isLoading: loadingManagedGroups, refetch: refetchGroups } = useQuery({
    queryKey: ['mentoring-groups', 'MANAGED'],
    queryFn: () => mentoringGroupApi.getMine('MANAGED'),
    enabled: selectedParticipationType === 'GROUP',
  })

  const industryOptions: SelectOption<number>[] = useMemo(() => {
    return industries.map((ind) => ({
      value: ind.id,
      label: ind.name,
      icon: <Briefcase className="h-4 w-4 text-text-subtle" />,
    }))
  }, [industries])

  const groupOptions: SelectOption<number>[] = useMemo(() => {
    return managedGroups.map((group) => {
      const memberCount =
        group.joinedMemberCount ||
        group.members?.filter(
          (m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE'
        ).length ||
        1
      return {
        value: group.id,
        label: group.name,
        sublabel: t('mentoring.memberJoinedCountSublabel', { count: memberCount }),
        icon: <Users className="h-4 w-4 text-text-subtle" />,
      }
    })
  }, [managedGroups])

  // Tải chi tiết nhóm đang chọn để lấy danh sách snapshot thành viên JOINED & PENDING
  const { data: currentGroupDetail } = useQuery({
    queryKey: ['mentoring-group', selectedGroupId],
    queryFn: () => mentoringGroupApi.getById(Number(selectedGroupId)),
    enabled: Boolean(selectedGroupId && Number(selectedGroupId) > 0),
  })

  // Nếu có initialGroupId, đảm bảo set vào form
  useEffect(() => {
    if (effectiveInitialGroupId) {
      setValue('participationType', 'GROUP', { shouldValidate: true })
      setValue('groupId', effectiveInitialGroupId, { shouldValidate: true })
    }
  }, [effectiveInitialGroupId, setValue])

  // Tải danh mục ngành nghề (Industries) từ Backend hoặc lọc theo Mentor hỗ trợ (UC101)
  useEffect(() => {
    if (isDirectRequest && targetMentor) {
      if (targetMentor.supportedFields && targetMentor.supportedFields.length > 0) {
        const supported = targetMentor.supportedFields.map((sf) => ({ id: sf.id, name: sf.name }))
        setValue('industryId', supported[0].id, { shouldValidate: true })
        setValue('mentorId', targetMentor.mentorId, { shouldValidate: true })
        return
      } else {
        setValue('industryId', 0, { shouldValidate: true })
        setValue('mentorId', targetMentor.mentorId, { shouldValidate: true })
        return
      }
    }

    let mounted = true
    mentorRegistrationApi
      .getIndustries()
      .then((data) => {
        if (mounted) {
          setIndustries(data || [])
          if (data && data.length > 0) {
            setValue('industryId', data[0].id, { shouldValidate: true })
          }
          setLoadingIndustries(false)
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải danh mục ngành nghề:', err)
        if (mounted) setLoadingIndustries(false)
      })
    return () => {
      mounted = false
    }
  }, [isDirectRequest, targetMentor, setValue])

  // Xử lý chọn tệp đính kèm và upload lên Cloudflare R2 qua Presigned URL
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (attachedFiles.length + files.length > 5) {
      const msg = t('mentoring.max5FilesLimit')
      setServerError(msg)
      toast.warning(msg)
      return
    }

    setServerError(null)
    const newFileItems: LocalFileItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Kiểm tra dung lượng nhỏ hơn 10 MB (BR-07)
      if (file.size >= MAX_FILE_SIZE) {
        const msg = t('mentoring.fileExceeds10MB', { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2) })
        setServerError(msg)
        toast.warning(msg)
        continue
      }

      const item: LocalFileItem = {
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        uploading: true,
      }
      newFileItems.push(item)
    }

    if (newFileItems.length === 0) return

    setAttachedFiles((prev) => [...prev, ...newFileItems])

    // Tiến hành upload từng tệp lên R2
    for (const item of newFileItems) {
      try {
        const presigned = await mentoringRequestApi.getPresignedUploadUrl(item.file.name, item.file.type || 'application/octet-stream')
        await mentoringRequestApi.uploadFileToR2(presigned.uploadUrl, item.file)

        setAttachedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, uploading: false, uploadedUrl: presigned.publicUrl } : f))
        )

        // Cập nhật mảng attachments cho form
        const currentAtts: MentoringAttachmentItem[] = getValues('attachments') || []
        setValue('attachments', [
          ...currentAtts,
          {
            fileName: item.file.name,
            fileUrl: presigned.publicUrl,
            fileSize: item.file.size,
            fileType: item.file.type,
          },
        ])
      } catch (err: unknown) {
        console.error('Lỗi tải tệp lên R2:', err)
        const errMsg = err instanceof Error ? err.message : t('mentoring.fileUploadFailed')
        toast.error(t('mentoring.cannotUploadFile', { name: item.file.name, error: errMsg }))
        setAttachedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, uploading: false, error: errMsg } : f))
        )
      }
    }

    // Reset input file để có thể chọn lại cùng file nếu muốn
    e.target.value = ''
  }

  // Xóa tệp đính kèm
  const handleRemoveFile = (index: number) => {
    const fileToRemove = attachedFiles[index]
    setAttachedFiles((prev) => prev.filter((_, idx) => idx !== index))

    const currentAtts: MentoringAttachmentItem[] = getValues('attachments') || []
    setValue(
      'attachments',
      currentAtts.filter((a) => a.fileUrl !== fileToRemove.uploadedUrl)
    )
  }

  // Xử lý khi Form vi phạm validate client
  const onInvalid = (fieldErrors: FieldErrors<CreateMentoringRequestFormInput>) => {
    const errorFields = Object.keys(fieldErrors)
    if (errorFields.length > 0) {
      const firstError = Object.values(fieldErrors)[0]
      const message = typeof firstError?.message === 'string'
        ? firstError.message : t('mentoring.formValidationError')
      setServerError(message)
      toast.error(message)
      const el = document.querySelector(`[name="${errorFields[0]}"]`) || document.getElementById(errorFields[0])
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Submit Form
  const onSubmit = (formData: CreateMentoringRequestFormInput) => {
    // 1. Kiểm tra tự gửi yêu cầu cho chính mình
    if (isSelfMentor) {
      const msg = t('mentoring.cannotRequestSelfMentor')
      setServerError(msg)
      toast.error(msg)
      return
    }

    if (formData.participationType === 'GROUP' && (!formData.groupId || Number(formData.groupId) <= 0)) {
      const msg = t('mentoring.selectGroupBeforeSending')
      setServerError(msg)
      toast.error(msg)
      return
    }

    // 2. Kiểm tra lĩnh vực hợp lệ đối với Mentor được chọn (UC101)
    if (isDirectRequest && targetMentor) {
      if (!targetMentor.supportedFields || targetMentor.supportedFields.length === 0) {
        const msg = t('mentoring.mentorNoFieldsConfigured', { name: targetMentor.fullName })
        setServerError(msg)
        toast.error(msg)
        return
      }

      const selectedId = Number(formData.industryId)
      const isSupported = targetMentor.supportedFields.some((sf) => sf.id === selectedId)
      if (!isSupported) {
        const msg = t('mentoring.industryNotInMentorSupport', { name: targetMentor.fullName })
        setServerError(msg)
        toast.error(msg)
        return
      }
    }

    // 3. Kiểm tra nếu còn file đang uploading
    const stillUploading = attachedFiles.some((f) => f.uploading)
    if (stillUploading) {
      const msg = t('mentoring.waitForAttachmentsUpload')
      setServerError(msg)
      toast.warning(msg)
      return
    }

    setServerError(null)
    createMutation.mutate(
      {
        title: formData.title,
        description: formData.description,
        industryId: Number(formData.industryId),
        mentorId: isDirectRequest && targetMentor ? targetMentor.mentorId : undefined,
        groupId: formData.participationType === 'GROUP' ? Number(formData.groupId) : undefined,
        memberIds: [],
        clientRequestKey,
        budgetMin:
          formData.budgetMin !== null &&
            formData.budgetMin !== undefined &&
            (formData.budgetMin as unknown) !== ''
            ? Number(formData.budgetMin)
            : null,
        budgetMax:
          formData.budgetMin !== null &&
            formData.budgetMin !== undefined &&
            (formData.budgetMin as unknown) !== ''
            ? Number(formData.budgetMin)
            : null,
        workingMode: formData.workingMode,
        participationType: formData.participationType,
        taskType: formData.taskType,
        expectedDeadline: formData.expectedDeadline
          ? new Date(`${formData.expectedDeadline}T23:59:59.999Z`).toISOString()
          : null,
        attachments: formData.attachments || [],
      },
      {
        onSuccess: (data) => {
          setClientRequestKey(crypto.randomUUID())
          toast.success(isDirectRequest ? t('mentoring.directRequestSuccess') : t('mentoring.matchingRequestSuccess'))
          onSuccess(data)
        },
        onError: (err: Error & { data?: { data?: Record<string, string> } }) => {
          let errorMsg = err.message || t('mentoring.createRequestError')
          if (err.data?.data) {
            const fieldErrors = Object.values(err.data.data)
            if (fieldErrors.length > 0) {
              errorMsg = fieldErrors.join('. ')
            }
          }
          setServerError(errorMsg)
          toast.error(errorMsg)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        },
      }
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-6 text-left">
        {/* Alert Banner hiển thị lỗi nghiệp vụ từ Server */}
        {serverError && (
          <div className="rounded-2xl border border-danger-border bg-danger-soft p-4 flex items-start gap-3 text-danger text-sm animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">{t('mentoring.cannotCreateRequestTitle')}</span>
              <span>{serverError}</span>
            </div>
            <button aria-label={t('common.close')}
              type="button"
              onClick={() => setServerError(null)}
              className="text-danger hover:text-danger"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SECTION A — Request Overview (Tiêu đề & Nội dung) */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section1RequestInfo')}
              </h3>
              <p className="text-xs text-text-subtle">
                {isDirectRequest && targetMentor
                  ? t('mentoring.directRequestDescMentor', { name: targetMentor.fullName })
                  : t('mentoring.directRequestDescMatching')}
              </p>
            </div>
          </div>

          {/* Tiêu đề (Title) */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="block text-xs font-bold text-text">
              {t('mentoring.requestTitleRequired')} <span className="text-danger">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder={t('mentoring.requestTitlePlaceholder')}
              {...register('title')}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:placeholder:text-text-subtle"
            />
            {errors.title && (
              <p className="text-xs font-semibold text-danger pt-0.5">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Nội dung chi tiết (Description) */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="block text-xs font-bold text-text">
              {t('mentoring.requestDescRequired')} <span className="text-danger">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder={t('mentoring.requestDescPlaceholder')}
              {...register('description')}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:placeholder:text-text-subtle"
            />
            <div className="flex justify-between items-center text-xs text-text-subtle">
              <span>{t('mentoring.requestDescLengthHint')}</span>
              <span>{descriptionValue?.length || 0}/3000</span>
            </div>
            {errors.description && (
              <p className="text-xs font-semibold text-danger pt-0.5">
                {errors.description.message}
              </p>
            )}
          </div>
        </Card>

        {/* SECTION B — Mentoring Field (Lĩnh vực ngành nghề) */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-4 overflow-visible">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section2Industry')}
              </h3>
              <p className="text-xs text-text-subtle">
                {isDirectRequest && targetMentor
                  ? t('mentoring.directIndustryHintMentor', { name: targetMentor.fullName })
                  : t('mentoring.directIndustryHintMatching')}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="industryId" className="block text-xs font-bold text-text">
              {t('mentoring.industryFieldRequired')} <span className="text-danger">*</span>
            </label>
            <SelectDropdown
              value={Number(selectedIndustryId) || ''}
              onChange={(val) => setValue('industryId', Number(val), { shouldValidate: true })}
              options={industryOptions}
              placeholder={loadingIndustries ? t('mentoring.loadingIndustries') : t('mentoring.selectIndustry')}
              searchPlaceholder={t('mentoring.searchIndustryPlaceholder')}
              disabled={loadingIndustries}
              buttonClassName="h-11 rounded-2xl text-sm"
              panelClassName="w-full sm:max-w-none"
              icon={<Briefcase className="h-4 w-4" />}
            />
            {errors.industryId && (
              <p className="text-xs font-semibold text-danger pt-0.5">
                {errors.industryId.message}
              </p>
            )}
          </div>
        </Card>

        {/* SECTION C — Ngân sách dự kiến */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section3Budget')}
              </h3>
              <p className="text-xs text-text-subtle">
                {t('mentoring.budgetOptionalHint')}
              </p>
            </div>
          </div>

          <div className="max-w-xl space-y-1.5">
            <label htmlFor="budgetMin" className="block text-xs font-bold text-text">
              {t('mentoring.budgetLevelVnd')}
            </label>
            <div className="relative">
              <input
                id="budgetMin"
                type="number"
                min="0"
                step="any"
                placeholder={t('mentoring.budgetPlaceholder')}
                {...register('budgetMin')}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-3 pr-12 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-3 focus:ring-brand-500/15"
              />
              <span className="absolute right-4 top-3.5 text-xs font-bold text-text-subtle">
                VND
              </span>
            </div>
            {errors.budgetMin && (
              <p className="text-xs font-semibold text-danger pt-0.5">
                {errors.budgetMin.message}
              </p>
            )}

          </div>
        </Card>

        {/* SECTION D — Working Preferences (Hình thức & Loại nhiệm vụ) */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-6 overflow-visible">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-info-soft text-info">
              <Laptop className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section4WorkingMode')}
              </h3>
              <p className="text-xs text-text-subtle">
                {t('mentoring.section4WorkingModeDesc')}
              </p>
            </div>
          </div>

          {/* 4.1 Phương thức làm việc (Working Mode) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text">
              {t('mentoring.workingModeRequired')} <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['ONLINE', 'OFFLINE', 'BOTH'] as MentoringWorkingMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setValue('workingMode', mode)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition ${selectedWorkingMode === mode
                      ? 'border-primary bg-primary-soft text-primary-solid shadow-xs'
                      : 'border-border bg-surface text-text-muted hover:border-border-strong'
                    }`}
                >
                  <span>{WORKING_MODE_LABELS[mode]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4.2 Hình thức tham gia (Participation Type) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text">
              {t('mentoring.participationRequired')} <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['INDIVIDUAL', 'GROUP'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={type === 'GROUP' && groupUnsupportedByTargetMentor}
                  onClick={() => setValue('participationType', type)}
                  title={type === 'GROUP' && groupUnsupportedByTargetMentor ? t('mentoring.mentorOnlyIndividualTitle') : undefined}
                  className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-45 ${selectedParticipationType === type
                      ? 'border-primary bg-primary-soft text-primary-solid shadow-xs'
                      : 'border-border bg-surface text-text-muted hover:border-border-strong'
                    }`}
                >
                  <span>{PARTICIPATION_TYPE_LABELS[type]}</span>
                </button>
              ))}
            </div>
            {groupUnsupportedByTargetMentor && (
              <p className="text-xs text-text-subtle">{t('mentoring.mentorOnlyIndividualNotice')}</p>
            )}
          </div>

          {/* 4.2.1 Chọn Nhóm Cố Vấn (Mô hình GROUP-FIRST) */}
          {selectedParticipationType === 'GROUP' && (
            <div className="space-y-4 rounded-2xl border border-primary-soft-border bg-brand-50/40 p-5 dark:bg-brand-700/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary-solid shadow-xs">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text">
                      {t('mentoring.chooseGroupParticipate')}
                    </p>
                    <p className="text-xs text-text-subtle">
                      {t('mentoring.chooseGroupParticipateDesc')}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="self-start sm:self-auto gap-1.5 rounded-xl border-primary-soft-border text-primary-solid hover:bg-brand-100/60 text-xs"
                >
                  <Plus className="h-4 w-4" />
                  {t('mentoring.createNewGroup')}
                </Button>
              </div>

              {loadingManagedGroups ? (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-text-subtle">
                  <Loader2 className="h-4 w-4 animate-spin text-primary-solid" />
                  {t('mentoring.loadingYourGroups')}
                </div>
              ) : managedGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-primary-soft-border bg-surface/70 p-6 text-center">
                  <Users className="mx-auto h-8 w-8 text-brand-400 mb-2 opacity-70" />
                  <p className="text-sm font-bold text-text">
                    {t('mentoring.noActiveMentoringGroup')}
                  </p>
                  <p className="text-xs text-text-subtle max-w-md mx-auto mt-1 mb-4">
                    {t('mentoring.newGroupWorkflowDesc')}
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateGroupModalOpen(true)}
                    className="rounded-xl gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    {t('mentoring.createFirstGroupNow')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <label htmlFor="group-select" className="block text-xs font-bold text-text">
                    {t('mentoring.representativeGroupRequired')} <span className="text-danger">*</span>
                  </label>
                  <SelectDropdown
                    value={Number(selectedGroupId) || ''}
                    onChange={(val) => {
                      const numVal = val ? Number(val) : null
                      setValue('groupId', numVal, { shouldValidate: true })
                    }}
                    options={groupOptions}
                    placeholder={t('mentoring.chooseYourMentoringGroup')}
                    searchPlaceholder={t('mentoring.searchGroupPlaceholder')}
                    buttonClassName="h-11 rounded-xl text-sm"
                    panelClassName="w-full sm:max-w-none"
                    icon={<Users className="h-4 w-4" />}
                  />
                  {errors.groupId && (
                    <p className="text-xs font-semibold text-danger">
                      {errors.groupId.message}
                    </p>
                  )}
                </div>
              )}

              {/* Chi tiết nhóm được chọn & Snapshot thành viên */}
              {selectedGroupId && currentGroupDetail ? (
                <div className="space-y-4 pt-2">
                  {/* Snapshot thành viên chính thức (JOINED) */}
                  <div className="rounded-xl border border-border bg-surface p-4">
                    <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                      <span className="text-xs font-bold text-text flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        {t('mentoring.officialMembersSnapshotHeading')}
                      </span>
                      <span className="text-xs font-bold text-primary-solid">
                        {t('mentoring.membersJoinedCount', { count: (currentGroupDetail.members || []).filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length })}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {(currentGroupDetail.members || [])
                        .filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE')
                        .map((member: MentoringGroupMemberData) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-lg border border-border bg-cream-100/60 p-2.5 dark:bg-white/5"
                          >
                            <img
                              src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-xs font-bold text-text">
                                  {member.fullName}
                                </span>
                                {member.leader && (
                                  <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-bold text-warning">
                                    {t('mentoring.groupLeader')}
                                  </span>
                                )}
                              </div>
                              <span className="block truncate text-xs text-text-subtle">
                                {member.major || member.email}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {(currentGroupDetail.members || []).filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length === 1 && (
                      <p className="mt-3 text-xs text-text-subtle italic">
                        * Nhóm hiện chỉ có Trưởng nhóm. Bạn có thể tiếp tục tạo yêu cầu theo diện nhóm một thành viên hoặc mời thêm bạn bè tham gia.
                      </p>
                    )}
                  </div>

                  {/* Cảnh báo PENDING INVITATIONS (Yêu cầu nghiệp vụ bắt buộc 8.1) */}
                  {(() => {
                    const pendingMembers = (currentGroupDetail.members || []).filter(
                      (m: MentoringGroupMemberData) => m.status === 'PENDING' || m.status === 'INVITED'
                    )
                    if (pendingMembers.length === 0) return null

                    return (
                      <div className="rounded-xl border border-warning-border bg-warning-soft p-4 text-sm">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                          <div className="space-y-1.5 flex-1">
                            <p className="font-bold text-warning">
                              {t('mentoring.pendingMembersWarning', { count: pendingMembers.length })}
                            </p>
                            <p className="text-xs text-warning leading-relaxed">
                              {t('mentoring.pendingMembersWarningDesc')}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => navigate(`/app/mentoring/groups/${selectedGroupId}`)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-warning-border bg-surface px-3 py-1.5 text-xs font-bold text-warning shadow-2xs hover:bg-warning-soft transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                {t('mentoring.backToGroupToManageInvitations')}
                              </button>
                              <span className="text-xs text-warning italic">
                                {t('mentoring.continueWithConfirmedMembersHint')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              ) : null}
            </div>
          )}

          {/* 4.3 Loại nhiệm vụ (Task Type) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-text">
              {t('mentoring.taskTypeRequired')} <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TASK_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setValue('taskType', opt.value)}
                  className={`flex flex-col text-left rounded-2xl border p-3.5 transition ${selectedTaskType === opt.value
                      ? 'border-primary bg-brand-50/70 shadow-xs dark:bg-brand-700/40'
                      : 'border-border bg-surface hover:border-border-strong'
                    }`}
                >
                  <span className={`text-xs font-bold ${selectedTaskType === opt.value ? 'text-primary-solid' : 'text-text'
                    }`}>
                    {opt.label}
                  </span>
                  <span className="text-xs text-text-subtle leading-relaxed mt-1">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* SECTION E — Timeline (Thời hạn mong muốn) */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section5Deadline')}
              </h3>
              <p className="text-xs text-text-subtle">
                {t('mentoring.section5DeadlineDesc')}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 max-w-sm">
            <label htmlFor="expectedDeadline" className="block text-xs font-bold text-text">
              {t('mentoring.expectedDeadline')}
            </label>
            <DateTimePicker
              id="expectedDeadline"
              mode="date"
              value={expectedDeadlineValue ?? ''}
              min={minimumDeadline}
              invalid={!!errors.expectedDeadline}
              onChange={(val) => setValue('expectedDeadline', val || null, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.expectedDeadline && (
              <p className="text-xs font-semibold text-danger pt-0.5">
                {errors.expectedDeadline.message}
              </p>
            )}
          </div>
        </Card>

        {/* SECTION F — Attachments (Tệp đính kèm) */}
        <Card hover={false} className="p-6 sm:p-7 border border-border bg-surface space-y-4">
          <div className="flex items-center gap-3 border-b border-border pb-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
              <Paperclip className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-text">
                {t('mentoring.section6Attachments')}
              </h3>
              <p className="text-xs text-text-subtle">
                {t('mentoring.section6AttachmentsDesc')}
              </p>
            </div>
          </div>

          {/* Upload dropzone */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border-strong bg-cream-50/50 p-6 text-center transition-colors hover:border-primary dark:bg-white/[0.02]">
            <UploadCloud className="h-8 w-8 text-primary-solid mb-2" />
            <p className="text-xs font-bold text-text">
              {t('mentoring.dragDropFilesPrompt')}
            </p>
            <p className="text-xs text-text-subtle mt-1">
              {t('mentoring.supportedFileFormatsDesc')}
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>

          {/* Danh sách tệp tin đính kèm */}
          {attachedFiles.length > 0 && (
            <div className="space-y-2 pt-2">
              {attachedFiles.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-solid">
                      <FileCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 truncate">
                      <p className="font-bold text-text truncate">{item.file.name}</p>
                      <p className="text-xs text-text-subtle">
                        {(item.file.size / 1024).toFixed(1)} KB
                        {item.uploading && t('mentoring.uploadingProgress')}
                        {item.error && t('mentoring.uploadErrorPrefix', { error: item.error })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary-solid" />
                    ) : (
                      <button aria-label={t('common.close')}
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1 rounded-lg text-text-subtle hover:text-danger hover:bg-danger-soft transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SECTION G — Action CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={onCancel}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto rounded-2xl font-bold text-text-muted hover:text-text"
            >
              {t('common.cancel')}
            </Button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={createMutation.isPending || isSelfMentor}
            leftIcon={
              <span key={createMutation.isPending ? 'loading-icon' : 'idle-icon'} className="inline-flex items-center">
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </span>
            }
            className="w-full sm:w-auto rounded-2xl font-bold px-8 shadow-sm"
          >
            <span>
              {isSelfMentor
                ? t('mentoring.cannotSendToSelf')
                : createMutation.isPending
                  ? isDirectRequest
                    ? t('mentoring.sendingDirectRequest')
                    : t('mentoring.creatingAndMatching')
                  : isDirectRequest
                    ? t('mentoring.sendRequestToMentor')
                    : t('mentoring.postMentoringRequest')}
            </span>
          </Button>
        </div>
      </form>

      <CreateMentoringGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccessRedirect={false}
        onCreated={(group) => {
          refetchGroups()
          setValue('groupId', group.id, { shouldValidate: true })
        }}
      />
    </>
  )
}
