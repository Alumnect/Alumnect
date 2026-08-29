import http from '@/lib/http'
import type { ApiResponse } from '@/features/auth/api/authApi'
import type {
  ChangePasswordPayload,
  UserProfileResponse,
  FollowUserResponse,
  UpdateProfileRequest,
  UserSearchParams,
  UserDirectoryResponse,
  UserFilterOptionsResponse,
} from '../model/userTypes'

export const userApi = {
  /**
   * Thay đổi mật khẩu tài khoản người dùng hiện tại
   */
  changePassword: (payload: ChangePasswordPayload) =>
    http.post<any, ApiResponse<void>>('/users/change-password', payload),

  /**
   * Lấy thông tin hồ sơ của chính mình (yêu cầu Token)
   */
  getOwnProfile: () =>
    http.get<any, ApiResponse<UserProfileResponse>>('/users/profile'),

  /**
   * Lấy thông tin hồ sơ của người dùng khác (Public GET)
   */
  getUserProfile: (userId: number) =>
    http.get<any, ApiResponse<UserProfileResponse>>(`/users/profile/${userId}`),

  /**
   * Cập nhật thông tin hồ sơ cá nhân của mình
   */
  updateOwnProfile: (payload: UpdateProfileRequest) =>
    http.put<any, ApiResponse<UserProfileResponse>>('/users/profile', payload),

  /**
   * Theo dõi một người dùng khác (Yêu cầu Token)
   * POST /users/{userId}/follow
   */
  followUser: (userId: number) =>
    http.post<any, ApiResponse<void>>(`/users/${userId}/follow`),

  /**
   * Hủy theo dõi một người dùng khác (Yêu cầu Token)
   * DELETE /users/{userId}/follow
   */
  unfollowUser: (userId: number) =>
    http.delete<any, ApiResponse<void>>(`/users/${userId}/follow`),

  /**
   * Lấy danh sách người theo dõi của một người dùng (Public GET, phân trang)
   */
  getFollowers: (userId: number, page = 0, size = 10) =>
    http.get<any, ApiResponse<{
      content: FollowUserResponse[]
      pageNumber: number
      pageSize: number
      totalElements: number
      totalPages: number
      last: boolean
    }>>(`/users/${userId}/followers`, { params: { page, size } }),

  /**
   * Lấy danh sách người mà người dùng đang theo dõi (Public GET, phân trang)
   */
  getFollowing: (userId: number, page = 0, size = 10) =>
    http.get<any, ApiResponse<{
      content: FollowUserResponse[]
      pageNumber: number
      pageSize: number
      totalElements: number
      totalPages: number
      last: boolean
    }>>(`/users/${userId}/following`, { params: { page, size } }),

  /**
   * Tìm kiếm và lọc danh sách thành viên trong mạng lưới AlumNect (Alumni Directory)
   * GET /users/search
   */
  searchUsers: (params?: UserSearchParams) =>
    http.get<any, ApiResponse<{
      content: UserDirectoryResponse[]
      pageNumber: number
      pageSize: number
      totalElements: number
      totalPages: number
      last: boolean
    }>>('/users/search', { params }),

  /**
   * Lấy danh sách các tùy chọn lọc động (khóa học, thành phố) từ DB
   * GET /users/filter-options
   */
  getFilterOptions: () =>
    http.get<any, ApiResponse<UserFilterOptionsResponse>>('/users/filter-options'),
}



