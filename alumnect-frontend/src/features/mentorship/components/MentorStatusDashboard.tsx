import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { useMentorStatus } from '../hooks/useMentorStatus'
import { MentorStatusHero } from './MentorStatusHero'
import { MentorRequirementChecklist } from './MentorRequirementChecklist'
import { MentorSubscriptionSummaryCard } from './MentorSubscriptionSummaryCard'

/**
 * Màn hình Dashboard tổng hợp trạng thái Mentor & Subscription (UC94).
 * Kết nối với React Query hook useMentorStatus để đồng bộ dữ liệu liên tục từ Spring Boot.
 */
export function MentorStatusDashboard() {
  const { data: status, isLoading, isError, error, refetch, isFetching } = useMentorStatus()

  // Trạng thái Loading bằng hiệu ứng Shimmer Skeleton màu kem ấm
  if (isLoading) {
    return (
      <div className="space-y-5 py-2 sm:py-3">
        <div className="rounded-3xl border border-plum-900/10 bg-white p-6 sm:p-8 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <div className="rounded-3xl border border-plum-900/10 bg-white p-6 sm:p-8 dark:bg-[#242526] dark:border-[#393a3b] space-y-5">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Trạng thái Error: Bắt buộc lấy trực tiếp error.message từ Backend
  if (isError || !status) {
    return (
      <div className="py-8">
        <Card hover={false} className="mx-auto max-w-xl p-8 text-center border border-coral-200 bg-white dark:bg-[#242526] dark:border-coral-800/60">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-100 text-coral-600 dark:bg-coral-950/60 dark:text-coral-300">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-plum-900 dark:text-[#e4e6eb]">
            Không Thể Tải Trạng Thái Mentor
          </h2>
          <p className="mt-2 text-sm text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            {error?.message || 'Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại sau.'}
          </p>
          <div className="mt-6 flex justify-center">
            <Button
              variant="primary"
              size="md"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => refetch()}
            >
              Thử tải lại
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 py-1">
      {/* 1. Hero Status Card */}
      <MentorStatusHero
        status={status}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* 2. Chi tiết Gói Dịch Vụ & Thời Gian Hiệu Lực */}
      <MentorSubscriptionSummaryCard status={status} />

      {/* 3. Checklist Điều Kiện Hồ Sơ Cố Vấn */}
      <MentorRequirementChecklist status={status} />
    </div>
  )
}
