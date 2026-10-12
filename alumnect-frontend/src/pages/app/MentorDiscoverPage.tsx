import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from '@/components/ui/primitives'
import {
  MentoringTermsGate,
  MentorSearchHeader,
  MentorFilterBar,
  MentorDirectoryList,
  useMentorSearch,
  useMentorFilterOptions,
} from '@/features/mentorship'
import type {
  MentorSearchParams,
  MentoringWorkingMode,
  MentoringType,
} from '@/features/mentorship/model/mentorSearchTypes'

/**
 * Nội dung trang Khám phá & Lọc Mentor (UC98).
 */
function MentorDiscoverContent() {
  const [searchParams, setSearchParams] = useSearchParams()

  // 1. Phân tích các tham số tìm kiếm và bộ lọc từ URL
  const currentParams: MentorSearchParams = useMemo(() => {
    const keyword = searchParams.get('keyword') || undefined
    const fieldId = searchParams.get('fieldId') ? Number(searchParams.get('fieldId')) : undefined
    const majorId = searchParams.get('majorId') ? Number(searchParams.get('majorId')) : undefined
    const skill = searchParams.get('skill') || undefined
    const workingMode = (searchParams.get('workingMode') as MentoringWorkingMode) || undefined
    const mentoringType = (searchParams.get('mentoringType') as MentoringType) || undefined
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 0
    const size = searchParams.get('size') ? Number(searchParams.get('size')) : 9
    const sortBy = searchParams.get('sortBy') || 'reputationScore'
    const sortDir = (searchParams.get('sortDir') as 'asc' | 'desc') || 'desc'

    return {
      keyword,
      fieldId,
      majorId,
      skill,
      workingMode,
      mentoringType,
      page,
      size,
      sortBy,
      sortDir,
    }
  }, [searchParams])

  // 2. Tải danh mục metadata các bộ lọc từ Backend (GET /api/v1/mentors/filter-options)
  const { data: filterOptions } = useMentorFilterOptions()

  // 3. Thực hiện truy vấn danh sách Mentor qua React Query (GET /api/v1/mentors)
  const { data, isLoading, isError, error, refetch } = useMentorSearch(currentParams)

  // 4. Đếm số lượng bộ lọc đang kích hoạt
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (currentParams.keyword) count++
    if (currentParams.fieldId) count++
    if (currentParams.majorId) count++
    if (currentParams.workingMode) count++
    if (currentParams.mentoringType) count++
    return count
  }, [currentParams])

  // 5. Cập nhật các tham số tìm kiếm & bộ lọc lên URL
  const updateParams = useCallback(
    (updates: Partial<MentorSearchParams>) => {
      const next = { ...currentParams, ...updates }
      const newSearchParams = new URLSearchParams()

      if (next.keyword) newSearchParams.set('keyword', next.keyword)
      if (next.fieldId) newSearchParams.set('fieldId', String(next.fieldId))
      if (next.majorId) newSearchParams.set('majorId', String(next.majorId))
      if (next.workingMode) newSearchParams.set('workingMode', next.workingMode)
      if (next.mentoringType) newSearchParams.set('mentoringType', next.mentoringType)
      if (next.page && next.page > 0) newSearchParams.set('page', String(next.page))
      if (next.size && next.size !== 9) newSearchParams.set('size', String(next.size))
      if (next.sortBy && next.sortBy !== 'reputationScore') newSearchParams.set('sortBy', next.sortBy)
      if (next.sortDir && next.sortDir !== 'desc') newSearchParams.set('sortDir', next.sortDir)

      setSearchParams(newSearchParams, { replace: true })
    },
    [currentParams, setSearchParams],
  )

  // 6. Xử lý các thao tác tương tác
  const handleKeywordChange = (newKeyword: string) => {
    updateParams({ keyword: newKeyword.trim() ? newKeyword.trim() : undefined, page: 0 })
  }

  const handleFilterChange = (updates: Partial<MentorSearchParams>) => {
    updateParams({ ...updates, page: 0 })
  }

  const handleClearFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSortChange = (sortBy: string, sortDir: 'asc' | 'desc') => {
    updateParams({ sortBy, sortDir, page: 0 })
  }

  return (
    <div className="space-y-4 py-1 sm:py-3">
      {/* Header tìm kiếm và sắp xếp */}
      <MentorSearchHeader
        keyword={currentParams.keyword || ''}
        onKeywordChange={handleKeywordChange}
        totalElements={data?.totalElements}
        isLoading={isLoading}
        sortBy={currentParams.sortBy || 'reputationScore'}
        sortDir={currentParams.sortDir || 'desc'}
        onSortChange={handleSortChange}
        activeFilterCount={activeFilterCount}
      />

      {/* Thanh bộ lọc đa tiêu chí (Industry, Major, Skill, Working Mode, Mentoring Type) */}
      <MentorFilterBar
        options={filterOptions}
        params={currentParams}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        activeFilterCount={activeFilterCount}
      />

      {/* Danh sách kết quả, Loading, Empty, Error, Pagination */}
      <MentorDirectoryList
        data={data}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        onClearFilters={handleClearFilters}
        page={currentParams.page || 0}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

/**
 * Trang Khám phá & Lọc Mentor (UC98 - Search & Filter Mentors).
 * Được bảo vệ bởi MentoringTermsGate và đặt trong bố cục MentorshipLayout chuẩn.
 */
export function MentorDiscoverPage() {
  return (
    <Container className="py-2 sm:py-4">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentorDiscoverContent />
      </MentoringTermsGate>
    </Container>
  )
}
