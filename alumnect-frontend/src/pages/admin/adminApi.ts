import http from '@/lib/http'

export interface DayRegistrationStatDto {
  date: string
  count: number
}

export interface AdminDashboardSummaryDto {
  totalUsers: number
  totalStudents: number
  totalAlumni: number
  pendingAlumniVerifications: number
  dailyRegistrations: DayRegistrationStatDto[]
}

export interface AdminUserDto {
  id: number
  email: string
  fullName: string
  studentCode: string
  role: string
  accountStatus: string
  isAccountVerified: boolean
  createdAt: string
  avatarUrl?: string
  phone?: string
  major?: {
    id: number
    code: string
    name: string
  }
  cohort?: number
  headline?: string
  socialLinks?: string[]
}

export interface AdminVerificationRequestDto {
  id: number
  userId: number
  fullName: string
  graduationYear: number
  majorCode: string
  proofUrl: string
  note?: string
  status: string
  createdAt: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export const adminApi = {
  /**
   * Lấy số liệu thống kê KPIs và biểu đồ đăng ký 7 ngày qua
   */
  getDashboardSummary: () =>
    http.get<any, ApiResponse<AdminDashboardSummaryDto>>('/admin/dashboard/summary'),

  /**
   * Xem danh sách người dùng với các bộ lọc động và phân trang
   */
  getUsers: (params: {
    query?: string
    role?: string
    status?: string
    majorId?: number | string
    cohort?: number | string
    page: number
    size: number
  }) =>
    http.get<any, ApiResponse<PageResponse<AdminUserDto>>>('/admin/users', { params }),

  /**
   * Xem chi tiết người dùng
   */
  getUserDetail: (id: number) =>
    http.get<any, ApiResponse<AdminUserDto>>(`/admin/users/${id}`),

  /**
   * Cập nhật trạng thái người dùng (Khóa/Mở khóa)
   */
  updateUserStatus: (id: number, status: 'ACTIVE' | 'LOCKED') =>
    http.put<any, ApiResponse<void>>(`/admin/users/${id}/status`, { status }),

  /**
   * Xem danh sách yêu cầu xác thực cựu sinh viên
   */
  getVerificationRequests: (params: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    page: number
    size: number
  }) =>
    http.get<any, ApiResponse<PageResponse<AdminVerificationRequestDto>>>('/admin/verifications', { params }),

  /**
   * Phê duyệt hoặc từ chối yêu cầu xác thực tốt nghiệp của cựu sinh viên
   */
  reviewVerificationRequest: (
    id: number,
    payload: {
      status: 'APPROVED' | 'REJECTED'
      reviewNote?: string
    }
  ) =>
    http.put<any, ApiResponse<void>>(`/admin/verifications/${id}/review`, payload),
}
