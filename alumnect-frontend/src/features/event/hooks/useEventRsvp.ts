import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventApi } from '../api/eventApi'
import type { EventRegistrationResult, EventAttendee } from '../model/event'

/**
 * Hook truy vấn trạng thái RSVP của người dùng hiện tại đối với sự kiện (UC25).
 */
export function useRsvpStatus(eventId?: number | string) {
  return useQuery<EventRegistrationResult, Error>({
    queryKey: ['event-rsvp', String(eventId)],
    queryFn: () => eventApi.getRsvpStatus(eventId!),
    enabled: Boolean(eventId),
    staleTime: 1000 * 60, // 1 phút
  })
}

/**
 * Hook lấy danh sách người tham gia sự kiện (UC25).
 */
export function useEventAttendees(eventId?: number | string) {
  return useQuery<EventAttendee[], Error>({
    queryKey: ['event-attendees', String(eventId)],
    queryFn: () => eventApi.getAttendees(eventId!),
    enabled: Boolean(eventId),
    staleTime: 1000 * 60,
  })
}

/**
 * Hook thực hiện đăng ký / hủy đăng ký tham gia sự kiện (RSVP) (UC25).
 */
export function useToggleRsvp() {
  const queryClient = useQueryClient()

  return useMutation<EventRegistrationResult, Error, { eventId: number | string; register: boolean }>({
    mutationFn: ({ eventId, register }) =>
      register ? eventApi.rsvpEvent(eventId) : eventApi.cancelRsvp(eventId),
    onSuccess: (_data, variables) => {
      const idStr = String(variables.eventId)
      queryClient.invalidateQueries({ queryKey: ['event-rsvp', idStr] })
      queryClient.invalidateQueries({ queryKey: ['event-attendees', idStr] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post'] })
      queryClient.invalidateQueries({ queryKey: ['event-history'] })
    },
  })
}
