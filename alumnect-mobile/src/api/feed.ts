import type { InfiniteData } from '@tanstack/react-query'
import http from '@/lib/http'
import { queryClient } from '@/lib/queryClient'

export type PostType = 'normal' | 'achievement' | 'recruitment' | 'event'

export interface Post {
  id: string
  authorId: string | null
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
  eventId?: string | null
  jobId?: string | null
  job: {
    title?: string
    company?: string
    location?: string | null
    salaryMin?: number | null
    salaryMax?: number | null
    applyUrl?: string | null
    contactEmail?: string | null
  } | null
  event: {
    id?: string | null
    title?: string
    location?: string | null
    startTime?: string | null
    endTime?: string | null
    capacity?: number | null
    attendeeCount: number
    isRegistered: boolean
    status?: string | null
  } | null
}

export interface Comment {
  id: string
  authorId: string | null
  author: string
  role: string
  avatar: string
  verified: boolean
  time: string
  text: string
  parentId: string | null
}

export type FeedFilter = PostType | 'all'
export const PAGE_SIZE = 10

export interface CreatePostInput {
  content: string
  type: PostType
  mediaUrls: string[]
  job?: { title?: string; company?: string; location?: string; salaryMin?: number; salaryMax?: number; applyUrl?: string; contactEmail?: string }
  event?: { title?: string; startTime?: string; endTime?: string; location?: string; capacity?: number }
}

type Raw = Record<string, any>
const str = (v: unknown) => (v === null || v === undefined ? null : String(v))
const unwrap = (b: any): any => b?.data ?? b

export function normalizePost(r: Raw): Post {
  const types: PostType[] = ['normal', 'achievement', 'recruitment', 'event']
  return {
    id: String(r.id),
    authorId: str(r.authorId),
    type: types.includes(r.type) ? r.type : 'normal',
    author: r.author ?? 'Ẩn danh',
    role: r.role ?? '',
    avatar: r.avatar ?? '',
    verified: !!r.verified,
    time: r.time ?? '',
    text: r.text ?? '',
    image: r.image ?? null,
    images: Array.isArray(r.images) ? r.images : [],
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    reposts: r.reposts ?? 0,
    liked: !!r.liked,
    saved: !!r.saved,
    eventId: str(r.eventId),
    jobId: str(r.jobId),
    job: r.job ?? null,
    event: r.event
      ? { ...r.event, id: str(r.event.id), attendeeCount: r.event.attendeeCount ?? 0, isRegistered: !!r.event.isRegistered }
      : null,
  }
}

export function normalizeComment(r: Raw): Comment {
  return {
    id: String(r.id),
    authorId: str(r.authorId),
    author: r.author ?? 'Ẩn danh',
    role: r.role ?? '',
    avatar: r.avatar ?? '',
    verified: !!r.verified,
    time: r.time ?? '',
    text: r.text ?? '',
    parentId: str(r.parentId),
  }
}

function pageOf<T>(body: any, map: (r: Raw) => T, page: number) {
  const d = unwrap(body)
  const raw: Raw[] = Array.isArray(d) ? d : (d?.content ?? d?.items ?? [])
  const items = raw.map(map)
  const hasMore = typeof d?.last === 'boolean' ? !d.last : items.length >= PAGE_SIZE
  return { items, page, hasMore }
}

export interface AiStudioResponse {
  detectedType: PostType
  polishedContent: string
  jobData?: {
    title?: string
    company?: string
    location?: string
    salaryMin?: number
    salaryMax?: number
    contactEmail?: string
    applyUrl?: string
  } | null
  eventData?: {
    title?: string
    location?: string
    startTime?: string
    endTime?: string
    capacity?: number
  } | null
  posterSpec: {
    illustrationScene: string
    colorPalette: string
    badgeText?: string | null
    headline: string
    subheadline?: string | null
    highlightPill?: string | null
    locationText?: string | null
    bulletPoints?: string[] | null
  }
  source?: string
}

export function syncPostLikeInCache(postId: string, patch: { likes?: number; liked?: boolean; saved?: boolean }) {
  const pid = String(postId)
  const updateList = (old: InfiniteData<{ items: Post[]; page: number; hasMore: boolean }> | undefined) => {
    if (!old?.pages) return old
    return {
      ...old,
      pages: old.pages.map((p) => ({
        ...p,
        items: p.items.map((post) =>
          String(post.id) === pid
            ? {
                ...post,
                ...(patch.likes !== undefined ? { likes: patch.likes } : {}),
                ...(patch.liked !== undefined ? { liked: patch.liked } : {}),
                ...(patch.saved !== undefined ? { saved: patch.saved } : {}),
              }
            : post,
        ),
      })),
    }
  }
  queryClient.setQueriesData({ queryKey: ['feed'] }, updateList)
  queryClient.setQueriesData({ queryKey: ['user-posts'] }, updateList)
  queryClient.setQueriesData({ queryKey: ['saved-posts'] }, updateList)
  queryClient.setQueryData<Post>(['post', pid], (old) => {
    if (!old) return old
    return {
      ...old,
      ...(patch.likes !== undefined ? { likes: patch.likes } : {}),
      ...(patch.liked !== undefined ? { liked: patch.liked } : {}),
      ...(patch.saved !== undefined ? { saved: patch.saved } : {}),
    }
  })
}

export const feedApi = {
  aiStudio: async (prompt: string, preferredType?: string): Promise<AiStudioResponse> => {
    const res: any = await http.post('/posts/ai-studio', { prompt, preferredType }, { timeout: 25000 })
    return unwrap(res)
  },
  getFeed: async ({ page = 0, filter = 'all' as FeedFilter, keyword = '', eventFilter }: { page?: number; filter?: FeedFilter; keyword?: string; eventFilter?: string }) => {
    const params: Record<string, string | number> = { page, size: PAGE_SIZE }
    if (filter !== 'all') params.type = filter
    if (keyword.trim()) params.keyword = keyword.trim()
    if (eventFilter) params.eventFilter = eventFilter
    return pageOf(await http.get('/posts', { params }), normalizePost, page)
  },
  getSaved: async (page = 0) => pageOf(await http.get('/posts/saved', { params: { page, size: PAGE_SIZE } }), normalizePost, page),
  getUserPosts: async (userId: string | number, page = 0, category = 'all') =>
    pageOf(await http.get(`/posts/user/${userId}`, { params: { page, size: PAGE_SIZE, category } }), normalizePost, page),
  getPost: async (id: string) => normalizePost(unwrap(await http.get(`/posts/${id}`))),
  getComments: async (id: string, page = 0) =>
    pageOf(await http.get(`/posts/${id}/comments`, { params: { page, size: PAGE_SIZE } }), normalizeComment, page),
  createPost: async (input: CreatePostInput) => normalizePost(unwrap(await http.post('/posts', input))),
  editPost: async (id: string, input: CreatePostInput) => normalizePost(unwrap(await http.put(`/posts/${id}`, input))),
  deletePost: (id: string) => http.delete(`/posts/${id}`),
  like: async (id: string) => {
    const res = await http.post(`/posts/${id}/like`)
    const d = unwrap(res)
    if (d && typeof d.likeCount === 'number') {
      syncPostLikeInCache(id, { likes: d.likeCount, liked: !!d.liked })
    }
    return res
  },
  unlike: async (id: string) => {
    const res = await http.delete(`/posts/${id}/like`)
    const d = unwrap(res)
    if (d && typeof d.likeCount === 'number') {
      syncPostLikeInCache(id, { likes: d.likeCount, liked: !!d.liked })
    }
    return res
  },
  save: async (id: string) => {
    const res = await http.post(`/posts/${id}/save`)
    syncPostLikeInCache(id, { saved: true })
    return res
  },
  unsave: async (id: string) => {
    const res = await http.delete(`/posts/${id}/save`)
    syncPostLikeInCache(id, { saved: false })
    return res
  },
  createComment: async (postId: string, content: string, parentId?: string) =>
    normalizeComment(unwrap(await http.post(`/posts/${postId}/comments`, { content, ...(parentId ? { parentId: Number(parentId) } : {}) }))),
  updateComment: async (postId: string, commentId: string, content: string) =>
    normalizeComment(unwrap(await http.put(`/posts/${postId}/comments/${commentId}`, { content }))),
  deleteComment: (postId: string, commentId: string) => http.delete(`/posts/${postId}/comments/${commentId}`),
  report: (postId: string, payload: { reason: string; description?: string }) => http.post(`/posts/${postId}/reports`, payload),
}
