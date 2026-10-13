import { z } from 'zod'
import type { MentoringWorkingMode } from './mentorRegistrationTypes'

/**
 * Hình thức tham gia của Mentoring Deal (1-1 hoặc Nhóm).
 */
export type MentoringParticipationType = 'INDIVIDUAL' | 'GROUP'

/**
 * Phân loại nhiệm vụ/công việc trong Deal. Gồm cả loại nhiệm vụ của Request (UC100) vì Deal
 * "Chấp nhận theo Request" kế thừa nguyên loại nhiệm vụ của Request.
 */
export const MENTORING_DEAL_TASK_TYPES = [
  'CAREER_ORIENTATION',
  'TECHNICAL_CONSULTING',
  'CAPSTONE_ADVICE',
  'CONSULTATION',
  'ASSIGNMENT_GUIDANCE',
  'PROJECT_MENTORING',
  'RESUME_REVIEW',
  'MOCK_INTERVIEW',
  'SKILL_TRAINING',
  'OTHER',
] as const

export type MentoringTaskType = (typeof MENTORING_DEAL_TASK_TYPES)[number]

/**
 * Nguồn gốc đề xuất thỏa thuận Deal (UC104).
 */
export type ProposalSource = 'REQUEST_ACCEPTANCE' | 'RENEGOTIATION'

/**
 * Trạng thái của Mentoring Deal qua các giai đoạn (UC104).
 */
export type MentoringDealStatus =
  | 'PROPOSED'
  | 'STUDENT_CONFIRMED'
  | 'MENTOR_CONFIRMED'
  | 'DEAL_CONFIRMED'
  | 'SUPERSEDED'
  | 'REJECTED'
  | 'CANCELLED'

/**
 * Cấu trúc phân trang chuẩn của hệ thống.
 */
export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

/**
 * Thông tin chi tiết một thỏa thuận Mentoring Deal.
 */
export interface MentoringDeal {
  id: number
  ticketId?: number
  ticketType?: string
  proposalSource?: ProposalSource
  requestId?: number | null
  requestTitle?: string | null
  requestStatus?: 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED' | null
  studentId: number
  studentName?: string
  studentAvatar?: string | null
  studentEmail?: string
  mentorId: number
  mentorName?: string
  mentorAvatar?: string | null
  mentorEmail?: string
  conversationId?: number | null
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  version: number
  studentConfirmed: boolean
  mentorConfirmed: boolean
  studentConfirmedAt?: string | null
  mentorConfirmedAt?: string | null
  status: MentoringDealStatus
  isLocked: boolean
  lockedAt?: string | null
  isPaid?: boolean
  paidAt?: string | null
  taskId?: number | null
  createdByUserId: number
  createdByName?: string
  updatedByUserId: number
  updatedByName?: string
  createdAt: string
  updatedAt: string
  canConfirm?: boolean
  canEdit?: boolean
  /** Học viên có thể thanh toán (Deal đã khóa và là Deal đã chốt của Request) */
  canPay?: boolean
  /** Học viên có thể từ chối phiên bản hiện tại */
  canReject?: boolean
  /** Học viên có thể yêu cầu Mentor điều chỉnh phiên bản hiện tại */
  canRequestAdjustment?: boolean
  /** Lý do Chat for Task chỉ đọc (null nếu vẫn hoạt động) */
  readOnlyReason?: string | null
}

/**
 * Thông tin một phiên bản Snapshot của Deal.
 */
export interface MentoringDealSnapshot {
  id: number
  dealId: number
  ticketType?: string
  proposalSource?: ProposalSource
  version: number
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  modifiedByUserId: number
  modifiedByName?: string
  modifiedByAvatar?: string | null
  changeNote?: string | null
  createdAt: string
}

/**
 * DTO chi tiết toàn diện của Deal kèm các snapshot.
 */
export interface MentoringDealDetail {
  deal: MentoringDeal
  latestSnapshot?: MentoringDealSnapshot | null
  snapshots: MentoringDealSnapshot[]
}

/**
 * Payload Mentor phát hành phiên bản Deal Ticket mới trong Chat for Task.
 * Client chỉ gửi conversationId; Request / Student / Mentor do backend suy ra.
 * Với REQUEST_ACCEPTANCE, các trường điều khoản bị bỏ qua (lấy từ Request).
 */
export interface ProposeDealPayload {
  conversationId: number
  proposalSource: ProposalSource
  taskScope?: string
  agreedPrice?: number
  deadline?: string
  workingMode?: MentoringWorkingMode
  participationType?: MentoringParticipationType
  taskType?: MentoringTaskType
  expectedResult?: string
  changeNote?: string
}

/**
 * Payload gửi yêu cầu cập nhật điều khoản Deal.
 */
export interface UpdateDealPayload {
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  changeNote?: string
}

/**
 * Zod Schema kiểm tra hợp lệ form đề xuất Deal (khớp 100% Backend DTO validation messages).
 */
export const proposeDealSchema = z.object({
  taskScope: z
    .string({ message: 'Phạm vi công việc (Task Scope) không được để trống.' })
    .trim()
    .min(10, 'Phạm vi công việc phải từ 10 đến 5000 ký tự.')
    .max(5000, 'Phạm vi công việc phải từ 10 đến 5000 ký tự.'),
  agreedPrice: z
    .number({ message: 'Mức giá thỏa thuận không được để trống.' })
    .min(0, 'Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.'),
  deadline: z
    .string({ message: 'Hạn chót hoàn thành (Deadline) không được để trống.' })
    .refine((val) => !isNaN(Date.parse(val)) && new Date(val).getTime() > Date.now(), {
      message: 'Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.',
    }),
  workingMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH'], {
    message: 'Hình thức làm việc (Working Mode) không được để trống.',
  }),
  participationType: z.enum(['INDIVIDUAL', 'GROUP'], {
    message: 'Hình thức tham gia (Participation Type) không được để trống.',
  }),
  taskType: z.enum(MENTORING_DEAL_TASK_TYPES, {
    message: 'Loại nhiệm vụ (Task Type) không được để trống.',
  }),
  expectedResult: z
    .string({ message: 'Kết quả kỳ vọng đầu ra (Expected Result) không được để trống.' })
    .trim()
    .min(10, 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.')
    .max(3000, 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.'),
  changeNote: z
    .string()
    .max(255, 'Ghi chú đề xuất không được vượt quá 255 ký tự.')
    .optional(),
})

export type ProposeDealFormData = z.infer<typeof proposeDealSchema>

/**
 * Zod Schema kiểm tra hợp lệ form điều chỉnh điều khoản Deal.
 */
export const updateDealSchema = z.object({
  taskScope: z
    .string({ message: 'Phạm vi công việc (Task Scope) không được để trống.' })
    .trim()
    .min(10, 'Phạm vi công việc phải từ 10 đến 5000 ký tự.')
    .max(5000, 'Phạm vi công việc phải từ 10 đến 5000 ký tự.'),
  agreedPrice: z
    .number({ message: 'Mức giá thỏa thuận không được để trống.' })
    .min(0, 'Mức giá thỏa thuận phải lớn hơn hoặc bằng 0 VND.'),
  deadline: z
    .string({ message: 'Hạn chót hoàn thành (Deadline) không được để trống.' })
    .refine((val) => !isNaN(Date.parse(val)) && new Date(val).getTime() > Date.now(), {
      message: 'Hạn chót hoàn thành (Deadline) phải là một thời điểm trong tương lai.',
    }),
  workingMode: z.enum(['ONLINE', 'OFFLINE', 'BOTH'], {
    message: 'Hình thức làm việc (Working Mode) không được để trống.',
  }),
  participationType: z.enum(['INDIVIDUAL', 'GROUP'], {
    message: 'Hình thức tham gia (Participation Type) không được để trống.',
  }),
  taskType: z.enum(MENTORING_DEAL_TASK_TYPES, {
    message: 'Loại nhiệm vụ (Task Type) không được để trống.',
  }),
  expectedResult: z
    .string({ message: 'Kết quả kỳ vọng đầu ra (Expected Result) không được để trống.' })
    .trim()
    .min(10, 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.')
    .max(3000, 'Kết quả kỳ vọng đầu ra phải từ 10 đến 3000 ký tự.'),
  changeNote: z
    .string()
    .max(255, 'Ghi chú thay đổi không được vượt quá 255 ký tự.')
    .optional(),
})

export type UpdateDealFormData = z.infer<typeof updateDealSchema>
