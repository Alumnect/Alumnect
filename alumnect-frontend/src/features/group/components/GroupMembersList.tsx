/**
 * GroupMembersList — Danh sách thành viên ACTIVE của hội nhóm: tìm theo tên, xem vai trò, phân trang "Tải thêm".
 * Owner/Admin thấy thêm thao tác quản lý theo đúng phạm vi quyền:
 *  - Owner: phân quyền / thu hồi quyền Admin, xóa bất kỳ thành viên nào (trừ chính mình).
 *  - Admin: chỉ xóa được thành viên thông thường.
 * Nhóm riêng tư mà người xem chưa là thành viên: ẩn danh sách (`canView = false`).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Loader2, Lock, Search, ShieldCheck, ShieldOff, UserX, X } from 'lucide-react'
import { useTranslation, Trans } from 'react-i18next'
import { Avatar, Badge, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGroupMembers } from '../hooks/useGroups'
import { useChangeMemberRole, useRemoveMember } from '../hooks/useGroupActions'
import { GROUP_SEARCH_MAX } from '../model/group'
import type { GroupMember, GroupRole } from '../model/group'
import { ConfirmDialog } from './ConfirmDialog'

export function GroupMembersList({ groupId, canView, viewerRole, viewerUserId }: { groupId: number; canView: boolean; viewerRole: GroupRole | null; viewerUserId: number | null }) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const keyword = useDebouncedValue(search, 400)
  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useGroupMembers(groupId, keyword, canView)
  const { data: managerData } = useGroupMembers(groupId, '', canView && viewerRole === 'OWNER')
  const removeMut = useRemoveMember(groupId)
  const roleMut = useChangeMemberRole(groupId)
  const [toRemove, setToRemove] = useState<GroupMember | null>(null)

  const getRoleLabel = (role: GroupRole): string => {
    switch (role) {
      case 'OWNER':
        return t('groups.ownerRole')
      case 'ADMIN':
        return t('groups.adminRole')
      default:
        return t('groups.memberRole')
    }
  }

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-text-subtle">
          <Lock size={22} />
        </span>
        <p className="font-bold text-text">{t('groups.membersOnlyListTitle')}</p>
        <p className="max-w-sm text-sm text-text-subtle">{t('groups.membersOnlyListDesc')}</p>
      </div>
    )
  }

  const members = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0
  const hasAdmin = managerData?.pages.some((page) => page.items.some((member) => member.role === 'ADMIN')) ?? true

  /** Quyền thao tác của người xem đối với một thành viên cụ thể. */
  const canRemove = (m: GroupMember) => m.userId !== viewerUserId && ((viewerRole === 'OWNER' && m.role !== 'OWNER') || (viewerRole === 'ADMIN' && m.role === 'MEMBER'))
  const canChangeRole = (m: GroupMember) => viewerRole === 'OWNER' && m.userId !== viewerUserId
    && m.role !== 'OWNER' && (m.role === 'ADMIN' || !hasAdmin)

  const changeRole = (m: GroupMember) => {
    const role = m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    roleMut.mutate(
      { userId: m.userId, role },
      {
        onSuccess: (res) => toast.success(res.message || t('groups.roleUpdated')),
        onError: (err) => toast.error((err as Error).message || t('groups.roleUpdateError')),
      },
    )
  }

  const confirmRemove = () => {
    if (!toRemove) return
    removeMut.mutate(toRemove.userId, {
      onSuccess: (res) => {
        toast.success(res.message || t('groups.memberRemoved')),
        setToRemove(null)
      },
      onError: (err) => toast.error((err as Error).message || t('groups.memberRemoveError')),
    })
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
        <input
          aria-label={t('groups.searchMemberPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={GROUP_SEARCH_MAX}
          placeholder={t('groups.searchMemberPlaceholder')}
          className="h-10 w-full rounded-xl bg-surface-2 pl-10 pr-9 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {search && (
          <button onClick={() => setSearch('')} aria-label={t('groups.clearSearch')} className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-text-subtle hover:bg-border">
            <X size={13} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{(error as Error)?.message ?? t('groups.loadMembersError')}</p>
      ) : members.length === 0 ? (
        <EmptyState icon={<Search size={22} />} title={t('groups.noMembers')} description={keyword ? t('groups.noMembersMatch') : t('groups.noMembersDesc')} className="py-10" />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">{t('groups.membersCount', { count: total })}</p>
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-3">
                <Link to={`/app/profile?userId=${m.userId}`} className="shrink-0">
                  <Avatar src={m.avatarUrl ?? ''} name={m.fullName} size={42} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/app/profile?userId=${m.userId}`} className="block truncate text-sm font-semibold text-text hover:text-primary-solid">
                    {m.fullName}
                  </Link>
                  {m.headline && <p className="truncate text-xs text-text-subtle">{m.headline}</p>}
                </div>
                {m.role !== 'MEMBER' && (
                  <Badge tone={m.role === 'OWNER' ? 'gold' : 'brand'} icon={m.role === 'OWNER' ? <Crown size={10} /> : <ShieldCheck size={10} />} className="px-2 py-0.5 text-xs">
                    {getRoleLabel(m.role)}
                  </Badge>
                )}
                {(canChangeRole(m) || canRemove(m)) && (
                  <div className="flex shrink-0 items-center gap-2">
                    {canChangeRole(m) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => changeRole(m)}
                        disabled={roleMut.isPending}
                        leftIcon={m.role === 'ADMIN' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        className="w-auto px-3.5 justify-center rounded-full border-border-strong text-xs font-semibold text-text-muted hover:bg-surface-2"
                      >
                        {m.role === 'ADMIN' ? t('groups.revokeAdmin') : t('groups.assignAdmin')}
                      </Button>
                    )}
                    {canRemove(m) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setToRemove(m)}
                        aria-label={t('groups.removeMemberAria', { name: m.fullName })}
                        leftIcon={<UserX size={14} />}
                        className="w-auto px-3.5 justify-center rounded-full border-danger-border text-xs font-semibold text-danger hover:bg-danger-soft hover:border-danger-border"
                      >
                        {t('groups.deleteAction')}
                      </Button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          {hasNextPage && (
            <div className="pt-3 text-center">
              <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} leftIcon={isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : undefined}>
                {isFetchingNextPage ? t('common.loading') : t('groups.loadMoreMembers')}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        title={t('groups.removeMember')}
        message={
          <Trans
            i18nKey="groups.removeMemberConfirmText"
            values={{ name: toRemove?.fullName }}
            components={{ b: <b /> }}
          />
        }
        confirmLabel={t('groups.removeMemberFromGroupConfirm')}
        danger
        loading={removeMut.isPending}
        onConfirm={confirmRemove}
        onClose={() => setToRemove(null)}
      />
    </div>
  )
}
