import { useTranslation } from 'react-i18next'
import { MapPin, Laptop, Users, BookOpen, Quote } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorAboutSectionProps {
  mentor: MentorDetailData
}

/**
 * Hiển thị phần Giới thiệu & Định hướng cố vấn của Mentor (UC99).
 * Thiết kế tinh gọn, trang nhã, không lặp lại các thông tin đã hiển thị ở Header.
 */
export function MentorAboutSection({ mentor }: MentorAboutSectionProps) {
  const { t } = useTranslation()
  const bio = mentor.bio?.trim() || ''
  const biography = mentor.biography?.trim() || ''
  const isDuplicateBio = bio.length > 0 && biography.length > 0 && bio === biography

  const displayBio = bio || biography
  const displaySecondaryBio = !isDuplicateBio && biography.length > 0 ? biography : null

  return (
    <Card
      hover={false}
      className="border border-border bg-surface p-6 sm:p-7 text-left space-y-5"
    >
      <div className="flex items-center gap-2.5 border-b border-border pb-3.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid">
          <BookOpen className="h-4 w-4" />
        </span>
        <h2 className="font-display text-lg font-bold text-text">
          {t('mentoring.aboutAndDirectionTitle')}
        </h2>
      </div>

      {/* Thông điệp từ Mentor */}
      {displayBio ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-text-subtle">
            <Quote className="h-3.5 w-3.5 text-primary-solid" />
            <span>{t('mentoring.messageToStudents')}</span>
          </div>
          <p className="text-sm leading-relaxed text-text bg-brand-50/30 p-4 rounded-2xl border border-brand-200/40 dark:bg-white/[0.03] dark:border-white/[0.05] italic">
            "{displayBio}"
          </p>
        </div>
      ) : (
        <p className="text-xs text-text-subtle italic">
          {t('mentoring.noIntroMessage')}
        </p>
      )}

      {/* Tiểu sử cá nhân chi tiết (nếu có nội dung khác biệt với bio) */}
      {displaySecondaryBio && (
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            {t('mentoring.careerOverview')}
          </h3>
          <p className="text-sm leading-relaxed text-text-muted whitespace-pre-line">
            {displaySecondaryBio}
          </p>
        </div>
      )}

      {/* Dòng tags thông tin kết nối gọn gàng */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-border text-xs text-text-muted">
        {mentor.city && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-danger" />
            <span>{t('mentoring.regionLabel')}<strong>{mentor.city}</strong></span>
          </span>
        )}

        {mentor.workingMode && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Laptop className="h-3.5 w-3.5 text-primary-solid" />
            <span>
              {t('mentoring.formatLabel')}{' '}
              <strong>
                {mentor.workingMode === 'ONLINE'
                  ? t('mentoring.formatOnline')
                  : mentor.workingMode === 'OFFLINE'
                  ? t('mentoring.formatOffline')
                  : t('mentoring.formatHybrid')}
              </strong>
            </span>
          </span>
        )}

        {mentor.mentoringType && (
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-info" />
            <span>
              {t('mentoring.methodLabel')}{' '}
              <strong>
                {mentor.mentoringType === 'INDIVIDUAL'
                  ? t('mentoring.methodIndividual')
                  : mentor.mentoringType === 'GROUP'
                  ? t('mentoring.methodGroup')
                  : t('mentoring.methodBoth')}
              </strong>
            </span>
          </span>
        )}
      </div>
    </Card>
  )
}
