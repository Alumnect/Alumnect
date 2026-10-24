import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthYearPickerProps {
  label?: string
  required?: boolean
  disabled?: boolean
  monthValue: string // "01".."12"
  yearValue: string // "2026"
  onChange: (month: string, year: string) => void
  maxYear?: number
  maxMonth?: number
}

export function MonthYearPicker({
  label,
  required,
  disabled,
  monthValue,
  yearValue,
  onChange,
  maxYear = new Date().getFullYear(),
  maxMonth = new Date().getMonth() + 1,
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Year currently viewed in popover grid

  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = parseInt(yearValue, 10)
    return !isNaN(parsed) ? Math.min(parsed, maxYear) : maxYear
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // Update viewYear when yearValue changes
  useEffect(() => {
    const parsed = parseInt(yearValue, 10)
    if (!isNaN(parsed)) {
      setViewYear(Math.min(parsed, maxYear))
    }
  }, [yearValue, maxYear])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handlePrevYear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setViewYear((prev) => Math.max(1980, prev - 1))
  }

  const handleNextYear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (viewYear < maxYear) {
      setViewYear((prev) => prev + 1)
    }
  }

  const handleSelectMonth = (mNum: number) => {
    const mStr = String(mNum).padStart(2, '0')
    const yStr = String(viewYear)
    onChange(mStr, yStr)
    setIsOpen(false)
  }

  const isMonthDisabled = (mNum: number) => {
    if (viewYear > maxYear) return true
    if (viewYear === maxYear && mNum > maxMonth) return true
    return false
  }

  const displayFormatted = () => {
    if (monthValue && yearValue) {
      return `Tháng ${parseInt(monthValue, 10)}, ${yearValue}`
    }
    return 'Chọn tháng/năm'
  }

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4',
    'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8',
    'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ]

  return (
    <div className="relative text-left" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Input Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-2xl border border-border bg-surface py-2.5 px-3.5 text-xs font-semibold transition shadow-sm',
          isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-brand-50/10'
            : 'hover:border-brand-500/50 hover:bg-plum-50/30',
          disabled && 'opacity-60 cursor-not-allowed bg-surface-2',
          monthValue && yearValue ? 'text-text font-bold' : 'text-text-subtle font-normal'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <Calendar size={14} className={monthValue ? 'text-primary-solid' : 'text-text-subtle'} />
          <span>{displayFormatted()}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-subtle transition-transform duration-200 shrink-0 ml-1',
            isOpen && 'rotate-180 text-primary-solid'
          )}
        />
      </button>

      {/* Floating Month/Year Selector Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-surface rounded-3xl border border-border shadow-2xl p-4 animate-scale-up">
          {/* Year Switcher Header */}
          <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-border">
            <button aria-label="Trước"
              type="button"
              onClick={handlePrevYear}
              className="p-1.5 rounded-xl text-text-subtle hover:text-text hover:bg-surface-2 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-extrabold text-sm text-text">Năm {viewYear}</span>
            <button aria-label="Sau"
              type="button"
              onClick={handleNextYear}
              disabled={viewYear >= maxYear}
              className={cn(
                'p-1.5 rounded-xl text-text-subtle transition-colors',
                viewYear >= maxYear
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:text-text hover:bg-surface-2'
              )}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* 12 Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {monthNames.map((name, index) => {
              const mNum = index + 1
              const mStr = String(mNum).padStart(2, '0')
              const isSelected =
                monthValue === mStr && String(viewYear) === yearValue
              const disabled = isMonthDisabled(mNum)

              return (
                <button
                  key={mNum}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelectMonth(mNum)}
                  className={cn(
                    'py-2 px-2 rounded-xl text-xs transition text-center select-none font-semibold',
                    isSelected
                      ? 'bg-primary-solid text-on-primary font-extrabold shadow-raised scale-[1.03]'
                      : disabled
                      ? 'opacity-30 cursor-not-allowed text-plum-300 bg-plum-50/20'
                      : 'bg-surface-2 text-text-muted hover:bg-primary-soft hover:text-primary-solid hover:scale-[1.02]'
                  )}
                >
                  {name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
