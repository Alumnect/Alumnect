import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { CheckCircle2, Flag, Loader2, ShieldAlert, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
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

const SUCCESS_PARTICLES = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  x: ((index * 47) % 220) - 110,
  y: -50 - ((index * 31) % 130),
  color: ['bg-brand-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400', 'bg-violet-400'][index % 5],
  delay: (index % 4) * 0.04,
}))

export function ReportPostModal({
  open,
  postId,
  onClose,
}: {
  open: boolean
  postId: string
  onClose: () => void
}) {
  const [submitted, setSubmitted] = useState(false)
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
      setSubmitted(false)
    }
  }, [open, reset])

  const close = () => {
    if (!createReport.isPending) onClose()
  }

  const submit = (input: CreatePostReportInput) => {
    createReport.mutate({ postId, input }, { onSuccess: () => setSubmitted(true) })
  }

  if (submitted) {
    return (
      <Modal
        isOpen={open}
        onClose={close}
        title="Báo cáo đã được gửi"
        icon={<CheckCircle2 size={18} className="text-emerald-600" />}
        maxWidthClassName="max-w-md"
        className="border-emerald-500/10"
        footer={
          <Button onClick={close} className="w-full sm:w-auto" leftIcon={<CheckCircle2 size={17} />}>
            Đóng
          </Button>
        }
      >
        <div className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-50 via-white to-brand-50/40 px-4 py-7 text-center">
          <motion.div
            aria-hidden="true"
            className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-emerald-200/50 blur-2xl"
            animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.8, 0.45] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-brand-200/35 blur-2xl"
            animate={{ scale: [1.12, 0.94, 1.12], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {SUCCESS_PARTICLES.map((particle) => (
            <motion.span
              key={particle.id}
              aria-hidden="true"
              className={`absolute left-1/2 top-1/2 h-2.5 w-2.5 rounded-full ${particle.color}`}
              initial={{ opacity: 0, scale: 0, x: 0, y: 8 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.15, 0.7], x: particle.x, y: particle.y }}
              transition={{ duration: 1.15, delay: particle.delay, ease: 'easeOut' }}
            />
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.45, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 230, delay: 0.08 }}
            className="relative z-10 mx-auto grid h-24 w-24 place-items-center rounded-full border-8 border-white bg-emerald-100 text-emerald-600 shadow-[0_16px_35px_-16px_rgba(16,185,129,0.65)]"
          >
            <motion.svg viewBox="0 0 24 24" className="h-12 w-12 fill-none stroke-current" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
              <motion.path
                d="M20 6 9 17l-5-5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.36, ease: 'easeOut' }}
              />
            </motion.svg>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
            className="relative z-10"
          >
            <h4 className="mt-5 text-2xl font-extrabold tracking-tight text-emerald-700">Cảm ơn bạn đã lên tiếng</h4>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-plum-600">
              Báo cáo đã được ghi nhận và sẽ được đội ngũ quản trị xem xét.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.32 }}
            className="relative z-10 mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-3.5 py-2 text-xs font-bold text-emerald-700 shadow-sm"
          >
            <Sparkles size={14} />
            Trạng thái: đang chờ xử lý
          </motion.div>
        </div>
      </Modal>
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
