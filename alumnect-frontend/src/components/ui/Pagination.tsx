import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

export interface PaginationProps {
  page: number // 0-indexed
  totalPages: number
  onPageChange: (page: number) => void
  scrollToTop?: boolean
  className?: string
  prevLabel?: string
  nextLabel?: string
}

export function getPaginationItems(current: number, total: number) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i)
  }
  const items: (number | 'ellipsis-start' | 'ellipsis-end')[] = []
  if (current <= 3) {
    for (let i = 0; i < 4; i++) items.push(i)
    items.push('ellipsis-end')
    items.push(total - 1)
  } else if (current >= total - 4) {
    items.push(0)
    items.push('ellipsis-start')
    for (let i = total - 4; i < total; i++) items.push(i)
  } else {
    items.push(0)
    items.push('ellipsis-start')
    items.push(current - 1)
    items.push(current)
    items.push(current + 1)
    items.push('ellipsis-end')
    items.push(total - 1)
  }
  return items
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  scrollToTop = true,
  className,
  prevLabel = 'Trang trước',
  nextLabel = 'Trang sau',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const handlePageSelect = (targetPage: number) => {
    if (targetPage === page || targetPage < 0 || targetPage >= totalPages) return
    onPageChange(targetPage)
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isFirst = page <= 0
  const isLast = page >= totalPages - 1
  const items = getPaginationItems(page, totalPages)

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 border-t border-slate-200/60 pt-4 mt-6',
        className
      )}
    >
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<ChevronLeft size={16} />}
        disabled={isFirst}
        onClick={() => handlePageSelect(page - 1)}
        className="rounded-full shadow-2xs font-semibold px-3"
      >
        {prevLabel}
      </Button>

      <div className="flex items-center gap-1.5 px-1">
        {items.map((item, idx) => {
          if (typeof item === 'string') {
            return (
              <span key={item + idx} className="px-1 text-xs text-slate-400 select-none">
                ...
              </span>
            )
          }

          const isCurrent = item === page
          return (
            <button
              key={item}
              type="button"
              onClick={() => handlePageSelect(item)}
              aria-label={`Trang ${item + 1}`}
              aria-current={isCurrent ? 'page' : undefined}
              className={cn(
                'grid h-8 min-w-[32px] place-items-center rounded-lg px-2 text-xs font-semibold transition-all',
                isCurrent
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
              )}
            >
              {item + 1}
            </button>
          )
        })}
      </div>

      <Button
        variant="secondary"
        size="sm"
        rightIcon={<ChevronRight size={16} />}
        disabled={isLast}
        onClick={() => handlePageSelect(page + 1)}
        className="rounded-full shadow-2xs font-semibold px-3"
      >
        {nextLabel}
      </Button>
    </div>
  )
}
