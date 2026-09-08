/**
 * Định nghĩa các loại thông báo trong hệ thống AlumNect.
 */
export type NotificationType =
  | 'POST_LIKE'
  | 'POST_COMMENT'
  | 'USER_FOLLOW'
  | 'FORUM_ANSWER'
  | 'REPORT_RESOLVED'
  | 'WELCOME'
  | 'SYSTEM_BROADCAST'

/**
 * Interface cấu trúc dữ liệu của một thông báo trả về từ máy chủ.
 */
export interface NotificationItem {
  id: number
  type: NotificationType
  title?: string | null
  content: string
  targetType?: 'POST' | 'USER' | 'QUESTION' | 'SYSTEM' | string | null
  targetId?: string | null
  senderCount: number
  isRead: boolean
  createdAt: string
  senderId?: number | null
  senderName?: string | null
  senderAvatarUrl?: string | null
}

/**
 * Interface dữ liệu số lượng thông báo chưa đọc.
 */
export interface UnreadNotificationCountResponse {
  unreadCount: number
}

/**
 * Interface phân trang phản hồi từ máy chủ cho danh sách thông báo.
 */
export interface NotificationPageResponse {
  content: NotificationItem[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}
