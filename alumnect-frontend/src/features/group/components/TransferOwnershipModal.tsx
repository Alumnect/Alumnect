/**
 * TransferOwnershipModal — Owner chọn thành viên nhận quyền sở hữu trước khi rời hội nhóm.
 * Thành công thì Owner cũ rời nhóm và thành viên được chọn trở thành Owner mới (Backend xử lý trong 1 giao dịch).
 */
import { useState } from 'react'
import { Crown, Loader2, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar, Modal, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGroupMembers } from '../hooks/useGroups'
import { useLeaveGroup } from '../hooks/useGroupActions'

export function TransferOwnershipModal({ groupId, currentUserId, onClose, onDone }: { groupId: number; currentUserId: number; onClose: () => void; onDone: () => void }) {
  const { t } = useTranslation()
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
          toast.success(res.message || t('groups.transferSuccess'))
          onDone()
        },
        onError: (err) => toast.error((err as Error).message || t('groups.transferError')),
      },
    )
  }

  return (
    <Modal
      isOpen
      onClose={leaveMut.isPending ? () => undefined : onClose}
      title={t('groups.transferOwnershipTitle')}
      icon={<Crown size={16} />}
      maxWidthClassName="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="md" onClick={onClose} disabled={leaveMut.isPending}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" size="md" onClick={confirm} disabled={selected === null || leaveMut.isPending} leftIcon={leaveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : undefined}>
            {t('groups.transferAndLeave')}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-text-subtle">{t('groups.transferOwnershipNotice')}</p>
      <div className="relative mb-3">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
        <input
          aria-label={t('groups.searchMemberPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('groups.searchMemberPlaceholder')}
          className="h-10 w-full rounded-xl bg-surface-2 pl-10 pr-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-8 text-text-subtle">
          <Loader2 size={20} className="animate-spin" />
        </div>
      ) : candidates.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-subtle">{t('groups.noMembersMatch')}</p>
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
                  selected === m.userId ? 'border-brand-400/70 bg-primary-soft' : 'border-border hover:bg-surface-2',
                )}
              >
                <Avatar src={m.avatarUrl ?? ''} name={m.fullName} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-text">{m.fullName}</span>
                  {m.headline && <span className="block truncate text-xs text-text-subtle">{m.headline}</span>}
                </span>
                {m.role === 'ADMIN' && <span className="text-xs font-semibold text-primary-solid">{t('groups.adminRole')}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="pt-3 text-center">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? t('common.loading') : t('common.loadMore')}
          </Button>
        </div>
      )}
    </Modal>
  )
}
