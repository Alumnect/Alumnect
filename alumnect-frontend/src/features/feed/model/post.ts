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
 * Schema cho dữ liệu tuyển dụng đính kèm bài viết.
 */
export const jobSchema = z.object({
  title: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional().nullable(),
  salaryMin: z.number().optional().nullable(),
  salaryMax: z.number().optional().nullable(),
  applyUrl: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
})
export type JobInfo = z.infer<typeof jobSchema>

/**
 * Schema cho dữ liệu sự kiện đính kèm bài viết.
 */
export const eventSchema = z.object({
  title: z.string().optional(),
  location: z.string().optional().nullable(),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  capacity: z.number().optional().nullable(),
})
export type EventInfo = z.infer<typeof eventSchema>

/**
 * Schema Zod cho một bài viết. Dùng `safeParse` khi nhận dữ liệu từ API để
 * loại bỏ phần tử hỏng thay vì làm sập cả trang. `.catch/.default` giúp dữ
 * liệu thiếu trường vẫn render được.
 */
export const postSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  authorId: z.union([z.string(), z.number()]).transform(String).optional().nullable(),
  type: z.enum(POST_TYPES).catch('normal'),
  author: z.string().default('Ẩn danh'),
  role: z.string().default(''),
  avatar: z.string().default(''),
  verified: z.boolean().default(false),
  time: z.string().default(''),
  text: z.string().default(''),
  image: z.string().nullable().default(null),
  /** Danh sách URL ảnh đính kèm (hỗ trợ nhiều ảnh). */
  images: z.array(z.string()).default([]),
  likes: z.number().default(0),
  comments: z.number().default(0),
  reposts: z.number().default(0),
  /** Bài viết này đã được người dùng hiện tại thích hay chưa (viewer-specific). */
  liked: z.boolean().default(false),
  /** Bài viết này đã được người dùng hiện tại lưu hay chưa (viewer-specific, UC20). */
  saved: z.boolean().default(false),
  /** Dữ liệu tuyển dụng (nếu là bài tuyển dụng). */
  job: jobSchema.nullable().default(null),
  /** Dữ liệu sự kiện (nếu là bài sự kiện). */
  event: eventSchema.nullable().default(null),
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
