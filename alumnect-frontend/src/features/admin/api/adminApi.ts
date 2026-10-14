import http from '@/lib/http'
import type {
  MentoringDisputeTicket,
  MentoringDisputeContext,
  MentoringTicketMessage,
  CreateTicketMessagePayload,
} from '@/features/mentorship'

export interface DayRegistrationStatDto {
  date: string
  count: number
}

export interface AdminDashboardSummaryDto {
  totalUsers: number
  totalStudents: number
  totalAlumni: number
  pendingVerifications: number
  dailyRegistrations?: DayRegistrationStatDto[]
  registrationsLast7Days?: DayRegistrationStatDto[]
  registrationsByMonth?: DayRegistrationStatDto[]
  registrationsByYear?: DayRegistrationStatDto[]
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
  hasMentorProfile?: boolean
  mentorProfileId?: number
}

export interface AdminVerificationRequestDto {
  id: number
  userId: number
  email?: string
  fullName: string
  avatarUrl?: string
  majorCode: string
  majorName?: string
  proofUrl: string
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
  postType?: string
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
    author?: string
    reason?: string
    status?: string
    type?: string
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

  /**
   * Lấy lịch sử thông báo hệ thống của Admin (phân trang, lọc theo thời gian & trạng thái)
   */
  getSystemNotifications: (params: {
    timeFilter?: string
    status?: string
    page: number
    size: number
  }) =>
    http.get<any, ApiResponse<PageResponse<SystemNotificationDto>>>('/admin/notifications', { params }),

  /**
   * Lấy danh sách toàn bộ các gói dịch vụ Mentor 1/3/6 tháng dành cho Admin (UC95)
   */
  getMentorPackages: () =>
    http.get<any, ApiResponse<AdminMentorPackageDto[]>>('/admin/mentor-packages'),

  /**
   * Cập nhật giá niêm yết và trạng thái hoạt động của gói dịch vụ Mentor (UC95)
   */
  updateMentorPackage: (id: number, payload: UpdateAdminMentorPackagePayload) =>
    http.put<any, ApiResponse<AdminMentorPackageDto>>(`/admin/mentor-packages/${id}`, payload),

  /**
   * Tạo mới hoặc hẹn giờ gửi thông báo hệ thống
   */
  createSystemNotification: (payload: CreateSystemNotificationPayload) =>
    http.post<any, ApiResponse<SystemNotificationDto>>('/admin/notifications', payload),

  /**
   * Hủy thông báo hệ thống đã lên lịch
   */
  cancelScheduledNotification: (id: number) =>
    http.delete<any, ApiResponse<void>>(`/admin/notifications/${id}`),

  /**
   * Lưu trữ thông báo hệ thống vào lịch sử (Archive)
   */
  archiveNotification: (id: number) =>
    http.put<any, ApiResponse<void>>(`/admin/notifications/${id}/archive`),

  /**
   * Lấy danh sách Mentor kèm thông tin CV và gói đăng ký (UC96, UC115)
   */
  getAdminMentors: (params: {
    keyword?: string
    status?: string
    subscriptionStatus?: string
    page?: number
    size?: number
  }) =>
    http.get<any, ApiResponse<PageResponse<AdminMentorCvDto>>>('/admin/mentors', { params }),

  /**
   * Lấy thông tin chi tiết hồ sơ quản lý của Mentor theo ID (UC115 Bước 35)
   */
  getAdminMentorDetail: (mentorId: number) =>
    http.get<any, ApiResponse<AdminMentorCvDto>>(`/admin/mentors/${mentorId}`),

  /**
   * Lấy thông tin chi tiết CV và gói của Mentor theo ID (UC96)
   */
  getMentorCv: (mentorId: number) =>
    http.get<any, ApiResponse<AdminMentorCvDto>>(`/admin/mentors/${mentorId}/cv`),

  /**
   * Lấy danh sách Ticket tranh chấp & hòa giải cho Admin (UC116)
   */
  getAdminTickets: (params: {
    keyword?: string
    type?: string
    status?: string
    handledById?: number
    page?: number
    size?: number
  }) =>
    http.get<any, ApiResponse<PageResponse<MentoringDisputeTicket>>>('/admin/mentoring/tickets', { params }),

  /**
   * Xem chi tiết một Ticket cho Admin (UC116, UC118)
   */
  getAdminTicketDetail: (ticketId: number) =>
    http.get<any, ApiResponse<MentoringDisputeTicket>>(`/admin/mentoring/tickets/${ticketId}`),

  /**
   * Quản trị viên tiếp nhận xử lý Ticket tranh chấp / hòa giải (UC117)
   */
  acceptAdminTicket: (ticketId: number) =>
    http.post<any, ApiResponse<MentoringDisputeTicket>>(`/admin/mentoring/tickets/${ticketId}/accept`),

  /**
   * Xem toàn bộ bằng chứng và bối cảnh Task của Ticket cho Admin (UC118)
   */
  getAdminDisputeContext: (ticketId: number) =>
    http.get<any, ApiResponse<MentoringDisputeContext>>(`/admin/mentoring/tickets/${ticketId}/context`),

  /**
   * Lấy danh sách tin nhắn trao đổi trong Ticket cho Admin (UC119)
   */
  getAdminTicketMessages: (ticketId: number) =>
    http.get<any, ApiResponse<MentoringTicketMessage[]>>(`/admin/mentoring/tickets/${ticketId}/messages`),

  /**
   * Admin gửi tin nhắn / hướng dẫn hòa giải / yêu cầu bổ sung thông tin trong Ticket (UC119)
   */
  sendAdminTicketMessage: (ticketId: number, payload: CreateTicketMessagePayload) =>
    http.post<any, ApiResponse<MentoringTicketMessage>>(`/admin/mentoring/tickets/${ticketId}/messages`, payload),
}


export type SystemNotificationStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'ARCHIVED'
  | 'CANCELLED'

export type RecipientType = 'SPECIFIC_USER' | 'USER_ROLE' | 'ALL_USERS'
export type NotificationDuration = 'ONE_DAY' | 'ONE_WEEK' | 'ONE_MONTH' | 'ONE_YEAR' | 'FOREVER' | 'CUSTOM'

export interface SystemNotificationDto {
  id: number
  title: string
  content: string
  recipientType: RecipientType
  recipientRole?: string
  recipientUser?: {
    id: number
    fullName: string
    email: string
    studentCode?: string
    avatarUrl?: string
    role?: string
  }
  status: SystemNotificationStatus
  durationType: NotificationDuration
  scheduledAt?: string
  sentAt?: string
  expiresAt?: string
  archivedAt?: string
  createdBy?: {
    id: number
    fullName: string
    email: string
    avatarUrl?: string
  }
  createdAt: string
  updatedAt: string
}

export interface CreateSystemNotificationPayload {
  title: string
  content: string
  recipientType: RecipientType
  recipientRole?: string
  recipientUserId?: number
  durationType: NotificationDuration
  isScheduled?: boolean
  scheduledAt?: string
  expiresAt?: string
}

export interface AdminMentorPackageDto {
  id: number
  code: string
  name: string
  description?: string
  durationMonths: number
  price: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
}

export interface UpdateAdminMentorPackagePayload {
  price: number
  status: 'ACTIVE' | 'INACTIVE'
  name?: string
  description?: string
}

export interface AdminMentorCvDto {
  mentorProfileId: number
  userId: number
  mentorName: string
  mentorEmail: string
  avatarUrl?: string
  currentPosition?: string
  currentCompany?: string
  bio?: string
  cvFileKey?: string
  cvUrl?: string
  mentorStatus: string
  workingMode?: string
  mentoringType?: string
  supportedFields?: string[]
  topics?: string[]
  bankName?: string
  bankAccountNumber?: string
  bankAccountHolder?: string
  packageName?: string
  subscriptionStatus?: string
  subscriptionStartDate?: string
  subscriptionEndDate?: string
  updatedAt: string
  reputationScore?: number
  completedTasks?: number
  rating?: number
  reviewCount?: number
}



