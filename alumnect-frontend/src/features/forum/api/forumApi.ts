import axios from 'axios'
import http from '@/lib/http'
import { questionDetailSchema, questionSchema, topicSchema } from '../model/question'
import type { CreateQuestionInput, Question, QuestionDetail, QuestionPageResult, Topic, UpdateQuestionInput } from '../model/question'
import { answerSchema } from '../model/answer'
import type { Answer, AnswerPageResult, CreateAnswerInput, UpdateAnswerInput } from '../model/answer'

/**
 * Tầng gọi API cho UC38 - View question list.
 * Gọi thật `GET /api/v1/questions` (danh sách câu hỏi) và `GET /api/v1/questions/topics`
 * (danh mục chủ đề để lọc). Interceptor `http` tự bóc envelope `response.data`.
 */

/** Số câu hỏi mỗi trang (đồng bộ với tham số `size` mặc định của backend). */
export const PAGE_SIZE = 10

/**
 * Trích mảng phần tử thô từ nhiều biến thể phong bì (envelope) phản hồi:
 * hỗ trợ Spring Page (`content`), dạng `{ items }` hoặc mảng trực tiếp.
 * @param body Dữ liệu đã được interceptor `http` bóc sẵn (response.data)
 * @return Mảng phần tử thô chưa xác thực
 */
function extractRawItems(body: unknown): unknown[] {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | unknown[] | undefined
  if (Array.isArray(d)) return d
  const obj = d as Record<string, unknown> | undefined
  const candidate = obj?.content ?? obj?.items ?? obj?.questions
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
  if (typeof d?.last === 'boolean') return !d.last
  if (typeof d?.hasMore === 'boolean') return d.hasMore
  if (typeof d?.pageNumber === 'number' && typeof d?.totalPages === 'number') {
    return d.pageNumber + 1 < d.totalPages
  }
  return received >= PAGE_SIZE
}

/** Xác thực & chuẩn hóa mảng thô thành Question[], bỏ qua phần tử hỏng. */
function parseQuestions(raw: unknown[]): Question[] {
  const out: Question[] = []
  for (const r of raw) {
    const res = questionSchema.safeParse(r)
    if (res.success) out.push(res.data)
  }
  return out
}

/** Trích tổng số phần tử (totalElements) từ phong bì phản hồi phân trang; fallback nếu không có. */
function extractTotal(body: unknown, fallback: number): number {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | undefined
  if (typeof d?.totalElements === 'number') return d.totalElements
  if (typeof d?.total === 'number') return d.total
  return fallback
}

/** Xác thực & chuẩn hóa mảng thô thành Answer[], bỏ qua phần tử hỏng. */
function parseAnswers(raw: unknown[]): Answer[] {
  const out: Answer[] = []
  for (const r of raw) {
    const res = answerSchema.safeParse(r)
    if (res.success) out.push(res.data)
  }
  return out
}

export const forumApi = {
  /**
   * Lấy một trang danh sách câu hỏi trên diễn đàn Q&A, có thể kèm tìm kiếm theo từ khóa (UC44 - Search questions).
   * Gọi `GET /api/v1/questions?page={n}&size={m}&sort={s}[&keyword={k}][&topicId={id}]`.
   * @param page Chỉ số trang cần lấy (0-based)
   * @param sort Tiêu chí sắp xếp ('recent' | 'votes' | 'answers'), có thể ghép nhiều bằng dấu phẩy
   * @param keyword Từ khóa tìm kiếm trên tiêu đề/nội dung câu hỏi, rỗng = không tìm kiếm
   * @param topicIds Danh sách ID thể loại để lọc (tick nhiều), rỗng = không lọc
   * @param majorIds Danh sách ID ngành để lọc (tick nhiều), rỗng = không lọc — độc lập với thể loại
   * @return Một trang kết quả đã chuẩn hóa (items + thông tin phân trang)
   */
  getQuestions: async ({
    page = 0,
    sort = 'recent',
    keyword = '',
    topicIds = [],
    majorIds = [],
  }: { page?: number; sort?: string; keyword?: string; topicIds?: number[]; majorIds?: number[] } = {}): Promise<QuestionPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort })
    // Gửi nhiều id dạng CSV: topicId=3,7,9 / majorId=1,4 — backend nhận List<Long>.
    if (keyword.trim()) query.set('keyword', keyword.trim())
    if (topicIds.length > 0) query.set('topicId', topicIds.join(','))
    if (majorIds.length > 0) query.set('majorId', majorIds.join(','))

    const body = await http.get(`/questions?${query.toString()}`)
    const items = parseQuestions(extractRawItems(body))
    return { items, page, hasMore: inferHasMore(body, items.length) }
  },

  /**
   * Đặt một câu hỏi mới (UC40 - Ask a question).
   * Gọi `POST /api/v1/questions`; interceptor `http` tự đính Bearer token của người dùng.
   * @param input Tiêu đề, nội dung và chủ đề (tùy chọn)
   * @return Chi tiết câu hỏi vừa tạo đã chuẩn hóa (để điều hướng sang trang chi tiết)
   */
  createQuestion: async (input: CreateQuestionInput): Promise<QuestionDetail> => {
    const body = await http.post('/questions', input)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return questionDetailSchema.parse(payload)
  },

  /**
   * Chỉnh sửa một câu hỏi đã có (UC46 - Edit a question).
   * Gọi `PUT /api/v1/questions/{id}`; interceptor `http` tự đính Bearer token. Chỉ tác giả sửa được (BE chặn 403).
   * @param id ID câu hỏi cần sửa
   * @param input Dữ liệu mới (tiêu đề, nội dung, thể loại, ngành, ảnh)
   * @return Chi tiết câu hỏi sau khi cập nhật đã chuẩn hóa
   */
  updateQuestion: async ({ id, input }: { id: string | number; input: UpdateQuestionInput }): Promise<QuestionDetail> => {
    const body = await http.put(`/questions/${id}`, input)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return questionDetailSchema.parse(payload)
  },

  /**
   * Tải một ảnh đính kèm câu hỏi lên storage qua presigned URL, trả về URL công khai để lưu vào câu hỏi.
   * Cùng cơ chế với ảnh bài đăng: xin link ký sẵn → PUT thẳng file lên storage → dùng publicUrl.
   * @param file Ảnh do người dùng chọn
   * @return URL công khai của ảnh sau khi upload
   */
  uploadQuestionImage: async (file: File): Promise<string> => {
    const res = await http.get<unknown, { data: { uploadUrl: string; publicUrl: string } }>(
      `/files/presigned-url?fileName=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}&folder=questions`,
    )
    const { uploadUrl, publicUrl } = res.data
    await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } })
    return publicUrl
  },

  /**
   * Lấy chi tiết một câu hỏi theo id (UC39 - View question detail).
   * Gọi `GET /api/v1/questions/{id}`. Interceptor `http` đã bóc envelope, ở đây bóc thêm
   * trường `data` (payload chi tiết) rồi xác thực bằng Zod để chuẩn hóa dữ liệu trước khi render.
   * @param id ID câu hỏi cần xem
   * @return Chi tiết câu hỏi đã chuẩn hóa
   * @throws Error nếu dữ liệu trả về không hợp lệ (schema không khớp)
   */
  getQuestionById: async (id: string | number): Promise<QuestionDetail> => {
    const body = await http.get(`/questions/${id}`)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return questionDetailSchema.parse(payload)
  },

  /**
   * Lấy toàn bộ danh mục chủ đề để đổ vào bộ lọc.
   * Gọi `GET /api/v1/questions/topics`.
   * @return Danh sách chủ đề đã chuẩn hóa (id + name)
   */
  getTopics: async (): Promise<Topic[]> => {
    const body = await http.get('/questions/topics')
    const raw = extractRawItems(body)
    const out: Topic[] = []
    for (const r of raw) {
      const res = topicSchema.safeParse(r)
      if (res.success) out.push(res.data)
    }
    return out
  },

  /**
   * Lấy một trang câu trả lời của một câu hỏi (UC41 - Answer a question).
   * Gọi `GET /api/v1/questions/{questionId}/answers?page={n}&size={m}`.
   * @param questionId ID câu hỏi cần lấy câu trả lời
   * @param page Chỉ số trang cần lấy (0-based)
   * @return Một trang kết quả đã chuẩn hóa (items + thông tin phân trang)
   */
  getAnswers: async ({
    questionId,
    page = 0,
  }: { questionId: string | number; page?: number }): Promise<AnswerPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })
    const body = await http.get(`/questions/${questionId}/answers?${query.toString()}`)
    const items = parseAnswers(extractRawItems(body))
    return { items, page, hasMore: inferHasMore(body, items.length), total: extractTotal(body, items.length) }
  },

  /**
   * Gửi một câu trả lời mới, hoặc reply cho một câu trả lời gốc (UC41 - Answer, reply lồng nhau).
   * Gọi `POST /api/v1/questions/{questionId}/answers`; interceptor `http` tự đính Bearer token.
   * @param questionId ID câu hỏi được trả lời
   * @param input Nội dung câu trả lời
   * @param parentId ID câu trả lời cha (tùy chọn) — có giá trị nếu đây là reply
   * @return Câu trả lời vừa tạo đã chuẩn hóa
   */
  createAnswer: async ({
    questionId,
    input,
    parentId,
  }: { questionId: string | number; input: CreateAnswerInput; parentId?: string | null }): Promise<Answer> => {
    const payloadReq = parentId ? { ...input, parentId: Number(parentId) } : input
    const body = await http.post(`/questions/${questionId}/answers`, payloadReq)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return answerSchema.parse(payload)
  },

  /**
   * Chỉnh sửa một câu trả lời (hoặc reply) (UC48 - Edit an answer).
   * Gọi `PUT /api/v1/questions/{questionId}/answers/{answerId}`; chỉ tác giả sửa được (BE chặn 403).
   * @param questionId ID câu hỏi chứa câu trả lời
   * @param answerId ID câu trả lời cần sửa
   * @param input Nội dung mới
   * @return Câu trả lời sau khi cập nhật đã chuẩn hóa
   */
  updateAnswer: async ({
    questionId,
    answerId,
    input,
  }: { questionId: string | number; answerId: string | number; input: UpdateAnswerInput }): Promise<Answer> => {
    const body = await http.put(`/questions/${questionId}/answers/${answerId}`, input)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return answerSchema.parse(payload)
  },
}
