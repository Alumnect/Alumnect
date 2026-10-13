import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Send, Edit3, Loader2, DollarSign, Calendar } from 'lucide-react'
import { Button, toast } from '@/components/ui'
import {
  MENTORING_DEAL_TASK_TYPES,
  proposeDealSchema,
  type MentoringDeal,
  type ProposeDealFormData,
} from '../model/mentoringDealTypes'
import { MENTORING_TASK_TYPE_LABELS } from '../model/mentoringFlowLabels'
import { useProposeDeal } from '../hooks/useMentoringDeals'

/** Giá trị gợi ý ban đầu lấy từ Request khi Mentor chưa có phiên bản Deal nào */
export interface DealFormRequestDefaults {
  title?: string
  description?: string
  budgetMin?: number | null
  budgetMax?: number | null
  expectedDeadline?: string | null
  workingMode?: 'ONLINE' | 'OFFLINE' | 'BOTH'
  participationType?: 'INDIVIDUAL' | 'GROUP' | 'BOTH'
  taskType?: string
}

interface MentoringDealFormModalProps {
  isOpen: boolean
  onClose: () => void
  /** Chat for Task mà Deal Ticket thuộc về (Request / Student / Mentor do backend suy ra) */
  conversationId: number
  /** Phiên bản Deal hiện tại (nếu có) để điền sẵn điều khoản khi deal lại */
  deal?: MentoringDeal | null
  /** Điều khoản của Request dùng làm gợi ý khi chưa có Deal */
  requestDefaults?: DealFormRequestDefaults
  onSuccess?: (deal: MentoringDeal) => void
}

/** Chuyển ISO string sang giá trị cho input datetime-local theo giờ địa phương */
function toLocalInputValue(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const offset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offset).toISOString().slice(0, 16)
}

/**
 * Modal "Deal lại / Tạo Deal Ticket" của Mentor trong Chat for Task (UC104, proposal_source = RENEGOTIATION).
 * Mỗi lần gửi sinh một phiên bản Deal Ticket mới; phiên bản cũ không còn được xác nhận / thanh toán.
 * Validate bằng react-hook-form + zod với thông điệp khớp DTO backend.
 */
export function MentoringDealFormModal({
  isOpen,
  onClose,
  conversationId,
  deal,
  requestDefaults,
  onSuccess,
}: MentoringDealFormModalProps) {
  const proposeMutation = useProposeDeal()

  const buildDefaults = (): ProposeDealFormData => {
    if (deal) {
      return {
        taskScope: deal.taskScope,
        agreedPrice: Number(deal.agreedPrice),
        deadline: toLocalInputValue(deal.deadline),
        workingMode: deal.workingMode,
        participationType: deal.participationType,
        taskType: deal.taskType,
        expectedResult: deal.expectedResult,
        changeNote: '',
      }
    }
    const scope = [requestDefaults?.title, requestDefaults?.description].filter(Boolean).join('\n\n')
    const requestTaskType = requestDefaults?.taskType as ProposeDealFormData['taskType'] | undefined
    return {
      taskScope: scope,
      agreedPrice: Number(requestDefaults?.budgetMax ?? requestDefaults?.budgetMin ?? 500000),
      deadline: toLocalInputValue(requestDefaults?.expectedDeadline),
      workingMode: requestDefaults?.workingMode || 'ONLINE',
      participationType: requestDefaults?.participationType === 'GROUP' ? 'GROUP' : 'INDIVIDUAL',
      taskType: requestTaskType && MENTORING_DEAL_TASK_TYPES.includes(requestTaskType) ? requestTaskType : 'OTHER',
      expectedResult: '',
      changeNote: '',
    }
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposeDealFormData>({
    resolver: zodResolver(proposeDealSchema),
    defaultValues: buildDefaults(),
  })

  useEffect(() => {
    if (isOpen) reset(buildDefaults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, deal?.id, deal?.version])

  if (!isOpen) return null

  const onSubmit = async (data: ProposeDealFormData) => {
    try {
      const created = await proposeMutation.mutateAsync({
        conversationId,
        proposalSource: 'RENEGOTIATION',
        taskScope: data.taskScope,
        agreedPrice: Number(data.agreedPrice),
        deadline: new Date(data.deadline).toISOString(),
        workingMode: data.workingMode,
        participationType: data.participationType,
        taskType: data.taskType,
        expectedResult: data.expectedResult,
        changeNote: data.changeNote || undefined,
      })
      toast.success(`Đã gửi Deal Ticket phiên bản ${created.version}. Đang chờ Học viên phản hồi.`)
      onSuccess?.(created)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : 'Không thể gửi Deal Ticket. Vui lòng thử lại.')
    }
  }

  const isPending = proposeMutation.isPending || isSubmitting
  const inputClass =
    'w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[90vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            <Edit3 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-black text-plum-900 dark:text-[#f0f2f5]">
              {deal ? `Deal lại — tạo phiên bản ${deal.version + 1}` : 'Tạo Deal Ticket'}
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              Bạn được tính là đã xác nhận phiên bản này khi gửi. Học viên cần xác nhận để khóa Deal và thanh toán.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Loại nhiệm vụ <span className="text-rose-500">*</span>
              </label>
              <select {...register('taskType')} className={inputClass}>
                {MENTORING_DEAL_TASK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {MENTORING_TASK_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              {errors.taskType && <p className="text-rose-500 text-[11px] font-medium">{errors.taskType.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Hình thức tham gia <span className="text-rose-500">*</span>
              </label>
              <select {...register('participationType')} className={inputClass}>
                <option value="INDIVIDUAL">Kèm cặp cá nhân 1-1</option>
                <option value="GROUP">Hướng dẫn theo nhóm học viên</option>
              </select>
              {errors.participationType && (
                <p className="text-rose-500 text-[11px] font-medium">{errors.participationType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Hình thức làm việc <span className="text-rose-500">*</span>
              </label>
              <select {...register('workingMode')} className={inputClass}>
                <option value="ONLINE">Trực tuyến (Online)</option>
                <option value="OFFLINE">Trực tiếp (Offline)</option>
                <option value="BOTH">Linh hoạt (Online & Offline)</option>
              </select>
              {errors.workingMode && <p className="text-rose-500 text-[11px] font-medium">{errors.workingMode.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Mức giá thỏa thuận (VND) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1000"
                  {...register('agreedPrice', { valueAsNumber: true })}
                  placeholder="Ví dụ: 500000"
                  className={`${inputClass} pl-9`}
                />
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-plum-400" />
              </div>
              {errors.agreedPrice && <p className="text-rose-500 text-[11px] font-medium">{errors.agreedPrice.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Hạn chót hoàn thành (Deadline) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input type="datetime-local" {...register('deadline')} className={`${inputClass} pl-9`} />
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-plum-400" />
            </div>
            {errors.deadline && <p className="text-rose-500 text-[11px] font-medium">{errors.deadline.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Phạm vi công việc (Task Scope) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register('taskScope')}
              placeholder="Mô tả chi tiết những gì Mentor sẽ hướng dẫn và Học viên cần hoàn thành..."
              className={`${inputClass} font-normal leading-relaxed`}
            />
            {errors.taskScope && <p className="text-rose-500 text-[11px] font-medium">{errors.taskScope.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Kết quả kỳ vọng đầu ra (Expected Result) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('expectedResult')}
              placeholder="Sản phẩm, tài liệu hoặc kỹ năng cụ thể đạt được sau khi hoàn thành Task..."
              className={`${inputClass} font-normal leading-relaxed`}
            />
            {errors.expectedResult && (
              <p className="text-rose-500 text-[11px] font-medium">{errors.expectedResult.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">Ghi chú phiên bản (tùy chọn)</label>
            <input
              type="text"
              {...register('changeNote')}
              placeholder="Ví dụ: Điều chỉnh giá theo số buổi đã trao đổi..."
              className={`${inputClass} font-normal`}
            />
            {errors.changeNote && <p className="text-rose-500 text-[11px] font-medium">{errors.changeNote.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-plum-900/[0.06] dark:border-white/10">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="rounded-xl font-bold">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              leftIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              className="rounded-xl font-black bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20"
            >
              {isPending ? 'Đang gửi...' : 'Gửi Deal Ticket cho Học viên'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
