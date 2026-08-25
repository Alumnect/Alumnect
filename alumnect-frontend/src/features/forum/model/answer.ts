import { z } from 'zod'

/**
 * Model & schema cho tính năng UC41 - Answer a question (diễn đàn Q&A).
 * Định nghĩa kiểu dữ liệu một câu trả lời và schema Zod xác thực dữ liệu từ API
 * `GET /api/v1/questions/{id}/answers`, cùng schema form gửi câu trả lời mới.
 */

/**
 * Các trường cơ bản của một câu trả lời (không gồm danh sách reply con).
 * Dùng chung cho câu trả lời gốc và các reply — reply là câu trả lời có `parentId`.
 */
const answerBaseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  parentId: z.union([z.string(), z.number()]).transform(String).optional().nullable().default(null),
  authorId: z.union([z.string(), z.number()]).transform(String).optional().nullable().default(null),
  body: z.string().default(''),
  author: z.string().default('Ẩn danh'),
  avatar: z.string().default(''),
  authorHeadline: z.string().default(''),
  verified: z.boolean().default(false),
  votes: z.number().default(0),
  time: z.string().default(''),
  createdAt: z.string().default(''),
  edited: z.boolean().default(false),
})

/**
 * Schema Zod cho một câu trả lời (mô hình 2 cấp: câu trả lời gốc + danh sách `replies`).
 * Dùng `safeParse` khi nhận dữ liệu từ API để loại bỏ phần tử hỏng thay vì làm sập cả trang.
 */
export const answerSchema = answerBaseSchema.extend({
  replies: z.array(answerBaseSchema).default([]),
})
export type Answer = z.infer<typeof answerSchema>

/**
 * Schema Zod cho form gửi/sửa câu trả lời (UC41 - Answer, UC48 - Edit an answer).
 * Thông điệp lỗi khớp 100% với validation phía Backend (CreateAnswerRequest/UpdateAnswerRequest).
 */
export const createAnswerSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Nội dung câu trả lời không được để trống')
    .max(10000, 'Nội dung câu trả lời không được vượt quá 10000 ký tự'),
})
export type CreateAnswerInput = z.infer<typeof createAnswerSchema>

/** Form sửa câu trả lời (UC48) dùng chung schema với tạo mới. */
export type UpdateAnswerInput = CreateAnswerInput

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
