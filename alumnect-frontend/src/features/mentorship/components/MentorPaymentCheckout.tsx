import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, Check, AlertCircle } from 'lucide-react'
import { Card, Button, Skeleton } from '@/components/ui'
import { vnd } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import {
  useMentorCheckoutSession,
  useMentorPaymentStatus,
  useCancelMentorPayment,
} from '../hooks/useMentorPayment'
import { useMyMentorSubscription, MENTOR_SUBSCRIPTION_KEYS } from '../hooks/useMentorSubscription'
import { MentorPaymentQrCard } from './MentorPaymentQrCard'
import { MentorPaymentSuccessCard } from './MentorPaymentSuccessCard'
import { MentorPaymentFailedCard } from './MentorPaymentFailedCard'

interface MentorPaymentCheckoutProps {
  initialPackageId?: number
  onBack?: () => void
}

/**
 * Component trung tâm xử lý quy trình thanh toán gói Mentor qua cổng PayOS (UC93).
 * Tích hợp tự động khởi tạo đơn, hiển thị VietQR, polling thời gian thực và chuyển đổi màn hình kết quả.
 */
export function MentorPaymentCheckout({ initialPackageId, onBack }: MentorPaymentCheckoutProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const packageIdParam = searchParams.get('packageId')
  const targetPackageId = initialPackageId || (packageIdParam ? Number(packageIdParam) : undefined)
  const orderCodeFromParam = searchParams.get('orderCode') ? Number(searchParams.get('orderCode')) : undefined

  const [isCancelled, setIsCancelled] = useState(false)
  const queryClient = useQueryClient()
  const { data: mySubscription } = useMyMentorSubscription()

  const shouldFetchCheckout =
    !isCancelled &&
    mySubscription?.status !== 'ACTIVE' &&
    mySubscription?.status !== 'PAID' &&
    !orderCodeFromParam

  // Khởi tạo phiên thanh toán tự động qua useQuery - Reactive 100%, render ngay lập tức khi Backend phản hồi
  const {
    data: checkoutData,
    isLoading: isLoadingCheckout,
    isError: isCheckoutError,
    error: checkoutError,
    refetch: retryCheckout,
  } = useMentorCheckoutSession(targetPackageId, shouldFetchCheckout)

  const cancelMutation = useCancelMentorPayment()
  const effectiveOrderCode = checkoutData?.orderCode || orderCodeFromParam

  // Polling trạng thái thanh toán từ Backend (tự dừng khi đạt terminal state)
  const { data: paymentStatus, isLoading: isCheckingStatus } = useMentorPaymentStatus(
    effectiveOrderCode,
    Boolean(effectiveOrderCode) && !isCancelled
  )

  const handleRetryPayment = () => {
    setIsCancelled(false)
    retryCheckout()
  }

  const handleCancelPayment = async () => {
    try {
      setIsCancelled(true)
      if (effectiveOrderCode) {
        await cancelMutation.mutateAsync(effectiveOrderCode)
      }
    } catch (err) {
      console.warn('Lỗi khi hủy giao dịch thanh toán PayOS:', err)
    } finally {
      if (onBack) {
        onBack()
      } else {
        navigate('/app/mentoring/subscription')
      }
      queryClient.invalidateQueries({ queryKey: ['mentor-status'] })
      queryClient.invalidateQueries({ queryKey: ['mentor-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: MENTOR_SUBSCRIPTION_KEYS.mySubscription })
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
          paymentExpiresAt: mySubscription.endDate || '',
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
  if (isLoadingCheckout || (!checkoutData && !isCheckoutError)) {
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
  if (isCheckoutError) {
    return (
      <Card hover={false} className="mx-auto max-w-lg p-8 rounded-3xl border border-danger-border bg-danger-soft text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-danger">
          {t('mentoring.cannotCreatePayOsSession')}
        </h3>
        <p className="text-xs text-danger">
          {checkoutError?.message || t('mentoring.payOsConnectErrorDefault')}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button variant="secondary" size="sm" onClick={() => (onBack ? onBack() : navigate('/app/mentoring/subscription'))}>
            {t('mentoring.backToSelectPackage')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleRetryPayment}>
            {t('mentoring.retry')}
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
          <h2 className="font-display text-xl font-bold text-text">
            {t('mentoring.paymentDetailsTitle')}
          </h2>
          <p className="text-xs text-text-subtle mt-1">
            {t('mentoring.paymentDetailsSubtitle')}
          </p>
        </div>

        {/* Thẻ gói dịch vụ tóm tắt */}
        <Card hover={false} className="p-6 rounded-3xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-solid">
                {t('mentoring.selectedPackageLabel')}
              </span>
              <h3 className="font-display text-lg font-bold text-text mt-0.5">
                {checkoutData?.packageName}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-solid border border-primary-soft-border shadow-2xs">
              <Clock className="h-3.5 w-3.5 text-primary-solid" />
              {t('mentoring.monthUnit', { months: checkoutData?.durationMonths || mySubscription?.durationMonths || 1 })}
            </span>
          </div>

          <div className="pt-2 border-t border-border">
            <span className="text-xs text-text-subtle">{t('mentoring.totalPaymentLabel')}</span>
            <div className="text-2xl font-bold text-text">
              {vnd(checkoutData?.amount || 0)}
            </div>
          </div>

          {/* Quyền lợi nổi bật */}
          <div className="space-y-2 pt-2 border-t border-border text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>{t('mentoring.benefitImmediateActivation')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>{t('mentoring.benefitPreserveRemainingTime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success shrink-0" />
              <span>{t('mentoring.benefitAppearOnMap')}</span>
            </div>
          </div>

          {/* Nút hủy giao dịch */}
          <div className="pt-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs text-text-subtle hover:text-danger"
              onClick={handleCancelPayment}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('mentoring.cancelling') : t('mentoring.cancelAndSelectOther')}
            </Button>
          </div>
        </Card>

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
