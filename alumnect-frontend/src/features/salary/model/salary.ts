import { z } from 'zod'
import type { LucideIcon } from 'lucide-react'
import {
  Code2,
  TrendingUp,
  Megaphone,
  Palette,
  MessagesSquare,
  FileText,
  ShieldCheck,
  Briefcase,
  MapPin,
  GraduationCap,
  LayoutGrid,
} from 'lucide-react'

/**
 * Model & schema cho tính năng Salary Board: UC50 (Contribute salary data), UC51 (Edit salary
 * contribution), UC53 (View salary statistics), UC54 (Filter salary data). Định nghĩa kiểu dữ liệu
 * ngành nghề, lượt đóng góp lương, thống kê lương, bộ lọc, và schema Zod dùng để xác thực/chuẩn hóa
 * dữ liệu trả về từ API cũng như dữ liệu form gửi lên.
 */

/** Schema Zod cho một ngành nghề (dùng cho dropdown chọn ngành). */
export const industrySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(Number),
  name: z.string().default(''),
})
export type Industry = z.infer<typeof industrySchema>

/**
 * Schema Zod cho một lượt đóng góp lương — trả về sau khi tạo (UC50), khi xem danh sách đóng góp
 * của chính mình (UC51 - Edit salary contribution), và sau khi sửa. KHÔNG có trường định danh
 * người đóng góp (Salary Board ẩn danh với người khác) — khớp `SalaryContributionResponse` phía
 * Backend. `industryId` dùng để điền sẵn dropdown khi mở form sửa.
 */
export const salaryContributionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  industryId: z.union([z.string(), z.number()]).transform(Number).nullable().catch(null),
  industry: z.string().default(''),
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  region: z.string().default(''),
  locationCity: z.string().optional().default(''),
  yearsExperience: z.number().nullable().optional(),
  grossAmount: z.union([z.string(), z.number()]).transform(Number).default(0),
  currency: z.string().default('VND'),
  createdAt: z.string().default(''),
})
export type SalaryContribution = z.infer<typeof salaryContributionSchema>

/** Mức lương gộp hàng tháng tối đa cho phép nhập (khớp cột NUMERIC(12,2) phía Backend). */
export const MAX_GROSS_AMOUNT = 9_999_999_999.99

/**
 * Schema Zod dùng chung cho form đóng góp (UC50) VÀ form sửa (UC51 - Edit salary contribution) dữ
 * liệu lương — cùng bộ trường, chỉ khác API gọi lúc submit (mirror pattern `createQuestionSchema`
 * dùng chung cho cả tạo/sửa câu hỏi). Thông điệp lỗi khớp validation phía Backend (Create/Update
 * SalaryContributionRequest). Không có trường `currency` — form luôn gửi VND (Backend tự mặc định
 * VND khi bỏ trống), giữ form gọn cho MVP.
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
  locationCity: z.string().trim().max(120).optional(),
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

/** Cấp bậc hợp lệ cho bộ lọc (UC54 - Filter salary data) — khớp `VALID_LEVELS` phía Backend. */
export const SALARY_LEVELS = ['Junior', 'Mid', 'Senior'] as const
export type SalaryLevel = (typeof SALARY_LEVELS)[number]

/**
 * Bộ lọc thống kê lương (UC54 - Filter salary data) — mọi trường đều tùy chọn, bỏ trống = xem toàn
 * bộ (giữ nguyên hành vi gốc của UC53). Gửi kèm `GET /salary-contributions/statistics` dưới dạng
 * query param.
 */
export interface SalaryStatisticsFilters {
  industryId?: number | null
  region?: string
  jobTitle?: string
  level?: SalaryLevel | null
}

/** Giá trị định danh khi chọn "Chức danh khác (tự nhập)..." */
export const OTHER_JOB_TITLE_ID = '__OTHER__'

/** Danh mục chức danh công việc chuẩn toàn diện theo 11 ngành nghề hệ thống & 24 chuyên ngành FPTU. */
export const STANDARD_JOB_TITLES = [
  // 1. Công nghệ thông tin & Trí tuệ nhân tạo (SE, IA, AI, IS, IT, ADS)
  'Backend Developer',
  'Frontend Developer',
  'Fullstack Developer',
  'Mobile App Developer (iOS / Android / Flutter)',
  'Software Engineer',
  'Embedded Systems / IoT Engineer',
  'Game Developer (Unity / Unreal)',
  'Blockchain / Web3 Developer',
  'DevOps Engineer',
  'Cloud Engineer / Cloud Architect',
  'Site Reliability Engineer (SRE)',
  'System Administrator (SysAdmin)',
  'Network Engineer',
  'IT Support / Helpdesk Specialist',
  'Database Administrator (DBA)',
  'Data Analyst',
  'Data Engineer',
  'Data Scientist',
  'AI / Machine Learning Engineer',
  'Business Intelligence (BI) Analyst',
  'Computer Vision Engineer',
  'NLP / GenAI Engineer',
  'QA / QC Engineer',
  'Automation Test Engineer',
  'Manual Test Engineer',
  'Cybersecurity / Information Security Engineer',
  'SOC Analyst',
  'Penetration Tester / Security Consultant',
  'Solution Architect',
  'Technical Lead / Engineering Manager',
  'IT Business Analyst (IT BA)',
  'Kỹ sư cầu nối (BrSE - Bridge Software Engineer)',

  // 2. Thiết kế - Sáng tạo & Mỹ thuật số (GD, UIUX)
  'UI / UX Designer',
  'Product Designer',
  'Graphic Designer (Thiết kế đồ họa)',
  'Motion Designer / 2D-3D Animator',
  '3D Artist / Modeler',
  'Game Artist / Concept Artist',
  'Video Editor / Media Creator',
  'Brand Identity Designer',
  'Art Director (Giám đốc nghệ thuật)',

  // 3. Marketing - Thương mại điện tử (MKT, EC)
  'Digital Marketing Specialist',
  'Performance Marketing Specialist',
  'SEO / SEM Specialist',
  'Content Creator / Copywriter',
  'Chuyên viên Vận hành E-commerce (Shopee, TikTok Shop, Lazada)',
  'Social Media Executive',
  'Growth Marketing Manager',
  'Brand Executive / Brand Manager',
  'Livestream Creator / KOC',
  'CRM & Email Marketing Specialist',

  // 4. Truyền thông - Quan hệ công chúng (MC, PR)
  'Chuyên viên Quan hệ công chúng (PR Specialist)',
  'Chuyên viên Tổ chức sự kiện (Event Planner / Executive)',
  'Chuyên viên Truyền thông nội bộ',
  'Chuyên viên Báo chí & Đối ngoại',
  'Biên tập viên / Biên kịch truyền thông',

  // 5. Kinh doanh - Quản trị (BA, IB)
  'Business Development Executive (BDE)',
  'Sales Executive / B2B Sales',
  'Account Executive / Account Manager',
  'Chuyên viên Xuất nhập khẩu (Import - Export Executive)',
  'Chuyên viên Logistics & Chuỗi cung ứng (Supply Chain)',
  'Chuyên viên Mua hàng (Procurement / Purchasing Executive)',
  'Customer Success Specialist (CS)',
  'Product Manager (PM)',
  'Product Owner (PO)',
  'Project Manager (PMP / Agile)',
  'Scrum Master / Agile Coach',
  'Operations Manager (Quản lý vận hành)',

  // 6. Tài chính - Ngân hàng & Kế toán (FIN, BNK, FT, ACC)
  'Chuyên viên Quan hệ khách hàng Ngân hàng (RM)',
  'Chuyên viên Thẩm định tín dụng',
  'Chuyên viên Phân tích tài chính / Đầu tư',
  'Chuyên viên Công nghệ tài chính (Fintech Specialist)',
  'Kế toán tổng hợp (General Accountant)',
  'Kế toán thuế / Kế toán nội bộ',
  'Kiểm toán viên (Auditor)',
  'Chuyên viên Quản trị rủi ro tài chính',
  'Kế toán trưởng (Chief Accountant)',

  // 7. Du lịch - Khách sạn (HM, TM)
  'Quản lý Khách sạn / Resort (Hotel Manager)',
  'Nhân viên / Giám sát Lễ tân (Front Office / Receptionist)',
  'Quản lý Nhà hàng & Ẩm thực (F&B Manager)',
  'Hướng dẫn viên du lịch (Tour Guide)',
  'Chuyên viên Điều hành Tour (Tour Operator)',
  'Sales Khách sạn / Du lịch',

  // 8. Ngôn ngữ - Biên phiên dịch (ENG, JPN, KOR)
  'IT Comtor tiếng Nhật',
  'IT Comtor tiếng Hàn',
  'Biên dịch viên tiếng Anh / Nhật / Hàn',
  'Phiên dịch viên (Interpreter)',
  'Chuyên viên Phát triển thị trường quốc tế',
  'Trợ lý Giám đốc song ngữ',

  // 9. Luật & Pháp chế (EL)
  'Chuyên viên Pháp chế doanh nghiệp (Legal Executive)',
  'Luật sư tư vấn doanh nghiệp / M&A',
  'Chuyên viên Tuân thủ (Compliance Officer)',
  'Chuyên viên Sở hữu trí tuệ (IP Specialist)',
  'Trợ lý pháp lý (Paralegal)',

  // 10. Giáo dục - Đào tạo
  'Giảng viên Đại học / Cao đẳng',
  'Giáo viên Ngoại ngữ (Anh / Nhật / Hàn)',
  'Chuyên viên Đào tạo nội bộ (L&D Specialist)',
  'Cố vấn học tập / Quản lý chương trình đào tạo',
  'Instructional Designer (Thiết kế bài giảng)',

  // 11. Nhân sự & Hành chính
  'IT Recruiter / Talent Acquisition',
  'Chuyên viên C&B (Lương & Phúc lợi)',
  'HR Generalist (Nhân sự tổng hợp)',
  'HR Manager / HR Business Partner',
  'Chuyên viên Hành chính văn phòng (Office Administrator)',
] as const

/** Danh mục toàn bộ 63 Tỉnh / Thành phố tại Việt Nam phục vụ chọn địa điểm làm việc nhanh và chính xác. */
export const VIETNAM_CITIES = [
  'Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Đà Nẵng',
  'Cần Thơ',
  'Hải Phòng',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
] as const

/** Ánh xạ danh mục chức danh công việc chuẩn theo từng ngành nghề trong hệ thống */
export const JOB_TITLES_BY_INDUSTRY: Record<string, readonly string[]> = {
  'Công nghệ thông tin': [
    'Backend Developer',
    'Frontend Developer',
    'Fullstack Developer',
    'Mobile App Developer (iOS / Android / Flutter)',
    'Software Engineer',
    'Embedded Systems / IoT Engineer',
    'Game Developer (Unity / Unreal)',
    'Blockchain / Web3 Developer',
    'DevOps Engineer',
    'Cloud Engineer / Cloud Architect',
    'Site Reliability Engineer (SRE)',
    'System Administrator (SysAdmin)',
    'Network Engineer',
    'IT Support / Helpdesk Specialist',
    'Database Administrator (DBA)',
    'Data Analyst',
    'Data Engineer',
    'Data Scientist',
    'AI / Machine Learning Engineer',
    'Business Intelligence (BI) Analyst',
    'Computer Vision Engineer',
    'NLP / GenAI Engineer',
    'QA / QC Engineer',
    'Automation Test Engineer',
    'Manual Test Engineer',
    'Cybersecurity / Information Security Engineer',
    'SOC Analyst',
    'Penetration Tester / Security Consultant',
    'Solution Architect',
    'Technical Lead / Engineering Manager',
    'IT Business Analyst (IT BA)',
    'Kỹ sư cầu nối (BrSE - Bridge Software Engineer)',
  ],
  'Thiết kế - Sáng tạo': [
    'UI / UX Designer',
    'Product Designer',
    'Graphic Designer (Thiết kế đồ họa)',
    'Motion Designer / 2D-3D Animator',
    '3D Artist / Modeler',
    'Game Artist / Concept Artist',
    'Video Editor / Media Creator',
    'Brand Identity Designer',
    'Art Director (Giám đốc nghệ thuật)',
  ],
  'Marketing - Thương mại điện tử': [
    'Digital Marketing Specialist',
    'Performance Marketing Specialist',
    'SEO / SEM Specialist',
    'Content Creator / Copywriter',
    'Chuyên viên Vận hành E-commerce (Shopee, TikTok Shop, Lazada)',
    'Social Media Executive',
    'Growth Marketing Manager',
    'Brand Executive / Brand Manager',
    'Livestream Creator / KOC',
    'CRM & Email Marketing Specialist',
  ],
  'Truyền thông - Quan hệ công chúng': [
    'Chuyên viên Quan hệ công chúng (PR Specialist)',
    'Chuyên viên Tổ chức sự kiện (Event Planner / Executive)',
    'Chuyên viên Truyền thông nội bộ',
    'Chuyên viên Báo chí & Đối ngoại',
    'Biên tập viên / Biên kịch truyền thông',
  ],
  'Kinh doanh - Quản trị': [
    'Business Development Executive (BDE)',
    'Sales Executive / B2B Sales',
    'Account Executive / Account Manager',
    'Chuyên viên Xuất nhập khẩu (Import - Export Executive)',
    'Chuyên viên Logistics & Chuỗi cung ứng (Supply Chain)',
    'Chuyên viên Mua hàng (Procurement / Purchasing Executive)',
    'Customer Success Specialist (CS)',
    'Product Manager (PM)',
    'Product Owner (PO)',
    'Project Manager (PMP / Agile)',
    'Scrum Master / Agile Coach',
    'Operations Manager (Quản lý vận hành)',
    'HR Generalist (Nhân sự tổng hợp)',
    'IT Recruiter / Talent Acquisition',
    'Chuyên viên C&B (Lương & Phúc lợi)',
    'HR Manager / HR Business Partner',
    'Chuyên viên Hành chính văn phòng (Office Administrator)',
  ],
  'Tài chính - Ngân hàng': [
    'Chuyên viên Quan hệ khách hàng Ngân hàng (RM)',
    'Chuyên viên Thẩm định tín dụng',
    'Chuyên viên Phân tích tài chính / Đầu tư',
    'Chuyên viên Công nghệ tài chính (Fintech Specialist)',
    'Kế toán tổng hợp (General Accountant)',
    'Kế toán thuế / Kế toán nội bộ',
    'Kiểm toán viên (Auditor)',
    'Chuyên viên Quản trị rủi ro tài chính',
    'Kế toán trưởng (Chief Accountant)',
  ],
  'Du lịch - Khách sạn': [
    'Quản lý Khách sạn / Resort (Hotel Manager)',
    'Nhân viên / Giám sát Lễ tân (Front Office / Receptionist)',
    'Quản lý Nhà hàng & Ẩm thực (F&B Manager)',
    'Hướng dẫn viên du lịch (Tour Guide)',
    'Chuyên viên Điều hành Tour (Tour Operator)',
    'Sales Khách sạn / Du lịch',
  ],
  'Ngôn ngữ - Biên phiên dịch': [
    'IT Comtor tiếng Nhật',
    'IT Comtor tiếng Hàn',
    'Biên dịch viên tiếng Anh / Nhật / Hàn',
    'Phiên dịch viên (Interpreter)',
    'Chuyên viên Phát triển thị trường quốc tế',
    'Trợ lý Giám đốc song ngữ',
  ],
  'Luật': [
    'Chuyên viên Pháp chế doanh nghiệp (Legal Executive)',
    'Luật sư tư vấn doanh nghiệp / M&A',
    'Chuyên viên Tuân thủ (Compliance Officer)',
    'Chuyên viên Sở hữu trí tuệ (IP Specialist)',
    'Trợ lý pháp lý (Paralegal)',
  ],
  'Giáo dục - Đào tạo': [
    'Giảng viên Đại học / Cao đẳng',
    'Giáo viên Ngoại ngữ (Anh / Nhật / Hàn)',
    'Chuyên viên Đào tạo nội bộ (L&D Specialist)',
    'Cố vấn học tập / Quản lý chương trình đào tạo',
    'Instructional Designer (Thiết kế bài giảng)',
  ],
}

/**
  * Ánh xạ icon đặc trưng cho từng ngành nghề trong hệ thống FPTU Alumnect.
  */
export const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  'Công nghệ thông tin': Code2,
  'Tài chính - Ngân hàng': TrendingUp,
  'Marketing - Thương mại điện tử': Megaphone,
  'Thiết kế - Sáng tạo': Palette,
  'Truyền thông - Quan hệ công chúng': MessagesSquare,
  'Ngôn ngữ - Biên phiên dịch': FileText,
  'Luật': ShieldCheck,
  'Kinh doanh - Quản trị': Briefcase,
  'Du lịch - Khách sạn': MapPin,
  'Giáo dục - Đào tạo': GraduationCap,
}

/**
 * Trả về Component Icon đại diện cho ngành nghề tương ứng
 */
export function getIndustryIcon(name?: string | null): LucideIcon {
  if (!name) return LayoutGrid
  return INDUSTRY_ICONS[name.trim()] || LayoutGrid
}
