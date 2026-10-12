import { Link, useNavigate } from 'react-router-dom'
import {
  Flame,
  CheckCircle2,
  Star,
  Laptop,
  MapPin,
  Users,
  User,
  GraduationCap,
  Sparkles,
} from 'lucide-react'
import { Card, Avatar, Badge } from '@/components/ui'
import type { MentorCardData, MentoringWorkingMode, MentoringType } from '../model/mentorSearchTypes'

interface MentorCardProps {
  mentor: MentorCardData
}

/**
 * Hiển thị nhãn thân thiện cho hình thức làm việc.
 */
function getWorkingModeBadge(mode: MentoringWorkingMode) {
  switch (mode) {
    case 'ONLINE':
      return {
        label: 'Trực tuyến',
        icon: <Laptop className="h-3 w-3" />,
        tone: 'aqua' as const,
      }
    case 'OFFLINE':
      return {
        label: 'Gặp trực tiếp',
        icon: <MapPin className="h-3 w-3" />,
        tone: 'violet' as const,
      }
    case 'BOTH':
      return {
        label: 'Online & Trực tiếp',
        icon: <Laptop className="h-3 w-3" />,
        tone: 'brand' as const,
      }
    default:
      return {
        label: 'Linh hoạt',
        icon: <Laptop className="h-3 w-3" />,
        tone: 'neutral' as const,
      }
  }
}

/**
 * Hiển thị nhãn thân thiện cho hình thức hướng dẫn.
 */
function getMentoringTypeBadge(type: MentoringType) {
  switch (type) {
    case 'INDIVIDUAL':
      return {
        label: '1 kèm 1',
        icon: <User className="h-3 w-3" />,
      }
    case 'GROUP':
      return {
        label: 'Theo nhóm',
        icon: <Users className="h-3 w-3" />,
      }
    case 'BOTH':
      return {
        label: '1-1 & Nhóm',
        icon: <Users className="h-3 w-3" />,
      }
    default:
      return {
        label: '1 kèm 1',
        icon: <User className="h-3 w-3" />,
      }
  }
}

/**
 * Định dạng tiền tệ VND thân thiện.
 */
function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Thẻ hiển thị Mentor trong kết quả Tìm kiếm & Lọc (UC98).
 * Thiết kế theo chuẩn Pastel Premium Design System (Card surface, bo góc 3xl, shadow nhẹ, hover-lift).
 */
export function MentorCard({ mentor }: MentorCardProps) {
  const navigate = useNavigate()
  const workingModeMeta = getWorkingModeBadge(mentor.workingMode)
  const mentoringTypeMeta = getMentoringTypeBadge(mentor.mentoringType)

  const profileUrl = `/app/profile?userId=${mentor.userId}`

  const handleCardClick = () => {
    navigate(profileUrl)
  }

  // Xử lý an toàn nhãn lĩnh vực hỗ trợ (có thể là string hoặc object {id, name})
  const firstSupportedField = mentor.supportedFields?.[0]
  const fieldLabel =
    typeof firstSupportedField === 'object' && firstSupportedField !== null
      ? (firstSupportedField as { name?: string }).name
      : firstSupportedField

  const majorTitle = mentor.majorName || mentor.specialization

  return (
    <Card
      hover
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      className="group flex flex-col justify-between border border-plum-900/[0.08] bg-white/95 p-5 shadow-xs transition-all duration-200 backdrop-blur-sm hover:border-brand-400 hover:shadow-lg hover:shadow-brand-500/10 dark:border-[#393a3b] dark:bg-[#242526] cursor-pointer"
    >
      <div>
        {/* Phần Header Card: Avatar + Tên + Chức danh */}
        <div className="flex items-start gap-4">
          <Link
            to={profileUrl}
            onClick={(e) => e.stopPropagation()}
            className="group/avatar relative shrink-0 transition-transform duration-200 hover:scale-105"
            aria-label={`Xem hồ sơ của ${mentor.fullName}`}
          >
            <Avatar
              src={mentor.avatarUrl || undefined}
              name={mentor.fullName}
              size={56}
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
            <div className="flex items-center gap-2">
              <Link
                to={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className="truncate font-heading text-base font-extrabold text-plum-900 transition-colors hover:text-brand-600 dark:text-[#e4e6eb] dark:hover:text-brand-400"
              >
                {mentor.fullName}
              </Link>
            </div>

            <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-plum-600 dark:text-[#b0b3b8]">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` @ ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>

            {majorTitle && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium text-plum-500 dark:text-[#8f9399]">
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                <span className="truncate">
                  {majorTitle} {mentor.majorCode ? `(${mentor.majorCode})` : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bio tóm tắt nếu có */}
        {mentor.bio && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-plum-600/90 dark:text-[#b0b3b8]">
            {mentor.bio}
          </p>
        )}

        {/* Badges hình thức & phương thức */}
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          <Badge tone={workingModeMeta.tone} icon={workingModeMeta.icon} className="text-[10px] py-0.5">
            {workingModeMeta.label}
          </Badge>

          <span className="inline-flex items-center gap-1 rounded-full bg-plum-900/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plum-600 ring-1 ring-inset ring-plum-900/10 dark:bg-white/[0.06] dark:text-[#b0b3b8]">
            {mentoringTypeMeta.icon}
            {mentoringTypeMeta.label}
          </span>

          {fieldLabel && (
            <Badge tone="brand" className="text-[10px] py-0.5">
              {fieldLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* Phần Footer Card: Chỉ số hiệu suất, Mức phí & CTA */}
      <div className="mt-4 border-t border-plum-900/[0.07] pt-3.5 dark:border-[#393a3b]">
        <div className="flex items-center justify-between gap-2">
          {/* Nhóm chỉ số: Uy tín & Đánh giá */}
          <div className="flex items-center gap-3">
            {/* Điểm uy tín */}
            <div className="flex items-center gap-1" title="Điểm uy tín Mentor">
              <Flame className="h-4 w-4 text-gold-500 shrink-0" />
              <span className="text-xs font-black text-plum-900 dark:text-[#e4e6eb]">
                {mentor.reputationScore}
              </span>
            </div>

            {/* Đánh giá sao */}
            {mentor.rating > 0 ? (
              <div className="flex items-center gap-1 text-xs font-bold text-plum-800 dark:text-[#e4e6eb]">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                <span>{Number(mentor.rating).toFixed(1)}</span>
                {mentor.reviewCount > 0 && (
                  <span className="text-[11px] font-normal text-plum-400">({mentor.reviewCount})</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-plum-400 dark:text-[#8f9399]">
                <Sparkles className="h-3 w-3 text-brand-400" />
                <span>Mới</span>
              </div>
            )}

            {/* Nhiệm vụ hoàn thành */}
            {((mentor.completedMissions ?? mentor.completedTasks ?? 0) > 0) && (
              <div
                className="hidden items-center gap-1 text-[11px] text-plum-500 sm:flex dark:text-[#8f9399]"
                title="Số nhiệm vụ hướng dẫn hoàn thành"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-mint-600" />
                <span>{mentor.completedMissions ?? mentor.completedTasks}</span>
              </div>
            )}
          </div>

          {/* Mức chi phí ước tính */}
          <div className="text-right">
            {mentor.minHourlyRate != null && mentor.minHourlyRate > 0 ? (
              <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                {formatVnd(mentor.minHourlyRate)}
                <span className="text-[10px] font-normal text-plum-400">/giờ</span>
              </p>
            ) : (
              <p className="text-[11px] font-medium text-mint-700 dark:text-mint-300">
                Miễn phí / Thỏa thuận
              </p>
            )}
          </div>
        </div>

        {/* Nút hành động Kết nối */}
        <div className="mt-3.5">
          <Link
            to={profileUrl}
            onClick={(e) => e.stopPropagation()}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-700 hover:shadow-md hover:shadow-brand-500/20 active:scale-[0.98]"
          >
            <span>Kết nối</span>
          </Link>
        </div>
      </div>
    </Card>
  )
}
