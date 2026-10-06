import React, { useState, useRef, useEffect } from 'react'
import { Building2, ChevronDown, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FPT_CAMPUSES } from '../model/userTypes'

interface CampusSelectProps {
  value: string
  onChange: (campus: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
}

export function CampusSelect({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = '-- Chọn Cơ sở FPT University --',
}: CampusSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleSelect = (campus: string) => {
    onChange(campus)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={cn('relative text-left', className)} ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-2xl border border-plum-900/10 bg-white py-3 px-4 text-sm font-semibold cursor-pointer transition-all shadow-xs',
          isOpen
            ? 'border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/10'
            : 'hover:border-brand-500/50 hover:bg-plum-50/30',
          disabled && 'opacity-60 cursor-not-allowed bg-plum-50/50',
          value ? 'text-plum-900 font-bold' : 'text-plum-400 font-normal'
        )}
      >
        <span className="flex items-center gap-2.5 truncate">
          <Building2
            size={17}
            className={value ? 'text-brand-500' : 'text-plum-400'}
          />
          <span className="truncate">{value || placeholder}</span>
        </span>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-plum-400 hover:text-plum-700 hover:bg-plum-900/[0.05] transition-colors"
              title="Bỏ chọn"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn(
              'text-plum-400 transition-transform duration-200 shrink-0',
              isOpen && 'rotate-180 text-brand-500'
            )}
          />
        </div>
      </div>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-full bg-white rounded-3xl border border-plum-900/10 shadow-2xl overflow-hidden animate-scale-up p-1.5">
          <div className="px-3 py-2 text-[11px] font-extrabold text-plum-400 uppercase tracking-wider border-b border-plum-900/5 mb-1 flex items-center justify-between">
            <span>Cơ sở FPT University</span>
            <span className="text-[10px] lowercase font-normal text-plum-400/80">5 cơ sở</span>
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {FPT_CAMPUSES.map((campus) => {
              const isSelected = value === campus
              return (
                <button
                  key={campus}
                  type="button"
                  onClick={() => handleSelect(campus)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-left transition-all cursor-pointer',
                    isSelected
                      ? 'bg-brand-50 text-brand-600 font-bold'
                      : 'text-plum-800 hover:bg-plum-50/80 hover:text-plum-900'
                  )}
                >
                  <span className="truncate">{campus}</span>
                  {isSelected && (
                    <Check size={16} className="text-brand-600 shrink-0 stroke-[2.5]" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
