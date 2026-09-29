import { MENTORING_TERMS_SECTIONS } from '../constants/mentoringTerms'
import { FileText, ShieldCheck } from 'lucide-react'

interface MentoringTermsContentProps {
  version?: string
}

/**
 * Component hiển thị nội dung chi tiết 10 phần của Điều khoản Hướng dẫn & Hỗ trợ.
 * Được thiết kế dưới dạng khung cuộn tùy chỉnh với kiểu dáng Pastel Premium mềm mại.
 */
export function MentoringTermsContent({ version = '1.0' }: MentoringTermsContentProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col relative rounded-2xl border border-plum-900/[0.08] bg-cream-50/70 p-4 sm:p-6 shadow-inner dark:bg-[#1e1f20] dark:border-[#393a3b]">
      {/* Thanh tiêu đề phiên bản tài liệu */}
      <div className="mb-3 shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-3 dark:border-[#393a3b]">
        <div className="flex items-center gap-2.5 text-plum-900 dark:text-[#e4e6eb]">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-brand-500" />
          <span className="font-heading text-xs sm:text-sm font-bold tracking-tight">Văn bản Quy chế & Điều khoản Mentorship</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 ring-1 ring-brand-300/40">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Phiên bản {version}</span>
        </div>
      </div>

      {/* Vùng cuộn chứa nội dung các điều khoản */}
      <div
        tabIndex={0}
        aria-label="Nội dung điều khoản hướng dẫn và hỗ trợ"
        className="flex-1 min-h-0 space-y-5 overflow-y-auto pr-3 text-xs sm:text-sm text-plum-600 focus:outline-none dark:text-[#b0b3b8] [scrollbar-gutter:stable]"
      >
        <p className="italic text-plum-500 dark:text-[#8a8d91]">
          Chào mừng bạn đến với module Hướng dẫn & Hỗ trợ (Mentorship) của AlumNect. Để đảm bảo môi trường kết nối chuyên nghiệp, minh bạch và an toàn cho cộng đồng sinh viên và cựu sinh viên Đại học FPT, vui lòng đọc kỹ các quy định sau đây:
        </p>

        {MENTORING_TERMS_SECTIONS.map((section) => (
          <section key={section.id} className="space-y-2">
            <h3 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
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
