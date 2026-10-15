import { Link } from 'react-router-dom'
import { Flame, Star, CheckCircle2, GraduationCap, Sparkles } from 'lucide-react'
import { Card, Avatar, Badge } from '@/components/ui'
import type { MentorCardData } from '../model/mentorSearchTypes'

interface MentorCardProps {
  mentor: MentorCardData
}

/**
 * Thẻ hiển thị Mentor tối giản & tinh gọn (UC98).
 * Giữ lại: Thông tin cơ bản, ngành/lĩnh vực, điểm uy tín, sao đánh giá và nhiệm vụ hoàn thành.
 * Lược bỏ: Đoạn bio dài, các badge hình thức (online/offline, 1-1/nhóm) và mức giá thỏa thuận.
 */
export function MentorCard({ mentor }: MentorCardProps) {
  const mentorDetailUrl = `/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`

  // Danh sách lĩnh vực hỗ trợ
  const fieldLabels: string[] = (mentor.supportedFields || [])
    .map((field) => {
      if (typeof field === 'object' && field !== null) {
        return (field as { name?: string }).name || ''
      }
      return String(field)
    })
    .filter(Boolean)

  const majorTitle = mentor.majorName || mentor.specialization
  const completedCount = mentor.completedMissions ?? mentor.completedTasks ?? 0

  return (
    <Card
      hover
      className="group flex h-full flex-col justify-between rounded-2xl border border-plum-900/[0.08] bg-white p-5 shadow-xs transition-all duration-200 hover:border-brand-400/70 hover:shadow-md dark:border-white/10 dark:bg-[#242526]"
    >
      <div>
        {/* Phần Header Card: Avatar + Tên + Chức danh */}
        <div className="flex items-start gap-3.5">
          <Link
            to={mentorDetailUrl}
            onClick={(e) => e.stopPropagation()}
            className="group/avatar relative shrink-0 transition-transform duration-200 hover:scale-105"
            aria-label={`Xem hồ sơ của ${mentor.fullName}`}
          >
            <Avatar
              src={mentor.avatarUrl || undefined}
              name={mentor.fullName}
              size={52}
              ring
            />
            {mentor.active && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-mint-500 dark:border-[#242526]"
                title="Mentor đang hoạt động"
              />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              to={mentorDetailUrl}
              onClick={(e) => e.stopPropagation()}
              className="block font-display text-base font-bold leading-6 text-plum-900 transition-colors hover:text-brand-600 dark:text-white dark:hover:text-brand-300"
            >
              {mentor.fullName}
            </Link>

            <p className="mt-0.5 min-h-10 text-sm font-medium leading-5 text-plum-600 dark:text-[#c7c9cc]">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>

            {/* Ngành học */}
            {majorTitle && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-plum-600 dark:text-[#b0b3b8]">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                <span className="truncate">
                  {majorTitle} {mentor.majorCode ? `(${mentor.majorCode})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Lĩnh vực hỗ trợ */}
        {fieldLabels.length > 0 && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            {fieldLabels.slice(0, 2).map((label, idx) => (
              <Badge key={idx} tone="brand" className="px-2.5 py-1 text-xs font-semibold normal-case tracking-normal dark:bg-brand-400/15 dark:text-brand-200">
                {label}
              </Badge>
            ))}
            {fieldLabels.length > 2 && (
              <span className="text-[11px] font-medium text-plum-400 dark:text-[#8f9399]">
                +{fieldLabels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Phần Footer Card: Chỉ số (Điểm uy tín, Đánh giá sao, Nhiệm vụ) & Nút hành động */}
      <div className="mt-4 border-t border-plum-900/[0.07] pt-3.5 dark:border-[#393a3b]">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {/* Điểm uy tín */}
          <div className="min-w-0" title="Điểm uy tín Mentor">
            <span className="flex items-center gap-1 text-sm font-bold text-plum-900 dark:text-white">
              <Flame className="h-4 w-4 shrink-0 text-gold-500" />
              {mentor.reputationScore}
            </span>
            <span className="mt-0.5 block text-[11px] text-plum-500 dark:text-[#b0b3b8]">Uy tín</span>
          </div>

          {/* Đánh giá sao */}
          {mentor.rating > 0 ? (
            <div className="min-w-0" title="Đánh giá trung bình">
              <span className="flex items-center gap-1 text-sm font-bold text-plum-900 dark:text-white">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                {Number(mentor.rating).toFixed(1)}
              </span>
              <span className="mt-0.5 block text-[11px] text-plum-500 dark:text-[#b0b3b8]">
                {mentor.reviewCount > 0 ? `${mentor.reviewCount} đánh giá` : 'Đánh giá'}
              </span>
            </div>
          ) : (
            <div className="min-w-0 text-plum-500 dark:text-[#b0b3b8]">
              <span className="flex items-center gap-1 text-sm font-bold"><Sparkles className="h-3.5 w-3.5" />Mới</span>
              <span className="mt-0.5 block text-[11px]">Đánh giá</span>
            </div>
          )}

          {/* Nhiệm vụ hoàn thành */}
          <div className="min-w-0" title="Số nhiệm vụ hướng dẫn hoàn thành">
            <span className="flex items-center gap-1 text-sm font-bold text-plum-900 dark:text-white">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-mint-600" />
              {completedCount}
            </span>
            <span className="mt-0.5 block text-[11px] text-plum-500 dark:text-[#b0b3b8]">Hoàn thành</span>
          </div>
        </div>

        {/* Nút hành động Kết nối */}
        <Link
          to={mentorDetailUrl}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-500/20 active:scale-[0.98] dark:text-[#18191a]"
        >
          <span>Xem hồ sơ</span>
        </Link>
      </div>
    </Card>
  )
}
