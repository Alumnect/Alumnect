import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  GraduationCap,
  Send,
  User,
  Briefcase,
  MapPin,
} from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { Button } from '@/components/ui/Button'
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
  const isMentorActive = mentor.mentorStatus === 'ACTIVE'
  const primaryField = mentor.supportedFields && mentor.supportedFields.length > 0 ? mentor.supportedFields[0].name : null
  const showCity = mentor.city && mentor.city.trim().toLowerCase() !== mentor.academicInfo?.campus?.trim().toLowerCase()

  return (
    <Card
      hover={false}
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6"
    >
      {/* Background Gradient Accent nhỏ */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand-300/15 via-violet-300/10 to-transparent blur-2xl" />

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
                title="Mentor đang sẵn sàng hoạt động"
              />
            )}
          </div>

          {/* Chi tiết Họ tên, Chức danh, Học vấn */}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-text tracking-tight">
                {mentor.fullName}
              </h1>

              {/* Verified Alumni Badge */}
              {mentor.isVerifiedAlumni && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-solid border border-primary-soft-border"
                  title="Cựu sinh viên FPT University đã được hệ thống xác thực"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-primary-solid" />
                  <span>Xác thực FPT</span>
                </span>
              )}
            </div>

            {/* Chức danh & Đơn vị công tác */}
            <p className="text-base font-semibold text-text">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>

            {/* Thông tin học vấn & Lĩnh vực hỗ trợ */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-muted pt-0.5">
              {mentor.academicInfo && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-4 w-4 text-primary-solid shrink-0" />
                  <span>
                    {mentor.academicInfo.campus || 'Đại học FPT'}
                    {mentor.academicInfo.majorName ? ` • ${mentor.academicInfo.majorName}` : ''}
                    {mentor.academicInfo.majorCode ? ` (${mentor.academicInfo.majorCode})` : ''}
                    {mentor.academicInfo.cohort ? ` • K${mentor.academicInfo.cohort}` : ''}
                  </span>
                </span>
              )}

              {primaryField && (
                <span className="inline-flex items-center gap-1.5 font-medium text-primary-solid">
                  <Briefcase className="h-3.5 w-3.5 text-primary-solid" />
                  <span>Lĩnh vực: {primaryField}</span>
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

        {/* Khối Phải: Nút CTA & Nút Trang cá nhân tinh gọn */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-border">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Send className="h-4 w-4" />}
            onClick={onRequestMentor}
            disabled={!mentor.canReceiveRequest}
            className={`min-h-11 rounded-xl px-6 py-2.5 font-semibold shadow-sm transition-all ${
              mentor.canReceiveRequest
                ? 'bg-primary-solid hover:bg-primary-hover shadow-raised active:scale-95 dark:text-text-inverse'
                : 'bg-surface-3 text-text-subtle cursor-not-allowed'
            }`}
          >
            {mentor.canReceiveRequest ? 'Gửi yêu cầu cố vấn' : 'Tạm ngưng nhận yêu cầu'}
          </Button>

          {mentor.userId && (
            <Link
              to={`/app/profile?userId=${mentor.userId}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs font-bold text-text-muted shadow-2xs transition-all hover:border-primary-soft-border hover:bg-primary-soft hover:text-primary-solid active:scale-95"
              title="Xem trang cá nhân của Mentor"
            >
              <User className="h-3.5 w-3.5 text-text-subtle" />
              <span>Trang cá nhân</span>
            </Link>
          )}
        </div>
      </div>
    </Card>
  )
}
