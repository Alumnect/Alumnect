import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'
import type { WorkingMode } from './mentoring'

export type TaskStatus = 'PREPARATION' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED'
export const TASK_STATUS_LABEL: Record<string, string> = {
  PREPARATION: 'Chuẩn bị', IN_PROGRESS: 'Đang thực hiện', SUBMITTED: 'Đã nộp kết quả', COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy', DISPUTED: 'Đang tranh chấp', RESOLVED: 'Đã giải quyết',
}
export const TASK_STAGES: [string | undefined, string][] = [[undefined, 'Tất cả'], ['PREPARATION', 'Chuẩn bị'], ['IN_PROGRESS', 'Đang làm'], ['ENDING', 'Kết thúc']]

export interface Participant { id: number; fullName: string; avatarUrl?: string | null; email: string; role: string; headline?: string | null }

export interface Task {
  id: number
  dealId: number
  studentName?: string
  studentAvatar?: string | null
  mentorName?: string
  mentorAvatar?: string | null
  taskTitle: string
  taskScope: string
  agreedPrice: number
  deadline: string
  status: TaskStatus
  progressPercentage?: number
  totalWorkLogs?: number
  pendingWorkLogs?: number
}

export interface WorkLogAttachment { id: number; fileUrl: string; fileName: string; fileSize?: number | null; mediaType: 'IMAGE' | 'VIDEO' | 'FILE' }
export interface WorkLog {
  id: number
  taskId: number
  mentorName: string
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string | null
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED'
  studentFeedback?: string | null
  attachments: WorkLogAttachment[]
  canEdit?: boolean
  canConfirm?: boolean
  canReject?: boolean
}
export interface WorkLogPayload {
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string
  attachments?: { fileUrl: string; fileName: string; fileSize?: number | null; mediaType?: 'IMAGE' | 'VIDEO' | 'FILE' }[]
}

export interface Extension {
  id: number
  createdByName: string
  currentDeadline: string
  proposedDeadline: string
  reason: string
  status: string
  canConfirm?: boolean
  canReject?: boolean
  canCancel?: boolean
}
export interface Amendment {
  id: number
  createdByName: string
  newScope?: string | null
  newExpectedResult?: string | null
  additionalAmount: number
  newDeadline?: string | null
  reason: string
  status: string
  canConfirm?: boolean
  canReject?: boolean
  canTopUp?: boolean
  canCancel?: boolean
  canDeclineTopUp?: boolean
}
export interface SettlementProposal {
  id: number
  createdByName: string
  mentorAmount: number
  studentRefund: number
  totalAmount: number
  reason: string
  status: string
  canAccept?: boolean
  canReject?: boolean
  canCancel?: boolean
}
export interface Completion {
  id: number
  submittedBy: Participant
  finalSummary: string
  deliverables?: string | null
  attachmentUrls?: string[]
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED'
  feedbackNote?: string | null
  canConfirm?: boolean
}
export interface Ticket {
  id: number
  ticketCode: string
  ticketType: 'SETTLEMENT' | 'DISPUTE'
  taskId: number
  title: string
  description?: string | null
  disputeReason?: string | null
  desiredSolution?: string | null
  mentorAmount?: number | null
  studentRefund?: number | null
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED' | 'CANCELLED'
  resolutionNote?: string | null
  decision?: string | null
  createdAt: string
}
export interface Evidence { id: number; title?: string | null; description?: string | null; fileUrl: string; fileName?: string | null; uploadedBy?: Participant | null; createdAt: string }
export interface TicketMessage {
  id: number
  ticketId: number
  senderId: number
  senderName: string
  senderAvatar?: string | null
  senderRole: string
  messageType: string
  content: string
  proposedMentorAmount?: number | null
  proposedStudentRefund?: number | null
  createdAt: string
}

export interface TaskPermissions {
  canAddWorkLog: boolean
  canEditWorkLog: boolean
  canConfirmWorkLog: boolean
  isReadOnly: boolean
  isStudent: boolean
  isMentor: boolean
  isDisputed: boolean
  canRequestExtension?: boolean
  canRequestAmendment?: boolean
  canProposeSettlement?: boolean
  canSubmitCompletion?: boolean
  canConfirmCompletion?: boolean
  canSubmitSettlementTicket?: boolean
  canCreateDisputeTicket?: boolean
  canSubmitDisputeEvidence?: boolean
}

export interface TaskDetail {
  overview: {
    id: number
    taskTitle: string
    taskScope: string
    agreedPrice: number
    status: TaskStatus
    progressPercentage: number
    workingMode: WorkingMode
    deadline: string
    daysRemaining: number
    isOverdue: boolean
    totalWorkLogs: number
    confirmedWorkLogs: number
    pendingWorkLogs: number
    escrowBalance?: number
  }
  deal: { id: number; expectedResult: string; isPaid: boolean }
  student: Participant
  mentor: Participant
  conversationId?: number | null
  workLogs: WorkLog[]
  permissions: TaskPermissions
  activeExtension?: Extension | null
  activeAmendment?: Amendment | null
  activeSettlementProposal?: SettlementProposal | null
  latestCompletion?: Completion | null
  activeTicket?: Ticket | null
  history: { id: string; timestamp: string; title: string; description: string; actorName: string }[]
}

export interface TaskReport {
  taskTitle: string
  taskStatus: TaskStatus
  extensionCount: number
  totalExtensionDays: number
  totalWorkLogs: number
  confirmedWorkLogs: number
  progressPercentage: number
  amendmentCount: number
  totalAdditionalAmount: number
  originalPrice: number
  totalAgreedPrice: number
  studentTotalPaid: number
  studentRefundAmount: number
  studentRefundStatus: string
  mentorEarnedAmount: number
  platformFee: number
  mentorNetPayout: number
  mentorPayoutStatus: string
}

export interface SettlementSnapshot {
  taskId: number
  taskTitle: string
  totalBudget: number
  settlementProposalId: number
  mentorAmount: number
  studentRefund: number
  reason: string
  hasOpenTicket: boolean
}

export interface TaskCheckout {
  paymentId: number
  dealId: number
  orderCode: number
  amount: number
  description?: string
  checkoutUrl: string
  qrCodeUrl?: string | null
  accountNumber?: string | null
  accountName?: string | null
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'
}

export interface Review { id: number; rating: number; comment?: string | null }

const d = <T>(p: Promise<ApiResponse<T>>) => p.then((r) => r.data)
const T = '/mentoring/tasks'

export const taskApi = {
  checkout: (dealId: number, amendmentId?: number) =>
    d(http.post<unknown, ApiResponse<TaskCheckout>>('/mentoring/task-payments/checkout', { dealId, ...(amendmentId ? { amendmentId } : {}) })),
  paymentStatus: (orderCode: number) =>
    d(http.get<unknown, ApiResponse<{ paymentStatus: TaskCheckout['paymentStatus']; taskId?: number | null }>>(`/mentoring/task-payments/${orderCode}/status`)),
  cancelPayment: (orderCode: number, reason?: string) =>
    d(http.post<unknown, ApiResponse<unknown>>(`/mentoring/task-payments/${orderCode}/cancel`, null, { params: reason ? { reason } : undefined })),

  mine: (p: { stage?: string; status?: string; page?: number }) =>
    d(http.get<unknown, ApiResponse<PageResponse<Task>>>(`${T}/my-tasks`, { params: { size: 10, ...p } })),
  detail: (id: number) => d(http.get<unknown, ApiResponse<TaskDetail>>(`${T}/${id}`)),
  byDeal: (dealId: number) => d(http.get<unknown, ApiResponse<TaskDetail>>(`${T}/by-deal/${dealId}`)),
  report: (id: number) => d(http.get<unknown, ApiResponse<TaskReport>>(`${T}/${id}/report`)),

  workLogs: (id: number) => d(http.get<unknown, ApiResponse<WorkLog[]>>(`${T}/${id}/work-logs`)),
  createWorkLog: (id: number, p: WorkLogPayload) => d(http.post<unknown, ApiResponse<WorkLog>>(`${T}/${id}/work-logs`, p)),
  updateWorkLog: (id: number, wid: number, p: WorkLogPayload) => d(http.put<unknown, ApiResponse<WorkLog>>(`${T}/${id}/work-logs/${wid}`, p)),
  confirmWorkLog: (id: number, wid: number, studentFeedback?: string) => d(http.post<unknown, ApiResponse<WorkLog>>(`${T}/${id}/work-logs/${wid}/confirm`, { studentFeedback })),
  rejectWorkLog: (id: number, wid: number, reason: string) => d(http.post<unknown, ApiResponse<WorkLog>>(`${T}/${id}/work-logs/${wid}/reject`, { studentFeedback: reason, reason })),

  createExtension: (id: number, p: { proposedDeadline: string; reason: string }) => d(http.post<unknown, ApiResponse<Extension>>(`${T}/${id}/deadline-extensions`, p)),
  respondExtension: (eid: number, accept: boolean, responseNote?: string) => d(http.put<unknown, ApiResponse<Extension>>(`${T}/deadline-extensions/${eid}/respond`, { accept, responseNote })),
  cancelExtension: (eid: number) => d(http.put<unknown, ApiResponse<Extension>>(`${T}/deadline-extensions/${eid}/cancel`)),

  createAmendment: (id: number, p: { newScope?: string; newExpectedResult?: string; additionalAmount?: number; newDeadline?: string; reason: string }) => d(http.post<unknown, ApiResponse<Amendment>>(`${T}/${id}/amendments`, p)),
  respondAmendment: (aid: number, accept: boolean, responseNote?: string) => d(http.put<unknown, ApiResponse<Amendment>>(`${T}/amendments/${aid}/respond`, { accept, responseNote })),
  cancelAmendment: (aid: number, reason?: string) => d(http.put<unknown, ApiResponse<Amendment>>(`${T}/amendments/${aid}/cancel`, null, { params: reason ? { reason } : undefined })),

  createSettlementProposal: (id: number, p: { mentorAmount: number; studentRefund: number; reason: string }) => d(http.post<unknown, ApiResponse<SettlementProposal>>(`${T}/${id}/settlement-proposals`, p)),
  respondSettlement: (pid: number, accept: boolean, responseNote?: string) => d(http.put<unknown, ApiResponse<SettlementProposal>>(`${T}/settlement-proposals/${pid}/respond`, { accept, responseNote })),
  cancelSettlement: (pid: number) => d(http.put<unknown, ApiResponse<SettlementProposal>>(`${T}/settlement-proposals/${pid}/cancel`)),
  settlementSnapshot: (id: number) => d(http.get<unknown, ApiResponse<SettlementSnapshot>>(`${T}/${id}/settlement-snapshot`)),
  submitSettlementTicket: (id: number, p: { proposalId: number; note?: string }) => d(http.post<unknown, ApiResponse<Ticket>>(`${T}/${id}/settlement-tickets`, p)),

  submitCompletion: (id: number, p: { finalSummary: string; deliverables?: string; attachmentUrls?: string[] }) => d(http.post<unknown, ApiResponse<Completion>>(`${T}/${id}/completions`, p)),
  respondCompletion: (id: number, cid: number, accept: boolean, feedbackNote?: string) => d(http.put<unknown, ApiResponse<Completion>>(`${T}/${id}/completions/${cid}/respond`, { accept, feedbackNote })),

  createDispute: (id: number, p: { title: string; disputeReason: string; description: string; desiredSolution: string; initialEvidences?: { fileUrl: string; fileName?: string; title?: string }[] }) =>
    d(http.post<unknown, ApiResponse<Ticket>>(`${T}/${id}/dispute-tickets`, p)),
  tickets: (id: number) => d(http.get<unknown, ApiResponse<Ticket[]>>(`${T}/${id}/tickets`)),
  evidences: (tid: number) => d(http.get<unknown, ApiResponse<Evidence[]>>(`${T}/tickets/${tid}/evidences`)),
  addEvidence: (tid: number, p: { title?: string; description?: string; fileUrl: string; fileName?: string; fileSize?: number; fileType?: string }) => d(http.post<unknown, ApiResponse<Evidence>>(`${T}/tickets/${tid}/evidences`, p)),
  ticketMessages: (tid: number) => d(http.get<unknown, ApiResponse<TicketMessage[]>>(`${T}/tickets/${tid}/messages`)),
  sendTicketMessage: (tid: number, p: { content: string; messageType?: string; proposedMentorAmount?: number | null; proposedStudentRefund?: number | null }) => d(http.post<unknown, ApiResponse<TicketMessage>>(`${T}/tickets/${tid}/messages`, p)),

  myReview: (taskId: number) => d(http.get<unknown, ApiResponse<Review | null>>(`/mentoring/reviews/tasks/${taskId}`)),
  review: (p: { taskId: number; rating: number; comment?: string }) => d(http.post<unknown, ApiResponse<Review>>('/mentoring/reviews', p)),
}
