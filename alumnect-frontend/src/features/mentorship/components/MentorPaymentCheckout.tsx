import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Shield, Sparkles, Check, AlertCircle } from 'lucide-react'
import { Card, Button, Skeleton, Badge } from '@/components/ui'
import { vnd } from '@/lib/utils'
import { useCreateMentorPayment, useMentorPaymentStatus, useCancelMentorPayment } from '../hooks/useMentorPayment'
import { useMyMentorSubscription } from '../hooks/useMentorSubscription'
import { MentorPaymentQrCard } from './MentorPaymentQrCard'
import { MentorPaymentSuccessCard } from './MentorPaymentSuccessCard'
import { MentorPaymentFailedCard } from './MentorPaymentFailedCard'
import type { MentorPaymentCheckoutResponse } from '../model/mentorPaymentTypes'

interface MentorPaymentCheckoutProps {
  initialPackageId?: number
  onBack?: () => void
}

/**
 * Component trung tâm xử lý quy trình thanh toán gói Mentor qua cổng PayOS (UC93).
 * Tích hợp tự động khởi tạo đơn, hiển thị VietQR, polling thời gian thực và chuyển đổi màn hình kết quả.
 */
export function MentorPaymentCheckout({ initialPackageId, onBack }: MentorPaymentCheckoutProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const packageIdParam = searchParams.get('packageId')
  const targetPackageId = initialPackageId || (packageIdParam ? Number(packageIdParam) : undefined)

  const [checkoutData, setCheckoutData] = useState<MentorPaymentCheckoutResponse | null>(null)

  const { data: mySubscription } = useMyMentorSubscription()
  const createMutation = useCreateMentorPayment()
  const cancelMutation = useCancelMentorPayment()
  const orderCodeFromParam = searchParams.get('orderCode') ? Number(searchParams.get('orderCode')) : undefined
  const effectiveOrderCode = checkoutData?.orderCode || orderCodeFromParam

  // Polling trạng thái thanh toán từ Backend (tự dừng khi đạt terminal state)
  const { data: paymentStatus, isLoading: isCheckingStatus } = useMentorPaymentStatus(
    effectiveOrderCode,
    Boolean(effectiveOrderCode)
  )

  // Khởi tạo phiên thanh toán PayOS khi màn hình mount (bỏ qua nếu đã có active subscription hoặc có orderCode từ PayOS redirect)
  useEffect(() => {
    if (mySubscription?.status === 'ACTIVE' || mySubscription?.status === 'PAID') return
    if (orderCodeFromParam) return

    if (!checkoutData && !createMutation.isPending && !createMutation.isError) {
      createMutation.mutate(
        targetPackageId ? { packageId: targetPackageId } : undefined,
        {
          onSuccess: (data) => {
            setCheckoutData(data)
          },
        }
      )
    }
  }, [targetPackageId, mySubscription?.status, orderCodeFromParam])

  const handleRetryPayment = () => {
    setCheckoutData(null)
    createMutation.mutate(
      targetPackageId ? { packageId: targetPackageId } : undefined,
      {
        onSuccess: (data) => {
          setCheckoutData(data)
        },
      }
    )
  }

  const handleCancelPayment = async () => {
    if (checkoutData?.orderCode) {
      await cancelMutation.mutateAsync(checkoutData.orderCode)
    }
    if (onBack) {
      onBack()
    } else {
      navigate('/app/mentoring/subscription')
    }
  }

  // 1. Trạng thái Thanh toán Thành công (PAID hoặc đã ACTIVE)
  if (paymentStatus?.paymentStatus === 'PAID') {
    return (
      <MentorPaymentSuccessCard
        status={paymentStatus}
        packageName={checkoutData?.packageName || mySubscription?.packageName}
        durationMonths={checkoutData?.durationMonths || mySubscription?.durationMonths}
      />
    )
  }

  if (mySubscription?.status === 'ACTIVE' || mySubscription?.status === 'PAID') {
    return (
      <MentorPaymentSuccessCard
        status={{
          transactionId: 0,
          orderCode: 0,
          amount: mySubscription.priceAtPurchase,
          paymentStatus: 'PAID',
          subscriptionStatus: 'ACTIVE',
          mentorStatus: 'ACTIVE',
          subscriptionStartDate: mySubscription.startDate,
          subscriptionEndDate: mySubscription.endDate,
          isTerminal: true,
        }}
        packageName={mySubscription.packageName}
        durationMonths={mySubscription.durationMonths}
      />
    )
  }

  // 2. Trạng thái Đang tạo phiên thanh toán PayOS
  if (createMutation.isPending || (!checkoutData && !createMutation.isError)) {
    return (
      <div className="grid gap-8 lg:grid-cols-12 max-w-5xl mx-auto py-6">
        <div className="lg:col-span-5 space-y-4">
          <Skeleton className="h-8 w-3/4 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <div className="lg:col-span-7">
          <Skeleton className="h-96 w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  // 3. Trạng thái Lỗi khi tạo đơn PayOS
  if (createMutation.isError) {
    return (
      <Card hover={false} className="mx-auto max-w-lg p-8 rounded-3xl border border-rose-200 bg-rose-50/50 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-heading text-lg font-bold text-rose-900">
          Không thể tạo phiên thanh toán PayOS
        </h3>
        <p className="text-xs text-rose-700">
          {createMutation.error?.message || 'Đã xảy ra lỗi khi kết nối với cổng thanh toán PayOS.'}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => (onBack ? onBack() : navigate('/app/mentoring/subscription'))}>
            Quay lại chọn gói
          </Button>
          <Button variant="primary" size="sm" onClick={handleRetryPayment}>
            Thử lại
          </Button>
        </div>
      </Card>
    )
  }

  // 4. Trạng thái Thất bại / Hết hạn / Đã hủy
  if (
    paymentStatus?.paymentStatus === 'FAILED' ||
    paymentStatus?.paymentStatus === 'EXPIRED' ||
    paymentStatus?.paymentStatus === 'CANCELLED'
  ) {
    return (
      <MentorPaymentFailedCard
        status={paymentStatus.paymentStatus}
        onRetry={handleRetryPayment}
        onBackToPackages={() => (onBack ? onBack() : navigate('/app/mentoring/subscription'))}
      />
    )
  }

  // 5. Trạng thái Chờ thanh toán (PENDING) - Giao diện 2 cột chuẩn Pastel Premium
  return (
    <div className="grid gap-8 lg:grid-cols-12 max-w-5xl mx-auto py-2">
      {/* Cột trái: Tóm tắt thông tin gói và quyền lợi */}
      <div className="lg:col-span-5 space-y-5">
        <div>
          <button
            onClick={() => (onBack ? onBack() : navigate('/app/mentoring/subscription'))}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-500 hover:text-plum-900 transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại danh sách gói</span>
          </button>
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Chi Tiết Thanh Toán
          </h2>
          <p className="text-xs text-plum-500 mt-1">
            Xác nhận thông tin gói cố vấn trước khi quét mã chuyển khoản.
          </p>
        </div>

        {/* Thẻ gói dịch vụ tóm tắt */}
        <Card hover={false} className="p-6 rounded-3xl border border-plum-900/10 bg-white dark:bg-[#242526] shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Gói đã chọn
              </span>
              <h3 className="font-heading text-lg font-bold text-plum-900 dark:text-[#e4e6eb] mt-0.5">
                {checkoutData?.packageName}
              </h3>
            </div>
            <Badge tone="brand" icon={<Sparkles className="h-3 w-3" />}>
              {checkoutData?.durationMonths} Tháng
            </Badge>
          </div>

          <div className="pt-2 border-t border-plum-900/5">
            <span className="text-xs text-plum-400">Tổng thanh toán:</span>
            <div className="text-2xl font-extrabold text-plum-900 dark:text-[#e4e6eb]">
              {vnd(checkoutData?.amount || 0)}
            </div>
          </div>

          {/* Quyền lợi nổi bật */}
          <div className="space-y-2 pt-2 border-t border-plum-900/5 text-xs text-plum-600 dark:text-[#b0b3b8]">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-mint-600 shrink-0" />
              <span>Kích hoạt ngay lập tức sau khi chuyển khoản thành công</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-mint-600 shrink-0" />
              <span>Bảo toàn 100% thời gian còn lại nếu bạn đang mua gia hạn</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-mint-600 shrink-0" />
              <span>Xuất hiện trên bản đồ và danh sách Mentor kết nối sinh viên</span>
            </div>
          </div>

          {/* Nút hủy giao dịch */}
          <div className="pt-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs text-plum-500 hover:text-coral-600"
              onClick={handleCancelPayment}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Đang hủy...' : 'Hủy đơn & Chọn gói khác'}
            </Button>
          </div>
        </Card>

        {/* Cam kết minh bạch */}
        <div className="rounded-2xl border border-plum-900/5 bg-cream-50/50 dark:bg-[#18191a] p-4 text-xs text-plum-500 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-plum-700 dark:text-[#e4e6eb]">
            <Shield className="h-3.5 w-3.5 text-brand-600" />
            <span>Đối soát giao dịch tự động 24/7</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Hệ thống AlumNect xác thực giao dịch qua Webhook bảo mật PayOS trong vòng 3-10 giây sau khi ngân hàng nhận tiền.
          </p>
        </div>
      </div>

      {/* Cột phải: Thẻ VietQR PayOS & Quét mã */}
      <div className="lg:col-span-7">
        {checkoutData && (
          <MentorPaymentQrCard
            checkout={checkoutData}
            isPolling={isCheckingStatus || !paymentStatus?.isTerminal}
          />
        )}
      </div>
    </div>
  )
}
