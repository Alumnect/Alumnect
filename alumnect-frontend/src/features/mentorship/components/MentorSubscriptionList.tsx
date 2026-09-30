import { useNavigate } from 'react-router-dom'
import { Award, AlertCircle } from 'lucide-react'
import { Card, Skeleton, Badge, Button } from '@/components/ui'
import { Stagger, StaggerItem, Reveal } from '@/components/motion'
import { vnd } from '@/lib/utils'
import {
  useMentorPackages,
  useMyMentorSubscription,
  useSelectMentorPackage,
} from '../hooks/useMentorSubscription'
import { MentorSubscriptionCard } from './MentorSubscriptionCard'

/**
 * Component hiển thị danh sách gói Mentor và quản lý thao tác lựa chọn gói (UC92).
 */
export function MentorSubscriptionList() {
  const navigate = useNavigate()
  const { data: packages, isLoading: isLoadingPackages, isError: isErrorPackages, error: errorPackages } = useMentorPackages()
  const { data: mySubscription, isLoading: isLoadingSub } = useMyMentorSubscription()
  const selectMutation = useSelectMentorPackage()

  const handleSelectPackage = async (packageId: number) => {
    try {
      const result = await selectMutation.mutateAsync({ packageId })
      // Sau khi chọn gói thành công, điều hướng sang màn hình thanh toán UC93
      if (result) {
        navigate('/app/mentoring/subscription')
      }
    } catch {
      // Lỗi đã được xử lý tự động bởi hook
    }
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
      <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-rose-200 bg-rose-50/50">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-rose-900 text-lg">Không thể tải danh sách gói Mentor</h3>
        <p className="mt-1 text-xs text-rose-700">{errorPackages?.message || 'Đã xảy ra lỗi hệ thống.'}</p>
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
    <div className="space-y-8">
      {/* Thẻ hiển thị gói đã chọn / trạng thái hiện tại nếu người dùng đã đăng ký trước đó */}
      {mySubscription && (
        <Reveal>
          <Card hover={false} className="p-6 rounded-3xl border border-plum-900/10 bg-white dark:bg-[#242526] shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-plum-900 dark:text-[#e4e6eb] text-base">
                      {mySubscription.packageName}
                    </span>
                    <Badge
                      tone={
                        mySubscription.status === 'PAID'
                          ? 'success'
                          : mySubscription.status === 'PENDING_PAYMENT'
                          ? 'gold'
                          : 'neutral'
                      }
                      className="px-2.5 py-0.5 text-xs font-semibold"
                    >
                      {mySubscription.status === 'PAID'
                        ? 'Đã kích hoạt'
                        : mySubscription.status === 'PENDING_PAYMENT'
                        ? 'Chờ thanh toán'
                        : mySubscription.status}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-plum-500">
                    Giá giao dịch: <strong className="text-plum-900 dark:text-[#e4e6eb]">{vnd(mySubscription.priceAtPurchase)}</strong> | Thời hạn {mySubscription.durationMonths} tháng
                  </p>
                </div>
              </div>

              {mySubscription.status === 'PENDING_PAYMENT' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full sm:w-auto font-medium"
                    onClick={() => navigate('/app/mentoring/subscription')}
                  >
                    Thanh toán ngay
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </Reveal>
      )}

      {/* Danh sách các gói Mentor khả dụng */}
      <div>
        <div className="mb-6">
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Các Gói Dịch Vụ Đồng Hành Cố Vấn
          </h2>
          <p className="text-xs text-plum-500 mt-1">
            Chọn gói phù hợp với kế hoạch thời gian và đóng góp của bạn cho cộng đồng FPT Alumni.
          </p>
        </div>

        <Stagger className="grid gap-6 md:grid-cols-3" gap={0.1}>
          {packages?.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <MentorSubscriptionCard
                pkg={pkg}
                isSelected={mySubscription?.packageId === pkg.id}
                isPendingSelection={selectMutation.isPending}
                onSelect={handleSelectPackage}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
