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
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-soft px-2.5 py-0.5 text-xs font-semibold text-success">
            <Check className="h-3 w-3" />
            Đã xác nhận
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-danger-border bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-danger">
            <X className="h-3 w-3" />
            Đã từ chối
          </span>
        )
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
            <RefreshCw className="h-3 w-3" />
            Đã yêu cầu điều chỉnh
          </span>
        )
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface-3 px-2.5 py-0.5 text-xs font-semibold text-text-muted dark:bg-surface-2">
            Đã thay thế
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-warning-border bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-warning">
            <Clock className="h-3 w-3 text-warning" />
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
          <span className="text-sm font-bold text-text">
            {ticket.senderName}
          </span>
          {timeString && (
            <span className="text-xs font-medium text-text-subtle">
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
              ? 'mr-0 sm:mr-11 bg-primary-solid text-on-primary'
              : 'ml-0 sm:ml-11 bg-surface-3 dark:bg-[#2b2d31] text-text'
          )}
        >
          {accompanyingText}
        </div>
      )}

      {/* 3. Thẻ tương tác Ticket phong cách xám trắng & viền cam */}
      <div
        className={cn(
          'w-full max-w-xl overflow-hidden rounded-2xl border border-brand-200/90 dark:border-brand-500/30 border-l-4 border-l-brand-500 bg-[#f4f6f8] dark:bg-[#22252d] p-4 sm:p-5 text-text shadow-md',
          isMe ? 'mr-0 sm:mr-11 self-end' : 'ml-0 sm:ml-11 self-start'
        )}
      >
        {/* Header Thẻ: Icon + Loại Ticket + Mã + Status */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-solid text-on-primary shadow-xs">
              {isExtension ? <CalendarClock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="font-display text-sm sm:text-base font-bold uppercase tracking-wider text-text">
                {isExtension ? 'TICKET GIA HẠN' : 'DEAL TICKET'}
              </h4>
              <p className="text-xs text-text-subtle font-medium">
                {ticket.ticketCode}
                {ticket.version ? ` · Phiên bản ${ticket.version}` : ''}
              </p>
            </div>
          </div>

          <div>{renderStatusBadge()}</div>
        </div>

        {/* Nội dung chính dạng danh sách có icon */}
        <div className="py-3.5 space-y-2.5 text-xs sm:text-sm text-text">
          {!isExtension ? (
            <>
              {/* Phạm vi */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-primary-solid mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-text-subtle shrink-0">Phạm vi:</span>
                  <span className="font-bold text-text line-clamp-2">
                    {ticket.taskScope || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>

              {/* Giá thỏa thuận */}
              <div className="flex items-center gap-2.5">
                <CircleDollarSign className="h-4 w-4 shrink-0 text-primary-solid" />
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Giá thỏa thuận:</span>
                  <span className="font-bold text-primary-solid text-sm sm:text-base">
                    {formatVND(ticket.agreedPrice)}
                  </span>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-primary-solid" />
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Deadline:</span>
                  <span className="font-bold text-text">
                    {formatDate(ticket.deadline)}
                  </span>
                </div>
              </div>

              {/* Hình thức */}
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 shrink-0 text-primary-solid" />
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Hình thức:</span>
                  <span className="font-semibold text-text">
                    {MENTORING_WORKING_MODE_LABELS[ticket.workingMode || ''] || 'Linh hoạt'}
                    {' · '}
                    {MENTORING_PARTICIPATION_LABELS[ticket.participationType || ''] || 'Cá nhân (1-1)'}
                  </span>
                </div>
              </div>

              {/* Loại nhiệm vụ & nguồn đề xuất */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-primary-solid mt-0.5" />
                <div className="flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-text-muted ring-1 ring-border">
                    {MENTORING_TASK_TYPE_LABELS[ticket.taskType || ''] || ticket.taskType || 'Nhiệm vụ'}
                  </span>
                  {ticket.proposalSource && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-solid ring-1 ring-brand-200 dark:ring-brand-700/40">
                      {PROPOSAL_SOURCE_LABELS[ticket.proposalSource] || ticket.proposalSource}
                    </span>
                  )}
                </div>
              </div>

              {/* Kết quả kỳ vọng */}
              {ticket.expectedResult && (
                <div className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 shrink-0 text-primary-solid mt-0.5" />
                  <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                    <span className="text-text-subtle shrink-0">Kết quả:</span>
                    <span className="font-semibold text-text line-clamp-2">{ticket.expectedResult}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Deadline hiện tại */}
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-text-subtle" />
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Deadline hiện tại:</span>
                  <span className="font-medium text-text-muted">
                    {formatDate(ticket.currentDeadline)}
                  </span>
                </div>
              </div>

              {/* Deadline đề xuất */}
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-primary-solid" />
                <div className="flex items-center gap-2">
                  <span className="text-text-subtle">Deadline đề xuất:</span>
                  <span className="font-bold text-primary-solid">
                    {formatDate(ticket.proposedDeadline)}
                  </span>
                </div>
              </div>

              {/* Lý do */}
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 shrink-0 text-primary-solid mt-0.5" />
                <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
                  <span className="text-text-subtle shrink-0">Lý do:</span>
                  <span className="font-semibold text-text line-clamp-2">
                    {ticket.extensionReason || 'Chưa cung cấp'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Thẻ: "Xem chi tiết →" và các nút thao tác */}
        <div className="flex items-center justify-between border-t border-border pt-3">
          {/* Nút Xem chi tiết */}
          <button
            type="button"
            onClick={onViewDetail}
            className="group flex items-center gap-1 text-xs font-bold text-primary-solid hover:text-primary-solid transition-colors"
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
                    className="inline-flex items-center justify-center rounded-xl border border-danger bg-danger-soft px-3 py-1.5 text-xs font-bold text-danger transition-all hover:bg-danger-border/60 active:scale-95 disabled:opacity-50"
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
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-warning bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning-border/60 active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className="h-3.5 w-3.5 text-warning" />
                      <span>Yêu cầu điều chỉnh</span>
                    </button>
                  )}

                  {/* Nút Xác nhận cam */}
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={isConfirming || isRejecting}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-solid px-3.5 py-1.5 text-xs font-bold text-on-primary shadow-xs transition-all hover:bg-primary-solid active:scale-95 disabled:opacity-50"
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
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-semibold text-text-muted shadow-2xs">
                  <Clock className="h-3 w-3 text-warning" />
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
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-solid px-3.5 py-1.5 text-xs font-bold text-on-primary shadow-xs transition-all hover:bg-primary-hover active:scale-95"
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>Thanh toán Task ngay</span>
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-success">
                        Đã chốt • Chờ thanh toán
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-xs font-bold text-success">
                    Đã thanh toán
                  </span>
                )}
              </div>
            ) : ticket.status === 'REJECTED' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-danger">
                  Đã từ chối {ticket.handlerName ? `(${ticket.handlerName})` : ''}
                </span>
                {onRevert && (
                  <button
                    type="button"
                    onClick={onRevert}
                    title="Đề xuất lại các điều khoản mới (Deal lại)"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-warning bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning-border/60 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-warning" />
                    <span>Deal lại</span>
                  </button>
                )}
              </div>
            ) : ticket.status === 'ADJUSTMENT' ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-warning">
                  Chờ Mentor gửi phiên bản mới
                </span>
                {onRevert && (
                  <button
                    type="button"
                    onClick={onRevert}
                    title="Gửi phiên bản Deal Ticket mới"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-warning bg-warning-soft px-3 py-1.5 text-xs font-bold text-warning transition-all hover:bg-warning-border/60 active:scale-95"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-warning" />
                    <span>Deal lại</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs font-medium text-text-subtle">
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
            'text-xs text-text-subtle',
            isMe ? 'mr-1 sm:mr-12 text-right' : 'ml-1 sm:ml-12 text-left'
          )}
        >
          {timeString}
        </span>
      )}
    </div>
  )
}
