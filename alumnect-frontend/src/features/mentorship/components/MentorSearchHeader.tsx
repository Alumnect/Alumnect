import { useEffect, useState } from 'react'
import { Search, X, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Badge, SelectDropdown } from '@/components/ui'

interface MentorSearchHeaderProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  totalElements?: number
  isLoading?: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortDir: 'asc' | 'desc') => void
  onToggleFilters?: () => void
  activeFilterCount: number
}

/**
 * Thanh tiêu đề và tìm kiếm chính cho trang Khám phá & Lọc Mentor (UC98).
 */
export function MentorSearchHeader({
  keyword,
  onKeywordChange,
  totalElements = 0,
  isLoading = false,
  sortBy,
  sortDir,
  onSortChange,
  onToggleFilters,
  activeFilterCount,
}: MentorSearchHeaderProps) {
  const [localKeyword, setLocalKeyword] = useState(keyword)

  useEffect(() => {
    setLocalKeyword(keyword)
  }, [keyword])

  // Debounce 300ms khi người dùng gõ
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localKeyword !== keyword) {
        onKeywordChange(localKeyword)
      }
    }, 350)
    return () => clearTimeout(handler)
  }, [localKeyword, keyword, onKeywordChange])

  const handleClear = () => {
    setLocalKeyword('')
    onKeywordChange('')
  }

  return (
    <div className="space-y-4">
      {/* Tiêu đề & Giới thiệu */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="brand" icon={<Sparkles className="h-3.5 w-3.5" />}>
              Mạng lưới Mentor AlumNect
            </Badge>
            {!isLoading && (
              <span className="text-xs font-semibold text-plum-500 dark:text-[#8f9399]">
                {totalElements} mentor đang hoạt động
              </span>
            )}
          </div>
          <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-plum-900 sm:text-3xl dark:text-[#e4e6eb]">
            Tìm Kiếm & Kết Nối Mentor
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-plum-600 dark:text-[#b0b3b8]">
            Tìm kiếm cựu sinh viên, chuyên gia hàng đầu theo ngành nghề, chuyên môn và kỹ năng để đồng hành trên con đường phát triển.
          </p>
        </div>

        {/* Nút lọc nhanh trên mobile */}
        {onToggleFilters && (
          <div className="sm:hidden">
            <button
              type="button"
              onClick={onToggleFilters}
              className="inline-flex items-center gap-2 rounded-2xl border border-plum-900/10 bg-white px-4 py-2 text-xs font-bold text-plum-700 shadow-2xs dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb]"
            >
              <SlidersHorizontal className="h-4 w-4 text-brand-600" />
              <span>Bộ lọc nâng cao</span>
              {activeFilterCount > 0 && (
                <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Thanh Search Bar & Sort Dropdown */}
      <div className="relative z-40 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Input ô tìm kiếm */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-plum-400 dark:text-[#8f9399]">
            <Search className="h-5 w-5 text-brand-500" aria-hidden="true" />
          </div>

          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            placeholder="Tìm theo tên mentor, từ khóa, lĩnh vực, chuyên ngành..."
            aria-label="Tìm kiếm Mentor"
            className="w-full rounded-2xl border border-plum-900/10 bg-white py-3 pl-11 pr-10 text-sm font-medium text-plum-900 shadow-xs transition-all placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb] dark:placeholder:text-[#8f9399]"
          />

          {localKeyword && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-plum-400 transition-colors hover:text-plum-700 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sắp xếp kết quả */}
        <div className="w-full sm:w-56 shrink-0">
          <SelectDropdown
            value={`${sortBy}_${sortDir}`}
            onChange={(val) => {
              const [newSortBy, newSortDir] = String(val).split('_') as [string, 'asc' | 'desc']
              onSortChange(newSortBy, newSortDir)
            }}
            options={[
              { value: 'reputationScore_desc', label: 'Điểm uy tín cao nhất' },
              { value: 'rating_desc', label: 'Đánh giá sao cao nhất' },
              { value: 'completedMissions_desc', label: 'Số nhiệm vụ nhiều nhất' },
              { value: 'fullName_asc', label: 'Tên A-Z' },
            ]}
            placeholder="Sắp xếp kết quả"
            align="right"
            icon={<ArrowUpDown className="h-3.5 w-3.5 text-brand-500" />}
          />
        </div>
      </div>
    </div>
  )
}
