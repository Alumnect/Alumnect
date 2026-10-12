import type { MentoringWorkingMode, MentoringType } from './mentorRegistrationTypes'

export type { MentoringWorkingMode, MentoringType }

/**
 * Các loại nhiệm vụ cố vấn mà sinh viên có thể yêu cầu (UC100).
 */
export type MentoringTaskType =
  | 'CAREER_ORIENTATION'
  | 'RESUME_REVIEW'
  | 'MOCK_INTERVIEW'
  | 'TECHNICAL_CONSULTING'
  | 'CAPSTONE_ADVICE'
  | 'OTHER'

/**
 * Trạng thái của yêu cầu Mentoring (UC100).
 */
export type MentoringRequestStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED'

/**
 * Nhãn tiếng Việt và mô tả cho các loại nhiệm vụ.
 */
export const TASK_TYPE_OPTIONS: { value: MentoringTaskType; label: string; description: string }[] = [
  {
    value: 'CAREER_ORIENTATION',
    label: 'Định hướng nghề nghiệp',
    description: 'Tư vấn lộ trình sự nghiệp, cơ hội việc làm và định vị bản thân',
  },
  {
    value: 'RESUME_REVIEW',
    label: 'Đánh giá & Góp ý CV',
    description: 'Tối ưu hóa hồ sơ năng lực, sửa lỗi và làm nổi bật thế mạnh',
  },
  {
    value: 'MOCK_INTERVIEW',
    label: 'Phỏng vấn thử nghiệm',
    description: 'Luyện tập trả lời phỏng vấn chuyên môn và phỏng vấn hành vi',
  },
  {
    value: 'TECHNICAL_CONSULTING',
    label: 'Tư vấn chuyên môn & Kỹ thuật',
    description: 'Giải đáp vướng mắc công nghệ, bài toán kiến trúc hoặc coding',
  },
  {
    value: 'CAPSTONE_ADVICE',
    label: 'Cố vấn đồ án tốt nghiệp',
    description: 'Hỗ trợ phương pháp nghiên cứu, phản biện và hoàn thiện đồ án',
  },
  {
    value: 'OTHER',
    label: 'Nhu cầu hỗ trợ khác',
    description: 'Các yêu cầu trao đổi, chia sẻ và kết nối khác theo thỏa thuận',
  },
]

/**
 * Nhãn hiển thị cho phương thức làm việc.
 */
export const WORKING_MODE_LABELS: Record<MentoringWorkingMode, string> = {
  ONLINE: 'Trực tuyến (Online)',
  OFFLINE: 'Gặp trực tiếp (Offline)',
  BOTH: 'Linh hoạt (Cả Online & Offline)',
}

/**
 * Nhãn hiển thị cho hình thức tham gia.
 */
export const PARTICIPATION_TYPE_LABELS: Record<MentoringType, string> = {
  INDIVIDUAL: 'Cá nhân 1-1',
  GROUP: 'Theo nhóm',
  BOTH: 'Cá nhân hoặc Nhóm',
}

/**
 * Cấu trúc một tệp tin đính kèm trong payload gửi lên.
 */
export interface MentoringAttachmentItem {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType?: string
}

/**
 * Loại yêu cầu Mentoring:
 * - GENERAL: Yêu cầu mở chung, matching tự động (UC100).
 * - DIRECT: Yêu cầu gửi trực tiếp tới Mentor cụ thể (UC101).
 */
export type MentoringRequestType = 'GENERAL' | 'DIRECT'

/**
 * Payload gửi lên API tạo yêu cầu Mentoring (UC100 & UC101).
 */
export interface CreateMentoringRequestPayload {
  mentorId?: number | null
  title: string
  description: string
  industryId: number
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: MentoringWorkingMode
  participationType: MentoringType
  taskType: MentoringTaskType
  expectedDeadline?: string | null
  attachments?: MentoringAttachmentItem[]
}

/**
 * Cấu trúc tệp đính kèm nhận về từ Backend.
 */
export interface MentoringAttachmentResponseData {
  id: number
  fileName: string
  fileUrl: string
  fileSize: number
  fileType?: string
  createdAt: string
}

/**
 * Trạng thái phản hồi của Mentor theo thuật ngữ nghiệp vụ hiển thị cho sinh viên (UC102).
 */
export type MentoringResponseStatus = 'WAITING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'

/**
 * Cấu trúc thông tin phản hồi của một Mentor đối với yêu cầu Mentoring (UC102).
 */
export interface MentorResponseItem {
  mentorProfileId: number
  mentorUserId: number
  mentorName: string
  mentorAvatar?: string | null
  mentorHeadline?: string | null
  supportedFields: string[]
  distributionStatus: string
  responseStatus: MentoringResponseStatus
  responseNote?: string | null
  distributedAt: string
  respondedAt?: string | null
  canMessage: boolean
}

/**
 * Tổng hợp số liệu phản hồi từ các Mentor đối với yêu cầu (UC102).
 */
export interface MentoringResponseSummary {
  totalDistributed: number
  waitingCount: number
  acceptedCount: number
  declinedCount: number
  expiredCount: number
}

/**
 * Dữ liệu trả về khi tạo hoặc xem danh sách yêu cầu Mentoring (UC100, UC101, UC102).
 */
export interface CreateMentoringRequestData {
  id: number
  requestType?: MentoringRequestType
  targetMentorId?: number | null
  targetMentorName?: string | null
  targetMentorAvatar?: string | null
  targetMentorHeadline?: string | null
  title: string
  description: string
  industryId: number
  industryName: string
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: MentoringWorkingMode
  participationType: MentoringType
  taskType: MentoringTaskType
  expectedDeadline?: string | null
  status: MentoringRequestStatus
  matchedCount: number
  distributionNote: string
  attachments: MentoringAttachmentResponseData[]
  responseSummary?: MentoringResponseSummary
  directMentorResponseStatus?: string
  createdAt: string
  updatedAt?: string
}

/**
 * Dữ liệu chi tiết đầy đủ của yêu cầu Mentoring kèm danh sách phản hồi từ Mentor (UC102).
 */
export interface MentoringRequestDetailData extends CreateMentoringRequestData {
  responseSummary: MentoringResponseSummary
  mentorResponses: MentorResponseItem[]
}

/**
 * Dữ liệu file đang được tải lên ở giao diện người dùng.
 */
export interface UploadingFileState {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  fileUrl?: string
  errorMessage?: string
}

/**
 * Payload phản hồi (chấp nhận hoặc từ chối) yêu cầu Mentoring của Mentor (UC103).
 */
export interface RespondMentoringRequestPayload {
  responseNote?: string
}

/**
 * Dữ liệu một yêu cầu Mentoring trong danh sách gửi đến của Mentor (UC103).
 */
export interface MentorIncomingRequestData {
  id: number
  distributionId: number
  requestType: MentoringRequestType
  title: string
  description: string
  industryId: number
  industryName: string
  studentId: number
  studentName: string
  studentAvatar?: string | null
  studentHeadline?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: MentoringWorkingMode
  participationType: MentoringType
  taskType: MentoringTaskType
  expectedDeadline?: string | null
  distributionStatus: string
  responseStatus: MentoringResponseStatus
  responseNote?: string | null
  distributedAt: string
  respondedAt?: string | null
  requestStatus: MentoringRequestStatus
  attachmentCount: number
  createdAt: string
}

/**
 * Dữ liệu chi tiết một yêu cầu Mentoring gửi đến Mentor kèm cờ quyền hành động (UC103).
 */
export interface MentorIncomingRequestDetailData {
  id: number
  distributionId: number
  requestType: MentoringRequestType
  title: string
  description: string
  industryId: number
  industryName: string
  studentId: number
  studentName: string
  studentAvatar?: string | null
  studentHeadline?: string | null
  studentEmail?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: MentoringWorkingMode
  participationType: MentoringType
  taskType: MentoringTaskType
  expectedDeadline?: string | null
  requestStatus: MentoringRequestStatus
  attachments: MentoringAttachmentResponseData[]
  distributionStatus: string
  responseStatus: MentoringResponseStatus
  responseNote?: string | null
  distributedAt: string
  respondedAt?: string | null
  canRespond: boolean
  canMessage: boolean
  createdAt: string
  updatedAt?: string | null
}

