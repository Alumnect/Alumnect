import { MENTORING_TERMS_SECTIONS } from '../constants/mentoringTerms'
import { FileText } from 'lucide-react'

/**
 * Component hiển thị nội dung chi tiết 10 phần của Điều khoản Hướng dẫn & Hỗ trợ.
 * Được thiết kế dưới dạng khung cuộn tùy chỉnh với kiểu dáng Pastel Premium mềm mại.
 */
export function MentoringTermsContent() {
  return (
    <div className="relative rounded-2xl border border-plum-900/[0.08] bg-cream-50/70 p-3.5 sm:p-5 shadow-inner dark:bg-[#1e1f20] dark:border-[#393a3b]">
      <div className="mb-3 flex items-center border-b border-plum-900/[0.06] pb-3 dark:border-[#393a3b]">
        <div className="flex items-center gap-2.5 text-plum-900 dark:text-[#e4e6eb]">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500" />
          <span className="font-display text-xs sm:text-sm font-bold tracking-tight">Văn bản Quy chế & Điều khoản Mentorship</span>
        </div>
      </div>

      {/* Vùng cuộn chứa nội dung các điều khoản */}
      <div
        tabIndex={0}
        aria-label="Nội dung điều khoản hướng dẫn và hỗ trợ"
        className="space-y-5 text-xs sm:text-sm text-plum-600 focus:outline-none dark:text-[#b0b3b8]"
      >
        <p className="italic text-plum-500 dark:text-[#8a8d91]">
          Chào mừng bạn đến với module Hướng dẫn & Hỗ trợ (Mentorship) của AlumNect. Để đảm bảo môi trường kết nối chuyên nghiệp, minh bạch và an toàn cho cộng đồng sinh viên và cựu sinh viên Đại học FPT, vui lòng đọc kỹ các quy định sau đây:
        </p>

        {MENTORING_TERMS_SECTIONS.map((section) => (
          <section key={section.id} className="space-y-2">
            <h3 className="font-display text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
              {section.title}
            </h3>
            <ul className="space-y-1.5 list-disc pl-5 leading-relaxed">
              {section.content.map((paragraph, index) => (
                <li key={index} className="text-plum-600 dark:text-[#b0b3b8]">
                  {paragraph}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="pt-2 text-xs text-plum-400 dark:text-[#8a8d91]">
          Cập nhật lần cuối: Ngày 28 tháng 09 năm 2026 • Ban Quản trị Nền tảng AlumNect
        </div>
      </div>
    </div>
  )
}
