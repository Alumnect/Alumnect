import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Flag, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal, toast } from '@/components/ui'
import { useCreatePostReport } from '../hooks/useCreatePostReport'
import {
  createPostReportSchema,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  type CreatePostReportInput,
  type ReportReason,
} from '../model/report'

const REASON_DETAILS: Record<ReportReason, string> = {
  SPAM: 'Nội dung lặp lại hoặc quảng cáo không liên quan.',
  INAPPROPRIATE: 'Nội dung gây phản cảm hoặc vi phạm tiêu chuẩn cộng đồng.',
  MISINFORMATION: 'Thông tin có dấu hiệu không chính xác hoặc gây hiểu nhầm.',
  SCAM_OR_FRAUD: 'Có dấu hiệu lừa đảo, giả mạo hoặc gian lận.',
  OTHER: 'Một lý do khác cần được bạn mô tả rõ hơn.',
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
        }
      }
    )
  }

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title="Báo cáo bài viết"
      icon={<Flag size={18} className="text-coral-500" />}
      maxWidthClassName="max-w-lg"
      footer={(
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={close} disabled={createReport.isPending}>Hủy</Button>
          <Button
            form="report-post-form"
            type="submit"
            disabled={createReport.isPending}
            leftIcon={createReport.isPending ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />}
          >
            {createReport.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
          </Button>
        </div>
      )}
    >
      <form id="report-post-form" onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
        <div className="flex gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/55 p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-600 shadow-sm">
            <ShieldAlert size={20} />
          </span>
          <div>
            <p className="font-bold text-plum-900">Giúp giữ cộng đồng an toàn</p>
            <p className="mt-0.5 text-sm leading-5 text-plum-600">Chọn lý do phù hợp nhất. Thông tin của bạn chỉ được dùng để đội ngũ quản trị xem xét.</p>
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-bold text-plum-800">Lý do báo cáo <span className="text-coral-500">*</span></legend>
          <input type="hidden" {...register('reason')} />
          <div role="radiogroup" aria-label="Lý do báo cáo" className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {REPORT_REASONS.map((value) => {
              const selected = reason === value
              return (
                <motion.button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setValue('reason', value, { shouldValidate: true, shouldDirty: true })}
                  className={`group rounded-2xl border p-3 text-left transition-all ${selected
                    ? 'border-brand-400 bg-brand-50 shadow-[0_8px_18px_-14px_rgba(242,112,36,0.85)]'
                    : 'border-plum-900/10 bg-white hover:border-brand-200 hover:bg-cream-50'}`}
                >
                  <span className="flex items-start gap-2.5">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition ${selected ? 'border-brand-500 bg-brand-500' : 'border-plum-300 bg-white group-hover:border-brand-300'}`}>
                      {selected && <CheckCircle2 size={13} className="text-white" />}
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-plum-800">{REPORT_REASON_LABELS[value]}</span>
                      <span className="mt-0.5 block text-xs leading-4 text-plum-500">{REASON_DETAILS[value]}</span>
                    </span>
                  </span>
                </motion.button>
              )
            })}
          </div>
          {errors.reason && <span className="mt-2 block text-xs font-semibold text-coral-600">{errors.reason.message}</span>}
        </fieldset>

        <label className="block text-sm font-bold text-plum-800">
          Mô tả {reason === 'OTHER' && <span className="text-coral-500">*</span>}
          <textarea
            {...register('description')}
            rows={4}
            maxLength={500}
            aria-invalid={!!errors.description}
            placeholder="Bổ sung thông tin giúp chúng tôi xem xét báo cáo (không bắt buộc)."
            className="mt-1.5 w-full resize-y rounded-2xl border border-plum-900/10 bg-white px-3.5 py-3 text-sm text-plum-900 placeholder:text-plum-400 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
          <span className="mt-1 flex justify-between text-xs text-plum-400">
            <span className="text-coral-600">{errors.description?.message}</span>
            <span>{description.length}/500</span>
          </span>
        </label>

        {createReport.isError && (
          <p role="alert" className="rounded-2xl border border-coral-200 bg-coral-500/10 px-3.5 py-3 text-sm font-medium text-coral-700">
            {createReport.error instanceof Error ? createReport.error.message : 'Không thể gửi báo cáo. Vui lòng thử lại.'}
          </p>
        )}
      </form>
    </Modal>
  )
}
