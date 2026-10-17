import { useQuery } from '@tanstack/react-query'
import { mentoringConversationApi } from '../api/mentoringConversationApi'
import type { MentoringConversationContext } from '../model/mentoringConversationTypes'

/**
 * Query keys của Chat for Task. Mọi thao tác Deal / Payment đều invalidate nhóm khóa này
 * để ngữ cảnh (trạng thái chỉ đọc, phiên bản Deal, Task) luôn khớp dữ liệu backend.
 */
export const MENTORING_CONVERSATION_QUERY_KEYS = {
  all: ['mentoringConversations'] as const,
  detail: (conversationId?: number) => [...MENTORING_CONVERSATION_QUERY_KEYS.all, 'detail', conversationId] as const,
  byRequest: (requestId?: number) => [...MENTORING_CONVERSATION_QUERY_KEYS.all, 'byRequest', requestId] as const,
}

/**
 * Hook lấy ngữ cảnh Chat for Task theo conversationId (Request, Deal, Payment, Task, quyền thao tác).
 */
export function useMentoringConversation(conversationId?: number) {
  return useQuery<MentoringConversationContext, Error>({
    queryKey: MENTORING_CONVERSATION_QUERY_KEYS.detail(conversationId),
    queryFn: () => mentoringConversationApi.getContext(conversationId!),
    enabled: typeof conversationId === 'number' && conversationId > 0,
    retry: false,
  })
}

/**
 * Hook lấy các Chat for Task của một Request (Học viên thấy mọi Mentor đã ACCEPT).
 */
export function useRequestConversations(requestId?: number) {
  return useQuery<MentoringConversationContext[], Error>({
    queryKey: MENTORING_CONVERSATION_QUERY_KEYS.byRequest(requestId),
    queryFn: () => mentoringConversationApi.getByRequest(requestId!),
    enabled: typeof requestId === 'number' && requestId > 0,
  })
}
