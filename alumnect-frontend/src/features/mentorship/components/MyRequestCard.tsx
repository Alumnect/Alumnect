import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronRight, Briefcase, Coins, Laptop, UserCheck, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { RequestStatusBadge, RequestTypeBadge, MentorResponseStatusBadge } from './RequestStatusBadge'
import { TASK_TYPE_OPTIONS, WORKING_MODE_LABELS } from '../model/mentoringRequestTypes'
import type { CreateMentoringRequestData } from '../model/mentoringRequestTypes'

interface MyRequestCardProps {
  request: CreateMentoringRequestData
}

/**
 * Thẻ hiển thị một yêu cầu Mentoring trong danh sách "Yêu cầu của tôi" (UC102).
 * Tóm tắt đầy đủ loại yêu cầu, ngành nghề, ngân sách và trạng thái phản hồi của Mentor.
 */
export function MyRequestCard({ request }: MyRequestCardProps) {
  const navigate = useNavigate()

  const isDirect = request.requestType === 'DIRECT'
  const taskOption = TASK_TYPE_OPTIONS.find((t) => t.value === request.taskType)
  const taskLabel = taskOption ? taskOption.label : request.taskType
  const modeLabel = request.workingMode ? WORKING_MODE_LABELS[request.workingMode] : ''

  const formatCurrency = (amount?: number | null) => {
    if (!amount) return null
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ'
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const handleOpenDetail = () => {
    navigate(`/app/mentoring/requests/${request.id}`)
  }

  const summary = request.responseSummary

  return (
    <Card className="overflow-hidden border border-plum-900/[0.08] p-5 shadow-xs transition-all hover:border-brand-300 hover:shadow-md dark:border-[#393a3b] dark:hover:border-brand-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {/* Badges: Loại yêu cầu, Trạng thái yêu cầu, Lĩnh vực */}
          <div className="flex flex-wrap items-center gap-2">
            <RequestTypeBadge type={request.requestType} />
            <RequestStatusBadge status={request.status} />
            <span className="inline-flex items-center rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-semibold text-plum-700 dark:bg-white/[0.06] dark:text-[#e4e6eb]">
              {request.industryName}
            </span>
          </div>

          {/* Tiêu đề yêu cầu */}
          <h3
            onClick={handleOpenDetail}
            className="cursor-pointer text-base font-bold text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
          >
            {request.title}
          </h3>

          {/* Mô tả ngắn */}
          <p className="line-clamp-2 text-xs leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
            {request.description}
          </p>
        </div>

        {/* Nút xem chi tiết */}
        <button
          type="button"
          onClick={handleOpenDetail}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-plum-900/[0.04] px-3.5 py-2 text-xs font-bold text-plum-800 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:bg-white/[0.06] dark:text-[#e4e6eb] dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
        >
          <span>Xem chi tiết</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Thông tin bổ trợ: Loại nhiệm vụ, Ngân sách, Hình thức, Ngày tạo */}
      <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 border-t border-plum-900/[0.06] pt-3.5 text-xs text-plum-500 dark:border-[#393a3b] dark:text-[#8f9399]">
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

        <div className="flex items-center gap-1.5 ml-auto">
          <Calendar className="h-3.5 w-3.5 text-plum-400" />
          <span>Tạo ngày: {formatDate(request.createdAt)}</span>
        </div>
      </div>

      {/* Tóm tắt phản hồi từ Mentor */}
      <div className="mt-3.5 rounded-2xl bg-cream-50/70 p-3 text-xs dark:bg-white/[0.02]">
        {isDirect ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Avatar
                src={request.targetMentorAvatar || undefined}
                name={request.targetMentorName || 'Mentor'}
                size={28}
                className="shrink-0"
              />
              <span className="font-semibold text-plum-800 dark:text-white">
                Mentor đích: <span className="font-bold text-plum-900 dark:text-white">{request.targetMentorName || 'Đã chọn'}</span>
              </span>
            </div>
            <MentorResponseStatusBadge status={request.directMentorResponseStatus || 'WAITING'} />
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-plum-700 dark:text-[#e4e6eb]">
              <UserCheck className="h-4 w-4 text-brand-600" />
              <span>Phản hồi từ các Mentor ({summary?.totalDistributed ?? request.matchedCount} phân phối):</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/70 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                {summary?.acceptedCount ?? 0} Đã đồng ý
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/70 px-2 py-0.5 font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <Clock className="h-3 w-3 text-amber-600" />
                {summary?.waitingCount ?? request.matchedCount} Đang chờ
              </span>
              {(summary?.declinedCount ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-rose-100/70 px-2 py-0.5 font-bold text-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                  <XCircle className="h-3 w-3 text-rose-600" />
                  {summary?.declinedCount} Từ chối
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
