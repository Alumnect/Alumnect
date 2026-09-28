/**
 * GroupMembersList — Danh sách thành viên ACTIVE của hội nhóm: tìm theo tên, xem vai trò, phân trang "Tải thêm".
 * Owner/Admin thấy thêm thao tác quản lý theo đúng phạm vi quyền:
 *  - Owner: phân quyền / thu hồi quyền Admin, xóa bất kỳ thành viên nào (trừ chính mình).
 *  - Admin: chỉ xóa được thành viên thông thường.
 * Nhóm riêng tư mà người xem chưa là thành viên: ẩn danh sách (`canView = false`).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Loader2, Lock, Search, ShieldCheck, ShieldOff, UserMinus, X } from 'lucide-react'
import { Avatar, Badge, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useGroupMembers } from '../hooks/useGroups'
import { useChangeMemberRole, useRemoveMember } from '../hooks/useGroupActions'
import { GROUP_SEARCH_MAX } from '../model/group'
import type { GroupMember, GroupRole } from '../model/group'
import { ConfirmDialog } from './ConfirmDialog'

const ROLE_LABEL: Record<GroupRole, string> = { OWNER: 'Chủ sở hữu', ADMIN: 'Quản trị viên', MEMBER: 'Thành viên' }

export function GroupMembersList({ groupId, canView, viewerRole, viewerUserId }: { groupId: number; canView: boolean; viewerRole: GroupRole | null; viewerUserId: number | null }) {
  const [search, setSearch] = useState('')
  const keyword = useDebouncedValue(search, 400)
  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useGroupMembers(groupId, keyword, canView)
  const removeMut = useRemoveMember(groupId)
  const roleMut = useChangeMemberRole(groupId)
  const [toRemove, setToRemove] = useState<GroupMember | null>(null)

  if (!canView) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-plum-900/15 px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">
          <Lock size={22} />
        </span>
        <p className="font-bold text-plum-900">Danh sách thành viên chỉ dành cho thành viên nhóm</p>
        <p className="max-w-sm text-sm text-plum-500">Hãy tham gia hội nhóm để xem thành viên và nội dung dành riêng cho thành viên.</p>
      </div>
    )
  }

  const members = data?.pages.flatMap((p) => p.items) ?? []
  const total = data?.pages[0]?.total ?? 0

  /** Quyền thao tác của người xem đối với một thành viên cụ thể. */
  const canRemove = (m: GroupMember) => m.userId !== viewerUserId && ((viewerRole === 'OWNER' && m.role !== 'OWNER') || (viewerRole === 'ADMIN' && m.role === 'MEMBER'))
  const canChangeRole = (m: GroupMember) => viewerRole === 'OWNER' && m.userId !== viewerUserId && m.role !== 'OWNER'

  const changeRole = (m: GroupMember) => {
    const role = m.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    roleMut.mutate(
      { userId: m.userId, role },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã cập nhật vai trò.'),
        onError: (err) => toast.error((err as Error).message || 'Không thể thay đổi vai trò.'),
      },
    )
  }

  const confirmRemove = () => {
    if (!toRemove) return
    removeMut.mutate(toRemove.userId, {
      onSuccess: (res) => {
        toast.success(res.message || 'Đã xóa thành viên.')
        setToRemove(null)
      },
      onError: (err) => toast.error((err as Error).message || 'Không thể xóa thành viên.'),
    })
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-plum-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          maxLength={GROUP_SEARCH_MAX}
          placeholder="Tìm thành viên theo tên…"
          className="h-10 w-full rounded-xl bg-plum-900/[0.04] pl-10 pr-9 text-sm text-plum-900 placeholder:text-plum-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        {search && (
          <button onClick={() => setSearch('')} aria-label="Xóa tìm kiếm" className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-plum-400 hover:bg-plum-900/[0.06]">
            <X size={13} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-plum-900/[0.05]" />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">{(error as Error)?.message ?? 'Không tải được danh sách thành viên.'}</p>
      ) : members.length === 0 ? (
        <EmptyState icon={<Search size={22} />} title="Không tìm thấy thành viên" description={keyword ? 'Thử từ khóa khác.' : 'Hội nhóm chưa có thành viên.'} className="py-10" />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-plum-400">{total} thành viên</p>
          <ul className="divide-y divide-plum-900/5">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center gap-3 py-3">
                <Link to={`/app/profile?userId=${m.userId}`} className="shrink-0">
                  <Avatar src={m.avatarUrl ?? ''} name={m.fullName} size={42} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/app/profile?userId=${m.userId}`} className="block truncate text-sm font-semibold text-plum-900 hover:text-brand-600">
                    {m.fullName}
                  </Link>
                  {m.headline && <p className="truncate text-xs text-plum-500">{m.headline}</p>}
                </div>
                {m.role !== 'MEMBER' && (
                  <Badge tone={m.role === 'OWNER' ? 'gold' : 'brand'} icon={m.role === 'OWNER' ? <Crown size={10} /> : <ShieldCheck size={10} />} className="px-2 py-0.5 text-[10px]">
                    {ROLE_LABEL[m.role]}
                  </Badge>
                )}
                {(canChangeRole(m) || canRemove(m)) && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    {canChangeRole(m) && (
                      <Button variant="outline" size="sm" onClick={() => changeRole(m)} disabled={roleMut.isPending} leftIcon={m.role === 'ADMIN' ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}>
                        {m.role === 'ADMIN' ? 'Gỡ Admin' : 'Đặt làm Admin'}
                      </Button>
                    )}
                    {canRemove(m) && (
                      <Button variant="ghost" size="sm" onClick={() => setToRemove(m)} aria-label={`Xóa ${m.fullName} khỏi nhóm`} leftIcon={<UserMinus size={14} />} className="text-rose-600 hover:text-rose-700">
                        Xóa
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
                {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm thành viên'}
              </Button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={toRemove !== null}
        title="Xóa thành viên"
        message={
          <>
            Bạn có chắc muốn xóa <b>{toRemove?.fullName}</b> khỏi hội nhóm? Người này sẽ mất quyền truy cập nội dung dành cho thành viên.
          </>
        }
        confirmLabel="Xóa khỏi nhóm"
        danger
        loading={removeMut.isPending}
        onConfirm={confirmRemove}
        onClose={() => setToRemove(null)}
      />
    </div>
  )
}
