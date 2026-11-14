import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { Flame, CheckCircle2, Star, Award, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorAchievementsCardProps {
  mentor: MentorDetailData
}

function Metric({ icon, label, value, iconClass }: { icon: ReactNode; label: string; value: ReactNode; iconClass: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2/50 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-text-subtle">
        <span className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', iconClass)}>{icon}</span>
        {label}
      </p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-text">{value}</p>
    </div>
  )
}

/**
 * Thẻ chỉ số uy tín & hoạt động của Mentor (UC99), đồng bộ cách tính với UC97 Mentor Ranking.
 * Chỉ hiển thị số thật: chưa có điểm đánh giá thì hiện "—" (cùng điều kiện với MentorCard).
 */
export function MentorAchievementsCard({ mentor }: MentorAchievementsCardProps) {
  const { t } = useTranslation()
  const hasRating = mentor.rating > 0
  return (
    <Card hover={false} className="border border-border bg-surface p-6 text-left space-y-4">
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <Award className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold text-text">{t('mentoring.reputationAndActivityTitle')}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric icon={<Flame />} iconClass="text-warning" label={t('mentoring.reputationLabel')} value={mentor.reputationScore} />
        <Metric icon={<CheckCircle2 />} iconClass="text-success" label={t('mentoring.taskMetricsLabel')} value={mentor.completedTasks} />
        <Metric
          icon={<Star />}
          iconClass="text-primary-solid"
          label={t('mentoring.reviewMetricsLabel')}
          value={hasRating ? (
            <>
              {Number(mentor.rating).toFixed(1)}
              <span className="text-xs font-normal text-text-subtle">/5</span>
            </>
          ) : '—'}
        />
        <Metric icon={<MessageSquare />} iconClass="text-info" label={t('mentoring.responseMetricsLabel')} value={mentor.reviewCount} />
      </div>
    </Card>
  )
}
