/**
 * TopicSelectField — Picker chọn chủ đề PHÂN CẤP (đơn chọn) cho form đặt câu hỏi (UC40).
 *
 * Thay cho <select> gốc (xấu, khó chọn ngành cha): dropdown tùy biến cho phép
 *  - Chọn thẳng NGÀNH LỚN (chủ đề cha), hoặc
 *  - Bung ngành ra để chọn một CHỦ ĐỀ CON cụ thể.
 * Giao diện đồng bộ với bộ lọc chủ đề ở trang diễn đàn.
 */
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useClickOutside } from '@/hooks/useClickOutside'
import type { Topic } from '../model/question'
import { TopicIcon } from '../lib/topicIcons'

export function TopicSelectField({ topics, value, onChange }: { topics: Topic[] | undefined; value: number | null; onChange: (id: number | null) => void }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const list = topics ?? []
  const parents = list.filter((t) => t.parentId == null)
  const childrenOf = (pid: number) => list.filter((t) => t.parentId === pid)
  const selected = list.find((t) => t.id === value) ?? null

  // Icon hiển thị ở nút: dùng icon của NGÀNH (kể cả khi đang chọn một chủ đề con) cho trực quan.
  const selectedIconName = selected ? (selected.parentId == null ? selected.name : (list.find((t) => t.id === selected.parentId)?.name ?? '')) : ''

  // Đóng khi bấm ra ngoài. (Dropdown nằm trong modal đã có portal riêng.)
  useClickOutside(ref, () => setOpen(false), open)

  // Mở sẵn ngành chứa chủ đề con đang được chọn, để người dùng thấy ngay lựa chọn hiện tại.
  useEffect(() => {
    if (open && selected?.parentId != null) setExpanded(selected.parentId)
  }, [open, selected])

  const pick = (id: number | null) => {
    onChange(id)
    setOpen(false)
  }

  const rowBase = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors'

  return (
    <div className="relative" ref={ref}>
      {/* Nút mở picker — hiển thị chủ đề đang chọn */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-11 w-full items-center gap-2.5 rounded-xl border bg-plum-900/[0.03] px-4 text-sm transition-colors',
          open ? 'border-brand-400/60 ring-2 ring-brand-500/30' : 'border-plum-900/10 hover:border-plum-900/20',
        )}
      >
        {selected ? <TopicIcon name={selectedIconName} size={16} className="shrink-0 text-brand-600" /> : <LayoutGrid size={16} className="shrink-0 text-plum-400" />}
        <span className={cn('flex-1 truncate text-left', selected ? 'text-plum-900' : 'text-plum-400')}>{selected ? selected.name : '— Chưa chọn chủ đề —'}</span>
        <ChevronDown size={16} className={cn('shrink-0 text-plum-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-xl border border-plum-900/10 bg-cream-50 p-2 shadow-xl">
          {/* Bỏ chọn chủ đề */}
          <button type="button" onClick={() => pick(null)} className={cn(rowBase, value == null ? 'bg-brand-500/10 font-semibold text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]')}>
            <LayoutGrid size={16} className="text-plum-400" />
            <span className="flex-1">— Chưa chọn chủ đề —</span>
            {value == null && <Check size={15} className="text-brand-600" />}
          </button>

          <div className="my-1 h-px bg-plum-900/[0.06]" />

          {parents.map((p) => {
            const kids = childrenOf(p.id)
            const hasKids = kids.length > 0
            const isOpen = expanded === p.id
            const parentSelected = value === p.id
            return (
              <div key={p.id}>
                <div className="flex items-center rounded-lg transition-colors hover:bg-plum-900/[0.04]">
                  {/* Bấm để chọn thẳng NGÀNH LỚN làm chủ đề */}
                  <button
                    type="button"
                    onClick={() => pick(p.id)}
                    className={cn('flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium', parentSelected ? 'text-brand-700' : 'text-plum-800')}
                  >
                    <TopicIcon name={p.name} size={16} className={parentSelected ? 'text-brand-600' : 'text-plum-400'} />
                    <span className="flex-1">{p.name}</span>
                    {parentSelected && <Check size={15} className="text-brand-600" />}
                  </button>
                  {/* Bung/thu chủ đề con */}
                  {hasKids && (
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : p.id)}
                      aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'}
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-plum-400 hover:text-plum-700"
                    >
                      <ChevronDown size={15} className={cn('transition-transform', isOpen && 'rotate-180')} />
                    </button>
                  )}
                </div>

                {hasKids && isOpen && (
                  <div className="ml-4 border-l border-plum-900/[0.08] pl-2">
                    {kids.map((c) => {
                      const childSelected = value === c.id
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => pick(c.id)}
                          className={cn(rowBase, childSelected ? 'bg-brand-500/10 font-medium text-brand-700' : 'text-plum-600 hover:bg-plum-900/[0.04]')}
                        >
                          <span className="flex-1">{c.name}</span>
                          {childSelected && <Check size={15} className="text-brand-600" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
