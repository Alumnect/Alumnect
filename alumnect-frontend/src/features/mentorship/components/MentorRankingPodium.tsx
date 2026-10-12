import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Award, Medal, Star, Flame, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { MentorRankingItem } from '../model/mentorRankingTypes'

interface MentorRankingPodiumProps {
  topMentors: MentorRankingItem[]
}

interface RankStyle {
  badge: string
  border: string
  shadow: string
  icon: ReactNode
  rankTitle: string
}

export function MentorRankingPodium({ topMentors }: MentorRankingPodiumProps) {
  if (topMentors.length === 0) {
    return null
  }

  const first = topMentors.find((mentor) => mentor.rank === 1) || topMentors[0]
  const second = topMentors.find((mentor) => mentor.rank === 2) || (topMentors.length > 1 ? topMentors[1] : null)
  const third = topMentors.find((mentor) => mentor.rank === 3) || (topMentors.length > 2 ? topMentors[2] : null)

  const renderPodiumCard = (mentor: MentorRankingItem | null, rank: number, rankStyle: RankStyle) => {
    if (!mentor) return null

    const isFirst = rank === 1

    return (
      <div className={cn('relative pt-4', isFirst ? 'z-10 md:-translate-y-2' : 'z-0')}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider shadow-md',
              rankStyle.badge,
            )}
          >
            {rankStyle.icon}
            {rankStyle.rankTitle}
          </span>
        </div>

        <Card
          hover
          className={cn(
            'flex min-h-full flex-col justify-between border bg-white/90 p-5 pt-10 text-center transition-all duration-300 backdrop-blur-sm dark:bg-[#242526]',
            rankStyle.border,
            rankStyle.shadow,
          )}
        >
          <div className="space-y-3">
            <div className="relative mx-auto inline-block">
              <Link
                to={`/app/profile?userId=${mentor.userId}`}
                className="block transition-transform duration-300 hover:scale-105"
              >
                <Avatar
                  src={mentor.avatarUrl || undefined}
                  name={mentor.fullName}
                  size={isFirst ? 80 : 68}
                  ring
                  className="mx-auto"
                />
              </Link>
            </div>

            <div>
              <Link
                to={`/app/profile?userId=${mentor.userId}`}
                className="line-clamp-1 text-base font-extrabold text-plum-900 transition-colors hover:text-brand-600 dark:text-[#e4e6eb] dark:hover:text-brand-400"
              >
                {mentor.fullName}
              </Link>
              <p className="mt-0.5 min-h-[32px] line-clamp-2 text-xs leading-relaxed text-plum-500 dark:text-[#8a8d91]">
                {mentor.currentPosition
                  ? `${mentor.currentPosition}${mentor.currentCompany ? ` tại ${mentor.currentCompany}` : ''}`
                  : mentor.headline || 'Cố vấn chuyên môn'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-plum-900/10 pt-3 dark:border-[#393a3b]">
              <div className="rounded-xl bg-gold-50 p-2 text-center dark:bg-gold-950/40">
                <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-gold-700 dark:text-gold-300">
                  <Flame className="h-3.5 w-3.5 text-gold-500" />
                  Uy tín
                </span>
                <p className="mt-0.5 text-sm font-extrabold text-gold-900 dark:text-gold-200">
                  {mentor.reputationScore}
                </p>
              </div>

              <div className="rounded-xl bg-brand-50 p-2 text-center dark:bg-brand-950/40">
                <span className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-700 dark:text-brand-300">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                  Nhiệm vụ
                </span>
                <p className="mt-0.5 text-sm font-extrabold text-brand-900 dark:text-brand-200">
                  {mentor.completedTasks}
                </p>
              </div>
            </div>

            {mentor.rating > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-plum-600 dark:text-[#b0b3b8]">
                <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />
                <span className="font-bold">{Number(mentor.rating).toFixed(1)}</span>
                {mentor.reviewCount > 0 && (
                  <span className="text-[11px] text-plum-400">({mentor.reviewCount} đánh giá)</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <Link
              to={`/app/profile?userId=${mentor.userId}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-plum-900/5 py-2 text-xs font-bold text-plum-700 transition-colors hover:bg-brand-500 hover:text-white dark:bg-white/5 dark:text-[#e4e6eb] dark:hover:bg-brand-600"
            >
              <span>Xem hồ sơ</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-gold-500" />
        <h2 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
          Top 3 Cố Vấn Dẫn Đầu
        </h2>
      </div>

      <div className="grid grid-cols-1 items-end gap-5 pt-1 md:grid-cols-3">
        {second && renderPodiumCard(second, 2, {
          badge: 'border border-slate-300 bg-slate-200 text-slate-800',
          border: 'border-slate-300/80',
          shadow: 'hover:shadow-slate-400/20',
          icon: <Medal className="h-3.5 w-3.5 text-slate-600" />,
          rankTitle: 'Hạng 2',
        })}

        {first && renderPodiumCard(first, 1, {
          badge: 'bg-gradient-to-r from-amber-400 to-gold-500 text-white shadow-gold-500/30',
          border: 'border-gold-400 ring-2 ring-gold-400/30',
          shadow: 'shadow-lg shadow-gold-500/15 hover:shadow-xl hover:shadow-gold-500/25',
          icon: <Trophy className="h-3.5 w-3.5 text-white" />,
          rankTitle: 'Quán quân #1',
        })}

        {third && renderPodiumCard(third, 3, {
          badge: 'border border-amber-300 bg-amber-100 text-amber-900',
          border: 'border-amber-300/80',
          shadow: 'hover:shadow-amber-500/20',
          icon: <Award className="h-3.5 w-3.5 text-amber-700" />,
          rankTitle: 'Hạng 3',
        })}
      </div>
    </div>
  )
}
