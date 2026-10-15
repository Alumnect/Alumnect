import { CheckCircle2 } from 'lucide-react'
import type { MentoringPaymentSummary } from '../model/mentoringTaskTypes'

interface MentoringTaskPaymentCardProps {
  payment?: MentoringPaymentSummary | null
}

function formatPaidAt(dateStr?: string | null) {
  if (!dateStr) return null

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null

  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  const day = date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return `${time} · ${day}`
}

export function MentoringTaskPaymentCard({ payment }: MentoringTaskPaymentCardProps) {
  if (!payment) return null

  const paidAt = formatPaidAt(payment.paidAt)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-mint-200 bg-mint-50/70 px-4 py-3 dark:border-mint-500/20 dark:bg-mint-950/20">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mint-100 text-mint-700 dark:bg-mint-500/20 dark:text-mint-300">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-mint-800 dark:text-mint-200">Đã thanh toán</p>
        {paidAt && (
          <p className="mt-0.5 text-xs font-medium text-plum-500 dark:text-[#b0b3b8]">
            {paidAt}
          </p>
        )}
      </div>
    </div>
  )
}
