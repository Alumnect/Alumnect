import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatApi } from '../api/chatApi'
import type { SendMessagePayload } from '../model/types'

/**
 * Hook lấy danh sách tất cả các cuộc hội thoại của người dùng.
 */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatApi.getConversations()
      return res.data
    },
  })
}

/**
 * Hook lấy lịch sử tin nhắn của một cuộc hội thoại cụ thể.
 */
export function useMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const res = await chatApi.getMessages(conversationId, 0, 50)
      // Lấy từ mới nhất về cũ hơn từ backend, đảo lại để hiển thị từ trên xuống dưới
      return [...res.data.content].reverse()
    },
    enabled: !!conversationId,
  })
}

/**
 * Hook gửi tin nhắn mới.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(payload),
    onSuccess: (res) => {
      const message = res.data
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] })
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
 * Hook đánh dấu cuộc trò chuyện đã đọc.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.markAsRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}
