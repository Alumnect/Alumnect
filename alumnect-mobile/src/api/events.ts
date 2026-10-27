import http from '@/lib/http'
import type { ApiResponse, PageResponse } from '@/lib/http'

export interface RsvpResult {
  eventId: number
  registered: boolean
  attendeeCount: number
  capacity?: number | null
  message?: string
}

export interface EventDetail extends RsvpResult {
  postId: number
  title: string
  location?: string | null
  startTime: string
  endTime?: string | null
  status: string
  organizerId: number
  organizerName: string
  started: boolean
  canRegister: boolean
  canCancelRegistration: boolean
  canCancel: boolean
}

export interface Attendee {
  userId: number
  fullName: string
  avatarUrl: string | null
  headline: string | null
  role: string | null
  registeredAt: string | null
}

export interface EventHistoryItem {
  registrationId: number
  registrationStatus: string
  eventId: number
  title: string
  location?: string | null
  startTime?: string | null
  endTime?: string | null
  capacity?: number | null
  attendeeCount: number
  eventStatus: string
  postId?: number | null
  coverUrl?: string | null
  organizerName?: string | null
  attendanceState: string
}

export type HistoryFilter = 'all' | 'upcoming' | 'past' | 'cancelled'

export const eventApi = {
  detail: (id: string) => http.get<unknown, ApiResponse<EventDetail>>(`/events/${id}`),
  rsvp: (id: string) => http.post<unknown, ApiResponse<RsvpResult>>(`/events/${id}/rsvp`),
  cancelRsvp: (id: string) => http.delete<unknown, ApiResponse<RsvpResult>>(`/events/${id}/rsvp`),
  status: (id: string) => http.get<unknown, ApiResponse<RsvpResult>>(`/events/${id}/rsvp`),
  attendees: (id: string, params?: { search?: string; role?: string }) =>
    http.get<unknown, ApiResponse<Attendee[]>>(`/events/${id}/attendees`, { params }),
  cancelEvent: (id: string) => http.delete<unknown, ApiResponse<{ eventId: number; status: string }>>(`/events/${id}`),
  history: (page = 0, filter: HistoryFilter = 'all') =>
    http.get<unknown, ApiResponse<PageResponse<EventHistoryItem>>>('/events/my-history', { params: { page, size: 10, filter } }),
}
