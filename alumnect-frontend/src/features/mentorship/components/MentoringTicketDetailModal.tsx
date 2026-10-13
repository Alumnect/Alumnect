import {
  FileText,
  Clock,
  Check,
  X,
  Info,
  Loader2,
  CalendarClock,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import { format } from 'date-fns'

export type MentoringTicketType = 'DEAL' | 'EXTENSION'

export interface MentoringTicketData {
  ticketType: MentoringTicketType
  ticketCode: string // Ví dụ: '#DL-024' hoặc '#EX-001'
  version?: number
  dealId: number

  // Thông tin người gửi
  senderId?: number
  senderName: string
  senderAvatar?: string | null
  senderRole?: string // 'Mentor' | 'Học viên'

  // Trạng thái ticket
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED'
  handlerName?: string
  handledAt?: string

  // Thông tin Deal Ticket
  taskScope?: string
  expectedResult?: string
  agreedPrice?: number
  deadline?: string
  workingMode?: string
  participationType?: string

  // Thông tin Ticket Gia hạn
  currentDeadline?: string
  proposedDeadline?: string
  extensionReason?: string

  createdAt?: string
  isPaid?: boolean
  isMentor?: boolean
}

interface MentoringTicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: MentoringTicketData
  isRecipient?: boolean
  canAct?: boolean
  onConfirm?: () => Promise<void> | void
  onReject?: () => void
  onRevert?: () => void
  onPay?: () => void
  isConfirming?: boolean
  isRejecting?: boolean
}

export function MentoringTicketDetailModal({
  isOpen,
  onClose,
  ticket,
  isRecipient = false,
  canAct = false,
  onConfirm,
  onReject,
  onRevert,
  onPay,
  isConfirming = false,
  isRejecting = false,
}: MentoringTicketDetailModalProps) {
  if (!isOpen) return null

  // Format tiền tệ VND
  const formatVND = (amount?: number) => {
    if (typeof amount !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
  }

  // Format ngày tháng hiển thị DD/MM/YYYY
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

  // Format hình thức làm việc & tham gia
  const getWorkingModeLabel = () => {
    const mode = ticket.workingMode === 'ONLINE' ? 'Online' : ticket.workingMode === 'OFFLINE' ? 'Offline' : 'Linh hoạt'
    const part = ticket.participationType === 'GROUP' ? 'Nhóm' : 'Individual'
    return `${mode} · ${part}`
  }

  // Header icon & title
  const isExtension = ticket.ticketType === 'EXTENSION'
  const title = isExtension ? 'Chi tiết Ticket Gia Hạn' : 'Chi tiết Deal Ticket'

  // Render status badge
  const renderStatusBadge = () => {
    switch (ticket.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-3.5 w-3.5" />
            Đã xác nhận
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
            <X className="h-3.5 w-3.5" />
            Đã từ chối
          </span>
        )
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Đã thay thế
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Chờ xác nhận
          </span>
        )
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Card Modal */}
      <div className="relative z-10 flex w-full max-w-lg max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-2xl dark:border-gray-800 dark:bg-[#202124] dark:text-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              {isExtension ? <CalendarClock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                {title}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {ticket.ticketCode}
                {ticket.version ? ` · Phiên bản ${ticket.version}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {renderStatusBadge()}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors dark:hover:bg-gray-800 dark:hover:text-gray-200"
              title="Đóng popup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Người gửi Ticket */}
          <div className="flex items-center gap-3.5">
            <Avatar
              src={ticket.senderAvatar || undefined}
              name={ticket.senderName}
              size={44}
              className="ring-2 ring-blue-500/10 shrink-0"
            />
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {ticket.senderName}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {ticket.senderRole || 'Người gửi'}
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-gray-100 dark:bg-gray-800" />

          {/* Các trường nội dung chi tiết theo loại Ticket */}
          {!isExtension ? (
            /* Nội dung DEAL TICKET */
            <div className="space-y-4 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Phạm vi công việc
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {ticket.taskScope || 'Chưa có thông tin'}
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Kết quả bàn giao
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {ticket.expectedResult || 'Theo thỏa thuận của hai bên'}
                </p>
              </div>

              {/* 2 Cột: Giá thỏa thuận & Deadline */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Giá thỏa thuận
                  </span>
                  <p className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                    {formatVND(ticket.agreedPrice)}
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Deadline
                  </span>
                  <p className="font-heading text-lg font-bold text-gray-900 dark:text-white">
                    {formatDate(ticket.deadline)}
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Hình thức
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {getWorkingModeLabel()}
                </p>
              </div>
            </div>
          ) : (
            /* Nội dung TICKET GIA HẠN */
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Deadline hiện tại
                  </span>
                  <p className="font-heading text-base font-bold text-gray-700 dark:text-gray-300">
                    {formatDate(ticket.currentDeadline)}
                  </p>
                </div>

                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                    Deadline đề xuất
                  </span>
                  <p className="font-heading text-base font-bold text-blue-600 dark:text-blue-400">
                    {formatDate(ticket.proposedDeadline)}
                  </p>
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Lý do gia hạn
                </span>
                <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {ticket.extensionReason || 'Chưa cung cấp lý do'}
                </p>
              </div>
            </div>
          )}

          {/* Hộp thông báo chỉ dẫn (Blue Alert Box) */}
          <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/80 p-3.5 text-xs font-medium text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="leading-relaxed">
              {!isExtension
                ? 'Xác nhận Deal để chuyển sang thanh toán.'
                : 'Xác nhận để cập nhật deadline theo đề xuất đã được chấp nhận.'}
            </p>
          </div>

          {/* Lịch sử người xử lý nếu đã xử lý xong */}
          {ticket.status !== 'PENDING' && ticket.handlerName && (
            <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {ticket.status === 'CONFIRMED' ? 'Đã xác nhận bởi: ' : 'Đã từ chối bởi: '}
              </span>
              {ticket.handlerName}
              {ticket.handledAt && ` lúc ${formatDate(ticket.handledAt)}`}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-xs flex items-center justify-end gap-3 dark:border-gray-800 dark:bg-[#202124]/95">
          {canAct && isRecipient && ticket.status === 'PENDING' ? (
            <>
              {/* Nút Từ chối dạng viền đỏ */}
              <button
                type="button"
                onClick={onReject}
                disabled={isRejecting || isConfirming}
                className="inline-flex items-center justify-center rounded-2xl border-2 border-red-500 px-5 py-2.5 text-sm font-bold text-red-500 transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50 dark:border-red-500/80 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Đang từ chối...
                  </>
                ) : (
                  'Từ chối'
                )}
              </button>

              {/* Nút Deal lại */}
              {onRevert && (
                <button
                  type="button"
                  onClick={onRevert}
                  disabled={isRejecting || isConfirming}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-500/80 bg-amber-50 px-5 py-2.5 text-sm font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 disabled:opacity-50 dark:bg-amber-950/30 dark:border-amber-600 dark:text-amber-300"
                >
                  <RefreshCw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Deal lại</span>
                </button>
              )}

              {/* Nút Xác nhận chính màu cam */}
              <button
                type="button"
                onClick={onConfirm}
                disabled={isConfirming || isRejecting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-orange-600 active:scale-95 disabled:opacity-50"
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    Xác nhận
                  </>
                )}
              </button>
            </>
          ) : ticket.status === 'CONFIRMED' && !ticket.isPaid ? (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                {!ticket.isMentor ? 'Thanh toán để chuyển Task sang PREPARATION!' : 'Đã chốt thỏa thuận • Chờ Học viên thanh toán'}
              </span>
              <div className="flex items-center gap-2">
                {/* Nút Deal lại nếu một trong hai bên muốn điều chỉnh lại trước khi thanh toán */}
                {onRevert && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onRevert()
                    }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-500/80 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-95 dark:bg-amber-950/30 dark:border-amber-600 dark:text-amber-300"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Deal lại</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  Đóng
                </button>
                {!ticket.isMentor && onPay && (
                  <button
                    type="button"
                    onClick={onPay}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Thanh toán Task ngay</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {ticket.status === 'PENDING'
                  ? 'Đang chờ đối phương xác nhận'
                  : ticket.status === 'CONFIRMED'
                  ? ticket.isPaid
                    ? 'Deal đã thanh toán và Task đang ở trạng thái chuẩn bị'
                    : 'Ticket đã được xác nhận'
                  : ticket.status === 'REJECTED'
                  ? 'Ticket đã bị từ chối'
                  : 'Ticket đã được thay thế'}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
