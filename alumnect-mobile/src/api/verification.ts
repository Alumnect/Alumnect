import http from '@/lib/http'
import type { ApiResponse } from '@/lib/http'

/** Trạng thái phiếu xác minh / nâng cấp Cựu sinh viên (UC08). */
export type VerificationRequestStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

/** GET /verifications/me: phiếu nâng cấp gần nhất của người dùng hiện tại. */
export interface VerificationStatus {
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

/** POST /verifications/upgrade-alumni */
export interface SubmitUpgradePayload {
  proofUrl: string
  graduationYear: number
  majorId: number
}

/** Năm tốt nghiệp tối thiểu mà backend chấp nhận (khớp schema web và SubmitVerificationRequestDto). */
export const MIN_GRADUATION_YEAR = 2006

export const verificationApi = {
  myStatus: () => http.get<unknown, ApiResponse<VerificationStatus>>('/verifications/me'),
  submitUpgrade: (payload: SubmitUpgradePayload) =>
    http.post<unknown, ApiResponse<VerificationStatus>>('/verifications/upgrade-alumni', payload),
}
