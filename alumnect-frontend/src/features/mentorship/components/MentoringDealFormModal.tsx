import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Sparkles, Send, Edit3, Loader2, DollarSign, Calendar } from 'lucide-react'
import { Button, toast } from '@/components/ui'
import {
  proposeDealSchema,
  type ProposeDealFormData,
  type UpdateDealFormData,
  type MentoringDeal,
  type ProposalSource,
} from '../model/mentoringDealTypes'
import { useProposeDeal, useUpdateDealTerms } from '../hooks/useMentoringDeals'

interface MentoringDealFormModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  deal?: MentoringDeal
  mentorId?: number
  studentId?: number
  requestId?: number | null
  conversationId?: number | null
  proposalSource?: ProposalSource
  onSuccess?: (deal: MentoringDeal) => void
}

/**
 * Modal form đề xuất mới hoặc điều chỉnh điều khoản Mentoring Deal (UC104).
 * Validate dữ liệu nghiêm ngặt bằng react-hook-form + zod, phong cách Pastel Premium.
 */
export function MentoringDealFormModal({
  isOpen,
  onClose,
  mode,
  deal,
  mentorId,
  studentId,
  requestId,
  conversationId,
  proposalSource,
  onSuccess,
}: MentoringDealFormModalProps) {
  const isEdit = mode === 'edit'
  const proposeMutation = useProposeDeal()
  const updateMutation = useUpdateDealTerms()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProposeDealFormData>({
    resolver: zodResolver(proposeDealSchema),
    defaultValues: {
      mentorId: mentorId || deal?.mentorId,
      studentId: studentId || deal?.studentId,
      conversationId: conversationId || deal?.conversationId,
      taskScope: deal?.taskScope || '',
      agreedPrice: deal?.agreedPrice || 500000,
      deadline: deal?.deadline
        ? new Date(deal.deadline).toISOString().slice(0, 16)
        : '',
      workingMode: deal?.workingMode || 'ONLINE',
      participationType: deal?.participationType || 'INDIVIDUAL',
      taskType: deal?.taskType || 'PROJECT_MENTORING',
      expectedResult: deal?.expectedResult || '',
      changeNote: isEdit ? 'Điều chỉnh điều khoản theo trao đổi mới' : '',
    },
  })

  useEffect(() => {
    if (deal && isEdit) {
      reset({
        mentorId: deal.mentorId,
        studentId: deal.studentId,
        conversationId: deal.conversationId,
        taskScope: deal.taskScope,
        agreedPrice: deal.agreedPrice,
        deadline: new Date(deal.deadline).toISOString().slice(0, 16),
        workingMode: deal.workingMode,
        participationType: deal.participationType,
        taskType: deal.taskType,
        expectedResult: deal.expectedResult,
        changeNote: '',
      })
    }
  }, [deal, isEdit, reset])

  if (!isOpen) return null

  const onSubmit = async (data: ProposeDealFormData) => {
    try {
      if (isEdit && deal) {
        const payload: UpdateDealFormData = {
          taskScope: data.taskScope,
          agreedPrice: Number(data.agreedPrice),
          deadline: new Date(data.deadline).toISOString(),
          workingMode: data.workingMode,
          participationType: data.participationType,
          taskType: data.taskType,
          expectedResult: data.expectedResult,
          changeNote: data.changeNote,
        }
        const updated = await updateMutation.mutateAsync({
          dealId: deal.id,
          payload,
        })
        toast.success(
          `Đã cập nhật điều khoản Deal #${updated.id} sang Phiên bản ${updated.version}. Đang chờ bên còn lại xác nhận lại.`
        )
        if (onSuccess) onSuccess(updated)
        onClose()
      } else {
        const payload = {
          ...data,
          mentorId: mentorId || data.mentorId,
          requestId: requestId || null,
          proposalSource: proposalSource || 'RENEGOTIATION',
          agreedPrice: Number(data.agreedPrice),
          deadline: new Date(data.deadline).toISOString(),
        }
        const created = await proposeMutation.mutateAsync(payload)
        toast.success(
          `Khởi tạo đề xuất Deal #${created.id} thành công. Snapshot Phiên bản 1 đã được gửi.`
        )
        if (onSuccess) onSuccess(created)
        onClose()
      }
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        'Có lỗi xảy ra khi xử lý thỏa thuận. Vui lòng thử lại.'
      toast.error(msg)
    }
  }

  const isPending = proposeMutation.isPending || updateMutation.isPending || isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-plum-900/10 shadow-2xl p-6 sm:p-7 text-left space-y-6 max-h-[90vh] overflow-y-auto chat-scrollbar dark:bg-[#242526] dark:border-[#393a3b]">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-plum-400 hover:text-plum-700 rounded-full hover:bg-plum-50 transition-colors dark:hover:bg-white/5"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            {isEdit ? <Edit3 className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
          </span>
          <div>
            <h3 className="font-heading text-lg font-black text-plum-900 dark:text-[#f0f2f5]">
              {isEdit
                ? `Điều chỉnh điều khoản Deal #${deal?.id}`
                : 'Đề xuất Thỏa thuận Mentoring Deal'}
            </h3>
            <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">
              {isEdit
                ? 'Chỉnh sửa điều khoản sẽ sinh Snapshot phiên bản mới và yêu cầu bên kia xác nhận lại.'
                : 'Thỏa thuận chi tiết về phạm vi công việc, giá và kết quả kỳ vọng trước khi chốt.'}
            </p>
          </div>
        </div>

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          {/* Ẩn các ID nếu tạo */}
          <input type="hidden" {...register('mentorId', { valueAsNumber: true })} />
          {studentId && (
            <input type="hidden" {...register('studentId', { valueAsNumber: true })} />
          )}
          {conversationId && (
            <input type="hidden" {...register('conversationId', { valueAsNumber: true })} />
          )}

          {/* Hàng 1: Loại nhiệm vụ & Hình thức tham gia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Loại nhiệm vụ <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('taskType')}
                className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
              >
                <option value="PROJECT_MENTORING">Cố vấn thực chiến dự án phần mềm</option>
                <option value="ASSIGNMENT_GUIDANCE">Hướng dẫn bài tập / Đồ án tốt nghiệp</option>
                <option value="CONSULTATION">Tư vấn định hướng học tập & nghề nghiệp</option>
                <option value="RESUME_REVIEW">Đánh giá & Chỉnh sửa hồ sơ CV</option>
                <option value="MOCK_INTERVIEW">Phỏng vấn thử việc (Mock Interview)</option>
                <option value="SKILL_TRAINING">Đào tạo kỹ năng chuyên sâu</option>
                <option value="OTHER">Nhiệm vụ theo thỏa thuận khác</option>
              </select>
              {errors.taskType && (
                <p className="text-rose-500 text-[11px] font-medium">{errors.taskType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Hình thức tham gia <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('participationType')}
                className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
              >
                <option value="INDIVIDUAL">Kèm cặp cá nhân 1-1</option>
                <option value="GROUP">Hướng dẫn theo nhóm học viên</option>
              </select>
              {errors.participationType && (
                <p className="text-rose-500 text-[11px] font-medium">
                  {errors.participationType.message}
                </p>
              )}
            </div>
          </div>

          {/* Hàng 2: Hình thức làm việc & Giá thỏa thuận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Hình thức làm việc <span className="text-rose-500">*</span>
              </label>
              <select
                {...register('workingMode')}
                className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
              >
                <option value="ONLINE">Trực tuyến (Online qua Google Meet/Zoom)</option>
                <option value="OFFLINE">Trực tiếp (Offline gặp mặt trao đổi)</option>
                <option value="BOTH">Linh hoạt (Cả trực tuyến và trực tiếp)</option>
              </select>
              {errors.workingMode && (
                <p className="text-rose-500 text-[11px] font-medium">{errors.workingMode.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
                Mức giá thỏa thuận (VND) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="10000"
                  {...register('agreedPrice', { valueAsNumber: true })}
                  placeholder="Ví dụ: 500000"
                  className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 pl-9 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
                />
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-plum-400" />
              </div>
              {errors.agreedPrice && (
                <p className="text-rose-500 text-[11px] font-medium">{errors.agreedPrice.message}</p>
              )}
            </div>
          </div>

          {/* Hàng 3: Hạn chót hoàn thành (Deadline) */}
          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Hạn chót hoàn thành (Deadline) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                {...register('deadline')}
                className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 pl-9 text-xs font-semibold text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
              />
              <Calendar className="absolute left-3 top-3.5 h-4 w-4 text-plum-400" />
            </div>
            {errors.deadline && (
              <p className="text-rose-500 text-[11px] font-medium">{errors.deadline.message}</p>
            )}
          </div>

          {/* Phạm vi công việc (Task Scope) */}
          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Phạm vi công việc (Task Scope) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              {...register('taskScope')}
              placeholder="Mô tả chi tiết những gì Mentor sẽ hướng dẫn và yêu cầu học viên cần hoàn thành..."
              className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5] leading-relaxed"
            />
            {errors.taskScope && (
              <p className="text-rose-500 text-[11px] font-medium">{errors.taskScope.message}</p>
            )}
          </div>

          {/* Kết quả kỳ vọng (Expected Result) */}
          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              Kết quả kỳ vọng đầu ra (Expected Result) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register('expectedResult')}
              placeholder="Sản phẩm, tài liệu hoặc kỹ năng cụ thể đạt được sau khi kết thúc buổi/chuỗi cố vấn..."
              className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5] leading-relaxed"
            />
            {errors.expectedResult && (
              <p className="text-rose-500 text-[11px] font-medium">
                {errors.expectedResult.message}
              </p>
            )}
          </div>

          {/* Ghi chú lý do thay đổi hoặc đề xuất */}
          <div className="space-y-1.5">
            <label className="font-bold text-plum-800 dark:text-[#e4e6eb]">
              {isEdit ? 'Ghi chú lý do điều chỉnh' : 'Ghi chú kèm theo đề xuất (Tùy chọn)'}
            </label>
            <input
              type="text"
              {...register('changeNote')}
              placeholder={isEdit ? 'Ví dụ: Tăng thời lượng và bổ sung tài liệu theo trao đổi...' : 'Ví dụ: Đề xuất ban đầu từ học viên...'}
              className="w-full rounded-2xl border border-plum-900/15 bg-white p-3 text-xs text-plum-900 shadow-xs focus:border-brand-500 focus:outline-none dark:bg-[#3a3b3c] dark:border-white/10 dark:text-[#f0f2f5]"
            />
            {errors.changeNote && (
              <p className="text-rose-500 text-[11px] font-medium">{errors.changeNote.message}</p>
            )}
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3 pt-3 border-t border-plum-900/[0.06] dark:border-white/10">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl font-bold"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              leftIcon={
                isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isEdit ? (
                  <Edit3 className="h-4 w-4" />
                ) : (
                  <Send className="h-4 w-4" />
                )
              }
              className="rounded-xl font-black bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/20"
            >
              {isPending
                ? 'Đang xử lý...'
                : isEdit
                ? 'Lưu & Cập nhật Snapshot mới'
                : 'Gửi Đề xuất Thỏa thuận'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
