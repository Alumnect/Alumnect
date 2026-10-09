import { Trophy, Sparkles, Award } from 'lucide-react'
import { Badge } from '@/components/ui/primitives'

interface MentorRankingHeaderProps {
  selectedFieldName?: string
  totalMentors?: number
}

/**
 * Header giao diện Bảng xếp hạng Mentor (UC97) theo phong cách Pastel Premium.
 */
export function MentorRankingHeader({ selectedFieldName, totalMentors }: MentorRankingHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-white/40 p-6 sm:p-8 border border-brand-500/20 shadow-xs dark:bg-[#242526] dark:border-[#393a3b] dark:from-brand-950/20">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl dark:bg-brand-500/5" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl dark:bg-gold-500/5" />

      <div className="relative z-10 max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="gold" icon={<Trophy className="h-3.5 w-3.5 text-gold-600" />}>
            Bảng Vinh Danh Mentor
          </Badge>
          {selectedFieldName && (
            <Badge tone="brand" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Lĩnh vực: {selectedFieldName}
            </Badge>
          )}
          {typeof totalMentors === 'number' && totalMentors > 0 && (
            <Badge tone="success" icon={<Award className="h-3.5 w-3.5" />}>
              {totalMentors} Cố vấn tích cực
            </Badge>
          )}
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-plum-900 dark:text-[#e4e6eb]">
          Bảng Xếp Hạng Cố Vấn FPT
        </h1>

        <p className="text-sm leading-relaxed text-plum-600 dark:text-[#b0b3b8]">
          Tôn vinh các cựu sinh viên tiêu biểu có đóng góp tích cực và uy tín hàng đầu trong mạng lưới Mentorship.
          Thứ hạng được đánh giá độc lập theo từng lĩnh vực chuyên môn dựa trên điểm uy tín, số buổi cố vấn hoàn thành và mức độ hài lòng của người học.
        </p>
      </div>
    </div>
  )
}
