import http from '@/lib/http'
import { postSchema } from '@/features/feed'
import type { Post } from '@/features/feed'
import { commentSchema } from '../model/comment'
import type { Comment, CommentsPageResult } from '../model/comment'

/**
 * Tầng gọi API cho UC16 - View Post Detail.
 * Gọi `GET /api/v1/posts/{id}` (chi tiết bài viết) và `GET /api/v1/posts/{id}/comments`
 * (luồng bình luận, phân trang). Token Bearer (nếu có) được interceptor `http` tự đính kèm
 * để backend phân biệt Guest/thành viên khi áp quy tắc quyền xem (BR-12).
 */

/** Số bình luận mỗi trang (đồng bộ với tham số `size` gửi lên backend). */
export const COMMENTS_PAGE_SIZE = 10

/**
 * Bóc phần `data` thực tế từ phong bì phản hồi (ApiResponse) đã được interceptor `http`
 * trả về sẵn ở `response.data`. Hỗ trợ cả trường hợp backend trả phẳng.
 * @param body Dữ liệu interceptor trả về
 * @return Phần dữ liệu nghiệp vụ bên trong
 */
function extractData(body: unknown): unknown {
  const b = body as Record<string, unknown> | undefined
  return b?.data ?? b
}

export const postApi = {
  /**
   * Lấy chi tiết một bài viết theo ID.
   * @param id ID bài viết (dạng chuỗi)
   * @return Bài viết đã được xác thực bằng Zod
   */
  getPostDetail: async (id: string): Promise<Post> => {
    const body = await http.get(`/posts/${encodeURIComponent(id)}`)
    // Bài viết chi tiết bắt buộc phải hợp lệ — dùng parse (ném lỗi nếu dữ liệu sai cấu trúc).
    return postSchema.parse(extractData(body))
  },

  /**
   * Lấy một trang bình luận của bài viết.
   * @param id ID bài viết
   * @param page Chỉ số trang cần lấy (0-based)
   * @return Một trang bình luận đã chuẩn hóa (items + thông tin phân trang)
   */
  getPostComments: async (id: string, page = 0): Promise<CommentsPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(COMMENTS_PAGE_SIZE) })
    const body = await http.get(`/posts/${encodeURIComponent(id)}/comments?${query.toString()}`)
    const data = extractData(body) as Record<string, unknown> | undefined

    // Xác thực từng bình luận, bỏ qua phần tử hỏng thay vì làm sập cả danh sách.
    const rawItems = Array.isArray(data?.content) ? (data!.content as unknown[]) : []
    const items: Comment[] = []
    for (const r of rawItems) {
      const res = commentSchema.safeParse(r)
      if (res.success) items.push(res.data)
    }

    // Suy ra còn trang kế tiếp từ cờ `last` của PageResponse; mặc định coi như hết nếu thiếu.
    const last = typeof data?.last === 'boolean' ? (data!.last as boolean) : true
    return { items, page, hasMore: !last }
  },

  /**
   * Đăng một bình luận mới trên bài viết (UC18 - Comment on a post).
   * Gọi `POST /api/v1/posts/{id}/comments` (token Bearer do interceptor tự đính kèm);
   * trả về bình luận vừa tạo đã chuẩn hóa qua `commentSchema` để chèn thẳng vào luồng bình luận.
   * @param postId  ID bài viết được bình luận
   * @param content Nội dung bình luận
   * @param parentId ID bình luận cha nếu là trả lời (tùy chọn)
   * @return Bình luận mới đã chuẩn hóa
   */
  createComment: async (postId: string, content: string, parentId?: string): Promise<Comment> => {
    const payload: { content: string; parentId?: number } = { content }
    if (parentId) payload.parentId = Number(parentId)
    const body = await http.post(`/posts/${encodeURIComponent(postId)}/comments`, payload)
    return commentSchema.parse(extractData(body))
  },

  /**
   * Chỉnh sửa nội dung bình luận của chính người dùng (UC19).
   * @param postId ID bài viết chứa bình luận
   * @param commentId ID bình luận cần sửa
   * @param content Nội dung mới đã được client validate
   * @return Bình luận sau khi cập nhật và được xác thực qua Zod
   */
  updateComment: async (postId: string, commentId: string, content: string): Promise<Comment> => {
    const body = await http.put(
      `/posts/${encodeURIComponent(postId)}/comments/${encodeURIComponent(commentId)}`,
      { content },
    )
    return commentSchema.parse(extractData(body))
  },
}
