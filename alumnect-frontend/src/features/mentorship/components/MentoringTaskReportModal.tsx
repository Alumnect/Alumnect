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
} from 'lucide-react'
import { Button } from '@/components/ui'
import { useTaskReport } from '../hooks/useMentoringTasks'

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
  const { data: report, isLoading, error } = useTaskReport(taskId, isOpen)

  if (!isOpen) return null

  const formatVnd = (amt?: number | null) => {
    if (typeof amt !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + 'đ'
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return 'Chưa xác định'
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành thành công
          </span>
        )
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive/15 text-destructive border border-destructive/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Đang có tranh chấp (DISPUTED)
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <X className="w-3.5 h-3.5" /> Đã dừng nhiệm vụ
          </span>
        )
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" /> Chờ nghiệm thu bàn giao
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> Đang triển khai ({status || 'IN_PROGRESS'})
          </span>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Báo cáo kết quả Task & Trạng thái thanh toán
                </h3>
                <span className="text-xs px-2 py-0.5 font-mono font-medium rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
                  Task #{taskId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                UC114 — Báo cáo tổng hợp tiến độ, kết quả bàn giao và đối soát tài chính
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-primary-500 mb-3" />
              <p className="text-sm">Đang tải dữ liệu báo cáo nhiệm vụ...</p>
            </div>
          ) : error || !report ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl text-sm">
              Không thể tải thông tin báo cáo Task. Vui lòng thử lại sau.
            </div>
          ) : (
            <>
              {/* Task Title & Status Banner */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nhiệm vụ Mentoring
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    {report.taskTitle}
                  </h4>
                  {report.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {report.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0">{getStatusBadge(report.taskStatus)}</div>
              </div>

              {/* Dispute Alert Banner if Disputed */}
              {report.isDisputed && (
                <div className="p-4 bg-destructive/10 border border-destructive/40 rounded-xl flex items-start gap-3 text-xs text-destructive">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      Nhiệm vụ đang trong quá trình phân xử tranh chấp
                    </p>
                    <p className="text-foreground/80">
                      Mã khiếu nại: <strong>{report.activeTicket?.ticketCode || 'N/A'}</strong>. Mọi thao tác giải ngân và quyết toán hiện đang tạm đóng băng (<strong>ON_HOLD</strong>) để bảo đảm quyền lợi đôi bên cho đến khi có phán quyết chính thức từ Ban Quản Trị.
                    </p>
                  </div>
                </div>
              )}

              {/* Settlement Banner if Settlement Proposal */}
              {report.activeTicket && report.activeTicket.ticketType === 'SETTLEMENT' && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                  <Scale className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm">
                      Dừng nhiệm vụ theo thỏa thuận phân chia quỹ (#{report.activeTicket.ticketCode})
                    </p>
                    <p>
                      Cả hai bên đã đồng thuận phương án phân chia: Mentor nhận <strong>{formatVnd(report.activeTicket.mentorAmount)}</strong> và Học viên được hoàn <strong>{formatVnd(report.activeTicket.studentRefund)}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Thỏa thuận & Thời hạn thực hiện */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  1. Cam kết thỏa thuận & Thời hạn
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Hạn chót ban đầu</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatDt(report.originalDeadline)}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Hạn chót cuối cùng</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {formatDt(report.finalDeadline)}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Số lần gia hạn</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {report.extensionCount} lần {report.totalExtensionDays > 0 ? `(+${report.totalExtensionDays} ngày)` : ''}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Thời gian thực hiện</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {report.durationDays != null ? `${report.durationDays} ngày` : 'Chưa kết thúc'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Tiến độ & Kết quả bàn giao */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-500" />
                  2. Tiến độ thực hiện & Bàn giao kết quả
                </h5>
                <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">
                      Nhật ký công việc đã xác nhận: <strong>{report.confirmedWorkLogs}/{report.totalWorkLogs}</strong> buổi
                    </span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                      {Math.round(report.progressPercentage)}% hoàn thành
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, report.progressPercentage))}%` }}
                    />
                  </div>

                  {/* Deliverable details if available (UC110) */}
                  {report.completionSummary ? (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Sản phẩm bàn giao cuối cùng:
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 font-medium">
                          {report.completionSummary.status}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 italic">
                        {report.completionSummary.finalSummary || 'Đã nộp đầy đủ sản phẩm theo cam kết.'}
                      </p>
                      {report.completionSummary.deliverables && (
                        <p className="text-slate-700 dark:text-slate-200">
                          <strong>Nội dung:</strong> {report.completionSummary.deliverables}
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
                              className="inline-flex items-center gap-1 text-primary-600 hover:underline font-medium text-[11px]"
                            >
                              <ExternalLink className="w-3 h-3" /> Tệp đính kèm #{i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-400 italic">
                      Chưa có biên bản nộp sản phẩm hoàn thành chính thức.
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Báo cáo Tài chính & Dòng tiền */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-purple-500" />
                  3. Báo cáo tài chính & Trạng thái thanh toán
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Student View Card */}
                  <div className={`p-4 rounded-xl border transition ${
                    isStudent
                      ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 mb-3">
                      <span className="font-bold text-xs uppercase tracking-wide text-blue-700 dark:text-blue-400">
                        Dành cho Học viên (Student)
                      </span>
                      {isStudent && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold">
                          Vai trò của bạn
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Giá thỏa thuận gốc:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatVnd(report.originalPrice)}
                        </span>
                      </div>
                      {report.totalAdditionalAmount > 0 && (
                        <div className="flex justify-between text-amber-600 dark:text-amber-400">
                          <span>Bổ sung điều chỉnh Task:</span>
                          <span className="font-medium">
                            +{formatVnd(report.totalAdditionalAmount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span>Tổng tiền đã thanh toán:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formatVnd(report.studentTotalPaid)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 text-slate-700 dark:text-slate-300">
                        <span>Khoản hoàn tiền (Refund):</span>
                        <span className={`font-bold ${report.studentRefundAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                          {formatVnd(report.studentRefundAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span className="text-slate-400">Trạng thái hoàn tiền:</span>
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {report.studentRefundStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mentor View Card */}
                  <div className={`p-4 rounded-xl border transition ${
                    isMentor
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900 ring-2 ring-purple-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 mb-3">
                      <span className="font-bold text-xs uppercase tracking-wide text-purple-700 dark:text-purple-400">
                        Dành cho Cố vấn (Mentor)
                      </span>
                      {isMentor && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-bold">
                          Vai trò của bạn
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Thù lao thỏa thuận:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatVnd(report.totalAgreedPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Phí nền tảng AlumNect (0%):</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          -0đ (Miễn phí)
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <span>Thù lao thực nhận (Net):</span>
                        <span className="text-purple-600 dark:text-purple-400">
                          {formatVnd(report.mentorNetPayout)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1">
                        <span className="text-slate-400">Trạng thái giải ngân:</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          report.mentorPayoutStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : report.mentorPayoutStatus === 'ON_HOLD'
                            ? 'bg-destructive/20 text-destructive'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}>
                          {report.mentorPayoutStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escrow Guarantee Notice */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-2.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    {report.platformFeeNote || 'Khoản thanh toán được bảo chứng 100% qua cơ chế Escrow của AlumNect, chỉ được giải ngân khi hoàn thành hoặc có phán quyết Ban Quản Trị.'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Dữ liệu báo cáo được cập nhật tự động từ hệ thống sổ giao dịch AlumNect.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs px-4 py-1.5"
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  )
}
