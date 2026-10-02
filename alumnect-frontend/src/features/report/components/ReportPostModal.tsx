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
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-500/10',
    description: 'Nội dung lặp lại, quảng cáo rác hoặc không liên quan.',
  },
  INAPPROPRIATE: {
    icon: EyeOff,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/10',
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
    iconColor: 'text-red-600 dark:text-red-400',
    iconBg: 'bg-red-500/10',
    description: 'Dấu hiệu lừa đảo tài chính, giả mạo danh tính.',
  },
  OTHER: {
    icon: HelpCircle,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/10',
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
      icon={<Flag size={18} className="text-rose-500" />}
      maxWidthClassName="max-w-[480px]"
      footer={(
        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            onClick={close}
            disabled={createReport.isPending}
            className="rounded-xl px-4 py-2 font-semibold text-xs text-slate-700 dark:text-slate-200"
          >
            Hủy
          </Button>
          <Button
            form="report-post-form"
            type="submit"
            disabled={createReport.isPending || !reason}
            className="rounded-xl px-5 py-2 font-bold text-xs bg-[#F27024] hover:bg-[#d96010] text-white shadow-xs disabled:opacity-50"
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
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Lý do báo cáo <span className="text-rose-500">*</span>
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
                    'group relative flex w-full items-center justify-between rounded-xl border p-2 text-left transition-all duration-150 cursor-pointer',
                    selected
                      ? 'border-[#F27024] bg-[#F27024]/[0.05] dark:bg-[#F27024]/10 shadow-2xs ring-1 ring-[#F27024]/30'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-[#393a3b] dark:bg-[#242526] dark:hover:border-[#4e4f50] dark:hover:bg-[#3a3b3c]/50',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span className={cn('grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors', cfg.iconBg, cfg.iconColor)}>
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0">
                      <span className={cn('text-xs font-bold block truncate', selected ? 'text-[#F27024] dark:text-[#FF8C38]' : 'text-slate-800 dark:text-[#f0f2f5]')}>
                        {REPORT_REASON_LABELS[value]}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <span
                    className={cn(
                      'grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full border transition-all duration-150',
                      selected
                        ? 'border-[#F27024] bg-[#F27024] text-white shadow-2xs'
                        : 'border-slate-300 bg-white group-hover:border-slate-400 dark:border-[#4e4f50] dark:bg-[#3a3b3c]',
                    )}
                  >
                    {selected && <Check size={11} strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
          {errors.reason && <span className="mt-1.5 block text-xs font-semibold text-rose-500">{errors.reason.message}</span>}
        </fieldset>

        {/* Ô mô tả chi tiết */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Mô tả chi tiết {reason === 'OTHER' ? <span className="text-rose-500">*</span> : <span className="text-slate-400 font-normal normal-case">(không bắt buộc)</span>}
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
              'w-full resize-none rounded-xl border bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none transition-all dark:bg-[#18191a] dark:text-[#f0f2f5] dark:placeholder:text-[#8a8d91]',
              errors.description
                ? 'border-rose-400 ring-2 ring-rose-400/20'
                : 'border-slate-200/90 focus:border-[#F27024] focus:ring-2 focus:ring-[#F27024]/20 dark:border-[#393a3b]',
            )}
          />
          <div className="mt-0.5 flex items-center justify-between text-[11px]">
            {errors.description?.message ? (
              <span className="font-semibold text-rose-500">{errors.description.message}</span>
            ) : <span />}
            <span className="text-slate-400">{description.length}/500</span>
          </div>
        </div>

        {createReport.isError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 dark:text-rose-400 dark:border-rose-900/40">
            {createReport.error instanceof Error ? createReport.error.message : 'Không thể gửi báo cáo. Vui lòng thử lại.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
