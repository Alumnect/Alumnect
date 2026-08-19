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
  major: z.string().default(''),
  images: z.array(z.string()).default([]),
  author: z.string().default('Ẩn danh'),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  votes: z.number().default(0),
  answers: z.number().default(0),
  time: z.string().default(''),
})
export type Question = z.infer<typeof questionSchema>

/**
 * Schema Zod cho chi tiết một câu hỏi (UC39 - View question detail).
 * Khác `questionSchema` (danh sách): mang toàn bộ nội dung `body`, thêm `topicId`,
 * dòng tiêu đề tác giả `authorHeadline` và mốc thời gian tuyệt đối `createdAt`.
 * Vẫn dùng `.default` để dữ liệu thiếu trường không làm sập màn hình chi tiết.
 */
export const questionDetailSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().default(''),
  body: z.string().default(''),
  topic: z.string().default(''),
  topicId: z.union([z.string(), z.number()]).transform(Number).nullable().default(null),
  major: z.string().default(''),
  majorId: z.union([z.string(), z.number()]).transform(Number).nullable().default(null),
  images: z.array(z.string()).default([]),
  authorId: z.union([z.string(), z.number()]).transform(String).default(''),
  author: z.string().default('Ẩn danh'),
  avatar: z.string().default(''),
  authorHeadline: z.string().default(''),
  verified: z.boolean().default(false),
  votes: z.number().default(0),
  answers: z.number().default(0),
  time: z.string().default(''),
  createdAt: z.string().default(''),
})
export type QuestionDetail = z.infer<typeof questionDetailSchema>

/** Schema Zod cho một THỂ LOẠI thảo luận dạng phẳng. */
export const topicSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string().default(''),
})
export type Topic = z.infer<typeof topicSchema>

/**
 * Schema Zod cho một NGÀNH (major) — dùng cho bộ lọc và form đặt câu hỏi.
 * Lấy từ `GET /api/v1/majors` (đồng bộ với type `Major` bên features/auth).
 */
export const majorSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  code: z.string().default(''),
  name: z.string().default(''),
})
export type MajorOption = z.infer<typeof majorSchema>

/** Số ảnh tối đa cho phép đính kèm một câu hỏi (khớp giới hạn Backend). */
export const MAX_QUESTION_IMAGES = 5

/**
 * Schema Zod cho form đặt/sửa câu hỏi (UC40 - Ask a question, UC46 - Edit a question).
 * Thông điệp lỗi khớp 100% với validation phía Backend (CreateQuestionRequest/UpdateQuestionRequest).
 */
export const createQuestionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tiêu đề câu hỏi không được để trống')
    .max(250, 'Tiêu đề câu hỏi không được vượt quá 250 ký tự'),
  body: z
    .string()
    .trim()
    .min(1, 'Nội dung câu hỏi không được để trống')
    .max(10000, 'Nội dung câu hỏi không được vượt quá 10000 ký tự'),
  topicId: z.number().nullable(),
  majorId: z.number().nullable(),
  imageUrls: z.array(z.string()).max(MAX_QUESTION_IMAGES, `Chỉ được đính kèm tối đa ${MAX_QUESTION_IMAGES} ảnh`),
})
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>

/** Form sửa câu hỏi (UC46) dùng chung schema với tạo mới. */
export type UpdateQuestionInput = CreateQuestionInput

/**
 * Một trang kết quả danh sách câu hỏi đã chuẩn hóa cho phân trang / infinite scroll.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type QuestionPageResult = {
  items: Question[]
  page: number
  hasMore: boolean
}
