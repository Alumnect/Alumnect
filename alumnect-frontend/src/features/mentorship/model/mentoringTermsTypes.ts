/**
 * Định nghĩa kiểu dữ liệu cho tính năng Điều khoản Hướng dẫn & Hỗ trợ (UC90).
 * Nguồn dữ liệu chính xác xác định trạng thái chấp nhận xuất phát từ Backend,
 * không sử dụng localStorage trên Frontend làm source of truth.
 */

/**
 * Dữ liệu phản hồi trạng thái điều khoản Mentoring từ Backend (GET /mentoring/terms/status).
 */
export interface MentoringTermsStatus {
  /** Phiên bản điều khoản hiện tại do Backend quản lý tập trung */
  currentVersion: string
  /** Cờ cho biết người dùng đã chấp nhận phiên bản hiện tại hay chưa */
  accepted: boolean
  /** Thời điểm chấp nhận điều khoản (chuỗi ISO 8601 hoặc null nếu chưa chấp nhận) */
  acceptedAt?: string | null
}

/**
 * Dữ liệu phản hồi khi chấp nhận điều khoản thành công (POST /mentoring/terms/accept).
 */
export interface MentoringTermsAcceptResult {
  /** Phiên bản điều khoản đã chấp nhận */
  acceptedVersion: string
  /** Luôn là true khi chấp nhận thành công */
  accepted: boolean
  /** Thời điểm chấp nhận điều khoản */
  acceptedAt: string
}

/**
 * Điểm kích hoạt (Entry Source) truy cập UC90 để điều hướng chính xác sau khi Accept.
 * - MENTORING_HOME: Người dùng (Student / Alumni) click "Hướng dẫn & Hỗ trợ"
 * - BECOME_MENTOR: Alumni click "Trở thành Mentor" để chuyển tiếp tới UC91
 */
export type MentoringEntrySource = 'MENTORING_HOME' | 'BECOME_MENTOR'
