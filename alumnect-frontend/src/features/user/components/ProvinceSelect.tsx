import React, { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Search, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const VIETNAM_PROVINCES = [
  'Đà Nẵng',
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Cần Thơ',
  'Hải Phòng',
  'An Giang',
  'Bà Rịa - Vũng Tàu',
  'Bắc Giang',
  'Bắc Kạn',
  'Bạc Liêu',
  'Bắc Ninh',
  'Bến Tre',
  'Bình Định',
  'Bình Dương',
  'Bình Phước',
  'Bình Thuận',
  'Cà Mau',
  'Cao Bằng',
  'Đắk Lắk',
  'Đắk Nông',
  'Điện Biên',
  'Đồng Nai',
  'Đồng Tháp',
  'Gia Lai',
  'Hà Giang',
  'Hà Nam',
  'Hà Tĩnh',
  'Hải Dương',
  'Hậu Giang',
  'Hòa Bình',
  'Hưng Yên',
  'Khánh Hòa',
  'Kiên Giang',
  'Kon Tum',
  'Lai Châu',
  'Lâm Đồng',
  'Lạng Sơn',
  'Lào Cai',
  'Long An',
  'Nam Định',
  'Nghệ An',
  'Ninh Bình',
  'Ninh Thuận',
  'Phú Thọ',
  'Phú Yên',
  'Quảng Bình',
  'Quảng Nam',
  'Quảng Ngãi',
  'Quảng Ninh',
  'Quảng Trị',
  'Sóc Trăng',
  'Sơn La',
  'Tây Ninh',
  'Thái Bình',
  'Thái Nguyên',
  'Thanh Hóa',
  'Thừa Thiên Huế',
  'Tiền Giang',
  'Trà Vinh',
  'Tuyên Quang',
  'Vĩnh Long',
  'Vĩnh Phúc',
  'Yên Bái',
]

interface ProvinceSelectProps {
  value: string
  onChange: (city: string) => void
  disabled?: boolean
}

export function ProvinceSelect({ value, onChange, disabled }: ProvinceSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Click outside to close
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

  const filteredProvinces = VIETNAM_PROVINCES.filter((prov) =>
    prov.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (prov: string) => {
    onChange(prov)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="relative text-left" ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between rounded-2xl border border-border bg-surface py-3 px-4 text-sm font-semibold cursor-pointer transition shadow-sm',
          isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-brand-50/10'
            : 'hover:border-brand-500/50 hover:bg-plum-50/30',
          disabled && 'opacity-60 cursor-not-allowed bg-surface-2',
          value ? 'text-text font-bold' : 'text-text-subtle font-normal'
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <MapPin size={16} className={value ? 'text-primary-solid' : 'text-text-subtle'} />
          <span>{value || '-- Chọn Tỉnh / Thành phố hiện tại --'}</span>
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-text-subtle hover:text-text-muted hover:bg-surface-2 transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn(
              'text-text-subtle transition-transform duration-200 shrink-0',
              isOpen && 'rotate-180 text-primary-solid'
            )}
          />
        </div>
      </div>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 z-50 w-full bg-surface rounded-3xl border border-border shadow-2xl overflow-hidden animate-scale-up">
          {/* Search Bar */}
          <div className="p-3 border-b border-border bg-plum-50/30">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-text-subtle" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên Tỉnh / Thành phố..."
                className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-3 text-xs text-text placeholder-plum-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* List of Provinces */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-0.5">
            {filteredProvinces.length > 0 ? (
              filteredProvinces.map((prov) => {
                const isSelected = value === prov
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleSelect(prov)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition',
                      isSelected
                        ? 'bg-primary-soft text-primary-solid font-extrabold'
                        : 'text-text hover:bg-plum-50/70 hover:text-text'
                    )}
                  >
                    <span>{prov}</span>
                    {isSelected && <Check size={14} className="text-primary-solid shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-text-subtle font-medium">
                Không tìm thấy Tỉnh / Thành phố phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
