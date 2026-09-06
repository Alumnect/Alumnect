import axios from 'axios'
import http from '@/lib/http'
import type { Conversation, Message, SendMessagePayload, MediaType } from '../model/types'

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface PageResponse<T> {
  content: T[]
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  last: boolean
}

export interface PresignedUrlData {
  uploadUrl: string
  publicUrl: string
}

export const chatApi = {
  /** Lấy danh sách toàn bộ các cuộc trò chuyện của người dùng */
  getConversations: (): Promise<ApiResponse<Conversation[]>> => {
    return http.get<any, ApiResponse<Conversation[]>>('/conversations')
  },


  /** Tìm hoặc tạo cuộc trò chuyện trực tiếp 1-1 với một thành viên khác */
  getOrCreateDirectConversation: (targetUserId: number): Promise<ApiResponse<Conversation>> => {
    return http.post<any, ApiResponse<Conversation>>(`/conversations/direct/${targetUserId}`)
  },

  /** Lấy lịch sử tin nhắn trong cuộc trò chuyện (phân trang) */
  getMessages: (conversationId: number, page = 0, size = 30): Promise<ApiResponse<PageResponse<Message>>> => {
    return http.get<any, ApiResponse<PageResponse<Message>>>(`/conversations/${conversationId}/messages`, {
      params: { page, size },
    })
  },

  /** Gửi tin nhắn mới */
  sendMessage: (payload: SendMessagePayload): Promise<ApiResponse<Message>> => {
    return http.post<any, ApiResponse<Message>>('/messages', payload)
  },

  /** Đánh dấu cuộc trò chuyện đã đọc */
  markAsRead: (conversationId: number): Promise<ApiResponse<void>> => {
    return http.post<any, ApiResponse<void>>(`/conversations/${conversationId}/read`)
  },

  /** Tải tệp đính kèm (ảnh, video, file) lên Cloudflare R2 qua Presigned URL */
  uploadAttachment: async (file: File): Promise<{ mediaType: MediaType; url: string; fileName: string; fileSize: number }> => {
    // Xác định mediaType dựa vào MIME type
    let mediaType: MediaType = 'FILE'
    if (file.type.startsWith('image/')) {
      mediaType = 'IMAGE'
    } else if (file.type.startsWith('video/')) {
      mediaType = 'VIDEO'
    }

    const presignedRes = await http.get<any, ApiResponse<PresignedUrlData>>('/files/presigned-url', {
      params: {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: 'chat',
      },
    })

    const { uploadUrl, publicUrl } = presignedRes.data

    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    })

    return {
      mediaType,
      url: publicUrl,
      fileName: file.name,
      fileSize: file.size,
    }
  },
}
