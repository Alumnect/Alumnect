import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { toast } from '@/components/ui'
import { chatApi } from '../api/chatApi'
import type {
  SendMessagePayload,
  Message,
  Conversation,
  CreateGroupPayload,
  UpdateGroupPayload,
  AddMembersPayload,
} from '../model/types'

/**
 * Hook lấy danh sách cuộc hội thoại theo tab: 'primary' hoặc 'requests'.
 */
export function useConversations(tab: 'primary' | 'requests' = 'primary') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['conversations', tab],
    queryFn: async () => {
      const res = await chatApi.getConversations(tab)
      return res.data
    },
    enabled: isAuthenticated,
  })
}

/**
 * Hook lấy lịch sử tin nhắn của một cuộc hội thoại cụ thể hỗ trợ Infinite Scroll.
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
 * Hook gửi tin nhắn mới với Optimistic UI (hiển thị ngay lập tức) và đồng bộ mượt mà.
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: SendMessagePayload) => chatApi.sendMessage(payload),

    onMutate: async (payload: SendMessagePayload) => {
      if (!payload.conversationId) {
        return { tempId: null, conversationId: null }
      }

      // Hủy bỏ các truy vấn messages đang chạy để tránh ghi đè optimistic message
      await queryClient.cancelQueries({ queryKey: ['messages', payload.conversationId] })

      const previousMessages = queryClient.getQueryData(['messages', payload.conversationId])
      const previousConversations = queryClient.getQueryData(['conversations'])

      const currentUser = useAuthStore.getState().user
      const tempId = -Date.now()

      const optimisticMessage: Message = {
        id: tempId,
        conversationId: payload.conversationId,
        senderId: Number(currentUser?.id) || 0,
        senderName: currentUser?.name || 'Tôi',
        senderAvatar: currentUser?.avatarUrl,
        content: payload.content || '',
        isDeleted: false,
        createdAt: new Date().toISOString(),
        type: payload.attachments && payload.attachments.length > 0
          ? (payload.attachments[0].mediaType === 'IMAGE' ? 'IMAGE' : 'FILE')
          : 'TEXT',
        status: 'sending',
        attachments: (payload.attachments || []).map((att, idx) => ({
          id: -(Date.now() + idx),
          mediaType: att.mediaType,
          url: att.url,
          fileName: att.fileName,
          fileSize: att.fileSize,
          createdAt: new Date().toISOString(),
        })),
      }

      // 1. Chèn ngay tin nhắn lạc quan vào đầu cache tin nhắn của cuộc trò chuyện
      queryClient.setQueryData<{ pages: any[]; pageParams: any[] }>(
        ['messages', payload.conversationId],
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [
                {
                  content: [optimisticMessage],
                  pageNumber: 0,
                  pageSize: 30,
                  totalElements: 1,
                  totalPages: 1,
                  last: true,
                },
              ],
              pageParams: [0],
            }
          }

          const firstPage = oldData.pages[0]
          const updatedFirstPage = {
            ...firstPage,
            content: [optimisticMessage, ...(firstPage.content || [])],
            totalElements: (firstPage.totalElements || 0) + 1,
          }
          return {
            ...oldData,
            pages: [updatedFirstPage, ...oldData.pages.slice(1)],
          }
        }
      )

      // 2. Cập nhật lạc quan snippet và đẩy cuộc trò chuyện lên đầu danh sách hội thoại
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (oldConvs) => {
        if (!oldConvs || !Array.isArray(oldConvs)) return oldConvs

        const snippet = optimisticMessage.content?.trim()
          ? optimisticMessage.content
          : optimisticMessage.attachments?.[0]?.mediaType === 'IMAGE'
          ? '[Hình ảnh]'
          : '[Tệp đính kèm]'

        const updated = oldConvs.map((conv) => {
          if (conv.id === payload.conversationId) {
            return {
              ...conv,
              lastMessage: snippet,
              lastMessageAt: optimisticMessage.createdAt,
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

      return { tempId, conversationId: payload.conversationId, previousMessages, previousConversations }
    },

    onSuccess: (res, _payload, context) => {
      const message: Message = { ...res.data, status: 'sent' }

      // 1. Thay thế tin nhắn tạm (tempId) bằng dữ liệu tin nhắn thực tế từ server
      queryClient.setQueryData<{ pages: any[]; pageParams: any[] }>(
        ['messages', message.conversationId],
        (oldData) => {
          if (!oldData || !oldData.pages || oldData.pages.length === 0) {
            return {
              pages: [
                {
                  content: [message],
                  pageNumber: 0,
                  pageSize: 30,
                  totalElements: 1,
                  totalPages: 1,
                  last: true,
                },
              ],
              pageParams: [0],
            }
          }

          let replaced = false
          const updatedPages = oldData.pages.map((page) => ({
            ...page,
            content: (page.content || []).map((m: Message) => {
              if (context?.tempId && m.id === context.tempId) {
                replaced = true
                return message
              }
              if (m.id === message.id) {
                replaced = true
                return message
              }
              return m
            }),
          }))

          if (!replaced) {
            const firstPage = updatedPages[0]
            updatedPages[0] = {
              ...firstPage,
              content: [message, ...(firstPage.content || [])],
            }
          }

          return {
            ...oldData,
            pages: updatedPages,
          }
        }
      )

      // 2. Làm mới danh sách cuộc hội thoại để đảm bảo tính nhất quán
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.removeQueries({ queryKey: ['direct-conversation'] })
    },

    onError: (_err, _payload, context) => {
      // Đánh dấu tin nhắn tạm là bị lỗi (error) để người dùng nhận biết
      if (context?.conversationId && context?.tempId) {
        queryClient.setQueryData<{ pages: any[]; pageParams: any[] }>(
          ['messages', context.conversationId],
          (oldData) => {
            if (!oldData || !oldData.pages) return oldData
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                content: (page.content || []).map((m: Message) => {
                  if (m.id === context.tempId) {
                    return { ...m, status: 'error' }
                  }
                  return m
                }),
              })),
            }
          }
        )
      }
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.')
    },
  })
}

/**
 * Hook mở hoặc tạo cuộc hội thoại 1-1 với người dùng (Draft mode nếu chưa có).
 */
export function useDirectConversation() {
  return useMutation({
    mutationFn: (targetUserId: number) => chatApi.getOrCreateDirectConversation(targetUserId),
  })
}

/**
 * Hook đánh dấu cuộc trò chuyện đã đọc.
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.markAsRead(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.setQueriesData<Conversation[]>({ queryKey: ['conversations'] }, (oldConvs) => {
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

/**
 * Hook chấp nhận cuộc trò chuyện từ người lạ (chuyển từ Requests -> Primary).
 */
export function useAcceptConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.acceptConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook xóa hoặc từ chối cuộc trò chuyện.
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (conversationId: number) => chatApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook tạo nhóm trò chuyện mới.
 */
export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => chatApi.createGroup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook cập nhật thông tin nhóm trò chuyện (tên, avatar).
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: number; payload: UpdateGroupPayload }) =>
      chatApi.updateGroup(conversationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/**
 * Hook thêm thành viên vào nhóm trò chuyện.
 */
export function useAddMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, payload }: { conversationId: number; payload: AddMembersPayload }) =>
      chatApi.addMembers(conversationId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['group-members', vars.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
    },
  })
}

/**
 * Hook xóa thành viên khỏi nhóm hoặc rời nhóm.
 */
export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, userId, newAdminId }: { conversationId: number; userId: number; newAdminId?: number }) =>
      chatApi.removeMember(conversationId, userId, newAdminId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['group-members', vars.conversationId] })
      queryClient.invalidateQueries({ queryKey: ['messages', vars.conversationId] })
    },
  })
}

/**
 * Hook lấy danh sách thành viên trong nhóm.
 */
export function useGroupMembers(conversationId: number | null) {
  return useQuery({
    queryKey: ['group-members', conversationId],
    queryFn: async () => {
      if (!conversationId) return []
      const res = await chatApi.getGroupMembers(conversationId)
      return res.data
    },
    enabled: !!conversationId,
  })
}
