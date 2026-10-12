import {
  FileText,
  Clock,
  Calendar,
  Check,
  X,
  ArrowRight,
  Loader2,
  CircleDollarSign,
  MessageSquare,
  CalendarClock,
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { MentoringTicketData } from './MentoringTicketDetailModal'

interface MentoringDiscordTicketEmbedProps {
  ticket: MentoringTicketData
  isMe?: boolean
  isRecipient?: boolean
  canAct?: boolean
  onConfirm?: () => Promise<void> | void
  onReject?: () => void
  onViewDetail?: () => void
  isConfirming?: boolean
  isRejecting?: boolean
  accompanyingText?: string
}

export function MentoringDiscordTicketEmbed({
  ticket,
  isMe = false,
  isRecipient = false,
  canAct = false,
  onConfirm,
  onReject,
  onViewDetail,
  isConfirming = false,
  isRejecting = false,
  accompanyingText,
}: MentoringDiscordTicketEmbedProps) {
  // Format tiền tệ VND
  const formatVND = (amount?: number) => {
    if (typeof amount !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
  }

  // Format ngày tháng DD/MM/YYYY
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

  // Format thời gian hiển thị (ví dụ 10:16)
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

  const isExtension = ticket.ticketType === 'EXTENSION'
  const timeString = formatTime(ticket.createdAt)

  // Status badge
  const renderStatusBadge = () => {
    switch (ticket.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
            <Check className="h-3 w-3" />
            Đã xác nhận
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
            <X className="h-3 w-3" />
            Đã từ chối
          </span>
        )
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-600/40 bg-slate-700/30 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
            Đã thay thế
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Clock className="h-3 w-3 text-amber-400" />
            Chờ xác nhận
          </span>
        )
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-1.5 py-2 my-1 animate-fade-in", isMe ? "items-end" : "items-start")}>
      {/* 1. Header Người gửi tin nhắn (Avatar + Tên + Giờ) */}
      <div className={cn("flex items-center gap-2.5 px-1", isMe ? "flex-row-reverse" : "flex-row")}>
        <Avatar
          src={ticket.senderAvatar || undefined}
          name={ticket.senderName}
          size={36}
          className="ring-1 ring-white/10 shrink-0"
        />
        <div className={cn("flex items-baseline gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
          <span className="text-sm font-bold text-gray-900 dark:text-[#f0f2f5]">
            {ticket.senderName}
          </span>
          {timeString && (
            <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              {timeString}
            </span>
          )}
        </div>
      </div>

      {/* 2. Tin nhắn văn bản đi kèm (nếu có) */}
      {accompanyingText && (
        <div className={cn("max-w-xl rounded-2xl px-4 py-2 text-sm shadow-2xs", isMe ? "mr-0 sm:mr-11 bg-brand-600 text-white" : "ml-0 sm:ml-11 bg-gray-100 dark:bg-[#2b2d31] text-gray-800 dark:text-gray-200")}>
          {accompanyingText}
        </div>
      )}

      {/* 3. Thẻ tương tác Ticket phong cách Discord Embed */}
      <div className={cn("w-full max-w-xl overflow-hidden rounded-2xl border-l-4 border-blue-500 bg-[#181f2a] p-4 sm:p-5 text-white shadow-xl", isMe ? "mr-0 sm:mr-11 self-end" : "ml-0 sm:ml-11 self-start")}>
        {/* Header Thẻ: Icon + Loại Ticket + Mã + Status */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              {isExtension ? <CalendarClock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-heading text-sm sm:text-base font-black uppercase tracking-wider text-white">
                {isExtension ? 'TICKET GIA HẠN' : 'DEAL TICKET'}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {ticket.ticketCode}
                {ticket.version ? ` · Phiên bản ${ticket.version}` : ''}
              </p>
            </div>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Nội dung chính dạng danh sách có icon */}
        <div className="py-3.5 space-y-2.5 text-xs sm:text-sm text-slate-200">
          {!isExtension ? (
            <>
              {/* Phạm vi */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-slate-400 shrink-0">Phạm vi:</span>
                  <span className="font-semibold text-white line-clamp-2">
                    {ticket.taskScope || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>

              {/* Giá thỏa thuận */}
              <div className="flex items-center gap-2.5">
                <CircleDollarSign className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Giá thỏa thuận:</span>
                  <span className="font-bold text-white">
                    {formatVND(ticket.agreedPrice)}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Deadline:</span>
                  <span className="font-bold text-white">
                    {formatDate(ticket.deadline)}
                  </span>
                </div>
              </div>

              {/* Hình thức */}
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Hình thức:</span>
                  <span className="font-semibold text-white">
                    {ticket.workingMode === 'ONLINE' ? 'Online' : ticket.workingMode === 'OFFLINE' ? 'Offline' : 'Linh hoạt'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Deadline hiện tại */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Deadline hiện tại:</span>
                  <span className="font-medium text-slate-300">
                    {formatDate(ticket.currentDeadline)}
                  </span>
                </div>
              </div>

              {/* Deadline đề xuất */}
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-blue-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Deadline đề xuất:</span>
                  <span className="font-bold text-blue-400">
                    {formatDate(ticket.proposedDeadline)}
                  </span>
                </div>
              </div>

              {/* Lý do */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-slate-400 shrink-0">Lý do:</span>
                  <span className="font-semibold text-white line-clamp-2">
                    {ticket.extensionReason || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Thẻ: "Xem chi tiết →" và các nút thao tác */}
        <div className="flex items-center justify-between border-t border-gray-800/80 pt-3">
          {/* Nút Xem chi tiết */}
          <button
            type="button"
            onClick={onViewDetail}
            className="group flex items-center gap-1 text-xs font-semibold text-blue-400 transition-colors hover:text-blue-300"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Nhóm thao tác bên phải */}
          <div className="flex items-center gap-2">
            {ticket.status === 'PENDING' ? (
              canAct && isRecipient ? (
                <>
                  {/* Nút Từ chối viền đỏ */}
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={isRejecting || isConfirming}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/80 bg-red-500/5 px-3.5 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/20 active:scale-95 disabled:opacity-50"
                  >
                    {isRejecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Từ chối'
                    )}
                  </button>

                  {/* Nút Xác nhận xanh dương */}
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isConfirming || isRejecting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Xác nhận'
                    )}
                  </button>
                </>
              ) : (
                /* Người gửi: hiển thị trạng thái chờ đối phương phản hồi */
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1 text-[11px] font-semibold text-slate-300">
                  <Clock className="h-3 w-3 text-amber-400" />
                  Chờ phản hồi
                </span>
              )
            ) : ticket.status === 'CONFIRMED' ? (
              <span className="text-[11px] font-semibold text-emerald-400">
                Đã xác nhận {ticket.handlerName ? `(${ticket.handlerName})` : ''}
              </span>
            ) : ticket.status === 'REJECTED' ? (
              <span className="text-[11px] font-semibold text-rose-400">
                Đã từ chối {ticket.handlerName ? `(${ticket.handlerName})` : ''}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                Đã thay thế bởi phiên bản mới
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
