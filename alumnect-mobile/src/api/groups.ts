import http from '@/lib/http'

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
export const categoryLabel = (v: string) => GROUP_CATEGORIES.find((c) => c.value === v)?.label ?? v

export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER'
export type MembershipStatus = 'NONE' | 'ACTIVE' | 'PENDING' | 'REJECTED' | 'LEFT' | 'REMOVED'
export const isManager = (r?: GroupRole | null) => r === 'OWNER' || r === 'ADMIN'

export interface GroupCard {
  id: number
  name: string
  shortDescription: string
  coverImageUrl: string | null
  category: string
  topics: string[]
  privacy: 'PUBLIC' | 'PRIVATE'
  memberCount: number
  status: string
  viewerMembershipStatus: MembershipStatus
  viewerRole: GroupRole | null
}

export interface GroupDetail extends Omit<GroupCard, 'shortDescription'> {
  description: string
  joinRules: string | null
  createdAt: string
  owner: { userId: number; fullName: string; avatarUrl: string | null } | null
  canViewMembers: boolean
  pendingRequestCount: number | null
  conversationId: number | null
}

export interface GroupMember { userId: number; fullName: string; avatarUrl: string | null; headline: string | null; role: GroupRole; joinedAt: string | null }
export interface JoinRequest { requestId: number; userId: number; fullName: string; avatarUrl: string | null; headline: string | null; requestedAt: string | null }

export interface GroupInput {
  name: string
  description: string
  category: string
  topics: string[]
  privacy: 'PUBLIC' | 'PRIVATE'
  joinRules: string | null
  coverImageUrl: string | null
}

export interface PostAuthor { userId: number; fullName: string; avatarUrl: string; roleLabel: string }
export interface GroupPost {
  id: number
  groupId: number
  author: PostAuthor
  content: string
  topic: string | null
  imageUrls: string[]
  isPinned: boolean
  likeCount: number
  commentCount: number
  likedByViewer: boolean
  canPin: boolean
  canEdit: boolean
  canDelete: boolean
  createdAt: string
}
export interface GroupComment {
  id: number
  postId: number
  parentId: number | null
  author: PostAuthor
  content: string
  canEdit: boolean
  canDelete: boolean
  createdAt: string
}

type Raw = Record<string, any>
const pl = (b: any): any => (b && typeof b === 'object' && 'data' in b ? b.data : b)
const pageOf = <T>(body: any, page: number, map: (r: Raw) => T = (r) => r as T) => {
  const d = pl(body) ?? {}
  const items = ((d.content ?? []) as Raw[]).map(map)
  return { items, page, hasMore: d.last === false, total: Number(d.totalElements ?? items.length) }
}
const card = (r: Raw): GroupCard => ({
  id: Number(r.id), name: r.name ?? '', shortDescription: r.shortDescription ?? '', coverImageUrl: r.coverImageUrl ?? null,
  category: r.category ?? 'other', topics: r.topics ?? [], privacy: r.privacy === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
  memberCount: r.memberCount ?? 0, status: r.status ?? 'ACTIVE', viewerMembershipStatus: r.viewerMembershipStatus ?? 'NONE', viewerRole: r.viewerRole ?? null,
})
const detail = (r: Raw): GroupDetail => ({
  ...card(r), description: r.description ?? '', joinRules: r.joinRules ?? null, createdAt: r.createdAt ?? '',
  owner: r.owner ? { userId: Number(r.owner.userId), fullName: r.owner.fullName ?? '', avatarUrl: r.owner.avatarUrl ?? null } : null,
  canViewMembers: !!r.canViewMembers, pendingRequestCount: r.pendingRequestCount ?? null, conversationId: r.conversationId ?? null,
})

export const GROUP_PAGE_SIZE = 12

export const groupApi = {
  list: async (o: { page?: number; keyword?: string; category?: string }) => {
    const params: Record<string, string | number> = { page: o.page ?? 0, size: GROUP_PAGE_SIZE }
    if (o.keyword?.trim()) params.keyword = o.keyword.trim()
    if (o.category) params.category = o.category
    return pageOf(await http.get('/groups', { params }), o.page ?? 0, card)
  },
  mine: async (page = 0) => pageOf(await http.get('/groups/my-groups', { params: { page, size: GROUP_PAGE_SIZE } }), page, card),
  get: async (id: number | string) => detail(pl(await http.get(`/groups/${id}`))),
  create: async (i: GroupInput) => detail(pl(await http.post('/groups', i))),
  update: async (id: number, i: GroupInput) => detail(pl(await http.put(`/groups/${id}`, i))),
  setStatus: (id: number, status: 'ACTIVE' | 'INACTIVE') => http.put(`/groups/${id}/status`, { status }),
  remove: (id: number) => http.delete(`/groups/${id}`),
  join: async (id: number) => pl(await http.post(`/groups/${id}/join`)) as { viewerMembershipStatus: MembershipStatus; message: string },
  leave: async (id: number, newOwnerId?: number) =>
    pl(await http.delete(`/groups/${id}/join`, newOwnerId ? { data: { newOwnerId } } : undefined)) as { message: string },
  members: async (id: number, page = 0, keyword = '') =>
    pageOf(await http.get(`/groups/${id}/members`, { params: { page, size: 20, ...(keyword ? { keyword } : {}) } }), page, (r) => ({ ...r, userId: Number(r.userId) }) as GroupMember),
  joinRequests: async (id: number, page = 0) =>
    pageOf(await http.get(`/groups/${id}/join-requests`, { params: { page, size: 20 } }), page, (r) => ({ ...r, requestId: Number(r.requestId), userId: Number(r.userId) }) as JoinRequest),
  handleRequest: (id: number, requestId: number, action: 'APPROVE' | 'REJECT') => http.put(`/groups/${id}/join-requests/${requestId}`, { action }),
  removeMember: (id: number, userId: number) => http.delete(`/groups/${id}/members/${userId}`),
  changeRole: (id: number, userId: number, role: 'ADMIN' | 'MEMBER') => http.put(`/groups/${id}/members/${userId}/role`, { role }),

  posts: async (gid: number, page = 0) => {
    const d = pl(await http.get(`/groups/${gid}/posts`, { params: { page, size: 10 } })) ?? {}
    return { items: (d.content ?? []) as GroupPost[], page, hasMore: d.last === false }
  },
  post: async (gid: number, pid: number) => pl(await http.get(`/groups/${gid}/posts/${pid}`)) as GroupPost,
  createPost: async (gid: number, p: { content: string; topic?: string | null; imageUrls?: string[] }) => pl(await http.post(`/groups/${gid}/posts`, p)) as GroupPost,
  updatePost: async (gid: number, pid: number, p: { content: string; topic?: string | null; imageUrls?: string[] }) => pl(await http.put(`/groups/${gid}/posts/${pid}`, p)) as GroupPost,
  deletePost: (gid: number, pid: number) => http.delete(`/groups/${gid}/posts/${pid}`),
  toggleLike: async (gid: number, pid: number) => pl(await http.post(`/groups/${gid}/posts/${pid}/like`)) as { liked: boolean; likeCount: number },
  togglePin: (gid: number, pid: number) => http.put(`/groups/${gid}/posts/${pid}/pin`),
  comments: async (gid: number, pid: number, page = 0) => {
    const d = pl(await http.get(`/groups/${gid}/posts/${pid}/comments`, { params: { page, size: 20 } })) ?? {}
    return { items: (d.content ?? []) as GroupComment[], page, hasMore: d.last === false }
  },
  createComment: async (gid: number, pid: number, content: string, parentId?: number) =>
    pl(await http.post(`/groups/${gid}/posts/${pid}/comments`, { content, ...(parentId ? { parentId } : {}) })) as GroupComment,
  updateComment: async (gid: number, pid: number, cid: number, content: string) => pl(await http.put(`/groups/${gid}/posts/${pid}/comments/${cid}`, { content })) as GroupComment,
  deleteComment: (gid: number, pid: number, cid: number) => http.delete(`/groups/${gid}/posts/${pid}/comments/${cid}`),
  createChat: async (id: number) => pl(await http.post(`/groups/${id}/chat`)) as { conversationId: number },
  joinChat: async (id: number) => pl(await http.post(`/groups/${id}/chat/join`)) as { conversationId: number },
}
