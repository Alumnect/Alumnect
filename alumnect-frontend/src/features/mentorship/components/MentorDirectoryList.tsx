import { AlertCircle, RefreshCw, SearchX } from 'lucide-react'
import { EmptyState, Skeleton, Pagination } from '@/components/ui'
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
            className="rounded-3xl border border-border bg-surface p-5 space-y-4"
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
            <div className="pt-2 border-t border-border flex justify-between">
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
      <div className="rounded-3xl border border-danger-border bg-danger-soft p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="mt-3 font-display text-base font-bold text-text">
          Không thể tải danh sách Mentor
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          {error?.message || 'Đã có lỗi xảy ra trong quá trình truy vấn hệ thống.'}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-danger px-4 py-2 text-xs font-bold text-text-inverse shadow-xs transition-colors hover:opacity-90 active:scale-95"
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
      <div className="rounded-3xl border border-border bg-surface/60 p-6 text-center backdrop-blur-sm">
        <EmptyState
          className="border-0 bg-transparent py-6"
          icon={<SearchX className="h-9 w-9 text-primary-solid" />}
          title="Không tìm thấy Mentor"
          description="Thử đổi từ khóa hoặc xóa bộ lọc."
          action={
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-solid px-4 py-2 text-xs font-semibold text-on-primary shadow-xs transition hover:bg-primary-hover active:scale-95 cursor-pointer"
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

      {/* Điều khiển phân trang chuẩn (Pagination) */}
      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
