import { CreditCard, ShieldCheck } from 'lucide-react'
import type { MentoringPaymentSummary } from '../model/mentoringTaskTypes'

interface MentoringTaskPaymentCardProps {
  payment?: MentoringPaymentSummary | null
  agreedPrice?: number
}

export function MentoringTaskPaymentCard({ payment, agreedPrice }: MentoringTaskPaymentCardProps) {
  if (!payment) return null

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="rounded-3xl border border-plum-900/[0.08] bg-white p-6 shadow-xs dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="flex items-center justify-between border-b border-plum-900/[0.06] pb-4 dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-100 text-mint-700 dark:bg-mint-500/20 dark:text-mint-300">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-plum-900 dark:text-white">
              Thông tin thanh toán Task
            </h4>
            <span className="text-xs font-mono font-bold text-plum-400 dark:text-[#8f9399]">
              Mã giao dịch #{payment.orderCode}
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 px-3 py-1 text-xs font-black text-mint-700 dark:bg-mint-950/40 dark:text-mint-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{payment.paymentStatus === 'PAID' ? 'ĐÃ THANH TOÁN (ESCROW)' : payment.paymentStatus}</span>
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl bg-plum-900/[0.02] p-3 dark:bg-white/[0.02]">
          <span className="font-bold text-plum-400 dark:text-[#8f9399]">Số tiền đã thanh toán</span>
          <p className="mt-1 text-sm font-black text-brand-700 dark:text-brand-300">
            {formatPrice(payment.amount ?? agreedPrice ?? 0)}
          </p>
        </div>

        <div className="rounded-xl bg-plum-900/[0.02] p-3 dark:bg-white/[0.02]">
          <span className="font-bold text-plum-400 dark:text-[#8f9399]">Cổng thanh toán</span>
          <p className="mt-1 text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
            VietQR / PayOS
          </p>
        </div>

        <div className="rounded-xl bg-plum-900/[0.02] p-3 dark:bg-white/[0.02]">
          <span className="font-bold text-plum-400 dark:text-[#8f9399]">Thời điểm thanh toán</span>
          <p className="mt-1 text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
            {formatDate(payment.paidAt)}
          </p>
        </div>

        <div className="rounded-xl bg-plum-900/[0.02] p-3 dark:bg-white/[0.02]">
          <span className="font-bold text-plum-400 dark:text-[#8f9399]">Mã tham chiếu PayOS</span>
          <p className="mt-1 font-mono text-sm font-bold text-plum-800 dark:text-[#e4e6eb]">
            #{payment.orderCode}
          </p>
        </div>
      </div>
    </div>
  )
}
