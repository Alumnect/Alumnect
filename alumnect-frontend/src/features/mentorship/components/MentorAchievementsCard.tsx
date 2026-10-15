import { Flame, CheckCircle2, Star, Award, MessageSquare } from 'lucide-react'
import { Card } from '@/components/ui'
import type { MentorDetailData } from '../model/mentorDetailTypes'

interface MentorAchievementsCardProps {
  mentor: MentorDetailData
}

/**
 * Hiển thị thẻ Thống kê thành tích & Chỉ số uy tín của Mentor (UC99).
 * Đồng bộ cách tính và ý nghĩa với UC97 Mentor Ranking.
 */
export function MentorAchievementsCard({ mentor }: MentorAchievementsCardProps) {
  return (
    <Card
      hover={false}
      className="border border-border bg-surface p-6 text-left space-y-4"
    >
      <div className="flex items-center gap-2.5 border-b border-border pb-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <Award className="h-4 w-4" />
        </span>
        <h3 className="font-display text-base font-bold text-text">
          Chỉ số uy tín & Hoạt động
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Điểm uy tín */}
        <div className="rounded-2xl bg-warning-soft p-3.5 border border-warning-border text-left">
          <div className="flex items-center gap-1.5 text-warning">
            <Flame className="h-4 w-4 fill-warning text-warning" />
            <span className="text-xs font-bold uppercase tracking-wider">Uy tín</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-warning">
            {mentor.reputationScore}
          </p>
          <p className="mt-0.5 text-xs text-warning">
            Hệ thống xếp hạng
          </p>
        </div>

        {/* Nhiệm vụ hoàn thành */}
        <div className="rounded-2xl bg-success-soft p-3.5 border border-success-border text-left">
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-xs font-bold uppercase tracking-wider">Nhiệm vụ</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-success">
            {mentor.completedTasks}
          </p>
          <p className="mt-0.5 text-xs text-success">
            Phiên hoàn tất
          </p>
        </div>

        {/* Điểm đánh giá */}
        <div className="rounded-2xl bg-primary-soft p-3.5 border border-brand-200/50 text-left dark:border-brand-700/30">
          <div className="flex items-center gap-1.5 text-primary-solid">
            <Star className="h-4 w-4 fill-brand-400 text-primary-solid" />
            <span className="text-xs font-bold uppercase tracking-wider">Đánh giá</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-primary-solid">
            {mentor.rating > 0 ? Number(mentor.rating).toFixed(1) : '5.0'}
            <span className="text-xs font-normal text-brand-600/70">/5</span>
          </p>
          <p className="mt-0.5 text-xs text-brand-700/80 dark:text-brand-300/80">
            Chất lượng hỗ trợ
          </p>
        </div>

        {/* Lượt đánh giá */}
        <div className="rounded-2xl bg-cream-100/60 p-3.5 border border-border text-left dark:bg-white/[0.03] dark:border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-text-muted">
            <MessageSquare className="h-4 w-4 text-text-subtle" />
            <span className="text-xs font-bold uppercase tracking-wider">Phản hồi</span>
          </div>
          <p className="mt-1 text-2xl font-bold text-text">
            {mentor.reviewCount}
          </p>
          <p className="mt-0.5 text-xs text-text-subtle">
            Lượt học viên gửi
          </p>
        </div>
      </div>
    </Card>
  )
}
