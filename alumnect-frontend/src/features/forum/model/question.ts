import { z } from 'zod'

/**
 * Model & schema cho tính năng UC38 - View question list (diễn đàn Q&A).
 * Định nghĩa kiểu dữ liệu một câu hỏi, chủ đề, và schema Zod dùng để xác thực/chuẩn hóa
 * dữ liệu trả về từ API `GET /api/v1/questions` (khoan dung với dữ liệu thiếu trường).
 */

/** Tiêu chí sắp xếp danh sách câu hỏi — khớp tham số `sort` của backend. */
export const SORT_OPTIONS = ['recent', 'votes', 'answers'] as const
export type SortOption = (typeof SORT_OPTIONS)[number]

/**
 * Schema Zod cho một câu hỏi. Dùng `safeParse` khi nhận dữ liệu từ API để loại bỏ
 * phần tử hỏng thay vì làm sập cả trang; `.default` giúp dữ liệu thiếu trường vẫn render.
 */
export const questionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().default(''),
  excerpt: z.string().default(''),
  topic: z.string().default(''),
  author: z.string().default('Ẩn danh'),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  votes: z.number().default(0),
  answers: z.number().default(0),
  time: z.string().default(''),
})
export type Question = z.infer<typeof questionSchema>

/** Schema Zod cho một chủ đề diễn đàn (dùng cho bộ lọc). */
export const topicSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string().default(''),
})
export type Topic = z.infer<typeof topicSchema>

/**
 * Một trang kết quả danh sách câu hỏi đã chuẩn hóa cho phân trang / infinite scroll.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type QuestionPageResult = {
  items: Question[]
  page: number
  hasMore: boolean
}
