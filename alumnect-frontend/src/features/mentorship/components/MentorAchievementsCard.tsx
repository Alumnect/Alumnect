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
      className="border border-plum-900/[0.08] bg-white p-6 text-left space-y-4 dark:bg-[#242526] dark:border-[#393a3b]"
    >
      <div className="flex items-center gap-2.5 border-b border-plum-900/[0.06] pb-3 dark:border-[#393a3b]">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-50 text-gold-600 dark:bg-gold-950/40 dark:text-gold-400">
          <Award className="h-4 w-4" />
        </span>
        <h3 className="font-heading text-base font-extrabold text-plum-900 dark:text-[#e4e6eb]">
          Chỉ số uy tín & Hoạt động
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Điểm uy tín */}
        <div className="rounded-2xl bg-gold-50/60 p-3.5 border border-gold-200/50 text-left dark:bg-gold-950/30 dark:border-gold-800/30">
          <div className="flex items-center gap-1.5 text-gold-700 dark:text-gold-300">
            <Flame className="h-4 w-4 fill-gold-500 text-gold-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Uy tín</span>
          </div>
          <p className="mt-1 text-2xl font-black text-gold-950 dark:text-gold-100">
            {mentor.reputationScore}
          </p>
          <p className="mt-0.5 text-[10px] text-gold-700/80 dark:text-gold-300/80">
            Hệ thống xếp hạng
          </p>
        </div>

        {/* Nhiệm vụ hoàn thành */}
        <div className="rounded-2xl bg-mint-50/60 p-3.5 border border-mint-200/50 text-left dark:bg-mint-950/30 dark:border-mint-800/30">
          <div className="flex items-center gap-1.5 text-mint-700 dark:text-mint-300">
            <CheckCircle2 className="h-4 w-4 text-mint-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Nhiệm vụ</span>
          </div>
          <p className="mt-1 text-2xl font-black text-mint-950 dark:text-mint-100">
            {mentor.completedTasks}
          </p>
          <p className="mt-0.5 text-[10px] text-mint-700/80 dark:text-mint-300/80">
            Phiên hoàn tất
          </p>
        </div>

        {/* Điểm đánh giá */}
        <div className="rounded-2xl bg-brand-50/60 p-3.5 border border-brand-200/50 text-left dark:bg-brand-950/30 dark:border-brand-800/30">
          <div className="flex items-center gap-1.5 text-brand-700 dark:text-brand-300">
            <Star className="h-4 w-4 fill-brand-400 text-brand-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Đánh giá</span>
          </div>
          <p className="mt-1 text-2xl font-black text-brand-950 dark:text-brand-100">
            {mentor.rating > 0 ? Number(mentor.rating).toFixed(1) : '5.0'}
            <span className="text-xs font-normal text-brand-600/70">/5</span>
          </p>
          <p className="mt-0.5 text-[10px] text-brand-700/80 dark:text-brand-300/80">
            Chất lượng hỗ trợ
          </p>
        </div>

        {/* Lượt đánh giá */}
        <div className="rounded-2xl bg-plum-50/60 p-3.5 border border-plum-900/[0.06] text-left dark:bg-white/[0.03] dark:border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-plum-600 dark:text-[#b0b3b8]">
            <MessageSquare className="h-4 w-4 text-plum-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Phản hồi</span>
          </div>
          <p className="mt-1 text-2xl font-black text-plum-900 dark:text-[#e4e6eb]">
            {mentor.reviewCount}
          </p>
          <p className="mt-0.5 text-[10px] text-plum-500 dark:text-[#8f9399]">
            Lượt học viên gửi
          </p>
        </div>
      </div>
    </Card>
  )
}
