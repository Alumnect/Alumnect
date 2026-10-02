import axios from 'axios'
import http from '@/lib/http'
import {
  GROUP_PAGE_SIZE,
  MEMBER_PAGE_SIZE,
  actionResultSchema,
  groupCardSchema,
  groupDetailSchema,
  groupMemberSchema,
  joinRequestSchema,
  membershipResultSchema,
} from '../model/group'
import type {
  ActionResult,
  GroupCard,
  GroupDetail,
  GroupInput,
  GroupMember,
  GroupPageResult,
  GroupRole,
  GroupStatus,
  JoinRequest,
  JoinRequestPageResult,
  MemberPageResult,
  MembershipResult,
  GroupPost,
  GroupComment,
  GroupPostLikeResult,
  CreateGroupPostPayload,
} from '../model/group'

/**
 * Tầng gọi API Hội nhóm — `/api/v1/groups/**`. Interceptor `http` đã bóc envelope axios (response.data) và tự đính
 * Bearer token; ở đây bóc tiếp trường `data` của ApiResponse rồi xác thực bằng Zod trước khi trả cho UI.
 */

/** Bóc payload `data` từ phong bì ApiResponse (fallback chính body nếu không có). */
function payloadOf(body: unknown): unknown {
  const b = body as Record<string, unknown> | undefined
  return b && typeof b === 'object' && 'data' in b ? b.data : body
}

type RawPage = { content?: unknown[]; last?: boolean; totalElements?: number; pageNumber?: number }

/** Xác thực & chuẩn hóa một trang phân trang, bỏ qua phần tử hỏng thay vì làm sập cả danh sách. */
function parsePage<T>(body: unknown, parse: (raw: unknown) => T | null, page: number): { items: T[]; page: number; hasMore: boolean; total: number } {
  const d = (payloadOf(body) ?? {}) as RawPage
  const items: T[] = []
  for (const raw of Array.isArray(d.content) ? d.content : []) {
    const parsed = parse(raw)
    if (parsed) items.push(parsed)
  }
  return { items, page, hasMore: d.last === false, total: typeof d.totalElements === 'number' ? d.totalElements : items.length }
}

const parseCard = (raw: unknown): GroupCard | null => {
  const r = groupCardSchema.safeParse(raw)
  return r.success ? r.data : null
}
const parseMember = (raw: unknown): GroupMember | null => {
  const r = groupMemberSchema.safeParse(raw)
  return r.success ? r.data : null
}
const parseRequest = (raw: unknown): JoinRequest | null => {
  const r = joinRequestSchema.safeParse(raw)
  return r.success ? r.data : null
}

export const groupApi = {
  /**
   * Danh sách khám phá hội nhóm (Guest cũng xem được). `GET /api/v1/groups?keyword&category&page&size`.
   */
  list: async ({ page = 0, keyword = '', category = '' }: { page?: number; keyword?: string; category?: string } = {}): Promise<GroupPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(GROUP_PAGE_SIZE) })
    if (keyword.trim()) query.set('keyword', keyword.trim())
    if (category) query.set('category', category)
    const body = await http.get(`/groups?${query.toString()}`)
    return parsePage(body, parseCard, page)
  },

  /** Các hội nhóm tôi đang tham gia. `GET /api/v1/groups/my-groups`. */
  myGroups: async ({ page = 0 }: { page?: number } = {}): Promise<GroupPageResult> => {
    const body = await http.get(`/groups/my-groups?page=${page}&size=${GROUP_PAGE_SIZE}`)
    return parsePage(body, parseCard, page)
  },

  /** Chi tiết một hội nhóm. `GET /api/v1/groups/{id}`. */
  getById: async (id: string | number): Promise<GroupDetail> => {
    const body = await http.get(`/groups/${id}`)
    return groupDetailSchema.parse(payloadOf(body))
  },

  /** Tạo hội nhóm mới. `POST /api/v1/groups`. */
  create: async (input: GroupInput): Promise<GroupDetail> => {
    const body = await http.post('/groups', input)
    return groupDetailSchema.parse(payloadOf(body))
  },

  /** Cập nhật thông tin hội nhóm. `PUT /api/v1/groups/{id}`. */
  update: async (id: number, input: GroupInput): Promise<GroupDetail> => {
    const body = await http.put(`/groups/${id}`, input)
    return groupDetailSchema.parse(payloadOf(body))
  },

  /** Đóng (INACTIVE) / mở lại (ACTIVE) hội nhóm. `PUT /api/v1/groups/{id}/status`. */
  setStatus: async (id: number, status: Extract<GroupStatus, 'ACTIVE' | 'INACTIVE'>): Promise<ActionResult> => {
    const body = await http.put(`/groups/${id}/status`, { status })
    return actionResultSchema.parse(payloadOf(body))
  },

  /** Xóa (mềm) hội nhóm. `DELETE /api/v1/groups/{id}`. */
  remove: async (id: number): Promise<ActionResult> => {
    const body = await http.delete(`/groups/${id}`)
    return actionResultSchema.parse(payloadOf(body))
  },

  /** Tham gia nhóm công khai / gửi yêu cầu tham gia nhóm riêng tư. `POST /api/v1/groups/{id}/join`. */
  join: async (id: number): Promise<MembershipResult> => {
    const body = await http.post(`/groups/${id}/join`)
    return membershipResultSchema.parse(payloadOf(body))
  },

  /**
   * Rời nhóm / hủy yêu cầu đang chờ. Owner còn thành viên khác truyền `transferToUserId` để chuyển quyền sở hữu.
   * `DELETE /api/v1/groups/{id}/join`.
   */
  leave: async (id: number, transferToUserId?: number): Promise<MembershipResult> => {
    const body = await http.delete(`/groups/${id}/join`, transferToUserId ? { data: { newOwnerId: transferToUserId } } : undefined)
    return membershipResultSchema.parse(payloadOf(body))
  },

  /** Danh sách thành viên ACTIVE (có tìm theo tên). `GET /api/v1/groups/{id}/members`. */
  members: async (id: number, { page = 0, keyword = '' }: { page?: number; keyword?: string } = {}): Promise<MemberPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(MEMBER_PAGE_SIZE) })
    if (keyword.trim()) query.set('keyword', keyword.trim())
    const body = await http.get(`/groups/${id}/members?${query.toString()}`)
    return parsePage(body, parseMember, page)
  },

  /** Yêu cầu tham gia đang chờ duyệt (Owner/Admin). `GET /api/v1/groups/{id}/join-requests`. */
  joinRequests: async (id: number, { page = 0 }: { page?: number } = {}): Promise<JoinRequestPageResult> => {
    const body = await http.get(`/groups/${id}/join-requests?page=${page}&size=${MEMBER_PAGE_SIZE}`)
    return parsePage(body, parseRequest, page)
  },

  /** Duyệt / từ chối một yêu cầu tham gia. `PUT /api/v1/groups/{id}/join-requests/{requestId}`. */
  handleRequest: async (id: number, requestId: number, action: 'APPROVE' | 'REJECT'): Promise<ActionResult> => {
    const body = await http.put(`/groups/${id}/join-requests/${requestId}`, { action })
    return actionResultSchema.parse(payloadOf(body))
  },

  /** Xóa thành viên khỏi nhóm. `DELETE /api/v1/groups/{id}/members/{userId}`. */
  removeMember: async (id: number, userId: number): Promise<ActionResult> => {
    const body = await http.delete(`/groups/${id}/members/${userId}`)
    return actionResultSchema.parse(payloadOf(body))
  },

  /** Phân quyền / thu hồi quyền quản trị viên (chỉ Owner). `PUT /api/v1/groups/{id}/members/{userId}/role`. */
  changeRole: async (id: number, userId: number, role: Extract<GroupRole, 'ADMIN' | 'MEMBER'>): Promise<ActionResult> => {
    const body = await http.put(`/groups/${id}/members/${userId}/role`, { role })
    return actionResultSchema.parse(payloadOf(body))
  },

  /** Tải ảnh bìa lên storage qua presigned URL, trả về URL công khai. */
  uploadCover: async (file: File): Promise<string> => {
    const res = await http.get<unknown, { data: { uploadUrl: string; publicUrl: string } }>(
      `/files/presigned-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&folder=groups`,
    )
    const { uploadUrl, publicUrl } = res.data
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
    return publicUrl
  },

  /** Danh sách bài viết / thảo luận trong hội nhóm. `GET /api/v1/groups/{groupId}/posts`. */
  listPosts: async (groupId: number, page = 0, size = 10, topic?: string): Promise<{ content: GroupPost[]; last: boolean; totalElements: number; pageNumber: number }> => {
    const body = await http.get(`/groups/${groupId}/posts`, { params: { page, size, ...(topic ? { topic } : {}) } })
    const p = payloadOf(body) as RawPage
    return {
      content: (p?.content ?? []) as GroupPost[],
      last: Boolean(p?.last),
      totalElements: Number(p?.totalElements ?? 0),
      pageNumber: Number(p?.pageNumber ?? 0),
    }
  },

  /** Chi tiết một bài viết trong nhóm. `GET /api/v1/groups/{groupId}/posts/{postId}`. */
  getPostDetail: async (groupId: number, postId: number): Promise<GroupPost> => {
    const body = await http.get(`/groups/${groupId}/posts/${postId}`)
    return payloadOf(body) as GroupPost
  },

  /** Đăng bài viết / thảo luận mới trong hội nhóm. `POST /api/v1/groups/{groupId}/posts`. */
  createPost: async (groupId: number, payload: CreateGroupPostPayload): Promise<GroupPost> => {
    const body = await http.post(`/groups/${groupId}/posts`, payload)
    return payloadOf(body) as GroupPost
  },

  /** Cập nhật bài viết trong nhóm. `PUT /api/v1/groups/{groupId}/posts/{postId}`. */
  updatePost: async (groupId: number, postId: number, payload: CreateGroupPostPayload): Promise<GroupPost> => {
    const body = await http.put(`/groups/${groupId}/posts/${postId}`, payload)
    return payloadOf(body) as GroupPost
  },

  /** Xóa bài viết trong hội nhóm. `DELETE /api/v1/groups/{groupId}/posts/{postId}`. */
  deletePost: async (groupId: number, postId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/posts/${postId}`)
  },

  /** Thích / Bỏ thích bài viết trong hội nhóm. `POST /api/v1/groups/{groupId}/posts/{postId}/like`. */
  togglePostLike: async (groupId: number, postId: number): Promise<GroupPostLikeResult> => {
    const body = await http.post(`/groups/${groupId}/posts/${postId}/like`)
    return payloadOf(body) as GroupPostLikeResult
  },

  /** Ghim / Bỏ ghim bài viết trong hội nhóm. `PUT /api/v1/groups/{groupId}/posts/{postId}/pin`. */
  togglePostPin: async (groupId: number, postId: number): Promise<GroupPost> => {
    const body = await http.put(`/groups/${groupId}/posts/${postId}/pin`)
    return payloadOf(body) as GroupPost
  },

  /** Lấy danh sách bình luận của bài viết. `GET /api/v1/groups/{groupId}/posts/{postId}/comments`. */
  listComments: async (groupId: number, postId: number, page = 0, size = 20): Promise<{ content: GroupComment[]; last: boolean; totalElements: number; pageNumber: number }> => {
    const body = await http.get(`/groups/${groupId}/posts/${postId}/comments`, { params: { page, size } })
    const p = payloadOf(body) as RawPage
    return {
      content: (p?.content ?? []) as GroupComment[],
      last: Boolean(p?.last),
      totalElements: Number(p?.totalElements ?? 0),
      pageNumber: Number(p?.pageNumber ?? 0),
    }
  },

  /** Thêm bình luận vào bài viết. `POST /api/v1/groups/{groupId}/posts/{postId}/comments`. */
  createComment: async (groupId: number, postId: number, content: string, parentId?: number): Promise<GroupComment> => {
    const body = await http.post(`/groups/${groupId}/posts/${postId}/comments`, { content, ...(parentId ? { parentId } : {}) })
    return payloadOf(body) as GroupComment
  },

  /** Chỉ tác giả được sửa bình luận của mình. */
  updateComment: async (groupId: number, postId: number, commentId: number, content: string): Promise<GroupComment> => {
    const body = await http.put(`/groups/${groupId}/posts/${postId}/comments/${commentId}`, { content })
    return payloadOf(body) as GroupComment
  },

  /** Xóa bình luận. `DELETE /api/v1/groups/{groupId}/posts/{postId}/comments/{commentId}`. */
  deleteComment: async (groupId: number, postId: number, commentId: number): Promise<void> => {
    await http.delete(`/groups/${groupId}/posts/${postId}/comments/${commentId}`)
  },

  /** Tải ảnh đính kèm bài viết lên storage qua presigned URL. */
  uploadPostImage: async (file: File): Promise<string> => {
    const res = await http.get<unknown, { data: { uploadUrl: string; publicUrl: string } }>(
      `/files/presigned-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&folder=group-posts`,
    )
    const { uploadUrl, publicUrl } = res.data
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
    return publicUrl
  },

  /** Khởi tạo nhóm chat cho hội nhóm. `POST /api/v1/groups/{id}/chat`. */
  createChat: async (id: number): Promise<{ conversationId: number }> => {
    const body = await http.post(`/groups/${id}/chat`)
    return payloadOf(body) as { conversationId: number }
  },

  /** Thành viên tham gia nhóm chat của hội nhóm. `POST /api/v1/groups/{id}/chat/join`. */
  joinChat: async (id: number): Promise<{ conversationId: number }> => {
    const body = await http.post(`/groups/${id}/chat/join`)
    return payloadOf(body) as { conversationId: number }
  },
}
