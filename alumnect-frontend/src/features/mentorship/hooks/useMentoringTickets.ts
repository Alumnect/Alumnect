import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import type {
  MentoringSettlementSnapshot,
  MentoringDisputeTicket,
  CreateDisputeTicketPayload,
  TicketEvidence,
  TicketEvidencePayload,
} from '../model/mentoringTaskTypes'

/**
 * Hook truy vấn Settlement Snapshot trước khi gửi Ticket lên Admin (UC111).
 */
export function useSettlementSnapshot(taskId: number, enabled = true) {
  return useQuery<MentoringSettlementSnapshot>({
    queryKey: ['mentoring-task', taskId, 'settlement-snapshot'],
    queryFn: () => mentoringTaskApi.getSettlementSnapshot(taskId),
    enabled: !!taskId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook gửi Settlement Ticket đã thỏa thuận lên Admin (UC111).
 */
export function useSubmitSettlementTicket(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringDisputeTicket,
    Error,
    { proposalId: number; note?: string }
  >({
    mutationFn: (payload) => mentoringTaskApi.submitSettlementTicket(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'settlement-snapshot'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    },
  })
}

/**
 * Hook tạo Dispute Ticket khiếu nại tranh chấp gửi Admin (UC112).
 */
export function useCreateDisputeTicket(taskId: number) {
  const queryClient = useQueryClient()

  return useMutation<
    MentoringDisputeTicket,
    Error,
    CreateDisputeTicketPayload
  >({
    mutationFn: (payload) => mentoringTaskApi.createDisputeTicket(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    },
  })
}

/**
 * Hook lấy Ticket đang mở hoặc đang xử lý của Task (UC111 & UC112).
 */
export function useActiveTicket(taskId: number, enabled = true) {
  return useQuery<MentoringDisputeTicket | null>({
    queryKey: ['mentoring-task', taskId, 'tickets', 'active'],
    queryFn: () => mentoringTaskApi.getActiveTicket(taskId),
    enabled: !!taskId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook lấy toàn bộ lịch sử Ticket của Task (UC111 & UC112).
 */
export function useTaskTickets(taskId: number, enabled = true) {
  return useQuery<MentoringDisputeTicket[]>({
    queryKey: ['mentoring-task', taskId, 'tickets'],
    queryFn: () => mentoringTaskApi.getTaskTickets(taskId),
    enabled: !!taskId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook lấy danh sách bằng chứng tranh chấp của Ticket (UC112 & UC113).
 */
export function useTicketEvidences(ticketId?: number, enabled = true) {
  return useQuery<TicketEvidence[]>({
    queryKey: ['mentoring-ticket', ticketId, 'evidences'],
    queryFn: () => (ticketId ? mentoringTaskApi.getTicketEvidences(ticketId) : Promise.resolve([])),
    enabled: !!ticketId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook bổ sung bằng chứng tranh chấp cho Ticket đang mở (UC113).
 */
export function useAddTicketEvidence(taskId: number, ticketId: number) {
  const queryClient = useQueryClient()

  return useMutation<
    TicketEvidence,
    Error,
    TicketEvidencePayload
  >({
    mutationFn: (payload) => mentoringTaskApi.addTicketEvidence(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-ticket', ticketId, 'evidences'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-task', taskId, 'tickets', 'active'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-tasks'] })
    },
  })
}
