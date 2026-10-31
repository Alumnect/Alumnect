import i18n from '@/i18n'
import type { MentoringWorkingMode, MentoringType } from './mentorRegistrationTypes'
import { createLocalizedMap } from './mentoringFlowLabels'

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
export type MentoringRequestStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED' | 'EXPIRED'

/**
 * Nhãn tiếng Việt và mô tả cho các loại nhiệm vụ.
 */
/** Chọn chuỗi theo ngôn ngữ hiện tại tại thời điểm truy cập (đổi ngôn ngữ không cần tải lại trang). */
const pick = (vi: string, en: string) => (i18n.language === 'en' ? en : vi)

const taskTypeOption = (
  value: MentoringTaskType,
  label: [string, string],
  description: [string, string],
) => ({
  value,
  get label() {
    return pick(label[0], label[1])
  },
  get description() {
    return pick(description[0], description[1])
  },
})

export const TASK_TYPE_OPTIONS: { value: MentoringTaskType; label: string; description: string }[] = [
  taskTypeOption(
    'CAREER_ORIENTATION',
    ['Định hướng nghề nghiệp', 'Career orientation'],
    ['Tư vấn lộ trình sự nghiệp, cơ hội việc làm và định vị bản thân', 'Career path advice, job opportunities and positioning yourself'],
  ),
  taskTypeOption(
    'RESUME_REVIEW',
    ['Đánh giá & Góp ý CV', 'Resume review & feedback'],
    ['Tối ưu hóa hồ sơ năng lực, sửa lỗi và làm nổi bật thế mạnh', 'Polish your profile, fix mistakes and highlight your strengths'],
  ),
  taskTypeOption(
    'MOCK_INTERVIEW',
    ['Phỏng vấn thử nghiệm', 'Mock interview'],
    ['Luyện tập trả lời phỏng vấn chuyên môn và phỏng vấn hành vi', 'Practice technical and behavioral interview answers'],
  ),
  taskTypeOption(
    'TECHNICAL_CONSULTING',
    ['Tư vấn chuyên môn & Kỹ thuật', 'Technical consulting'],
    ['Giải đáp vướng mắc công nghệ, bài toán kiến trúc hoặc coding', 'Help with technology blockers, architecture problems or coding'],
  ),
  taskTypeOption(
    'CAPSTONE_ADVICE',
    ['Cố vấn đồ án tốt nghiệp', 'Capstone project advice'],
    ['Hỗ trợ phương pháp nghiên cứu, phản biện và hoàn thiện đồ án', 'Support with research methods, critique and finishing your capstone'],
  ),
  taskTypeOption(
    'OTHER',
    ['Nhu cầu hỗ trợ khác', 'Other support'],
    ['Các yêu cầu trao đổi, chia sẻ và kết nối khác theo thỏa thuận', 'Other discussion, sharing and networking requests by agreement'],
  ),
]

/**
 * Nhãn hiển thị cho phương thức làm việc (theo ngôn ngữ hiện tại).
 */
export const WORKING_MODE_LABELS = createLocalizedMap(
  {
    ONLINE: 'Trực tuyến (Online)',
    OFFLINE: 'Gặp trực tiếp (Offline)',
    BOTH: 'Linh hoạt (Cả Online & Offline)',
  },
  {
    ONLINE: 'Online',
    OFFLINE: 'In person (Offline)',
    BOTH: 'Flexible (Online & Offline)',
  },
) as Record<MentoringWorkingMode, string>

/**
 * Nhãn hiển thị cho hình thức tham gia (theo ngôn ngữ hiện tại).
 */
export const PARTICIPATION_TYPE_LABELS = createLocalizedMap(
  {
    INDIVIDUAL: 'Cá nhân 1-1',
    GROUP: 'Theo nhóm',
    BOTH: 'Cá nhân hoặc Nhóm',
  },
  {
    INDIVIDUAL: 'Individual 1-on-1',
    GROUP: 'Group',
    BOTH: 'Individual or Group',
  },
) as Record<MentoringType, string>

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

export type IncomingRequestScope = 'ALL' | 'SAME_INDUSTRY' | 'SAME_FORMAT'

/**
 * Payload gửi lên API tạo yêu cầu Mentoring (UC100 & UC101).
 */
export interface CreateMentoringRequestPayload {
  mentorId?: number | null
  groupId?: number | null
  memberIds?: number[]
  clientRequestKey?: string
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

export type MentoringGroupMemberStatus = 'PENDING' | 'JOINED' | 'DECLINED' | 'REMOVED' | 'CANCELLED' | 'INVITED' | 'ACTIVE'

export interface MentoringGroupMemberData {
  id: number
  groupId?: number
  userId: number
  fullName: string
  email: string
  avatarUrl?: string | null
  major?: string | null
  role?: string | null
  leader: boolean
  status: MentoringGroupMemberStatus
  invitedAt: string
  joinedAt?: string | null
  removedAt?: string | null
}

export interface MentoringGroupRequestSummaryData {
  id: number
  title: string
  requestType: 'GENERAL' | 'DIRECT'
  status: MentoringRequestStatus
  targetMentorId?: number | null
  targetMentorName?: string | null
  confirmedDealId?: number | null
  taskId?: number | null
  createdAt: string
}

export interface MentoringGroupData {
  id: number
  requestId?: number | null
  name: string
  description?: string | null
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED'
  leaderId: number
  leaderName?: string | null
  leaderAvatarUrl?: string | null
  createdAt?: string
  updatedAt?: string
  maxMembers: number
  joinedMemberCount?: number
  pendingMemberCount?: number
  canManage: boolean
  members: MentoringGroupMemberData[]
  requests?: MentoringGroupRequestSummaryData[]
}

export interface CreateMentoringGroupPayload {
  name: string
  description?: string
}

export interface UpdateMentoringGroupPayload {
  name?: string
  description?: string
  status?: 'ACTIVE' | 'CLOSED'
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
  /** ID Chat for Task riêng giữa Học viên và Mentor này (có sau khi Mentor ACCEPT) */
  conversationId?: number | null
  /** Mentor này là Mentor được Học viên chốt chọn cho Request */
  selected?: boolean
  /** Mentor có lĩnh vực hỗ trợ trùng ngành của Request (được ưu tiên hiển thị trước) */
  sameIndustry?: boolean
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
  groupId?: number | null
  group?: MentoringGroupData | null
  participatingMembers?: MentoringGroupMemberData[]
  createdAt: string
  updatedAt?: string
}

/**
 * Dữ liệu chi tiết đầy đủ của yêu cầu Mentoring kèm danh sách phản hồi từ Mentor (UC102).
 */
export interface MentoringRequestDetailData extends CreateMentoringRequestData {
  responseSummary: MentoringResponseSummary
  mentorResponses: MentorResponseItem[]
  /** Người xem là chủ Request và còn có thể hủy */
  canCancel?: boolean
  /** Mentor (users.id) được chốt chọn sau khi xác nhận Deal */
  selectedMentorUserId?: number | null
  /** Deal Ticket đã khóa của Request */
  confirmedDealId?: number | null
  /** Mentoring Task đã kích hoạt sau khi thanh toán thành công */
  taskId?: number | null
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
  distributionId?: number | null
  sameIndustry: boolean
  sameFormat: boolean
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
  distributionId?: number | null
  sameIndustry: boolean
  sameFormat: boolean
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
  /** ID Chat for Task của Request + Student + Mentor hiện tại (có sau khi ACCEPT) */
  conversationId?: number | null
  /** Mentor hiện tại là Mentor được chọn cho Request */
  selectedMentor?: boolean
  /** Request đã chọn Mentor khác (Chat for Task của Mentor hiện tại chỉ đọc) */
  otherMentorSelected?: boolean
  createdAt: string
  updatedAt?: string | null
}
