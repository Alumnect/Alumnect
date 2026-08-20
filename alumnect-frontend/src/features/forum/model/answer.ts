import { z } from 'zod'

/**
 * Model & schema cho tính năng UC41 - Answer a question (diễn đàn Q&A).
 * Định nghĩa kiểu dữ liệu một câu trả lời và schema Zod xác thực dữ liệu từ API
 * `GET /api/v1/questions/{id}/answers`, cùng schema form gửi câu trả lời mới.
 */

/**
 * Schema Zod cho một câu trả lời. Dùng `safeParse` khi nhận dữ liệu từ API để loại bỏ
 * phần tử hỏng thay vì làm sập cả trang; `.default` giúp dữ liệu thiếu trường vẫn render.
 */
export const answerSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  authorId: z.union([z.string(), z.number()]).transform(String).optional().nullable().default(null),
  body: z.string().default(''),
  author: z.string().default('Ẩn danh'),
  avatar: z.string().default(''),
  authorHeadline: z.string().default(''),
  verified: z.boolean().default(false),
  votes: z.number().default(0),
  time: z.string().default(''),
  createdAt: z.string().default(''),
})
export type Answer = z.infer<typeof answerSchema>

/**
 * Schema Zod cho form gửi câu trả lời mới (UC41).
 * Thông điệp lỗi khớp 100% với validation phía Backend (CreateAnswerRequest).
 */
export const createAnswerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Nội dung câu trả lời không được để trống')
    .max(10000, 'Nội dung câu trả lời không được vượt quá 10000 ký tự'),
})
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>

/**
 * Một trang kết quả danh sách câu trả lời đã chuẩn hóa cho phân trang / tải thêm.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type AnswerPageResult = {
  items: Answer[]
  page: number
  hasMore: boolean
  /** Tổng số câu trả lời THỰC TẾ (từ totalElements của backend) — để hiển thị đúng, khớp danh sách. */
  total: number
}
