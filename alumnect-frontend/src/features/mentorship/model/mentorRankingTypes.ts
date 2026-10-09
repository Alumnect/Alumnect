/**
 * Kiểu dữ liệu đại diện cho một mục Mentor trong bảng xếp hạng (UC97).
 */
export interface MentorRankingItem {
  /** Thứ hạng toàn cục trong lĩnh vực chuyên môn (bắt đầu từ 1) */
  rank: number

  /** ID hồ sơ Mentor */
  mentorId: number

  /** ID tài khoản người dùng của Mentor (dùng để chuyển hướng xem hồ sơ cá nhân) */
  userId: number

  /** Họ và tên đầy đủ của Mentor */
  fullName: string

  /** URL ảnh đại diện */
  avatarUrl: string | null

  /** Tiêu đề giới thiệu nghề nghiệp ngắn */
  headline: string | null

  /** Tên công ty công tác hiện tại */
  currentCompany: string | null

  /** Vị trí / chức danh công tác hiện tại */
  currentPosition: string | null

  /** ID lĩnh vực chuyên môn (ngành nghề) */
  fieldId: number

  /** Tên lĩnh vực chuyên môn (ngành nghề) */
  fieldName: string

  /** Điểm uy tín tổng hợp của Mentor */
  reputationScore: number

  /** Tổng số nhiệm vụ / phiên cố vấn đã hoàn thành */
  completedTasks: number

  /** Điểm đánh giá trung bình của Mentor (0.0 - 5.0) */
  rating: number

  /** Tổng số lượng đánh giá nhận được từ người học */
  reviewCount: number
}

/**
 * Tham số truy vấn bảng xếp hạng Mentor.
 */
export interface MentorRankingParams {
  /** ID lĩnh vực chuyên môn bắt buộc */
  fieldId: number

  /** Chỉ số trang (0-indexed, mặc định 0) */
  page?: number

  /** Kích thước trang (mặc định 10) */
  size?: number
}

/**
 * Cấu trúc phân trang danh sách bảng xếp hạng Mentor trả về từ Backend.
 */
export interface MentorRankingPageResponse {
  content: MentorRankingItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}
