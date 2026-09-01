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
 * Schema Zod cho một bài viết. Hỗ trợ đệ quy qua z.lazy() để map originalPost.
 */
export type Post = {
  id: string
  authorId?: string | null
  type: PostType
  author: string
  role: string
  avatar: string
  verified: boolean
  time: string
  text: string
  image: string | null
  images: string[]
  likes: number
  comments: number
  reposts: number
  liked: boolean
  saved: boolean
  job: JobInfo | null
  event: EventInfo | null
  originalPost?: Post | null
}

export const postSchema: z.ZodType<Post> = z.lazy(() =>
  z.object({
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
    images: z.array(z.string()).default([]),
    likes: z.number().default(0),
    comments: z.number().default(0),
    reposts: z.number().default(0),
    liked: z.boolean().default(false),
    saved: z.boolean().default(false),
    job: jobSchema.nullable().default(null),
    event: eventSchema.nullable().default(null),
    originalPost: z.lazy(() => postSchema.nullable().optional().catch(null)),
  })
)
/**
 * Một trang kết quả bảng tin đã được chuẩn hóa cho phân trang / infinite scroll.
 * `page` là chỉ số trang hiện tại (0-based), `hasMore` báo còn trang kế tiếp.
 */
export type FeedPageResult = {
  items: Post[]
  page: number
  hasMore: boolean
}
