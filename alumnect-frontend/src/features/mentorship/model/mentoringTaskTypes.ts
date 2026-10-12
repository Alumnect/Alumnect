import type { MentoringWorkingMode } from './mentorRegistrationTypes'
import type { MentoringParticipationType, MentoringTaskType } from './mentoringDealTypes'

/**
 * Trạng thái của Mentoring Task theo vòng đời (UC105 - UC108).
 * - PREPARATION: Giai đoạn chuẩn bị (vừa thanh toán xong, bắt đầu trao đổi chuẩn bị).
 * - IN_PROGRESS: Đang tiến hành thực hiện nhiệm vụ.
 * - SUBMITTED: Đã nộp kết quả / sản phẩm bàn giao.
 * - COMPLETED: Đã nghiệm thu và hoàn thành Task.
 * - CANCELLED: Đã hủy bỏ.
 */
export type MentoringTaskStatus =
  | 'PREPARATION'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'CANCELLED'

/**
 * Thông tin chi tiết một Mentoring Task đã được kích hoạt sau thanh toán.
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
  title: string
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: MentoringWorkingMode
  participationType: MentoringParticipationType
  taskType: MentoringTaskType
  expectedResult: string
  status: MentoringTaskStatus
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

/**
 * Kết quả khởi tạo phiên thanh toán PayOS VietQR cho Mentoring Task.
 */
export interface MentoringTaskPaymentCheckoutResponse {
  paymentId: number
  dealId: number
  orderCode: number
  amount: number
  checkoutUrl: string
  qrCodeUrl?: string | null
  status: string
  message: string
}

/**
 * Kết quả kiểm tra trạng thái thanh toán Mentoring Task (polling / webhook).
 */
export interface MentoringTaskPaymentStatusResponse {
  paymentId: number
  dealId: number
  orderCode: number
  status: string
  amount: number
  isSuccess: boolean
  taskId?: number | null
  message: string
}
