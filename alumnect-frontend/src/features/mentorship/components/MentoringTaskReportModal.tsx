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
  ShieldCheck,
  CreditCard,
  Loader2,
  ExternalLink,
  Scale,
  Award,
  Send,
} from 'lucide-react'
import { Button, DialogFrame, toast } from '@/components/ui'
import { useTaskReport } from '../hooks/useMentoringTasks'
import { mentoringTaskApi } from '../api/mentoringTaskApi'

interface MentoringTaskReportModalProps {
  isOpen: boolean
  onClose: () => void
  taskId: number
  isStudent?: boolean
  isMentor?: boolean
}

export function MentoringTaskReportModal({
  isOpen,
  onClose,
  taskId,
  isStudent = false,
  isMentor = false,
}: MentoringTaskReportModalProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: report, isLoading, error } = useTaskReport(taskId, isOpen)

  const [isPingOpen, setIsPingOpen] = useState(false)
  const [pingReason, setPingReason] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null)

  const pingMutation = useMutation({
    mutationFn: (text: string) => mentoringTaskApi.pingAdminFinance(taskId, { reason: text }),
    onSuccess: () => {
      toast.success('Đã gửi phản ánh sự cố dòng tiền đến Ban Quản Trị!')
      setIsPingOpen(false)
      setPingReason('')
      setSelectedQuickReason(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-task-report', taskId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gửi phản ánh sự cố')
    },
  })

  const handleSendPing = () => {
    const text = pingReason.trim() || selectedQuickReason || ''
    if (text.length < 5) {
      toast.error('Vui lòng nhập lý do cụ thể (tối thiểu 5 ký tự).')
      return
    }
    pingMutation.mutate(text)
  }

  if (!isOpen) return null

  const formatVnd = (amt?: number | null) => {
    if (typeof amt !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + 'đ'
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return t('mentoring.undetermined', 'Chưa xác định')
    try {
      const d = new Date(iso)
      return d.toLocaleDateString()
    } catch {
      return iso
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-soft text-success border border-success-border">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('mentoring.completedSuccess', 'Hoàn thành thành công')}
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-success-soft text-success border border-success-border">
            <CheckCircle2 className="w-3.5 h-3.5" /> {t('mentoring.resolvedStatus', 'Đã giải quyết tranh chấp')}
          </span>
        )
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-danger-soft text-danger border border-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> {t('mentoring.disputedStatus', 'Đang có tranh chấp (DISPUTED)')}
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-3 text-text-muted dark:bg-surface-2 border border-border-strong">
            <X className="w-3.5 h-3.5" /> {t('mentoring.stoppedTask', 'Đã dừng nhiệm vụ')}
          </span>
        )
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-info-soft text-info border border-info-border">
            <Clock className="w-3.5 h-3.5" /> {t('mentoring.waitingAcceptance', 'Chờ nghiệm thu bàn giao')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning border border-warning-border">
            <Clock className="w-3.5 h-3.5" /> {t('mentoring.inProgressStatus', { status: status || 'IN_PROGRESS' })}
          </span>
        )
    }
  }

  const getMoneyStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-success-soft text-success">Đã chi trả</span>
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-success-soft text-success">Đã hoàn tiền</span>
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-info-soft text-info">Đang xử lý</span>
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-danger-soft text-danger">Thất bại / Lỗi</span>
      case 'ON_HOLD':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-danger-soft text-danger">Tạm hoãn (tranh chấp)</span>
      case 'PENDING_REFUND':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-warning-soft text-warning">Chờ hoàn tiền</span>
      case 'PENDING_ESCROW':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-warning-soft text-warning">Đang tạm giữ</span>
      case 'NO_REFUND':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-surface-3 text-text-muted">Không hoàn tiền</span>
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-surface-3 text-text-muted">Đã hủy</span>
      default:
        return <span className="px-2 py-0.5 rounded font-bold text-xs bg-surface-3 text-text-muted">{status || '—'}</span>
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
                {t('mentoring.taskReportTitle', 'Báo cáo kết quả Task & Trạng thái thanh toán')}
              </h3>
              <span className="text-xs px-2 py-0.5 tabular-nums font-medium rounded bg-info-soft text-info">
                Task #{taskId}
              </span>
            </div>
            <p className="text-xs text-text-subtle">
              {t('mentoring.taskReportSubtitle', 'Báo cáo tổng hợp tiến độ, kết quả bàn giao và đối soát tài chính')}
            </p>
          </div>
        </div>
        <button
          aria-label={t('common.close', 'Đóng')}
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
            <p className="text-sm">{t('mentoring.loadingTaskReport', 'Đang tải dữ liệu báo cáo nhiệm vụ...')}</p>
          </div>
        ) : error || !report ? (
          <div className="p-4 bg-danger-soft border border-danger-border text-danger rounded-xl text-sm">
            {t('mentoring.loadTaskReportError', 'Không thể tải thông tin báo cáo Task. Vui lòng thử lại sau.')}
          </div>
        ) : (() => {
          const mentorSplit = (report.mentorEarnedAmount && report.mentorEarnedAmount > 0)
            ? report.mentorEarnedAmount
            : (report.latestTicket?.mentorAmount ?? 0)
          const studentSplit = (report.studentRefundAmount && report.studentRefundAmount > 0)
            ? report.studentRefundAmount
            : (report.latestTicket?.studentRefund ?? 0)

          let effectiveStudentStatus = report.studentRefundStatus
          if (studentSplit > 0) {
            if (report.latestTicket?.status === 'RESOLVED' || report.studentRefundStatus === 'REFUNDED') {
              effectiveStudentStatus = 'REFUNDED'
            } else if (!effectiveStudentStatus || effectiveStudentStatus === 'NO_REFUND') {
              effectiveStudentStatus = 'PENDING_REFUND'
            }
          }

          let effectiveMentorStatus = report.mentorPayoutStatus
          if (mentorSplit > 0) {
            if (report.latestTicket?.status === 'RESOLVED' || report.mentorPayoutStatus === 'PAID') {
              effectiveMentorStatus = 'PAID'
            } else if (!effectiveMentorStatus || effectiveMentorStatus === 'CANCELLED') {
              effectiveMentorStatus = 'PENDING_ESCROW'
            }
          }

          return (
          <>
            {/* Task Title & Status Banner */}
            <div className="p-4 bg-surface-2 rounded-xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-text-subtle">
                  {t('mentoring.mentoringTask', 'Nhiệm vụ Mentoring')}
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
                      {t('mentoring.disputeUnderArbitration', 'Nhiệm vụ đang trong quá trình phân xử tranh chấp')}
                    </p>
                    {(report.activeTicket?.ticketCode || report.latestTicket?.ticketCode) && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold bg-danger text-white">
                        {report.activeTicket?.ticketCode || report.latestTicket?.ticketCode}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/80">
                    {report.activeTicket?.disputeReason || report.latestTicket?.disputeReason || t('mentoring.disputeArbitrationDesc', {
                      code: report.activeTicket?.ticketCode || report.latestTicket?.ticketCode || 'N/A'
                    })}
                  </p>
                  <p className="font-semibold text-danger">
                    Toàn bộ tiền trong quỹ Escrow đang được tạm khóa để bảo vệ hai bên.
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
                          ? 'Phán quyết: Chi trả toàn bộ thù lao cho Mentor'
                          : report.resolutionDecision === 'FULL_STUDENT_REFUND'
                          ? 'Phán quyết: Hoàn trả toàn bộ học phí cho Học viên'
                          : 'Kết quả giải quyết: Hòa giải phân chia quỹ thỏa thuận'}
                      </p>
                      {report.latestTicket?.ticketCode && (
                        <span className="text-xs text-text-subtle font-mono">
                          Mã ticket liên quan: {report.latestTicket.ticketCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 font-bold rounded bg-success text-white">
                    Đã thực thi
                  </span>
                </div>

                {(report.resolutionNote || report.latestTicket?.resolutionNote) && (
                  <p className="text-xs text-text-muted bg-surface/70 p-2.5 rounded-lg border border-border">
                    <strong>Căn cứ / Lý do phán quyết:</strong> {report.resolutionNote || report.latestTicket?.resolutionNote}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-text-subtle block">Mentor nhận:</span>
                    <span className="font-bold text-sm text-success">{formatVnd(mentorSplit)}</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg border border-border">
                    <span className="text-text-subtle block">Học viên nhận hoàn:</span>
                    <span className="font-bold text-sm text-info">{formatVnd(studentSplit)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Settlement Banner if Settlement Proposal */}
            {report.activeTicket && report.activeTicket.ticketType === 'SETTLEMENT' && (
              <div className="p-4 bg-info-soft border border-info rounded-xl flex items-start gap-3 text-xs text-info">
                <Scale className="w-5 h-5 shrink-0 mt-0.5 text-info" />
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {t('mentoring.stoppedBySettlement', { code: report.activeTicket.ticketCode })}
                  </p>
                  <p className="text-foreground/80">
                    {t('mentoring.settlementAgreedDesc', {
                      mentorAmt: formatVnd(report.activeTicket.mentorAmount),
                      studentRefund: formatVnd(report.activeTicket.studentRefund)
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Section 1: Cam kết & Thời hạn */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-info" />
                {t('mentoring.sectionAgreedTerms', '1. Cam kết thỏa thuận & Thời hạn')}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-text-subtle block text-xs">{t('mentoring.initialDeadline', 'Hạn chót ban đầu')}</span>
                  <span className="font-semibold text-text">
                    {formatDt(report.originalDeadline)}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-text-subtle block text-xs">{t('mentoring.finalDeadline', 'Hạn chót cuối cùng')}</span>
                  <span className="font-semibold text-text">
                    {formatDt(report.finalDeadline)}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-text-subtle block text-xs">{t('mentoring.extensionCount', 'Số lần gia hạn')}</span>
                  <span className="font-semibold text-text">
                    {t('mentoring.extensionTimes', { count: report.extensionCount })} {report.totalExtensionDays > 0 ? t('mentoring.extensionExtraDays', { days: report.totalExtensionDays }) : ''}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-border">
                  <span className="text-text-subtle block text-xs">{t('mentoring.executionDuration', 'Thời gian thực hiện')}</span>
                  <span className="font-semibold text-text">
                    {report.durationDays != null ? t('mentoring.durationDays', { days: report.durationDays }) : t('mentoring.notFinishedYet', 'Chưa kết thúc')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Tiến độ & Kết quả bàn giao */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                <Award className="w-4 h-4 text-success" />
                {t('mentoring.sectionProgressAndDeliverables', '2. Tiến độ thực hiện & Bàn giao kết quả')}
              </h5>
              <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    {t('mentoring.confirmedWorkLogsRatio', { confirmed: report.confirmedWorkLogs, total: report.totalWorkLogs })}
                  </span>
                  <span className="font-bold text-primary-600 dark:text-primary-400">
                    {t('mentoring.percentCompleted', { percent: Math.round(report.progressPercentage) })}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-surface-3 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-success h-2 rounded-full transition duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                  />
                </div>

                {/* Deliverable details if available (UC110) */}
                {report.completionSummary ? (
                  <div className="pt-2 border-t border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text">
                        {t('mentoring.finalDeliverable', 'Sản phẩm bàn giao cuối cùng:')}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-success-soft text-success font-medium">
                        {report.completionSummary.status}
                      </span>
                    </div>
                    <p className="text-text-muted">
                      {report.completionSummary.finalSummary || t('mentoring.submittedAllDeliverables', 'Đã nộp đầy đủ sản phẩm theo cam kết.')}
                    </p>
                    {report.completionSummary.deliverables && (
                      <p className="text-text-muted">
                        <strong>{t('mentoring.deliverablesContent', 'Nội dung:')}</strong> {report.completionSummary.deliverables}
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
                            <ExternalLink className="w-3 h-3" /> {t('mentoring.attachedFileIndex', { index: i + 1 })}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border text-xs text-text-subtle">
                    {t('mentoring.noFinalReportSubmitted', 'Chưa có biên bản nộp sản phẩm hoàn thành chính thức.')}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Báo cáo Tài chính & Dòng tiền */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-info" />
                {t('mentoring.sectionFinanceAndPayment', '3. Báo cáo tài chính & Trạng thái thanh toán')}
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student View Card */}
                <div className={`p-4 rounded-xl border transition ${
                  isStudent
                    ? 'bg-info-soft border-info ring-2 ring-info'
                    : 'bg-surface border-border'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                    <span className="font-bold text-xs text-info">
                      {t('mentoring.forStudent', 'Dành cho Học viên (Student)')}
                    </span>
                    {isStudent && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-info-soft text-info font-bold">
                        {t('mentoring.yourRole', 'Vai trò của bạn')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-text-subtle">{t('mentoring.originalAgreedPrice', 'Giá thỏa thuận gốc:')}</span>
                      <span className="font-medium text-text">
                        {formatVnd(report.originalPrice)}
                      </span>
                    </div>
                    {report.totalAdditionalAmount > 0 && (
                      <div className="flex justify-between text-warning">
                        <span>{t('mentoring.taskAmendmentAddition', 'Bổ sung điều chỉnh Task:')}</span>
                        <span className="font-medium">
                          +{formatVnd(report.totalAdditionalAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                      <span>{t('mentoring.totalPaidAmount', 'Tổng tiền đã thanh toán:')}</span>
                      <span className="text-info">
                        {formatVnd(report.studentTotalPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 text-text-muted">
                      <span>{t('mentoring.refundAmount', 'Khoản hoàn tiền (Refund):')}</span>
                      <span className={`font-bold ${studentSplit > 0 ? 'text-info' : 'text-text'}`}>
                        {formatVnd(studentSplit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-text-subtle">{t('mentoring.refundStatus', 'Trạng thái hoàn tiền:')}</span>
                      {getMoneyStatusBadge(effectiveStudentStatus)}
                    </div>
                  </div>
                </div>

                {/* Mentor View Card */}
                <div className={`p-4 rounded-xl border transition ${
                  isMentor
                    ? 'bg-info-soft border-info ring-2 ring-info'
                    : 'bg-surface border-border'
                }`}>
                  <div className="flex items-center justify-between pb-2 border-b border-border mb-3">
                    <span className="font-bold text-xs text-info">
                      {t('mentoring.forMentor', 'Dành cho Cố vấn (Mentor)')}
                    </span>
                    {isMentor && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-info-soft text-info font-bold">
                        {t('mentoring.yourRole', 'Vai trò của bạn')}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-border">
                      <span>{t('mentoring.netRemuneration', 'Thù lao thực nhận:')}</span>
                      <span className="text-success">
                        {formatVnd(mentorSplit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1">
                      <span className="text-text-subtle">{t('mentoring.payoutStatus', 'Trạng thái chi trả:')}</span>
                      {getMoneyStatusBadge(effectiveMentorStatus)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ping Admin Action Banner if canPingAdminFinance */}
              {report.canPingAdminFinance !== false && (
                <div className="p-4 bg-danger-soft/60 border border-danger/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-danger flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                      Sự cố hoàn tiền hoặc sai lệch số tiền?
                    </p>
                    <p className="text-text-muted">
                      Nếu tiền hoàn chưa về tài khoản, chưa nhận được thù lao Mentor hoặc số tiền sai lệch, bấm nút để gửi cảnh báo Ban Quản Trị đối soát.
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
                    Báo cáo sự cố / Ping Admin
                  </Button>
                </div>
              )}

              {/* Escrow Guarantee Notice */}
              <div className="p-3 bg-surface-2 rounded-xl border border-cream-300/80 dark:border-white/10 flex items-start gap-2.5 text-xs text-text-subtle">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>
                  {report.platformFeeNote || t('mentoring.escrowGuaranteeNotice', 'Khoản thanh toán được bảo chứng 100% qua cơ chế Escrow của AlumNect, chỉ được giải ngân khi hoàn thành hoặc có phán quyết Ban Quản Trị.')}
                </span>
              </div>
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
              <h4 className="font-bold text-base text-text">Báo cáo sự cố dòng tiền</h4>
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
            Gửi phản ánh tới Ban Quản Trị để đối soát sổ quỹ và xử lý lại giao dịch hoàn tiền hoặc thù lao cho Task #{taskId}.
          </p>

          <div className="space-y-2">
            <span className="text-xs font-bold text-text-subtle uppercase">Chọn nhanh lý do</span>
            <div className="space-y-1.5">
              {[
                'Chưa nhận được tiền hoàn trả về tài khoản',
                'Số tiền hoàn / chi trả bị sai lệch',
                'Chưa nhận được thù lao Mentor sau khi Task hoàn thành',
                'Tài khoản nhận tiền báo lỗi giao dịch',
              ].map((reasonText) => {
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
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition cursor-pointer ${
                      isSelected
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
            <span className="text-xs font-bold text-text-subtle uppercase">Mô tả cụ thể</span>
            <textarea
              rows={3}
              value={pingReason}
              onChange={(e) => setPingReason(e.target.value)}
              placeholder="Chi tiết về thời gian kiểm tra tài khoản, số tiền chưa nhận được..."
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
              Hủy
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Gửi phản ánh
                </>
              )}
            </Button>
          </div>
        </DialogFrame>
      )}

      {/* Footer */}
      <div className="px-6 py-3.5 bg-surface-2 border-t border-border flex items-center justify-between">
        <p className="text-xs text-text-subtle">
          {t('mentoring.reportDataSyncNotice', 'Dữ liệu báo cáo được cập nhật tự động từ hệ thống sổ giao dịch AlumNect.')}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="text-xs px-4 py-1.5"
        >
          {t('common.close', 'Đóng')}
        </Button>
      </div>
    </DialogFrame>
  )
}
