/**
 * Các trạng thái của phiếu yêu cầu xác minh / nâng cấp Cựu sinh viên (UC08)
 */
export type VerificationRequestStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Cấu trúc dữ liệu trạng thái xác minh Cựu sinh viên trả về từ Backend (GET /verifications/me)
 */
export interface VerificationStatusResponse {
  id: number | null
  userId: number
  currentRole: 'STUDENT' | 'ALUMNI' | 'ADMIN' | string
  isAccountVerified: boolean
  hasSubmitted: boolean
  status: VerificationRequestStatus
  proofUrl: string | null
  graduationYear: number | null
  majorId: number | null
  majorCode: string | null
  majorName: string | null
  reviewNote: string | null
  reviewedAt: string | null
  createdAt: string | null
}

/**
 * Payload gửi yêu cầu nâng cấp từ Sinh viên lên Cựu sinh viên (POST /verifications/upgrade-alumni)
 */
export interface SubmitVerificationPayload {
  proofUrl: string
  graduationYear: number
  majorId: number
}

