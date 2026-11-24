import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  CreditCard,
  Loader2,
  ExternalLink,
  Scale,
  Award,
  Send,
  Download,
  Printer,
} from 'lucide-react'
import { Button, DialogFrame, toast } from '@/components/ui'
import { downloadInvoicePdf } from '@/lib/invoicePdf'
import { useTaskReport } from '../hooks/useMentoringTasks'
import { mentoringTaskApi } from '../api/mentoringTaskApi'

interface MentoringTaskReportModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  isStudent?: boolean
  isMentor?: boolean
  partyView?: 'student' | 'mentor'
}

export function MentoringTaskReportModal({
  isOpen,
  onClose,
  taskId,
  isStudent = false,
  isMentor = false,
  partyView,
}: MentoringTaskReportModalProps) {
  const { t, i18n } = useTranslation()
  const isEn = i18n.language?.startsWith('en')
  const queryClient = useQueryClient()
  const { data: report, isLoading, error } = useTaskReport(taskId, isOpen)

  const [isPingOpen, setIsPingOpen] = useState(false)
  const [pingReason, setPingReason] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null)

  const pingMutation = useMutation({
    mutationFn: (text: string) => mentoringTaskApi.pingAdminFinance(taskId, { reason: text }),
    onSuccess: () => {
      toast.success(isEn ? 'Financial issue reported to Administrators!' : 'Đã gửi phản ánh sự cố dòng tiền đến Ban Quản Trị!')
      setIsPingOpen(false)
      setPingReason('')
      setSelectedQuickReason(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-task-report', taskId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || (isEn ? 'Failed to send report' : 'Không thể gửi phản ánh sự cố'))
    },
  })

  const handleSendPing = () => {
    const text = pingReason.trim() || selectedQuickReason || ''
    if (text.length < 5) {
      toast.error(isEn ? 'Please enter a specific reason (at least 5 characters).' : 'Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }
    pingMutation.mutate(text)
  }

  if (!isOpen) return null

  const formatVnd = (amt?: number | null) => {
    const num = typeof amt === 'number' ? amt : 0
    return new Intl.NumberFormat('vi-VN').format(num) + (isEn ? ' VND' : 'đ')
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return isEn ? 'Undetermined' : 'Chưa xác định'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString(isEn ? 'en-GB' : 'vi-VN')
    } catch {
      return iso
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return isEn ? 'Completed Successfully' : 'Hoàn thành thành công'
      case 'RESOLVED':
        return isEn ? 'Resolved' : 'Đã giải quyết'
      case 'DISPUTED':
        return isEn ? 'Under Dispute' : 'Đang có tranh chấp'
      case 'CANCELLED':
        return isEn ? 'Stopped' : 'Đã dừng nhiệm vụ'
      case 'SUBMITTED':
        return isEn ? 'Awaiting Acceptance' : 'Chờ nghiệm thu bàn giao'
      case 'PREPARATION':
        return isEn ? 'Preparation' : 'Chuẩn bị'
      default:
        return isEn ? 'In Progress' : 'Đang thực hiện'
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-soft text-success border border-success-border">
            <CheckCircle2 className="w-3.5 h-3.5" /> {getStatusLabel(status)}
          </span>
        )
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger-soft text-danger border border-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> {getStatusLabel(status)}
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-3 text-text-muted dark:bg-surface-2 border border-border-strong">
            <X className="w-3.5 h-3.5" /> {getStatusLabel(status)}
          </span>
        )
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-info-soft text-info border border-info-border">
            <Clock className="w-3.5 h-3.5" /> {getStatusLabel(status)}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning border border-warning-border">
            <Clock className="w-3.5 h-3.5" /> {getStatusLabel(status)}
          </span>
        )
    }
  }

  const getMoneyStatusLabel = (status?: string | null) => {
    switch (status) {
      case 'PAID':
        return isEn ? 'Paid' : 'Đã chi trả'
      case 'REFUNDED':
        return isEn ? 'Refunded' : 'Đã hoàn tiền'
      case 'PROCESSING':
        return isEn ? 'Processing' : 'Đang xử lý'
      case 'FAILED':
        return isEn ? 'Failed' : 'Thất bại'
      case 'ON_HOLD':
        return isEn ? 'On Hold' : 'Tạm hoãn'
      case 'PENDING_REFUND':
        return isEn ? 'Pending Refund' : 'Chờ hoàn tiền'
      case 'PENDING_ESCROW':
        return isEn ? 'Held in PayOS' : 'Đang giữ trên PayOS'
      case 'NO_REFUND':
        return isEn ? 'Held in PayOS (No Refund)' : 'Giữ trên PayOS (Không hoàn)'
      case 'CANCELLED':
        return isEn ? 'Cancelled' : 'Đã hủy'
      default:
        return status || '—'
    }
  }

  const getMoneyStatusBadge = (status?: string | null) => {
    const label = getMoneyStatusLabel(status)
    switch (status) {
      case 'PAID':
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-success-soft text-success">{label}</span>
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-info-soft text-info">{label}</span>
      case 'FAILED':
      case 'ON_HOLD':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-danger-soft text-danger">{label}</span>
      case 'PENDING_REFUND':
      case 'PENDING_ESCROW':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-warning-soft text-warning">{label}</span>
      default:
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-surface-3 text-text-muted">{label}</span>
    }
  }

  if (typeof document === 'undefined') return null

  return (
    <DialogFrame
      onClose={onClose}
      zIndexClassName="z-[100]"
      maxWidthClassName="max-w-3xl"
      className="overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="bg-surface-2 px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-info text-text-inverse rounded-xl shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-text">
                {isEn ? 'Task Results & Payment Invoice' : 'Báo cáo kết quả & Hóa đơn thanh toán'}
              </h3>
              <span className="text-xs px-2 py-0.5 tabular-nums font-medium rounded bg-info-soft text-info">
                #{taskId}
              </span>
            </div>
            <p className="text-xs text-text-subtle">
              {isEn
                ? 'Comprehensive report on progress, deliverables, and separate party invoices'
                : 'Báo cáo tổng hợp tiến độ, kết quả bàn giao và hóa đơn riêng cho từng phía'}
            </p>
          </div>
        </div>
        <button
          aria-label={t('common.close', isEn ? 'Close' : 'Đóng')}
          type="button"
          onClick={onClose}
          className="p-1.5 text-text-subtle hover:text-text-muted rounded-lg hover:bg-surface-3 dark:hover:bg-surface-2 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-text-subtle">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
            <p className="text-sm">{isEn ? 'Loading report data...' : 'Đang tải dữ liệu báo cáo...'}</p>
          </div>
        ) : error || !report ? (
          <div className="p-4 bg-danger-soft border border-danger-border text-danger rounded-xl text-sm">
            {isEn ? 'Failed to load task report. Please try again later.' : 'Không thể tải thông tin báo cáo. Vui lòng thử lại sau.'}
          </div>
        ) : (() => {
          const mentorGross = (report.mentorEarnedAmount && report.mentorEarnedAmount > 0)
            ? report.mentorEarnedAmount
            : (report.latestTicket?.mentorAmount ?? 0)
          const mentorFee = report.mentorPlatformFee != null
            ? report.mentorPlatformFee
            : (mentorGross > 0 ? Math.min(3000, mentorGross) : 0)
          const mentorNet = Math.max(0, mentorGross - mentorFee)

          const studentGross = (report.studentGrossRefundAmount != null && report.studentGrossRefundAmount > 0)
            ? report.studentGrossRefundAmount
            : (report.latestTicket?.studentRefund ?? report.studentRefundAmount ?? 0)
          const studentFee = report.studentPlatformFee != null
            ? report.studentPlatformFee
            : (studentGross > 0 ? Math.min(3000, studentGross) : 0)
          const studentNet = Math.max(0, studentGross - studentFee)

          const mentorSplit = mentorNet
          const studentSplit = studentNet
          const baseInvoiceCode = report.invoiceCode || `INV-${taskId}`

          let effectiveStudentStatus = report.studentRefundStatus
          if (report.hasFailedLedger || report.studentRefundStatus === 'FAILED') {
            effectiveStudentStatus = 'FAILED'
          } else if (report.studentRefundStatus === 'REFUNDED') {
            effectiveStudentStatus = 'REFUNDED'
          } else if (studentSplit > 0) {
            effectiveStudentStatus = 'PENDING_REFUND'
          }

          let effectiveMentorStatus = report.mentorPayoutStatus
          if (report.hasFailedLedger || report.mentorPayoutStatus === 'FAILED') {
            effectiveMentorStatus = 'FAILED'
          } else if (report.mentorPayoutStatus === 'PAID') {
            effectiveMentorStatus = 'PAID'
          } else if (mentorSplit > 0) {
            effectiveMentorStatus = 'PENDING_ESCROW'
          }

          /** Xuất Hóa đơn tách riêng cho từng phía (Phía Học viên hoặc Phía Cố vấn) kèm logo AlumNect */
          const buildPartyInvoiceHtml = (party: 'student' | 'mentor') => {
            const issuedDate = new Date(report.invoiceIssuedAt || report.completedAt || report.createdAt || Date.now()).toLocaleString(isEn ? 'en-GB' : 'vi-VN')
            const partyInvoiceCode = `${baseInvoiceCode}-${party === 'student' ? 'HV' : 'CV'}`
            const partyTitle = party === 'student'
              ? (isEn ? 'INVOICE FOR LEARNER SIDE' : 'HÓA ĐƠN PHÍA HỌC VIÊN')
              : (isEn ? 'INVOICE FOR MENTOR SIDE' : 'HÓA ĐƠN PHÍA CỐ VẤN')

            const partyBodyHtml = party === 'student'
              ? `
      <div class="card">
        <h3>${isEn ? 'PAYMENT & REFUND DETAILS (LEARNER SIDE)' : 'CHI TIẾT THANH TOÁN & ĐỐI SOÁT (PHÍA HỌC VIÊN)'}</h3>
        <div class="row"><span>${isEn ? 'Learner:' : 'Họ và tên:'}</span><strong>${report.student?.fullName || '—'} (${report.student?.email || ''})</strong></div>
        <div class="row"><span>${isEn ? 'Original Agreed Price:' : 'Giá thỏa thuận gốc:'}</span><strong>${formatVnd(report.originalPrice)}</strong></div>
        <div class="row"><span>${isEn ? 'Amendment Addition:' : 'Điều chỉnh bổ sung:'}</span><strong>+${formatVnd(report.totalAdditionalAmount || 0)}</strong></div>
        <div class="row"><span>${isEn ? 'Platform Fee on Payment:' : 'Phí nền tảng khi thanh toán:'}</span><strong>${formatVnd(0)}</strong></div>
        <div class="row total student"><span>${isEn ? 'Total Amount Paid (Held in PayOS):' : 'Tổng tiền đã thanh toán (Giữ trên PayOS):'}</span><span>${formatVnd(report.studentTotalPaid)}</span></div>
        ${studentGross > 0 ? `
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #cbd5e1;">
          <div class="row"><span>${isEn ? 'Allocated Refund Amount:' : 'Khoản hoàn trả phân bổ gốc:'}</span><strong>${formatVnd(studentGross)}</strong></div>
          <div class="row fee"><span>${isEn ? 'Platform Fee:' : 'Phí nền tảng:'}</span><span>-${formatVnd(studentFee)}</span></div>
          <div class="row total student"><span>${isEn ? 'Net Refund Received:' : 'Số tiền hoàn thực nhận:'}</span><span>${formatVnd(studentNet)}</span></div>
          <div class="row"><span>${isEn ? 'Refund Status:' : 'Trạng thái hoàn tiền:'}</span><strong>${getMoneyStatusLabel(effectiveStudentStatus)}</strong></div>
        </div>
        ` : ''}
      </div>`
              : `
      <div class="card">
        <h3>${isEn ? 'COMPENSATION & PAYOUT DETAILS (MENTOR SIDE)' : 'CHI TIẾT THÙ LAO & GIẢI NGÂN (PHÍA CỐ VẤN)'}</h3>
        <div class="row"><span>${isEn ? 'Mentor:' : 'Họ và tên:'}</span><strong>${report.mentor?.fullName || '—'} (${report.mentor?.email || ''})</strong></div>
        <div class="row"><span>${isEn ? 'Gross Compensation:' : 'Thù lao công việc gốc:'}</span><strong>${formatVnd(mentorGross)}</strong></div>
        <div class="row fee"><span>${isEn ? 'Platform Fee:' : 'Phí nền tảng:'}</span><span>${mentorFee > 0 ? '-' + formatVnd(mentorFee) : formatVnd(0)}</span></div>
        <div class="row total"><span>${isEn ? 'Net Payout Received:' : 'Thù lao thực nhận:'}</span><span>${formatVnd(mentorNet)}</span></div>
        <div class="row" style="margin-top:8px;"><span>${isEn ? 'Payout Status:' : 'Trạng thái chi trả:'}</span><strong>${getMoneyStatusLabel(effectiveMentorStatus)}</strong></div>
      </div>`

            return `<!DOCTYPE html>
<html lang="${isEn ? 'en' : 'vi'}">
<head>
  <meta charset="UTF-8" />
  <title>${partyTitle} - ${partyInvoiceCode}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }
    .invoice { max-width: 680px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(15,23,42,0.06); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f27024; padding-bottom: 20px; margin-bottom: 24px; }
    .logo-wordmark { font-family: 'Caveat', 'Segoe Script', 'Comic Sans MS', cursive; font-size: 42px; font-weight: 700; line-height: 1; letter-spacing: 0.5px; display: inline-block; }
    .logo-alum { color: #0a58ca; }
    .logo-nect { color: #c84b11; }
    .subtitle { font-size: 13px; font-weight: 700; color: #475569; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.4px; }
    .meta { text-align: right; font-size: 13px; color: #334155; line-height: 1.6; }
    .meta strong { color: #0f172a; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; background: #f8fafc; }
    .card h3 { margin: 0 0 14px 0; font-size: 15px; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 14px; }
    .row.fee { color: #dc2626; font-weight: 700; }
    .row.total { border-top: 1px dashed #94a3b8; margin-top: 10px; padding-top: 12px; font-size: 16px; font-weight: 800; color: #16a34a; }
    .row.total.student { color: #0284c7; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo-wordmark"><span class="logo-alum">Alum</span><span class="logo-nect">Nect</span></div>
        <div class="subtitle">${partyTitle}</div>
      </div>
      <div class="meta">
        <div>${isEn ? 'Invoice Code:' : 'Mã hóa đơn:'} <strong>${partyInvoiceCode}</strong></div>
        <div>${isEn ? 'Task:' : 'Nhiệm vụ:'} <strong>#${taskId}</strong></div>
        <div>${isEn ? 'Issued Date:' : 'Ngày xuất:'} <strong>${issuedDate}</strong></div>
        <div>${isEn ? 'Status:' : 'Trạng thái:'} <strong>${getStatusLabel(report.taskStatus)}</strong></div>
      </div>
    </div>

    <div style="margin-bottom: 20px; font-size: 14px; line-height: 1.6;">
      <strong>${isEn ? 'Task Title:' : 'Tên nhiệm vụ:'}</strong> ${report.taskTitle}
    </div>

    ${partyBodyHtml}

    <div class="footer">
      ${isEn
                ? 'Electronic invoice automatically generated from the AlumNect transaction ledger.'
                : 'Chứng từ đối soát điện tử được trích xuất tự động từ hệ thống sổ giao dịch AlumNect.'}
    </div>
  </div>
</body>
</html>`
          }

          const handleDownloadPartyInvoice = async (party: 'student' | 'mentor') => {
            const fileName = party === 'student'
              ? (isEn ? `Learner-Invoice-Task-${taskId}.pdf` : `Hoa-don-Phia-Hoc-vien-Task-${taskId}.pdf`)
              : (isEn ? `Mentor-Invoice-Task-${taskId}.pdf` : `Hoa-don-Phia-Co-van-Task-${taskId}.pdf`)
            try {
              const html = buildPartyInvoiceHtml(party)
              toast.info(isEn ? 'Generating PDF invoice...' : 'Đang khởi tạo hóa đơn PDF...')
              await downloadInvoicePdf(html, fileName)
              toast.success(
                isEn
                  ? `Downloaded ${party === 'student' ? 'Learner Side' : 'Mentor Side'} PDF invoice!`
                  : `Đã tải ${party === 'student' ? 'Hóa đơn Phía Học viên' : 'Hóa đơn Phía Cố vấn'} (PDF) về máy!`
              )
            } catch {
              toast.error(isEn ? 'Could not download PDF invoice.' : 'Không thể tải hóa đơn PDF, vui lòng thử lại.')
            }
          }

          const handlePrintPartyInvoice = (party: 'student' | 'mentor') => {
            const html = buildPartyInvoiceHtml(party)
            const win = window.open('', '_blank', 'width=820,height=700')
            if (!win) {
              handleDownloadPartyInvoice(party)
              return
            }
            win.document.open()
            win.document.write(html)
            win.document.close()
            win.focus()
            setTimeout(() => win.print(), 250)
          }

          return (
            <>
              {/* Task Title & Status Banner */}
              <div className="p-4 bg-surface-2 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-subtle">
                    {isEn ? 'Mentoring Task' : 'Nhiệm vụ Cố vấn'}
                  </span>
                  <h4 className="text-base font-bold text-text">
                    {report.taskTitle}
                  </h4>
                  {report.description && (
                    <p className="text-xs text-text-muted line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0">{getStatusBadge(report.taskStatus)}</div>
              </div>

              {/* Dispute Alert Banner if Disputed */}
              {(report.isDisputed || report.taskStatus === 'DISPUTED') && (
                <div className="p-4 bg-danger-soft border border-danger rounded-xl flex items-start gap-3 text-xs text-danger">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm">
                        {isEn ? 'Task is currently under dispute arbitration' : 'Nhiệm vụ đang trong quá trình phân xử tranh chấp'}
                      </p>
                      {(report.activeTicket?.ticketCode || report.latestTicket?.ticketCode) && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-danger text-white">
                          {report.activeTicket?.ticketCode || report.latestTicket?.ticketCode}
                        </span>
                      )}
                    </div>
                    <p className="text-foreground/80">
                      {report.activeTicket?.disputeReason || report.latestTicket?.disputeReason}
                    </p>
                    <p className="font-semibold text-danger">
                      {isEn
                        ? 'All funds in PayOS Escrow are temporarily frozen to safeguard both parties.'
                        : 'Toàn bộ tiền trong quỹ PayOS đang được tạm khóa để bảo vệ hai bên.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Resolution Banner if Resolved */}
              {(report.taskStatus === 'RESOLVED' || report.latestTicket?.status === 'RESOLVED') && (
                <div className="p-4 bg-success-soft border border-success-border rounded-xl space-y-2.5 text-xs text-success">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-success shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-success">
                          {report.resolutionDecision === 'FULL_MENTOR_PAYMENT'
                            ? (isEn ? 'Ruling: Full Payout to Mentor Side' : 'Phán quyết: Chi trả toàn bộ thù lao cho Phía Cố vấn')
                            : report.resolutionDecision === 'FULL_STUDENT_REFUND'
                              ? (isEn ? 'Ruling: Full Refund to Learner Side' : 'Phán quyết: Hoàn trả toàn bộ học phí cho Phía Học viên')
                              : (isEn ? 'Resolution: Agreed Fund Division' : 'Kết quả giải quyết: Hòa giải phân chia quỹ thỏa thuận')}
                        </p>
                        {report.latestTicket?.ticketCode && (
                          <span className="text-xs text-text-subtle font-mono">
                            {isEn ? 'Ticket Code: ' : 'Mã phiếu liên quan: '}{report.latestTicket.ticketCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 font-bold rounded bg-success text-white">
                      {isEn ? 'Executed' : 'Đã thực thi'}
                    </span>
                  </div>

                  {(report.resolutionNote || report.latestTicket?.resolutionNote) && (
                    <p className="text-xs text-text-muted bg-surface/70 p-2.5 rounded-lg border border-border">
                      <strong>{isEn ? 'Resolution Basis:' : 'Căn cứ giải quyết:'}</strong> {report.resolutionNote || report.latestTicket?.resolutionNote}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-2.5 bg-surface rounded-lg border border-border">
                      <span className="text-text-subtle block">{isEn ? 'Mentor Side Receives:' : 'Phía Cố vấn nhận:'}</span>
                      <span className="font-bold text-sm text-success">{formatVnd(mentorSplit)}</span>
                    </div>
                    <div className="p-2.5 bg-surface rounded-lg border border-border">
                      <span className="text-text-subtle block">{isEn ? 'Learner Side Refunded:' : 'Phía Học viên nhận hoàn:'}</span>
                      <span className="font-bold text-sm text-info">{formatVnd(studentSplit)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1: Cam kết & Thời hạn */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-info" />
                  {isEn ? '1. Agreed Terms & Deadlines' : '1. Cam kết thỏa thuận & Thời hạn'}
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-text-subtle block text-xs">{isEn ? 'Initial Deadline' : 'Hạn chót ban đầu'}</span>
                    <span className="font-semibold text-text">
                      {formatDt(report.originalDeadline)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-text-subtle block text-xs">{isEn ? 'Final Deadline' : 'Hạn chót cuối cùng'}</span>
                    <span className="font-semibold text-text">
                      {formatDt(report.finalDeadline)}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-text-subtle block text-xs">{isEn ? 'Extension Count' : 'Số lần gia hạn'}</span>
                    <span className="font-semibold text-text">
                      {isEn ? `${report.extensionCount} times` : `${report.extensionCount} lần`}
                      {report.totalExtensionDays > 0 ? (isEn ? ` (+${report.totalExtensionDays} days)` : ` (+${report.totalExtensionDays} ngày)`) : ''}
                    </span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-text-subtle block text-xs">{isEn ? 'Execution Duration' : 'Thời gian thực hiện'}</span>
                    <span className="font-semibold text-text">
                      {report.durationDays != null
                        ? (isEn ? `${report.durationDays} days` : `${report.durationDays} ngày`)
                        : (isEn ? 'Not ended yet' : 'Chưa kết thúc')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Tiến độ & Kết quả bàn giao */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-success" />
                  {isEn ? '2. Execution Progress & Deliverables' : '2. Tiến độ thực hiện & Bàn giao kết quả'}
                </h5>
                <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-muted">
                      {isEn
                        ? `Confirmed work logs: ${report.confirmedWorkLogs}/${report.totalWorkLogs} sessions`
                        : `Nhật ký công việc đã xác nhận: ${report.confirmedWorkLogs}/${report.totalWorkLogs} buổi`}
                    </span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {isEn
                        ? `${Math.round(report.progressPercentage)}% completed`
                        : `${Math.round(report.progressPercentage)}% hoàn thành`}
                    </span>
                  </div>
                  <div className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-success h-2 rounded-full transition duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                    />
                  </div>

                  {report.completionSummary ? (
                    <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-text">
                          {isEn ? 'Final Deliverable:' : 'Sản phẩm bàn giao cuối cùng:'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-success-soft text-success font-medium">
                          {report.completionSummary.status === 'CONFIRMED'
                            ? (isEn ? 'Confirmed' : 'Đã nghiệm thu')
                            : report.completionSummary.status === 'PENDING'
                              ? (isEn ? 'Pending' : 'Chờ nghiệm thu')
                              : report.completionSummary.status}
                        </span>
                      </div>
                      <p className="text-text-muted">
                        {report.completionSummary.finalSummary}
                      </p>
                      {report.completionSummary.deliverables && (
                        <p className="text-text-muted">
                          <strong>{isEn ? 'Content:' : 'Nội dung:'}</strong> {report.completionSummary.deliverables}
                        </p>
                      )}
                      {report.completionSummary.attachmentUrls && report.completionSummary.attachmentUrls.length > 0 && (
                        <div className="pt-1 flex items-center gap-2 flex-wrap">
                          {report.completionSummary.attachmentUrls.map((url, i) => (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium text-xs"
                            >
                              <ExternalLink className="w-3 h-3" /> {isEn ? `Attachment #${i + 1}` : `Tệp đính kèm #${i + 1}`}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-border text-xs text-text-subtle">
                      {isEn ? 'No official completion handover submitted yet.' : 'Chưa có biên bản nộp sản phẩm hoàn thành chính thức.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Hóa đơn riêng theo vai trò */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-info" />
                  {partyView === 'student'
                    ? (isEn ? '3. Learner Side Invoice' : '3. Hóa đơn Phía Học viên')
                    : partyView === 'mentor'
                      ? (isEn ? '3. Mentor Side Invoice' : '3. Hóa đơn Phía Cố vấn')
                      : (isEn ? '3. Separate Invoices for Learner Side & Mentor Side' : '3. Hóa đơn riêng cho Phía Học viên & Phía Cố vấn')}
                </h5>

                <div className={partyView ? 'w-full' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
                  {/* Learner Side Invoice Card */}
                  {(!partyView || partyView === 'student') && (
                    <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${isStudent || partyView === 'student'
                      ? 'bg-info-soft border-info ring-2 ring-info'
                      : 'bg-surface border-border'
                      }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                          <span className="font-bold text-xs text-info">
                            {isEn ? 'Learner Side Invoice' : 'Hóa đơn Phía Học viên'}
                          </span>
                          {isStudent && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-info-soft text-info font-bold">
                              {isEn ? 'Your Role' : 'Vai trò của bạn'}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-subtle">{isEn ? 'Original Agreed Price:' : 'Giá thỏa thuận gốc:'}</span>
                            <span className="font-medium text-text">
                              {formatVnd(report.originalPrice)}
                            </span>
                          </div>
                          {report.totalAdditionalAmount > 0 && (
                            <div className="flex justify-between text-warning">
                              <span>{isEn ? 'Amendment Addition:' : 'Bổ sung điều chỉnh:'}</span>
                              <span className="font-medium">
                                +{formatVnd(report.totalAdditionalAmount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-text-subtle">{isEn ? 'Platform Fee on Payment:' : 'Phí nền tảng khi thanh toán:'}</span>
                            <span className="font-semibold text-success">
                              {formatVnd(0)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                            <span>{isEn ? 'Total Amount Paid:' : 'Tổng tiền đã thanh toán:'}</span>
                            <span className="text-info">
                              {formatVnd(report.studentTotalPaid)}
                            </span>
                          </div>

                          {studentGross > 0 && (
                            <>
                              <div className="flex justify-between pt-1 text-text-muted">
                                <span>{isEn ? 'Allocated Refund Amount:' : 'Khoản hoàn trả phân bổ gốc:'}</span>
                                <span className="font-semibold text-text">
                                  {formatVnd(studentGross)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-text-subtle">{isEn ? 'Platform Fee:' : 'Phí nền tảng:'}</span>
                                <span className="font-bold text-danger">
                                  -{formatVnd(studentFee)}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                                <span>{isEn ? 'Net Refund Received:' : 'Số tiền hoàn thực nhận:'}</span>
                                <span className="font-bold text-info">
                                  {formatVnd(studentNet)}
                                </span>
                              </div>
                            </>
                          )}

                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-text-subtle">
                              {studentGross > 0
                                ? (isEn ? 'Refund Status:' : 'Trạng thái hoàn tiền:')
                                : (isEn ? 'Fund Status:' : 'Trạng thái quỹ:')}
                            </span>
                            {getMoneyStatusBadge(effectiveStudentStatus)}
                          </div>
                          {report.studentRefundNote && effectiveStudentStatus === 'FAILED' && (
                            <p className="text-[11px] text-danger font-medium mt-1 leading-relaxed">
                              ⚠️ {report.studentRefundNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintPartyInvoice('student')}
                          className="text-xs font-semibold gap-1 py-1 px-2.5 h-7"
                        >
                          <Printer className="w-3 h-3" />
                          {isEn ? 'Print / PDF' : 'In / Lưu PDF'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDownloadPartyInvoice('student')}
                          className="text-xs font-bold bg-info hover:bg-info/90 text-white gap-1 py-1 px-2.5 h-7 shadow-2xs"
                        >
                          <Download className="w-3 h-3" />
                          {isEn ? 'Download Invoice' : 'Tải hóa đơn'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Mentor Side Invoice Card */}
                  {(!partyView || partyView === 'mentor') && (
                    <div className={`p-4 rounded-xl border transition flex flex-col justify-between ${isMentor || partyView === 'mentor'
                      ? 'bg-info-soft border-info ring-2 ring-info'
                      : 'bg-surface border-border'
                      }`}>
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                          <span className="font-bold text-xs text-info">
                            {isEn ? 'Mentor Side Invoice' : 'Hóa đơn Phía Cố vấn'}
                          </span>
                          {isMentor && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-info-soft text-info font-bold">
                              {isEn ? 'Your Role' : 'Vai trò của bạn'}
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-text-subtle">{isEn ? 'Gross Compensation:' : 'Thù lao công việc gốc:'}</span>
                            <span className="font-semibold text-text">
                              {formatVnd(mentorGross)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-text-subtle">{isEn ? 'Platform Fee:' : 'Phí nền tảng:'}</span>
                            <span className={`font-bold ${mentorFee > 0 ? 'text-danger' : 'text-text-subtle'}`}>
                              {mentorFee > 0 ? `-${formatVnd(mentorFee)}` : formatVnd(0)}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                            <span>{isEn ? 'Net Payout Received:' : 'Thù lao thực nhận:'}</span>
                            <span className="text-success">
                              {formatVnd(mentorNet)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1">
                            <span className="text-text-subtle">{isEn ? 'Payout Status:' : 'Trạng thái chi trả:'}</span>
                            {getMoneyStatusBadge(effectiveMentorStatus)}
                          </div>
                          {report.mentorPayoutNote && effectiveMentorStatus === 'FAILED' && (
                            <p className="text-[11px] text-danger font-medium mt-1 leading-relaxed">
                              ⚠️ {report.mentorPayoutNote}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintPartyInvoice('mentor')}
                          className="text-xs font-semibold gap-1 py-1 px-2.5 h-7"
                        >
                          <Printer className="w-3 h-3" />
                          {isEn ? 'Print / PDF' : 'In / Lưu PDF'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleDownloadPartyInvoice('mentor')}
                          className="text-xs font-bold bg-primary-solid hover:bg-primary-hover text-on-primary gap-1 py-1 px-2.5 h-7 shadow-2xs"
                        >
                          <Download className="w-3 h-3" />
                          {isEn ? 'Download Invoice' : 'Tải hóa đơn'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ping Admin Action Banner if canPingAdminFinance */}
                {report.canPingAdminFinance !== false && (
                  <div className="p-4 bg-danger-soft/60 border border-danger/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold text-danger flex items-center gap-1.5 text-sm">
                        <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                        {isEn ? 'Refund issue or amount discrepancy?' : 'Sự cố hoàn tiền hoặc sai lệch số tiền?'}
                      </p>
                      <p className="text-text-muted">
                        {isEn
                          ? 'If your refund or payout has not arrived or the amount is incorrect, click to alert Administrators for ledger reconciliation.'
                          : 'Nếu tiền hoàn chưa về tài khoản, chưa nhận được thù lao hoặc số tiền sai lệch, bấm nút để gửi cảnh báo Ban Quản Trị đối soát.'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPingOpen(true)}
                      className="shrink-0 text-xs font-bold text-danger border-danger/40 hover:bg-danger hover:text-white transition gap-1.5"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isEn ? 'Report Financial Issue' : 'Báo cáo sự cố dòng tiền'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )
        })()}
      </div>

      {/* Subdialog Ping Admin */}
      {isPingOpen && (
        <DialogFrame
          onClose={() => setIsPingOpen(false)}
                zIndexClassName="z-[110]"
                maxWidthClassName="max-w-md"
                className="p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-danger-soft text-danger rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-base text-text">
                      {isEn ? 'Report Financial Issue' : 'Báo cáo sự cố dòng tiền'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPingOpen(false)}
                    className="p-1 text-text-subtle hover:text-text rounded-md hover:bg-surface-2 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-text-muted">
                  {isEn
                    ? `Send a report to Administrators to reconcile the ledger and re-process the refund or payout for Task #${taskId}.`
                    : `Gửi phản ánh tới Ban Quản Trị để đối soát sổ quỹ và xử lý lại giao dịch hoàn tiền hoặc thù lao cho Nhiệm vụ #${taskId}.`}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-text-subtle uppercase">
                    {isEn ? 'Quick Reasons' : 'Chọn nhanh lý do'}
                  </span>
                  <div className="space-y-1.5">
                    {(isEn
                      ? [
                        'Have not received refund in bank account',
                        'Refund or payout amount is inaccurate',
                        'Have not received payout after task completion',
                        'Beneficiary bank account reported transaction error',
                      ]
                      : [
                        'Chưa nhận được tiền hoàn trả về tài khoản',
                        'Số tiền hoàn / chi trả bị sai lệch',
                        'Chưa nhận được thù lao sau khi hoàn thành',
                        'Tài khoản nhận tiền báo lỗi giao dịch',
                      ]
                    ).map((reasonText) => {
                      const isSelected = selectedQuickReason === reasonText
                      return (
                        <button
                          key={reasonText}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedQuickReason(null)
                            } else {
                              setSelectedQuickReason(reasonText)
                              setPingReason(reasonText)
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition cursor-pointer ${isSelected
                            ? 'bg-primary-soft text-primary-solid border-primary-500 font-semibold'
                            : 'bg-surface hover:bg-surface-2 text-text border-border'
                            }`}
                        >
                          {reasonText}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-text-subtle uppercase">
                    {isEn ? 'Detailed Description' : 'Mô tả cụ thể'}
                  </span>
                  <textarea
                    rows={3}
                    value={pingReason}
                    onChange={(e) => setPingReason(e.target.value)}
                    placeholder={
                      isEn
                        ? 'Provide details about when you checked your account, missing amount...'
                        : 'Chi tiết về thời gian kiểm tra tài khoản, số tiền chưa nhận được...'
                    }
                    className="w-full p-2.5 bg-surface-2 border border-border rounded-lg text-xs text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPingOpen(false)}
                    className="text-xs"
                  >
                    {isEn ? 'Cancel' : 'Hủy'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={pingMutation.isPending}
                    onClick={handleSendPing}
                    className="text-xs font-bold bg-danger hover:bg-danger/90 text-white gap-1.5"
                  >
                    {pingMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isEn ? 'Sending...' : 'Đang gửi...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> {isEn ? 'Send Report' : 'Gửi phản ánh'}
                      </>
                    )}
                  </Button>
                </div>
              </DialogFrame>
            )
          }

          {/* Footer */ }
          <div className="px-6 py-3.5 bg-surface-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-subtle">
              {isEn
                ? 'Report data is automatically synchronized from the AlumNect transaction ledger.'
                : 'Dữ liệu báo cáo được cập nhật tự động từ hệ thống sổ giao dịch AlumNect.'}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs px-4 py-1.5"
            >
              {t('common.close', isEn ? 'Close' : 'Đóng')}
            </Button>
          </div>
            </DialogFrame >
  )
}
