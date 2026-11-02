import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mentoringTaskApi } from '../api/mentoringTaskApi'
import { TASK_QUERY_KEYS } from './useMentoringTasks'
import type {
  MentoringTaskCompletion,
  SubmitTaskCompletionPayload,
  RespondTaskCompletionPayload,
} from '../model/mentoringTaskTypes'

export const COMPLETION_QUERY_KEYS = {
  all: ['mentoringTaskCompletions'] as const,
  latest: (taskId?: number) => [...COMPLETION_QUERY_KEYS.all, 'latest', taskId] as const,
  history: (taskId?: number) => [...COMPLETION_QUERY_KEYS.all, 'history', taskId] as const,
}

/**
 * Hook truy vấn lần nộp kết quả nghiệm thu mới nhất của Task (UC110).
 */
export function useLatestTaskCompletion(taskId?: number) {
  return useQuery<MentoringTaskCompletion | null, Error>({
    queryKey: COMPLETION_QUERY_KEYS.latest(taskId),
    queryFn: () => mentoringTaskApi.getLatestTaskCompletion(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook truy vấn lịch sử các lần nộp kết quả nghiệm thu của Task (UC110).
 */
export function useTaskCompletionHistory(taskId?: number) {
  return useQuery<MentoringTaskCompletion[], Error>({
    queryKey: COMPLETION_QUERY_KEYS.history(taskId),
    queryFn: () => mentoringTaskApi.getTaskCompletionHistory(taskId!),
    enabled: typeof taskId === 'number' && taskId > 0,
  })
}

/**
 * Hook Mentor nộp kết quả hoàn thành nhiệm vụ (UC110).
 */
export function useSubmitTaskCompletion(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<MentoringTaskCompletion, Error, SubmitTaskCompletionPayload>({
    mutationFn: (payload) => {
      if (!taskId) throw new Error('Task ID không hợp lệ')
      return mentoringTaskApi.submitTaskCompletion(taskId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETION_QUERY_KEYS.all })
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      }
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
    },
  })
}

/**
 * Hook Student phản hồi nghiệm thu kết quả Task (UC110 - Xác nhận hoặc Từ chối).
 */
export function useRespondTaskCompletion(taskId?: number) {
  const queryClient = useQueryClient()
  return useMutation<
    MentoringTaskCompletion,
    Error,
    { completionId: number; payload: RespondTaskCompletionPayload }
  >({
    mutationFn: ({ completionId, payload }) => {
      if (!taskId) throw new Error('Task ID không hợp lệ')
      return mentoringTaskApi.respondTaskCompletion(taskId, completionId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLETION_QUERY_KEYS.all })
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.detail(taskId) })
      }
      queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
    },
  })
}
