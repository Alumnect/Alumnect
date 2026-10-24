import { Link } from 'react-router-dom'
import { Flame, CheckCircle2, Star, ExternalLink, Trophy, Medal, Award } from 'lucide-react'
import { Card, Avatar, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { MentorRankingItem } from '../model/mentorRankingTypes'

interface MentorRankingCardProps {
  mentor: MentorRankingItem
}

/**
 * Thẻ hiển thị một mục Mentor trong danh sách bảng xếp hạng (UC97).
 */
export function MentorRankingCard({ mentor }: MentorRankingCardProps) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-warning-border bg-warning-soft text-warning font-semibold text-sm shadow-md shadow-gold-500/30">
          <Trophy className="h-4 w-4" />
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-surface-3 text-text font-bold text-sm border border-border-strong">
          <Medal className="h-4 w-4" />
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-warning-soft text-warning font-bold text-sm border border-warning-border">
          <Award className="h-4 w-4" />
        </span>
      )
    }
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-border text-text-muted font-bold text-sm dark:bg-white/[0.08]">
        #{rank}
      </span>
    )
  }

  return (
    <Card
      hover
      className={cn(
        'border bg-surface p-4 transition duration-200 backdrop-blur-sm sm:p-5 dark:border-border',
        mentor.rank <= 3
          ? 'border-primary-soft-border shadow-xs'
          : 'border-border hover:border-primary-soft-border',
      )}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Cột trái: Rank + Avatar + Thông tin định danh */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0">{getRankBadge(mentor.rank)}</div>

          <Link
            to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
            className="shrink-0 transition-transform duration-200 hover:scale-105"
          >
            <Avatar
              src={mentor.avatarUrl || undefined}
              name={mentor.fullName}
              size={52}
              ring
            />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
                className="font-display text-sm sm:text-base font-bold text-text hover:text-primary-solid transition-colors truncate"
              >
                {mentor.fullName}
              </Link>
              <Badge tone="brand" className="text-xs px-2 py-0.5 hidden sm:inline-flex">
                {mentor.fieldName}
              </Badge>
            </div>

            <p className="mt-0.5 text-xs text-text-muted truncate">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` • ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>
          </div>
        </div>

        {/* Cột phải: Các chỉ số hiệu suất & CTA */}
        <div className="grid grid-cols-2 items-center gap-2 border-t border-border pt-3 sm:flex sm:flex-nowrap sm:justify-end sm:gap-3 sm:border-t-0 sm:pt-0">
          {/* Chỉ số Uy tín (Reputation Score) */}
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-warning-soft px-3 py-1.5">
            <Flame className="h-4 w-4 text-warning shrink-0" />
            <div className="text-left">
              <p className="text-xs uppercase font-bold text-warning">Uy tín</p>
              <p className="text-xs font-bold text-warning">{mentor.reputationScore}</p>
            </div>
          </div>

          {/* Chỉ số Nhiệm vụ đã hoàn thành (Completed Tasks) */}
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary-solid shrink-0" />
            <div className="text-left">
              <p className="text-xs uppercase font-bold text-primary-solid">Nhiệm vụ</p>
              <p className="text-xs font-bold text-primary-solid">{mentor.completedTasks}</p>
            </div>
          </div>

          {/* Đánh giá sao */}
          {mentor.rating > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-text-muted">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" />
              <span>{Number(mentor.rating).toFixed(1)}</span>
              {mentor.reviewCount > 0 && (
                <span className="text-xs text-text-subtle font-normal">({mentor.reviewCount})</span>
              )}
            </div>
          )}

          {/* Nút Xem chi tiết hồ sơ Mentor */}
          <Link
            to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary-soft px-3.5 py-2 text-xs font-bold text-primary-solid transition-colors hover:bg-primary-solid hover:text-white sm:col-auto sm:py-1.5"
          >
            <span>Chi tiết</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
