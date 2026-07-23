import { z } from 'zod'
import { POST_TYPES } from './post'

/**
 * Model & schema cho UC14 - Create a post on the Feed.
 * Định nghĩa dữ liệu form soạn bài và schema Zod validate phía Client
 * (khớp 100% với ràng buộc của `CreatePostRequest` + tầng Service ở Backend).
 */

/** Phạm vi hiển thị bài viết: công khai (Guest xem được) hoặc chỉ thành viên. */
export const POST_VISIBILITIES = ['public', 'members'] as const
export type PostVisibility = (typeof POST_VISIBILITIES)[number]

/** Nhãn tiếng Việt cho các loại bài viết hiển thị trên UI chọn loại. */
export const POST_TYPE_LABELS: Record<(typeof POST_TYPES)[number], string> = {
  normal: 'Bài thường',
  achievement: 'Thành tựu',
  recruitment: 'Tuyển dụng',
  event: 'Sự kiện',
}

/** Nhãn tiếng Việt cho phạm vi hiển thị. */
export const VISIBILITY_LABELS: Record<PostVisibility, string> = {
  public: 'Công khai',
  members: 'Chỉ thành viên',
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
    .min(1, 'Nội dung bài viết không được để trống')
    .max(POST_CONTENT_MAX, `Nội dung bài viết không được vượt quá ${POST_CONTENT_MAX} ký tự`),
  type: z.enum(POST_TYPES).default('normal'),
  visibility: z.enum(POST_VISIBILITIES).default('public'),
  imageUrl: z.string().max(500).optional(),
})
export type CreatePostInput = z.infer<typeof createPostSchema>
