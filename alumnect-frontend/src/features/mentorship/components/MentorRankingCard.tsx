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
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-gold-500 text-white font-extrabold text-sm shadow-md shadow-gold-500/30">
          <Trophy className="h-4 w-4" />
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200 text-slate-800 font-extrabold text-sm border border-slate-300">
          <Medal className="h-4 w-4" />
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 font-extrabold text-sm border border-amber-300">
          <Award className="h-4 w-4" />
        </span>
      )
    }
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-plum-900/[0.06] text-plum-700 font-black text-sm dark:bg-white/[0.08] dark:text-[#e4e6eb]">
        #{rank}
      </span>
    )
  }

  return (
    <Card
      hover
      className={cn(
        'border bg-white/90 p-4 transition-all duration-200 backdrop-blur-sm sm:p-5 dark:border-[#393a3b] dark:bg-[#242526]',
        mentor.rank <= 3
          ? 'border-brand-500/30 shadow-xs'
          : 'border-plum-900/10 hover:border-brand-300 hover:shadow-md hover:shadow-brand-500/5',
      )}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        {/* Cột trái: Rank + Avatar + Thông tin định danh */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="shrink-0">{getRankBadge(mentor.rank)}</div>

          <Link
            to={`/app/profile?userId=${mentor.userId}`}
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
                to={`/app/profile?userId=${mentor.userId}`}
                className="font-heading text-sm sm:text-base font-extrabold text-plum-900 hover:text-brand-600 transition-colors truncate dark:text-[#e4e6eb] dark:hover:text-brand-400"
              >
                {mentor.fullName}
              </Link>
              <Badge tone="brand" className="text-[10px] px-2 py-0.5 hidden sm:inline-flex">
                {mentor.fieldName}
              </Badge>
            </div>

            <p className="mt-0.5 text-xs text-plum-600 truncate dark:text-[#b0b3b8]">
              {mentor.currentPosition
                ? `${mentor.currentPosition}${mentor.currentCompany ? ` • ${mentor.currentCompany}` : ''}`
                : mentor.headline || 'Cố vấn chuyên môn'}
            </p>
          </div>
        </div>

        {/* Cột phải: Các chỉ số hiệu suất & CTA */}
        <div className="grid grid-cols-2 items-center gap-2 border-t border-plum-900/10 pt-3 sm:flex sm:flex-nowrap sm:justify-end sm:gap-3 sm:border-t-0 sm:pt-0 dark:border-[#393a3b]">
          {/* Chỉ số Uy tín (Reputation Score) */}
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-gold-50 px-3 py-1.5 dark:bg-gold-950/40">
            <Flame className="h-4 w-4 text-gold-500 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-gold-700 dark:text-gold-300">Uy tín</p>
              <p className="text-xs font-black text-gold-950 dark:text-gold-200">{mentor.reputationScore}</p>
            </div>
          </div>

          {/* Chỉ số Nhiệm vụ đã hoàn thành (Completed Tasks) */}
          <div className="flex min-w-0 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 dark:bg-brand-950/40">
            <CheckCircle2 className="h-4 w-4 text-brand-500 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-brand-700 dark:text-brand-300">Nhiệm vụ</p>
              <p className="text-xs font-black text-brand-950 dark:text-brand-200">{mentor.completedTasks}</p>
            </div>
          </div>

          {/* Đánh giá sao */}
          {mentor.rating > 0 && (
            <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-plum-700 dark:text-[#e4e6eb]">
              <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
              <span>{Number(mentor.rating).toFixed(1)}</span>
              {mentor.reviewCount > 0 && (
                <span className="text-[11px] text-plum-400 font-normal">({mentor.reviewCount})</span>
              )}
            </div>
          )}

          {/* Nút Xem hồ sơ */}
          <Link
            to={`/app/profile?userId=${mentor.userId}`}
            className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-plum-900/5 px-3 py-2 text-xs font-bold text-plum-700 transition-colors hover:bg-brand-500 hover:text-white sm:col-auto sm:py-1.5 dark:bg-white/5 dark:text-[#e4e6eb] dark:hover:bg-brand-600"
          >
            <span>Hồ sơ</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </Card>
  )
}
