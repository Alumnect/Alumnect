import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { TASK_QUERY_KEYS } from './useMentoringTasks'
import type {
  CreateDeadlineExtensionPayload,
  RespondDeadlineExtensionPayload,
  CreateTaskAmendmentPayload,
  RespondTaskAmendmentPayload,
  CreateSettlementProposalPayload,
  RespondSettlementProposalPayload,
  MentoringTaskDeadlineExtension,
  MentoringTaskAmendment,
  MentoringTaskSettlementProposal,
} from '../model/mentoringTaskTypes'

export const RESOLUTION_QUERY_KEYS = {
  all: ['mentoringTaskResolutions'] as const,
  extensions: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'extensions', taskId] as const,
  activeExtension: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'activeExtension', taskId] as const,
  amendments: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'amendments', taskId] as const,
  activeAmendment: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'activeAmendment', taskId] as const,
  settlements: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'settlements', taskId] as const,
  activeSettlement: (taskId?: number) => [...RESOLUTION_QUERY_KEYS.all, 'activeSettlement', taskId] as const,
}

/**
 * Hook truy vấn danh sách đề xuất gia hạn deadline của Task (UC109).
 */
export function useTaskDeadlineExtensions(taskId?: number) {
  return useQuery<MentoringTaskDeadlineExtension[], Error>({
    queryKey: RESOLUTION_QUERY_KEYS.extensions(taskId),
    queryFn: () => mentoringTaskApi.getDeadlineExtensions(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook truy vấn đề xuất gia hạn deadline đang hoạt động (UC109).
 */
export function useActiveDeadlineExtension(taskId?: number) {
  return useQuery<MentoringTaskDeadlineExtension | null, Error>({
    queryKey: RESOLUTION_QUERY_KEYS.activeExtension(taskId),
    queryFn: () => mentoringTaskApi.getActiveExtension(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook tạo đề xuất gia hạn Deadline Task (UC109).
 */
export function useCreateDeadlineExtension(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskDeadlineExtension,
    Error,
    CreateDeadlineExtensionPayload
  >({
    mutationFn: (payload) => {
      if (!taskId) throw new Error('Task ID không hợp lệ')
      return mentoringTaskApi.createDeadlineExtension(taskId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.extensions(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeExtension(taskId) })
    },
  })
}

/**
 * Hook phản hồi (chấp nhận hoặc từ chối) gia hạn Deadline (UC109).
 */
export function useRespondDeadlineExtension(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskDeadlineExtension,
    Error,
    { extensionId: number; payload: RespondDeadlineExtensionPayload }
  >({
    mutationFn: ({ extensionId, payload }) =>
      mentoringTaskApi.respondDeadlineExtension(extensionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.extensions(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeExtension(taskId) })
    },
  })
}

/**
 * Hook truy vấn danh sách các phiên bản điều chỉnh của Task (UC109).
 */
export function useTaskAmendments(taskId?: number) {
  return useQuery<MentoringTaskAmendment[], Error>({
    queryKey: RESOLUTION_QUERY_KEYS.amendments(taskId),
    queryFn: () => mentoringTaskApi.getTaskAmendments(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook tạo Ticket điều chỉnh Task và bổ sung tiền (UC109, mục 5.8).
 */
export function useCreateTaskAmendment(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskAmendment,
    Error,
    CreateTaskAmendmentPayload
  >({
    mutationFn: (payload) => {
      if (!taskId) throw new Error('Task ID không hợp lệ')
      return mentoringTaskApi.createTaskAmendment(taskId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.amendments(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeAmendment(taskId) })
    },
  })
}

/**
 * Hook phản hồi Ticket điều chỉnh Task (UC109).
 */
export function useRespondTaskAmendment(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskAmendment,
    Error,
    { amendmentId: number; payload: RespondTaskAmendmentPayload }
  >({
    mutationFn: ({ amendmentId, payload }) =>
      mentoringTaskApi.respondTaskAmendment(amendmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.amendments(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeAmendment(taskId) })
    },
  })
}

/**
 * Hook truy vấn danh sách đề xuất dừng Task và phân chia tiền (UC109).
 */
export function useTaskSettlementProposals(taskId?: number) {
  return useQuery<MentoringTaskSettlementProposal[], Error>({
    queryKey: RESOLUTION_QUERY_KEYS.settlements(taskId),
    queryFn: () => mentoringTaskApi.getSettlementProposals(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook tạo đề xuất dừng Task và phân chia tiền (UC109, mục 5.6).
 */
export function useCreateSettlementProposal(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskSettlementProposal,
    Error,
    CreateSettlementProposalPayload
  >({
    mutationFn: (payload) => {
      if (!taskId) throw new Error('Task ID không hợp lệ')
      return mentoringTaskApi.createSettlementProposal(taskId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.settlements(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeSettlement(taskId) })
    },
  })
}

/**
 * Hook phản hồi đề xuất dừng Task và phân chia tiền (UC109).
 */
export function useRespondSettlementProposal(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskSettlementProposal,
    Error,
    { proposalId: number; payload: RespondSettlementProposalPayload }
  >({
    mutationFn: ({ proposalId, payload }) =>
      mentoringTaskApi.respondSettlementProposal(proposalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.settlements(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.activeSettlement(taskId) })
    },
  })
}

/**
 * Hủy / từ chối đề xuất trong Task: Mentor rút lại gia hạn hoặc điều chỉnh, người tạo rút lại đề xuất dừng Task,
 * Học viên từ chối thanh toán bổ sung.
 */
export function useCloseTaskProposal(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    unknown,
    Error,
    { kind: 'EXTENSION' | 'AMENDMENT' | 'SETTLEMENT'; id: number; reason?: string }
  >({
    mutationFn: ({ kind, id, reason }) => {
      if (kind === 'EXTENSION') return mentoringTaskApi.cancelDeadlineExtension(id)
      if (kind === 'AMENDMENT') return mentoringTaskApi.cancelTaskAmendment(id, reason)
      return mentoringTaskApi.cancelSettlementProposal(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: RESOLUTION_QUERY_KEYS.all })
    },
  })
}
