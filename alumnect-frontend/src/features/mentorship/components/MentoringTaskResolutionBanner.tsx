import { useState } from 'react'
import {
  CalendarClock,
  FileEdit,
  Scale,
  Check,
  X,
  Loader2,
  AlertCircle,
  CreditCard,
  ArrowRight,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { format, parseISO } from 'date-fns'
import type {
  MentoringTaskDeadlineExtension,
  MentoringTaskAmendment,
  MentoringTaskSettlementProposal,
  MentoringTaskCompletion,
  MentoringTaskStatus,
  MentoringDisputeTicket,
} from '../model/mentoringTaskTypes'
import {
  useRespondDeadlineExtension,
  useRespondTaskAmendment,
  useRespondSettlementProposal,
} from '../hooks/useMentoringTaskResolutions'

interface MentoringTaskResolutionBannerProps {
  taskId: number
  activeExtension?: MentoringTaskDeadlineExtension | null
  activeAmendment?: MentoringTaskAmendment | null
  activeSettlementProposal?: MentoringTaskSettlementProposal | null
  latestCompletion?: MentoringTaskCompletion | null
  activeTicket?: MentoringDisputeTicket | null
  taskStatus?: MentoringTaskStatus | string | null
  canConfirmCompletion?: boolean
  canSubmitSettlementTicket?: boolean
  canCreateDisputeTicket?: boolean
  canSubmitDisputeEvidence?: boolean
  isStudent?: boolean
  isMentor?: boolean
  onOpenTopUpPayment?: () => void
  onOpenReviewCompletion?: () => void
  onOpenSubmitSettlementTicket?: () => void
  onOpenCreateDispute?: () => void
  onOpenAddEvidence?: () => void
  onOpenTaskReport?: () => void
  onRefresh?: () => void
}

export function MentoringTaskResolutionBanner({
  taskId,
  activeExtension,
  activeAmendment,
  activeSettlementProposal,
  latestCompletion,
  activeTicket,
  taskStatus,
  canConfirmCompletion,
  canSubmitSettlementTicket,
  canCreateDisputeTicket,
  canSubmitDisputeEvidence: _canSubmitDisputeEvidence,
  isStudent,
  onOpenTopUpPayment,
  onOpenReviewCompletion,
  onOpenSubmitSettlementTicket,
  onOpenCreateDispute,
  onOpenAddEvidence,
  onOpenTaskReport,
  onRefresh,
}: MentoringTaskResolutionBannerProps) {
  const [rejectModal, setRejectModal] = useState<{
    type: 'EXTENSION' | 'AMENDMENT' | 'SETTLEMENT'
    id: number
  } | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const respondExtensionMutation = useRespondDeadlineExtension(taskId)
  const respondAmendmentMutation = useRespondTaskAmendment(taskId)
  const respondSettlementMutation = useRespondSettlementProposal(taskId)

  const formatVnd = (amt?: number) => {
    if (typeof amt !== 'number') return '0đ'
    return new Intl.NumberFormat('vi-VN').format(amt) + 'đ'
  }

  const formatDt = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return format(parseISO(iso), 'dd/MM/yyyy HH:mm')
    } catch {
      return iso
    }
  }

  const handleConfirmExtension = async (ext: MentoringTaskDeadlineExtension) => {
    await respondExtensionMutation.mutateAsync({
      extensionId: ext.id,
      payload: { accept: true },
    })
    onRefresh?.()
  }

  const handleConfirmAmendment = async (amd: MentoringTaskAmendment) => {
    await respondAmendmentMutation.mutateAsync({
      amendmentId: amd.id,
      payload: { accept: true },
    })
    onRefresh?.()
  }

  const handleConfirmSettlement = async (prop: MentoringTaskSettlementProposal) => {
    await respondSettlementMutation.mutateAsync({
      proposalId: prop.id,
      payload: { accept: true },
    })
    onRefresh?.()
  }

  const handleConfirmReject = async () => {
    if (!rejectModal) return
    if (rejectModal.type === 'EXTENSION') {
      await respondExtensionMutation.mutateAsync({
        extensionId: rejectModal.id,
        payload: { accept: false, responseNote: rejectNote.trim() || undefined },
      })
    } else if (rejectModal.type === 'AMENDMENT') {
      await respondAmendmentMutation.mutateAsync({
        amendmentId: rejectModal.id,
        payload: { accept: false, responseNote: rejectNote.trim() || undefined },
      })
    } else if (rejectModal.type === 'SETTLEMENT') {
      await respondSettlementMutation.mutateAsync({
        proposalId: rejectModal.id,
        payload: { accept: false, responseNote: rejectNote.trim() || undefined },
      })
    }
    setRejectModal(null)
    setRejectNote('')
    onRefresh?.()
  }

  const isCompletionPending = taskStatus === 'SUBMITTED' || Boolean(latestCompletion && latestCompletion.status === 'PENDING')
  const isTaskCompleted = taskStatus === 'COMPLETED'

  const hasAnyBanner = Boolean(
    (activeExtension && activeExtension.status === 'PENDING') ||
    (activeAmendment && (activeAmendment.status === 'PENDING' || activeAmendment.status === 'AWAITING_TOPUP')) ||
    (activeSettlementProposal && activeSettlementProposal.status === 'PENDING') ||
    isCompletionPending ||
    isTaskCompleted
  )

  if (!hasAnyBanner) return null

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-md px-4 py-2.5 space-y-2.5 transition-all">
      {/* 0. TASK COMPLETION PENDING BANNER (UC110) */}
      {isCompletionPending && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  {canConfirmCompletion || isStudent
                    ? 'Cố vấn đã nộp kết quả nghiệm thu hoàn thành Task (UC110)'
                    : 'Đã nộp kết quả hoàn thành Task (UC110)'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {canConfirmCompletion || isStudent ? 'Chờ bạn nghiệm thu' : 'Chờ học viên xác nhận'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {latestCompletion?.finalSummary ||
                  'Cố vấn đã hoàn thành công việc và gửi sản phẩm bàn giao.'}
              </p>
            </div>
          </div>
          {(canConfirmCompletion || isStudent) && onOpenReviewCompletion && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                className="h-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                onClick={onOpenReviewCompletion}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Xem & Nghiệm thu
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 0.1 TASK COMPLETED BANNER (UC110) */}
      {isTaskCompleted && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-3 shadow-sm">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-300 font-medium">
            🎉 Nhiệm vụ đã hoàn thành xuất sắc! Hệ thống đã ghi nhận quyết toán thù lao cho Cố vấn.
          </div>
        </div>
      )}

      {/* 1. DEADLINE EXTENSION TICKET BANNER */}
      {activeExtension && activeExtension.status === 'PENDING' && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white shadow-sm shrink-0 mt-0.5">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Đề xuất gia hạn Deadline mới
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  {activeExtension.createdByRole}: {activeExtension.createdByName}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>Hạn chót cũ: <strong className="text-foreground">{formatDt(activeExtension.currentDeadline)}</strong></span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Hạn chót mới: <strong className="text-blue-600 dark:text-blue-400">{formatDt(activeExtension.proposedDeadline)}</strong></span>
              </div>
              <p className="text-xs text-foreground/80 italic">
                &ldquo;{activeExtension.reason}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {activeExtension.canConfirm && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectModal({ type: 'EXTENSION', id: activeExtension.id })}
                  disabled={respondExtensionMutation.isPending}
                  className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmExtension(activeExtension)}
                  disabled={respondExtensionMutation.isPending}
                  className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  {respondExtensionMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Chấp nhận gia hạn
                </Button>
              </>
            )}
            {!activeExtension.canConfirm && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                Đang chờ đối phương phản hồi
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. TASK AMENDMENT TICKET BANNER */}
      {activeAmendment && (activeAmendment.status === 'PENDING' || activeAmendment.status === 'AWAITING_TOPUP') && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shadow-sm shrink-0 mt-0.5">
              <FileEdit className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Ticket điều chỉnh Task (v{activeAmendment.version})
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {activeAmendment.status === 'AWAITING_TOPUP' ? 'Chờ thanh toán top-up' : `${activeAmendment.createdByRole}: ${activeAmendment.createdByName}`}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                {activeAmendment.additionalAmount > 0 && (
                  <span>Bổ sung tiền: <strong className="text-amber-600 dark:text-amber-400 font-bold">{formatVnd(activeAmendment.additionalAmount)}</strong></span>
                )}
                {activeAmendment.newDeadline && (
                  <span>Hạn chót mới: <strong className="text-foreground">{formatDt(activeAmendment.newDeadline)}</strong></span>
                )}
              </div>
              <p className="text-xs text-foreground/80 italic">
                &ldquo;{activeAmendment.reason}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {activeAmendment.status === 'PENDING' && activeAmendment.canConfirm && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectModal({ type: 'AMENDMENT', id: activeAmendment.id })}
                  disabled={respondAmendmentMutation.isPending}
                  className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmAmendment(activeAmendment)}
                  disabled={respondAmendmentMutation.isPending}
                  className="h-8 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  {respondAmendmentMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Chấp nhận điều chỉnh
                </Button>
              </>
            )}

            {activeAmendment.status === 'AWAITING_TOPUP' && isStudent && (
              <Button
                size="sm"
                onClick={onOpenTopUpPayment}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" />
                Thanh toán bổ sung {formatVnd(activeAmendment.additionalAmount)}
              </Button>
            )}

            {activeAmendment.status === 'PENDING' && !activeAmendment.canConfirm && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                Đang chờ đối phương xác nhận
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. SETTLEMENT PROPOSAL BANNER */}
      {activeSettlementProposal && activeSettlementProposal.status === 'PENDING' && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-600 text-white shadow-sm shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Đề xuất dừng Task & Phân chia tiền
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  {activeSettlementProposal.createdByRole}: {activeSettlementProposal.createdByName}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>Mentor nhận: <strong className="text-purple-600 dark:text-purple-400 font-bold">{formatVnd(activeSettlementProposal.mentorAmount)}</strong></span>
                <span>•</span>
                <span>Học viên hoàn lại: <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatVnd(activeSettlementProposal.studentRefund)}</strong></span>
              </div>
              <p className="text-xs text-foreground/80 italic">
                &ldquo;{activeSettlementProposal.reason}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {activeSettlementProposal.canAccept && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectModal({ type: 'SETTLEMENT', id: activeSettlementProposal.id })}
                  disabled={respondSettlementMutation.isPending}
                  className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Từ chối
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleConfirmSettlement(activeSettlementProposal)}
                  disabled={respondSettlementMutation.isPending}
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {respondSettlementMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1" />
                  )}
                  Đồng ý phân chia
                </Button>
              </>
            )}
            {!activeSettlementProposal.canAccept && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground font-medium">
                Đang chờ đối phương đồng thuận
              </span>
            )}
            {canCreateDisputeTicket && onOpenCreateDispute && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onOpenCreateDispute}
                className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-destructive" />
                Khiếu nại
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 3.1. SETTLEMENT PROPOSAL ACCEPTED - READY TO SUBMIT TICKET BANNER (UC111) */}
      {(canSubmitSettlementTicket || (activeSettlementProposal && activeSettlementProposal.status === 'ACCEPTED')) && !activeTicket && (
        <div className="rounded-xl border border-purple-500/40 bg-purple-500/15 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-sm shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Thỏa thuận dừng Task đã được hai bên đồng thuận!
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  Đã chốt phân chia
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                <span>Mentor nhận: <strong className="text-purple-600 dark:text-purple-400 font-bold">{formatVnd(activeSettlementProposal?.mentorAmount)}</strong></span>
                <span>•</span>
                <span>Học viên hoàn lại: <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatVnd(activeSettlementProposal?.studentRefund)}</strong></span>
              </div>
              <p className="text-xs text-foreground/80">
                Bước tiếp theo: Gửi Settlement Ticket để Ban Quản Trị đối soát và giải ngân theo thỏa thuận (UC111).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <Button
              size="sm"
              onClick={onOpenSubmitSettlementTicket}
              className="h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm"
            >
              <ArrowRight className="w-4 h-4 mr-1.5" />
              Gửi Settlement Ticket tới Admin
            </Button>
          </div>
        </div>
      )}

      {/* 3.2. ACTIVE TICKET IN PROGRESS BANNER (UC111 & UC112) */}
      {activeTicket && activeTicket.ticketType === 'DISPUTE' && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-destructive text-white shadow-sm shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Khiếu nại tranh chấp #{activeTicket.ticketCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-destructive/20 text-destructive border border-destructive/30">
                  {activeTicket.status === 'OPEN'
                    ? 'Đang chờ Admin tiếp nhận'
                    : activeTicket.status === 'IN_REVIEW'
                    ? 'Admin đang thụ lý giải quyết'
                    : activeTicket.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                {activeTicket.disputeReason && (
                  <span>Lý do: <strong className="text-foreground">{activeTicket.disputeReason}</strong></span>
                )}
                {activeTicket.desiredSolution && (
                  <>
                    <span>•</span>
                    <span>Phương án mong muốn: <strong className="text-destructive font-medium">{activeTicket.desiredSolution}</strong></span>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground/80 italic">
                Nhiệm vụ đang ở trạng thái tranh chấp (DISPUTED). Mọi thao tác hoàn thành và quyết toán tạm thời đóng băng (ON_HOLD).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {onOpenTaskReport && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenTaskReport}
                className="h-8 border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                Báo cáo Task
              </Button>
            )}
            {onOpenAddEvidence && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenAddEvidence}
                className="h-8 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-semibold shadow-xs"
              >
                <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                Bằng chứng tranh chấp
              </Button>
            )}
            <span className="text-xs px-3 py-1.5 rounded-lg bg-destructive/15 text-destructive font-bold border border-destructive/30">
              Đang phân xử
            </span>
          </div>
        </div>
      )}

      {activeTicket && activeTicket.ticketType === 'SETTLEMENT' && (
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0 mt-0.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  Settlement Ticket #{activeTicket.ticketCode} (Giải ngân theo thỏa thuận)
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                  {activeTicket.status === 'OPEN'
                    ? 'Đang chờ Admin tiếp nhận'
                    : activeTicket.status === 'IN_REVIEW'
                    ? 'Admin đang thụ lý xử lý'
                    : activeTicket.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                {activeTicket.mentorAmount != null && (
                  <span>Giải ngân Mentor: <strong className="text-purple-600 dark:text-purple-400 font-bold">{formatVnd(activeTicket.mentorAmount)}</strong></span>
                )}
                {activeTicket.studentRefund != null && (
                  <>
                    <span>•</span>
                    <span>Hoàn tiền Học viên: <strong className="text-blue-600 dark:text-blue-400 font-bold">{formatVnd(activeTicket.studentRefund)}</strong></span>
                  </>
                )}
              </div>
              <p className="text-xs text-foreground/80 italic">
                Nhiệm vụ đã dừng. Ban Quản Trị đang tiến hành xử lý vé theo biên bản thỏa thuận.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {onOpenTaskReport && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenTaskReport}
                className="h-8 border-slate-300 dark:border-slate-700 text-xs font-semibold shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                Báo cáo Task
              </Button>
            )}
            {onOpenAddEvidence && (
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenAddEvidence}
                className="h-8 border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-xs font-semibold shadow-xs"
              >
                <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                Chứng từ & Bằng chứng
              </Button>
            )}
            <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold border border-blue-500/20">
              Đang giải quyết
            </span>
          </div>
        </div>
      )}

      {/* COMPLETED BANNER (UC114) */}
      {taskStatus === 'COMPLETED' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-sm text-foreground">
                Nhiệm vụ đã hoàn thành thành công
              </span>
              <p className="text-xs text-muted-foreground">
                Kết quả công việc đã được nghiệm thu và tiền đã được giải ngân theo thỏa thuận.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            {onOpenTaskReport && (
              <Button
                size="sm"
                onClick={onOpenTaskReport}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" />
                Xem Báo cáo Task & Thanh toán (UC114)
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h4 className="font-bold text-base text-foreground flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Xác nhận từ chối đề xuất
            </h4>
            <p className="text-xs text-muted-foreground">
              Vui lòng nhập lý do từ chối để đối phương nắm thông tin và tiếp tục trao đổi.
            </p>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 focus:border-destructive resize-none"
            />
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setRejectModal(null); setRejectNote('') }}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                className="h-8 bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleConfirmReject}
                disabled={respondExtensionMutation.isPending || respondAmendmentMutation.isPending || respondSettlementMutation.isPending}
              >
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
