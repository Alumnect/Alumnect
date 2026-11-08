import { z } from 'zod'
import { POST_TYPES } from './post'

/**
 * Model & schema cho AI Studio [B1] — kết quả `POST /api/v1/posts/ai-studio`.
 * Schema khoan dung (nullish/default) để dữ liệu thiếu trường vẫn dùng được, không làm sập modal.
 */

export const aiStudioSchema = z.object({
  detectedType: z.enum(POST_TYPES).catch('normal'),
  polishedContent: z.string().default(''),
  jobData: z
    .object({
      title: z.string().nullish(),
      company: z.string().nullish(),
      location: z.string().nullish(),
      salaryMin: z.number().nullish(),
      salaryMax: z.number().nullish(),
      contactEmail: z.string().nullish(),
      applyUrl: z.string().nullish(),
    })
    .nullish(),
  eventData: z
    .object({
      title: z.string().nullish(),
      location: z.string().nullish(),
      startTime: z.string().nullish(),
      endTime: z.string().nullish(),
      capacity: z.number().nullish(),
    })
    .nullish(),
  posterSpec: z.object({
    illustrationScene: z.string().default('COMMUNITY_NETWORK_GLOBE'),
    colorPalette: z.string().default('FPT_SIGNATURE'),
    badgeText: z.string().nullish(),
    headline: z.string().default(''),
    subheadline: z.string().nullish(),
    highlightPill: z.string().nullish(),
    locationText: z.string().nullish(),
    bulletPoints: z.array(z.string()).nullish(),
  }),
  /** "GEMINI" hoặc "LOCAL_FALLBACK" (Gemini chậm/lỗi -> dùng mẫu cục bộ). */
  source: z.string().default('GEMINI'),
})

export type AiStudioResult = z.infer<typeof aiStudioSchema>
