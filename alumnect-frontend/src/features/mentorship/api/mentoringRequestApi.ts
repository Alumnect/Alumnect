import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  CreateMentoringRequestPayload,
  CreateMentoringRequestData,
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
   * Tạo yêu cầu Mentoring chung (UC100).
   * Endpoint: POST /api/v1/mentoring/requests
   */
  createRequest: async (payload: CreateMentoringRequestPayload): Promise<CreateMentoringRequestData> => {
    const res = await http.post<any, ApiResponse<CreateMentoringRequestData>>('/mentoring/requests', payload)
    return res.data
  },

  /**
   * Lấy danh sách yêu cầu Mentoring của sinh viên hiện tại có phân trang.
   * Endpoint: GET /api/v1/mentoring/requests
   */
  getMyRequests: async (page = 0, size = 10): Promise<PageResponse<CreateMentoringRequestData>> => {
    const res = await http.get<any, ApiResponse<PageResponse<CreateMentoringRequestData>>>('/mentoring/requests', {
      params: { page, size },
    })
    return res.data
  },

  /**
   * Lấy chi tiết một yêu cầu Mentoring theo ID.
   * Endpoint: GET /api/v1/mentoring/requests/{id}
   */
  getRequestDetail: async (id: number): Promise<CreateMentoringRequestData> => {
    const res = await http.get<any, ApiResponse<CreateMentoringRequestData>>(`/mentoring/requests/${id}`)
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
