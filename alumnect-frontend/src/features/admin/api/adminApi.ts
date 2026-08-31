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
  majorCode?: string
  majorName?: string
  cohort?: number
  headline?: string
  bio?: string
  biography?: string
  socialLinks?: string[]
}

export interface AdminVerificationRequestDto {
  id: number
  userId: number
  email?: string
  fullName: string
  avatarUrl?: string
  graduationYear: number
  majorCode: string
  majorName?: string
  proofUrl: string
  note?: string
  status: string
  createdAt: string
  reviewedBy?: string
  reviewNote?: string
  reviewedAt?: string
}

export interface AdminPostDto {
  id: number
  authorName: string
  authorEmail: string
  authorAvatarUrl?: string
  type: string
  content: string
  imageUrl?: string
  visibility: string
  likeCount: number
  commentCount: number
  repostCount: number
  hidden: boolean
  deleted: boolean
  createdAt: string
  images?: string[]
  job?: {
    title?: string
    company?: string
    location?: string
    salaryMin?: number
    salaryMax?: number
    applyUrl?: string
    contactEmail?: string
  }
  event?: {
    title?: string
    location?: string
    startTime?: string
    endTime?: string
    capacity?: number
  }
}

export interface AdminReportDto {
  id: number
  postId: number
  postContent: string
  postStatus: string
  postAuthorId: number
  postAuthorName: string
  postAuthorEmail: string
  reporterId: number
  reporterName: string
  reporterEmail: string
  reporterAvatarUrl?: string
  reason: 'SPAM' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'SCAM_OR_FRAUD' | 'OTHER'
  description?: string
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED'
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

  /**
   * Xem danh sách bài viết với các bộ lọc động và phân trang (UC65 & UC66)
   */
  getPosts: (params: {
    query?: string
    author?: string
    status?: string
    type?: string
    page: number
    size: number
  }) =>
    http.get<any, ApiResponse<PageResponse<AdminPostDto>>>('/admin/posts', { params }),

  /**
   * Thay đổi trạng thái ẩn của bài viết (UC68)
   */
  togglePostHidden: (id: number, hidden: boolean) =>
    http.put<any, ApiResponse<void>>(`/admin/posts/${id}/status`, { hidden }),

  /**
   * Xem chi tiết bài viết cộng đồng dành cho Admin (UC67)
   */
  getPostDetail: (id: number) =>
    http.get<any, ApiResponse<AdminPostDto>>(`/admin/posts/${id}`),

  /**
   * Xem danh sách báo cáo vi phạm bài viết với bộ lọc động và phân trang (UC69)
   */
  getReports: (params: {
    query?: string
    reason?: string
    status?: string
    postId?: number
    page: number
    size: number
  }) =>
    http.get<any, ApiResponse<PageResponse<AdminReportDto>>>('/admin/reports', { params }),

  /**
   * Cập nhật trạng thái xử lý của một báo cáo (RESOLVED hoặc DISMISSED)
   */
  updateReportStatus: (id: number, status: 'RESOLVED' | 'DISMISSED') =>
    http.put<any, ApiResponse<void>>(`/admin/reports/${id}/status`, { status }),
}
