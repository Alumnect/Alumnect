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
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { MentoringTicketData } from './MentoringTicketDetailModal'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  PROPOSAL_SOURCE_LABELS,
} from '../model/mentoringFlowLabels'

interface MentoringDiscordTicketEmbedProps {
  ticket: MentoringTicketData
  isMe?: boolean
  isRecipient?: boolean
  canAct?: boolean
  onConfirm?: () => Promise<void> | void
  onReject?: () => void
  onRevert?: () => void
  onPay?: () => void
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
  onRevert,
  onPay,
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
          <span className="inline-flex items-center gap-1 rounded-full border border-mint-300 bg-mint-50 px-2.5 py-0.5 text-[11px] font-semibold text-mint-700 dark:border-mint-800/60 dark:bg-mint-950/40 dark:text-mint-300">
            <Check className="h-3 w-3" />
            Đã xác nhận
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-coral-300 bg-coral-50 px-2.5 py-0.5 text-[11px] font-semibold text-coral-700 dark:border-coral-800/60 dark:bg-coral-950/40 dark:text-coral-300">
            <X className="h-3 w-3" />
            Đã từ chối
          </span>
        )
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
            <RefreshCw className="h-3 w-3" />
            Đã yêu cầu điều chỉnh
          </span>
        )
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-plum-300 bg-cream-200 px-2.5 py-0.5 text-[11px] font-semibold text-plum-600 dark:border-white/10 dark:bg-[#3a3b3c] dark:text-plum-400">
            Đã thay thế
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
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
          <span className="text-sm font-bold text-plum-900 dark:text-[#f0f2f5]">
            {ticket.senderName}
          </span>
          {timeString && (
            <span className="text-[11px] font-medium text-plum-400 dark:text-plum-500">
              {timeString}
            </span>
          )}
        </div>
      </div>

      {/* 2. Tin nhắn văn bản đi kèm (nếu có) */}
      {accompanyingText && (
        <div
          className={cn(
            'max-w-xl rounded-2xl px-4 py-2 text-sm shadow-2xs',
            isMe
              ? 'mr-0 sm:mr-11 bg-brand-600 text-white'
              : 'ml-0 sm:ml-11 bg-cream-200 dark:bg-[#2b2d31] text-plum-800 dark:text-[#e4e6eb]'
          )}
        >
          {accompanyingText}
        </div>
      )}

      {/* 3. Thẻ tương tác Ticket phong cách xám trắng & viền cam */}
      <div
        className={cn(
          'w-full max-w-xl overflow-hidden rounded-2xl border border-brand-200/90 dark:border-brand-500/30 border-l-4 border-l-brand-500 bg-[#f4f6f8] dark:bg-[#22252d] p-4 sm:p-5 text-plum-900 dark:text-[#e4e6eb] shadow-md',
          isMe ? 'mr-0 sm:mr-11 self-end' : 'ml-0 sm:ml-11 self-start'
        )}
      >
        {/* Header Thẻ: Icon + Loại Ticket + Mã + Status */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-cream-300 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-xs">
              {isExtension ? <CalendarClock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-plum-900 dark:text-white">
                {isExtension ? 'TICKET GIA HẠN' : 'DEAL TICKET'}
              </h4>
              <p className="text-xs text-plum-500 dark:text-plum-400 font-medium">
                {ticket.ticketCode}
                {ticket.version ? ` · Phiên bản ${ticket.version}` : ''}
              </p>
            </div>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Nội dung chính dạng danh sách có icon */}
        <div className="py-3.5 space-y-2.5 text-xs sm:text-sm text-plum-800 dark:text-[#e4e6eb]">
          {!isExtension ? (
            <>
              {/* Phạm vi */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400 mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-plum-500 dark:text-plum-400 shrink-0">Phạm vi:</span>
                  <span className="font-bold text-plum-900 dark:text-white line-clamp-2">
                    {ticket.taskScope || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>

              {/* Giá thỏa thuận */}
              <div className="flex items-center gap-2.5">
                <CircleDollarSign className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                <div className="flex items-center gap-2">
                  <span className="text-plum-500 dark:text-plum-400">Giá thỏa thuận:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400 text-sm sm:text-base">
                    {formatVND(ticket.agreedPrice)}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                <div className="flex items-center gap-2">
                  <span className="text-plum-500 dark:text-plum-400">Deadline:</span>
                  <span className="font-bold text-plum-900 dark:text-white">
                    {formatDate(ticket.deadline)}
                  </span>
                </div>
              </div>

              {/* Hình thức */}
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                <div className="flex items-center gap-2">
                  <span className="text-plum-500 dark:text-plum-400">Hình thức:</span>
                  <span className="font-semibold text-plum-900 dark:text-white">
                    {MENTORING_WORKING_MODE_LABELS[ticket.workingMode || ''] || 'Linh hoạt'}
                    {' · '}
                    {MENTORING_PARTICIPATION_LABELS[ticket.participationType || ''] || 'Cá nhân (1-1)'}
                  </span>
                </div>
              </div>

              {/* Loại nhiệm vụ & nguồn đề xuất */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400 mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-plum-700 ring-1 ring-cream-300 dark:bg-white/5 dark:text-[#b0b3b8] dark:ring-white/10">
                    {MENTORING_TASK_TYPE_LABELS[ticket.taskType || ''] || ticket.taskType || 'Nhiệm vụ'}
                  </span>
                  {ticket.proposalSource && (
                    <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-brand-200 dark:bg-brand-700/30 dark:text-brand-300 dark:ring-brand-700/40">
                      {PROPOSAL_SOURCE_LABELS[ticket.proposalSource] || ticket.proposalSource}
                    </span>
                  )}
                </div>
              </div>

              {/* Kết quả kỳ vọng */}
              {ticket.expectedResult && (
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400 mt-0.5" />
                  <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                    <span className="text-plum-500 dark:text-plum-400 shrink-0">Kết quả:</span>
                    <span className="font-semibold text-plum-900 dark:text-white line-clamp-2">{ticket.expectedResult}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Deadline hiện tại */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-plum-500 dark:text-plum-400" />
                <div className="flex items-center gap-2">
                  <span className="text-plum-500 dark:text-plum-400">Deadline hiện tại:</span>
                  <span className="font-medium text-plum-700 dark:text-[#b0b3b8]">
                    {formatDate(ticket.currentDeadline)}
                  </span>
                </div>
              </div>

              {/* Deadline đề xuất */}
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400" />
                <div className="flex items-center gap-2">
                  <span className="text-plum-500 dark:text-plum-400">Deadline đề xuất:</span>
                  <span className="font-bold text-brand-600 dark:text-brand-400">
                    {formatDate(ticket.proposedDeadline)}
                  </span>
                </div>
              </div>

              {/* Lý do */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand-500 dark:text-brand-400 mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-plum-500 dark:text-plum-400 shrink-0">Lý do:</span>
                  <span className="font-semibold text-plum-900 dark:text-white line-clamp-2">
                    {ticket.extensionReason || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Thẻ: "Xem chi tiết →" và các nút thao tác */}
        <div className="flex items-center justify-between border-t border-cream-300 dark:border-white/10 pt-3">
          {/* Nút Xem chi tiết */}
          <button
            type="button"
            onClick={onViewDetail}
            className="group flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
          >
            <span>Xem chi tiết</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>

          {/* Nhóm thao tác bên phải */}
          <div className="flex items-center gap-2">
            {ticket.status === 'PENDING' ? (
              canAct && isRecipient ? (
                <>
                  {/* Nút Từ chối thỏa thuận */}
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={isRejecting || isConfirming}
                    title="Từ chối thỏa thuận này"
                    className="inline-flex items-center justify-center rounded-xl border border-coral-500/80 bg-coral-50/60 px-3 py-1.5 text-xs font-bold text-coral-600 transition-all hover:bg-coral-100 active:scale-95 disabled:opacity-50 dark:bg-coral-950/30 dark:border-coral-500/60 dark:text-coral-300"
                  >
                    {isRejecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Từ chối'
                    )}
                  </button>

                  {/* Nút Yêu cầu điều chỉnh (Học viên) */}
                  {onRevert && (
                    <button
                      type="button"
                      onClick={onRevert}
                      disabled={isRejecting || isConfirming}
                      title="Yêu cầu Mentor điều chỉnh lại giá, hạn chót hoặc nội dung"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/80 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:bg-amber-950/40 dark:border-amber-600/60 dark:text-amber-300"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Yêu cầu điều chỉnh</span>
                    </button>
                  )}

                  {/* Nút Xác nhận cam */}
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isConfirming || isRejecting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Xác nhận & thanh toán'
                    )}
                  </button>
                </>
              ) : (
                /* Người gửi: hiển thị trạng thái chờ đối phương phản hồi */
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-cream-300 bg-white/90 px-3 py-1 text-[11px] font-semibold text-plum-700 shadow-2xs dark:border-white/10 dark:bg-[#3a3b3c] dark:text-[#b0b3b8]">
                  <Clock className="h-3 w-3 text-amber-500" />
                  Chờ phản hồi
                </span>
              )
            ) : ticket.status === 'CONFIRMED' ? (
              <div className="flex items-center gap-2">
                {!ticket.isPaid ? (
                  <>
                    {/* Deal đã khóa: không bên nào được sửa; chỉ còn bước thanh toán (UC105) */}
                    {!ticket.isMentor && onPay ? (
                      <button
                        type="button"
                        onClick={onPay}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 active:scale-95"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Thanh toán Task ngay</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-mint-600 dark:text-mint-400">
                        Đã chốt • Chờ thanh toán
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-mint-600 dark:text-mint-400">
                    Đã thanh toán
                  </span>
                )}
              </div>
            ) : ticket.status === 'REJECTED' ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-coral-600 dark:text-coral-400">
                  Đã từ chối {ticket.handlerName ? `(${ticket.handlerName})` : ''}
                </span>
                {onRevert && (
                  <button
                    type="button"
                    onClick={onRevert}
                    title="Đề xuất lại các điều khoản mới (Deal lại)"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/80 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:bg-amber-950/40 dark:border-amber-600/60 dark:text-amber-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Deal lại</span>
                  </button>
                )}
              </div>
            ) : ticket.status === 'ADJUSTMENT' ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                  Chờ Mentor gửi phiên bản mới
                </span>
                {onRevert && (
                  <button
                    type="button"
                    onClick={onRevert}
                    title="Gửi phiên bản Deal Ticket mới"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/80 bg-amber-50/70 px-3 py-1.5 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 dark:bg-amber-950/40 dark:border-amber-600/60 dark:text-amber-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Deal lại</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="text-[11px] font-medium text-plum-500 dark:text-plum-400">
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
            'text-[11px] text-plum-400 dark:text-plum-500',
            isMe ? 'mr-1 sm:mr-12 text-right' : 'ml-1 sm:ml-12 text-left'
          )}
        >
          {timeString}
        </span>
      )}
    </div>
  )
}
