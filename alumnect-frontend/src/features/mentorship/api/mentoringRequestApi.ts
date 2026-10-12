import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  CreateMentoringRequestPayload,
  CreateMentoringRequestData,
  MentoringRequestDetailData,
  MentorResponseItem,
} from '../model/mentoringRequestTypes'

interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export const mentoringRequestApi = {
  /**
   * Tạo yêu cầu Mentoring (UC100 nếu payload không có mentorId, UC101 nếu có mentorId).
   * Endpoint: POST /api/v1/mentoring/requests
   */
  createRequest: async (payload: CreateMentoringRequestPayload): Promise<CreateMentoringRequestData> => {
    const res = await http.post<any, ApiResponse<CreateMentoringRequestData>>('/mentoring/requests', payload)
    return res.data
  },

  /**
   * Gửi yêu cầu cố vấn trực tiếp tới Mentor cụ thể (UC101).
   * Endpoint: POST /api/v1/mentors/{mentorId}/requests
   */
  createDirectRequest: async (mentorId: number, payload: CreateMentoringRequestPayload): Promise<CreateMentoringRequestData> => {
    const res = await http.post<any, ApiResponse<CreateMentoringRequestData>>(`/mentors/${mentorId}/requests`, {
      ...payload,
      mentorId,
    })
    return res.data
  },

  /**
   * Lấy danh sách yêu cầu Mentoring của sinh viên hiện tại có phân trang (UC102).
   * Endpoint: GET /api/v1/mentoring/requests
   */
  getMyRequests: async (page = 0, size = 10): Promise<PageResponse<CreateMentoringRequestData>> => {
    const res = await http.get<any, ApiResponse<PageResponse<CreateMentoringRequestData>>>('/mentoring/requests', {
      params: { page, size },
    })
    return res.data
  },

  /**
   * Lấy chi tiết một yêu cầu Mentoring kèm toàn bộ phản hồi từ Mentor (UC102).
   * Endpoint: GET /api/v1/mentoring/requests/{id}
   */
  getRequestDetail: async (id: number): Promise<MentoringRequestDetailData> => {
    const res = await http.get<any, ApiResponse<MentoringRequestDetailData>>(`/mentoring/requests/${id}`)
    return res.data
  },

  /**
   * Lấy danh sách phản hồi từ Mentor đối với yêu cầu cụ thể (UC102 sub-resource).
   * Endpoint: GET /api/v1/mentoring/requests/{id}/responses
   */
  getRequestResponses: async (id: number): Promise<MentorResponseItem[]> => {
    const res = await http.get<any, ApiResponse<MentorResponseItem[]>>(`/mentoring/requests/${id}/responses`)
    return res.data
  },

  /**
   * Sinh Presigned URL để tải tệp đính kèm lên Cloudflare R2.
   * Endpoint: GET /api/v1/files/presigned-url
   */
  getPresignedUploadUrl: async (fileName: string, contentType: string) => {
    const res = await http.get<any, ApiResponse<{ uploadUrl: string; publicUrl: string }>>(
      `/files/presigned-url?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}&folder=mentorship/requests`
    )
    return res.data
  },

  /**
   * Tải tệp tin trực tiếp lên Cloudflare R2 qua Presigned URL.
   */
  uploadFileToR2: async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    })
    if (!response.ok) {
      throw new Error(`Tải tệp tin lên kho lưu trữ thất bại: ${response.statusText}`)
    }
  },
}
