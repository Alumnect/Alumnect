import {
  RefreshCw,
  Clock,
  Check,
  Calendar,
  CircleDollarSign,
  FileText,
  MessageSquare,
  MessageSquareQuote,
  ArrowRight,
  Edit3,
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { MentoringTicketData } from './MentoringTicketDetailModal'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_WORKING_MODE_LABELS,
} from '../model/mentoringFlowLabels'

interface MentoringAdjustmentTicketEmbedProps {
  ticket: MentoringTicketData
  isMe?: boolean
  isMentor?: boolean
  canCreateDealTicket?: boolean
  onReissue?: () => void
  onViewDetail?: () => void
  isLatestSuperseded?: boolean
}

/**
 * Thẻ hiển thị Ticket Yêu Cầu Điều Chỉnh Deal trong Chat for Task.
 * Hiển thị nổi bật nội dung yêu cầu điều chỉnh của Học viên, đối chiếu với Deal version hiện tại,
 * và cung cấp nút "Tạo Deal Ticket mới" cho Mentor để phản hồi ngay lập tức.
 */
export function MentoringAdjustmentTicketEmbed({
  ticket,
  isMe = false,
  isMentor = false,
  canCreateDealTicket = false,
  onReissue,
  onViewDetail,
  isLatestSuperseded = false,
}: MentoringAdjustmentTicketEmbedProps) {
  const formatVND = (amount?: number) => {
    if (typeof amount !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Chưa xác định'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return format(d, 'dd/MM/yyyy')
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return ''
      return format(d, 'HH:mm')
    } catch {
      return ''
    }
  }

  const timeString = formatTime(ticket.createdAt)
  const isSuperseded = ticket.status === 'SUPERSEDED' || !isLatestSuperseded

  const renderStatusBadge = () => {
    if (isSuperseded) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          <Check className="h-3 w-3" />
          Đã có Deal mới
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        Chờ Mentor cập nhật Deal
      </span>
    )
  }

  return (
    <div className={cn('flex w-full flex-col gap-1.5 py-2 my-1 animate-fade-in', isMe ? 'items-end' : 'items-start')}>
      {/* 1. Header Người gửi tin nhắn (Avatar + Tên + Vai trò + Giờ) */}
      <div className={cn('flex items-center gap-2.5 px-1', isMe ? 'flex-row-reverse' : 'flex-row')}>
        <Avatar
          src={ticket.senderAvatar || undefined}
          name={ticket.senderName}
          size={36}
          className="ring-1 ring-white/10 shrink-0"
        />
        <div className={cn('flex items-baseline gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
          <span className="text-sm font-bold text-gray-900 dark:text-[#f0f2f5]">
            {ticket.senderName}
          </span>
          <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-black text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            Học viên
          </span>
          {timeString && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {timeString}
            </span>
          )}
        </div>
      </div>

      {/* 2. Thẻ tương tác Ticket phong cách viền hổ phách/cam ấm */}
      <div
        className={cn(
          'w-full max-w-xl overflow-hidden rounded-2xl border border-amber-200/90 dark:border-amber-500/30 border-l-4 border-l-amber-500 bg-[#fdfaf5] dark:bg-[#222428] p-4 sm:p-5 text-gray-900 dark:text-gray-100 shadow-md',
          isMe ? 'mr-0 sm:mr-11 self-end' : 'ml-0 sm:ml-11 self-start'
        )}
      >
        {/* Header Thẻ: Icon + Loại Ticket + Mã + Status */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-amber-200/60 dark:border-gray-700/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-heading text-sm sm:text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
                TICKET YÊU CẦU ĐIỀU CHỈNH
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {ticket.ticketCode}
                {ticket.version ? ` · Điều chỉnh Deal Ticket v${ticket.version}` : ''}
              </p>
            </div>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Nội dung chính */}
        <div className="py-3.5 space-y-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
          {/* Box nội dung yêu cầu điều chỉnh nổi bật */}
          <div className="rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 dark:border-amber-800/60 dark:bg-amber-950/40">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-800 dark:text-amber-300 mb-1.5">
              <MessageSquareQuote className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>NỘI DUNG YÊU CẦU ĐIỀU CHỈNH:</span>
            </div>
            <p className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
              "{ticket.adjustmentNote || 'Cần thỏa thuận lại các điều khoản'}"
            </p>
          </div>

          {/* Chi tiết điều khoản Deal Ticket phiên bản đang điều chỉnh để tiện đối chiếu */}
          <div className="pt-1 space-y-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Thông tin Deal Ticket phiên bản {ticket.version} cần điều chỉnh:
            </span>

            {/* Giá đề xuất */}
            <div className="flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-gray-500 dark:text-gray-400">Giá đề xuất:</span>
              <span className="font-black text-amber-700 dark:text-amber-400 text-sm sm:text-base">
                {formatVND(ticket.agreedPrice)}
              </span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-gray-500 dark:text-gray-400">Deadline:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatDate(ticket.deadline)}
              </span>
            </div>

            {/* Phạm vi */}
            {ticket.taskScope && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1">
                  <span className="text-gray-500 dark:text-gray-400 shrink-0">Phạm vi:</span>
                  <span className="font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {ticket.taskScope}
                  </span>
                </div>
              </div>
            )}

            {/* Hình thức */}
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="text-gray-500 dark:text-gray-400">Hình thức:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {MENTORING_WORKING_MODE_LABELS[ticket.workingMode || ''] || 'Linh hoạt'} ·{' '}
                {MENTORING_PARTICIPATION_LABELS[ticket.participationType || ''] || 'Cá nhân (1-1)'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Thẻ: "Xem chi tiết →" và các nút hành động */}
        <div className="flex items-center justify-between border-t border-amber-200/60 dark:border-gray-700/80 pt-3">
          {/* Nút Xem chi tiết */}
          <button
            type="button"
            onClick={onViewDetail}
            className="group flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Hành động bên phải */}
          <div className="flex items-center gap-2">
            {isMentor ? (
              !isSuperseded && canCreateDealTicket && onReissue ? (
                <button
                  type="button"
                  onClick={onReissue}
                  title="Soạn và gửi phiên bản Deal Ticket mới"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-1.5 text-xs font-black text-white shadow-xs transition-all hover:bg-amber-600 active:scale-95"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Tạo Deal Ticket mới</span>
                </button>
              ) : (
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  {isSuperseded ? 'Đã có phiên bản Deal mới hơn' : 'Đang chờ xử lý'}
                </span>
              )
            ) : (
              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                {!isSuperseded ? 'Đang chờ Mentor gửi Deal mới' : 'Mentor đã cập nhật Deal mới'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hiển thị thời gian gửi dưới thẻ */}
      {timeString && (
        <span
          className={cn(
            'text-[10px] text-gray-400 dark:text-gray-500',
            isMe ? 'mr-1 sm:mr-12 text-right' : 'ml-1 sm:ml-12 text-left'
          )}
        >
          {timeString}
        </span>
      )}
    </div>
  )
}
