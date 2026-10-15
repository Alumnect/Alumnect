import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Star,
  Trophy,
  CheckCircle2,
  ExternalLink,
  Target,
} from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface SelectedMentorCardProps {
  mentor: MentorDetailData
  onViewProfile?: () => void
}

/**
 * Thẻ hiển thị thông tin Mentor được chọn khi gửi yêu cầu trực tiếp (UC101).
 * Tuân thủ nghiêm ngặt Premium Pastel Design System của AlumNect.
 */
export const SelectedMentorCard: React.FC<SelectedMentorCardProps> = ({ mentor }) => {
  return (
    <Card
      hover={false}
      className="relative overflow-hidden border border-brand-500/20 bg-gradient-to-br from-white via-cream-50/40 to-brand-50/30 p-6 sm:p-7 shadow-sm rounded-3xl dark:from-[#242526] dark:via-[#242526] dark:to-brand-700/20 dark:border-brand-500/20 text-left"
    >
      {/* Decorative Pastel Background Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-brand-300/20 via-violet-300/15 to-transparent blur-2xl" />

      {/* Header Tag Phân biệt Direct Request */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-plum-900/[0.06] dark:border-white/[0.06]">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-500/25 dark:bg-brand-500/20 dark:text-brand-300">
          <Target className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          <span>Yêu cầu cố vấn trực tiếp (Direct Request)</span>
        </div>

        <Link
          to={`/app/mentoring/mentors/${mentor.mentorId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-plum-600 hover:text-brand-600 transition-colors dark:text-[#b0b3b8] dark:hover:text-brand-400"
        >
          <span>Xem trang chi tiết</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar
            src={mentor.avatarUrl || undefined}
            name={mentor.fullName}
            size={80}
            ring
            className="shadow-sm"
          />
          {mentor.mentorStatus === 'ACTIVE' && (
            <span
              className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-mint-500 shadow-sm dark:border-[#242526]"
              title="Mentor đang hoạt động"
            />
          )}
        </div>

        {/* Thông tin chính của Mentor */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-plum-900 dark:text-[#e4e6eb] truncate">
              {mentor.fullName}
            </h2>

            {mentor.isVerifiedAlumni && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 border border-brand-200/60 dark:bg-brand-700/40 dark:text-brand-300 dark:border-brand-700/40"
                title="Cựu sinh viên FPT University đã được xác thực"
              >
                <ShieldCheck className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                <span>Xác thực FPT</span>
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-plum-700 dark:text-[#b0b3b8]">
            {mentor.currentPosition
              ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
              : mentor.headline || 'Cố vấn chuyên môn'}
          </p>

          {/* Học vị & Cơ sở */}
          {mentor.academicInfo && (
            <div className="flex items-center gap-1.5 text-xs text-plum-500 dark:text-[#8f9399]">
              <GraduationCap className="h-3.5 w-3.5 text-brand-500 shrink-0" />
              <span>
                {mentor.academicInfo.campus || 'Đại học FPT'}
                {mentor.academicInfo.majorName ? ` • ${mentor.academicInfo.majorName}` : ''}
                {mentor.academicInfo.cohort ? ` • K${mentor.academicInfo.cohort}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 rounded-2xl bg-white/70 p-3.5 border border-plum-900/[0.05] dark:bg-white/[0.03] dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-gold-600 dark:bg-amber-950/40 dark:text-gold-400">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-plum-400 dark:text-[#8f9399]">Uy tín</div>
            <strong className="text-xs sm:text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
              {mentor.reputationScore ?? 0} pts
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral-50 text-coral-600 dark:bg-coral-950/40 dark:text-coral-400">
            <Star className="h-4 w-4 fill-coral-500 text-coral-500" />
          </div>
          <div>
            <div className="text-[11px] text-plum-400 dark:text-[#8f9399]">Đánh giá</div>
            <strong className="text-xs sm:text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
              {mentor.rating ? Number(mentor.rating).toFixed(1) : '5.0'} ★
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint-50 text-mint-600 dark:bg-mint-950/40 dark:text-mint-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[11px] text-plum-400 dark:text-[#8f9399]">Hoàn thành</div>
            <strong className="text-xs sm:text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
              {mentor.completedTasks ?? 0} phiên
            </strong>
          </div>
        </div>
      </div>

      {/* Lĩnh vực hỗ trợ (Supported Fields) */}
      {mentor.supportedFields && mentor.supportedFields.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-plum-900/[0.05] dark:border-white/[0.05] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-plum-700 dark:text-[#e4e6eb]">
            <Briefcase className="h-3.5 w-3.5 text-brand-500" />
            <span>Lĩnh vực Mentor nhận cố vấn:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {mentor.supportedFields.map((field) => (
              <span
                key={field.id}
                className="inline-flex items-center rounded-xl bg-white px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200/70 shadow-2xs dark:bg-[#18191a] dark:text-brand-300 dark:border-brand-700/40"
              >
                {field.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
