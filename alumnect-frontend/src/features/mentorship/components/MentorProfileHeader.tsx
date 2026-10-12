import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  GraduationCap,
  Send,
  User,
  Briefcase,
  MapPin,
} from 'lucide-react'
import { Card, Avatar, Badge } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import type { MentorDetailData, MentorStatusType } from '../model/mentorDetailTypes'

interface MentorProfileHeaderProps {
  mentor: MentorDetailData
  onRequestMentor: () => void
}

/**
 * Hiển thị Badge trạng thái Mentor.
 */
function getStatusBadge(status: MentorStatusType) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Đang hoạt động',
        tone: 'mint' as const,
      }
    case 'EXPIRED':
      return {
        label: 'Hết hạn gói',
        tone: 'danger' as const,
      }
    case 'PAYMENT_PENDING':
      return {
        label: 'Chờ kích hoạt',
        tone: 'neutral' as const,
      }
    case 'INCOMPLETE':
      return {
        label: 'Chưa hoàn tất',
        tone: 'neutral' as const,
      }
    default:
      return {
        label: status,
        tone: 'neutral' as const,
      }
  }
}

/**
 * Header thông tin chính của Mentor (UC99).
 * Thiết kế tối giản, thanh lịch, tập trung vào định danh và CTA chính.
 * Không nhồi nhét các chỉ số lặp lại để tránh gây rối mắt.
 */
export function MentorProfileHeader({ mentor, onRequestMentor }: MentorProfileHeaderProps) {
  const statusMeta = getStatusBadge(mentor.mentorStatus)
  const isMentorActive = mentor.mentorStatus === 'ACTIVE'
  const primaryField = mentor.supportedFields && mentor.supportedFields.length > 0 ? mentor.supportedFields[0].name : null

  return (
    <Card
      hover={false}
      className="relative overflow-hidden border border-plum-900/[0.08] bg-white p-6 sm:p-8 shadow-sm dark:bg-[#242526] dark:border-[#393a3b] w-full"
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
                className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-mint-500 shadow-sm dark:border-[#242526]"
                title="Mentor đang sẵn sàng hoạt động"
              />
            )}
          </div>

          {/* Chi tiết Họ tên, Chức danh, Học vấn */}
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-plum-900 tracking-tight dark:text-[#e4e6eb]">
                {mentor.fullName}
              </h1>

              {/* Verified Alumni Badge */}
              {mentor.isVerifiedAlumni && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-200/60 dark:bg-brand-950/40 dark:text-brand-300 dark:border-brand-800/40"
                  title="Cựu sinh viên FPT University đã được hệ thống xác thực"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
                  <span>Xác thực FPT</span>
                </span>
              )}

              {/* Trạng thái Mentor */}
              <Badge tone={statusMeta.tone} className="text-xs px-2.5 py-0.5">
                {statusMeta.label}
              </Badge>
            </div>

            {/* Chức danh & Đơn vị công tác */}
            <p className="text-base font-semibold text-plum-800 dark:text-[#e4e6eb]">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>

            {/* Thông tin học vấn & Lĩnh vực hỗ trợ */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-plum-600 dark:text-[#8f9399] pt-0.5">
              {mentor.academicInfo && (
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <GraduationCap className="h-4 w-4 text-brand-500 shrink-0" />
                  <span>
                    {mentor.academicInfo.campus || 'Đại học FPT'}
                    {mentor.academicInfo.majorName ? ` • ${mentor.academicInfo.majorName}` : ''}
                    {mentor.academicInfo.majorCode ? ` (${mentor.academicInfo.majorCode})` : ''}
                    {mentor.academicInfo.cohort ? ` • K${mentor.academicInfo.cohort}` : ''}
                  </span>
                </span>
              )}

              {primaryField && (
                <span className="inline-flex items-center gap-1.5 font-medium text-brand-700 dark:text-brand-300">
                  <Briefcase className="h-3.5 w-3.5 text-brand-500" />
                  <span>Lĩnh vực: {primaryField}</span>
                </span>
              )}

              {mentor.city && (
                <span className="inline-flex items-center gap-1.5 font-medium text-plum-500 dark:text-[#8f9399]">
                  <MapPin className="h-3.5 w-3.5 text-coral-500" />
                  <span>{mentor.city}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Khối Phải: Nút CTA & Tình trạng tiếp nhận */}
        <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2.5 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-plum-900/[0.06] dark:border-[#393a3b]">
          <Button
            variant="primary"
            size="lg"
            leftIcon={<Send className="h-4 w-4" />}
            onClick={onRequestMentor}
            disabled={!mentor.canReceiveRequest}
            className={`w-full sm:w-auto font-black px-7 py-3 rounded-2xl shadow-md transition-all ${
              mentor.canReceiveRequest
                ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 active:scale-95'
                : 'bg-plum-200 text-plum-400 cursor-not-allowed dark:bg-white/10 dark:text-plum-500'
            }`}
          >
            {mentor.canReceiveRequest ? 'Gửi yêu cầu cố vấn' : 'Tạm ngưng nhận yêu cầu'}
          </Button>

          <div className="flex items-center justify-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 text-plum-500 dark:text-[#8f9399]">
              {mentor.canReceiveRequest ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-mint-500 animate-pulse" />
                  <span className="text-mint-700 dark:text-mint-400 font-semibold">Sẵn sàng nhận học viên</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-coral-500" />
                  <span className="text-coral-600 dark:text-coral-400 font-semibold">Tạm ngưng nhận yêu cầu</span>
                </>
              )}
            </span>

            {mentor.userId && (
              <>
                <span className="text-plum-300 dark:text-plum-700">•</span>
                <Link
                  to={`/app/profile?userId=${mentor.userId}`}
                  className="font-bold text-plum-600 hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <User className="h-3 w-3" />
                  <span>Trang cá nhân</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
