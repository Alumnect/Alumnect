import type { MentoringWorkingMode } from './mentorRegistrationTypes'
import type { MentoringDealDetail } from './mentoringDealTypes'
import type { MentoringTaskPaymentStatusResponse, MentoringTaskStatus } from './mentoringTaskTypes'

/**
 * Ngữ cảnh đầy đủ của một Chat for Task (Conversation MENTORING) — khớp MentoringConversationResponse của backend.
 * Truy vết được Request → Mentor Response → Conversation → Deal (mọi phiên bản) → Payment → Task.
 * Các cờ quyền thao tác được tính ở backend; frontend chỉ dùng để hiển thị.
 */
export interface MentoringConversationContext {
  conversationId: number
  myRole: 'STUDENT' | 'MENTOR'

  // Request
  requestId: number
  requestTitle: string
  requestDescription?: string
  requestType: 'GENERAL' | 'DIRECT'
  requestStatus: 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED'
  industryName?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  expectedDeadline?: string | null
  workingMode?: MentoringWorkingMode
  participationType?: 'INDIVIDUAL' | 'GROUP' | 'BOTH'
  taskType?: string

  // Thành viên
  studentId: number
  studentName: string
  studentAvatar?: string | null
  mentorUserId: number
  mentorProfileId?: number | null
  mentorName: string
  mentorAvatar?: string | null
  responseStatus?: 'WAITING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | null
  respondedAt?: string | null

  // Chọn Mentor
  selectedMentorUserId?: number | null
  confirmedDealId?: number | null
  selectedMentor: boolean
  readOnly: boolean
  readOnlyReason?: string | null

  // Deal / Payment / Task
  deal?: MentoringDealDetail | null
  latestPayment?: MentoringTaskPaymentStatusResponse | null
  taskId?: number | null
  taskStatus?: MentoringTaskStatus | null

  // Quyền thao tác
  canSendMessage: boolean
  canCreateDealTicket: boolean
  canAcceptDealByRequest: boolean
  acceptByRequestUnavailableReason?: string | null
}
