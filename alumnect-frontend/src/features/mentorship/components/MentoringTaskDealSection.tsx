import { Handshake, MessageSquare, Target, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { MentoringDealSummary } from '../model/mentoringTaskTypes'

interface MentoringTaskDealSectionProps {
  deal?: MentoringDealSummary | null
  conversationId?: number | null
}

export function MentoringTaskDealSection({
  deal,
  conversationId,
}: MentoringTaskDealSectionProps) {
  if (!deal) return null

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDeadline = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-plum-900/[0.06] pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
            <Handshake className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-plum-900 dark:text-white">
              Thỏa thuận Mentoring Deal gốc
            </h4>
            <span className="text-xs font-mono font-bold text-plum-400 dark:text-[#8f9399]">
              #DEAL-{deal.id} (Phiên bản v{deal.version})
            </span>
          </div>
        </div>

        {conversationId && (
          <Link
            to={`/app/mentoring/chats/${conversationId}`}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-50 px-3.5 py-2 text-xs font-bold text-brand-700 transition-colors hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Mở Chat for Task</span>
          </Link>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Phạm vi công việc đã chốt
          </span>
          <p className="mt-1 text-sm leading-relaxed text-plum-800 dark:text-[#e4e6eb]">
            {deal.taskScope}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-plum-400 dark:text-[#8f9399]">
            Kết quả kỳ vọng đầu ra (Expected Result)
          </span>
          <div className="mt-1 flex items-start gap-2 rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 text-sm text-plum-700 dark:border-white/10 dark:bg-[#18191a] dark:text-[#b0b3b8]">
            <Target className="h-4 w-4 shrink-0 text-brand-500 mt-0.5" />
            <p className="leading-relaxed">{deal.expectedResult}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
            <span className="text-[11px] font-bold text-plum-400 dark:text-[#8f9399]">Mức giá thỏa thuận</span>
            <p className="mt-1 text-sm font-black text-brand-700 dark:text-brand-300">
              {formatPrice(deal.agreedPrice)}
            </p>
          </div>
          <div className="rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
            <span className="text-[11px] font-bold text-plum-400 dark:text-[#8f9399]">Thời hạn Deal</span>
            <p className="mt-1 text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
              {formatDeadline(deal.deadline)}
            </p>
          </div>
          <div className="col-span-2 rounded-2xl border border-plum-900/[0.06] bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-[#18191a]">
            <span className="text-[11px] font-bold text-plum-400 dark:text-[#8f9399]">Trạng thái thanh toán</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-black text-mint-600 dark:text-mint-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-500" />
              <span>Đã thanh toán (PAID)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
