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
 * Payload gửi lên API tạo yêu cầu Mentoring chung (UC100).
 */
export interface CreateMentoringRequestPayload {
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
 * Dữ liệu trả về khi tạo yêu cầu Mentoring thành công (UC100).
 */
export interface CreateMentoringRequestData {
  id: number
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
  createdAt: string
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
