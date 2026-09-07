import http from '@/lib/http'
import { industrySchema, salaryContributionSchema, salaryStatisticsSchema } from '../model/salary'
import type { CreateSalaryContributionInput, Industry, SalaryContribution, SalaryStatistics } from '../model/salary'

/**
 * Tầng gọi API cho Salary Board: UC50 (Contribute salary data) và UC53 (View salary statistics).
 * Gọi thật `GET /api/v1/industries` (danh mục ngành nghề), `POST /api/v1/salary-contributions`
 * (đóng góp dữ liệu lương), và `GET /api/v1/salary-contributions/statistics` (thống kê lương).
 * Interceptor `http` tự bóc envelope `response.data`.
 */

/** Trích mảng phần tử thô từ phong bì (envelope) phản hồi — hỗ trợ `{ content }`/`{ items }`/mảng trực tiếp. */
function extractRawItems(body: unknown): unknown[] {
  const b = body as Record<string, unknown> | undefined
  const d = (b?.data ?? b) as Record<string, unknown> | unknown[] | undefined
  if (Array.isArray(d)) return d
  const obj = d as Record<string, unknown> | undefined
  const candidate = obj?.content ?? obj?.items
  return Array.isArray(candidate) ? candidate : []
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
   * Lấy thống kê lương tổng hợp cho Salary Board (UC53 - View salary statistics).
   * Gọi `GET /api/v1/salary-contributions/statistics`; yêu cầu đã đăng nhập (Student/Alumni).
   * @return Thống kê lương đã chuẩn hóa (KPI tổng quan + danh sách dòng theo nhóm)
   */
  getStatistics: async (): Promise<SalaryStatistics> => {
    const body = await http.get('/salary-contributions/statistics')
    const b = body as unknown as Record<string, unknown> | undefined
    const payload = (b?.data ?? b) as unknown
    return salaryStatisticsSchema.parse(payload)
  },
}
