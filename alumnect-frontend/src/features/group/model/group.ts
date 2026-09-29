import { z } from 'zod'

/**
 * Model & schema cho tính năng Hội nhóm (Community Groups).
 * Định nghĩa kiểu dữ liệu hội nhóm/thành viên/yêu cầu tham gia và schema Zod dùng để xác thực dữ liệu trả về
 * từ API `/api/v1/groups/**` (khoan dung với dữ liệu thiếu trường) cũng như validate form tạo/sửa hội nhóm.
 */

/** Danh mục hoạt động của hội nhóm — khóa (value) phải khớp danh sách GroupCategories phía Backend. */
export const GROUP_CATEGORIES = [
  { value: 'technology', label: 'Công nghệ' },
  { value: 'sports', label: 'Thể thao' },
  { value: 'arts', label: 'Nghệ thuật' },
  { value: 'startup', label: 'Khởi nghiệp' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'alumni', label: 'Giao lưu cựu sinh viên' },
  { value: 'career', label: 'Nghề nghiệp & Tuyển dụng' },
  { value: 'academic', label: 'Học thuật' },
  { value: 'other', label: 'Khác' },
] as const

export type GroupCategory = (typeof GROUP_CATEGORIES)[number]['value']

/** Tên hiển thị của một danh mục; trả lại chính khóa nếu không nhận ra. */
export function categoryLabel(value: string): string {
  return GROUP_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

/** Giới hạn dữ liệu — đồng bộ với validation của Backend. */
export const GROUP_NAME_MAX = 200
export const GROUP_DESCRIPTION_MAX = 5000
export const GROUP_RULES_MAX = 2000
export const GROUP_TOPIC_MAX_LENGTH = 50
export const GROUP_MAX_TOPICS = 5
export const GROUP_SEARCH_MAX = 100
export const GROUP_PAGE_SIZE = 12
export const MEMBER_PAGE_SIZE = 20

export type GroupPrivacy = 'PUBLIC' | 'PRIVATE'
export type GroupStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED'
/** Trạng thái tham gia của người đang xem; NONE = chưa có tư cách thành viên nào (hoặc là Guest). */
export type ViewerMembershipStatus = 'NONE' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'REMOVED'
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'

const idSchema = z.union([z.string(), z.number()]).transform(Number)

/** Schema Zod cho một hội nhóm hiển thị trên thẻ ở danh sách. */
export const groupCardSchema = z.object({
  id: idSchema,
  name: z.string().default(''),
  shortDescription: z.string().default(''),
  coverImageUrl: z.string().nullable().default(null),
  category: z.string().default('other'),
  topics: z.array(z.string()).nullable().default([]).transform((v) => v ?? []),
  privacy: z.string().default('PUBLIC').transform((v) => (v === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC') as GroupPrivacy),
  memberCount: z.number().default(0),
  status: z.string().default('ACTIVE').transform((v) => v as GroupStatus),
  viewerMembershipStatus: z.string().default('NONE').transform((v) => v as ViewerMembershipStatus),
  viewerRole: z.string().nullable().default(null).transform((v) => v as GroupRole | null),
})
export type GroupCard = z.infer<typeof groupCardSchema>

/** Schema Zod cho chi tiết hội nhóm. */
export const groupDetailSchema = z.object({
  id: idSchema,
  name: z.string().default(''),
  description: z.string().default(''),
  coverImageUrl: z.string().nullable().default(null),
  category: z.string().default('other'),
  topics: z.array(z.string()).nullable().default([]).transform((v) => v ?? []),
  privacy: z.string().default('PUBLIC').transform((v) => (v === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC') as GroupPrivacy),
  joinRules: z.string().nullable().default(null),
  memberCount: z.number().default(0),
  status: z.string().default('ACTIVE').transform((v) => v as GroupStatus),
  createdAt: z.string().default(''),
  owner: z
    .object({ userId: idSchema, fullName: z.string().default(''), avatarUrl: z.string().nullable().default('') })
    .nullable()
    .default(null),
  viewerMembershipStatus: z.string().default('NONE').transform((v) => v as ViewerMembershipStatus),
  viewerRole: z.string().nullable().default(null).transform((v) => v as GroupRole | null),
  canViewMembers: z.boolean().default(false),
  pendingRequestCount: z.number().nullable().default(null),
})
export type GroupDetail = z.infer<typeof groupDetailSchema>

/** Schema Zod cho một thành viên ACTIVE của hội nhóm. */
export const groupMemberSchema = z.object({
  userId: idSchema,
  fullName: z.string().default('Ẩn danh'),
  avatarUrl: z.string().nullable().default(''),
  headline: z.string().nullable().default(''),
  role: z.string().default('MEMBER').transform((v) => v as GroupRole),
  joinedAt: z.string().nullable().default(null),
})
export type GroupMember = z.infer<typeof groupMemberSchema>

/** Schema Zod cho một yêu cầu tham gia đang chờ duyệt. */
export const joinRequestSchema = z.object({
  requestId: idSchema,
  userId: idSchema,
  fullName: z.string().default('Ẩn danh'),
  avatarUrl: z.string().nullable().default(''),
  headline: z.string().nullable().default(''),
  status: z.string().default('PENDING'),
  requestedAt: z.string().nullable().default(null),
})
export type JoinRequest = z.infer<typeof joinRequestSchema>

/** Kết quả tham gia / gửi yêu cầu / hủy yêu cầu / rời nhóm. */
export const membershipResultSchema = z.object({
  groupId: idSchema,
  viewerMembershipStatus: z.string().default('NONE').transform((v) => v as ViewerMembershipStatus),
  viewerRole: z.string().nullable().default(null),
  memberCount: z.number().default(0),
  message: z.string().default(''),
})
export type MembershipResult = z.infer<typeof membershipResultSchema>

/** Kết quả các thao tác quản trị (đóng/xóa nhóm, duyệt yêu cầu, xóa thành viên, đổi vai trò). */
export const actionResultSchema = z.object({
  groupId: idSchema,
  targetUserId: idSchema.nullable().default(null),
  status: z.string().nullable().default(null),
  memberCount: z.number().nullable().default(null),
  message: z.string().default(''),
})
export type ActionResult = z.infer<typeof actionResultSchema>

/** Một trang kết quả danh sách hội nhóm. */
export type GroupPageResult = { items: GroupCard[]; page: number; hasMore: boolean; total: number }
export type MemberPageResult = { items: GroupMember[]; page: number; hasMore: boolean; total: number }
export type JoinRequestPageResult = { items: JoinRequest[]; page: number; hasMore: boolean; total: number }

/** Schema form tạo/sửa hội nhóm — khớp validation Backend. `topics` nhập dạng chuỗi ngăn cách bằng dấu phẩy. */
export const groupFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên hội nhóm').max(GROUP_NAME_MAX, `Tên tối đa ${GROUP_NAME_MAX} ký tự`),
  description: z.string().trim().min(1, 'Vui lòng nhập mô tả hội nhóm').max(GROUP_DESCRIPTION_MAX, `Mô tả tối đa ${GROUP_DESCRIPTION_MAX} ký tự`),
  category: z.string().min(1, 'Vui lòng chọn danh mục'),
  topicsText: z.string(),
  privacy: z.enum(['PUBLIC', 'PRIVATE']),
  joinRules: z.string().max(GROUP_RULES_MAX, `Quy định tối đa ${GROUP_RULES_MAX} ký tự`),
  coverImageUrl: z.string().nullable(),
})
export type GroupFormValues = z.infer<typeof groupFormSchema>

/** Payload gửi lên API tạo/sửa hội nhóm. */
export type GroupInput = {
  name: string
  description: string
  category: string
  topics: string[]
  privacy: GroupPrivacy
  joinRules: string | null
  coverImageUrl: string | null
}

/** Tách chuỗi chủ đề "AI, Machine Learning" thành mảng đã dọn (bỏ rỗng/trùng, tối đa GROUP_MAX_TOPICS). */
export function parseTopics(text: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of text.split(',')) {
    const t = raw.trim()
    if (!t || seen.has(t.toLowerCase())) continue
    seen.add(t.toLowerCase())
    out.push(t)
  }
  return out
}

/** Kiểm tra chuỗi chủ đề hợp lệ (tối đa 5 chủ đề, mỗi chủ đề ≤ 50 ký tự); trả về thông báo lỗi hoặc null. */
export function validateTopics(text: string): string | null {
  const topics = parseTopics(text)
  if (topics.length > GROUP_MAX_TOPICS) return `Chỉ được nhập tối đa ${GROUP_MAX_TOPICS} chủ đề`
  if (topics.some((t) => t.length > GROUP_TOPIC_MAX_LENGTH)) return `Mỗi chủ đề tối đa ${GROUP_TOPIC_MAX_LENGTH} ký tự`
  return null
}

/** Vai trò trong nhóm có quyền quản lý (Owner/Admin). */
export function isManagerRole(role: GroupRole | null | undefined): boolean {
  return role === 'OWNER' || role === 'ADMIN'
}

/** Thông tin tác giả bài viết / bình luận trong hội nhóm */
export interface GroupPostAuthor {
  userId: number
  fullName: string
  avatarUrl: string
  groupRole: GroupRole | null
  roleLabel: string
}

/** Dữ liệu bài viết / thảo luận trong hội nhóm */
export interface GroupPost {
  id: number
  groupId: number
  author: GroupPostAuthor
  content: string
  imageUrls: string[]
  isPinned: boolean
  likeCount: number
  commentCount: number
  likedByViewer: boolean
  canPin: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

/** Dữ liệu bình luận bài viết trong hội nhóm */
export interface GroupComment {
  id: number
  postId: number
  author: GroupPostAuthor
  content: string
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

/** Kết quả thích / bỏ thích bài viết */
export interface GroupPostLikeResult {
  postId: number
  liked: boolean
  likeCount: number
}

/** Payload tạo mới hoặc chỉnh sửa bài viết trong nhóm */
export interface CreateGroupPostPayload {
  content: string
  imageUrls?: string[]
}
