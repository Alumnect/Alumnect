import axios from 'axios'
import http from '@/lib/http'
import { AUTH_ENFORCED } from '@/config/auth'
import { FEED_POSTS } from '@/lib/constants'
import { postSchema } from '../model/post'
import type { FeedFilter, FeedPageResult, Post } from '../model/post'
import type { CreatePostInput } from '../model/createPost'

/**
 * Tầng gọi API cho UC15 - View community Feed.
 * Mặc định (AUTH_ENFORCED = true) gọi thật `GET /api/v1/posts`;
 * đặt AUTH_ENFORCED = false để chạy demo bằng dữ liệu mock độc lập FE.
 */

/** Số bài viết mỗi trang (đồng bộ với tham số `size` gửi lên backend). */
export const PAGE_SIZE = 5

/**
 * Trích mảng bài viết thô từ nhiều biến thể phong bì (envelope) phản hồi:
 * hỗ trợ Spring Page (`content`), dạng `{ items }` hoặc mảng trực tiếp.
 * @param body Dữ liệu đã được interceptor `http` bóc sẵn (response.data)
 * @return Mảng phần tử thô chưa xác thực
 */
function extractRawItems(body: unknown): unknown[] {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | unknown[] | undefined
  if (Array.isArray(d)) return d
  const obj = d as Record<string, unknown> | undefined
  const candidate = obj?.items ?? obj?.content ?? obj?.posts
  return Array.isArray(candidate) ? candidate : []
}

/**
 * Suy ra còn trang kế tiếp hay không từ các trường phân trang thường gặp.
 * @param body Phong bì phản hồi gốc
 * @param received Số phần tử nhận được ở trang hiện tại
 * @return true nếu vẫn còn dữ liệu để tải thêm
 */
function inferHasMore(body: unknown, received: number): boolean {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | undefined
  if (typeof d?.hasMore === 'boolean') return d.hasMore
  if (typeof d?.last === 'boolean') return !d.last
  if (typeof d?.pageNumber === 'number' && typeof d?.totalPages === 'number') {
    return d.pageNumber + 1 < d.totalPages
  }
  if (typeof d?.number === 'number' && typeof d?.totalPages === 'number') {
    return d.number + 1 < d.totalPages
  }
  // Không rõ metadata: coi như còn trang nếu nhận đủ 1 trang đầy.
  return received >= PAGE_SIZE
}

/** Xác thực & chuẩn hóa mảng thô thành Post[], bỏ qua phần tử hỏng. */
function parsePosts(raw: unknown[]): Post[] {
  const out: Post[] = []
  for (const r of raw) {
    const res = postSchema.safeParse(r)
    if (res.success) {
      out.push(res.data)
    } else {
      console.error('Post parsing failed:', res.error, r)
    }
  }
  return out
}

/** Kết quả trả về sau khi thích/bỏ thích một bài viết (UC17 - Like a post). */
export type LikeResult = { liked: boolean; likeCount: number }

/** Kết quả trả về sau khi lưu/bỏ lưu một bài viết (UC20 - Save Post). */
export type SaveResult = { saved: boolean }

/** Chuẩn hóa phản hồi thích/bỏ thích từ nhiều biến thể phong bì (envelope) thành LikeResult. */
function normalizeLike(body: unknown): LikeResult {
  const d = ((body as { data?: unknown })?.data ?? body) as { liked?: boolean; likeCount?: number } | undefined
  return { liked: !!d?.liked, likeCount: Number(d?.likeCount ?? 0) }
}

/** Chuẩn hóa phản hồi lưu/bỏ lưu từ phong bì (envelope) thành SaveResult. */
function normalizeSave(body: unknown): SaveResult {
  const d = ((body as { data?: unknown })?.data ?? body) as { saved?: boolean } | undefined
  return { saved: !!d?.saved }
}

/* ------------------------------------------------------------------ */
/* Dữ liệu mock cho chế độ demo (khi chưa bật backend)                 */
/* ------------------------------------------------------------------ */

/** Sinh danh sách bài viết mock đủ lớn để minh họa phân trang/infinite scroll. */
const MOCK_POSTS: Post[] = Array.from({ length: 14 }, (_, i) => {
  const base = FEED_POSTS[i % FEED_POSTS.length]
  return postSchema.parse({
    ...base,
    id: `${base.id}-${i}`,
    time: i < FEED_POSTS.length ? base.time : `${i}d`,
  })
})

/**
 * Trả về một trang mock đã lọc theo loại, mô phỏng độ trễ mạng để thấy
 * được trạng thái loading trên UI.
 * @param page Chỉ số trang (0-based)
 * @param filter Bộ lọc loại bài viết
 */
async function getMockPage(page: number, filter: FeedFilter): Promise<FeedPageResult> {
  await new Promise((r) => setTimeout(r, 500))
  const source = filter === 'all' ? MOCK_POSTS : MOCK_POSTS.filter((p) => p.type === filter)
  const start = page * PAGE_SIZE
  const items = source.slice(start, start + PAGE_SIZE)
  return { items, page, hasMore: start + PAGE_SIZE < source.length }
}

/* ------------------------------------------------------------------ */

export const feedApi = {
  /**
   * Lấy một trang bảng tin cộng đồng.
   * Gọi `GET /api/v1/posts?page={n}&size={m}&sort=recent[&type=...]`; token Bearer
   * (nếu có) được interceptor `http` tự đính kèm để backend phân biệt Guest/thành viên
   * khi lọc theo phạm vi hiển thị (BR-12). Trường `liked` luôn là false ở UC15 (BR-14).
   * @param page Chỉ số trang cần lấy (0-based)
   * @param filter Bộ lọc loại bài viết ('all' = không lọc)
   * @return Một trang kết quả đã chuẩn hóa (items + thông tin phân trang)
   */
  getFeed: async ({ page = 0, filter = 'all' as FeedFilter } = {}): Promise<FeedPageResult> => {
    // B1: Chế độ demo — dùng mock để FE chạy độc lập khi chưa có backend.
    if (!AUTH_ENFORCED) return getMockPage(page, filter)

    // B2: Dựng query string phân trang + sắp xếp mới nhất, kèm lọc theo loại nếu có.
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort: 'recent' })
    if (filter !== 'all') query.set('type', filter)

    // B3: Gọi API (interceptor tự đính Bearer token & bóc envelope response.data).
    const body = await http.get(`/posts?${query.toString()}`)

    // B4: Trích + xác thực dữ liệu bằng Zod, rồi suy ra cờ còn trang tiếp theo.
    const items = parsePosts(extractRawItems(body))
    // Không giữ nút "Tải thêm" khi trang vừa nhận không có bài nào có thể hiển thị.
    // Trường hợp này có thể xảy ra khi dữ liệu thay đổi giữa hai lần tải trang.
    return { items, page, hasMore: items.length > 0 && inferHasMore(body, items.length) }
  },

  /**
   * Thích một bài viết (UC17 - Like a post).
   * Gọi `POST /api/v1/posts/{id}/like` (token Bearer do interceptor `http` tự đính kèm).
   * Thao tác lũy đẳng phía backend — thích lại bài đã thích không làm tăng số đếm.
   * @param postId ID bài viết cần thích
   * @return Trạng thái like mới + tổng số lượt thích ({ liked: true, likeCount })
   */
  likePost: async (postId: string): Promise<LikeResult> => {
    const body = await http.post(`/posts/${postId}/like`)
    return normalizeLike(body)
  },

  /**
   * Bỏ thích một bài viết (UC17 - Like a post).
   * Gọi `DELETE /api/v1/posts/{id}/like`. Thao tác lũy đẳng — bỏ thích bài chưa thích không đổi.
   * @param postId ID bài viết cần bỏ thích
   * @return Trạng thái like mới + tổng số lượt thích ({ liked: false, likeCount })
   */
  unlikePost: async (postId: string): Promise<LikeResult> => {
    const body = await http.delete(`/posts/${postId}/like`)
    return normalizeLike(body)
  },

  /**
   * Tạo một bài viết mới trên bảng tin cộng đồng (UC14 - Create a post on the Feed).
   * Gọi `POST /api/v1/posts` (token Bearer do interceptor tự đính); trả về bài viết
   * vừa tạo đã chuẩn hóa qua `postSchema` để Frontend chèn ngay vào đầu bảng tin.
   * @param input Dữ liệu bài viết đã hợp lệ (content, type, visibility, imageUrl tùy chọn)
   * @return Bài viết mới đã chuẩn hóa
   */
  createPost: async (input: CreatePostInput): Promise<Post> => {
    const body = await http.post('/posts', input)
    const raw = (body as { data?: unknown })?.data ?? body
    return postSchema.parse(raw)
  },

  /**
   * Chỉnh sửa bài viết đã đăng (UC22 - Edit a post).
   * Gọi `PUT /api/v1/posts/${postId}` (token Bearer do interceptor tự đính);
   * trả về bài viết đã cập nhật qua `postSchema` để Frontend đồng bộ UI tức thì.
   * @param postId ID bài viết cần chỉnh sửa
   * @param input Dữ liệu cập nhật (content, type, visibility, imageUrl tùy chọn)
   * @return Bài viết đã cập nhật, đã chuẩn hóa
   */
  editPost: async (postId: string, input: CreatePostInput): Promise<Post> => {
    const body = await http.put(`/posts/${encodeURIComponent(postId)}`, input)
    const raw = (body as { data?: unknown })?.data ?? body
    return postSchema.parse(raw)
  },

  /**
   * Xóa một bài viết (UC23 - Delete a post).
   * Gọi `DELETE /api/v1/posts/${postId}`. 
   * Trả về true nếu thành công.
   * @param postId ID bài viết cần xóa
   */
  deletePost: async (postId: string): Promise<boolean> => {
    await http.delete(`/posts/${encodeURIComponent(postId)}`)
    return true
  },

  /**
   * Tải ảnh đính kèm bài viết lên Cloudflare R2 qua link ký sẵn (presigned URL),
   * theo đúng cơ chế đã dùng ở luồng đăng ký: xin link PUT tạm thời rồi tải trực tiếp
   * từ client lên R2, trả về URL công khai để gán vào `imageUrl` khi tạo bài.
   * @param file Tệp ảnh người dùng chọn
   * @return URL công khai của ảnh sau khi tải lên thành công
   */
  uploadPostImage: async (file: File): Promise<string> => {
    const res = await http.get<unknown, { data: { uploadUrl: string; publicUrl: string } }>(
      `/files/presigned-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&folder=posts`,
    )
    const { uploadUrl, publicUrl } = res.data
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
    return publicUrl
  },

  /**
   * Lưu/đánh dấu bài viết (UC20 - Save Post).
   * Gọi `POST /api/v1/posts/{id}/save`.
   * @param postId ID bài viết cần lưu
   */
  savePost: async (postId: string): Promise<SaveResult> => {
    const body = await http.post(`/posts/${encodeURIComponent(postId)}/save`)
    return normalizeSave(body)
  },

  /**
   * Bỏ lưu bài viết (UC20 - Save Post).
   * Gọi `DELETE /api/v1/posts/{id}/save`.
   * @param postId ID bài viết cần bỏ lưu
   */
  unsavePost: async (postId: string): Promise<SaveResult> => {
    const body = await http.delete(`/posts/${encodeURIComponent(postId)}/save`)
    return normalizeSave(body)
  },

  /**
   * Lấy danh sách bài viết đã lưu của người dùng (UC20 - View Saved Posts).
   * Gọi `GET /api/v1/posts/saved?page={n}&size={m}`.
   * @param page Chỉ số trang (0-based)
   * @param size Số bài viết mỗi trang
   */
  getSavedPosts: async ({ page = 0, size = PAGE_SIZE } = {}): Promise<FeedPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(size) })
    const body = await http.get(`/posts/saved?${query.toString()}`)
    const items = parsePosts(extractRawItems(body))
    return { items, page, hasMore: inferHasMore(body, items.length) }
  },
}
