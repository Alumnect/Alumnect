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
  buttonClassName?: string
  panelClassName?: string
  searchable?: boolean
  searchPlaceholder?: string
  disabled?: boolean
  direction?: 'auto' | 'top' | 'bottom'
  align?: 'left' | 'right' | 'auto'
  /** Tên trường cho trình đọc màn hình (ví dụ "Ngành"); nếu thiếu dùng placeholder. */
  label?: string
}

export function SelectDropdown<T extends string | number = string | number>({
  value,
  onChange,
  options,
  placeholder,
  icon,
  className,
  buttonClassName,
  panelClassName,
  searchable = false,
  searchPlaceholder = 'Tìm kiếm…',
  disabled = false,
  direction = 'auto',
  align = 'auto',
  label,
}: SelectDropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [actualDirection, setActualDirection] = useState<'top' | 'bottom'>('bottom')
  const [actualAlign, setActualAlign] = useState<'left' | 'right'>('left')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

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
      if (spaceBelow < 320 && spaceAbove > spaceBelow) {
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
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(cleanQuery) ||
          opt.sublabel?.toLowerCase().includes(cleanQuery) ||
          String(opt.value).toLowerCase().includes(cleanQuery)
      )
    : options

  const handleSelect = (val: T) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  // Tự động bật tìm kiếm nếu số lượng item > 8
  const shouldSearch = searchable || options.length > 8

  // Mở danh sách (không có ô tìm kiếm): đưa tiêu điểm vào mục đang chọn / mục đầu tiên để dùng phím mũi tên ngay
  useEffect(() => {
    if (!open || shouldSearch) return
    const raf = requestAnimationFrame(() => {
      const items = listRef.current?.querySelectorAll<HTMLButtonElement>('[role=option]')
      if (!items?.length) return
      const selected = Array.from(items).find((el) => el.getAttribute('aria-selected') === 'true')
      ;(selected ?? items[0]).focus({ preventScroll: false })
    })
    return () => cancelAnimationFrame(raf)
  }, [open, shouldSearch])

  // Bàn phím: ↑/↓/Home/End di chuyển giữa các mục, Esc đóng và trả tiêu điểm về nút, ↓ trên nút để mở
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      setQuery('')
      triggerRef.current?.focus()
      return
    }
    if (!open) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target === triggerRef.current && !disabled) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Home' || e.key === 'End') {
      const items = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role=option]') ?? [])
      if (!items.length) return
      e.preventDefault()
      const index = items.indexOf(document.activeElement as HTMLButtonElement)
      let next = index
      if (e.key === 'ArrowDown') next = index < 0 ? 0 : Math.min(items.length - 1, index + 1)
      else if (e.key === 'ArrowUp') next = index <= 0 ? 0 : index - 1
      else if (e.key === 'Home') next = 0
      else next = items.length - 1
      items[next].focus()
    }
  }

  return (
    <div className={cn('relative w-full', open ? 'z-50' : 'z-auto', className)} ref={containerRef} onKeyDown={handleKeyDown} data-popup-open={open || undefined}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label ? `${label}: ${selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}` : undefined}
        className={cn(
          'group flex h-10 w-full items-center gap-2 rounded-2xl border bg-surface px-3.5 text-sm font-semibold transition duration-200 cursor-pointer',
          disabled && 'opacity-60 cursor-not-allowed pointer-events-none',
          open
            ? 'border-primary ring-2 ring-primary/20 text-primary-solid'
            : selectedOption && selectedOption.value !== ''
            ? 'border-border-strong text-text hover:border-primary'
            : 'border-border text-text-muted hover:border-border-strong',
          buttonClassName
        )}
      >
        {(selectedOption?.icon ?? icon) && (
          <span className="shrink-0 flex items-center text-text-subtle transition-colors group-hover:text-primary-solid">
            {selectedOption?.icon ?? icon}
          </span>
        )}

        <span className="flex-1 truncate text-left flex items-center gap-2">
          <span className={selectedOption && selectedOption.value !== '' ? 'text-text font-semibold truncate' : 'text-text-muted font-normal truncate'}>
            {selectedOption && selectedOption.value !== '' ? selectedOption.label : placeholder}
          </span>
          {selectedOption && selectedOption.value !== '' && selectedOption.sublabel && (
            <span className="text-text-subtle font-normal truncate hidden sm:inline text-xs">
              {selectedOption.sublabel}
            </span>
          )}
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
              'absolute z-50 min-w-full w-max max-w-[calc(100vw-2rem)] sm:max-w-xs overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-2xl shadow-plum-950/20 dark:shadow-black/70',
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
                  <button aria-label="Đóng"
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
            <div ref={listRef} role="listbox" aria-label={label ?? placeholder} className="max-h-60 overflow-y-auto space-y-0.5 [scrollbar-width:thin] pr-0.5">
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
                      role="option"
                      aria-selected={isSelected}
                      key={String(opt.value)}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer focus-visible:bg-surface-2 focus-visible:outline-none',
                        isSelected
                          ? 'bg-primary-soft font-bold text-primary-solid'
                          : 'font-medium text-text-muted hover:bg-surface-2 hover:text-text'
                      )}
                    >
                      <span className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                        {opt.icon && <span className="shrink-0 flex items-center">{opt.icon}</span>}
                        <span className="truncate font-semibold">{opt.label}</span>
                        {opt.sublabel && (
                          <span className="text-xs text-text-subtle truncate">
                            {opt.sublabel}
                          </span>
                        )}
                      </span>

                      {isSelected && (
                        <Check size={14} className="shrink-0 text-primary-solid ml-2" />
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
