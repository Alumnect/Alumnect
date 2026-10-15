import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Card, Badge, Button } from '@/components/ui'
import type { PaymentStatus } from '../model/mentorPaymentTypes'

interface MentorPaymentFailedCardProps {
  status: PaymentStatus
  onRetry: () => void
  onBackToPackages: () => void
}

/**
 * Component hiển thị khi phiên thanh toán PayOS bị thất bại, hết hạn hoặc bị hủy (UC93).
 */
export function MentorPaymentFailedCard({
  status,
  onRetry,
  onBackToPackages,
}: MentorPaymentFailedCardProps) {
  const getStatusText = () => {
    switch (status) {
      case 'EXPIRED':
        return 'Phiên thanh toán đã hết hạn (quá 15 phút).'
      case 'CANCELLED':
        return 'Bạn đã hủy đơn thanh toán này.'
      case 'FAILED':
      default:
        return 'Giao dịch thanh toán không thành công.'
    }
  }

  return (
    <Card
      hover={false}
      className="mx-auto max-w-xl p-8 rounded-3xl border border-danger-border bg-surface text-center shadow-card space-y-6"
    >
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex">
          <Badge tone="danger">
            {status === 'EXPIRED' ? 'Đã Hết Hạn' : status === 'CANCELLED' ? 'Đã Hủy' : 'Thanh Toán Thất Bại'}
          </Badge>
        </div>
        <h2 className="font-display text-xl font-bold text-text">
          Không Thể Hoàn Tất Thanh Toán
        </h2>
        <p className="text-sm text-text-muted max-w-md mx-auto">
          {getStatusText()} Đừng lo lắng, gói dịch vụ Mentor của bạn chưa bị trừ tiền và bạn có thể tạo lại phiên thanh toán mới bất cứ lúc nào.
        </p>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Button
          variant="secondary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={onBackToPackages}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Chọn Gói Khác</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Thử Thanh Toán Lại</span>
        </Button>
      </div>
    </Card>
  )
}
