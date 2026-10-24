import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Flag,
  Loader2,
  Ban,
  EyeOff,
  AlertTriangle,
  ShieldAlert,
  HelpCircle,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, toast } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useCreatePostReport } from '../hooks/useCreatePostReport'
import {
  createPostReportSchema,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type CreatePostReportInput,
  type ReportReason,
} from '../model/report'

interface ReasonConfig {
  icon: typeof Ban
  iconColor: string
  iconBg: string
  description: string
}

const REASON_CONFIG: Record<ReportReason, ReasonConfig> = {
  SPAM: {
    icon: Ban,
    iconColor: 'text-warning',
    iconBg: 'bg-warning-soft',
    description: 'Nội dung lặp lại, quảng cáo rác hoặc không liên quan.',
  },
  INAPPROPRIATE: {
    icon: EyeOff,
    iconColor: 'text-danger',
    iconBg: 'bg-danger-soft',
    description: 'Nội dung bạo lực, phản cảm hoặc vi phạm chuẩn mực.',
  },
  MISINFORMATION: {
    icon: AlertTriangle,
    iconColor: 'text-orange-600 dark:text-orange-400',
    iconBg: 'bg-orange-500/10',
    description: 'Thông tin sai sự thật, gây hoang mang hoặc hiểu nhầm.',
  },
  SCAM_OR_FRAUD: {
    icon: ShieldAlert,
    iconColor: 'text-danger',
    iconBg: 'bg-danger-soft',
    description: 'Dấu hiệu lừa đảo tài chính, giả mạo danh tính.',
  },
  OTHER: {
    icon: HelpCircle,
    iconColor: 'text-info',
    iconBg: 'bg-info-soft',
    description: 'Vấn đề khác cần được quản trị viên xem xét riêng.',
  },
}

export function ReportPostModal({
  open,
  postId,
  onClose,
}: {
  open: boolean
  postId: string
  onClose: () => void
}) {
  const createReport = useCreatePostReport()
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreatePostReportInput>({
    resolver: zodResolver(createPostReportSchema),
    defaultValues: { reason: '', description: '' },
  })
  const reason = watch('reason')
  const description = watch('description') ?? ''

  useEffect(() => {
    if (open) {
      reset({ reason: '', description: '' })
      createReport.reset()
    }
  }, [open, reset])

  const close = () => {
    if (!createReport.isPending) onClose()
  }

  const submit = (input: CreatePostReportInput) => {
    createReport.mutate(
      { postId, input },
      {
        onSuccess: () => {
          toast.success('Đã gửi báo cáo vi phạm thành công')
          onClose()
        },
        onError: (err: any) => {
          toast.error(err?.message || 'Không thể gửi báo cáo')
        },
      },
    )
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Báo cáo bài viết"
      icon={<Flag size={18} className="text-danger" />}
      maxWidthClassName="max-w-[480px]"
      footer={(
        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            onClick={close}
            disabled={createReport.isPending}
            className="rounded-xl px-4 py-2 font-semibold text-xs text-text-muted"
          >
            Hủy
          </Button>
          <Button
            form="report-post-form"
            type="submit"
            disabled={createReport.isPending || !reason}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-primary-solid hover:bg-[#d96010] text-on-primary shadow-xs disabled:opacity-50"
            leftIcon={createReport.isPending ? <Loader2 size={15} className="animate-spin" /> : <Flag size={15} />}
          >
            {createReport.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </div>
      )}
    >
      <form id="report-post-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {/* Danh sách lý do báo cáo */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-text-subtle mb-2">
            Lý do báo cáo <span className="text-danger">*</span>
          </legend>
          <input type="hidden" {...register('reason')} />
          <div role="radiogroup" aria-label="Lý do báo cáo" className="space-y-1.5">
            {REPORT_REASONS.map((value) => {
              const selected = reason === value
              const cfg = REASON_CONFIG[value]
              const Icon = cfg.icon

              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setValue('reason', value, { shouldValidate: true, shouldDirty: true })}
                  className={cn(
                    'group relative flex w-full items-center justify-between rounded-xl border p-2 text-left transition duration-150 cursor-pointer',
                    selected
                      ? 'border-primary bg-primary-soft shadow-2xs ring-1 ring-primary/30'
                      : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors', cfg.iconBg, cfg.iconColor)}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <span className={cn('text-xs font-bold block truncate', selected ? 'text-primary-solid dark:text-primary' : 'text-text')}>
                        {REPORT_REASON_LABELS[value]}
                      </span>
                      <p className="text-xs text-text-subtle truncate">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <span
                    className={cn(
                      'grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition duration-150',
                      selected
                        ? 'border-primary bg-primary-solid text-on-primary shadow-2xs'
                        : 'border-border-strong bg-surface group-hover:border-slate-400',
                    )}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.reason && <span className="mt-1.5 block text-xs font-semibold text-danger">{errors.reason.message}</span>}
        </fieldset>

        {/* Ô mô tả chi tiết */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-subtle mb-1">
            Mô tả chi tiết {reason === 'OTHER' ? <span className="text-danger">*</span> : <span className="text-text-subtle font-normal normal-case">(không bắt buộc)</span>}
          </label>
          <textarea
            {...register('description')}
            rows={2}
            maxLength={500}
            aria-invalid={!!errors.description}
            placeholder={
              reason === 'OTHER'
                ? 'Vui lòng mô tả cụ thể vi phạm của bài viết...'
                : 'Bổ sung thông tin giúp chúng tôi xem xét nhanh hơn...'
            }
            className={cn(
              'w-full resize-none rounded-xl border bg-surface px-3 py-2 text-xs text-text placeholder:text-text-subtle outline-none transition dark:placeholder:text-text-subtle',
              errors.description
                ? 'border-danger ring-2 ring-danger'
                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20',
            )}
          />
          <div className="mt-0.5 flex items-center justify-between text-xs">
            {errors.description?.message ? (
              <span className="font-semibold text-danger">{errors.description.message}</span>
            ) : <span />}
            <span className="text-text-subtle">{description.length}/500</span>
          </div>
        </div>

        {createReport.isError && (
          <p role="alert" className="rounded-xl border border-danger-border bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            {createReport.error instanceof Error ? createReport.error.message : 'Không thể gửi báo cáo. Vui lòng thử lại.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
