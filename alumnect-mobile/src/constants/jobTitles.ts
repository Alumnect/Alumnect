/** Danh mục chức danh chuẩn và phân nhóm theo ngành, đồng bộ với Web (SalaryPage). */

export const OTHER_JOB_TITLE_ID = '__OTHER__'

export const SALARY_LEVELS = ['Junior', 'Mid', 'Senior'] as const
export type SalaryLevel = (typeof SALARY_LEVELS)[number]

export const STANDARD_JOB_TITLES = [
  // 1. Công nghệ thông tin & Trí tuệ nhân tạo
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

  // 2. Thiết kế - Sáng tạo & Mỹ thuật số
  'UI / UX Designer',
  'Product Designer',
  'Graphic Designer (Thiết kế đồ họa)',
  'Motion Designer / 2D-3D Animator',
  '3D Artist / Modeler',
  'Game Artist / Concept Artist',
  'Video Editor / Media Creator',
  'Brand Identity Designer',
  'Art Director (Giám đốc nghệ thuật)',

  // 3. Marketing - Thương mại điện tử
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

  // 4. Truyền thông - Quan hệ công chúng
  'Chuyên viên Quan hệ công chúng (PR Specialist)',
  'Chuyên viên Tổ chức sự kiện (Event Planner / Executive)',
  'Chuyên viên Truyền thông nội bộ',
  'Chuyên viên Báo chí & Đối ngoại',
  'Biên tập viên / Biên kịch truyền thông',

  // 5. Kinh doanh - Quản trị
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

  // 6. Tài chính - Ngân hàng & Kế toán
  'Chuyên viên Quan hệ khách hàng Ngân hàng (RM)',
  'Chuyên viên Thẩm định tín dụng',
  'Chuyên viên Phân tích tài chính / Đầu tư',
  'Chuyên viên Công nghệ tài chính (Fintech Specialist)',
  'Kế toán tổng hợp (General Accountant)',
  'Kế toán thuế / Kế toán nội bộ',
  'Kiểm toán viên (Auditor)',
  'Chuyên viên Quản trị rủi ro tài chính',
  'Kế toán trưởng (Chief Accountant)',

  // 7. Du lịch - Khách sạn
  'Quản lý Khách sạn / Resort (Hotel Manager)',
  'Nhân viên / Giám sát Lễ tân (Front Office / Receptionist)',
  'Quản lý Nhà hàng & Ẩm thực (F&B Manager)',
  'Hướng dẫn viên du lịch (Tour Guide)',
  'Chuyên viên Điều hành Tour (Tour Operator)',
  'Sales Khách sạn / Du lịch',

  // 8. Ngôn ngữ - Biên phiên dịch
  'IT Comtor tiếng Nhật',
  'IT Comtor tiếng Hàn',
  'Biên dịch viên tiếng Anh / Nhật / Hàn',
  'Phiên dịch viên (Interpreter)',
  'Chuyên viên Phát triển thị trường quốc tế',
  'Trợ lý Giám đốc song ngữ',

  // 9. Luật & Pháp chế
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
] as const

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

/** Ánh xạ thông minh mã màu chủ đạo theo từ khóa vị trí công việc, chuẩn hóa 100% như Web. */
export function getJobStyle(role: string, t: {
  isDark?: boolean
  info?: string
  infoTint?: string
  danger?: string
  dangerTint?: string
  primary?: string
  primaryTint?: string
  success?: string
  successTint?: string
  warning?: string
  warningTint?: string
}) {
  const r = (role || '').toLowerCase()
  if (
    r.includes('data') ||
    r.includes('analyst') ||
    r.includes('dữ liệu') ||
    r.includes('bi') ||
    r.includes('ai') ||
    r.includes('machine learning') ||
    r.includes('trí tuệ nhân tạo')
  ) {
    return {
      bg: t.infoTint ?? '#DBEAFE',
      color: t.info ?? '#2563EB',
      border: t.isDark ? '#1E3A8A' : '#BFDBFE',
    }
  }
  if (
    r.includes('design') ||
    r.includes('ui') ||
    r.includes('ux') ||
    r.includes('thiết kế') ||
    r.includes('graphic') ||
    r.includes('art')
  ) {
    return {
      bg: t.dangerTint ?? '#FFE4E6',
      color: t.danger ?? '#E11D48',
      border: t.isDark ? '#7F1D1D' : '#FECDD3',
    }
  }
  if (
    r.includes('dev') ||
    r.includes('lập trình') ||
    r.includes('engineer') ||
    r.includes('kỹ sư') ||
    r.includes('software') ||
    r.includes('frontend') ||
    r.includes('backend') ||
    r.includes('fullstack')
  ) {
    return {
      bg: t.primaryTint ?? '#FFEDD5',
      color: t.primary ?? '#EA580C',
      border: t.isDark ? '#7C2D12' : '#FED7AA',
    }
  }
  if (
    r.includes('market') ||
    r.includes('seo') ||
    r.includes('content') ||
    r.includes('quảng cáo') ||
    r.includes('media')
  ) {
    return {
      bg: t.infoTint ?? '#DBEAFE',
      color: t.info ?? '#2563EB',
      border: t.isDark ? '#1E3A8A' : '#BFDBFE',
    }
  }
  if (
    r.includes('business') ||
    r.includes('sales') ||
    r.includes('kinh doanh') ||
    r.includes('finance') ||
    r.includes('tài chính') ||
    r.includes('manager') ||
    r.includes('quản lý') ||
    r.includes('pm')
  ) {
    return {
      bg: t.successTint ?? '#DCFCE7',
      color: t.success ?? '#16A34A',
      border: t.isDark ? '#14532D' : '#BBF7D0',
    }
  }
  return {
    bg: t.warningTint ?? '#FEF3C7',
    color: t.warning ?? '#D97706',
    border: t.isDark ? '#78350F' : '#FED7AA',
  }
}


