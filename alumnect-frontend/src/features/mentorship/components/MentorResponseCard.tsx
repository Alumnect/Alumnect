import { useNavigate } from 'react-router-dom'
import { MessageSquare, ExternalLink, MessageSquareQuote, Info } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { MentorResponseStatusBadge } from './RequestStatusBadge'
import type { MentorResponseItem } from '../model/mentoringRequestTypes'

interface MentorResponseCardProps {
  response: MentorResponseItem
}

/**
 * Thẻ hiển thị phản hồi của từng Mentor đối với yêu cầu Mentoring (UC102).
 * Phân cấp trạng thái rõ ràng (WAITING, ACCEPTED, DECLINED).
 * Nghiệp vụ quan trọng: ACCEPTED chỉ đồng ý trao đổi, không tự tạo Deal.
 */
export function MentorResponseCard({ response }: MentorResponseCardProps) {
  const navigate = useNavigate()

  const formatTimestamp = (dateStr?: string | null) => {
    if (!dateStr) return null
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const isAccepted = response.responseStatus === 'ACCEPTED'
  const isDeclined = response.responseStatus === 'DECLINED'
  const isWaiting = response.responseStatus === 'WAITING'

  // Mở đúng Chat for Task của Request + Mentor này (không mở DM chung mất ngữ cảnh Request)
  const handleOpenChat = () => {
    if (response.conversationId) {
      navigate(`/app/mentoring/chats/${response.conversationId}`)
    }
  }

  const handleViewMentorProfile = () => {
    navigate(`/app/mentoring/mentors/${response.mentorProfileId}`)
  }

  return (
    <Card className="overflow-hidden border border-plum-900/[0.08] p-5 shadow-xs transition-shadow hover:shadow-md dark:border-[#393a3b]">
      {/* Header card: Thông tin Mentor & Trạng thái phản hồi */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3.5">
          <Avatar
            src={response.mentorAvatar || undefined}
            name={response.mentorName}
            size={52}
            className="shrink-0 rounded-2xl ring-2 ring-plum-900/[0.05] dark:ring-white/[0.08]"
          />
          <div className="min-w-0">
            <h4
              onClick={handleViewMentorProfile}
              className="cursor-pointer text-base font-bold text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
            >
              {response.mentorName}
            </h4>

            {response.mentorHeadline && (
              <p className="mt-0.5 line-clamp-1 text-xs text-plum-600 dark:text-[#b0b3b8]">
                {response.mentorHeadline}
              </p>
            )}

            {/* Danh sách lĩnh vực hỗ trợ của Mentor */}
            {response.supportedFields && response.supportedFields.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {response.supportedFields.map((field) => (
                  <span
                    key={field}
                    className="inline-flex items-center rounded-lg bg-plum-900/[0.04] px-2 py-0.5 text-[11px] font-semibold text-plum-600 dark:bg-white/[0.06] dark:text-[#b0b3b8]"
                  >
                    {field}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trạng thái phản hồi của Mentor */}
        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
          <MentorResponseStatusBadge status={response.responseStatus} />
          {response.selected && (
            <span className="rounded-full bg-mint-100 px-2.5 py-0.5 text-[11px] font-black text-mint-700 dark:bg-mint-950/50 dark:text-mint-300">
              Mentor được chọn
            </span>
          )}
          {response.respondedAt ? (
            <span className="ml-3 text-[11px] text-plum-400 sm:ml-0 sm:mt-1.5 dark:text-[#8f9399]">
              Phản hồi: {formatTimestamp(response.respondedAt)}
            </span>
          ) : (
            <span className="ml-3 text-[11px] text-plum-400 sm:ml-0 sm:mt-1.5 dark:text-[#8f9399]">
              Gửi yêu cầu: {formatTimestamp(response.distributedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Lời nhắn / Lý do phản hồi từ Mentor nếu có */}
      {response.responseNote && (
        <div className="mt-4 rounded-2xl border border-plum-900/[0.06] bg-cream-100/60 p-3.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
          <div className="flex items-start gap-2.5">
            <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div className="text-xs">
              <span className="font-bold text-plum-800 dark:text-white">Lời nhắn từ Mentor:</span>
              <p className="mt-0.5 italic text-plum-700 dark:text-[#e4e6eb]">{response.responseNote}</p>
            </div>
          </div>
        </div>
      )}

      {/* Thông điệp nghiệp vụ đặc thù theo từng trạng thái */}
      {isAccepted && (
        <div className="mt-3.5 flex items-start gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-3 text-xs text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>
            Mentor đã đồng ý trao đổi về yêu cầu này. Mở Chat for Task để thương lượng và xem Deal Ticket của Mentor.{' '}
            <strong>Lưu ý:</strong> ACCEPT chưa phải Deal; Task chỉ được tạo sau khi bạn xác nhận Deal và thanh toán thành công.
          </span>
        </div>
      )}

      {isWaiting && (
        <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Mentor đang xem xét yêu cầu. Bạn sẽ nhận được thông báo khi có phản hồi.</span>
        </div>
      )}

      {isDeclined && (
        <div className="mt-3.5 flex items-center gap-2 rounded-2xl bg-rose-50/50 px-3 py-2 text-xs text-rose-800 dark:bg-rose-950/20 dark:text-rose-300">
          <Info className="h-4 w-4 shrink-0 text-rose-600" />
          <span>Mentor đã từ chối yêu cầu này. Bạn có thể xem các Mentor khác được phân phối hoặc tạo yêu cầu mới.</span>
        </div>
      )}

      {/* Hành động khả dụng tương ứng với trạng thái */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-plum-900/[0.06] pt-3.5 dark:border-[#393a3b]">
        <button
          type="button"
          onClick={handleViewMentorProfile}
          className="inline-flex items-center gap-1.5 rounded-xl border border-plum-900/[0.1] bg-white px-3.5 py-2 text-xs font-bold text-plum-700 shadow-2xs transition-colors hover:bg-cream-100 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb] dark:hover:bg-white/[0.05]"
        >
          <ExternalLink className="h-3.5 w-3.5 text-plum-500" />
          Xem hồ sơ Mentor
        </button>

        {isAccepted && response.conversationId && (
          <button
            type="button"
            onClick={handleOpenChat}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:opacity-95 hover:shadow-md"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Mở Chat for Task
          </button>
        )}
      </div>
    </Card>
  )
}
