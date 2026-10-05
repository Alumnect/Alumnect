import { AlertCircle, RefreshCw, Compass, ShieldCheck, HeartHandshake } from 'lucide-react'
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
      <div className="space-y-8 py-6">
        <div className="rounded-3xl border border-plum-900/10 bg-white p-8 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>

        <div className="rounded-3xl border border-plum-900/10 bg-white p-8 dark:bg-[#242526] dark:border-[#393a3b] space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  // Trạng thái Error: Bắt buộc lấy trực tiếp error.message từ Backend
  if (isError || !status) {
    return (
      <div className="py-12">
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
    <div className="space-y-8 py-6">
      {/* 1. Hero Status Card */}
      <MentorStatusHero
        status={status}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      />

      {/* 2. Checklist 5 tiêu chuẩn hoàn thiện */}
      <MentorRequirementChecklist status={status} />

      {/* 3. Chi tiết Gói Subscription & Hiệu lực */}
      <MentorSubscriptionSummaryCard status={status} />

      {/* 4. Quy tắc hoạt động & Hướng dẫn dành cho Mentor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
            <Compass className="h-5 w-5" />
          </div>
          <h4 className="font-heading text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
            Trạng Thái Tự Động
          </h4>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Hệ thống AlumNect tính toán Mentor Status hoàn toàn tự động theo chuẩn System Rules, không thông qua khâu xét duyệt thủ công từ Admin.
          </p>
        </Card>

        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-mint-600 dark:bg-mint-950/60 dark:text-mint-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h4 className="font-heading text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
            Bảo Toàn Lịch Sử Cố Vấn
          </h4>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Khi gói dịch vụ hết hạn (EXPIRED), bạn chỉ tạm ngừng nhận kết nối mới. Toàn bộ hồ sơ, đánh giá và lịch sử hỗ trợ vẫn được bảo toàn nguyên vẹn.
          </p>
        </Card>

        <Card hover className="p-5 border border-plum-900/[0.08] bg-white dark:bg-[#242526] dark:border-[#393a3b] space-y-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-100 text-gold-600 dark:bg-gold-950/60 dark:text-gold-300">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <h4 className="font-heading text-sm font-bold text-plum-900 dark:text-[#e4e6eb]">
            Gia Hạn Liền Mạch
          </h4>
          <p className="text-xs text-plum-600 dark:text-[#b0b3b8] leading-relaxed">
            Bạn có thể chủ động thanh toán gia hạn gói bất kỳ lúc nào để duy trì huy hiệu Mentor chính thức và tiếp tục hỗ trợ sinh viên thế hệ sau.
          </p>
        </Card>
      </div>
    </div>
  )
}
