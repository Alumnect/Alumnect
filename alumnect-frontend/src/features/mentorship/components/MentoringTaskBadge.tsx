import {
  Clock,
  CheckCircle2,
  PlayCircle,
  FileCheck2,
  XCircle,
} from 'lucide-react'
import type { MentoringTaskStatus } from '../model/mentoringTaskTypes'

interface MentoringTaskBadgeProps {
  status: MentoringTaskStatus
  className?: string
}

/**
 * Component hiển thị huy hiệu trạng thái của Mentoring Task (UC105 - UC108).
 */
export function MentoringTaskBadge({
  status,
  className = '',
}: MentoringTaskBadgeProps) {
  if (status === 'PREPARATION') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-500/30 ${className}`}
      >
        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span>Chuẩn bị (PREPARATION)</span>
      </span>
    )
  }

  if (status === 'IN_PROGRESS') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-500/30 ${className}`}
      >
        <PlayCircle className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
        <span>Đang thực hiện (IN PROGRESS)</span>
      </span>
    )
  }

  if (status === 'SUBMITTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-500/30 ${className}`}
      >
        <FileCheck2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        <span>Đã nộp kết quả</span>
      </span>
    )
  }

  if (status === 'COMPLETED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-xs font-black text-mint-700 ring-1 ring-mint-500/20 dark:bg-mint-950/40 dark:text-mint-300 dark:ring-mint-500/30 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-mint-600 dark:text-mint-400" />
        <span>Hoàn thành (COMPLETED)</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-300/40 dark:bg-white/5 dark:text-slate-400 dark:ring-white/10 ${className}`}
    >
      <XCircle className="h-3.5 w-3.5 text-slate-500" />
      <span>Đã hủy bỏ</span>
    </span>
  )
}
