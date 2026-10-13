/**
 * Nhãn tiếng Việt dùng chung cho chuỗi nghiệp vụ Request → Chat for Task → Deal → Payment → Task.
 * Bao gồm cả loại nhiệm vụ của Request (UC100) và của Deal (UC104) vì Deal "Chấp nhận theo Request"
 * kế thừa nguyên loại nhiệm vụ của Request.
 */
export const MENTORING_TASK_TYPE_LABELS: Record<string, string> = {
  CAREER_ORIENTATION: 'Định hướng nghề nghiệp',
  TECHNICAL_CONSULTING: 'Tư vấn kỹ thuật chuyên sâu',
  CAPSTONE_ADVICE: 'Cố vấn đồ án tốt nghiệp',
  CONSULTATION: 'Tư vấn định hướng học tập & nghề nghiệp',
  ASSIGNMENT_GUIDANCE: 'Hướng dẫn bài tập / Đồ án tốt nghiệp',
  PROJECT_MENTORING: 'Cố vấn thực chiến dự án phần mềm',
  RESUME_REVIEW: 'Đánh giá, chỉnh sửa CV',
  MOCK_INTERVIEW: 'Phỏng vấn thử (Mock Interview)',
  SKILL_TRAINING: 'Đào tạo kỹ năng chuyên sâu',
  OTHER: 'Khác',
}

/** Nhãn hình thức làm việc */
export const MENTORING_WORKING_MODE_LABELS: Record<string, string> = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  BOTH: 'Linh hoạt (Online & Offline)',
}

/** Nhãn hình thức tham gia */
export const MENTORING_PARTICIPATION_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Cá nhân (1-1)',
  GROUP: 'Nhóm',
  BOTH: 'Cá nhân hoặc nhóm',
}

/** Nhãn cách tạo Deal Ticket */
export const PROPOSAL_SOURCE_LABELS: Record<string, string> = {
  REQUEST_ACCEPTANCE: 'Chấp nhận theo Request',
  RENEGOTIATION: 'Deal lại',
}

/** Nhãn trạng thái Request theo chuỗi nghiệp vụ */
export const MENTORING_REQUEST_FLOW_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở · thương lượng',
  MATCHED: 'Đã chốt Mentor · chờ thanh toán',
  CLOSED: 'Đã chuyển thành Task',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái Mentoring Task */
export const MENTORING_TASK_STATUS_LABELS: Record<string, string> = {
  PREPARATION: 'Chuẩn bị (PREPARATION)',
  IN_PROGRESS: 'Đang thực hiện',
  SUBMITTED: 'Đã nộp kết quả',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

/** Định dạng tiền VND */
export function formatVnd(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}
