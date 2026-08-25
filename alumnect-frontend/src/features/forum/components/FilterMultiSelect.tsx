/**
 * FilterMultiSelect — Bộ lọc ĐA CHỌN dạng pill + dropdown checklist (danh sách phẳng).
 *
 * Dùng chung cho lọc THỂ LOẠI và NGÀNH ở trang diễn đàn (UC38). Hai bộ lọc hoạt động độc lập,
 * mỗi cái là một instance riêng. Hỗ trợ ô tìm kiếm (khi danh sách dài như ngành) và icon
 * riêng cho từng mục (tùy chọn — thể loại có icon, ngành không).
 */
import { useRef, useState, type ReactNode } from 'react'
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
        checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-plum-900/20 bg-transparent',
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

  // Đóng khi bấm ra ngoài — dùng ref (không phải lớp phủ toàn màn hình) để KHÔNG chặn nút bên cạnh.
  useClickOutside(ref, () => setOpen(false), open)

  const list = items ?? []
  const q = query.trim().toLowerCase()
  const filtered = q ? list.filter((it) => it.name.toLowerCase().includes(q)) : list
  const isSelected = (id: number) => selected.includes(id)
  const toggle = (id: number) => onChange(isSelected(id) ? selected.filter((x) => x !== id) : [...selected, id])

  const label = selected.length === 0 ? allLabel : `Đã chọn ${selected.length} ${noun}`

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full bg-plum-900/[0.04] px-4 py-2 text-sm font-semibold text-plum-700 transition-colors hover:bg-plum-900/[0.07]"
      >
        {buttonIcon}
        <span>{label}</span>
        <ChevronDown size={15} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl card-surface p-2 shadow-lg ring-1 ring-plum-900/10">
          {searchable && (
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-plum-900/[0.04] px-3">
              <Search size={14} className="shrink-0 text-plum-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Tìm ${noun}…`}
                className="h-9 w-full bg-transparent text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none"
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto">
            {/* Hàng "Tất cả …" = xóa toàn bộ lựa chọn của bộ lọc này */}
            <button
              onClick={() => onChange([])}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                selected.length === 0 ? 'bg-brand-500/10 text-brand-700' : 'text-plum-700 hover:bg-plum-900/[0.04]',
              )}
            >
              <span className="flex-1 text-left">{allLabel}</span>
              {selected.length === 0 && <Check size={15} className="text-brand-600" />}
            </button>

            <div className="my-1 h-px bg-plum-900/[0.06]" />

            {filtered.map((it) => (
              <button
                key={it.id}
                onClick={() => toggle(it.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-plum-700 transition-colors hover:bg-plum-900/[0.04]"
              >
                <TickBox checked={isSelected(it.id)} />
                {itemIcon?.(it.name)}
                <span className="flex-1">{it.name}</span>
              </button>
            ))}

            {filtered.length === 0 && <p className="px-3 py-4 text-center text-xs text-plum-400">Không tìm thấy {noun}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
