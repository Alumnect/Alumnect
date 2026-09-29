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
    { key: 'settings', label: 'Cài đặt & Trạng thái', icon: Settings2 },
  ]

  return (
    <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-6 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <div className="mb-6 flex gap-1.5 rounded-2xl bg-plum-900/[0.04] p-1.5 dark:bg-[#3a3b3c]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all',
              tab === t.key
                ? 'bg-white text-plum-900 shadow-sm dark:bg-[#242526] dark:text-white'
                : 'text-plum-500 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
            )}
          >
            <t.icon size={16} /> {t.label}
            {!!t.badge && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-black text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <JoinRequestsList groupId={group.id} />
      ) : (
        <div className="space-y-3.5">
          <SettingRow
            title="Chỉnh sửa thông tin hội nhóm"
            description="Cập nhật tên, ảnh bìa, mô tả chi tiết, danh mục ngành nghề, chủ đề hashtags và quy định tham gia nhóm."
          >
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PencilLine size={14} />}
              onClick={() => setEditOpen(true)}
              disabled={isInactive}
              className="rounded-xl font-bold"
            >
              Chỉnh sửa
            </Button>
          </SettingRow>

          {isOwner && (
            <>
              <SettingRow
                title={isInactive ? 'Mở lại hội nhóm' : 'Tạm ngừng hội nhóm'}
                description={
                  isInactive
                    ? 'Cho phép thành viên mới tham gia và hoạt động bình thường trở lại.'
                    : 'Tạm ngừng hoạt động: Ẩn nhóm khỏi danh sách khám phá công khai và không nhận thêm thành viên mới.'
                }
              >
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={isInactive ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                  disabled={statusMut.isPending}
                  onClick={() => (isInactive ? changeStatus('ACTIVE') : setCloseOpen(true))}
                  className="rounded-xl font-bold"
                >
                  {isInactive ? 'Mở lại nhóm' : 'Tạm ngừng'}
                </Button>
              </SettingRow>

              <SettingRow
                title="Xóa vĩnh viễn hội nhóm"
                description="Xóa bỏ hội nhóm khỏi hệ thống AlumNect. Toàn bộ thành viên sẽ mất quyền truy cập và thao tác này không thể hoàn tác."
                danger
              >
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Trash2 size={14} />}
                  className="rounded-xl from-rose-600 to-rose-500 font-bold shadow-none hover:from-rose-700 hover:to-rose-600"
                  onClick={() => setDeleteOpen(true)}
                >
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
        title="Tạm ngừng hoạt động hội nhóm"
        message="Hội nhóm sẽ tạm ngừng hoạt động: Không hiển thị ở danh sách khám phá và không tiếp nhận thêm thành viên. Bạn có thể mở lại bất cứ lúc nào."
        confirmLabel="Xác nhận tạm ngừng"
        loading={statusMut.isPending}
        onConfirm={() => changeStatus('INACTIVE')}
        onClose={() => setCloseOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Xóa vĩnh viễn hội nhóm"
        message={
          <>
            Bạn có chắc chắn muốn xóa hội nhóm <b>{group.name}</b>? Toàn bộ dữ liệu thành viên sẽ không thể phục hồi sau khi xóa.
          </>
        }
        confirmLabel="Xác nhận xóa"
        danger
        loading={deleteMut.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteOpen(false)}
      />
    </Card>
  )
}

function SettingRow({
  title,
  description,
  danger,
  children,
}: {
  title: string
  description: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4.5 transition-all',
        danger
          ? 'border-rose-500/30 bg-rose-500/5 dark:border-rose-900/40 dark:bg-rose-950/20'
          : 'border-plum-900/[0.07] bg-white dark:border-[#393a3b] dark:bg-[#242526]',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-extrabold', danger ? 'text-rose-600 dark:text-rose-400' : 'text-plum-900 dark:text-white')}>
          {title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-plum-500 dark:text-[#b0b3b8]">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
