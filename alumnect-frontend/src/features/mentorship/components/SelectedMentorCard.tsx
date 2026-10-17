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
      className="relative overflow-hidden border border-primary-soft-border bg-gradient-to-br from-white via-cream-50/40 to-brand-50/30 p-6 sm:p-7 shadow-sm rounded-3xl dark:from-surface dark:via-surface dark:to-brand-700/20 text-left"
    >
      {/* Decorative Pastel Background Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-brand-300/20 via-violet-300/15 to-transparent blur-2xl" />

      {/* Header Tag Phân biệt Direct Request */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-4 border-b border-border dark:border-white/[0.06]">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-solid border border-brand-500/25">
          <Target className="h-3.5 w-3.5 text-primary-solid" />
          <span>Yêu cầu cố vấn trực tiếp</span>
        </div>

        <Link
          to={`/app/mentoring/mentors/${mentor.mentorId}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary-solid transition-colors"
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
              className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-success shadow-sm dark:border-border"
              title="Mentor đang hoạt động"
            />
          )}
        </div>

        {/* Thông tin chính của Mentor */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-text truncate">
              {mentor.fullName}
            </h2>

            {mentor.isVerifiedAlumni && (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-solid border border-primary-soft-border"
                title="Cựu sinh viên FPT University đã được xác thực"
              >
                <ShieldCheck className="h-3 w-3 text-primary-solid" />
                <span>Xác thực FPT</span>
              </span>
            )}
          </div>

          <p className="text-sm font-semibold text-text-muted">
            {mentor.currentPosition
              ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
              : mentor.headline || 'Cố vấn chuyên môn'}
          </p>

          {/* Học vị & Cơ sở */}
          {mentor.academicInfo && (
            <div className="flex items-center gap-1.5 text-xs text-text-subtle">
              <GraduationCap className="h-3.5 w-3.5 text-primary-solid shrink-0" />
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5 rounded-2xl bg-surface/70 p-3.5 border border-border dark:bg-white/[0.03] dark:border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-text-subtle">Uy tín</div>
            <strong className="text-xs sm:text-sm font-bold text-text">
              {mentor.reputationScore ?? 0} pts
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-danger-soft text-danger">
            <Star className="h-4 w-4 fill-danger text-danger" />
          </div>
          <div>
            <div className="text-xs text-text-subtle">Đánh giá</div>
            <strong className="text-xs sm:text-sm font-bold text-text">
              {mentor.rating ? Number(mentor.rating).toFixed(1) : '5.0'} ★
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-success-soft text-success">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs text-text-subtle">Hoàn thành</div>
            <strong className="text-xs sm:text-sm font-bold text-text">
              {mentor.completedTasks ?? 0} phiên
            </strong>
          </div>
        </div>
      </div>

      {/* Lĩnh vực hỗ trợ (Supported Fields) */}
      {mentor.supportedFields && mentor.supportedFields.length > 0 && (
        <div className="mt-4 pt-3.5 border-t border-border dark:border-white/[0.05] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
            <Briefcase className="h-3.5 w-3.5 text-primary-solid" />
            <span>Lĩnh vực Mentor nhận cố vấn:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {mentor.supportedFields.map((field) => (
              <span
                key={field.id}
                className="inline-flex items-center rounded-xl bg-surface px-2.5 py-1 text-xs font-bold text-primary-solid border border-brand-200/70 shadow-2xs dark:border-brand-700/40"
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
