import { useNavigate } from 'react-router-dom'
import { Award, AlertCircle, Clock, CheckCircle2, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
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

  const isCurrentlyActive =
    (mySubscription?.status === 'ACTIVE' || mySubscription?.status === 'PAID') &&
    (!mySubscription.endDate || new Date(mySubscription.endDate).getTime() > Date.now())

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
      {/* 1. VIP Card hiển thị gói Mentor hiện tại nếu đã đăng ký */}
      {mySubscription && (
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/30 dark:from-emerald-950/30 dark:via-[#242526] dark:to-[#1e2322] p-6 sm:p-7 shadow-sm">
            {/* Glowing background orb */}
            <div className="absolute -top-10 -right-10 w-44 h-44 bg-emerald-400/15 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 shrink-0">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-plum-900 dark:text-[#e4e6eb]">
                      {mySubscription.packageName}
                    </h3>
                    {isCurrentlyActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800 shadow-xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        ĐANG HOẠT ĐỘNG
                      </span>
                    ) : (
                      <Badge
                        tone={mySubscription.status === 'PENDING_PAYMENT' ? 'gold' : 'neutral'}
                        className="px-2.5 py-0.5 text-xs font-semibold"
                      >
                        {mySubscription.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : mySubscription.status}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-plum-600 dark:text-[#b0b3b8]">
                    <span className="inline-flex items-center gap-1">
                      Mức phí: <strong className="text-plum-900 dark:text-[#e4e6eb]">{vnd(mySubscription.priceAtPurchase)}</strong>
                    </span>
                    <span className="hidden sm:inline text-plum-300 dark:text-zinc-600">•</span>
                    <span>
                      Thời hạn: <strong className="text-plum-900 dark:text-[#e4e6eb]">{mySubscription.durationMonths} tháng</strong>
                    </span>
                    {mySubscription.endDate && (
                      <>
                        <span className="hidden sm:inline text-plum-300 dark:text-zinc-600">•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <Clock size={13} className="shrink-0" />
                          Hạn sử dụng: {formatExpiry(mySubscription.endDate)}
                        </span>
                      </>
                    )}
                  </div>

                  {isCurrentlyActive && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Gói cố vấn đang trong thời gian hiệu lực. Bạn có thể gia hạn hoặc chọn gói mới sau khi gói này hết hạn.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cụm nút hành động */}
              <div className="flex items-center gap-3 shrink-0 lg:self-center">
                {mySubscription.status === 'PENDING_PAYMENT' && (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto font-bold rounded-2xl px-6 shadow-sm"
                    onClick={() => navigate('/app/mentoring/subscription?step=checkout')}
                  >
                    Thanh toán ngay
                  </Button>
                )}

                {isCurrentlyActive && (
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto font-bold flex items-center justify-center gap-2 rounded-2xl px-6 py-2.5 shadow-sm"
                    onClick={() => navigate('/app/mentoring')}
                  >
                    <span>Vào Bảng Tin Mentor</span>
                    <ArrowRight size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* 2. Danh sách các gói Mentor khả dụng */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-plum-900 dark:text-[#e4e6eb]">
              Các Gói Dịch Vụ Đồng Hành Cố Vấn
            </h2>
            <p className="text-xs sm:text-sm text-plum-500 dark:text-[#b0b3b8] mt-1">
              {isCurrentlyActive
                ? 'Tài khoản của bạn đã được kích hoạt gói Mentor chính thức. Các gói khác tạm thời khóa để duy trì một chu kỳ duy nhất.'
                : 'Chọn gói phù hợp với kế hoạch thời gian và đóng góp của bạn cho cộng đồng FPT Alumni.'}
            </p>
          </div>

          {isCurrentlyActive && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-semibold border border-slate-200 dark:border-zinc-700 shrink-0 self-start sm:self-auto">
              <Lock size={12} className="text-amber-500" />
              <span>Chế độ duy trì 1 gói hiệu lực</span>
            </div>
          )}
        </div>

        <Stagger className="grid gap-6 md:grid-cols-3" gap={0.1}>
          {packages?.map((pkg) => (
            <StaggerItem key={pkg.id}>
              <MentorSubscriptionCard
                pkg={pkg}
                isSelected={mySubscription?.packageId === pkg.id}
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
