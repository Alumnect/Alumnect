import React, { useState, useEffect } from 'react'
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
import { Card, toast } from '@/components/ui'
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
  const selectedGroupId = useWatch({ control, name: 'groupId' })
  const descriptionValue = useWatch({ control, name: 'description' })

  // Tải danh sách nhóm do user quản lý khi chọn loại hình GROUP
  const { data: managedGroups = [], isLoading: loadingManagedGroups, refetch: refetchGroups } = useQuery({
    queryKey: ['mentoring-groups', 'MANAGED'],
    queryFn: () => mentoringGroupApi.getMine('MANAGED'),
    enabled: selectedParticipationType === 'GROUP',
  })

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
      const msg = 'Chỉ được đính kèm tối đa 5 tệp tin'
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
        const msg = `Tệp tin "${file.name}" vượt quá giới hạn 10 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB)`
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
        const errMsg = err instanceof Error ? err.message : 'Tải tệp thất bại'
        toast.error(`Không thể tải tệp "${item.file.name}": ${errMsg}`)
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
        ? firstError.message : 'Vui lòng kiểm tra lại thông tin yêu cầu còn thiếu hoặc chưa hợp lệ'
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
      const msg = 'Bạn không thể tự gửi yêu cầu cố vấn cho chính tài khoản Mentor của mình'
      setServerError(msg)
      toast.error(msg)
      return
    }

    if (formData.participationType === 'GROUP' && (!formData.groupId || Number(formData.groupId) <= 0)) {
      const msg = 'Vui lòng chọn một nhóm đã tạo trước khi gửi yêu cầu'
      setServerError(msg)
      toast.error(msg)
      return
    }

    // 2. Kiểm tra lĩnh vực hợp lệ đối với Mentor được chọn (UC101)
    if (isDirectRequest && targetMentor) {
      if (!targetMentor.supportedFields || targetMentor.supportedFields.length === 0) {
        const msg = `Mentor ${targetMentor.fullName} chưa thiết lập lĩnh vực hỗ trợ. Vui lòng chọn Mentor khác.`
        setServerError(msg)
        toast.error(msg)
        return
      }

      const selectedId = Number(formData.industryId)
      const isSupported = targetMentor.supportedFields.some((sf) => sf.id === selectedId)
      if (!isSupported) {
        const msg = `Lĩnh vực chuyên môn được chọn không nằm trong danh mục hỗ trợ của Mentor ${targetMentor.fullName}.`
        setServerError(msg)
        toast.error(msg)
        return
      }
    }

    // 3. Kiểm tra nếu còn file đang uploading
    const stillUploading = attachedFiles.some((f) => f.uploading)
    if (stillUploading) {
      const msg = 'Vui lòng đợi các tệp tin đính kèm hoàn tất tải lên trước khi gửi yêu cầu'
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
          toast.success(isDirectRequest ? 'Gửi yêu cầu cố vấn trực tiếp thành công!' : 'Tạo yêu cầu mentoring thành công!')
          onSuccess(data)
        },
        onError: (err: Error & { data?: { data?: Record<string, string> } }) => {
          let errorMsg = err.message || 'Đã có lỗi xảy ra khi tạo yêu cầu. Vui lòng thử lại.'
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
        <div className="rounded-2xl border border-coral-200/80 bg-coral-50/80 p-4 flex items-start gap-3 text-coral-900 text-sm dark:bg-coral-950/40 dark:border-coral-800/40 dark:text-coral-200 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-coral-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Không thể tạo yêu cầu: </span>
            <span>{serverError}</span>
          </div>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="text-coral-500 hover:text-coral-700 dark:hover:text-coral-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SECTION A — Request Overview (Tiêu đề & Nội dung) */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-5 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-700/40 dark:text-brand-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              1. Thông tin yêu cầu hỗ trợ
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              {isDirectRequest && targetMentor
                ? `Mô tả rõ ràng vấn đề và kỳ vọng để gửi trực tiếp tới Mentor ${targetMentor.fullName}`
                : 'Mô tả rõ ràng vấn đề và kỳ vọng để hệ thống matching Mentor chuẩn xác nhất'}
            </p>
          </div>
        </div>

        {/* Tiêu đề (Title) */}
        <div className="space-y-1.5">
          <label htmlFor="title" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Tiêu đề yêu cầu <span className="text-coral-500">*</span>
          </label>
          <input
            id="title"
            type="text"
            placeholder="Ví dụ: Cần cố vấn định hướng đề tài Capstone Project Spring Boot & Microservices"
            {...register('title')}
            className="w-full rounded-2xl border border-plum-900/[0.12] bg-white px-4 py-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb] dark:placeholder:text-[#8a8d91]"
          />
          {errors.title && (
            <p className="text-xs font-semibold text-coral-600 dark:text-coral-400 pt-0.5">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Nội dung chi tiết (Description) */}
        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Mô tả chi tiết nhu cầu <span className="text-coral-500">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Mô tả bối cảnh hiện tại, mục tiêu bạn muốn đạt được, những khó khăn bạn đang gặp phải và mong đợi cụ thể từ Mentor..."
            {...register('description')}
            className="w-full rounded-2xl border border-plum-900/[0.12] bg-white px-4 py-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb] dark:placeholder:text-[#8a8d91]"
          />
          <div className="flex justify-between items-center text-[11px] text-plum-400 dark:text-[#8f9399]">
            <span>Tối thiểu 20 ký tự, tối đa 3000 ký tự</span>
            <span>{descriptionValue?.length || 0}/3000</span>
          </div>
          {errors.description && (
            <p className="text-xs font-semibold text-coral-600 dark:text-coral-400 pt-0.5">
              {errors.description.message}
            </p>
          )}
        </div>
      </Card>

      {/* SECTION B — Mentoring Field (Lĩnh vực ngành nghề) */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-gold-700 dark:bg-amber-950/40 dark:text-gold-300">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              2. Lĩnh vực / Chuyên môn hỗ trợ
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              {isDirectRequest && targetMentor
                ? `Chỉ hiển thị các lĩnh vực chuyên môn mà Mentor ${targetMentor.fullName} hỗ trợ tiếp nhận`
                : 'Hệ thống sẽ matching và phân phối tới các Mentor có chuyên môn trong lĩnh vực này'}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="industryId" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Lĩnh vực ngành nghề <span className="text-coral-500">*</span>
          </label>
          <select
            id="industryId"
            disabled={loadingIndustries}
            {...register('industryId')}
            className="w-full rounded-2xl border border-plum-900/[0.12] bg-white px-4 py-3 text-sm font-semibold text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb]"
          >
            <option value="" disabled>
              {loadingIndustries ? '-- Đang tải danh mục lĩnh vực... --' : '-- Chọn lĩnh vực cần hỗ trợ --'}
            </option>
            {industries.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.name}
              </option>
            ))}
          </select>
          {errors.industryId && (
            <p className="text-xs font-semibold text-coral-600 dark:text-coral-400 pt-0.5">
              {errors.industryId.message}
            </p>
          )}
        </div>
      </Card>

      {/* SECTION C — Ngân sách dự kiến */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-mint-700 dark:bg-mint-950/40 dark:text-mint-300">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              3. Ngân sách dự kiến (VNĐ)
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              Không bắt buộc — để trống nếu bạn muốn trao đổi mức phí linh hoạt cùng Mentor
            </p>
          </div>
        </div>

        <div className="max-w-xl space-y-1.5">
          <label htmlFor="budgetMin" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Mức ngân sách (VNĐ)
          </label>
          <div className="relative">
            <input
              id="budgetMin"
              type="number"
              min="0"
              step="any"
              placeholder="Ví dụ: 300000 (nhập 0 nếu mong muốn miễn phí)"
              {...register('budgetMin')}
              className="w-full rounded-2xl border border-plum-900/[0.12] bg-white px-4 py-3 pr-12 text-sm text-plum-900 placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb]"
            />
            <span className="absolute right-4 top-3.5 text-xs font-bold text-plum-400 dark:text-[#8f9399]">
              VNĐ
            </span>
          </div>
          {errors.budgetMin && (
            <p className="text-xs font-semibold text-coral-600 dark:text-coral-400 pt-0.5">
              {errors.budgetMin.message}
            </p>
          )}
          <p className="text-[11px] text-plum-500 dark:text-[#8f9399]">
            Hỗ trợ từ 0 VNĐ (miễn phí) đến không giới hạn. Để trống nếu bạn muốn thương lượng linh hoạt cùng Mentor.
          </p>
        </div>
      </Card>

      {/* SECTION D — Working Preferences (Hình thức & Loại nhiệm vụ) */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-6 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 dark:bg-violet-600/40 dark:text-violet-300">
            <Laptop className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              4. Phương thức làm việc & Nhiệm vụ
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              Chọn cách thức kết nối và loại hình hỗ trợ bạn mong đợi
            </p>
          </div>
        </div>

        {/* 4.1 Phương thức làm việc (Working Mode) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Phương thức làm việc <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['ONLINE', 'OFFLINE', 'BOTH'] as MentoringWorkingMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setValue('workingMode', mode)}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all ${
                  selectedWorkingMode === mode
                    ? 'border-brand-500 bg-brand-50/80 text-brand-700 shadow-xs dark:bg-brand-700/40 dark:text-brand-300 dark:border-brand-500'
                    : 'border-plum-900/[0.1] bg-white text-plum-600 hover:border-plum-900/20 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#b0b3b8]'
                }`}
              >
                <span>{WORKING_MODE_LABELS[mode]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 4.2 Hình thức tham gia (Participation Type) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Hình thức tham gia <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(['INDIVIDUAL', 'GROUP'] as const).map((type) => (
              <button
                key={type}
                type="button"
                disabled={type === 'GROUP' && groupUnsupportedByTargetMentor}
                onClick={() => setValue('participationType', type)}
                title={type === 'GROUP' && groupUnsupportedByTargetMentor ? 'Mentor này hiện chỉ nhận mentoring cá nhân' : undefined}
                className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                  selectedParticipationType === type
                    ? 'border-brand-500 bg-brand-50/80 text-brand-700 shadow-xs dark:bg-brand-700/40 dark:text-brand-300 dark:border-brand-500'
                    : 'border-plum-900/[0.1] bg-white text-plum-600 hover:border-plum-900/20 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#b0b3b8]'
                }`}
              >
                <span>{PARTICIPATION_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
          {groupUnsupportedByTargetMentor && (
            <p className="text-[11px] text-plum-500">Mentor này hiện chỉ nhận mentoring cá nhân.</p>
          )}
        </div>

        {/* 4.2.1 Chọn Nhóm Cố Vấn (Mô hình GROUP-FIRST) */}
        {selectedParticipationType === 'GROUP' && (
          <div className="space-y-4 rounded-2xl border border-brand-200 bg-brand-50/40 p-5 dark:border-brand-700/50 dark:bg-brand-700/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700 shadow-xs dark:bg-[#242526] dark:text-brand-300">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
                    Chọn nhóm cố vấn tham gia (Group-First)
                  </p>
                  <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
                    Yêu cầu phải được liên kết với một nhóm bạn làm Trưởng nhóm. Thành viên đã JOINED sẽ được chốt tham gia.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="self-start sm:self-auto gap-1.5 rounded-xl border-brand-300 text-brand-700 hover:bg-brand-100/60 dark:border-brand-700 dark:text-brand-300 text-xs"
              >
                <Plus className="h-4 w-4" />
                Tạo nhóm mới
              </Button>
            </div>

            {loadingManagedGroups ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-plum-500">
                <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                Đang tải danh sách nhóm của bạn...
              </div>
            ) : managedGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-brand-300 bg-white/70 p-6 text-center dark:bg-[#18191a]/70 dark:border-brand-700/50">
                <Users className="mx-auto h-8 w-8 text-brand-400 mb-2 opacity-70" />
                <p className="text-sm font-bold text-plum-900 dark:text-white">
                  Bạn chưa có nhóm cố vấn nào đang hoạt động
                </p>
                <p className="text-xs text-plum-500 max-w-md mx-auto mt-1 mb-4 dark:text-[#b0b3b8]">
                  Quy trình mới yêu cầu tạo nhóm và mời thành viên trước khi gửi Mentoring Request dạng nhóm.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCreateGroupModalOpen(true)}
                  className="rounded-xl gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Tạo nhóm đầu tiên ngay
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="group-select" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
                  Nhóm đại diện <span className="text-coral-500">*</span>
                </label>
                <select
                  id="group-select"
                  value={typeof selectedGroupId === 'number' ? selectedGroupId : ''}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : null
                    setValue('groupId', val, { shouldValidate: true })
                  }}
                  className="w-full rounded-xl border border-plum-900/15 bg-white px-4 py-2.5 text-sm font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb]"
                >
                  <option value="">-- Chọn nhóm cố vấn của bạn --</option>
                  {managedGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.joinedMemberCount || group.members?.filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length || 1} thành viên đã tham gia)
                    </option>
                  ))}
                </select>
                {errors.groupId && (
                  <p className="text-xs font-semibold text-coral-600 dark:text-coral-400">
                    {errors.groupId.message}
                  </p>
                )}
              </div>
            )}

            {/* Chi tiết nhóm được chọn & Snapshot thành viên */}
            {selectedGroupId && currentGroupDetail ? (
              <div className="space-y-4 pt-2">
                {/* Snapshot thành viên chính thức (JOINED) */}
                <div className="rounded-xl border border-plum-900/10 bg-white p-4 dark:border-[#3a3b3c] dark:bg-[#242526]">
                  <div className="flex items-center justify-between border-b border-plum-900/5 pb-2.5 mb-3">
                    <span className="text-xs font-bold text-plum-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-mint-600 dark:text-mint-400" />
                      Danh sách thành viên chính thức tham gia Request (Snapshot)
                    </span>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      {(currentGroupDetail.members || []).filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length} thành viên
                    </span>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(currentGroupDetail.members || [])
                      .filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE')
                      .map((member: MentoringGroupMemberData) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 rounded-lg border border-plum-900/5 bg-cream-100/60 p-2.5 dark:border-white/5 dark:bg-white/5"
                        >
                          <img
                            src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-xs font-bold text-plum-900 dark:text-white">
                                {member.fullName}
                              </span>
                              {member.leader && (
                                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                                  Trưởng nhóm
                                </span>
                              )}
                            </div>
                            <span className="block truncate text-[11px] text-plum-500 dark:text-[#8f9399]">
                              {member.major || member.email}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>

                  {(currentGroupDetail.members || []).filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length === 1 && (
                    <p className="mt-3 text-[11px] text-plum-500 italic dark:text-[#8f9399]">
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
                    <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-4 text-sm dark:border-amber-700/60 dark:bg-amber-950/40">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 dark:text-amber-400" />
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold text-amber-900 dark:text-amber-200">
                            Một số thành viên được mời chưa phản hồi ({pendingMembers.length} lời mời đang chờ)
                          </p>
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Chỉ những thành viên đã chấp nhận (JOINED) mới chính thức tham gia vào Mentoring Request này. Các thành viên đang ở trạng thái PENDING sẽ bị loại khỏi snapshot.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/app/mentoring/groups/${selectedGroupId}`)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors dark:bg-[#18191a] dark:border-amber-700 dark:text-amber-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Quay lại nhóm để quản lý lời mời
                            </button>
                            <span className="text-xs text-amber-700 dark:text-amber-300 italic">
                              (Nhấn &quot;Gửi yêu cầu&quot; phía dưới để tiếp tục với thành viên đã xác nhận)
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
          <label className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Loại nhiệm vụ cố vấn <span className="text-coral-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TASK_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue('taskType', opt.value)}
                className={`flex flex-col text-left rounded-2xl border p-3.5 transition-all ${
                  selectedTaskType === opt.value
                    ? 'border-brand-500 bg-brand-50/70 shadow-xs dark:bg-brand-700/40 dark:border-brand-500'
                    : 'border-plum-900/[0.1] bg-white hover:border-plum-900/20 dark:bg-[#18191a] dark:border-[#3a3b3c]'
                }`}
              >
                <span className={`text-xs font-bold ${
                  selectedTaskType === opt.value ? 'text-brand-700 dark:text-brand-200' : 'text-plum-900 dark:text-[#e4e6eb]'
                }`}>
                  {opt.label}
                </span>
                <span className="text-[11px] text-plum-500 leading-relaxed mt-1 dark:text-[#8f9399]">
                  {opt.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* SECTION E — Timeline (Thời hạn mong muốn) */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-100 text-coral-700 dark:bg-coral-950/40 dark:text-coral-300">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              5. Thời hạn mong muốn hoàn thành
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              Đặt mốc thời gian bạn mong muốn nhận hỗ trợ xong để Mentor sắp xếp lịch trình
            </p>
          </div>
        </div>

        <div className="space-y-1.5 max-w-sm">
          <label htmlFor="expectedDeadline" className="block text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
            Hạn chót hoàn thành (Expected Deadline)
          </label>
          <input
            id="expectedDeadline"
            type="date"
            min={minimumDeadline}
            {...register('expectedDeadline')}
            className="w-full rounded-2xl border border-plum-900/[0.12] bg-white px-4 py-3 text-sm text-plum-900 focus:border-brand-500 focus:outline-none focus:ring-3 focus:ring-brand-500/15 dark:bg-[#18191a] dark:border-[#3a3b3c] dark:text-[#e4e6eb]"
          />
          {errors.expectedDeadline && (
            <p className="text-xs font-semibold text-coral-600 dark:text-coral-400 pt-0.5">
              {errors.expectedDeadline.message}
            </p>
          )}
        </div>
      </Card>

      {/* SECTION F — Attachments (Tệp đính kèm) */}
      <Card hover={false} className="p-6 sm:p-7 border border-plum-900/[0.08] bg-white space-y-4 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex items-center gap-3 border-b border-plum-900/[0.06] pb-3.5 dark:border-[#393a3b]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-700/40 dark:text-brand-300">
            <Paperclip className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              6. Tài liệu / Tệp tin đính kèm
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#8f9399]">
              Tải lên đề cương đồ án, slide tóm tắt, mô tả bài toán... (Tối đa 5 file, mỗi file &lt; 10 MB)
            </p>
          </div>
        </div>

        {/* Upload dropzone */}
        <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-plum-900/[0.15] bg-cream-50/50 p-6 text-center transition-colors hover:border-brand-400 dark:bg-white/[0.02] dark:border-[#3a3b3c]">
          <UploadCloud className="h-8 w-8 text-brand-500 mb-2" />
          <p className="text-xs font-bold text-plum-900 dark:text-[#e4e6eb]">
            Kéo thả hoặc nhấp để chọn tệp tin
          </p>
          <p className="text-[11px] text-plum-500 mt-1 dark:text-[#8f9399]">
            Hỗ trợ PDF, DOCX, PNG, JPG, ZIP (mỗi file nhỏ hơn 10 MB)
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
                className="flex items-center justify-between rounded-xl border border-plum-900/[0.08] bg-white p-3 text-xs dark:bg-[#18191a] dark:border-[#3a3b3c]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-700/40 dark:text-brand-400">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="font-bold text-plum-900 truncate dark:text-[#e4e6eb]">{item.file.name}</p>
                    <p className="text-[11px] text-plum-400 dark:text-[#8f9399]">
                      {(item.file.size / 1024).toFixed(1)} KB
                      {item.uploading && ' • Đang tải lên...'}
                      {item.error && ` • Lỗi: ${item.error}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 rounded-lg text-plum-400 hover:text-coral-600 hover:bg-coral-50 transition-colors dark:hover:bg-coral-950/40"
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
            className="w-full sm:w-auto rounded-2xl font-bold text-plum-600 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white"
          >
            Hủy bỏ
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
              ? 'Không thể gửi cho chính mình'
              : createMutation.isPending
              ? isDirectRequest
                ? 'Đang gửi yêu cầu trực tiếp...'
                : 'Đang tạo & Matching...'
              : isDirectRequest
              ? 'Gửi yêu cầu tới Mentor'
              : 'Đăng yêu cầu Mentoring'}
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
