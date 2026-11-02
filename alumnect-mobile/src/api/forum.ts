import http from '@/lib/http'

export interface Question {
  id: string
  authorId: string | null
  title: string
  excerpt: string
  topic: string
  major: string
  images: string[]
  author: string
  avatar: string
  verified: boolean
  votes: number
  voted: boolean
  answers: number
  time: string
}

export interface QuestionDetail {
  id: string
  title: string
  body: string
  topic: string
  topicId: number | null
  major: string
  majorId: number | null
  images: string[]
  authorId: string
  author: string
  avatar: string
  authorHeadline: string
  verified: boolean
  votes: number
  voted: boolean
  answers?: number
  time?: string
  createdAt?: string
}

export interface AnswerBase {
  id: string
  parentId: string | null
  authorId: string | null
  body: string
  author: string
  avatar: string
  authorHeadline: string
  verified: boolean
  votes: number
  voted: boolean
  time: string
  edited: boolean
}
export interface Answer extends AnswerBase {
  replies: AnswerBase[]
}

export interface Topic { id: number; name: string }

export interface QuestionInput {
  title: string
  body: string
  topicId: number | null
  majorId: number | null
  imageUrls: string[]
}

export const PAGE_SIZE = 10
type Raw = Record<string, any>
const unwrap = (b: any): any => b?.data ?? b
const s = (v: unknown) => (v == null ? null : String(v))

function page<T>(body: any, map: (r: Raw) => T, p: number) {
  const d = unwrap(body)
  const raw: Raw[] = Array.isArray(d) ? d : (d?.content ?? [])
  const items = raw.map(map)
  return { items, page: p, hasMore: typeof d?.last === 'boolean' ? !d.last : items.length >= PAGE_SIZE, total: d?.totalElements ?? items.length }
}

const mapQuestion = (r: Raw): Question => ({
  id: String(r.id), authorId: s(r.authorId), title: r.title ?? '', excerpt: r.excerpt ?? '', topic: r.topic ?? '', major: r.major ?? '',
  images: r.images ?? [], author: r.author ?? 'Ẩn danh', avatar: r.avatar ?? '', verified: !!r.verified,
  votes: r.votes ?? 0, voted: !!r.voted, answers: r.answers ?? 0, time: r.time ?? '',
})
const mapAnswerBase = (r: Raw): AnswerBase => ({
  id: String(r.id), parentId: s(r.parentId), authorId: s(r.authorId), body: r.body ?? '', author: r.author ?? 'Ẩn danh',
  avatar: r.avatar ?? '', authorHeadline: r.authorHeadline ?? '', verified: !!r.verified, votes: r.votes ?? 0,
  voted: !!r.voted, time: r.time ?? '', edited: !!r.edited,
})
const mapAnswer = (r: Raw): Answer => ({ ...mapAnswerBase(r), replies: (r.replies ?? []).map(mapAnswerBase) })
const mapDetail = (r: Raw): QuestionDetail => ({
  id: String(r.id), title: r.title ?? '', body: r.body ?? '', topic: r.topic ?? '', topicId: r.topicId ?? null,
  major: r.major ?? '', majorId: r.majorId ?? null, images: r.images ?? [], authorId: String(r.authorId ?? ''),
  author: r.author ?? 'Ẩn danh', avatar: r.avatar ?? '', authorHeadline: r.authorHeadline ?? '', verified: !!r.verified,
  votes: r.votes ?? 0, voted: !!r.voted, answers: r.answers, time: r.time, createdAt: r.createdAt,
})

export const forumApi = {
  /** Lọc nhiều thể loại / nhiều ngành: backend nhận danh sách id phân tách bằng dấu phẩy (giống Web). */
  list: async (o: { page?: number; sort?: string; keyword?: string; topicId?: number; topicIds?: number[]; majorIds?: number[] }) => {
    const params: Record<string, string | number> = { page: o.page ?? 0, size: PAGE_SIZE, sort: o.sort ?? 'recent' }
    if (o.keyword?.trim()) params.keyword = o.keyword.trim()
    const topics = o.topicIds?.length ? o.topicIds : o.topicId ? [o.topicId] : []
    if (topics.length) params.topicId = topics.join(',')
    if (o.majorIds?.length) params.majorId = o.majorIds.join(',')
    return page(await http.get('/questions', { params }), mapQuestion, o.page ?? 0)
  },
  topics: async (): Promise<Topic[]> => {
    const d = unwrap(await http.get('/questions/topics'))
    return (Array.isArray(d) ? d : d?.content ?? []).map((t: Raw) => ({ id: Number(t.id), name: t.name ?? '' }))
  },
  get: async (id: string) => mapDetail(unwrap(await http.get(`/questions/${id}`))),
  create: async (i: QuestionInput) => mapDetail(unwrap(await http.post('/questions', i))),
  update: async (id: string, i: QuestionInput) => mapDetail(unwrap(await http.put(`/questions/${id}`, i))),
  remove: (id: string) => http.delete(`/questions/${id}`),
  vote: (id: string) => http.post(`/questions/${id}/vote`),
  unvote: (id: string) => http.delete(`/questions/${id}/vote`),
  answers: async (qid: string, p = 0) => page(await http.get(`/questions/${qid}/answers`, { params: { page: p, size: PAGE_SIZE } }), mapAnswer, p),
  answer: async (qid: string, body: string, parentId?: string) =>
    mapAnswer(unwrap(await http.post(`/questions/${qid}/answers`, { body, ...(parentId ? { parentId: Number(parentId) } : {}) }))),
  updateAnswer: async (qid: string, aid: string, body: string) => mapAnswer(unwrap(await http.put(`/questions/${qid}/answers/${aid}`, { body }))),
  deleteAnswer: (qid: string, aid: string) => http.delete(`/questions/${qid}/answers/${aid}`),
  voteAnswer: (qid: string, aid: string) => http.post(`/questions/${qid}/answers/${aid}/vote`),
  unvoteAnswer: (qid: string, aid: string) => http.delete(`/questions/${qid}/answers/${aid}/vote`),
}
