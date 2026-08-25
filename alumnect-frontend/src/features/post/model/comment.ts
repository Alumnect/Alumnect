import { z } from 'zod'

/**
 * Model & schema cho bình luận (UC16 - View Post Detail).
 * Định nghĩa kiểu dữ liệu một bình luận và schema Zod dùng để xác thực/chuẩn hóa
 * dữ liệu trả về từ API `GET /api/v1/posts/{id}/comments` (khoan dung với dữ liệu
 * thiếu trường nhờ `.default`).
 */

/**
 * Schema Zod cho một bình luận. Dùng `safeParse` khi nhận dữ liệu từ API để loại bỏ
 * phần tử hỏng thay vì làm sập cả trang chi tiết.
 */
export const commentSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  authorId: z.union([z.string(), z.number()]).transform(String).optional().nullable().default(null),
  author: z.string().default('Ẩn danh'),
  role: z.string().default(''),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  time: z.string().default(''),
  text: z.string().default(''),
  /** ID bình luận cha nếu đây là một trả lời (1 cấp); null nếu là bình luận gốc. */
  parentId: z
    .union([z.string(), z.number()])
    .transform(String)
    .nullable()
    .default(null),
})
export type Comment = z.infer<typeof commentSchema>

/**
 * Một trang kết quả bình luận đã được chuẩn hóa cho phân trang / tải thêm.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type CommentsPageResult = {
  items: Comment[]
  page: number
  hasMore: boolean
}
