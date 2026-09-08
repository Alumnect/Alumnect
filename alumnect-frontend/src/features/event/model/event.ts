import { z } from 'zod'

/**
 * Model cho UC25 - Register to attend an event (RSVP).
 */

export const eventRegistrationResultSchema = z.object({
  eventId: z.number(),
  registered: z.boolean(),
  attendeeCount: z.number(),
  capacity: z.number().nullable().optional(),
  message: z.string().optional(),
})

export type EventRegistrationResult = z.infer<typeof eventRegistrationResultSchema>

export const eventAttendeeSchema = z.object({
  userId: z.number(),
  fullName: z.string().default('Ẩn danh'),
  avatarUrl: z.string().default(''),
  headline: z.string().default(''),
  role: z.string().default(''),
  registeredAt: z.string().default(''),
})

export type EventAttendee = z.infer<typeof eventAttendeeSchema>

/**
 * Model cho UC27 - Cancel an event.
 */
export const eventCancelResultSchema = z.object({
  eventId: z.number(),
  status: z.string(),
  message: z.string().optional(),
})

export type EventCancelResult = z.infer<typeof eventCancelResultSchema>

/**
 * Model cho UC28 - View attended-event history.
 */
export const eventHistoryItemSchema = z.object({
  registrationId: z.number(),
  registrationStatus: z.string().default('REGISTERED'),
  registeredAt: z.string().nullable().optional(),
  eventId: z.number(),
  title: z.string().default(''),
  location: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  attendeeCount: z.number().default(0),
  eventStatus: z.string().default('ACTIVE'),
  postId: z.number().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  organizerId: z.number().nullable().optional(),
  organizerName: z.string().nullable().optional(),
  organizerAvatar: z.string().nullable().optional(),
  attendanceState: z.string().default('UPCOMING'),
})

export type EventHistoryItem = z.infer<typeof eventHistoryItemSchema>

export const eventHistoryPageSchema = z.object({
  content: z.array(eventHistoryItemSchema).default([]),
  pageNumber: z.number().default(0),
  pageSize: z.number().default(10),
  totalElements: z.number().default(0),
  totalPages: z.number().default(0),
  last: z.boolean().default(true),
})

export type EventHistoryPage = z.infer<typeof eventHistoryPageSchema>

export type EventHistoryFilter = 'all' | 'upcoming' | 'past' | 'cancelled'
