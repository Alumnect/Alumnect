import http from '@/lib/http'
import type { NotificationPageResponse, UnreadNotificationCountResponse } from '../model/types'

export interface ApiResponse<T> {
  error: number
  message: string
  data: T
}

export const notificationApi = {
  /**
   * Lấy danh sách thông báo của người dùng hiện tại (phân trang).
   */
  getNotifications: (page = 0, size = 20): Promise<ApiResponse<NotificationPageResponse>> => {
    return http.get<any, ApiResponse<NotificationPageResponse>>('/notifications', {
      params: { page, size },
    })
  },

  /**
   * Lấy số lượng thông báo chưa đọc của người dùng hiện tại.
   */
  getUnreadCount: (): Promise<ApiResponse<UnreadNotificationCountResponse>> => {
    return http.get<any, ApiResponse<UnreadNotificationCountResponse>>('/notifications/unread-count')
  },

  /**
   * Đánh dấu một thông báo cụ thể là đã đọc.
   */
  markAsRead: (id: number): Promise<ApiResponse<void>> => {
    return http.patch<any, ApiResponse<void>>(`/notifications/${id}/read`)
  },

  /**
   * Đánh dấu toàn bộ thông báo là đã đọc.
   */
  markAllAsRead: (): Promise<ApiResponse<void>> => {
    return http.patch<any, ApiResponse<void>>('/notifications/read-all')
  },
}
