import { useState } from 'react'
import { Users, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react'
import { PageHeader, Badge, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import {
  UserSearchFilterBar,
  UserDirectoryCard,
  useSearchUsers,
  type FilterState,
} from '@/features/user'

const INITIAL_FILTERS: FilterState = {
  query: '',
  category: 'ALL',
  role: 'ALL',
  majorId: null,
  cohort: null,
  city: '',
  skill: '',
  company: '',
  sortBy: 'createdAt',
  sortDirection: 'DESC',
}

const PAGE_SIZE = 12

export function AlumniDirectoryPage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)
  const [page, setPage] = useState(0)

  // Xây dựng params gửi lên API Backend
  const searchParams = {
    query: filters.query.trim() || undefined,
    role: filters.role !== 'ALL' ? filters.role : undefined,
    majorId: filters.majorId || undefined,
    cohort: filters.cohort || undefined,
    city: filters.city || undefined,
    skill: filters.skill || undefined,
    company: filters.company || undefined,
    page,
    size: PAGE_SIZE,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  }

  // Gọi Hook useSearchUsers từ React Query
  const { data, isLoading, isError, error, refetch } = useSearchUsers(searchParams)

  const users = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = data?.totalPages || 0
  const isFirstPage = page === 0
  const isLastPage = data?.last ?? true

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(0) // Luôn reset về trang đầu khi thay đổi bộ lọc
  }

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS)
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* Page Header */}
      <PageHeader
        icon={<Users size={22} className="text-brand-500" />}
        title="Danh bạ thành viên AlumNect"
        subtitle="Khám phá, tra cứu và kết nối cùng cộng đồng hàng ngàn cựu sinh viên & sinh viên FPT University."
        actions={
          totalElements > 0 && (
            <Badge tone="brand" className="px-3.5 py-1 text-xs">
              <UserCheck size={13} /> {totalElements} Thành viên
            </Badge>
          )
        }
      />

      {/* Filter & Search Bar */}
      <UserSearchFilterBar
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Loading Skeletons State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="flex h-[360px] flex-col items-center justify-between rounded-3xl border border-plum-900/10 bg-white/60 p-5 backdrop-blur-xs"
            >
              <div className="flex w-full flex-col items-center">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="mt-4 h-5 w-32 rounded-lg" />
                <Skeleton className="mt-2 h-4 w-48 rounded-lg" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
                <div className="mt-4 flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-md" />
                  <Skeleton className="h-4 w-14 rounded-md" />
                  <Skeleton className="h-4 w-12 rounded-md" />
                </div>
              </div>
              <div className="mt-6 flex w-full gap-2">
                <Skeleton className="h-8 flex-1 rounded-xl" />
                <Skeleton className="h-8 w-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <EmptyState
          icon={<Users size={28} className="text-coral-500" />}
          title="Không thể tải danh bạ thành viên"
          description={error instanceof Error ? error.message : 'Đã có lỗi xảy ra khi kết nối máy chủ.'}
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Thử lại
            </Button>
          }
        />
      )}

      {/* Zero Result State */}
      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          icon={<Users size={28} className="text-brand-500" />}
          title="Không tìm thấy thành viên phù hợp"
          description="Hãy thử thay đổi từ khóa tìm kiếm, chuyên ngành hoặc mở rộng phạm vi bộ lọc."
          action={
            <Button size="sm" variant="secondary" onClick={handleResetFilters}>
              Xóa bộ lọc & Tìm lại
            </Button>
          }
        />
      )}

      {/* User Directory Grid */}
      {!isLoading && !isError && users.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((user) => (
              <div key={user.userId} className="h-full animate-in fade-in-50 duration-300">
                <UserDirectoryCard user={user} />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-plum-900/10 pt-6 sm:flex-row">
              <span className="text-xs font-medium text-plum-500">
                Hiển thị trang <strong>{page + 1}</strong> trên tổng số <strong>{totalPages}</strong> trang ({totalElements} thành viên)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<ChevronLeft size={15} />}
                  disabled={isFirstPage}
                  onClick={() => {
                    setPage((prev) => Math.max(0, prev - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Trang trước
                </Button>

                <div className="flex items-center gap-1 px-1 text-xs font-semibold text-plum-700">
                  {page + 1} / {totalPages}
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  rightIcon={<ChevronRight size={15} />}
                  disabled={isLastPage}
                  onClick={() => {
                    setPage((prev) => prev + 1)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
