import { useMutation, useQueryClient } from '@tanstack/react-query'
import { eventApi } from '../api/eventApi'
import type { EventCancelResult } from '../model/event'

/**
 * Hook thực hiện hủy sự kiện (UC27 - Cancel an event).
 * Dành riêng cho cựu sinh viên (organizer) hủy sự kiện do mình tạo.
 */
export function useCancelEvent() {
  const queryClient = useQueryClient()

  return useMutation<EventCancelResult, Error, { eventId: number | string }>({
    mutationFn: ({ eventId }) => eventApi.cancelEvent(eventId),
    onSuccess: (_data, variables) => {
      const idStr = String(variables.eventId)
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', idStr] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', idStr] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
    },
  })
}
