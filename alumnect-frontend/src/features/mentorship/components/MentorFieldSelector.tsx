import { useRef } from 'react'
import { Briefcase, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/primitives'
import type { SupportedIndustryItem } from '../model/mentorRegistrationTypes'

interface MentorFieldSelectorProps {
  fields: SupportedIndustryItem[]
  selectedFieldId: number | null
  onSelectField: (fieldId: number) => void
  isLoading?: boolean
}

/**
 * Bộ chọn lĩnh vực chuyên môn (ngành nghề) theo phong cách tab cuộn ngang mượt mà.
 */
export function MentorFieldSelector({
  fields,
  selectedFieldId,
  onSelectField,
  isLoading = false,
}: MentorFieldSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-1">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="min-w-0 flex-1 flex gap-2 overflow-x-hidden rounded-2xl border border-plum-900/[0.08] bg-white p-2.5 dark:border-white/10 dark:bg-[#242526]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-xl shrink-0" />
          ))}
        </div>
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      </div>
    )
  }

  if (!fields || fields.length === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {/* Nút cuộn trái nằm bên ngoài */}
      <button
        type="button"
        onClick={() => handleScroll('left')}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-plum-900/10 bg-white text-plum-700 shadow-xs transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 active:scale-95 dark:border-white/10 dark:bg-[#242526] dark:text-white dark:hover:bg-[#303132] dark:hover:text-brand-400"
        aria-label="Cuộn sang trái"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Khung cuộn chứa danh sách tab lĩnh vực */}
      <div className="min-w-0 flex-1 rounded-2xl border border-plum-900/[0.08] bg-white p-1.5 shadow-xs dark:border-white/10 dark:bg-[#242526]">
        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory items-center gap-2 overflow-x-auto scroll-smooth px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {fields.map((field) => {
            const isSelected = selectedFieldId === field.id

            return (
              <button
                key={field.id}
                type="button"
                onClick={() => onSelectField(field.id)}
                className={cn(
                  'inline-flex min-h-11 shrink-0 snap-start cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200',
                  isSelected
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30 ring-2 ring-brand-500/20 dark:bg-brand-600'
                    : 'border border-plum-900/10 bg-white/90 text-plum-700 hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-600 dark:border-[#393a3b] dark:bg-[#242526] dark:text-[#b0b3b8] dark:hover:text-[#e4e6eb]',
                )}
                aria-pressed={isSelected}
              >
                <Briefcase className={cn('h-3.5 w-3.5', isSelected ? 'text-white' : 'text-plum-400 dark:text-[#8a8d91]')} />
                <span>{field.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nút cuộn phải nằm bên ngoài */}
      <button
        type="button"
        onClick={() => handleScroll('right')}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-plum-900/10 bg-white text-plum-700 shadow-xs transition-all hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 active:scale-95 dark:border-white/10 dark:bg-[#242526] dark:text-white dark:hover:bg-[#303132] dark:hover:text-brand-400"
        aria-label="Cuộn sang phải"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
