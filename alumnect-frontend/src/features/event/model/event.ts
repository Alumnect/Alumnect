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
