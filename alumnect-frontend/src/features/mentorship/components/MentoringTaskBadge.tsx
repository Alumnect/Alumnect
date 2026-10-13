import {
  Clock,
  CheckCircle2,
  PlayCircle,
  FileCheck2,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import type { MentoringTaskStatus, MentoringTaskUIStage } from '../model/mentoringTaskTypes'

interface MentoringTaskBadgeProps {
  status: MentoringTaskStatus
  className?: string
}

/**
 * Component hiển thị huy hiệu trạng thái chi tiết của Mentoring Task (UC105 - UC108).
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
        <span>Chuẩn bị</span>
      </span>
    )
  }

  if (status === 'IN_PROGRESS') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-500/20 dark:bg-brand-950/40 dark:text-brand-300 dark:ring-brand-500/30 ${className}`}
      >
        <PlayCircle className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
        <span>Đang thực hiện</span>
      </span>
    )
  }

  if (status === 'SUBMITTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-950/40 dark:text-violet-300 dark:ring-violet-500/30 ${className}`}
      >
        <FileCheck2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        <span>Chờ nghiệm thu</span>
      </span>
    )
  }

  if (status === 'COMPLETED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-mint-50 px-3 py-1 text-xs font-black text-mint-700 ring-1 ring-mint-500/20 dark:bg-mint-950/40 dark:text-mint-300 dark:ring-mint-500/30 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-mint-600 dark:text-mint-400" />
        <span>Hoàn thành</span>
      </span>
    )
  }

  if (status === 'DISPUTED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1 text-xs font-black text-coral-700 ring-1 ring-coral-500/20 dark:bg-coral-950/40 dark:text-coral-300 dark:ring-coral-500/30 ${className}`}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-coral-600 dark:text-coral-400" />
        <span>Đang tranh chấp</span>
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

/**
 * Component hiển thị huy hiệu giai đoạn cấp cao UI (PREPARATION, IN_PROGRESS, ENDING).
 */
export function MentoringTaskStageBadge({
  stage,
  className = '',
}: {
  stage: MentoringTaskUIStage
  className?: string
}) {
  if (stage === 'PREPARATION') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100/70 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-amber-800 ring-1 ring-amber-400/40 ${className}`}
      >
        Giai đoạn 1: Chuẩn bị
      </span>
    )
  }

  if (stage === 'IN_PROGRESS') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-brand-100/70 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-brand-800 ring-1 ring-brand-400/40 ${className}`}
      >
        Giai đoạn 2: Đang thực hiện
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-violet-100/70 px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wider text-violet-800 ring-1 ring-violet-400/40 ${className}`}
    >
      Giai đoạn 3: Kết thúc
    </span>
  )
}
