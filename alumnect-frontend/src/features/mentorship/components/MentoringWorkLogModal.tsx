import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, FileText, Paperclip, Upload, Loader2, Trash2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { useCreateWorkLog, useUpdateWorkLog } from '../hooks/useMentoringTasks'
import type {
  MentoringWorkLog,
  WorkLogAttachmentPayload,
} from '../model/mentoringTaskTypes'

const workLogSchema = z.object({
  logDate: z.string().min(1, 'Ngày ghi nhận công việc không được để trống.'),
  description: z
    .string()
    .trim()
    .min(5, 'Mô tả công việc phải từ 5 đến 5000 ký tự.')
    .max(5000, 'Mô tả công việc phải từ 5 đến 5000 ký tự.'),
  workCompleted: z
    .string()
    .trim()
    .min(5, 'Nội dung công việc hoàn thành phải từ 5 đến 5000 ký tự.')
    .max(5000, 'Nội dung công việc hoàn thành phải từ 5 đến 5000 ký tự.'),
  result: z
    .string()
    .trim()
    .min(5, 'Kết quả đạt được phải từ 5 đến 5000 ký tự.')
    .max(5000, 'Kết quả đạt được phải từ 5 đến 5000 ký tự.'),
  nextAction: z
    .string()
    .trim()
    .max(2000, 'Hành động tiếp theo không vượt quá 2000 ký tự.')
    .optional(),
})

type WorkLogFormValues = z.infer<typeof workLogSchema>

interface MentoringWorkLogModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  editingLog?: MentoringWorkLog | null
  onSuccess?: () => void
}

export function MentoringWorkLogModal({
  isOpen,
  onClose,
  taskId,
  editingLog,
  onSuccess,
}: MentoringWorkLogModalProps) {
  const [attachments, setAttachments] = useState<WorkLogAttachmentPayload[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isEditing = !!editingLog
  const createMutation = useCreateWorkLog(taskId)
  const updateMutation = useUpdateWorkLog(taskId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WorkLogFormValues>({
    resolver: zodResolver(workLogSchema),
    defaultValues: {
      logDate: new Date().toISOString().split('T')[0],
      description: '',
      workCompleted: '',
      result: '',
      nextAction: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setSubmitError(null)
      setUploadError(null)
      if (editingLog) {
        reset({
          logDate: editingLog.logDate,
          description: editingLog.description,
          workCompleted: editingLog.workCompleted,
          result: editingLog.result,
          nextAction: editingLog.nextAction || '',
        })
        setAttachments(
          editingLog.attachments?.map((a) => ({
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileSize: a.fileSize,
            mediaType: a.mediaType,
          })) || []
        )
      } else {
        reset({
          logDate: new Date().toISOString().split('T')[0],
          description: '',
          workCompleted: '',
          result: '',
          nextAction: '',
        })
        setAttachments([])
      }
    }
  }, [isOpen, editingLog, reset])

  if (!isOpen) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploaded: WorkLogAttachmentPayload[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > 20 * 1024 * 1024) {
          throw new Error(`Tệp "${file.name}" vượt quá kích thước cho phép (tối đa 20MB).`)
        }
        const res = await mentoringTaskApi.uploadWorkLogAttachment(file)
        uploaded.push(res)
      }
      setAttachments((prev) => [...prev, ...uploaded])
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi tải tệp lên máy chủ.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (values: WorkLogFormValues) => {
    setSubmitError(null)
    const payload = {
      ...values,
      attachments,
    }

    if (isEditing && editingLog) {
      updateMutation.mutate(
        { workLogId: editingLog.id, payload },
        {
          onSuccess: () => {
            onClose()
            if (onSuccess) onSuccess()
          },
          onError: (err: any) => {
            setSubmitError(err.message || 'Có lỗi xảy ra khi cập nhật Work Log.')
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onClose()
          if (onSuccess) onSuccess()
        },
        onError: (err: any) => {
          setSubmitError(err.message || 'Có lỗi xảy ra khi tạo Work Log.')
        },
      })
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-5 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text">
                {isEditing ? 'Chỉnh sửa nhật ký công việc' : 'Thêm nhật ký công việc (Work Log)'}
              </h3>
              <p className="text-xs text-text-subtle">
                Ghi nhận tiến độ công việc để học viên xác nhận nghiệm thu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-2 text-text-subtle transition-colors hover:bg-surface-2 hover:text-text-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
          {submitError && (
            <div className="rounded-2xl border border-danger-border bg-danger-soft p-3.5 text-xs font-bold text-danger">
              {submitError}
            </div>
          )}

          {/* Ngày thực hiện */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Ngày thực hiện công việc <span className="text-danger">*</span>
            </label>
            <DateTimePicker
              mode="date"
              value={watch('logDate')}
              disabled={isSubmitting}
              invalid={!!errors.logDate}
              onChange={(val) => setValue('logDate', val, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.logDate && (
              <p className="mt-1 text-xs font-bold text-danger">{errors.logDate.message}</p>
            )}
          </div>

          {/* Mô tả tóm tắt */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Mô tả tóm tắt nội dung <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Buổi hướng dẫn thiết kế Database & cài đặt Spring Boot"
              {...register('description')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text outline-hidden transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.description && (
              <p className="mt-1 text-xs font-bold text-danger">{errors.description.message}</p>
            )}
          </div>

          {/* Nội dung công việc hoàn thành */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Nội dung công việc hoàn thành <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Chi tiết các hạng mục đã hoàn thành trong buổi làm việc..."
              {...register('workCompleted')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-normal text-text outline-hidden transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.workCompleted && (
              <p className="mt-1 text-xs font-bold text-danger">{errors.workCompleted.message}</p>
            )}
          </div>

          {/* Kết quả đạt được */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Kết quả & Sản phẩm đạt được <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Sản phẩm bàn giao, code demo, tài liệu hướng dẫn đã hoàn thiện..."
              {...register('result')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-normal text-text outline-hidden transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.result && (
              <p className="mt-1 text-xs font-bold text-danger">{errors.result.message}</p>
            )}
          </div>

          {/* Hành động tiếp theo */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Kế hoạch / Hành động tiếp theo (tùy chọn)
            </label>
            <input
              type="text"
              placeholder="VD: Học viên làm bài tập thực hành phần JPA Repository"
              {...register('nextAction')}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text outline-hidden transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {errors.nextAction && (
              <p className="mt-1 text-xs font-bold text-danger">{errors.nextAction.message}</p>
            )}
          </div>

          {/* Attachments Upload */}
          <div>
            <label className="block text-xs font-bold text-text-muted mb-1.5">
              Tài liệu minh chứng đính kèm (Hình ảnh, Tài liệu, Deliverables)
            </label>

            {uploadError && (
              <p className="mb-2 text-xs font-bold text-danger">{uploadError}</p>
            )}

            <div className="flex items-center gap-3">
              <label
                className={`inline-flex items-center gap-2 rounded-2xl border border-dashed border-plum-900/20 bg-cream-100/70 px-4 py-2.5 text-xs font-bold text-plum-600 transition-colors hover:border-brand-500 hover:text-brand-700 cursor-pointer dark:border-white/20 dark:bg-bg dark:text-text-muted ${
                  isUploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary-solid" />
                ) : (
                  <Upload className="h-4 w-4 text-primary-solid" />
                )}
                <span>{isUploading ? 'Đang tải lên...' : 'Chọn tệp tải lên'}</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading || isSubmitting}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-text-subtle">
                Tối đa 20MB / tệp
              </span>
            </div>

            {/* Uploaded attachments preview */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-cream-100/80 p-2.5 text-xs dark:bg-bg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Paperclip className="h-3.5 w-3.5 text-primary-solid shrink-0" />
                      <span className="truncate font-semibold text-text">
                        {att.fileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(i)}
                      disabled={isSubmitting}
                      className="rounded-lg p-1 text-text-subtle hover:text-danger transition-colors"
                      title="Gỡ tệp"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              }
              className="rounded-xl shadow-xs"
            >
              {isSubmitting
                ? 'Đang lưu...'
                : isEditing
                ? 'Cập nhật Work Log'
                : 'Nộp Work Log'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
