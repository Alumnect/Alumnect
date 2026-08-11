/**
 * EntitySelectField — Ô chọn ĐƠN dạng field + dropdown (danh sách phẳng) cho form.
 *
 * Dùng chung cho chọn THỂ LOẠI và NGÀNH khi đặt câu hỏi (UC40). Mỗi câu hỏi gắn tối đa một
 * thể loại và một ngành, độc lập nhau. Hỗ trợ ô tìm kiếm (khi danh sách dài như ngành) và
 * icon riêng cho từng mục (tùy chọn).
 */
import { useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'

/** Một lựa chọn phẳng trong field. */
export type SelectOption = { id: number; name: string }

export function EntitySelectField({
  items,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  buttonIcon,
  searchable = false,
  itemIcon,
}: {
  items: SelectOption[] | undefined
  value: number | null
  onChange: (id: number | null) => void
  placeholder: string
  searchPlaceholder?: string
  buttonIcon?: ReactNode
  searchable?: boolean
  itemIcon?: (name: string) => ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Đóng khi bấm ra ngoài. (Dropdown nằm trong modal đã có portal riêng.)
  useClickOutside(ref, () => setOpen(false), open)

  const list = items ?? []
  const q = query.trim().toLowerCase()
  const filtered = q ? list.filter((it) => it.name.toLowerCase().includes(q)) : list
  const selected = list.find((it) => it.id === value) ?? null

  const pick = (id: number | null) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      {/* Nút mở field — hiển thị mục đang chọn */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-xl border bg-plum-900/[0.03] px-4 text-sm transition-colors',
          open ? 'border-brand-400/60 ring-2 ring-brand-500/30' : 'border-plum-900/10 hover:border-plum-900/20',
        )}
      >
        {selected && itemIcon ? itemIcon(selected.name) : buttonIcon}
        <span className={cn('flex-1 truncate text-left', selected ? 'text-plum-900' : 'text-plum-400')}>{selected ? selected.name : placeholder}</span>
        <ChevronDown size={16} className={cn('shrink-0 text-plum-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-plum-900/10 bg-cream-50 p-2 shadow-xl">
          {searchable && (
            <div className="mb-1 flex items-center gap-2 rounded-lg bg-plum-900/[0.04] px-3">
              <Search size={14} className="shrink-0 text-plum-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder ?? 'Tìm…'}
                className="h-9 w-full bg-transparent text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto">
            {/* Bỏ chọn */}
            <button
              type="button"
              onClick={() => pick(null)}
              className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors', value == null ? 'bg-brand-500/10 font-semibold text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]')}
            >
              <span className="flex-1">{placeholder}</span>
              {value == null && <Check size={15} className="text-brand-600" />}
            </button>

            <div className="my-1 h-px bg-plum-900/[0.06]" />

            {filtered.map((it) => {
              const isSel = value === it.id
              return (
                <button
                  type="button"
                  key={it.id}
                  onClick={() => pick(it.id)}
                  className={cn('flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors', isSel ? 'bg-brand-500/10 font-medium text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]')}
                >
                  {itemIcon?.(it.name)}
                  <span className="flex-1">{it.name}</span>
                  {isSel && <Check size={15} className="text-brand-600" />}
                </button>
              )
            })}

            {filtered.length === 0 && <p className="px-3 py-4 text-center text-xs text-plum-400">Không tìm thấy</p>}
          </div>
        </div>
      )}
    </div>
  )
}
