import { useEffect, useState } from 'react'
import { Search, X, ArrowUpDown } from 'lucide-react'
import { SelectDropdown } from '@/components/ui'
import { MentorPageHeader } from './MentorPageHeader'

interface MentorSearchHeaderProps {
  keyword: string
  onKeywordChange: (keyword: string) => void
  totalElements?: number
  isLoading?: boolean
  sortBy: string
  sortDir: 'asc' | 'desc'
  onSortChange: (sortBy: string, sortDir: 'asc' | 'desc') => void
  activeFilterCount?: number
}

/**
 * Thanh tiêu đề và tìm kiếm tối giản cho trang Khám phá & Lọc Mentor (UC98).
 * Tinh gọn tối đa: Gộp tiêu đề, số lượng và liên kết điều hướng vào 1 hàng,
 * loại bỏ các đoạn văn và huy hiệu dài dòng gây tốn diện tích màn hình.
 */
export function MentorSearchHeader({
  keyword,
  onKeywordChange,
  totalElements = 0,
  isLoading = false,
  sortBy,
  sortDir,
  onSortChange,
}: MentorSearchHeaderProps) {
  const [localKeyword, setLocalKeyword] = useState(keyword)

  useEffect(() => {
    setLocalKeyword(keyword)
  }, [keyword])

  // Debounce 350ms khi người dùng gõ
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
    <div className="space-y-3">
      <MentorPageHeader
        icon={<Search className="h-4 w-4" />}
        eyebrow="Mạng lưới cố vấn"
        title="Khám phá Mentor"
        description="Tìm Mentor phù hợp theo chuyên môn, kinh nghiệm và hình thức hỗ trợ."
        actions={!isLoading ? (
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-solid ring-1 ring-inset ring-brand-200 dark:ring-brand-300/20">
            {totalElements} Mentor
          </span>
        ) : undefined}
      />

      {/* Thanh Search Bar & Sort Dropdown gọn gàng */}
      <div className="relative z-20 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Input ô tìm kiếm */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-subtle">
            <Search className="h-4 w-4 text-primary-solid" aria-hidden="true" />
          </div>

          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            placeholder="Tìm theo tên mentor, từ khóa, lĩnh vực, chuyên ngành..."
            aria-label="Tìm kiếm Mentor"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-9 text-sm font-medium text-text shadow-2xs transition-all placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-brand-400/20"
          />

          {localKeyword && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-subtle transition-colors hover:text-text-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sắp xếp kết quả */}
        <div className="w-full sm:w-52 shrink-0">
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
            icon={<ArrowUpDown className="h-3.5 w-3.5 text-primary-solid" />}
          />
        </div>
      </div>
    </div>
  )
}
