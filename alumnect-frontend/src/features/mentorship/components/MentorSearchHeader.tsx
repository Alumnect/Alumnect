import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, X, ArrowUpDown, Trophy, ArrowLeft, Send } from 'lucide-react'
import { SelectDropdown } from '@/components/ui'

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
      {/* Tiêu đề & Điều hướng nhanh tối giản trên 1 hàng */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-plum-900 dark:text-[#e4e6eb]">
            Khám Phá Mentor
          </h1>
          {!isLoading && totalElements !== undefined && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-600 ring-1 ring-inset ring-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800">
              {totalElements} mentor
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <Link
            to="/app/mentoring/requests/create"
            className="inline-flex items-center gap-1.5 text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Tạo yêu cầu chung</span>
          </Link>
          <span className="text-plum-200 dark:text-plum-700">|</span>
          <Link
            to="/app/mentoring/ranking"
            className="inline-flex items-center gap-1.5 text-gold-600 transition-colors hover:text-gold-700 dark:text-gold-400"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Bảng xếp hạng</span>
          </Link>
          <span className="text-plum-200 dark:text-plum-700">|</span>
          <Link
            to="/app/mentoring"
            className="inline-flex items-center gap-1 text-plum-500 hover:text-brand-600 dark:text-[#b0b3b8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Không gian Cố vấn</span>
          </Link>
        </div>
      </div>

      {/* Thanh Search Bar & Sort Dropdown gọn gàng */}
      <div className="relative z-20 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Input ô tìm kiếm */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-plum-400 dark:text-[#8f9399]">
            <Search className="h-4 w-4 text-brand-500" aria-hidden="true" />
          </div>

          <input
            type="text"
            value={localKeyword}
            onChange={(e) => setLocalKeyword(e.target.value)}
            placeholder="Tìm theo tên mentor, từ khóa, lĩnh vực, chuyên ngành..."
            aria-label="Tìm kiếm Mentor"
            className="h-10 w-full rounded-xl border border-plum-900/10 bg-white pl-10 pr-9 text-xs sm:text-sm font-medium text-plum-900 shadow-2xs transition-all placeholder:text-plum-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#e4e6eb] dark:placeholder:text-[#8f9399]"
          />

          {localKeyword && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Xóa từ khóa tìm kiếm"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-plum-400 transition-colors hover:text-plum-700 dark:hover:text-white"
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
            icon={<ArrowUpDown className="h-3.5 w-3.5 text-brand-500" />}
          />
        </div>
      </div>
    </div>
  )
}
