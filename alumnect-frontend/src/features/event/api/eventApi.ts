import http from '@/lib/http'
import {
  eventRegistrationResultSchema,
  eventAttendeeSchema,
  eventCancelResultSchema,
  eventHistoryPageSchema,
  type EventRegistrationResult,
  type EventAttendee,
  type EventCancelResult,
  type EventHistoryPage,
  type EventHistoryFilter,
} from '../model/event'

function extractData(body: unknown): unknown {
  const b = body as Record<string, unknown> | undefined
  return b?.data ?? b
}

/**
 * Tầng gọi API cho Event (UC25, UC27, UC28).
 */
export const eventApi = {
  /**
   * Đăng ký tham gia sự kiện (RSVP)
   */
  rsvpEvent: async (eventId: number | string): Promise<EventRegistrationResult> => {
    const body = await http.post(`/events/${encodeURIComponent(String(eventId))}/rsvp`)
    return eventRegistrationResultSchema.parse(extractData(body))
  },

  /**
   * Hủy đăng ký tham gia sự kiện (Cancel RSVP)
   */
  cancelRsvp: async (eventId: number | string): Promise<EventRegistrationResult> => {
    const body = await http.delete(`/events/${encodeURIComponent(String(eventId))}/rsvp`)
    return eventRegistrationResultSchema.parse(extractData(body))
  },

  /**
   * Lấy trạng thái đăng ký RSVP hiện tại của người dùng đối với sự kiện
   */
  getRsvpStatus: async (eventId: number | string): Promise<EventRegistrationResult> => {
    const body = await http.get(`/events/${encodeURIComponent(String(eventId))}/rsvp`)
    return eventRegistrationResultSchema.parse(extractData(body))
  },

  /**
   * Lấy danh sách người tham gia sự kiện (UC25, UC29 - View event attendee list)
   */
  getAttendees: async (
    eventId: number | string,
    params?: { search?: string; role?: string }
  ): Promise<EventAttendee[]> => {
    const body = await http.get(`/events/${encodeURIComponent(String(eventId))}/attendees`, {
      params,
    })
    const data = extractData(body)
    const rawItems = Array.isArray(data) ? data : []
    const items: EventAttendee[] = []
    for (const r of rawItems) {
      const parsed = eventAttendeeSchema.safeParse(r)
      if (parsed.success) {
        items.push(parsed.data)
      }
    }
    return items
  },

  /**
   * Hủy sự kiện (UC27 - Cancel an event)
   */
  cancelEvent: async (eventId: number | string): Promise<EventCancelResult> => {
    const body = await http.delete(`/events/${encodeURIComponent(String(eventId))}`)
    return eventCancelResultSchema.parse(extractData(body))
  },

  /**
   * Xem lịch sử tham gia sự kiện của người dùng hiện tại (UC28 - View attended-event history)
   */
  getEventHistory: async (
    page = 0,
    size = 10,
    filter: EventHistoryFilter = 'all'
  ): Promise<EventHistoryPage> => {
    const body = await http.get('/events/my-history', {
      params: { page, size, filter },
    })
    return eventHistoryPageSchema.parse(extractData(body))
  },
}

