import { CreditCard, Calendar, Clock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Card, Badge } from '@/components/ui/primitives'
import { ButtonLink } from '@/components/ui/Button'
import type { MentorStatusResponse } from '../model/mentorStatusTypes'

interface MentorSubscriptionSummaryCardProps {
  status: MentorStatusResponse
}

/**
 * Component thẻ tổng kết gói dịch vụ Mentor & Subscription (UC94).
 * Hiển thị chi tiết gói, thời gian hiệu lực, đếm ngược số ngày và thanh tiến độ.
 */
export function MentorSubscriptionSummaryCard({ status }: MentorSubscriptionSummaryCardProps) {
  const {
    hasSubscription,
    packageName,
    packageCode,
    priceAtPurchase,
    durationMonths,
    startDate,
    endDate,
    remainingDays,
    subscriptionStatus,
    pendingPaymentOrderCode,
    mentorStatus,
    active,
  } = status

  // Định dạng tiền tệ VND
  const formatCurrency = (val?: number | null) => {
    if (!val) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // Định dạng ngày tháng
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Chưa kích hoạt'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Tính phần trăm thời gian đã sử dụng
  const calculateProgressPercent = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = Date.now()

    if (now >= end) return 100
    if (now <= start) return 0

    const total = end - start
    const elapsed = now - start
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
  }

  if (!hasSubscription) {
    return (
      <Card hover={false} className="p-6 sm:p-8 border border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb]">
              Gói Duy Trì Dịch Vụ Mentor
            </h3>
            <p className="text-xs text-plum-500">Chưa ghi nhận bản ghi đăng ký gói nào trong hệ thống</p>
          </div>
        </div>

        <p className="text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
          Để trở thành Mentor chính thức và xuất hiện trên danh bạ cố vấn sinh viên FPTU, bạn cần lựa chọn một gói duy trì mạng lưới (1 tháng, 3 tháng hoặc 6 tháng).
        </p>

        <div className="pt-2">
          <ButtonLink
            to="/app/mentoring/packages"
            variant="primary"
            size="md"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Khám phá danh mục gói Mentor
          </ButtonLink>
        </div>
      </Card>
    )
  }

  const progress = calculateProgressPercent()
  const isExpired = mentorStatus === 'EXPIRED' || (remainingDays !== null && remainingDays !== undefined && remainingDays <= 0 && !active)
  const isPending = subscriptionStatus === 'PENDING_PAYMENT'

  return (
    <Card hover={false} className="p-6 sm:p-8 border border-plum-900/10 bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-plum-900/10 pb-5 dark:border-[#393a3b]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
                {packageName || 'Gói Dịch Vụ Mentor'}
              </h3>
              {active ? (
                <Badge tone="success" icon={<CheckCircle2 className="h-3 w-3" />} className="text-[10px]">
                  Active
                </Badge>
              ) : isPending ? (
                <Badge tone="gold" icon={<Clock className="h-3 w-3" />} className="text-[10px]">
                  Pending Payment
                </Badge>
              ) : isExpired ? (
                <Badge tone="danger" icon={<AlertCircle className="h-3 w-3" />} className="text-[10px]">
                  Expired
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-plum-500 dark:text-[#8a8d91] mt-0.5">
              Mã gói: <span className="font-semibold">{packageCode || 'N/A'}</span> • Thời hạn:{' '}
              <span className="font-semibold">{durationMonths || 1} tháng</span> • Chi phí:{' '}
              <span className="font-semibold">{formatCurrency(priceAtPurchase)}</span>
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="self-end sm:self-auto">
          {active ? (
            <ButtonLink
              to="/app/mentoring/packages"
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Xem các gói khác
            </ButtonLink>
          ) : isPending ? (
            <ButtonLink
              to="/app/mentoring/subscription?step=checkout"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              {pendingPaymentOrderCode ? 'Tiếp tục thanh toán VietQR' : 'Thanh toán ngay'}
            </ButtonLink>
          ) : (
            <ButtonLink
              to="/app/mentoring/packages"
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
            >
              Gia hạn gói mới
            </ButtonLink>
          )}
        </div>
      </div>

      {/* Thông tin ngày bắt đầu & hết hạn */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 dark:bg-[#18191a] dark:border-[#393a3b] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-plum-500">
            <Calendar className="h-3.5 w-3.5 text-brand-600" />
            <span>Ngày kích hoạt</span>
          </div>
          <p className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            {formatDate(startDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 dark:bg-[#18191a] dark:border-[#393a3b] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-plum-500">
            <Calendar className="h-3.5 w-3.5 text-coral-600" />
            <span>Ngày hết hạn</span>
          </div>
          <p className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            {formatDate(endDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-plum-900/10 bg-plum-900/[0.02] p-4 dark:bg-[#18191a] dark:border-[#393a3b] space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-plum-500">
            <Clock className="h-3.5 w-3.5 text-gold-600" />
            <span>Thời gian còn lại</span>
          </div>
          <p className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            {active && remainingDays !== null && remainingDays !== undefined
              ? `Còn ${remainingDays} ngày`
              : isExpired
              ? 'Đã hết hạn'
              : isPending
              ? 'Chờ thanh toán'
              : 'N/A'}
          </p>
        </div>
      </div>

      {/* Thanh tiến độ hiệu lực gói nếu đang ACTIVE */}
      {active && startDate && endDate && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-plum-500">
            <span>Tiến độ chu kỳ gói</span>
            <span className="font-semibold text-plum-700 dark:text-[#e4e6eb]">{progress}% thời gian</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-plum-900/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-violet-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Cảnh báo nhắc nhở gia hạn nếu hết hạn hoặc sắp hết hạn */}
      {isExpired && (
        <div className="rounded-2xl border border-coral-200/80 bg-coral-50/70 p-4 text-xs text-coral-800 dark:bg-coral-950/40 dark:border-coral-800/60 dark:text-coral-300 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-coral-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Gói dịch vụ đã hết hạn!</p>
            <p className="leading-relaxed">
              Tài khoản Mentor của bạn tạm thời chuyển sang trạng thái EXPIRED và không thể tiếp nhận yêu cầu hướng dẫn mới. Hãy gia hạn gói để tiếp tục đồng hành cùng sinh viên. Lịch sử cố vấn trước đây vẫn được lưu trữ bảo toàn.
            </p>
          </div>
        </div>
      )}

      {isPending && (
        <div className="rounded-2xl border border-gold-200/80 bg-gold-50/70 p-4 text-xs text-gold-800 dark:bg-gold-950/40 dark:border-gold-800/60 dark:text-gold-300 flex items-start gap-3">
          <Clock className="h-5 w-5 shrink-0 text-gold-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Đang chờ xác nhận thanh toán PayOS</p>
            <p className="leading-relaxed">
              Bạn đã chọn gói nhưng chưa hoàn tất chuyển khoản. Ngay sau khi PayOS ghi nhận thanh toán thành công, hệ thống sẽ kích hoạt trạng thái Mentor ACTIVE ngay lập tức.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
