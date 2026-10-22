import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'
import type { MentoringType, WorkingMode } from './mentoring'

export const REQUEST_TASK_TYPES: { value: string; label: string }[] = [
  { value: 'CAREER_ORIENTATION', label: 'Định hướng nghề nghiệp' },
  { value: 'RESUME_REVIEW', label: 'Đánh giá & Góp ý CV' },
  { value: 'MOCK_INTERVIEW', label: 'Phỏng vấn thử nghiệm' },
  { value: 'TECHNICAL_CONSULTING', label: 'Tư vấn chuyên môn & Kỹ thuật' },
  { value: 'CAPSTONE_ADVICE', label: 'Cố vấn đồ án tốt nghiệp' },
  { value: 'OTHER', label: 'Nhu cầu hỗ trợ khác' },
]
export const DEAL_TASK_TYPES: { value: string; label: string }[] = [
  ...REQUEST_TASK_TYPES.filter((t) => t.value !== 'OTHER'),
  { value: 'CONSULTATION', label: 'Tư vấn' },
  { value: 'ASSIGNMENT_GUIDANCE', label: 'Hướng dẫn bài tập' },
  { value: 'PROJECT_MENTORING', label: 'Cố vấn dự án' },
  { value: 'SKILL_TRAINING', label: 'Đào tạo kỹ năng' },
  { value: 'OTHER', label: 'Khác' },
]
export const taskTypeLabel = (v?: string | null) => DEAL_TASK_TYPES.find((t) => t.value === v)?.label ?? v ?? ''

export type RequestStatus = 'OPEN' | 'MATCHED' | 'CLOSED' | 'CANCELLED' | 'EXPIRED'
export const REQUEST_STATUS_LABEL: Record<string, string> = { OPEN: 'Đang mở', MATCHED: 'Đã ghép', CLOSED: 'Đã đóng', CANCELLED: 'Đã hủy', EXPIRED: 'Hết hạn' }
export const RESPONSE_STATUS_LABEL: Record<string, string> = { WAITING: 'Đang chờ', ACCEPTED: 'Đã chấp nhận', DECLINED: 'Đã từ chối', EXPIRED: 'Hết hạn' }

export interface CreateRequestPayload {
  mentorId?: number | null
  title: string
  description: string
  industryId: number
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: WorkingMode
  participationType: MentoringType
  taskType: string
  expectedDeadline?: string | null
  clientRequestKey?: string
  attachments?: { fileName: string; fileUrl: string; fileSize: number; fileType?: string }[]
}

export interface MentoringRequest {
  id: number
  requestType?: 'GENERAL' | 'DIRECT'
  targetMentorName?: string | null
  title: string
  description: string
  industryName: string
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: WorkingMode
  participationType: MentoringType
  taskType: string
  expectedDeadline?: string | null
  status: RequestStatus
  matchedCount: number
  createdAt: string
  directMentorResponseStatus?: string
}

export interface MentorResponseItem {
  mentorProfileId: number
  mentorUserId: number
  mentorName: string
  mentorAvatar?: string | null
  mentorHeadline?: string | null
  responseStatus: string
  responseNote?: string | null
  canMessage: boolean
  conversationId?: number | null
  selected?: boolean
}

export interface RequestDetail extends MentoringRequest {
  mentorResponses: MentorResponseItem[]
  canCancel?: boolean
  confirmedDealId?: number | null
  taskId?: number | null
}

export interface IncomingRequest {
  id: number
  title: string
  description: string
  industryName: string
  studentId: number
  studentName: string
  studentAvatar?: string | null
  studentHeadline?: string | null
  budgetMin?: number | null
  budgetMax?: number | null
  workingMode: WorkingMode
  participationType: MentoringType
  taskType: string
  expectedDeadline?: string | null
  responseStatus: string
  responseNote?: string | null
  requestStatus: RequestStatus
  requestType: 'GENERAL' | 'DIRECT'
  createdAt: string
}
export interface IncomingDetail extends IncomingRequest {
  attachments: { id: number; fileName: string; fileUrl: string }[]
  canRespond: boolean
  canMessage: boolean
  conversationId?: number | null
}

export type DealStatus = 'PROPOSED' | 'STUDENT_CONFIRMED' | 'MENTOR_CONFIRMED' | 'DEAL_CONFIRMED' | 'SUPERSEDED' | 'REJECTED' | 'CANCELLED'
export const DEAL_STATUS_LABEL: Record<string, string> = { PROPOSED: 'Đã đề xuất', STUDENT_CONFIRMED: 'Sinh viên đã xác nhận', MENTOR_CONFIRMED: 'Mentor đã xác nhận', DEAL_CONFIRMED: 'Đã chốt deal', SUPERSEDED: 'Đã thay thế', REJECTED: 'Đã từ chối', CANCELLED: 'Đã hủy' }

export interface Deal {
  id: number
  requestId?: number | null
  requestTitle?: string | null
  studentId: number
  studentName?: string
  mentorId: number
  mentorName?: string
  conversationId?: number | null
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: WorkingMode
  participationType: 'INDIVIDUAL' | 'GROUP'
  taskType: string
  expectedResult: string
  version: number
  studentConfirmed: boolean
  mentorConfirmed: boolean
  status: DealStatus
  isPaid?: boolean
  taskId?: number | null
  canConfirm?: boolean
  canEdit?: boolean
  canPay?: boolean
  canReject?: boolean
  canRequestAdjustment?: boolean
  readOnlyReason?: string | null
}
export interface DealPayload {
  taskScope: string
  agreedPrice: number
  deadline: string
  workingMode: WorkingMode
  participationType: 'INDIVIDUAL' | 'GROUP'
  taskType: string
  expectedResult: string
  changeNote?: string
}

const d = <T>(p: Promise<ApiResponse<T>>) => p.then((r) => r.data)

export const requestApi = {
  create: (p: CreateRequestPayload) => d(http.post<unknown, ApiResponse<MentoringRequest>>('/mentoring/requests', p)),
  createDirect: (mentorId: number, p: CreateRequestPayload) =>
    d(http.post<unknown, ApiResponse<MentoringRequest>>(`/mentors/${mentorId}/requests`, { ...p, mentorId })),
  mine: (page = 0) => d(http.get<unknown, ApiResponse<PageResponse<MentoringRequest>>>('/mentoring/requests', { params: { page, size: 10 } })),
  detail: (id: number) => d(http.get<unknown, ApiResponse<RequestDetail>>(`/mentoring/requests/${id}`)),
  cancel: (id: number, reason?: string) => http.post(`/mentoring/requests/${id}/cancel`, { reason }),
  incoming: (params: { status?: string; page?: number }) =>
    d(http.get<unknown, ApiResponse<PageResponse<IncomingRequest>>>('/mentoring/requests/incoming', { params: { size: 10, ...params } })),
  incomingDetail: (id: number) => d(http.get<unknown, ApiResponse<IncomingDetail>>(`/mentoring/requests/incoming/${id}`)),
  accept: (id: number, responseNote?: string) => d(http.post<unknown, ApiResponse<IncomingDetail>>(`/mentoring/requests/${id}/accept`, { responseNote })),
  decline: (id: number, responseNote?: string) => d(http.post<unknown, ApiResponse<IncomingDetail>>(`/mentoring/requests/${id}/decline`, { responseNote })),
}

export const dealApi = {
  propose: (p: DealPayload & { conversationId: number; proposalSource: 'REQUEST_ACCEPTANCE' | 'RENEGOTIATION' }) =>
    d(http.post<unknown, ApiResponse<Deal>>('/mentoring/deals', p)),
  update: (id: number, p: DealPayload) => d(http.put<unknown, ApiResponse<Deal>>(`/mentoring/deals/${id}`, p)),
  confirm: (id: number, version: number) => d(http.post<unknown, ApiResponse<Deal>>(`/mentoring/deals/${id}/confirm`, { version })),
  detail: (id: number) => d(http.get<unknown, ApiResponse<{ deal: Deal; snapshots: { id: number; version: number; modifiedByName?: string; changeNote?: string | null; agreedPrice: number; createdAt: string }[] }>>(`/mentoring/deals/${id}`)),
  mine: (status?: DealStatus, page = 0) => d(http.get<unknown, ApiResponse<PageResponse<Deal>>>('/mentoring/deals', { params: { page, size: 10, ...(status ? { status } : {}) } })),
  byConversation: (cid: number) => d(http.get<unknown, ApiResponse<{ deal: Deal } | null>>(`/mentoring/deals/by-conversation/${cid}`)),
  cancel: (id: number, reason?: string) => d(http.post<unknown, ApiResponse<Deal>>(`/mentoring/deals/${id}/cancel`, null, { params: reason ? { reason } : undefined })),
  reject: (id: number, reason?: string, version?: number) =>
    d(http.post<unknown, ApiResponse<Deal>>(`/mentoring/deals/${id}/reject`, null, { params: { ...(reason ? { reason } : {}), ...(version ? { version } : {}) } })),
  requestAdjustment: (id: number, note?: string, version?: number) =>
    d(http.post<unknown, ApiResponse<Deal>>(`/mentoring/deals/${id}/request-adjustment`, null, { params: { ...(note ? { note } : {}), ...(version ? { version } : {}) } })),
}
