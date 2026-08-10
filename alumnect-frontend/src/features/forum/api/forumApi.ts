import http from '@/lib/http'
import { questionDetailSchema, questionSchema, topicSchema } from '../model/question'
import type { CreateQuestionInput, Question, QuestionDetail, QuestionPageResult, Topic } from '../model/question'

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

export const forumApi = {
  /**
   * Lấy một trang danh sách câu hỏi trên diễn đàn Q&A.
   * Gọi `GET /api/v1/questions?page={n}&size={m}&sort={s}[&topicId={id}]`.
   * @param page Chỉ số trang cần lấy (0-based)
   * @param sort Tiêu chí sắp xếp ('recent' | 'votes' | 'answers'), có thể ghép nhiều bằng dấu phẩy
   * @param topicIds Danh sách ID chủ đề để lọc (tick nhiều), rỗng = không lọc
   * @return Một trang kết quả đã chuẩn hóa (items + thông tin phân trang)
   */
  getQuestions: async ({
    page = 0,
    sort = 'recent',
    topicIds = [],
  }: { page?: number; sort?: string; topicIds?: number[] } = {}): Promise<QuestionPageResult> => {
    const query = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE), sort })
    // Gửi nhiều id chủ đề dạng CSV: topicId=3,7,9 — backend nhận List<Long>.
    if (topicIds.length > 0) query.set('topicId', topicIds.join(','))

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
}
