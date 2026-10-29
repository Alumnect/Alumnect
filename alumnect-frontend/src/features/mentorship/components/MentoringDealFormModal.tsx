import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Send, Edit3, Loader2, DollarSign } from 'lucide-react'
import { Button, SelectDropdown, toast, DialogFrame } from '@/components/ui'
import { DateTimePicker } from '@/components/ui/DateTimePicker'
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
    watch,
    setValue,
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
      toast.success(t('mentoring.dealTicketSentWaitingResponse', { version: created.version }))
      onSuccess?.(created)
      onClose()
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : t('mentoring.dealTicketSendError'))
    }
  }

  const isPending = proposeMutation.isPending || isSubmitting
  const inputClass =
    'w-full rounded-2xl border border-border-strong bg-surface p-3 text-xs font-semibold text-text shadow-xs focus:border-primary focus:outline-none'

  if (typeof document === 'undefined') return null

  return <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-2xl"
      className="p-6 sm:p-7 text-left space-y-6 overflow-y-auto chat-scrollbar"
    >
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 p-2 text-text-subtle hover:text-text-muted rounded-full hover:bg-surface-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-solid">
            <Edit3 className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-text">
              {deal ? t('mentoring.redealCreateVersion', { version: deal.version + 1 }) : t('mentoring.createDealTicketHeading')}
            </h3>
            <p className="text-xs text-text-subtle">
              {t('mentoring.mentorConfirmedOnSubmitNotice')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text">
                {t('mentoring.taskTypeRequired')} <span className="text-danger">*</span>
              </label>
              <SelectDropdown
                value={watch('taskType')}
                onChange={(val) => setValue('taskType', val as ProposeDealFormData['taskType'], { shouldValidate: true, shouldDirty: true })}
                options={MENTORING_DEAL_TASK_TYPES.map((type) => ({ value: type, label: MENTORING_TASK_TYPE_LABELS[type] }))}
                placeholder={t('mentoring.selectTaskTypePlaceholder')}
              />
              {errors.taskType && <p className="text-danger text-xs font-medium">{errors.taskType.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text">
                {t('mentoring.participationRequired')} <span className="text-danger">*</span>
              </label>
              <SelectDropdown
                value={watch('participationType')}
                onChange={(val) => setValue('participationType', val as ProposeDealFormData['participationType'], { shouldValidate: true, shouldDirty: true })}
                options={[
                  { value: 'INDIVIDUAL', label: t('mentoring.partIndividualOption') },
                  { value: 'GROUP', label: t('mentoring.partGroupOption') },
                ]}
                placeholder={t('mentoring.selectParticipationPlaceholder')}
              />
              {errors.participationType && (
                <p className="text-danger text-xs font-medium">{errors.participationType.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text">
                {t('mentoring.workingModeRequired')} <span className="text-danger">*</span>
              </label>
              <SelectDropdown
                value={watch('workingMode')}
                onChange={(val) => setValue('workingMode', val as ProposeDealFormData['workingMode'], { shouldValidate: true, shouldDirty: true })}
                options={[
                  { value: 'ONLINE', label: t('mentoring.modeOnlineOption') },
                  { value: 'OFFLINE', label: t('mentoring.modeOfflineOption') },
                  { value: 'BOTH', label: t('mentoring.modeBothOption') },
                ]}
                placeholder={t('mentoring.selectWorkingModePlaceholder')}
              />
              {errors.workingMode && <p className="text-danger text-xs font-medium">{errors.workingMode.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text">
                {t('mentoring.agreedPriceVndRequired')} <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  {...register('agreedPrice', { valueAsNumber: true })}
                  placeholder={t('mentoring.agreedPricePlaceholder')}
                  className={`${inputClass} pl-9`}
                />
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-text-subtle" />
              </div>
              {errors.agreedPrice && <p className="text-danger text-xs font-medium">{errors.agreedPrice.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text">
              {t('mentoring.completionDeadlineRequired')} <span className="text-danger">*</span>
            </label>
            <DateTimePicker
              mode="datetime"
              value={watch('deadline')}
              invalid={!!errors.deadline}
              onChange={(val) => setValue('deadline', val, { shouldValidate: true, shouldDirty: true })}
            />
            {errors.deadline && <p className="text-danger text-xs font-medium">{errors.deadline.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text">
              {t('mentoring.taskScopeRequired')} <span className="text-danger">*</span>
            </label>
            <textarea
              rows={4}
              {...register('taskScope')}
              placeholder={t('mentoring.taskScopePlaceholder')}
              className={`${inputClass} font-normal leading-relaxed`}
            />
            {errors.taskScope && <p className="text-danger text-xs font-medium">{errors.taskScope.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text">
              {t('mentoring.expectedResultRequired')} <span className="text-danger">*</span>
            </label>
            <textarea
              rows={3}
              {...register('expectedResult')}
              placeholder={t('mentoring.expectedResultPlaceholder')}
              className={`${inputClass} font-normal leading-relaxed`}
            />
            {errors.expectedResult && (
              <p className="text-danger text-xs font-medium">{errors.expectedResult.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text">{t('mentoring.versionNoteOptional')}</label>
            <input
              type="text"
              {...register('changeNote')}
              placeholder={t('mentoring.versionNotePlaceholder')}
              className={`${inputClass} font-normal`}
            />
            {errors.changeNote && <p className="text-danger text-xs font-medium">{errors.changeNote.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="rounded-xl font-bold">
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              leftIcon={isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              className="rounded-xl font-bold bg-primary-solid hover:bg-primary-hover shadow-raised"
            >
              {isPending ? t('common.sending') : t('mentoring.sendDealTicketToStudentBtn')}
            </Button>
          </div>
        </form>
      </DialogFrame>
}
