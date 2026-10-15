import { useRef, useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

export interface SelectOption<T = string | number> {
  value: T
  label: string
  sublabel?: string
  icon?: ReactNode
}

interface SelectDropdownProps<T = string | number> {
  value?: T | null | ''
  onChange: (val: T) => void
  options: SelectOption<T>[]
  placeholder: string
  icon?: ReactNode
  className?: string
  panelClassName?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  direction?: 'auto' | 'top' | 'bottom'
  align?: 'left' | 'right' | 'auto'
}

export function SelectDropdown<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder,
  icon,
  className,
  panelClassName,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm…',
  disabled = false,
  direction = 'auto',
  align = 'auto',
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [actualDirection, setActualDirection] = useState<'top' | 'bottom'>('bottom')
  const [actualAlign, setActualAlign] = useState<'left' | 'right'>('left')
  const containerRef = useRef<HTMLDivElement>(null)

  // Đóng khi click ngoài
  useClickOutside(containerRef, () => {
    setOpen(false)
    setQuery('')
  }, open)

  // Tự động phát hiện hướng mở và căn chỉnh mép màn hình
  useEffect(() => {
    if (!open || !containerRef.current) return
    if (direction === 'top') {
      setActualDirection('top')
    } else if (direction === 'bottom') {
      setActualDirection('bottom')
    } else {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      if (spaceBelow < 260 && spaceAbove > spaceBelow) {
        setActualDirection('top')
      } else {
        setActualDirection('bottom')
      }
    }

    if (align === 'right') {
      setActualAlign('right')
    } else if (align === 'left') {
      setActualAlign('left')
    } else {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.left
      if (spaceRight < 280) {
        setActualAlign('right')
      } else {
        setActualAlign('left')
      }
    }
  }, [open, direction, align])

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const cleanQuery = query.trim().toLowerCase()
  const filteredOptions = cleanQuery
    ? options.filter((opt) => opt.label.toLowerCase().includes(cleanQuery) || opt.sublabel?.toLowerCase().includes(cleanQuery))
    : options

  const handleSelect = (val: T) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  // Tự động bật tìm kiếm nếu số lượng item > 8
  const shouldSearch = searchable || options.length > 8

  return (
    <div className={cn('relative w-full', open ? 'z-30' : 'z-auto', className)} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'group flex h-10 w-full items-center gap-2 rounded-2xl border bg-surface px-3.5 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer',
          disabled && 'opacity-60 cursor-not-allowed pointer-events-none',
          open
            ? 'border-primary ring-2 ring-primary/20 text-primary-solid'
            : selectedOption && selectedOption.value !== ''
            ? 'border-border-strong text-text hover:border-primary'
            : 'border-border text-text-muted hover:border-border-strong'
        )}
      >
        {icon && (
          <span className="shrink-0 text-text-subtle transition-colors group-hover:text-primary-solid">
            {icon}
          </span>
        )}

        <span className="flex-1 truncate text-left">
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={14}
          className={cn(
            'shrink-0 text-text-subtle transition-transform duration-200',
            open && 'rotate-180 text-primary-solid'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: actualDirection === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: actualDirection === 'top' ? 4 : -4 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className={cn(
              'absolute z-30 min-w-full w-max max-w-[calc(100vw-2rem)] sm:max-w-xs overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-2xl shadow-plum-950/20 dark:shadow-black/70',
              actualAlign === 'right' ? 'right-0 left-auto' : 'left-0',
              actualDirection === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
              panelClassName
            )}
          >
            {/* Thanh tìm kiếm bên trong nếu nhiều items */}
            {shouldSearch && (
              <div className="mb-1.5 flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-2.5 py-1.5">
                <Search size={13} className="shrink-0 text-text-subtle" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  autoFocus
                  className="w-full bg-transparent text-xs text-text placeholder:text-text-subtle focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="shrink-0 text-text-subtle hover:text-text-muted"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Danh sách Options */}
            <div className="max-h-56 overflow-y-auto space-y-0.5 [scrollbar-width:thin] pr-0.5">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-text-subtle">
                  Không tìm thấy lựa chọn nào
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value)

                  return (
                    <button
                      type="button"
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors cursor-pointer',
                        isSelected
                          ? 'bg-primary-soft font-bold text-primary-solid'
                          : 'font-medium text-text-muted hover:bg-surface-2 hover:text-text'
                      )}
                    >
                      <span className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-xs text-text-subtle">
                            {opt.sublabel}
                          </span>
                        )}
                      </span>

                      {isSelected && (
                        <Check size={14} className="shrink-0 text-primary-solid" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
