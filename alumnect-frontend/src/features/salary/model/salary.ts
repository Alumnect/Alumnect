import { z } from 'zod'

/**
 * Model & schema cho tính năng Salary Board: UC50 (Contribute salary data) và UC53 (View salary
 * statistics). Định nghĩa kiểu dữ liệu ngành nghề, lượt đóng góp lương, thống kê lương, và schema
 * Zod dùng để xác thực/chuẩn hóa dữ liệu trả về từ API cũng như dữ liệu form gửi lên.
 */

/** Schema Zod cho một ngành nghề (dùng cho dropdown chọn ngành). */
export const industrySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string().default(''),
})
export type Industry = z.infer<typeof industrySchema>

/**
 * Schema Zod cho phản hồi sau khi đóng góp lương thành công. KHÔNG có trường định danh người
 * đóng góp (Salary Board ẩn danh) — khớp `SalaryContributionResponse` phía Backend.
 */
export const salaryContributionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  industry: z.string().default(''),
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  region: z.string().default(''),
  yearsExperience: z.number().nullable().optional(),
  grossAmount: z.union([z.string(), z.number()]).transform(Number).default(0),
  currency: z.string().default('VND'),
  createdAt: z.string().default(''),
})
export type SalaryContribution = z.infer<typeof salaryContributionSchema>

/** Mức lương gộp hàng tháng tối đa cho phép nhập (khớp cột NUMERIC(12,2) phía Backend). */
export const MAX_GROSS_AMOUNT = 9_999_999_999.99

/**
 * Schema Zod cho form đóng góp dữ liệu lương (UC50). Thông điệp lỗi khớp với validation phía
 * Backend (CreateSalaryContributionRequest). Không có trường `currency` — form luôn gửi VND
 * (Backend tự mặc định VND khi bỏ trống), giữ form gọn cho MVP.
 */
export const createSalaryContributionSchema = z.object({
  industryId: z.number().nullable(),
  jobTitle: z
    .string()
    .trim()
    .min(1, 'Chức danh công việc không được để trống')
    .max(150, 'Chức danh công việc không được vượt quá 150 ký tự'),
  company: z.string().trim().max(150, 'Tên công ty không được vượt quá 150 ký tự').optional(),
  region: z.string().trim().max(120, 'Khu vực làm việc không được vượt quá 120 ký tự').optional(),
  // input rỗng -> react-hook-form valueAsNumber trả NaN (không phải undefined/null) -> NaN khiến
  // z.number() báo lỗi parse -> .catch(null) bắt lỗi đó và quy về null, để trường tùy chọn này
  // không bị chặn validate khi bỏ trống. Dùng .catch thay vì .preprocess để giữ input type = number
  // (tránh unknown khiến zodResolver lệch generic với useForm<CreateSalaryContributionInput>).
  // .nullable() trước .catch() để output type = number | null (catch() yêu cầu giá trị fallback
  // khớp output type của schema, nên .catch(null) trên z.number() thuần sẽ lỗi type).
  yearsExperience: z.number().min(0, 'Số năm kinh nghiệm không được âm').max(60, 'Số năm kinh nghiệm không hợp lệ').nullable().catch(null),
  grossAmount: z
    .number({ message: 'Mức lương không được để trống' })
    .positive('Mức lương phải lớn hơn 0')
    .max(MAX_GROSS_AMOUNT, 'Mức lương không hợp lệ'),
})
export type CreateSalaryContributionInput = z.infer<typeof createSalaryContributionSchema>

/**
 * Schema Zod cho một dòng thống kê lương theo nhóm (chức danh + cấp bậc + khu vực) — UC53 View
 * salary statistics. Khớp `SalaryStatRowResponse` phía Backend.
 */
export const salaryStatRowSchema = z.object({
  role: z.string().default(''),
  level: z.string().default(''),
  region: z.string().default(''),
  median: z.union([z.string(), z.number()]).transform(Number).default(0),
  p25: z.union([z.string(), z.number()]).transform(Number).default(0),
  p75: z.union([z.string(), z.number()]).transform(Number).default(0),
  samples: z.union([z.string(), z.number()]).transform(Number).default(0),
})
export type SalaryStatRow = z.infer<typeof salaryStatRowSchema>

/**
 * Schema Zod cho thống kê lương tổng hợp (UC53) — số liệu tổng quan (KPI cards) + danh sách dòng
 * thống kê theo nhóm. Khớp `SalaryStatisticsResponse` phía Backend.
 */
export const salaryStatisticsSchema = z.object({
  totalContributions: z.union([z.string(), z.number()]).transform(Number).default(0),
  trackedPositions: z.union([z.string(), z.number()]).transform(Number).default(0),
  overallMedian: z
    .union([z.string(), z.number()])
    .transform(Number)
    .nullable()
    .catch(null),
  rows: z.array(salaryStatRowSchema).default([]),
})
export type SalaryStatistics = z.infer<typeof salaryStatisticsSchema>
