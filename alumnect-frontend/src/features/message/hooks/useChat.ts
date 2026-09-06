import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { chatApi } from '../api/chatApi'
import type { SendMessagePayload, Message } from '../model/types'

/**
 * Hook lấy danh sách tất cả các cuộc hội thoại của người dùng.
 */
export function useConversations() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations()
      return res.data
    },
    enabled: isAuthenticated,
  })
}


/**
 * Hook lấy lịch sử tin nhắn của một cuộc hội thoại cụ thể hỗ trợ phân trang cuộn vô hạn (Infinite Scroll).
 */
export function useMessages(conversationId: number | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!conversationId) {
        return {
          content: [],
          pageNumber: 0,
          pageSize: 30,
          totalElements: 0,
          totalPages: 0,
          last: true,
        }
      }
      const res = await chatApi.getMessages(conversationId, pageParam as number, 30)
      return res.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last || lastPage.pageNumber >= lastPage.totalPages - 1) {
        return undefined
      }
      return lastPage.pageNumber + 1
    },
    enabled: !!conversationId,
  })
}

/**
 * Hook gửi tin nhắn mới với cập nhật trực tiếp cache React Query.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(payload),
    onSuccess: (res) => {
      const message = res.data

      // 1. Chèn tin nhắn vừa gửi vào đầu trang đầu tiên trong cache messages
      queryClient.setQueryData<{ pages: any[]; pageParams: any[] }>(
        ['messages', message.conversationId],
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return oldData
          }
          const exists = oldData.pages.some((page) =>
            page.content?.some((m: Message) => m.id === message.id)
          )
          if (exists) return oldData

          const firstPage = oldData.pages[0]
          const updatedFirstPage = {
            ...firstPage,
            content: [message, ...(firstPage.content || [])],
            totalElements: (firstPage.totalElements || 0) + 1,
          }
          return {
            ...oldData,
            pages: [updatedFirstPage, ...oldData.pages.slice(1)],
          }
        }
      )

      // 2. Cập nhật lastMessageSnippet và thời gian trong danh sách hội thoại
      queryClient.setQueryData<any[]>(['conversations'], (oldConvs) => {
        if (!oldConvs || !Array.isArray(oldConvs)) return oldConvs

        const snippet = message.content?.trim()
          ? message.content
          : message.attachments?.[0]?.mediaType === 'IMAGE'
          ? '[Hình ảnh]'
          : message.attachments?.[0]?.mediaType === 'VIDEO'
          ? '[Video]'
          : '[Tệp đính kèm]'

        const updated = oldConvs.map((conv) => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              lastMessage: snippet,
              lastMessageAt: message.createdAt,
            }
          }
          return conv
        })

        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return timeB - timeA
        })
      })
    },
  })
}

/**
 * Hook khởi tạo hoặc lấy cuộc hội thoại 1-1 với người dùng.
 */
export function useDirectConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (targetUserId: number) => chatApi.getOrCreateDirectConversation(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook đánh dấu cuộc trò chuyện đã đọc và tự động giảm badge chưa đọc.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      // Đặt unreadCount của cuộc trò chuyện này về 0 ngay trên cache
      queryClient.setQueryData<any[]>(['conversations'], (oldConvs) => {
        if (!oldConvs || !Array.isArray(oldConvs)) return oldConvs
        return oldConvs.map((conv) => {
          if (conv.id === conversationId) {
            return { ...conv, unreadCount: 0 }
          }
          return conv
        })
      })
    },
  })
}
