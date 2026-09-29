import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  MentorRegistrationResponse,
  MentorRegistrationRequest,
  MentorRegistrationSaveResponse,
  SupportedIndustryItem,
} from '../model/mentorRegistrationTypes'

/**
 * Tầng giao tiếp API cho tính năng Đăng ký trở thành Mentor (UC91).
 */
export const mentorRegistrationApi = {
  /**
   * Lấy toàn bộ thông tin đăng ký Mentor của Alumni đang đăng nhập.
   * Endpoint: GET /api/v1/mentoring/registration
   */
  getRegistration: async (): Promise<MentorRegistrationResponse> => {
    const res = await http.get<any, ApiResponse<MentorRegistrationResponse>>('/mentoring/registration')
    return res.data
  },

  /**
   * Lưu nháp hoặc hoàn tất thông tin đăng ký Mentor.
   * Endpoint: PUT /api/v1/mentoring/registration
   */
  saveRegistration: async (payload: MentorRegistrationRequest): Promise<MentorRegistrationSaveResponse> => {
    const res = await http.put<any, ApiResponse<MentorRegistrationSaveResponse>>('/mentoring/registration', payload)
    return res.data
  },

  /**
   * Lấy danh mục ngành nghề chuẩn (Industries) để chọn lĩnh vực hỗ trợ.
   * Endpoint: GET /api/v1/industries
   */
  getIndustries: async (): Promise<SupportedIndustryItem[]> => {
    const res = await http.get<any, ApiResponse<SupportedIndustryItem[]>>('/industries')
    return res.data || []
  },

  /**
   * Sinh link ký sẵn để tải file CV lên Cloudflare R2.
   * Endpoint: GET /api/v1/files/presigned-url
   */
  getPresignedUploadUrl: async (fileName: string, contentType: string) => {
    const res = await http.get<any, ApiResponse<{ uploadUrl: string; publicUrl: string }>>(
      `/files/presigned-url?fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}&folder=mentorship/cvs`
    )
    return res.data
  },

  /**
   * Tải file thực tế lên R2 qua uploadUrl.
   */
  uploadFileToR2: async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })
    if (!response.ok) {
      throw new Error(`Tải tệp tin lên kho lưu trữ thất bại: ${response.statusText}`)
    }
  },
}
