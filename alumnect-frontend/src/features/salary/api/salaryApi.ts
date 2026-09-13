import http from '@/lib/http'
import { industrySchema, salaryContributionSchema, salaryStatisticsSchema } from '../model/salary'
import type { CreateSalaryContributionInput, Industry, SalaryContribution, SalaryStatistics, SalaryStatisticsFilters } from '../model/salary'

/**
 * Tầng gọi API cho Salary Board: UC50 (Contribute salary data), UC51 (Edit salary contribution),
 * UC52 (Delete salary contribution), UC53 (View salary statistics), UC54 (Filter salary data), và
 * feed từng lượt đóng góp ẩn danh. Gọi thật `GET /api/v1/industries` (danh mục ngành nghề),
 * `POST /api/v1/salary-contributions` (đóng góp), `GET /api/v1/salary-contributions/mine` (danh
 * sách đóng góp của chính mình), `PUT /api/v1/salary-contributions/{id}` (sửa),
 * `DELETE /api/v1/salary-contributions/{id}` (xóa), `GET /api/v1/salary-contributions/statistics`
 * (thống kê, kèm query param lọc tùy chọn), và `GET /api/v1/salary-contributions/feed` (từng lượt
 * đóng góp, phân trang, ẩn danh). Interceptor `http` tự bóc envelope `response.data`.
 */

/** Kích thước trang mặc định cho feed từng lượt đóng góp (khớp default phía Backend). */
export const FEED_PAGE_SIZE = 12

/** Trích mảng phần tử thô từ phong bì (envelope) phản hồi — hỗ trợ `{ content }`/`{ items }`/mảng trực tiếp. */
function extractRawItems(body: unknown): unknown[] {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | unknown[] | undefined
  if (Array.isArray(d)) return d
  const obj = d as Record<string, unknown> | undefined
  const candidate = obj?.content ?? obj?.items
  return Array.isArray(candidate) ? candidate : []
}

/** Suy ra còn trang tiếp theo hay không từ `PageResponse` (`last`/`hasMore`/`pageNumber`+`totalPages`) — cùng cách làm `forumApi.inferHasMore` (UC38). */
function inferHasMore(body: unknown, received: number): boolean {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | undefined
  if (typeof d?.last === 'boolean') return !d.last
  if (typeof d?.hasMore === 'boolean') return d.hasMore
  if (typeof d?.pageNumber === 'number' && typeof d?.totalPages === 'number') {
    return d.pageNumber + 1 < d.totalPages
  }
  return received >= FEED_PAGE_SIZE
}

export const salaryApi = {
  /**
   * Lấy toàn bộ danh mục ngành nghề để đổ vào dropdown chọn ngành khi đóng góp dữ liệu lương.
   * Gọi `GET /api/v1/industries` — công khai, không cần đăng nhập.
   * @return Danh sách ngành nghề đã chuẩn hóa
   */
  getIndustries: async (): Promise<Industry[]> => {
    const body = await http.get('/industries')
    const raw = extractRawItems(body)
    const out: Industry[] = []
    for (const r of raw) {
      const res = industrySchema.safeParse(r)
      if (res.success) out.push(res.data)
    }
    return out
  },

  /**
   * Đóng góp một mẫu lương ẩn danh lên Salary Board (UC50 - Contribute salary data).
   * Gọi `POST /api/v1/salary-contributions`; interceptor `http` tự đính Bearer token.
   * Chỉ Cựu sinh viên (ALUMNI) đóng góp được (BE chặn 403 với vai trò khác).
   * @param input Dữ liệu lương đã hợp lệ (chức danh, mức lương bắt buộc; các trường còn lại tùy chọn)
   * @return Chi tiết lượt đóng góp vừa tạo đã chuẩn hóa (không chứa thông tin định danh)
   */
  createContribution: async (input: CreateSalaryContributionInput): Promise<SalaryContribution> => {
    const body = await http.post('/salary-contributions', input)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return salaryContributionSchema.parse(payload)
  },

  /**
   * Lấy toàn bộ lượt đóng góp lương của chính người dùng đang đăng nhập (UC51 - Edit salary
   * contribution) — để xem lại và chọn bản ghi cần sửa. Gọi `GET /api/v1/salary-contributions/mine`.
   * @return Danh sách lượt đóng góp của chính mình, mới nhất trước
   */
  getMyContributions: async (): Promise<SalaryContribution[]> => {
    const body = await http.get('/salary-contributions/mine')
    const raw = extractRawItems(body)
    const out: SalaryContribution[] = []
    for (const r of raw) {
      const res = salaryContributionSchema.safeParse(r)
      if (res.success) out.push(res.data)
    }
    return out
  },

  /**
   * Chỉnh sửa một lượt đóng góp lương đã có (UC51 - Edit salary contribution).
   * Gọi `PUT /api/v1/salary-contributions/{id}`; chỉ chính chủ sửa được (BE chặn 403 người khác).
   * @param id    ID lượt đóng góp cần sửa
   * @param input Dữ liệu lương mới (cùng bộ trường với lúc tạo)
   * @return Chi tiết lượt đóng góp sau khi sửa đã chuẩn hóa
   */
  updateContribution: async (id: string, input: CreateSalaryContributionInput): Promise<SalaryContribution> => {
    const body = await http.put(`/salary-contributions/${id}`, input)
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return salaryContributionSchema.parse(payload)
  },

  /**
   * Xóa (cứng) một lượt đóng góp lương đã có (UC52 - Delete salary contribution). Không thể hoàn tác.
   * Gọi `DELETE /api/v1/salary-contributions/{id}`; chỉ chính chủ xóa được (BE chặn 403 người khác).
   * @param id ID lượt đóng góp cần xóa
   */
  deleteContribution: async (id: string): Promise<void> => {
    await http.delete(`/salary-contributions/${id}`)
  },

  /**
   * Lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics), có thể kèm bộ lọc
   * tùy chọn theo ngành/khu vực/chức danh/cấp bậc (UC54 - Filter salary data).
   * Gọi `GET /api/v1/salary-contributions/statistics`; yêu cầu đã đăng nhập (Student/Alumni).
   * @param filters Bộ lọc tùy chọn — bỏ trống = xem toàn bộ
   * @return Thống kê lương đã chuẩn hóa (KPI tổng quan + danh sách dòng theo nhóm), khớp bộ lọc nếu có
   */
  getStatistics: async (filters?: SalaryStatisticsFilters): Promise<SalaryStatistics> => {
    const params: Record<string, string | number> = {}
    if (filters?.industryId != null) params.industryId = filters.industryId
    if (filters?.region) params.region = filters.region
    if (filters?.jobTitle) params.jobTitle = filters.jobTitle
    if (filters?.level) params.level = filters.level

    const body = await http.get('/salary-contributions/statistics', { params })
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return salaryStatisticsSchema.parse(payload)
  },

  /**
   * Lấy TỪNG lượt đóng góp lương trong toàn hệ thống (không lọc theo chủ sở hữu), phân trang, mới
   * nhất trước — khác `getStatistics` (chỉ số liệu tổng hợp theo nhóm, có ngưỡng mẫu tối thiểu).
   * Vẫn ẩn danh tuyệt đối — `SalaryContributionResponse` không có trường định danh người đóng góp.
   * Gọi `GET /api/v1/salary-contributions/feed`; yêu cầu đã đăng nhập (Student/Alumni).
   * @param page Số trang (0-indexed)
   * @return Danh sách lượt đóng góp của trang này + cờ còn trang tiếp theo hay không
   */
  getFeed: async (page: number): Promise<{ items: SalaryContribution[]; page: number; hasMore: boolean }> => {
    const body = await http.get(`/salary-contributions/feed?page=${page}&size=${FEED_PAGE_SIZE}`)
    const raw = extractRawItems(body)
    const items: SalaryContribution[] = []
    for (const r of raw) {
      const res = salaryContributionSchema.safeParse(r)
      if (res.success) items.push(res.data)
    }
    return { items, page, hasMore: inferHasMore(body, items.length) }
  },
}
