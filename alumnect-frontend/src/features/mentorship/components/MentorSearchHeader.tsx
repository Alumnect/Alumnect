import { useEffect, useState } from 'react'
import { Search, X, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SelectDropdown, Card } from '@/components/ui'
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
  const { t } = useTranslation()
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
        eyebrow={t('mentoring.eyebrowNetwork')}
        title={t('mentoring.exploreMentors')}
        description={t('mentoring.connectHeroSubtitle')}
        actions={!isLoading ? (
          <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-solid ring-1 ring-inset ring-brand-200 dark:ring-brand-300/20">
            {t('mentoring.mentorCount', { count: totalElements })}
          </span>
        ) : undefined}
      />

      {/* Thanh Search Bar & Sort Dropdown gọn gàng bọc Card chuẩn */}
      <Card hover={false} className="p-3.5 sm:p-4 relative z-20">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* Input ô tìm kiếm */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-text-subtle">
              <Search className="h-4 w-4 text-primary-solid" aria-hidden="true" />
            </div>

            <input
              type="text"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              placeholder={t('mentoring.searchMentorsPlaceholder')}
              aria-label={t('mentoring.exploreMentors')}
              className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-10 pr-9 text-sm font-medium text-text transition placeholder:text-text-subtle focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            {localKeyword && (
              <button
                type="button"
                onClick={handleClear}
                aria-label={t('common.clearSearch')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-subtle transition-colors hover:text-text-muted cursor-pointer"
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
                { value: 'reputationScore_desc', label: t('mentoring.sortReputation') },
                { value: 'rating_desc', label: t('mentoring.sortRating') },
                { value: 'completedMissions_desc', label: t('mentoring.sortCompletedMissions') },
                { value: 'fullName_asc', label: t('mentoring.sortName') },
              ]}
              placeholder={t('mentoring.sortResults')}
              align="right"
              icon={<ArrowUpDown className="h-3.5 w-3.5 text-primary-solid" />}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
