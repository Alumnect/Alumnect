import { CheckCircle2, Award, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import type { PaymentTransactionStatusResponse } from '../model/mentorPaymentTypes'

interface MentorPaymentSuccessCardProps {
  status: PaymentTransactionStatusResponse
  packageName?: string
  durationMonths?: number
}

/**
 * Component hiển thị thông báo thanh toán thành công và kích hoạt Mentor Subscription (UC93).
 */
export function MentorPaymentSuccessCard({
  status,
  packageName = 'Gói Cố Vấn Mentor',
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

  return (
    <Card
      hover={false}
      className="mx-auto max-w-xl p-8 rounded-3xl border border-mint-200 bg-white dark:bg-[#242526] text-center shadow-glow space-y-6"
    >
      {/* Icon chúc mừng */}
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-mint-100 dark:bg-mint-950/40 text-mint-600">
        <CheckCircle2 className="h-10 w-10" />
        <div className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-white shadow-sm">
          <Sparkles className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex">
          <Badge tone="success" className="px-3 py-1 font-bold text-xs">
            Thanh Toán Thành Công
          </Badge>
        </div>
        <h2 className="font-heading text-2xl font-extrabold text-plum-900 dark:text-[#e4e6eb]">
          Chúc Mừng Bạn Đã Trở Thành Mentor!
        </h2>
        <p className="text-sm text-plum-600 dark:text-[#b0b3b8] max-w-md mx-auto">
          Gói cố vấn của bạn đã được kích hoạt thành công qua cổng PayOS. Mạng lưới sinh viên FPT AlumNect đã sẵn sàng kết nối cùng bạn.
        </p>
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
          <div className="flex items-center gap-1.5 text-plum-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Ngày hết hạn mới</span>
          </div>
          <span className="font-bold text-brand-600 dark:text-brand-400">
            {formatDate(status.subscriptionEndDate)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1.5 text-plum-500">
            <Award className="h-3.5 w-3.5 text-gold-500" />
            <span>Trạng thái Mentor</span>
          </div>
          <Badge tone={status.mentorStatus === 'ACTIVE' ? 'success' : 'gold'}>
            {status.mentorStatus === 'ACTIVE' ? 'ACTIVE - ĐANG HOẠT ĐỘNG' : status.mentorStatus}
          </Badge>
        </div>
      </div>

      {/* Nút điều hướng */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          onClick={() => navigate('/app/mentoring/subscription')}
        >
          Xem Gói Đang Dùng
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => navigate('/app/mentoring')}
        >
          <span>Vào Bảng Tin Mentor</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
