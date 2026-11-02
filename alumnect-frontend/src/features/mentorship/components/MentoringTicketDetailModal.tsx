import { useTranslation } from 'react-i18next'
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
import { Avatar, DialogFrame } from '@/components/ui'
import { format } from 'date-fns'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  PROPOSAL_SOURCE_LABELS,
} from '../model/mentoringFlowLabels'

export type MentoringTicketType = 'DEAL' | 'EXTENSION' | 'ADJUSTMENT'

export interface MentoringTicketData {
  ticketType: MentoringTicketType
  ticketCode: string // Ví dụ: '#DL-024', '#EX-001', '#ADJ-001'
  version?: number
  dealId: number

  // Thông tin người gửi
  senderId?: number
  senderName: string
  senderAvatar?: string | null
  senderRole?: string // 'Mentor' | 'Học viên'

  // Trạng thái ticket: ADJUSTMENT = Học viên đã yêu cầu điều chỉnh phiên bản này
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED' | 'ADJUSTMENT'
  handlerName?: string
  handledAt?: string

  // Thông tin Deal Ticket
  taskScope?: string
  expectedResult?: string
  agreedPrice?: number
  deadline?: string
  workingMode?: string
  participationType?: string
  taskType?: string
  proposalSource?: string
  changeNote?: string | null

  // Thông tin Ticket Gia hạn
  currentDeadline?: string
  proposedDeadline?: string
  extensionReason?: string

  // Thông tin Ticket Yêu cầu điều chỉnh
  adjustmentNote?: string

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
  const { t } = useTranslation()
  if (!isOpen) return null

  // Format tiền tệ VND
  const formatVND = (amount?: number) => {
    if (typeof amount !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
  }

  // Format ngày tháng hiển thị DD/MM/YYYY
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return t('mentoring.undetermined', 'Chưa xác định')
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
    const mode = MENTORING_WORKING_MODE_LABELS[ticket.workingMode || ''] || t('mentoring.flexible', 'Linh hoạt')
    const part = MENTORING_PARTICIPATION_LABELS[ticket.participationType || ''] || t('mentoring.individual1on1', 'Cá nhân (1-1)')
    return `${mode} · ${part}`
  }

  // Header icon & title
  const isExtension = ticket.ticketType === 'EXTENSION'
  const isAdjustment = ticket.ticketType === 'ADJUSTMENT'
  const title = isAdjustment
    ? t('mentoring.ticketDetailAdjustment', 'Chi tiết Ticket Yêu Cầu Điều Chỉnh')
    : isExtension
      ? t('mentoring.ticketDetailExtension', 'Chi tiết Ticket Gia Hạn')
      : t('mentoring.ticketDetailDeal', 'Chi tiết Deal Ticket')

  // Render status badge
  const renderStatusBadge = () => {
    switch (ticket.status) {
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-3 py-1 text-xs font-semibold text-success">
            <Check className="h-3.5 w-3.5" />
            {t('mentoring.ticketStatusConfirmed', 'Đã xác nhận')}
          </span>
        )
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger-border bg-danger-soft px-3 py-1 text-xs font-semibold text-danger">
            <X className="h-3.5 w-3.5" />
            {t('mentoring.ticketStatusRejected', 'Đã từ chối')}
          </span>
        )
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
            <RefreshCw className="h-3.5 w-3.5" />
            {t('mentoring.ticketStatusAdjustment', 'Đã yêu cầu điều chỉnh')}
          </span>
        )
      case 'SUPERSEDED':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-text-subtle">
            {t('mentoring.ticketStatusSuperseded', 'Đã thay thế')}
          </span>
        )
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warning-border bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
            <Clock className="h-3.5 w-3.5 text-warning" />
            {t('mentoring.ticketStatusPending', 'Chờ xác nhận')}
          </span>
        )
    }
  }

  if (typeof document === 'undefined') return null

  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-lg"
      className="z-10 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${isAdjustment ? 'bg-amber-500' : isExtension ? 'bg-violet-500' : 'bg-brand-500'}`}>
            {isAdjustment ? <RefreshCw className="h-5 w-5" /> : isExtension ? <CalendarClock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-text sm:text-xl">
              {title}
            </h3>
            <p className="text-xs font-medium text-text-subtle">
              {ticket.ticketCode}
              {ticket.version ? ` · ${t('mentoring.version', 'Phiên bản')} ${ticket.version}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {renderStatusBadge()}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-text-subtle hover:bg-surface-3 hover:text-text-muted transition-colors dark:hover:bg-surface-2 cursor-pointer"
            title={t('common.close', 'Đóng popup')}
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
            className="ring-2 ring-info shrink-0"
          />
          <div>
            <h4 className="text-sm font-bold text-text">
              {ticket.senderName}
            </h4>
            <p className="text-xs text-text-subtle">
              {ticket.senderRole || t('mentoring.sender', 'Người gửi')}
            </p>
          </div>
        </div>

        <div className="h-px w-full bg-surface-3 dark:bg-surface-2" />

        {/* Box ghi chú yêu cầu điều chỉnh từ học viên nếu có */}
        {isAdjustment && ticket.adjustmentNote && (
          <div className="rounded-2xl border border-warning-border bg-warning-soft p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-warning mb-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>{t('mentoring.adjustmentContentFromStudent', 'NỘI DUNG YÊU CẦU ĐIỀU CHỈNH TỪ HỌC VIÊN:')}</span>
            </div>
            <p className="text-sm sm:text-base font-bold text-warning whitespace-pre-wrap leading-relaxed">
              "{ticket.adjustmentNote}"
            </p>
          </div>
        )}

        {/* Các trường nội dung chi tiết theo loại Ticket */}
        {!isExtension ? (
          /* Nội dung DEAL TICKET hoặc Deal phiên bản cần điều chỉnh */
          <div className="space-y-4 text-sm">
            {isAdjustment && (
              <div className="text-xs font-bold uppercase tracking-wider text-text-subtle">
                {t('mentoring.dealVersionAdjInfo', { version: ticket.version, defaultValue: `Thông tin Deal phiên bản ${ticket.version} cần điều chỉnh:` })}
              </div>
            )}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                {t('mentoring.taskScope', 'Phạm vi công việc')}
              </span>
              <p className="font-semibold text-text whitespace-pre-wrap leading-relaxed">
                {ticket.taskScope || t('mentoring.noInfoYet', 'Chưa có thông tin')}
              </p>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                {t('mentoring.expectedResult', 'Kết quả bàn giao')}
              </span>
              <p className="font-semibold text-text whitespace-pre-wrap leading-relaxed">
                {ticket.expectedResult || t('mentoring.byMutualAgreement', 'Theo thỏa thuận của hai bên')}
              </p>
            </div>

            {/* 2 Cột: Giá thỏa thuận & Deadline */}
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.agreedPrice', 'Giá thỏa thuận')}
                </span>
                <p className="font-display text-lg font-bold text-text">
                  {formatVND(ticket.agreedPrice)}
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  Deadline
                </span>
                <p className="font-display text-lg font-bold text-text">
                  {formatDate(ticket.deadline)}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                {t('mentoring.workingMode', 'Hình thức')}
              </span>
              <p className="font-semibold text-text">
                {getWorkingModeLabel()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.taskType', 'Loại nhiệm vụ')}
                </span>
                <p className="font-semibold text-text">
                  {MENTORING_TASK_TYPE_LABELS[ticket.taskType || ''] || ticket.taskType || '—'}
                </p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.proposalSource', 'Nguồn đề xuất')}
                </span>
                <p className="font-semibold text-text">
                  {PROPOSAL_SOURCE_LABELS[ticket.proposalSource || ''] || '—'}
                </p>
              </div>
            </div>

            {ticket.changeNote && (
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.versionNote', 'Ghi chú phiên bản')}
                </span>
                <p className="font-medium text-text-muted whitespace-pre-wrap">{ticket.changeNote}</p>
              </div>
            )}
          </div>
        ) : (
          /* Nội dung TICKET GIA HẠN */
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.currentDeadline', 'Deadline hiện tại')}
                </span>
                <p className="font-display text-base font-bold text-text-muted">
                  {formatDate(ticket.currentDeadline)}
                </p>
              </div>

              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                  {t('mentoring.proposedDeadline', 'Deadline đề xuất')}
                </span>
                <p className="font-display text-base font-bold text-info">
                  {formatDate(ticket.proposedDeadline)}
                </p>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-text-subtle mb-1">
                {t('mentoring.extensionReason', 'Lý do gia hạn')}
              </span>
              <p className="font-semibold text-text whitespace-pre-wrap leading-relaxed">
                {ticket.extensionReason || t('mentoring.noReasonProvided', 'Chưa cung cấp lý do')}
              </p>
            </div>
          </div>
        )}

        {/* Hộp thông báo chỉ dẫn (Blue Alert Box) */}
        <div className="flex items-start gap-3 rounded-2xl border border-info bg-info-soft p-3.5 text-xs font-medium text-info">
          <Info className="h-4 w-4 shrink-0 text-info mt-0.5" />
          <p className="leading-relaxed">
            {!isExtension
              ? t('mentoring.confirmDealNote', 'Xác nhận đúng phiên bản này để khóa Deal, chọn Mentor cho Request và chuyển sang thanh toán. Task chỉ được tạo sau khi thanh toán thành công.')
              : t('mentoring.confirmExtensionNote', 'Xác nhận để cập nhật deadline theo đề xuất đã được chấp nhận.')}
          </p>
        </div>

        {/* Lịch sử người xử lý nếu đã xử lý xong */}
        {ticket.status !== 'PENDING' && ticket.handlerName && (
          <div className="rounded-xl bg-surface-2 p-3 text-xs text-text-subtle">
            <span className="font-semibold text-text-muted">
              {ticket.status === 'CONFIRMED' ? t('mentoring.confirmedBy', 'Đã xác nhận bởi: ') : t('mentoring.rejectedBy', 'Đã từ chối bởi: ')}
            </span>
            {ticket.handlerName}
            {ticket.handledAt && t('mentoring.atTime', { time: formatDate(ticket.handledAt), defaultValue: ` lúc ${formatDate(ticket.handledAt)}` })}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="border-t border-border bg-surface px-6 py-4 backdrop-blur-xs flex items-center justify-end gap-3 dark:bg-surface/95">
        {canAct && isRecipient && ticket.status === 'PENDING' ? (
          <>
            {/* Nút Từ chối dạng viền đỏ */}
            <button
              type="button"
              onClick={onReject}
              disabled={isRejecting || isConfirming}
              className="inline-flex items-center justify-center rounded-2xl border-2 border-danger px-5 py-2.5 text-sm font-bold text-danger transition hover:bg-danger-soft active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  {t('mentoring.rejectingText', 'Đang từ chối...')}
                </>
              ) : (
                t('mentoring.rejectBtn', 'Từ chối')
              )}
            </button>

            {/* Nút Yêu cầu điều chỉnh (Học viên) */}
            {onRevert && (
              <button
                type="button"
                onClick={onRevert}
                disabled={isRejecting || isConfirming}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border-2 border-warning bg-warning-soft px-5 py-2.5 text-sm font-bold text-warning transition hover:bg-warning-border/60 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4 text-warning" />
                <span>{t('mentoring.requestAdjustmentBtn', 'Yêu cầu điều chỉnh')}</span>
              </button>
            )}

            {/* Nút Xác nhận chính màu cam */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming || isRejecting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-solid px-6 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary-hover active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isConfirming ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('mentoring.processing', 'Đang xử lý...')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[2.5]" />
                  {t('mentoring.confirmAndPay', 'Xác nhận & thanh toán')}
                </>
              )}
            </button>
          </>
        ) : ticket.status === 'CONFIRMED' && !ticket.isPaid ? (
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-xs font-semibold text-success">
              {!ticket.isMentor ? t('mentoring.payToPrepNotice', 'Thanh toán để chuyển Task sang PREPARATION!') : t('mentoring.dealClosedWaitingStudentPayment', 'Đã chốt thỏa thuận • Chờ Học viên thanh toán')}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-border bg-surface px-4 py-2 text-xs font-bold text-text-muted shadow-2xs hover:bg-surface-2 cursor-pointer"
              >
                {t('common.close', 'Đóng')}
              </button>
              {!ticket.isMentor && onPay && (
                <button
                  type="button"
                  onClick={onPay}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary-solid px-5 py-2.5 text-sm font-bold text-on-primary shadow-sm transition hover:bg-primary-hover active:scale-95 cursor-pointer"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>{t('mentoring.payTaskNow', 'Thanh toán Task ngay')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-text-subtle">
              {ticket.status === 'PENDING'
                ? t('mentoring.waitingOtherConfirm', 'Đang chờ đối phương xác nhận')
                : ticket.status === 'CONFIRMED'
                ? ticket.isPaid
                  ? t('mentoring.dealPaidTaskPrep', 'Deal đã thanh toán và Task đang ở trạng thái chuẩn bị')
                  : t('mentoring.ticketConfirmed', 'Ticket đã được xác nhận')
                : ticket.status === 'REJECTED'
                ? t('mentoring.ticketRejected', 'Ticket đã bị từ chối')
                : ticket.status === 'ADJUSTMENT'
                ? t('mentoring.studentRequestedAdjWaitingMentor', 'Học viên đã yêu cầu điều chỉnh, chờ Mentor gửi phiên bản mới')
                : t('mentoring.ticketSuperseded', 'Ticket đã được thay thế bởi phiên bản mới')}
            </span>
            <div className="flex items-center gap-2">
              {ticket.status === 'ADJUSTMENT' && ticket.isMentor && onRevert && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    onRevert()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-solid px-4 py-2 text-xs font-bold text-on-primary shadow-2xs hover:bg-primary-hover active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t('mentoring.createNewDealTicket', 'Tạo Deal Ticket mới')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-border bg-surface px-5 py-2 text-xs font-bold text-text-muted shadow-2xs hover:bg-surface-2 cursor-pointer"
              >
                {t('common.close', 'Đóng')}
              </button>
            </div>
          </div>
        )}
      </div>
    </DialogFrame>
  )
}
