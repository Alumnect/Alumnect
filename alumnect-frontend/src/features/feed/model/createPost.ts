import { z } from 'zod'
import { POST_TYPES } from './post'

/**
 * Model & schema cho UC14 - Create a post on the Feed.
 * Định nghĩa dữ liệu form soạn bài và schema Zod validate phía Client
 * (khớp 100% với ràng buộc của `CreatePostRequest` + tầng Service ở Backend).
 */

export const POST_TYPE_LABELS: Record<(typeof POST_TYPES)[number], string> = {
  normal: 'Bài thường',
  achievement: 'Thành tựu',
  recruitment: 'Tuyển dụng',
  event: 'Sự kiện',
}

/** Giới hạn độ dài nội dung — đồng bộ @Size(max=5000) ở Backend. */
export const POST_CONTENT_MAX = 5000

/**
 * Schema Zod validate form tạo bài viết. Thông điệp lỗi trùng khớp Backend:
 *  - content: bắt buộc, tối đa 5000 ký tự.
 *  - type/visibility: enum có giá trị mặc định normal/public.
 *  - imageUrl: tùy chọn (do luồng upload R2 điền vào sau khi tải ảnh thành công).
 */
export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .max(POST_CONTENT_MAX, `Nội dung bài viết không được vượt quá ${POST_CONTENT_MAX} ký tự`),
  type: z.enum(POST_TYPES).default('normal'),
  /** Legacy field kept for backward compat; prefer mediaUrls */
  imageUrl: z.string().max(500).optional(),
  /** Danh sách URL ảnh đính kèm (nhiều ảnh, tối đa 10). */
  mediaUrls: z.array(z.string()).max(10).default([]),
  
  job: z.object({
    title: z.string().trim().optional(),
    company: z.string().trim().optional(),
    location: z.string().optional(),
    salaryMin: z.number().or(z.nan().transform(() => undefined)).optional(),
    salaryMax: z.number().or(z.nan().transform(() => undefined)).optional(),
    applyUrl: z.string().optional(),
    contactEmail: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  }).optional(),

  event: z.object({
    title: z.string().trim().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.string().optional(),
    capacity: z.number().or(z.nan().transform(() => undefined)).optional(),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'recruitment') {
    if (!data.job?.title) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập chức danh', path: ['job', 'title'] })
    if (!data.job?.company) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập công ty', path: ['job', 'company'] })
  }
  if (data.type === 'event') {
    if (!data.event?.title) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập tên sự kiện', path: ['event', 'title'] })
    if (!data.event?.startTime) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Bắt buộc nhập thời gian bắt đầu', path: ['event', 'startTime'] })
    } else if (data.event?.endTime) {
      const start = new Date(data.event.startTime).getTime()
      const end = new Date(data.event.endTime).getTime()
      if (end <= start) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['event', 'endTime'] })
      }
    }
  }
  if (data.type === 'normal' && data.content.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Nội dung bài viết không được để trống', path: ['content'] })
  }
})
export type CreatePostInput = z.infer<typeof createPostSchema>
