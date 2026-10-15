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
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái Mentoring Task: nguồn nhãn duy nhất cho huy hiệu, chat, modal và trang Admin. */
export const MENTORING_TASK_STATUS_LABELS: Record<string, string> = {
  PREPARATION: 'Chuẩn bị',
  IN_PROGRESS: 'Đang thực hiện',
  SUBMITTED: 'Chờ nghiệm thu',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Đang tranh chấp',
  RESOLVED: 'Đã phân xử',
}

/** Nhãn trạng thái phản hồi của Mentor */
export const MENTORING_RESPONSE_STATUS_LABELS: Record<string, string> = {
  WAITING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  DECLINED: 'Đã từ chối',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái phân phối của Request */
export const MENTORING_DISTRIBUTION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Đang chờ',
  WAITING: 'Đang chờ',
  ACCEPTED: 'Đã chấp nhận',
  DECLINED: 'Đã từ chối',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái Deal */
export const MENTORING_DEAL_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  DECLINED: 'Đã từ chối',
  DEAL_CONFIRMED: 'Đã chốt thỏa thuận',
  CONFIRMED: 'Đã chốt thỏa thuận',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Đã hết hạn',
  SUPERSEDED: 'Đã thay thế',
}

/** Nhãn trạng thái Ticket hòa giải / khiếu nại / tất toán */
export const MENTORING_TICKET_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Đã từ chối',
  CLOSED: 'Đã đóng',
  CANCELLED: 'Đã hủy',
}

/** Nhãn trạng thái tài chính / giải ngân */
export const MENTORING_FINANCE_STATUS_LABELS: Record<string, string> = {
  ESCROW_HELD: 'Đang giữ Escrow',
  DISBURSED: 'Đã giải ngân',
  REFUNDED: 'Đã hoàn tiền',
  COMPLETED: 'Hoàn tất',
  SETTLED: 'Đã quyết toán',
  PARTIALLY_SETTLED: 'Quyết toán một phần',
}

/** Định dạng tiền VND */
export function formatVnd(amount?: number | null): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return '—'
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ'
}
