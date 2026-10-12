import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react'
import type { MentoringDealStatus } from '../model/mentoringDealTypes'

interface MentoringDealBadgeProps {
  status: MentoringDealStatus
  isLocked?: boolean
  isPaid?: boolean
  className?: string
}

/**
 * Component hiển thị huy hiệu trạng thái Mentoring Deal với phong cách Pastel Premium (UC104 & UC105).
 */
export function MentoringDealBadge({
  status,
  isLocked,
  isPaid,
  className = '',
}: MentoringDealBadgeProps) {
  if (isPaid) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-xs font-black text-mint-700 ring-1 ring-mint-500/20 dark:bg-mint-950/40 dark:text-mint-300 dark:ring-mint-500/30 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-mint-600 dark:text-mint-400" />
        <span>Đã thanh toán • Task sẵn sàng</span>
      </span>
    )
  }

  if (status === 'DEAL_CONFIRMED' || isLocked) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/30 ${className}`}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Đã chốt • Chờ thanh toán</span>
      </span>
    )
  }

  if (status === 'STUDENT_CONFIRMED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-500/30 ${className}`}
      >
        <Clock className="h-3.5 w-3.5 text-brand-500" />
        <span>Học viên đã xác nhận • Chờ Mentor</span>
      </span>
    )
  }

  if (status === 'MENTOR_CONFIRMED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-500/30 ${className}`}
      >
        <Clock className="h-3.5 w-3.5 text-violet-500" />
        <span>Mentor đã xác nhận • Chờ Học viên</span>
      </span>
    )
  }

  if (status === 'CANCELLED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-300/40 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10 ${className}`}
      >
        <XCircle className="h-3.5 w-3.5 text-slate-500" />
        <span>Đã hủy bỏ</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30 ${className}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
      <span>Đang thương lượng điều khoản</span>
    </span>
  )
}
