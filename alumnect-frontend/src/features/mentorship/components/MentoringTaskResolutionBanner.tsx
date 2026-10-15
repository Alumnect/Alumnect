import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CreditCard,
  FileCheck,
  FileEdit,
  FileText,
  MessageSquare,
  Paperclip,
  Scale,
  Undo2,
  X,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Modal, toast } from '@/components/ui'
import type {
  MentoringDisputeTicket,
  MentoringTaskAmendment,
  MentoringTaskCompletion,
  MentoringTaskDeadlineExtension,
  MentoringTaskSettlementProposal,
  MentoringTaskStatus,
} from '../model/mentoringTaskTypes'
import {
  useCloseTaskProposal,
  useRespondDeadlineExtension,
  useRespondSettlementProposal,
  useRespondTaskAmendment,
} from '../hooks/useMentoringTaskResolutions'
import { MentoringActionButton, MentoringActionCard } from './MentoringUi'

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
  onOpenTicketDiscussion?: () => void
  onRefresh?: () => void
}

type ProposalKind = 'EXTENSION' | 'AMENDMENT' | 'SETTLEMENT'
type DialogState = { action: 'REJECT' | 'CANCEL' | 'DECLINE_TOPUP'; kind: ProposalKind; id: number }

const KIND_LABEL: Record<ProposalKind, string> = {
  EXTENSION: 'đề xuất gia hạn',
  AMENDMENT: 'đề xuất điều chỉnh',
  SETTLEMENT: 'đề xuất dừng Task',
}

function formatVnd(amount?: number | null) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount ?? 0)) + 'đ'
}

function formatDt(iso?: string | null) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'HH:mm dd/MM/yyyy')
  } catch {
    return iso
  }
}

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback
}

/** Một dòng thông tin "nhãn: giá trị" trong thẻ đề xuất. */
function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span>
      <span className="text-plum-500 dark:text-plum-400">{label}: </span>
      <span className="font-semibold text-plum-800 dark:text-[#e4e6eb]">{children}</span>
    </span>
  )
}

function WaitingNote({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-plum-500 dark:text-plum-400">{children}</span>
}

/**
 * Danh sách việc cần xử lý của Task trong Chat for Task: nghiệm thu, đề xuất gia hạn / điều chỉnh / dừng Task,
 * thanh toán bổ sung và Ticket đang được Ban Quản Trị xử lý. Quyền thao tác lấy từ backend (canConfirm, canCancel...).
 */
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
  isStudent,
  onOpenTopUpPayment,
  onOpenReviewCompletion,
  onOpenSubmitSettlementTicket,
  onOpenAddEvidence,
  onOpenTaskReport,
  onOpenTicketDiscussion,
  onRefresh,
}: MentoringTaskResolutionBannerProps) {
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [note, setNote] = useState('')

  const respondExtension = useRespondDeadlineExtension(taskId)
  const respondAmendment = useRespondTaskAmendment(taskId)
  const respondSettlement = useRespondSettlementProposal(taskId)
  const closeProposal = useCloseTaskProposal(taskId)
  const isBusy = respondExtension.isPending || respondAmendment.isPending || respondSettlement.isPending || closeProposal.isPending

  const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
    try {
      await action()
      toast.success(success)
      onRefresh?.()
    } catch (err) {
      toast.error(errorMessage(err, fallback))
    }
  }

  const accept = (kind: ProposalKind, id: number) => {
    if (kind === 'EXTENSION') {
      return run(() => respondExtension.mutateAsync({ extensionId: id, payload: { accept: true } }), 'Đã chấp nhận gia hạn.', 'Không thể chấp nhận gia hạn.')
    }
    if (kind === 'AMENDMENT') {
      return run(() => respondAmendment.mutateAsync({ amendmentId: id, payload: { accept: true } }), 'Đã chấp nhận điều chỉnh.', 'Không thể chấp nhận điều chỉnh.')
    }
    return run(() => respondSettlement.mutateAsync({ proposalId: id, payload: { accept: true } }), 'Đã đồng ý dừng Task. Hồ sơ đã được gửi Ban Quản Trị.', 'Không thể đồng ý đề xuất.')
  }

  const closeDialog = () => {
    setDialog(null)
    setNote('')
  }

  const submitDialog = async () => {
    if (!dialog) return
    const reason = note.trim() || undefined
    const { action, kind, id } = dialog
    if (action === 'REJECT') {
      const payload = { accept: false, responseNote: reason }
      await run(
        () =>
          kind === 'EXTENSION'
            ? respondExtension.mutateAsync({ extensionId: id, payload })
            : kind === 'AMENDMENT'
              ? respondAmendment.mutateAsync({ amendmentId: id, payload })
              : respondSettlement.mutateAsync({ proposalId: id, payload }),
        `Đã từ chối ${KIND_LABEL[kind]}.`,
        'Không thể từ chối đề xuất.',
      )
    } else {
      await run(
        () => closeProposal.mutateAsync({ kind, id, reason }),
        action === 'DECLINE_TOPUP' ? 'Đã từ chối thanh toán bổ sung.' : `Đã hủy ${KIND_LABEL[kind]}.`,
        'Không thể hủy đề xuất.',
      )
    }
    closeDialog()
  }

  const items: ReactNode[] = []

  // 1. Kết quả hoàn thành chờ nghiệm thu
  const isCompletionPending = taskStatus === 'SUBMITTED' || latestCompletion?.status === 'PENDING'
  if (isCompletionPending) {
    const canReview = Boolean(canConfirmCompletion && onOpenReviewCompletion)
    items.push(
      <MentoringActionCard
        key="completion"
        tone="mint"
        icon={<FileCheck />}
        title="Mentor đã nộp kết quả hoàn thành"
        badge={canReview ? 'Chờ bạn nghiệm thu' : 'Chờ Học viên nghiệm thu'}
        actions={
          canReview ? (
            <MentoringActionButton intent="primary" icon={<Check className="h-3.5 w-3.5" />} onClick={onOpenReviewCompletion}>
              Xem & nghiệm thu
            </MentoringActionButton>
          ) : undefined
        }
      >
        {latestCompletion?.finalSummary && <p className="line-clamp-2">{latestCompletion.finalSummary}</p>}
      </MentoringActionCard>,
    )
  }

  // 2. Đề xuất gia hạn deadline
  if (activeExtension?.status === 'PENDING') {
    const ext = activeExtension
    items.push(
      <MentoringActionCard
        key="extension"
        tone="navy"
        icon={<CalendarClock />}
        title="Đề xuất gia hạn deadline"
        badge={`Từ ${ext.createdByRole}`}
        actions={
          ext.canConfirm || ext.canReject ? (
            <>
              <MentoringActionButton intent="danger" icon={<X className="h-3.5 w-3.5" />} disabled={isBusy}
                onClick={() => setDialog({ action: 'REJECT', kind: 'EXTENSION', id: ext.id })}>
                Từ chối
              </MentoringActionButton>
              <MentoringActionButton intent="primary" icon={<Check className="h-3.5 w-3.5" />} loading={respondExtension.isPending}
                disabled={isBusy} onClick={() => accept('EXTENSION', ext.id)}>
                Chấp nhận
              </MentoringActionButton>
            </>
          ) : (
            <>
              <WaitingNote>Chờ Học viên phản hồi</WaitingNote>
              {ext.canCancel && (
                <MentoringActionButton intent="ghost" icon={<Undo2 className="h-3.5 w-3.5" />} disabled={isBusy}
                  onClick={() => setDialog({ action: 'CANCEL', kind: 'EXTENSION', id: ext.id })}>
                  Hủy đề xuất
                </MentoringActionButton>
              )}
            </>
          )
        }
      >
        <p className="flex flex-wrap items-center gap-1.5">
          <span className="text-plum-500">{formatDt(ext.currentDeadline)}</span>
          <ArrowRight className="h-3.5 w-3.5 text-plum-400" />
          <span className="font-bold text-violet-500 dark:text-violet-300">{formatDt(ext.proposedDeadline)}</span>
        </p>
        {ext.reason && <p className="italic">“{ext.reason}”</p>}
      </MentoringActionCard>,
    )
  }

  // 3. Đề xuất điều chỉnh (chờ phản hồi hoặc chờ thanh toán bổ sung)
  if (activeAmendment && (activeAmendment.status === 'PENDING' || activeAmendment.status === 'AWAITING_TOPUP')) {
    const amd = activeAmendment
    const awaitingTopUp = amd.status === 'AWAITING_TOPUP'
    let actions: ReactNode
    if (awaitingTopUp && amd.canTopUp) {
      actions = (
        <>
          {amd.canDeclineTopUp && (
            <MentoringActionButton intent="danger" icon={<X className="h-3.5 w-3.5" />} disabled={isBusy}
              onClick={() => setDialog({ action: 'DECLINE_TOPUP', kind: 'AMENDMENT', id: amd.id })}>
              Từ chối thanh toán
            </MentoringActionButton>
          )}
          <MentoringActionButton intent="primary" icon={<CreditCard className="h-3.5 w-3.5" />} disabled={isBusy} onClick={onOpenTopUpPayment}>
            Thanh toán {formatVnd(amd.additionalAmount)}
          </MentoringActionButton>
        </>
      )
    } else if (!awaitingTopUp && (amd.canConfirm || amd.canReject)) {
      actions = (
        <>
          <MentoringActionButton intent="danger" icon={<X className="h-3.5 w-3.5" />} disabled={isBusy}
            onClick={() => setDialog({ action: 'REJECT', kind: 'AMENDMENT', id: amd.id })}>
            Từ chối
          </MentoringActionButton>
          <MentoringActionButton intent="primary" icon={<Check className="h-3.5 w-3.5" />} loading={respondAmendment.isPending}
            disabled={isBusy} onClick={() => accept('AMENDMENT', amd.id)}>
            Chấp nhận
          </MentoringActionButton>
        </>
      )
    } else {
      actions = (
        <>
          <WaitingNote>{awaitingTopUp ? 'Chờ Học viên thanh toán' : 'Chờ Học viên phản hồi'}</WaitingNote>
          {amd.canCancel && (
            <MentoringActionButton intent="ghost" icon={<Undo2 className="h-3.5 w-3.5" />} disabled={isBusy}
              onClick={() => setDialog({ action: 'CANCEL', kind: 'AMENDMENT', id: amd.id })}>
              Hủy đề xuất
            </MentoringActionButton>
          )}
        </>
      )
    }
    const scopeChanged = Boolean(amd.newScope && amd.newScope !== amd.previousScope)
    const deadlineChanged = Boolean(amd.newDeadline && amd.newDeadline !== amd.previousDeadline)
    items.push(
      <MentoringActionCard
        key="amendment"
        tone="gold"
        icon={<FileEdit />}
        title={`Đề xuất điều chỉnh Task (v${amd.version})`}
        badge={awaitingTopUp ? 'Đã chấp nhận · chờ thanh toán' : `Từ ${amd.createdByRole}`}
        actions={actions}
      >
        {(amd.additionalAmount > 0 || deadlineChanged) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {amd.additionalAmount > 0 && <Detail label="Tiền bổ sung">{formatVnd(amd.additionalAmount)}</Detail>}
            {deadlineChanged && <Detail label="Deadline mới">{formatDt(amd.newDeadline)}</Detail>}
          </p>
        )}
        {scopeChanged && <p className="line-clamp-2">Phạm vi mới: {amd.newScope}</p>}
        {amd.reason && <p className="italic">“{amd.reason}”</p>}
      </MentoringActionCard>,
    )
  }

  // 4. Đề xuất dừng Task & chia quỹ
  if (activeSettlementProposal?.status === 'PENDING') {
    const prop = activeSettlementProposal
    const needsRefundAccount = Boolean(prop.refundAccountRequired)
    items.push(
      <MentoringActionCard
        key="settlement"
        tone="coral"
        icon={<Scale />}
        title="Đề xuất dừng Task & chia quỹ"
        badge={`Từ ${prop.createdByRole}`}
        actions={
          prop.canAccept || prop.canReject ? (
            <>
              <MentoringActionButton intent="danger" icon={<X className="h-3.5 w-3.5" />} disabled={isBusy}
                onClick={() => setDialog({ action: 'REJECT', kind: 'SETTLEMENT', id: prop.id })}>
                Từ chối
              </MentoringActionButton>
              <MentoringActionButton intent="primary" icon={<Check className="h-3.5 w-3.5" />} loading={respondSettlement.isPending}
                disabled={isBusy || needsRefundAccount}
                title={needsRefundAccount ? 'Cần khai báo tài khoản nhận hoàn tiền trước' : undefined}
                onClick={() => accept('SETTLEMENT', prop.id)}>
                Đồng ý
              </MentoringActionButton>
            </>
          ) : (
            <>
              <WaitingNote>Chờ bên kia phản hồi</WaitingNote>
              {prop.canCancel && (
                <MentoringActionButton intent="ghost" icon={<Undo2 className="h-3.5 w-3.5" />} disabled={isBusy}
                  onClick={() => setDialog({ action: 'CANCEL', kind: 'SETTLEMENT', id: prop.id })}>
                  Hủy đề xuất
                </MentoringActionButton>
              )}
            </>
          )
        }
      >
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Detail label="Mentor nhận">{formatVnd(prop.mentorAmount)}</Detail>
          <Detail label="Hoàn Học viên">{formatVnd(prop.studentRefund)}</Detail>
        </p>
        {prop.reason && <p className="italic">“{prop.reason}”</p>}
        {needsRefundAccount && (
          <p className="font-semibold text-coral-700 dark:text-coral-300">
            Bạn cần khai báo tài khoản nhận hoàn tiền trước khi đồng ý.{' '}
            <Link to="/app/mentoring/refunds" className="underline">Khai báo ngay</Link>
          </p>
        )}
      </MentoringActionCard>,
    )
  }

  // 5. Thỏa thuận đã chốt nhưng chưa có Ticket (dữ liệu cũ, trước khi Ticket được gửi tự động)
  if ((canSubmitSettlementTicket || activeSettlementProposal?.status === 'ACCEPTED') && !activeTicket) {
    items.push(
      <MentoringActionCard
        key="settlement-ready"
        tone="coral"
        icon={<Scale />}
        title="Hai bên đã đồng ý dừng Task"
        badge="Cần gửi Ban Quản Trị"
        actions={
          <MentoringActionButton intent="primary" icon={<ArrowRight className="h-3.5 w-3.5" />} onClick={onOpenSubmitSettlementTicket}>
            Gửi Ban Quản Trị
          </MentoringActionButton>
        }
      >
        <p>Gửi biên bản thỏa thuận để Ban Quản Trị chi trả cho Mentor và hoàn tiền cho Học viên.</p>
      </MentoringActionCard>,
    )
  }

  // 6. Ticket đang được Ban Quản Trị xử lý (khiếu nại hoặc dừng Task theo thỏa thuận)
  if (activeTicket) {
    const isDispute = activeTicket.ticketType === 'DISPUTE'
    const statusLabel =
      activeTicket.status === 'OPEN' ? 'Chờ tiếp nhận' : activeTicket.status === 'IN_REVIEW' ? 'Đang xử lý' : 'Đã giải quyết'
    items.push(
      <MentoringActionCard
        key="ticket"
        tone={isDispute ? 'coral' : 'navy'}
        icon={isDispute ? <AlertTriangle /> : <FileCheck />}
        title={isDispute ? `Khiếu nại #${activeTicket.ticketCode}` : `Dừng Task theo thỏa thuận #${activeTicket.ticketCode}`}
        badge={statusLabel}
        actions={
          <>
            {onOpenTicketDiscussion && (
              <MentoringActionButton icon={<MessageSquare className="h-3.5 w-3.5" />} onClick={onOpenTicketDiscussion}>
                Trao đổi
              </MentoringActionButton>
            )}
            {onOpenAddEvidence && (
              <MentoringActionButton icon={<Paperclip className="h-3.5 w-3.5" />} onClick={onOpenAddEvidence}>
                Bằng chứng
              </MentoringActionButton>
            )}
            {onOpenTaskReport && (
              <MentoringActionButton intent="ghost" icon={<FileText className="h-3.5 w-3.5" />} onClick={onOpenTaskReport}>
                Báo cáo
              </MentoringActionButton>
            )}
          </>
        }
      >
        {(activeTicket.mentorAmount != null || activeTicket.studentRefund != null) && (
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            {activeTicket.mentorAmount != null && <Detail label="Mentor nhận">{formatVnd(activeTicket.mentorAmount)}</Detail>}
            {activeTicket.studentRefund != null && <Detail label="Hoàn Học viên">{formatVnd(activeTicket.studentRefund)}</Detail>}
          </p>
        )}
        <p>
          {isDispute
            ? 'Task tạm khóa trong lúc Ban Quản Trị phân xử. Bạn có thể trao đổi và bổ sung bằng chứng.'
            : 'Task đã dừng. Ban Quản Trị đang chi trả và hoàn tiền theo thỏa thuận.'}
        </p>
        {isStudent && activeTicket.studentRefund != null && activeTicket.studentRefund > 0 && (
          <p>
            Tiền hoàn sẽ chuyển về tài khoản tại mục{' '}
            <Link to="/app/mentoring/refunds" className="font-semibold text-brand-600 underline">Hoàn tiền</Link>.
          </p>
        )}
      </MentoringActionCard>,
    )
  }

  if (items.length === 0) return null

  const dialogTitle = !dialog
    ? ''
    : dialog.action === 'REJECT'
      ? `Từ chối ${KIND_LABEL[dialog.kind]}`
      : dialog.action === 'DECLINE_TOPUP'
        ? 'Từ chối thanh toán bổ sung'
        : `Hủy ${KIND_LABEL[dialog.kind]}`
  const dialogDescription = !dialog
    ? ''
    : dialog.action === 'REJECT'
      ? 'Bên kia sẽ nhận được lý do và có thể gửi đề xuất mới.'
      : dialog.action === 'DECLINE_TOPUP'
        ? 'Đề xuất điều chỉnh sẽ đóng lại. Task giữ nguyên phạm vi, giá và deadline hiện tại.'
        : 'Đề xuất sẽ được rút lại. Task tiếp tục với điều kiện hiện tại.'
  // API hủy gia hạn / hủy đề xuất dừng Task không nhận lý do
  const allowsNote = Boolean(dialog && (dialog.action !== 'CANCEL' || dialog.kind === 'AMENDMENT'))

  return (
    <section className="space-y-2 border-b border-plum-900/[0.06] bg-white px-4 py-3 dark:border-white/10 dark:bg-[#242526] sm:px-6">
      <p className="text-[11px] font-bold uppercase tracking-wide text-plum-500 dark:text-plum-400">Cần xử lý</p>
      {items}

      <Modal
        isOpen={Boolean(dialog)}
        onClose={closeDialog}
        title={dialogTitle}
        icon={dialog?.action === 'CANCEL' ? <Undo2 className="h-5 w-5" /> : <X className="h-5 w-5" />}
        maxWidthClassName="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <MentoringActionButton intent="ghost" onClick={closeDialog} disabled={isBusy}>
              Quay lại
            </MentoringActionButton>
            <MentoringActionButton intent="danger" loading={isBusy} onClick={submitDialog}>
              Xác nhận
            </MentoringActionButton>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-plum-600 dark:text-[#b0b3b8]">{dialogDescription}</p>
          {allowsNote && (
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Lý do (không bắt buộc)"
              className="w-full resize-none rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-sm text-plum-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#18191a] dark:text-white"
            />
          )}
        </div>
      </Modal>
    </section>
  )
}
