import { z } from 'zod'

/**
 * Model & schema cho tính năng UC15 - View community Feed.
 * Định nghĩa kiểu dữ liệu một bài viết trên bảng tin và schema Zod dùng để
 * xác thực/chuẩn hóa dữ liệu trả về từ API `GET /api/v1/posts` (khoan dung với
 * nhiều biến thể định dạng backend).
 */

/** Các loại bài viết hiển thị trên bảng tin cộng đồng. */
export const POST_TYPES = ['normal', 'achievement', 'recruitment', 'event'] as const
export type PostType = (typeof POST_TYPES)[number]

/** Bộ lọc bảng tin: 'all' (tất cả) hoặc một loại bài viết cụ thể. */
export type FeedFilter = PostType | 'all'

/**
 * Schema Zod cho một bài viết. Dùng `safeParse` khi nhận dữ liệu từ API để
 * loại bỏ phần tử hỏng thay vì làm sập cả trang. `.catch/.default` giúp dữ
 * liệu thiếu trường vẫn render được.
 */
export const postSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  type: z.enum(POST_TYPES).catch('normal'),
  author: z.string().default('Ẩn danh'),
  role: z.string().default(''),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  time: z.string().default(''),
  text: z.string().default(''),
  image: z.string().nullable().default(null),
  likes: z.number().default(0),
  comments: z.number().default(0),
  reposts: z.number().default(0),
  /** Bài viết này đã được người dùng hiện tại thích hay chưa (viewer-specific). */
  liked: z.boolean().default(false),
})
export type Post = z.infer<typeof postSchema>

/**
 * Một trang kết quả bảng tin đã được chuẩn hóa cho phân trang / infinite scroll.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type FeedPageResult = {
  items: Post[]
  page: number
  hasMore: boolean
}
