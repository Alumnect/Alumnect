import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentoringDealApi } from '../api/mentoringDealApi'
import type {
  MentoringDeal,
  MentoringDealDetail,
  MentoringDealStatus,
  PageResponse,
  ProposeDealPayload,
  UpdateDealPayload,
} from '../model/mentoringDealTypes'

export const DEAL_QUERY_KEYS = {
  all: ['mentoringDeals'] as const,
  lists: () => [...DEAL_QUERY_KEYS.all, 'list'] as const,
  list: (status?: MentoringDealStatus, page = 0, size = 10) =>
    [...DEAL_QUERY_KEYS.lists(), { status, page, size }] as const,
  details: () => [...DEAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id?: number) => [...DEAL_QUERY_KEYS.details(), id] as const,
  byConversation: (conversationId?: number) =>
    [...DEAL_QUERY_KEYS.all, 'byConversation', conversationId] as const,
}

/**
 * Hook truy vấn danh sách phân trang các Deal của người dùng (UC104).
 */
export function useMyDeals(status?: MentoringDealStatus, page = 0, size = 10) {
  return useQuery<PageResponse<MentoringDeal>, Error>({
    queryKey: DEAL_QUERY_KEYS.list(status, page, size),
    queryFn: () => mentoringDealApi.getMyDeals(status, page, size),
  })
}

/**
 * Hook truy vấn chi tiết một Deal và danh sách Snapshot (UC104).
 */
export function useDealDetail(dealId?: number) {
  return useQuery<MentoringDealDetail, Error>({
    queryKey: DEAL_QUERY_KEYS.detail(dealId),
    queryFn: () => mentoringDealApi.getDealDetail(dealId!),
    enabled: typeof dealId === 'number' && dealId > 0,
  })
}

/**
 * Hook truy vấn Deal mới nhất theo ID cuộc trò chuyện Direct Messaging (UC104).
 */
export function useDealByConversation(conversationId?: number) {
  return useQuery<MentoringDealDetail | null, Error>({
    queryKey: DEAL_QUERY_KEYS.byConversation(conversationId),
    queryFn: () => mentoringDealApi.getDealByConversation(conversationId!),
    enabled: typeof conversationId === 'number' && conversationId > 0,
  })
}

/**
 * Mutation khởi tạo đề xuất Deal mới (UC104).
 */
export function useProposeDeal() {
  const queryClient = useQueryClient()

  return useMutation<MentoringDeal, Error, ProposeDealPayload>({
    mutationFn: (payload) => mentoringDealApi.proposeDeal(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: DEAL_QUERY_KEYS.byConversation(data.conversationId),
        })
      }
    },
  })
}

/**
 * Mutation điều chỉnh điều khoản Deal và sinh Snapshot mới (UC104).
 */
export function useUpdateDealTerms() {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringDeal,
    Error,
    { dealId: number; payload: UpdateDealPayload }
  >({
    mutationFn: ({ dealId, payload }) =>
      mentoringDealApi.updateDealTerms(dealId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.detail(data.id) })
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: DEAL_QUERY_KEYS.byConversation(data.conversationId),
        })
      }
    },
  })
}

/**
 * Mutation xác nhận Snapshot Deal hiện tại (UC104).
 */
export function useConfirmDeal() {
  const queryClient = useQueryClient()

  return useMutation<MentoringDeal, Error, number>({
    mutationFn: (dealId) => mentoringDealApi.confirmDeal(dealId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.detail(data.id) })
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: DEAL_QUERY_KEYS.byConversation(data.conversationId),
        })
      }
    },
  })
}

/**
 * Mutation hủy bỏ thỏa thuận Deal (UC104).
 */
export function useCancelDeal() {
  const queryClient = useQueryClient()

  return useMutation<MentoringDeal, Error, { dealId: number; reason?: string }>({
    mutationFn: ({ dealId, reason }) => mentoringDealApi.cancelDeal(dealId, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
      queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.detail(data.id) })
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: DEAL_QUERY_KEYS.byConversation(data.conversationId),
        })
      }
    },
  })
}
