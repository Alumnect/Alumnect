import http from '@/lib/http'

/**
 * Định nghĩa cấu trúc phản hồi API chứa thông tin hiển thị cựu sinh viên trên bản đồ.
 */
export interface AlumniMapResponse {
  /** ID của người dùng (cựu sinh viên) */
  userId: number
  /** Họ và tên */
  fullName: string
  /** URL ảnh đại diện */
  avatarUrl: string
  /** Chức danh công việc hiện tại */
  currentPosition: string
  /** Tên công ty làm việc */
  currentCompany: string
  /** Thành phố làm việc/sinh sống */
  city: string
  /** Niên khóa học */
  cohort?: number
  /** Vĩ độ địa lý */
  latitude: number
  /** Kinh độ địa lý */
  longitude: number
}

/**
 * Định nghĩa cấu trúc chuẩn của ApiResponse nhận từ Backend.
 */
export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

/**
 * API Client phục vụ tính năng bản đồ cựu sinh viên.
 */
export const alumniMapApi = {
  /**
   * Lấy danh sách vị trí tọa độ địa lý và thông tin tóm tắt của cựu sinh viên hoạt động.
   * Yêu cầu xác thực JWT Bearer Token.
   */
  getLocations: () => http.get<any, ApiResponse<AlumniMapResponse[]>>('/alumni-map'),
}
