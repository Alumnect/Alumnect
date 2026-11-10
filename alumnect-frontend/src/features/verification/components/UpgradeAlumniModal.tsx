import React, { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import {
  GraduationCap,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { Modal, SelectDropdown, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useMajors, usePresignedUrl } from '@/features/auth/hooks/useAuth'
import type { UserProfileResponse } from '@/features/user/model/userTypes'
import {
  upgradeAlumniSchema,
  type UpgradeAlumniFormValues,
} from '../model/schemas'
import type { VerificationStatusResponse } from '../model/verificationTypes'
import { useSubmitAlumniUpgrade } from '../hooks/useVerification'

interface UpgradeAlumniModalProps {
  isOpen: boolean
  onClose: () => void
  profile?: UserProfileResponse | null
  verificationStatus?: VerificationStatusResponse | null
}

const ALLOWED_PROOF_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

/**
 * Modal cho phép Sinh viên (STUDENT) gửi hoặc gửi lại yêu cầu nâng cấp tài khoản lên Cựu sinh viên (ALUMNI) (UC08).
 * Hỗ trợ tải tệp minh chứng tốt nghiệp lên Cloudflare R2 qua Presigned URL, chọn chuyên ngành và nhập năm tốt nghiệp.
 */
export function UpgradeAlumniModal({
  isOpen,
  onClose,
  profile,
  verificationStatus,
}: UpgradeAlumniModalProps) {
  const { data: majors, isLoading: isLoadingMajors } = useMajors()
  const presignedUrlMutation = usePresignedUrl()
  const submitUpgradeMutation = useSubmitAlumniUpgrade()

  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpgradeAlumniFormValues>({
    resolver: zodResolver(upgradeAlumniSchema),
    defaultValues: {
      proofUrl: '',
      graduationYear:
        verificationStatus?.graduationYear ??
        profile?.graduationYear ??
        currentYear,
      majorId:
        verificationStatus?.majorId ??
        profile?.major?.id ??
        (undefined as unknown as number),
    },
  })

  const currentProofUrl = watch('proofUrl')

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      setUploadedFileName(null)
      reset({
        proofUrl: '',
        graduationYear:
          verificationStatus?.graduationYear ??
          profile?.graduationYear ??
          currentYear,
        majorId:
          verificationStatus?.majorId ??
          profile?.major?.id ??
          (undefined as unknown as number),
      })
    }
  }, [isOpen, verificationStatus, profile, reset, currentYear])

  /**
   * Xử lý chọn tệp minh chứng từ thiết bị, kiểm tra định dạng & dung lượng, sau đó tải lên Cloudflare R2
   */
  const handleProofFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setServerError(null)

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      const msg =
        'Định dạng tệp không hợp lệ. Vui lòng chọn ảnh (JPG, PNG, WEBP) hoặc tài liệu (PDF, DOCX).'
      setServerError(msg)
      toast.error(msg)
      e.target.value = ''
      return
    }

    if (file.size > MAX_PROOF_SIZE_BYTES) {
      const msg = 'Dung lượng tệp minh chứng không được vượt quá 5MB.'
      setServerError(msg)
      toast.error(msg)
      e.target.value = ''
      return
    }

    setIsUploadingFile(true)
    try {
      const presignedRes = await presignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        folder: 'proofs',
      })

      const { uploadUrl, publicUrl } = presignedRes.data
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      })

      setValue('proofUrl', publicUrl, { shouldValidate: true })
      setUploadedFileName(file.name)
      toast.success('Đã tải lên tài liệu minh chứng thành công!')
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải tệp minh chứng lên hệ thống lưu trữ. Vui lòng thử lại.'
      setServerError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsUploadingFile(false)
      e.target.value = ''
    }
  }

  /**
   * Xử lý gửi biểu mẫu yêu cầu nâng cấp Cựu sinh viên lên Backend
   */
  const onSubmit = async (values: UpgradeAlumniFormValues) => {
    setServerError(null)
    try {
      const res = await submitUpgradeMutation.mutateAsync({
        proofUrl: values.proofUrl.trim(),
        graduationYear: values.graduationYear,
        majorId: values.majorId,
      })
      toast.success(
        res.message ||
          'Gửi yêu cầu nâng cấp Cựu sinh viên thành công! Hồ sơ của bạn đang chờ Quản trị viên xét duyệt.',
      )
      onClose()
    } catch (err: any) {
      const errMsg =
        err?.message ||
        'Đã xảy ra lỗi khi gửi yêu cầu nâng cấp Cựu sinh viên.'
      setServerError(errMsg)
      toast.error(errMsg)
    }
  }

  const isPending = verificationStatus?.status === 'PENDING'
  const isResubmitting = verificationStatus?.status === 'REJECTED'
  const isBusy = isUploadingFile || submitUpgradeMutation.isPending

  const formatDate = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isPending
          ? 'Trạng thái yêu cầu nâng cấp Cựu sinh viên'
          : isResubmitting
            ? 'Gửi lại yêu cầu nâng cấp Cựu sinh viên'
            : 'Nâng cấp tài khoản lên Cựu sinh viên'
      }
      icon={<GraduationCap size={18} />}
      maxWidthClassName="max-w-lg"
      footer={
        isPending ? (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isBusy}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              form="upgrade-alumni-form"
              variant="primary"
              size="md"
              disabled={isBusy}
              leftIcon={
                submitUpgradeMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : undefined
              }
            >
              {submitUpgradeMutation.isPending
                ? 'Đang gửi yêu cầu...'
                : isResubmitting
                  ? 'Gửi lại yêu cầu'
                  : 'Gửi yêu cầu'}
            </Button>
          </div>
        )
      }
    >
      {isPending ? (
        <div className="space-y-4 text-left">
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-4 text-xs leading-relaxed text-text">
            <p className="font-bold text-amber-600 dark:text-amber-400 mb-1">
              Hồ sơ của bạn đang chờ Quản trị viên xét duyệt
            </p>
            <p className="text-text-muted">
              Yêu cầu đã được gửi vào{' '}
              <strong>{formatDate(verificationStatus?.createdAt)}</strong>. Trong
              thời gian chờ duyệt, tài khoản Sinh viên của bạn vẫn hoạt động bình
              thường.
            </p>
          </div>

          <div className="space-y-2.5 rounded-2xl border border-border bg-surface-2/60 p-4 text-xs">
            {verificationStatus?.majorName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-subtle">Chuyên ngành:</span>
                <span className="font-bold text-text">
                  {verificationStatus.majorName}
                </span>
              </div>
            )}
            {verificationStatus?.graduationYear && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-text-subtle">Năm tốt nghiệp:</span>
                <span className="font-bold text-text">
                  {verificationStatus.graduationYear}
                </span>
              </div>
            )}
            {verificationStatus?.proofUrl && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                <span className="text-text-subtle">Tài liệu minh chứng:</span>
                <a
                  href={verificationStatus.proofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-primary-solid hover:underline"
                >
                  <span>Xem minh chứng đã nộp</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      ) : (
      <form
        id="upgrade-alumni-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 text-left"
        noValidate
      >
        {/* Lưu ý khi nâng cấp lên Cựu sinh viên */}
        <div className="rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-3.5 text-xs leading-relaxed text-text-muted">
          <div className="mb-1 flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
            <AlertTriangle size={15} />
            <span>Lưu ý quan trọng</span>
          </div>
          <p>
            Sau khi yêu cầu được Quản trị viên phê duyệt và tài khoản chuyển sang
            vai trò <strong>Cựu sinh viên</strong>, bạn sẽ{' '}
            <strong>không thể chuyển về lại vai trò Sinh viên</strong>. Vui lòng
            kiểm tra kỹ thông tin trước khi gửi yêu cầu.
          </p>
        </div>

        {/* Lý do từ chối lần trước (nếu có) */}
        {isResubmitting && verificationStatus?.reviewNote && (
          <div className="rounded-2xl border border-danger-border bg-danger-soft/70 p-3.5 text-xs text-danger">
            <div className="mb-1 flex items-center gap-1.5 font-bold">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Lý do từ chối lần xét duyệt trước:</span>
            </div>
            <p className="font-medium leading-relaxed">
              “{verificationStatus.reviewNote}”
            </p>
          </div>
        )}

        {/* Alert Banner hiển thị lỗi từ Backend */}
        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-2xl border border-danger-border bg-danger-soft p-3.5 text-xs font-semibold text-danger"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Thông tin mã sinh viên chỉ đọc */}
        {profile?.studentCode && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-xs">
            <span className="font-medium text-text-subtle">
              Mã số sinh viên FPTU:
            </span>
            <span className="font-bold text-text">{profile.studentCode}</span>
          </div>
        )}

        {/* 1. Chuyên ngành tốt nghiệp */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
            Chuyên ngành tốt nghiệp <span className="text-danger">*</span>
          </label>
          <Controller
            name="majorId"
            control={control}
            render={({ field }) => (
              <SelectDropdown<string | number>
                value={field.value ?? ''}
                onChange={(val) =>
                  field.onChange(val === '' ? undefined : Number(val))
                }
                options={[
                  { value: '', label: '-- Chọn chuyên ngành tốt nghiệp --' },
                  ...(majors ?? []).map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.code})`,
                  })),
                ]}
                placeholder={
                  isLoadingMajors
                    ? 'Đang tải danh sách chuyên ngành...'
                    : '-- Chọn chuyên ngành tốt nghiệp --'
                }
                disabled={isBusy || isLoadingMajors}
                buttonClassName="h-11 text-sm"
              />
            )}
          />
          {errors.majorId && (
            <p className="mt-1 text-xs font-semibold text-danger">
              {errors.majorId.message}
            </p>
          )}
        </div>

        {/* 2. Năm tốt nghiệp */}
        <div>
          <label
            htmlFor="upgrade-graduation-year"
            className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted"
          >
            Năm tốt nghiệp chính thức <span className="text-danger">*</span>
          </label>
          <input
            id="upgrade-graduation-year"
            type="number"
            min={2006}
            max={currentYear + 1}
            placeholder={`VD: ${currentYear}`}
            disabled={isBusy}
            {...register('graduationYear', { valueAsNumber: true })}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {errors.graduationYear && (
            <p className="mt-1 text-xs font-semibold text-danger">
              {errors.graduationYear.message}
            </p>
          )}
        </div>

        {/* 3. Tài liệu minh chứng tốt nghiệp */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
            Tài liệu minh chứng tốt nghiệp <span className="text-danger">*</span>
          </label>

          <div className="space-y-2.5 rounded-2xl border border-dashed border-border bg-surface-2/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-solid">
                  {currentProofUrl ? (
                    <CheckCircle2 size={18} className="text-success" />
                  ) : (
                    <FileText size={18} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-text">
                    {uploadedFileName
                      ? uploadedFileName
                      : currentProofUrl
                        ? 'Đã đính kèm đường dẫn minh chứng'
                        : 'Chưa có tệp minh chứng nào được chọn'}
                  </p>
                  {currentProofUrl ? (
                    <a
                      href={currentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary-solid hover:underline"
                    >
                      <span>Xem tài liệu đã tải lên</span>
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <p className="text-[11px] text-text-subtle">
                      Tải tệp từ máy tính hoặc dán đường dẫn bên dưới
                    </p>
                  )}
                </div>
              </div>

              <label className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-primary-soft px-3.5 py-2 text-xs font-bold text-primary-solid transition hover:opacity-90">
                {isUploadingFile ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                <span>
                  {isUploadingFile ? 'Đang tải lên...' : 'Chọn tệp minh chứng'}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
                  onChange={handleProofFileChange}
                  disabled={isBusy}
                  className="hidden"
                />
              </label>
            </div>

            {/* Ô nhập / hiển thị URL minh chứng trực tiếp */}
            <div>
              <input
                type="url"
                placeholder="Hoặc dán trực tiếp đường dẫn minh chứng (https://...)"
                disabled={isBusy}
                {...register('proofUrl')}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {errors.proofUrl && (
            <p className="mt-1 text-xs font-semibold text-danger">
              {errors.proofUrl.message}
            </p>
          )}
        </div>
      </form>
      )}
    </Modal>
  )
}

