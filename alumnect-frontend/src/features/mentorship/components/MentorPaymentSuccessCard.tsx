import { CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import type { PaymentTransactionStatusResponse } from '../model/mentorPaymentTypes'

interface MentorPaymentSuccessCardProps {
  status: PaymentTransactionStatusResponse
  packageName?: string
  durationMonths?: number
}

/**
 * Component hiển thị thông báo thanh toán thành công và kích hoạt gói Cố vấn (UC93).
 */
export function MentorPaymentSuccessCard({
  status,
  packageName = 'Gói dịch vụ Mentor',
  durationMonths = 1,
}: MentorPaymentSuccessCardProps) {
  const navigate = useNavigate()

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getStatusText = (mentorStatus?: string) => {
    if (!mentorStatus || mentorStatus === 'ACTIVE') return 'Đang hoạt động'
    if (mentorStatus === 'PAYMENT_PENDING' || mentorStatus === 'PENDING_PAYMENT') return 'Chờ thanh toán'
    if (mentorStatus === 'PENDING') return 'Chờ duyệt'
    if (mentorStatus === 'INACTIVE') return 'Tạm ngưng'
    return mentorStatus
  }

  return (
    <Card
      hover={false}
      className="mx-auto max-w-xl p-8 rounded-3xl border border-mint-200 bg-white dark:bg-[#242526] text-center shadow-glow space-y-6"
    >
      {/* Icon chúc mừng tinh gọn */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-9 w-9" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex">
          <Badge tone="success" className="px-3 py-1 font-bold text-xs">
            Thanh toán thành công
          </Badge>
        </div>
        <h2 className="font-heading text-2xl font-extrabold text-plum-900 dark:text-[#e4e6eb]">
          Chúc Mừng Bạn Đã Trở Thành Mentor!
        </h2>
      </div>

      {/* Thông tin gói và hiệu lực mới */}
      <div className="rounded-2xl bg-cream-50 dark:bg-[#18191a] p-5 text-left border border-plum-900/5 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-plum-900/5 pb-2.5">
          <span className="text-plum-500">Gói dịch vụ kích hoạt</span>
          <span className="font-bold text-plum-900 dark:text-[#e4e6eb]">{packageName}</span>
        </div>

        <div className="flex items-center justify-between text-xs border-b border-plum-900/5 pb-2.5">
          <span className="text-plum-500">Thời hạn sử dụng</span>
          <span className="font-semibold text-plum-900 dark:text-[#e4e6eb]">{durationMonths} tháng</span>
        </div>

        <div className="flex items-center justify-between text-xs border-b border-plum-900/5 pb-2.5">
          <span className="text-plum-500">Ngày hết hạn</span>
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {formatDate(status.subscriptionEndDate)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-plum-500">Trạng thái Mentor</span>
          <Badge tone={status.mentorStatus === 'ACTIVE' || !status.mentorStatus ? 'success' : 'gold'}>
            {getStatusText(status.mentorStatus)}
          </Badge>
        </div>
      </div>

      {/* Nút điều hướng */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1 cursor-pointer"
          onClick={() => navigate('/app/mentoring/subscription')}
        >
          Xem gói dịch vụ
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
          onClick={() => navigate('/app/mentoring')}
        >
          <span>Vào bảng tin Mentor</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
