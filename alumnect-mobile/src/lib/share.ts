/**
 * Chia sẻ — đồng bộ với Web (SRS_UC_SharePost).
 * Liên kết dùng đường dẫn của Web: /app/posts/{id}, /app/groups/{id}, /app/groups/{id}?postId={pid}.
 * Tin nhắn chia sẻ chỉ cần chứa đường dẫn này: cả Web lẫn Mobile dò regex để vẽ thẻ tương tác,
 * nên phần nhắn tin trong ứng dụng hoạt động ngay cả khi chưa có domain.
 */

/** Địa chỉ web công khai (để trống nếu chưa deploy). Chỉ cần cho "Sao chép liên kết" / chia sẻ ra ngoài. */
export const WEB_BASE_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? '').trim().replace(/\/$/, '')
export const hasPublicUrl = () => WEB_BASE_URL.length > 0

export const postPath = (id: string | number) => `/app/posts/${id}`
export const groupPath = (id: string | number) => `/app/groups/${id}`
export const groupPostPath = (groupId: string | number, postId: string | number) => `/app/groups/${groupId}?postId=${postId}`

/** Liên kết đầy đủ (hoặc chỉ đường dẫn khi chưa cấu hình domain). */
export const toUrl = (path: string) => `${WEB_BASE_URL}${path}`

const POST_RE = /(?:https?:\/\/[^\s]+)?\/app\/posts\/(\d+)/
const GROUP_POST_RE = /(?:https?:\/\/[^\s]+)?\/app\/groups\/(\d+)\?(?:[^\s]*&)?postId=(\d+)/
const GROUP_RE = /(?:https?:\/\/[^\s]+)?\/app\/groups\/(\d+)(?:\?[^\s]*)?/

export type SharedLink =
  | { kind: 'post'; postId: string; note: string }
  | { kind: 'groupPost'; groupId: string; postId: string; note: string }
  | { kind: 'group'; groupId: string; note: string }

/** Tách lời nhắn và liên kết chia sẻ khỏi nội dung tin nhắn (cùng thứ tự ưu tiên với MessageBubble trên Web). */
export function parseSharedLink(content?: string | null): SharedLink | null {
  if (!content) return null
  const post = content.match(POST_RE)
  if (post) return { kind: 'post', postId: post[1], note: content.replace(POST_RE, '').trim() }
  const gp = content.match(GROUP_POST_RE)
  if (gp) return { kind: 'groupPost', groupId: gp[1], postId: gp[2], note: content.replace(GROUP_POST_RE, '').trim() }
  const g = content.match(GROUP_RE)
  if (g) return { kind: 'group', groupId: g[1], note: content.replace(GROUP_RE, '').trim() }
  return null
}

/** Dòng xem trước trong danh sách hội thoại (giống ConversationList trên Web). */
export function messagePreview(msg?: string | null): string {
  if (!msg) return ''
  const s = parseSharedLink(msg)
  if (!s) return msg
  const label = s.kind === 'groupPost' ? '[Đã chia sẻ bài viết nhóm]' : s.kind === 'group' ? '[Đã chia sẻ hội nhóm]' : '[Đã chia sẻ bài viết]'
  if (s.note) return `${s.note} • ${label}`
  return s.kind === 'group' ? '[Đã chia sẻ một hội nhóm]' : '[Đã chia sẻ một bài viết]'
}
