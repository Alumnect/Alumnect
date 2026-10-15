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
      <div className={cn(
        'relative pt-4',
        isFirst ? 'z-10 md:order-2 md:-translate-y-2' : rank === 2 ? 'z-0 md:order-1' : 'z-0 md:order-3',
      )}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-md',
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
            'flex min-h-full flex-col justify-between border bg-surface p-5 pt-10 text-center transition-all duration-300 backdrop-blur-sm',
            rankStyle.border,
            rankStyle.shadow,
          )}
        >
          <div className="space-y-3">
            <div className="relative mx-auto inline-block">
              <Link
                to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
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
                to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
                className="line-clamp-1 text-base font-bold text-text transition-colors hover:text-primary-solid"
              >
                {mentor.fullName}
              </Link>
              <p className="mt-0.5 min-h-[32px] line-clamp-2 text-xs leading-relaxed text-text-subtle dark:text-text-subtle">
                {mentor.currentPosition
                  ? `${mentor.currentPosition}${mentor.currentCompany ? ` tại ${mentor.currentCompany}` : ''}`
                  : mentor.headline || 'Cố vấn chuyên môn'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <div className="rounded-xl bg-warning-soft p-2 text-center">
                <span className="flex items-center justify-center gap-1 text-xs font-bold text-warning">
                  <Flame className="h-3.5 w-3.5 text-warning" />
                  Uy tín
                </span>
                <p className="mt-0.5 text-sm font-bold text-warning">
                  {mentor.reputationScore}
                </p>
              </div>

              <div className="rounded-xl bg-primary-soft p-2 text-center">
                <span className="flex items-center justify-center gap-1 text-xs font-bold text-primary-solid">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-solid" />
                  Nhiệm vụ
                </span>
                <p className="mt-0.5 text-sm font-bold text-primary-solid">
                  {mentor.completedTasks}
                </p>
              </div>
            </div>

            {mentor.rating > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-text-muted">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                <span className="font-bold">{Number(mentor.rating).toFixed(1)}</span>
                {mentor.reviewCount > 0 && (
                  <span className="text-xs text-text-subtle">({mentor.reviewCount} đánh giá)</span>
                )}
              </div>
            )}
          </div>

          <div className="pt-3">
            <Link
              to={`/app/mentoring/mentors/${mentor.mentorId || mentor.userId}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 py-2 text-xs font-bold text-text-muted transition-colors hover:bg-primary-solid hover:text-white"
            >
              <span>Xem chi tiết cố vấn</span>
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
        <Trophy className="h-4 w-4 text-warning" />
        <h2 className="font-display text-base font-bold text-text">
          Top 3 cố vấn dẫn đầu
        </h2>
      </div>

      <div className="grid grid-cols-1 items-end gap-5 pt-1 md:grid-cols-3">
        {first && renderPodiumCard(first, 1, {
          badge: 'bg-gradient-to-r from-amber-400 to-gold-500 text-text shadow-gold-500/30',
          border: 'border-warning ring-2 ring-warning',
          shadow: 'shadow-lg shadow-gold-500/15 hover:shadow-xl hover:shadow-gold-500/25',
          icon: <Trophy className="h-3.5 w-3.5 text-text" />,
          rankTitle: 'Quán quân #1',
        })}

        {second && renderPodiumCard(second, 2, {
          badge: 'border border-border-strong bg-surface-3 text-text',
          border: 'border-border-strong',
          shadow: 'hover:shadow-plum-400/20',
          icon: <Medal className="h-3.5 w-3.5 text-text-muted" />,
          rankTitle: 'Hạng 2',
        })}

        {third && renderPodiumCard(third, 3, {
          badge: 'border border-warning-border bg-warning-soft text-warning',
          border: 'border-warning-border',
          shadow: 'hover:shadow-amber-500/20',
          icon: <Award className="h-3.5 w-3.5 text-warning" />,
          rankTitle: 'Hạng 3',
        })}
      </div>
    </div>
  )
}
