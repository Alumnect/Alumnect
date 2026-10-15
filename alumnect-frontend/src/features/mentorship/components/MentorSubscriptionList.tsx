import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, AlertCircle, ArrowRight } from 'lucide-react'
import { Card, Skeleton, Badge, Button } from '@/components/ui'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { vnd } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import {
  useMentorPackages,
  useMyMentorSubscription,
  useSelectMentorPackage,
} from '../hooks/useMentorSubscription'
import { MentorSubscriptionCard } from './MentorSubscriptionCard'
import { MentorPageHeader } from './MentorPageHeader'

/**
 * Component hiển thị danh sách gói Mentor và quản lý thao tác lựa chọn gói (UC92).
 * Tích hợp chuẩn Premium Pastel UI:
 * - VIP Banner hiển thị chi tiết trạng thái gói đã kích hoạt của Mentor.
 * - Danh sách gói đồng bộ căn chỉnh 100% về kích thước, chiều cao và nhãn.
 * - Cơ chế bảo vệ và hướng dẫn người dùng trực quan khi đã có gói hiệu lực.
 */
export function MentorSubscriptionList() {
  const navigate = useNavigate()
  const { data: packages, isLoading: isLoadingPackages, isError: isErrorPackages, error: errorPackages } = useMentorPackages()
  const { data: mySubscription, isLoading: isLoadingSub } = useMyMentorSubscription()
  const selectMutation = useSelectMentorPackage()
  const [renderedAt] = useState(() => Date.now())

  const isCurrentlyActive =
    (mySubscription?.status === 'ACTIVE' || mySubscription?.status === 'PAID') &&
    (!mySubscription.endDate || new Date(mySubscription.endDate).getTime() > renderedAt)

  const handleSelectPackage = async (packageId: number) => {
    if (isCurrentlyActive) {
      toast.info('Bạn đang có gói Mentor còn hiệu lực. Vui lòng sử dụng hết gói hiện tại trước khi đăng ký hoặc gia hạn gói mới.')
      return
    }
    try {
      const result = await selectMutation.mutateAsync({ packageId })
      // Sau khi chọn gói thành công, điều hướng sang màn hình thanh toán UC93
      if (result) {
        navigate(`/app/mentoring/subscription?step=checkout&packageId=${packageId}`)
      }
    } catch {
      // Lỗi đã được xử lý tự động bởi hook
    }
  }

  const formatExpiry = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (isLoadingPackages || isLoadingSub) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} hover={false} className="p-7 space-y-4 rounded-3xl">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-10 w-1/2 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </Card>
        ))}
      </div>
    )
  }

  if (isErrorPackages) {
    return (
      <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-danger-border bg-danger-soft">
        <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
        <h3 className="font-bold text-danger text-lg">Không thể tải danh sách gói Mentor</h3>
        <p className="mt-1 text-xs text-danger">{errorPackages?.message || 'Đã xảy ra lỗi hệ thống.'}</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-3.5">
      <MentorPageHeader
        icon={<Award className="h-4 w-4" />}
        eyebrow="Dành cho Mentor"
        title="Gói dịch vụ Mentor"
        description="Chọn thời hạn phù hợp để duy trì hồ sơ và tiếp nhận yêu cầu Mentor."
      />

      {/* 1. Thông báo gói Mentor hiện tại nếu đã kích hoạt hoặc đang chờ thanh toán (không hiển thị đơn đã hủy) */}
      {mySubscription && mySubscription.status !== 'CANCELLED' && (
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border border-success bg-success-soft shadow-xs">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success text-text-inverse shrink-0 shadow-xs">
                <Award className="h-4 w-4" />
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-bold text-sm text-text">
                  {mySubscription.packageName}
                </h3>
                {isCurrentlyActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-success-soft text-success">
                    Đang hoạt động
                  </span>
                ) : mySubscription.status === 'PENDING_PAYMENT' ? (
                  <Badge tone="gold" className="text-xs px-2 py-0.5">
                    Chờ thanh toán
                  </Badge>
                ) : mySubscription.status === 'EXPIRED' ? (
                  <Badge tone="danger" className="text-xs px-2 py-0.5">
                    Đã hết hạn
                  </Badge>
                ) : null}
                <span className="text-xs text-text-subtle">
                  {vnd(mySubscription.priceAtPurchase)} / {mySubscription.durationMonths} tháng
                </span>
                {mySubscription.endDate && (
                  <span className="text-xs text-text-subtle">
                    • Hạn dùng: {formatExpiry(mySubscription.endDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Cụm nút hành động */}
            <div className="flex w-full shrink-0 items-center gap-2 self-end sm:w-auto sm:self-center">
              {mySubscription.status === 'PENDING_PAYMENT' && (
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-lg px-3.5 py-1.5 font-semibold text-xs shadow-xs"
                  onClick={() => navigate('/app/mentoring/subscription?step=checkout')}
                >
                  Thanh toán ngay
                </Button>
              )}

              {isCurrentlyActive && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-xs sm:w-auto"
                  onClick={() => navigate('/app/mentoring')}
                  rightIcon={<ArrowRight size={13} />}
                >
                  Về tổng quan
                </Button>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* 2. Danh sách các gói Mentor */}
      <div>
        <Stagger className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3" gap={0.1}>
          {packages?.map((pkg) => (
            <StaggerItem key={pkg.id} className="h-full min-w-0">
              <MentorSubscriptionCard
                pkg={pkg}
                isSelected={mySubscription?.status === 'PENDING_PAYMENT' && mySubscription?.packageId === pkg.id}
                isPendingSelection={selectMutation.isPending}
                isCurrentlyActive={isCurrentlyActive}
                isCurrentActivePackage={isCurrentlyActive && mySubscription?.packageId === pkg.id}
                activeEndDate={mySubscription?.endDate}
                onSelect={handleSelectPackage}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
