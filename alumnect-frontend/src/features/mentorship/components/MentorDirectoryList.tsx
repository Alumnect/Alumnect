import { ChevronLeft, ChevronRight, AlertCircle, RefreshCw, SearchX } from 'lucide-react'
import { EmptyState, Skeleton } from '@/components/ui'
import { MentorCard } from './MentorCard'
import type { MentorSearchPageResponse } from '../model/mentorSearchTypes'

interface MentorDirectoryListProps {
  data?: MentorSearchPageResponse
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  onClearFilters: () => void
  page: number
  onPageChange: (newPage: number) => void
}

/**
 * Hiển thị danh sách thẻ Mentor theo kết quả tìm kiếm & lọc (UC98).
 * Bao gồm đầy đủ các trạng thái UI: Loading (Skeleton), Error (Alert), Empty (EmptyState), Success (Grid) & Pagination.
 */
export function MentorDirectoryList({
  data,
  isLoading,
  isError,
  error,
  onRetry,
  onClearFilters,
  page: _page,
  onPageChange,
}: MentorDirectoryListProps) {
  // 1. Loading State: Khung xương Skeleton dạng Grid
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-plum-900/[0.08] bg-white p-5 space-y-4 dark:border-[#393a3b] dark:bg-[#242526]"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="pt-2 border-t border-plum-900/[0.06] flex justify-between">
              <Skeleton className="h-8 w-24 rounded-xl" />
              <Skeleton className="h-8 w-24 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 2. Error State: Hiển thị trực tiếp error.message từ Backend
  if (isError) {
    return (
      <div className="rounded-3xl border border-coral-300/60 bg-coral-50/70 p-6 text-center dark:border-coral-900/60 dark:bg-coral-950/20">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-coral-100 text-coral-600 dark:bg-coral-900/50 dark:text-coral-300">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-heading text-base font-bold text-plum-900 dark:text-[#e4e6eb]">
          Không thể tải danh sách Mentor
        </h3>
        <p className="mt-1 text-xs text-plum-600 dark:text-[#b0b3b8]">
          {error?.message || 'Đã có lỗi xảy ra trong quá trình truy vấn hệ thống.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-coral-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-coral-700 active:scale-95"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Thử lại</span>
        </button>
      </div>
    )
  }

  // 3. Empty State: Không tìm thấy kết quả nào phù hợp
  if (!data || data.content.length === 0) {
    return (
      <div className="rounded-3xl border border-plum-900/[0.08] bg-white/60 p-6 text-center backdrop-blur-sm dark:border-[#393a3b] dark:bg-[#242526]/60">
        <EmptyState
          className="border-0 bg-transparent py-6"
          icon={<SearchX className="h-9 w-9 text-brand-500" />}
          title="Không tìm thấy Mentor"
          description="Thử đổi từ khóa hoặc xóa bộ lọc."
          action={
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-brand-700 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          }
        />
      </div>
    )
  }

  // 4. Success State: Danh sách Mentor Grid
  const totalPages = data.totalPages
  const currentPage = data.pageNumber

  return (
    <div className="space-y-6">
      {/* Grid thẻ Mentor */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {data.content.map((mentor) => (
          <MentorCard key={mentor.mentorId} mentor={mentor} />
        ))}
      </div>

      {/* Điều khiển phân trang (Pagination) */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-plum-900/[0.07] pt-4 sm:flex-row dark:border-[#393a3b]">
          <span className="text-xs font-medium text-plum-500 dark:text-[#8f9399]">
            Trang {currentPage + 1} / {totalPages} (Tổng số {data.totalElements} Mentor)
          </span>

          <div className="flex items-center gap-1.5">
            {/* Nút trang trước */}
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
              aria-label="Trang trước"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-plum-900/10 bg-white text-plum-700 shadow-2xs transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#2b2c2d] dark:text-[#e4e6eb]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Các số trang */}
            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((i) => i === 0 || i === totalPages - 1 || Math.abs(i - currentPage) <= 1)
              .map((i, index, array) => {
                const prev = array[index - 1]
                const showEllipsis = prev !== undefined && i - prev > 1

                return (
                  <div key={i} className="flex items-center">
                    {showEllipsis && (
                      <span className="px-1 text-xs text-plum-400">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => onPageChange(i)}
                      className={`h-9 min-w-9 rounded-xl px-2 text-xs font-bold transition-all ${
                        currentPage === i
                          ? 'bg-brand-600 text-white shadow-xs'
                          : 'border border-plum-900/10 bg-white text-plum-700 hover:bg-brand-50 hover:text-brand-700 dark:border-[#393a3b] dark:bg-[#2b2c2d] dark:text-[#e4e6eb]'
                      }`}
                    >
                      {i + 1}
                    </button>
                  </div>
                )
              })}

            {/* Nút trang tiếp theo */}
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
              aria-label="Trang sau"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-plum-900/10 bg-white text-plum-700 shadow-2xs transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40 dark:border-[#393a3b] dark:bg-[#2b2c2d] dark:text-[#e4e6eb]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
