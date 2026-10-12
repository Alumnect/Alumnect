import { AlertCircle } from 'lucide-react'
import { Skeleton, EmptyState, Pagination } from '@/components/ui'
import { MentorRankingCard } from './MentorRankingCard'
import { MentorRankingPodium } from './MentorRankingPodium'
import type { MentorRankingPageResponse } from '../model/mentorRankingTypes'

interface MentorRankingListProps {
  data: MentorRankingPageResponse | undefined
  isLoading: boolean
  isError: boolean
  error: Error | null
  page: number
  onPageChange: (newPage: number) => void
  fieldName?: string
}

/**
 * Danh sách hiển thị bảng xếp hạng Mentor, xử lý đầy đủ các trạng thái Loading, Error, Empty và Phân trang (UC97).
 */
export function MentorRankingList({
  data,
  isLoading,
  isError,
  error,
  page,
  onPageChange,
  fieldName = 'lĩnh vực này',
}: MentorRankingListProps) {
  // 1. Trạng thái Đang tải dữ liệu (Loading Skeleton)
  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        {/* Skeleton Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-plum-900/10 p-6 bg-white/60 space-y-3 text-center dark:bg-[#242526] dark:border-[#393a3b]">
              <Skeleton className="mx-auto h-16 w-16 rounded-full" />
              <Skeleton className="mx-auto h-4 w-32" />
              <Skeleton className="mx-auto h-3 w-48" />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Ranking List */}
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-plum-900/10 p-4 bg-white/60 flex items-center justify-between dark:bg-[#242526] dark:border-[#393a3b]">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-2xl" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20 rounded-xl" />
                <Skeleton className="h-10 w-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 2. Trạng thái Lỗi nghiệp vụ (Error State - hiển thị error.message từ Backend)
  if (isError) {
    return (
      <div className="rounded-3xl border border-coral-500/30 bg-coral-50/50 p-6 text-coral-800 dark:bg-coral-950/20 dark:border-coral-900/40 dark:text-coral-300">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-coral-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="font-heading text-sm font-bold">Không thể tải bảng xếp hạng Mentor</h3>
            <p className="text-xs leading-relaxed opacity-90">
              {error?.message || 'Hệ thống tạm thời không phản hồi. Vui lòng thử lại sau.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const mentors = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = data?.totalPages || 0

  // 3. Trạng thái Danh sách rỗng (Empty State)
  if (mentors.length === 0) {
    return (
      <EmptyState
        title="Chưa có Mentor hoạt động trong lĩnh vực này"
        description={`Hiện tại chưa có Mentor nào thuộc lĩnh vực ${fieldName} đang ở trạng thái hoạt động với gói dịch vụ còn hiệu lực. Hãy chọn một lĩnh vực khác hoặc quay lại sau.`}
      />
    )
  }

  // Hiển thị Podium Top 3 khi đang ở trang đầu tiên (page === 0) và có từ 2 Mentor trở lên
  const showPodium = page === 0 && mentors.length >= 2
  const topThree = mentors.slice(0, 3)

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Khối Podium vinh danh Top 3 */}
      {showPodium && <MentorRankingPodium topMentors={topThree} />}

      {/* Danh sách toàn bộ Mentor theo thứ hạng */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <h2 className="font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
            Danh Sách Chi Tiết Thứ Hạng ({totalElements})
          </h2>
          <span className="text-xs text-plum-500 dark:text-[#8a8d91]">
            Trang {page + 1} / {totalPages || 1}
          </span>
        </div>

        <div className="space-y-3">
          {mentors.map((mentor) => (
            <MentorRankingCard key={mentor.mentorId} mentor={mentor} />
          ))}
        </div>
      </div>

      {/* Phân trang (Pagination) */}
      {totalPages > 1 && (
        <div className="pt-4 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
