import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Send,
  User,
  MapPin,
  Settings2,
  Info,
  AlertTriangle,
} from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { brandButtonClass, softButtonClass } from '@/components/brand/brandClasses'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorProfileHeaderProps {
  mentor: MentorDetailData
  onRequestMentor: () => void
}

/**
 * Header thông tin chính của Mentor (UC99).
 * Thiết kế tối giản, thanh lịch, tập trung vào định danh và CTA chính.
 */
export function MentorProfileHeader({ mentor, onRequestMentor }: MentorProfileHeaderProps) {
  const { t } = useTranslation()
  const isMentorActive = mentor.mentorStatus === 'ACTIVE'
  const currentUser = useAuthStore((s) => s.user)
  const isSelfMentor = Boolean(currentUser && mentor.userId && String(currentUser.id) === String(mentor.userId))
  const showCity = mentor.city && mentor.city.trim().toLowerCase() !== mentor.academicInfo?.campus?.trim().toLowerCase()

  return (
    <Card
      hover={false}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6"
    >
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Khối Trái: Avatar & Định danh cá nhân */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 min-w-0 flex-1">
          {/* Avatar với Active indicator */}
          <div className="relative shrink-0">
            <Avatar
              src={mentor.avatarUrl || undefined}
              name={mentor.fullName}
              size={96}
              ring
              className="shadow-md"
            />
            {isMentorActive && (
              <span
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-success shadow-sm dark:border-border"
                title={t('mentoring.mentorReadyActiveTitle')}
              />
            )}
          </div>

          {/* Chi tiết Họ tên, Chức danh, Học vấn */}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-text tracking-tight">
                {mentor.fullName}
              </h1>


            </div>

            {/* Chức danh & Đơn vị công tác */}
            <p className="text-base font-semibold text-text">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || t('mentoring.professionalMentorDefault')}
            </p>

            {/* Thông tin học vấn & Lĩnh vực hỗ trợ */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted pt-0.5">
              {mentor.academicInfo && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-4 w-4 text-primary-solid shrink-0" />
                  <span>
                    {mentor.academicInfo.campus || t('mentoring.fptUniversityDefault')}
                    {mentor.academicInfo.majorName ? ` • ${mentor.academicInfo.majorName}` : ''}
                    {mentor.academicInfo.majorCode ? ` (${mentor.academicInfo.majorCode})` : ''}
                    {mentor.academicInfo.cohort ? ` • K${mentor.academicInfo.cohort}` : ''}
                  </span>
                </span>
              )}


              {showCity && (
                <span className="inline-flex items-center gap-1.5 font-medium text-text-subtle">
                  <MapPin className="h-3.5 w-3.5 text-danger" />
                  <span>{mentor.city}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Khối Phải: một hành động chính + trang cá nhân, hai nút cùng cỡ */}
        <div className="flex w-full shrink-0 flex-col gap-2 border-t border-border pt-4 sm:w-auto md:items-end md:border-t-0 md:pt-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {isSelfMentor ? (
              <Link to="/app/mentoring/status" className={brandButtonClass}>
                <Settings2 className="h-4 w-4" />
                {t('mentoring.manageMentorProfile')}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onRequestMentor}
                disabled={!mentor.canReceiveRequest}
                className={cn(brandButtonClass, 'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none')}
              >
                <Send className="h-4 w-4" />
                {mentor.canReceiveRequest ? t('mentoring.sendMentoringRequest') : t('mentoring.temporarilyPausedBadge')}
              </button>
            )}

            {mentor.userId && (
              <Link to={`/app/profile?userId=${mentor.userId}`} className={softButtonClass} title={t('mentoring.viewMentorProfileTitle')}>
                <User className="h-4 w-4" />
                {t('mentoring.personalProfileBtn')}
              </Link>
            )}
          </div>

          {isSelfMentor ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-text-subtle">
              <Info className="h-3.5 w-3.5 shrink-0" />
              {t('mentoring.thisIsYourMentorProfile')}
            </p>
          ) : (
            !mentor.canReceiveRequest && (
              <p className="inline-flex max-w-xs items-start gap-1.5 text-xs text-danger md:text-right">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {mentor.availabilityReason || t('mentoring.mentorUnavailableDefault')}
              </p>
            )
          )}
        </div>      </div>
    </Card>
  )
}
