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
      className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-5 shadow-xs transition duration-200 hover:border-brand-400/70"
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
                className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-success dark:border-border"
                title="Mentor đang hoạt động"
              />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              to={mentorDetailUrl}
              onClick={(e) => e.stopPropagation()}
              className="block font-display text-base font-bold leading-6 text-text transition-colors hover:text-primary-solid"
            >
              {mentor.fullName}
            </Link>

            <p className="mt-0.5 min-h-10 text-sm font-medium leading-5 text-text-muted dark:text-text-muted">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>

            {/* Ngành học */}
            {majorTitle && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-text-muted">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary-solid" />
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
              <Badge key={idx} tone="brand" className="px-2.5 py-1 text-xs font-semibold normal-case tracking-normal">
                {label}
              </Badge>
            ))}
            {fieldLabels.length > 2 && (
              <span className="text-xs font-medium text-text-subtle">
                +{fieldLabels.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Phần Footer Card: Chỉ số (Điểm uy tín, Đánh giá sao, Nhiệm vụ) & Nút hành động */}
      <div className="mt-4 border-t border-border pt-3.5">
        <div className="mb-3 grid grid-cols-3 gap-2">
          {/* Điểm uy tín */}
          <div className="min-w-0" title="Điểm uy tín Mentor">
            <span className="flex items-center gap-1 text-sm font-bold text-text">
              <Flame className="h-4 w-4 shrink-0 text-warning" />
              {mentor.reputationScore}
            </span>
            <span className="mt-0.5 block text-xs text-text-subtle">Uy tín</span>
          </div>

          {/* Đánh giá sao */}
          {mentor.rating > 0 ? (
            <div className="min-w-0" title="Đánh giá trung bình">
              <span className="flex items-center gap-1 text-sm font-bold text-text">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {Number(mentor.rating).toFixed(1)}
              </span>
              <span className="mt-0.5 block text-xs text-text-subtle">
                {mentor.reviewCount > 0 ? `${mentor.reviewCount} đánh giá` : 'Đánh giá'}
              </span>
            </div>
          ) : (
            <div className="min-w-0 text-text-subtle">
              <span className="flex items-center gap-1 text-sm font-bold"><Sparkles className="h-3.5 w-3.5" />Mới</span>
              <span className="mt-0.5 block text-xs">Đánh giá</span>
            </div>
          )}

          {/* Nhiệm vụ hoàn thành */}
          <div className="min-w-0" title="Số nhiệm vụ hướng dẫn hoàn thành">
            <span className="flex items-center gap-1 text-sm font-bold text-text">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
              {completedCount}
            </span>
            <span className="mt-0.5 block text-xs text-text-subtle">Hoàn thành</span>
          </div>
        </div>

        {/* Nút hành động Kết nối */}
        <Link
          to={mentorDetailUrl}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary-solid px-4 py-2.5 text-sm font-semibold text-on-primary shadow-xs transition hover:bg-primary-hover active:scale-[0.98] dark:text-text-inverse"
        >
          <span>Xem hồ sơ</span>
        </Link>
      </div>
    </Card>
  )
}
