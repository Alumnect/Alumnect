/**
 * Định nghĩa các kiểu dữ liệu (TypeScript interfaces) phục vụ cho chức năng xác thực và đăng ký.
 */

export interface Major {
  id: number
  code: string
  name: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  role: 'STUDENT' | 'ALUMNI'
  majorId: number
  cohort: number
  studentCode: string
  graduationYear?: number
  proofUrl?: string
  note?: string
}

export interface PresignedUrlResponse {
  uploadUrl: string
  publicUrl: string
}

export interface GoogleRegisterPayload {
  token: string
  fullName: string
  role: 'STUDENT' | 'ALUMNI'
  majorId: number
  cohort: number
  studentCode: string
  graduationYear?: number
  proofUrl?: string
  note?: string
}

export interface ResetPasswordPayload {
  email: string
  token: string
  newPassword: string
}

export interface VerifyResetOtpPayload {
  email: string
  token: string
}

