import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { mentoringDealApi } from '../api/mentoringDealApi'
import { MENTORING_CONVERSATION_QUERY_KEYS } from './useMentoringConversation'
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
 * Làm mới toàn bộ dữ liệu phụ thuộc Deal sau mỗi thao tác: danh sách / chi tiết Deal và
 * ngữ cảnh Chat for Task (trạng thái chỉ đọc, phiên bản mới nhất, quyền thao tác).
 */
function invalidateDealFlow(queryClient: QueryClient, deal: MentoringDeal) {
  queryClient.invalidateQueries({ queryKey: DEAL_QUERY_KEYS.all })
  queryClient.invalidateQueries({ queryKey: MENTORING_CONVERSATION_QUERY_KEYS.all })
  if (deal.requestId) {
    // Trạng thái Request (MATCHED / Mentor được chọn) và danh sách yêu cầu của Mentor cũng thay đổi theo Deal
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] })
    queryClient.invalidateQueries({ queryKey: ['mentoring', 'incoming-requests'] })
  }
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
 * Hook truy vấn chi tiết một Deal và danh sách phiên bản (UC104).
 */
export function useDealDetail(dealId?: number) {
  return useQuery<MentoringDealDetail, Error>({
    queryKey: DEAL_QUERY_KEYS.detail(dealId),
    queryFn: () => mentoringDealApi.getDealDetail(dealId!),
    enabled: typeof dealId === 'number' && dealId > 0,
  })
}

/**
 * Hook truy vấn luồng Deal của một Chat for Task (UC104).
 */
export function useDealByConversation(conversationId?: number) {
  return useQuery<MentoringDealDetail | null, Error>({
    queryKey: DEAL_QUERY_KEYS.byConversation(conversationId),
    queryFn: () => mentoringDealApi.getDealByConversation(conversationId!),
    enabled: typeof conversationId === 'number' && conversationId > 0,
  })
}

/**
 * Mutation Mentor gửi Deal Ticket trong Chat for Task: "Chấp nhận Deal theo Request" hoặc "Deal lại" (UC104).
 */
export function useProposeDeal() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, ProposeDealPayload>({
    mutationFn: (payload) => mentoringDealApi.proposeDeal(payload),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
  })
}

/**
 * Mutation Mentor deal lại trên Deal đã có, sinh phiên bản mới (UC104).
 */
export function useUpdateDealTerms() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, { dealId: number; payload: UpdateDealPayload }>({
    mutationFn: ({ dealId, payload }) => mentoringDealApi.updateDealTerms(dealId, payload),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
  })
}

/**
 * Mutation xác nhận đúng phiên bản Deal Ticket đang xem (UC104). Không tạo Task.
 */
export function useConfirmDeal() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, { dealId: number; version: number }>({
    mutationFn: ({ dealId, version }) => mentoringDealApi.confirmDeal(dealId, version),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
    // Phiên bản đã bị thay thế: vẫn làm mới để người dùng thấy phiên bản mới nhất
    onError: () => queryClient.invalidateQueries({ queryKey: MENTORING_CONVERSATION_QUERY_KEYS.all }),
  })
}

/**
 * Mutation hủy bỏ luồng Deal khi chưa khóa (UC104).
 */
export function useCancelDeal() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, { dealId: number; reason?: string }>({
    mutationFn: ({ dealId, reason }) => mentoringDealApi.cancelDeal(dealId, reason),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
  })
}

/**
 * Mutation Học viên từ chối phiên bản Deal Ticket hiện tại (UC104).
 */
export function useRejectDeal() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, { dealId: number; reason?: string; version?: number }>({
    mutationFn: ({ dealId, reason, version }) => mentoringDealApi.rejectDeal(dealId, reason, version),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
    onError: () => queryClient.invalidateQueries({ queryKey: MENTORING_CONVERSATION_QUERY_KEYS.all }),
  })
}

/**
 * Mutation Học viên yêu cầu Mentor điều chỉnh phiên bản hiện tại (UC104).
 */
export function useRequestAdjustment() {
  const queryClient = useQueryClient()
  return useMutation<MentoringDeal, Error, { dealId: number; note?: string; version?: number }>({
    mutationFn: ({ dealId, note, version }) => mentoringDealApi.requestAdjustment(dealId, note, version),
    onSuccess: (data) => invalidateDealFlow(queryClient, data),
    onError: () => queryClient.invalidateQueries({ queryKey: MENTORING_CONVERSATION_QUERY_KEYS.all }),
  })
}
