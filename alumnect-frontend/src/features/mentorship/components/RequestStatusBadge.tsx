import type { ReactNode } from 'react'
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MentoringRequestStatus, MentoringRequestType, MentoringResponseStatus } from '../model/mentoringRequestTypes'

interface RequestTypeBadgeProps {
  type?: MentoringRequestType
  className?: string
}

/**
 * Huy hiệu phân biệt loại yêu cầu Mentoring: Chung (GENERAL - UC100) hoặc Trực tiếp (DIRECT - UC101).
 */
export function RequestTypeBadge({ type = 'GENERAL', className }: RequestTypeBadgeProps) {
  if (type === 'DIRECT') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50/80 px-2.5 py-1 text-xs font-bold text-violet-700 shadow-2xs dark:border-violet-800/40 dark:bg-violet-950/40 dark:text-violet-300',
          className,
        )}
      >
        <Send className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
        Gửi trực tiếp
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/80 px-2.5 py-1 text-xs font-bold text-sky-700 shadow-2xs dark:border-sky-800/40 dark:bg-sky-950/40 dark:text-sky-300',
        className,
      )}
    >
      <Sparkles className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
      Yêu cầu chung
    </span>
  )
}

interface RequestStatusBadgeProps {
  status?: MentoringRequestStatus
  className?: string
}

/**
 * Huy hiệu hiển thị trạng thái tổng thể của yêu cầu: OPEN, MATCHED, CLOSED, CANCELLED.
 */
export function RequestStatusBadge({ status = 'OPEN', className }: RequestStatusBadgeProps) {
  const configs: Record<MentoringRequestStatus, { label: string; style: string }> = {
    OPEN: {
      label: 'Đang mở tiếp nhận',
      style: 'border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800/40 dark:bg-brand-950/40 dark:text-brand-300',
    },
    MATCHED: {
      label: 'Đã khớp Mentor',
      style: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
    CLOSED: {
      label: 'Đã hoàn thành',
      style: 'border-plum-200 bg-plum-50 text-plum-700 dark:border-[#393a3b] dark:bg-white/[0.05] dark:text-[#b0b3b8]',
    },
    CANCELLED: {
      label: 'Đã hủy',
      style: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300',
    },
  }

  const current = configs[status] ?? configs.OPEN

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold shadow-2xs',
        current.style,
        className,
      )}
    >
      {current.label}
    </span>
  )
}

interface MentorResponseStatusBadgeProps {
  status?: MentoringResponseStatus | string
  className?: string
  showIcon?: boolean
}

/**
 * Huy hiệu hiển thị trạng thái phản hồi của từng Mentor (UC102):
 * - WAITING: Chờ phản hồi (màu vàng kem ấm)
 * - ACCEPTED: Đã chấp nhận (màu xanh bạc hà)
 * - DECLINED: Đã từ chối (màu san hô nhạt)
 * - EXPIRED: Quá hạn (màu xám mực nhạt)
 */
export function MentorResponseStatusBadge({
  status = 'WAITING',
  className,
  showIcon = true,
}: MentorResponseStatusBadgeProps) {
  let label = 'Đang chờ phản hồi'
  let icon: ReactNode = <Clock className="h-3.5 w-3.5 text-amber-500" />
  let style = 'border-amber-200/80 bg-amber-50 text-amber-800 shadow-2xs dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300'

  if (status === 'ACCEPTED') {
    label = 'Đã đồng ý trao đổi'
    icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
    style = 'border-emerald-200/80 bg-emerald-50 text-emerald-800 shadow-2xs dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'
  } else if (status === 'DECLINED' || status === 'REJECTED') {
    label = 'Đã từ chối'
    icon = <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
    style = 'border-rose-200/80 bg-rose-50 text-rose-800 shadow-2xs dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-300'
  } else if (status === 'EXPIRED') {
    label = 'Đã quá hạn'
    icon = <AlertCircle className="h-3.5 w-3.5 text-plum-400 dark:text-[#8f9399]" />
    style = 'border-plum-200/80 bg-plum-50 text-plum-700 shadow-2xs dark:border-[#393a3b] dark:bg-white/[0.05] dark:text-[#b0b3b8]'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all',
        style,
        className,
      )}
    >
      {showIcon && icon}
      {label}
    </span>
  )
}
