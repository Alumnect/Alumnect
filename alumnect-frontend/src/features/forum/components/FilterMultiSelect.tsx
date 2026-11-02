/**
 * FilterMultiSelect — Bộ lọc ĐA CHỌN dạng pill + dropdown checklist (danh sách phẳng).
 *
 * Dùng chung cho lọc THỂ LOẠI và NGÀNH ở trang diễn đàn (UC38). Hai bộ lọc hoạt động độc lập,
 * mỗi cái là một instance riêng. Hỗ trợ ô tìm kiếm (khi danh sách dài như ngành) và icon
 * riêng cho từng mục (tùy chọn — thể loại có icon, ngành không).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

/** Một lựa chọn phẳng trong bộ lọc. */
export type FilterOption = { id: number; name: string }

/** Ô tick 2 trạng thái (chọn / không). */
function TickBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition-colors',
        checked ? 'border-primary bg-primary-solid text-on-primary' : 'border-border-strong bg-transparent',
      )}
    >
      {checked && <Check size={12} strokeWidth={3} />}
    </span>
  )
}

export function FilterMultiSelect({
  buttonIcon,
  allLabel,
  noun,
  items,
  selected,
  onChange,
  searchable = false,
  itemIcon,
}: {
  buttonIcon: ReactNode
  allLabel: string
  noun: string
  items: FilterOption[] | undefined
  selected: number[]
  onChange: (ids: number[]) => void
  searchable?: boolean
  itemIcon?: (name: string) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Đóng khi bấm ra ngoài — dùng ref (không phải lớp phủ toàn màn hình) để KHÔNG chặn nút bên cạnh.
  useClickOutside(ref, () => setOpen(false), open)

  const list = items ?? []
  const q = query.trim().toLowerCase()
  const filtered = q ? list.filter((it) => it.name.toLowerCase().includes(q)) : list
  const isSelected = (id: number) => selected.includes(id)
  const toggle = (id: number) => onChange(isSelected(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const label = selected.length === 0 ? allLabel : `Đã chọn ${selected.length} ${noun}`

  // Mở danh sách (không có ô tìm kiếm): đưa tiêu điểm vào mục đầu tiên để dùng phím mũi tên ngay
  useEffect(() => {
    if (!open || searchable) return
    const raf = requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>('[role=option]')?.focus())
    return () => cancelAnimationFrame(raf)
  }, [open, searchable])

  // Bàn phím: Esc đóng + trả tiêu điểm, ↓ mở, ↑/↓/Home/End di chuyển giữa các mục
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (!open) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target === triggerRef.current) {
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
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : e.key === 'ArrowDown' ? (index < 0 ? 0 : Math.min(items.length - 1, index + 1)) : Math.max(0, index - 1)
      items[next].focus()
    }
  }

  return (
    <div className="relative" ref={ref} onKeyDown={onKeyDown} data-popup-open={open || undefined}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:bg-border"
      >
        {buttonIcon}
        <span>{label}</span>
        <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl card-surface p-2 shadow-lg ring-1 ring-border">
          {searchable && (
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-surface-2 px-3">
              <Search size={14} className="shrink-0 text-text-subtle" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Tìm ${noun}…`}
                className="h-9 w-full bg-transparent text-sm text-text placeholder:text-text-subtle focus:outline-none"
              />
            </div>
          )}

          <div ref={listRef} role="listbox" aria-multiselectable="true" aria-label={allLabel} className="max-h-72 overflow-y-auto">
            {/* Hàng "Tất cả …" = xóa toàn bộ lựa chọn của bộ lọc này */}
            <button
              type="button"
              role="option"
              aria-selected={selected.length === 0}
              onClick={() => onChange([])}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                selected.length === 0 ? 'bg-primary-soft text-primary-solid' : 'text-text-muted hover:bg-surface-2',
              )}
            >
              <span className="flex-1 text-left">{allLabel}</span>
              {selected.length === 0 && <Check size={15} className="text-primary-solid" />}
            </button>

            <div className="my-1 h-px bg-border" />

            {filtered.map((it) => (
              <button
                key={it.id}
                type="button"
                role="option"
                aria-selected={isSelected(it.id)}
                onClick={() => toggle(it.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-text-muted transition-colors hover:bg-surface-2"
              >
                <TickBox checked={isSelected(it.id)} />
                {itemIcon?.(it.name)}
                <span className="flex-1">{it.name}</span>
              </button>
            ))}

            {filtered.length === 0 && <p className="px-3 py-4 text-center text-xs text-text-subtle">Không tìm thấy {noun}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
