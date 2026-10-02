/**
 * TransferOwnershipModal — Owner chọn thành viên nhận quyền sở hữu trước khi rời hội nhóm.
 * Thành công thì Owner cũ rời nhóm và thành viên được chọn trở thành Owner mới (Backend xử lý trong 1 giao dịch).
 */
import { useState } from 'react'
import { Crown, Loader2, Search } from 'lucide-react'
import { Avatar, Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGroupMembers } from '../hooks/useGroups'
import { useLeaveGroup } from '../hooks/useGroupActions'

export function TransferOwnershipModal({ groupId, currentUserId, onClose, onDone }: { groupId: number; currentUserId: number; onClose: () => void; onDone: () => void }) {
  const [search, setSearch] = useState('')
  const keyword = useDebouncedValue(search, 400)
  const [selected, setSelected] = useState<number | null>(null)
  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useGroupMembers(groupId, keyword, true)
  const leaveMut = useLeaveGroup()

  const candidates = (data?.pages.flatMap((p) => p.items) ?? []).filter((m) => m.userId !== currentUserId)

  const confirm = () => {
    if (selected === null) return
    leaveMut.mutate(
      { id: groupId, transferToUserId: selected },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã chuyển quyền sở hữu và rời nhóm.')
          onDone()
        },
        onError: (err) => toast.error((err as Error).message || 'Không thể chuyển quyền sở hữu, vui lòng thử lại.'),
      },
    )
  }

  return (
    <Modal
      isOpen
      onClose={leaveMut.isPending ? () => undefined : onClose}
      title="Chuyển quyền sở hữu"
      icon={<Crown size={16} />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={leaveMut.isPending}>
            Hủy
          </Button>
          <Button variant="primary" size="md" onClick={confirm} disabled={selected === null || leaveMut.isPending} leftIcon={leaveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}>
            Chuyển quyền & rời nhóm
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-plum-500">Bạn là chủ sở hữu. Hãy chọn một thành viên để chuyển quyền sở hữu trước khi rời hội nhóm.</p>
      <div className="relative mb-3">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm thành viên theo tên…"
          className="h-10 w-full rounded-xl bg-plum-900/[0.04] pl-10 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8 text-plum-400">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-plum-500">Không có thành viên nào phù hợp.</p>
      ) : (
        <ul className="space-y-1.5">
          {candidates.map((m) => (
            <li key={m.userId}>
              <button
                type="button"
                onClick={() => setSelected(m.userId)}
                aria-pressed={selected === m.userId}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
                  selected === m.userId ? 'border-brand-400/70 bg-brand-500/10' : 'border-plum-900/10 hover:bg-plum-900/[0.03]',
                )}
              >
                <Avatar src={m.avatarUrl ?? ''} name={m.fullName} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-plum-900">{m.fullName}</span>
                  {m.headline && <span className="block truncate text-xs text-plum-500">{m.headline}</span>}
                </span>
                {m.role === 'ADMIN' && <span className="text-[11px] font-semibold text-brand-600">Quản trị viên</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="pt-3 text-center">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
          </Button>
        </div>
      )}
    </Modal>
  )
}
