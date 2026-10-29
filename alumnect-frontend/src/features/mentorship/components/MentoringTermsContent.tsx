import { useTranslation } from 'react-i18next'
import { MENTORING_TERMS_SECTIONS } from '../constants/mentoringTerms'
import { FileText } from 'lucide-react'

/**
 * Component hiển thị nội dung chi tiết 10 phần của Điều khoản Hướng dẫn & Hỗ trợ.
 * Được thiết kế dưới dạng khung cuộn tùy chỉnh với kiểu dáng Pastel Premium mềm mại.
 */
export function MentoringTermsContent() {
  const { t } = useTranslation()
  return (
    <div className="relative rounded-2xl border border-border bg-cream-50/70 p-3.5 sm:p-5 shadow-inner dark:bg-bg">
      <div className="mb-3 flex items-center border-b border-border pb-3">
        <div className="flex items-center gap-2.5 text-text">
          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary-solid" />
          <span className="font-display text-xs sm:text-sm font-bold tracking-tight">{t('mentoring.termsDocumentTitle')}</span>
        </div>
      </div>

      {/* Vùng cuộn chứa nội dung các điều khoản */}
      <div
        tabIndex={0}
        aria-label={t('mentoring.termsDocumentAriaLabel')}
        className="space-y-5 text-xs sm:text-sm text-text-muted focus:outline-none"
      >
        <p className="italic text-text-subtle dark:text-text-subtle">
          {t('mentoring.termsWelcomeIntro')}
        </p>

        {MENTORING_TERMS_SECTIONS.map((section) => (
          <section key={section.id} className="space-y-2">
            <h3 className="font-display text-base font-bold text-text">
              {section.title}
            </h3>
            <ul className="space-y-1.5 list-disc pl-5 leading-relaxed">
              {section.content.map((paragraph, index) => (
                <li key={index} className="text-text-muted">
                  {paragraph}
                </li>
              ))}
            </ul>
          </section>
        ))}

        <div className="pt-2 text-xs text-text-subtle dark:text-text-subtle">
          {t('mentoring.termsLastUpdated')}
        </div>
      </div>
    </div>
  )
}
