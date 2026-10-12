import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Briefcase, Coins, Laptop, Users, Paperclip, MessageSquareQuote } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { RequestStatusBadge, RequestTypeBadge, MentorResponseStatusBadge } from './RequestStatusBadge'
import { TASK_TYPE_OPTIONS, WORKING_MODE_LABELS, PARTICIPATION_TYPE_LABELS } from '../model/mentoringRequestTypes'
import type { MentorIncomingRequestData } from '../model/mentoringRequestTypes'

interface IncomingRequestCardProps {
  request: MentorIncomingRequestData
}

/**
 * Thẻ hiển thị một yêu cầu Mentoring gửi đến trong danh sách Incoming Requests của Mentor (UC103).
 * Thể hiện thông tin sinh viên, nội dung yêu cầu, trạng thái phản hồi và điều hướng xem chi tiết.
 */
export function IncomingRequestCard({ request }: IncomingRequestCardProps) {
  const navigate = useNavigate()

  const taskOption = TASK_TYPE_OPTIONS.find((t) => t.value === request.taskType)
  const taskLabel = taskOption ? taskOption.label : request.taskType
  const modeLabel = request.workingMode ? WORKING_MODE_LABELS[request.workingMode] : ''
  const participationLabel = request.participationType ? PARTICIPATION_TYPE_LABELS[request.participationType] : ''

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
  }

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const handleOpenDetail = () => {
    navigate(`/app/mentoring/incoming-requests/${request.id}`)
  }

  const isWaiting = request.responseStatus === 'WAITING'

  return (
    <Card className="overflow-hidden border border-plum-900/[0.08] p-5 shadow-xs transition-all hover:border-brand-300 hover:shadow-md dark:border-[#393a3b] dark:hover:border-brand-700">
      {/* Header: Thông tin sinh viên & Các huy hiệu trạng thái */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <Avatar
            src={request.studentAvatar || undefined}
            name={request.studentName}
            size={46}
            className="shrink-0 rounded-2xl ring-2 ring-plum-900/[0.05] dark:ring-white/[0.08]"
          />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-plum-900 dark:text-white">
                {request.studentName}
              </span>
              <RequestTypeBadge type={request.requestType} />
              <RequestStatusBadge status={request.requestStatus} />
              <span className="inline-flex items-center rounded-full bg-cream-100 px-2.5 py-0.5 text-[11px] font-semibold text-plum-700 dark:bg-white/[0.06] dark:text-[#e4e6eb]">
                {request.industryName}
              </span>
            </div>

            {request.studentHeadline && (
              <p className="line-clamp-1 text-xs text-plum-600 dark:text-[#b0b3b8]">
                {request.studentHeadline}
              </p>
            )}
          </div>
        </div>

        {/* Trạng thái phản hồi của Mentor đối với yêu cầu này */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <MentorResponseStatusBadge status={request.responseStatus} />
          <span className="text-[11px] text-plum-400 dark:text-[#8f9399]">
            Nhận: {formatDateTime(request.distributedAt)}
          </span>
        </div>
      </div>

      {/* Nội dung tiêu đề và tóm tắt yêu cầu */}
      <div className="mt-3.5 space-y-1.5">
        <h3
          onClick={handleOpenDetail}
          className="cursor-pointer text-base font-bold text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
        >
          {request.title}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
          {request.description}
        </p>
      </div>

      {/* Lưới thông số tóm tắt: Nhu cầu, Ngân sách, Hình thức, File đính kèm */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-plum-900/[0.06] pt-3.5 text-xs text-plum-500 dark:border-[#393a3b] dark:text-[#8f9399]">
        <div className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5 text-plum-400" />
          <span>{taskLabel}</span>
        </div>

        {(request.budgetMin || request.budgetMax) && (
          <div className="flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5 text-plum-400" />
            <span>
              {request.budgetMin ? formatCurrency(request.budgetMin) : 'Thỏa thuận'} -{' '}
              {request.budgetMax ? formatCurrency(request.budgetMax) : 'Thỏa thuận'}
            </span>
          </div>
        )}

        {modeLabel && (
          <div className="flex items-center gap-1.5">
            <Laptop className="h-3.5 w-3.5 text-plum-400" />
            <span>{modeLabel}</span>
          </div>
        )}

        {participationLabel && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-plum-400" />
            <span>{participationLabel}</span>
          </div>
        )}

        {request.attachmentCount > 0 && (
          <div className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-plum-400" />
            <span>{request.attachmentCount} tệp đính kèm</span>
          </div>
        )}

        {request.expectedDeadline && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar className="h-3.5 w-3.5 text-plum-400" />
            <span>Hạn chót: {formatDateTime(request.expectedDeadline)}</span>
          </div>
        )}
      </div>

      {/* Ghi chú phản hồi nếu Mentor đã phản hồi trước đó */}
      {request.responseNote && (
        <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-cream-50/80 p-2.5 text-xs dark:bg-white/[0.02]">
          <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
          <p className="italic text-plum-700 dark:text-[#e4e6eb] line-clamp-1">
            Lời nhắn của bạn: "{request.responseNote}"
          </p>
        </div>
      )}

      {/* Nút hành động */}
      <div className="mt-4 flex items-center justify-between border-t border-plum-900/[0.06] pt-3.5 dark:border-[#393a3b]">
        <span className="text-[11px] text-plum-500 dark:text-[#8f9399]">
          {isWaiting ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              ● Đang chờ bạn xem xét & phản hồi
            </span>
          ) : request.responseStatus === 'ACCEPTED' ? (
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ Bạn đã đồng ý trao đổi
            </span>
          ) : (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              ✗ Bạn đã từ chối yêu cầu này
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={handleOpenDetail}
          className="inline-flex items-center gap-1.5 rounded-xl bg-plum-900/[0.04] px-4 py-2 text-xs font-bold text-plum-800 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:bg-white/[0.06] dark:text-[#e4e6eb] dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
        >
          <span>{isWaiting ? 'Xem & Phản hồi' : 'Xem chi tiết'}</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  )
}
