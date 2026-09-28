/**
 * GroupManagePanel — Bảng "Quản lý hội nhóm" cho Owner/Admin, gồm 2 tab:
 *  - "Yêu cầu tham gia": duyệt / từ chối yêu cầu (kèm số yêu cầu đang chờ).
 *  - "Cài đặt": chỉnh sửa thông tin (Owner/Admin); đóng/mở lại và xóa hội nhóm (chỉ Owner, có xác nhận).
 * Quản lý thành viên (xóa, phân quyền Admin) nằm ngay trong danh sách thành viên của trang chi tiết.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Inbox, PauseCircle, PencilLine, PlayCircle, Settings2, Trash2 } from 'lucide-react'
import { Card, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDeleteGroup, useSetGroupStatus } from '../hooks/useGroupActions'
import type { GroupDetail } from '../model/group'
import { ConfirmDialog } from './ConfirmDialog'
import { GroupFormModal } from './GroupFormModal'
import { JoinRequestsList } from './JoinRequestsList'

type Tab = 'requests' | 'settings'

export function GroupManagePanel({ group }: { group: GroupDetail }) {
  const navigate = useNavigate()
  const isOwner = group.viewerRole === 'OWNER'
  const [tab, setTab] = useState<Tab>('requests')
  const [editOpen, setEditOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const statusMut = useSetGroupStatus(group.id)
  const deleteMut = useDeleteGroup(group.id)

  const isInactive = group.status === 'INACTIVE'
  const pending = group.pendingRequestCount ?? 0

  const changeStatus = (next: 'ACTIVE' | 'INACTIVE') => {
    statusMut.mutate(next, {
      onSuccess: (res) => {
        toast.success(res.message || 'Đã cập nhật trạng thái hội nhóm.')
        setCloseOpen(false)
      },
      onError: (err) => toast.error((err as Error).message || 'Không thể cập nhật trạng thái hội nhóm.'),
    })
  }

  const confirmDelete = () => {
    deleteMut.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã xóa hội nhóm.')
        setDeleteOpen(false)
        navigate('/app/groups')
      },
      onError: (err) => toast.error((err as Error).message || 'Không thể xóa hội nhóm.'),
    })
  }

  const tabs: { key: Tab; label: string; icon: typeof Inbox; badge?: number }[] = [
    { key: 'requests', label: 'Yêu cầu tham gia', icon: Inbox, badge: pending },
    { key: 'settings', label: 'Cài đặt', icon: Settings2 },
  ]

  return (
    <Card hover={false} className="p-5">
      <div className="mb-4 flex gap-1 rounded-xl bg-plum-900/[0.04] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              tab === t.key ? 'bg-white text-plum-900 shadow-sm' : 'text-plum-500 hover:text-plum-900',
            )}
          >
            <t.icon size={15} /> {t.label}
            {!!t.badge && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">{t.badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <JoinRequestsList groupId={group.id} />
      ) : (
        <div className="space-y-3">
          <SettingRow title="Thông tin hội nhóm" description="Chỉnh sửa tên, ảnh bìa, mô tả, danh mục, chủ đề, loại hội nhóm và quy định tham gia.">
            <Button variant="secondary" size="sm" leftIcon={<PencilLine size={14} />} onClick={() => setEditOpen(true)} disabled={isInactive}>
              Chỉnh sửa
            </Button>
          </SettingRow>

          {isOwner && (
            <>
              <SettingRow
                title={isInactive ? 'Mở lại hội nhóm' : 'Đóng hội nhóm'}
                description={isInactive ? 'Cho phép thành viên mới tham gia và hoạt động trở lại.' : 'Tạm ngừng hoạt động: ẩn khỏi danh sách khám phá và không nhận thành viên mới. Có thể mở lại bất cứ lúc nào.'}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={isInactive ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                  disabled={statusMut.isPending}
                  onClick={() => (isInactive ? changeStatus('ACTIVE') : setCloseOpen(true))}
                >
                  {isInactive ? 'Mở lại' : 'Đóng nhóm'}
                </Button>
              </SettingRow>

              <SettingRow title="Xóa hội nhóm" description="Xóa vĩnh viễn hội nhóm khỏi hệ thống. Thao tác này không thể khôi phục." danger>
                <Button variant="primary" size="sm" leftIcon={<Trash2 size={14} />} className="from-rose-600 to-rose-500 shadow-none" onClick={() => setDeleteOpen(true)}>
                  Xóa nhóm
                </Button>
              </SettingRow>
            </>
          )}
        </div>
      )}

      {editOpen && <GroupFormModal editGroup={group} onClose={() => setEditOpen(false)} />}

      <ConfirmDialog
        open={closeOpen}
        title="Đóng hội nhóm"
        message="Hội nhóm sẽ tạm ngừng hoạt động: không hiển thị ở danh sách khám phá và không nhận thêm thành viên. Bạn có thể mở lại bất cứ lúc nào."
        confirmLabel="Đóng hội nhóm"
        loading={statusMut.isPending}
        onConfirm={() => changeStatus('INACTIVE')}
        onClose={() => setCloseOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Xóa hội nhóm"
        message={
          <>
            Bạn có chắc muốn xóa hội nhóm <b>{group.name}</b>? Toàn bộ thành viên sẽ mất quyền truy cập và thao tác này không thể hoàn tác.
          </>
        }
        confirmLabel="Xóa hội nhóm"
        danger
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </Card>
  )
}

function SettingRow({ title, description, danger, children }: { title: string; description: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3', danger ? 'border-rose-500/30 bg-rose-500/5' : 'border-plum-900/10')}>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-bold', danger ? 'text-rose-600' : 'text-plum-900')}>{title}</p>
        <p className="mt-0.5 text-xs text-plum-500">{description}</p>
      </div>
      {children}
    </div>
  )
}
