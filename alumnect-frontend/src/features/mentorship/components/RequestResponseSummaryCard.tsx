import { CheckCircle2, Clock, Users, XCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MentorResponseStatusBadge } from './RequestStatusBadge'
import type { MentoringRequestType, MentoringResponseSummary } from '../model/mentoringRequestTypes'

interface RequestResponseSummaryCardProps {
  requestType?: MentoringRequestType
  summary?: MentoringResponseSummary
  targetMentorName?: string | null
  directMentorStatus?: string | null
  className?: string
}

const CARD = 'rounded-2xl border border-plum-900/[0.08] bg-white p-5 shadow-xs dark:border-white/10 dark:bg-[#242526]'

function Stat({ icon, label, value, className }: { icon: ReactNode; label: string; value: number; className: string }) {
  return (
    <div className="rounded-xl bg-cream-100 px-3 py-2.5 dark:bg-white/[0.04]">
      <p className={cn('flex items-center gap-1 text-xs font-medium [&>svg]:h-3.5 [&>svg]:w-3.5', className)}>
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg font-bold text-plum-900 dark:text-white">{value}</p>
    </div>
  )
}

/** Tổng quan phản hồi của Mentor cho một yêu cầu (UC102). */
export function RequestResponseSummaryCard({
  requestType = 'GENERAL',
  summary,
  targetMentorName,
  directMentorStatus = 'WAITING',
  className,
}: RequestResponseSummaryCardProps) {
  if (requestType === 'DIRECT') {
    const hint =
      directMentorStatus === 'ACCEPTED'
        ? 'Mentor đã đồng ý. Mở tin nhắn để trao đổi chi tiết.'
        : directMentorStatus === 'DECLINED'
          ? 'Mentor chưa sắp xếp được. Bạn có thể gửi yêu cầu cho Mentor khác.'
          : 'Mentor đang xem xét. Bạn sẽ nhận thông báo khi có phản hồi.'
    return (
      <section className={cn(CARD, className)}>
        <h2 className="font-display text-base font-bold text-plum-900 dark:text-white">Phản hồi của Mentor</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-plum-800 dark:text-[#e4e6eb]">{targetMentorName || 'Mentor đã chọn'}</span>
          <MentorResponseStatusBadge status={directMentorStatus || 'WAITING'} />
        </div>
        <p className="mt-2 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">{hint}</p>
      </section>
    )
  }

  const total = summary?.totalDistributed ?? 0
  const accepted = summary?.acceptedCount ?? 0
  const waiting = summary?.waitingCount ?? 0
  const declined = summary?.declinedCount ?? 0
  const pct = (n: number) => (total > 0 ? `${(n / total) * 100}%` : '0%')

  return (
    <section className={cn(CARD, className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-base font-bold text-plum-900 dark:text-white">Phản hồi của Mentor</h2>
        <span className="inline-flex items-center gap-1 text-xs text-plum-500 dark:text-[#b0b3b8]">
          <Users className="h-3.5 w-3.5" />
          {total} Mentor nhận
        </span>
      </div>

      {total > 0 && (
        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-cream-200 dark:bg-white/10">
          <div className="bg-mint-500" style={{ width: pct(accepted) }} />
          <div className="bg-gold-400" style={{ width: pct(waiting) }} />
          <div className="bg-coral-400" style={{ width: pct(declined) }} />
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat icon={<CheckCircle2 />} label="Đồng ý" value={accepted} className="text-mint-700 dark:text-mint-300" />
        <Stat icon={<Clock />} label="Đang chờ" value={waiting} className="text-gold-700 dark:text-gold-300" />
        <Stat icon={<XCircle />} label="Từ chối" value={declined} className="text-coral-700 dark:text-coral-300" />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">
        {accepted > 0
          ? `${accepted} Mentor đã đồng ý trao đổi. Bấm "Nhắn tin" ở phản hồi của Mentor để bắt đầu.`
          : total === 0
            ? 'Hệ thống đang tìm Mentor phù hợp với yêu cầu này.'
            : `Đang chờ ${waiting} Mentor phản hồi.`}
      </p>
    </section>
  )
}
