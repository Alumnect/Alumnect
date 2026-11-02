import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mentoringRequestApi } from '../api/mentoringRequestApi'
import type { RespondMentoringRequestPayload } from '../model/mentoringRequestTypes'

interface RespondRequestVariables {
  requestId: number
  payload?: RespondMentoringRequestPayload
}

/**
 * Custom mutation hook cho Mentor chấp nhận (ACCEPT) yêu cầu Mentoring (UC103).
 * Khi thành công, tự động làm mới cache danh sách incoming-requests và chi tiết yêu cầu.
 */
export function useAcceptIncomingRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, payload }: RespondRequestVariables) =>
      mentoringRequestApi.acceptIncomingRequest(requestId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'incoming-requests'] })
      queryClient.invalidateQueries({
        queryKey: ['mentoring', 'incoming-requests', 'detail', variables.requestId],
      })
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] })
    },
  })
}

/**
 * Custom mutation hook cho Mentor từ chối (DECLINE) yêu cầu Mentoring (UC103).
 * Khi thành công, tự động làm mới cache danh sách incoming-requests và chi tiết yêu cầu.
 */
export function useDeclineIncomingRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ requestId, payload }: RespondRequestVariables) =>
      mentoringRequestApi.declineIncomingRequest(requestId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'incoming-requests'] })
      queryClient.invalidateQueries({
        queryKey: ['mentoring', 'incoming-requests', 'detail', variables.requestId],
      })
      queryClient.invalidateQueries({ queryKey: ['mentoring', 'requests'] })
    },
  })
}
