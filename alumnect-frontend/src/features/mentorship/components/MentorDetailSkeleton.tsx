import { Card, Skeleton } from '@/components/ui/primitives'

/**
 * Hiệu ứng Shimmer Skeleton tải trang chi tiết Mentor (UC99).
 * Áp dụng thiết kế Pastel Premium với thẻ Card bo tròn lớn, màu kem ấm.
 */
export function MentorDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Skeleton Header Card */}
      <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 sm:p-8 dark:bg-[#242526] dark:border-[#393a3b]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Skeleton className="h-24 w-24 sm:h-28 sm:w-28 rounded-full shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-7 w-48 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 rounded-md" />
            <Skeleton className="h-4 w-60 rounded-md" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
          <div className="w-full sm:w-auto shrink-0 self-stretch sm:self-center">
            <Skeleton className="h-11 w-full sm:w-44 rounded-2xl" />
          </div>
        </div>
      </Card>

      {/* Skeleton Content Grid 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột chính (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Giới thiệu */}
          <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
            <Skeleton className="h-6 w-36 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
          </Card>

          {/* Card Kỹ năng & Chuyên môn */}
          <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
            <Skeleton className="h-6 w-44 rounded-md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-xl" />
              <Skeleton className="h-7 w-28 rounded-xl" />
              <Skeleton className="h-7 w-24 rounded-xl" />
              <Skeleton className="h-7 w-32 rounded-xl" />
            </div>
          </Card>

          {/* Card Kinh nghiệm sự nghiệp */}
          <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 dark:bg-[#242526] dark:border-[#393a3b] space-y-6">
            <Skeleton className="h-6 w-52 rounded-md" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-64 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-44 rounded-md" />
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-56 rounded-md" />
              </div>
            </div>
          </Card>
        </div>

        {/* Cột phụ (1/3) */}
        <div className="space-y-6">
          <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
            <Skeleton className="h-6 w-40 rounded-md" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-18 rounded-2xl" />
              <Skeleton className="h-18 rounded-2xl" />
              <Skeleton className="h-18 rounded-2xl" />
              <Skeleton className="h-18 rounded-2xl" />
            </div>
          </Card>

          <Card hover={false} className="border border-plum-900/[0.08] bg-white p-6 dark:bg-[#242526] dark:border-[#393a3b] space-y-4">
            <Skeleton className="h-6 w-48 rounded-md" />
            <Skeleton className="h-12 w-full rounded-2xl" />
          </Card>
        </div>
      </div>
    </div>
  )
}
