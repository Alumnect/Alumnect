import type { MentoringWorkingMode } from './mentorRegistrationTypes'
import type { MentoringParticipationType, MentoringTaskType } from './mentoringDealTypes'

/**
 * Trạng thái của Mentoring Task theo vòng đời (UC105 - UC108).
 * - PREPARATION: Giai đoạn chuẩn bị (vừa thanh toán xong, bắt đầu trao đổi chuẩn bị).
 * - IN_PROGRESS: Đang tiến hành thực hiện nhiệm vụ.
 * - SUBMITTED: Đã nộp kết quả / sản phẩm bàn giao.
 * - COMPLETED: Đã nghiệm thu và hoàn thành Task.
 * - CANCELLED: Đã hủy bỏ.
 * - DISPUTED: Có khiếu nại hoặc tranh chấp nghiệp vụ.
 */
export type MentoringTaskStatus =
  | 'PREPARATION'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'

/**
 * Giai đoạn hiển thị cấp cao trên UI (3 giai đoạn chuẩn):
 * - PREPARATION (Chuẩn bị)
 * - IN_PROGRESS (Đang thực hiện)
 * - ENDING (Kết thúc: SUBMITTED, COMPLETED, CANCELLED, DISPUTED)
 */
export type MentoringTaskUIStage = 'PREPARATION' | 'IN_PROGRESS' | 'ENDING'

/**
 * Tab lọc trên giao diện danh sách My Mentoring Tasks.
 */
export type MentoringTaskFilterTab = 'ALL' | 'PREPARATION' | 'IN_PROGRESS' | 'ENDING'

/**
 * Trạng thái của nhật ký công việc (Work Log) (UC107 & UC108).
 */
export type WorkLogStatus = 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'REJECTED'

/**
 * Loại phương tiện đính kèm.
 */
export type AttachmentMediaType = 'IMAGE' | 'VIDEO' | 'FILE'

/**
 * Thông tin tệp đính kèm trong Work Log.
 */
export interface MentoringWorkLogAttachment {
  id: number
  fileUrl: string
  fileName: string
  fileSize?: number | null
  mediaType: AttachmentMediaType
  createdAt: string
}

/**
 * Dữ liệu payload tạo/sửa tệp đính kèm trong Work Log.
 */
export interface WorkLogAttachmentPayload {
  fileUrl: string
  fileName: string
  fileSize?: number | null
  mediaType?: AttachmentMediaType
}

/**
 * Thông tin nhật ký công việc (Work Log) (UC107).
 */
export interface MentoringWorkLog {
  id: number
  taskId: number
  mentorId: number
  mentorName: string
  mentorAvatar?: string | null
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string | null
  status: WorkLogStatus
  studentFeedback?: string | null
  confirmedAt?: string | null
  confirmedBy?: number | null
  confirmedByName?: string | null
  revisionNumber?: number
  attachments: MentoringWorkLogAttachment[]
  feedbacks?: MentoringWorkLogFeedback[]
  revisions?: MentoringWorkLogRevision[]
  createdAt: string
  updatedAt: string
  canEdit?: boolean
  canConfirm?: boolean
  canReject?: boolean
}

/**
 * Phản hồi / làm rõ của học viên cho Work Log (UC108).
 */
export interface MentoringWorkLogFeedback {
  id: number
  workLogId: number
  studentId: number
  studentName: string
  studentAvatar?: string | null
  action: 'CONFIRMED' | 'CLARIFICATION_REQUESTED'
  reason?: string | null
  revisionNumber: number
  createdAt: string
}

/**
 * Bản ghi snapshot phiên bản Work Log để kiểm toán (UC108).
 */
export interface MentoringWorkLogRevision {
  id: number
  workLogId: number
  revisionNumber: number
  mentorId: number
  mentorName: string
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string | null
  attachmentsSummary?: string | null
  studentFeedback?: string | null
  createdAt: string
}

/**
 * Payload Student xác nhận nghiệm thu Work Log (UC108).
 */
export interface ConfirmWorkLogPayload {
  studentFeedback?: string
}

/**
 * Payload Student yêu cầu làm rõ / điều chỉnh Work Log (UC108).
 */
export interface RejectWorkLogPayload {
  studentFeedback?: string
  reason?: string
}

/**
 * Payload Mentor tạo Work Log mới (UC107).
 */
export interface CreateWorkLogPayload {
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string
  attachments?: WorkLogAttachmentPayload[]
}

/**
 * Payload Mentor cập nhật Work Log chưa xác nhận (UC107).
 */
export interface UpdateWorkLogPayload {
  logDate: string
  description: string
  workCompleted: string
  result: string
  nextAction?: string
  attachments?: WorkLogAttachmentPayload[]
}

/**
 * Thông tin người tham gia Mentoring Task (Student hoặc Mentor) (UC106).
 */
export interface MentoringParticipant {
  id: number
  fullName: string
  avatarUrl?: string | null
  email: string
  role: string
  headline?: string | null
  bio?: string | null
}

/**
 * Tóm tắt thỏa thuận Deal đã chốt gắn với Task (UC106).
 */
export interface MentoringDealSummary {
  id: number
  agreedPrice: number
  taskScope: string
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  version: number
  isPaid: boolean
  paidAt?: string | null
}

/**
 * Tóm tắt thông tin thanh toán Task Payment (UC106).
 */
export interface MentoringPaymentSummary {
  paymentId: number
  orderCode: number
  amount: number
  paymentStatus: TaskPaymentStatus
  paymentMethod: string
  paidAt?: string | null
  accountNumber?: string | null
  accountName?: string | null
}

/**
 * Tổng quan trạng thái và hạn chót Mentoring Task (UC106).
 */
export interface MentoringTaskOverview {
  id: number
  taskTitle: string
  taskScope: string
  agreedPrice: number
  status: MentoringTaskStatus
  uiStage: MentoringTaskUIStage
  progressPercentage: number
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  startedAt: string
  deadline: string
  completedAt?: string | null
  daysRemaining: number
  isOverdue: boolean
  totalWorkLogs: number
  confirmedWorkLogs: number
  pendingWorkLogs: number
}

/**
 * Sự kiện lịch sử tiến trình nhiệm vụ (Task History / Timeline) (UC106).
 */
export interface MentoringTaskHistoryEvent {
  id: string
  timestamp: string
  eventType: string
  title: string
  description: string
  actorName: string
  actorRole: string
}

/**
 * Cờ phân quyền và hành động khả dụng trên Task (UC106 & UC107).
 */
export interface MentoringTaskActionPermissions {
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
}

/**
 * Toàn bộ dữ liệu chi tiết của Mentoring Task tổng hợp 10 sections nghiệp vụ (UC106 & UC107).
 */
export interface MentoringTaskDetail {
  overview: MentoringTaskOverview
  deal: MentoringDealSummary
  student: MentoringParticipant
  mentor: MentoringParticipant
  conversationId?: number | null
  requestId?: number | null
  requestTitle?: string | null
  payment?: MentoringPaymentSummary | null
  workLogs: MentoringWorkLog[]
  history: MentoringTaskHistoryEvent[]
  permissions: MentoringTaskActionPermissions
  activeExtension?: MentoringTaskDeadlineExtension | null
  activeAmendment?: MentoringTaskAmendment | null
  activeSettlementProposal?: MentoringTaskSettlementProposal | null
  latestCompletion?: MentoringTaskCompletion | null
}

/**
 * Thông tin item trong danh sách My Mentoring Tasks (UC106).
 */
export interface MentoringTask {
  id: number
  dealId: number
  studentId: number
  studentName?: string
  studentAvatar?: string | null
  studentEmail?: string
  mentorId: number
  mentorName?: string
  mentorAvatar?: string | null
  mentorEmail?: string
  requestId?: number | null
  requestTitle?: string | null
  conversationId?: number | null
  taskTitle: string
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  status: MentoringTaskStatus
  uiStage?: MentoringTaskUIStage
  progressPercentage?: number
  totalWorkLogs?: number
  pendingWorkLogs?: number
  confirmedWorkLogs?: number
  paymentStatus?: string
  startedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Yêu cầu khởi tạo thanh toán Mentoring Task từ Deal đã xác nhận.
 */
export interface CreateTaskPaymentRequest {
  dealId: number
}

/** Trạng thái giao dịch thanh toán (khớp enum PaymentStatus của backend) */
export type TaskPaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED'

export interface MentoringTaskPaymentCheckoutResponse {
  paymentId: number
  dealId: number
  taskTitle?: string
  mentorName?: string
  orderCode: number
  amount: number
  description?: string
  checkoutUrl: string
  qrCodeUrl?: string | null
  accountNumber?: string | null
  accountName?: string | null
  bin?: string | null
  paymentStatus: TaskPaymentStatus
  paymentExpiresAt?: string
  paidAt?: string | null
}

export interface MentoringTaskPaymentStatusResponse {
  paymentId: number
  dealId: number
  orderCode: number
  paymentStatus: TaskPaymentStatus
  paidAt?: string | null
  taskId?: number | null
  taskStatus?: MentoringTaskStatus | null
  amount?: number
  message?: string
}

/**
 * Trạng thái của Deadline Extension Ticket (UC109).
 */
export type MentoringExtensionStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED'

/**
 * Trạng thái của Task Amendment Ticket (UC109, mục 5.8).
 */
export type MentoringAmendmentStatus = 'PENDING' | 'AWAITING_TOPUP' | 'APPLIED' | 'REJECTED' | 'SUPERSEDED' | 'CANCELLED'

/**
 * Trạng thái của đề xuất dừng Task và phân chia tiền (UC109, mục 5.6).
 */
export type MentoringSettlementProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED'

/**
 * Dữ liệu Deadline Extension Ticket (UC109).
 */
export interface MentoringTaskDeadlineExtension {
  id: number
  taskId: number
  conversationId?: number | null
  createdById: number
  createdByName: string
  createdByAvatar?: string | null
  createdByRole: string
  recipientId: number
  recipientName: string
  recipientAvatar?: string | null
  currentDeadline: string
  proposedDeadline: string
  reason: string
  status: MentoringExtensionStatus
  respondedById?: number | null
  respondedByName?: string | null
  respondedAt?: string | null
  responseNote?: string | null
  createdAt: string
  updatedAt: string
  canConfirm?: boolean
  canReject?: boolean
}

/**
 * Dữ liệu Task Amendment Ticket (UC109, mục 5.8).
 */
export interface MentoringTaskAmendment {
  id: number
  taskId: number
  conversationId?: number | null
  version: number
  createdById: number
  createdByName: string
  createdByAvatar?: string | null
  createdByRole: string
  recipientId: number
  recipientName: string
  recipientAvatar?: string | null
  previousScope?: string | null
  newScope?: string | null
  previousExpectedResult?: string | null
  newExpectedResult?: string | null
  additionalAmount: number
  previousDeadline?: string | null
  newDeadline?: string | null
  reason: string
  status: MentoringAmendmentStatus
  respondedById?: number | null
  respondedByName?: string | null
  respondedAt?: string | null
  createdAt: string
  updatedAt: string
  canConfirm?: boolean
  canReject?: boolean
  canTopUp?: boolean
}

/**
 * Dữ liệu đề xuất dừng Task và phân chia tiền (UC109).
 */
export interface MentoringTaskSettlementProposal {
  id: number
  taskId: number
  conversationId?: number | null
  createdById: number
  createdByName: string
  createdByAvatar?: string | null
  createdByRole: string
  recipientId: number
  recipientName: string
  recipientAvatar?: string | null
  mentorAmount: number
  studentRefund: number
  totalAmount: number
  reason: string
  status: MentoringSettlementProposalStatus
  respondedById?: number | null
  respondedByName?: string | null
  respondedAt?: string | null
  createdAt: string
  updatedAt: string
  canAccept?: boolean
  canReject?: boolean
}

export interface CreateDeadlineExtensionPayload {
  proposedDeadline: string
  reason: string
}

export interface RespondDeadlineExtensionPayload {
  accept: boolean
  responseNote?: string
}

export interface CreateTaskAmendmentPayload {
  newScope?: string
  newExpectedResult?: string
  additionalAmount?: number
  newDeadline?: string
  reason: string
}

export interface RespondTaskAmendmentPayload {
  accept: boolean
  responseNote?: string
}

export interface CreateSettlementProposalPayload {
  mentorAmount: number
  studentRefund: number
  reason: string
}

export interface RespondSettlementProposalPayload {
  accept: boolean
  responseNote?: string
}

/**
 * Trạng thái của lần nộp kết quả nghiệm thu hoàn thành Task (UC110).
 */
export type MentoringCompletionStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SUPERSEDED'

/**
 * Biên bản nộp nghiệm thu hoàn thành Task (UC110).
 */
export interface MentoringTaskCompletion {
  id: number
  taskId: number
  conversationId?: number | null
  submittedBy: MentoringParticipant
  finalSummary: string
  deliverables?: string | null
  attachmentUrls?: string[]
  status: MentoringCompletionStatus
  respondedBy?: MentoringParticipant | null
  respondedAt?: string | null
  feedbackNote?: string | null
  createdAt: string
  updatedAt: string
  canConfirm?: boolean
}

/**
 * Payload Mentor nộp kết quả nghiệm thu Task (UC110).
 */
export interface SubmitTaskCompletionPayload {
  finalSummary: string
  deliverables?: string
  attachmentUrls?: string[]
}

/**
 * Payload Student phản hồi nghiệm thu kết quả Task (UC110).
 */
export interface RespondTaskCompletionPayload {
  accept: boolean
  feedbackNote?: string
}


