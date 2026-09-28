/**
 * GroupDetailPage — Trang chi tiết một hội nhóm.
 *
 * Trách nhiệm:
 *  - Hiển thị ảnh bìa, thông tin, mô tả, chủ đề, quy định tham gia, người sáng lập và danh sách thành viên.
 *  - Nhóm riêng tư + người xem chưa là thành viên: chỉ thấy thông tin công khai, ẩn người sáng lập và danh sách thành viên.
 *  - Nút thao tác đổi theo quyền: Guest / chưa tham gia / chờ duyệt / thành viên / Owner-Admin.
 *  - Owner/Admin mở bảng "Quản lý hội nhóm" (duyệt yêu cầu, chỉnh sửa, đóng/xóa nhóm).
 *  - Rời nhóm có xác nhận; Owner còn thành viên khác phải chuyển quyền sở hữu trước khi rời.
 */
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Info, Lock, ScrollText, SearchX, Tag } from 'lucide-react'
import { Badge, Card, Skeleton, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import {
  ConfirmDialog,
  GroupDetailHeader,
  GroupManagePanel,
  GroupMembersList,
  TransferOwnershipModal,
  isManagerRole,
  useGroupDetail,
  useLeaveGroup,
} from '@/features/group'

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const viewerUserId = user ? Number(user.id) : null

  const { data: group, isLoading, isError, error, refetch } = useGroupDetail(id, user?.id ?? 'guest')
  const leaveMut = useLeaveGroup()

  const [manageOpen, setManageOpen] = useState(searchParams.get('manage') === '1')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !group) {
    const notFound = (error as (Error & { status?: number }) | null)?.status === 404
    return (
      <div className="mx-auto max-w-2xl">
        <Card hover={false} className="flex flex-col items-center gap-3 p-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400">{notFound ? <SearchX size={24} /> : <AlertTriangle size={24} />}</span>
          <div>
            <p className="font-bold text-plum-900">{notFound ? 'Không tìm thấy hội nhóm' : 'Không tải được hội nhóm'}</p>
            <p className="mt-1 text-sm text-plum-500">{notFound ? 'Hội nhóm này không tồn tại hoặc đã bị xóa.' : ((error as Error)?.message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.')}</p>
          </div>
          <div className="flex gap-2">
            {!notFound && (
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Thử lại
              </Button>
            )}
            <Link to="/app/groups">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                Về danh sách hội nhóm
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  const isManager = isManagerRole(group.viewerRole)
  const isOwner = group.viewerRole === 'OWNER'
  const isSoleOwner = isOwner && group.memberCount <= 1
  const isPrivateOutsider = group.privacy === 'PRIVATE' && group.viewerMembershipStatus !== 'ACTIVE'

  const handleLeave = () => {
    // Owner còn thành viên khác → phải chọn người nhận quyền sở hữu; ngược lại chỉ cần xác nhận.
    if (isOwner && group.memberCount > 1) setTransferOpen(true)
    else setConfirmLeave(true)
  }

  const confirmLeaveNow = () => {
    leaveMut.mutate(
      { id: group.id },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã rời khỏi hội nhóm.')
          setConfirmLeave(false)
          setManageOpen(false)
        },
        onError: (err) => toast.error((err as Error).message || 'Không thể rời nhóm, vui lòng thử lại.'),
      },
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/app/groups" className="inline-flex items-center gap-1.5 text-sm font-semibold text-plum-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={15} /> Tất cả hội nhóm
      </Link>

      <GroupDetailHeader group={group} onManage={() => setManageOpen((v) => !v)} onLeave={handleLeave} />

      {isManager && manageOpen && <GroupManagePanel group={group} />}

      {group.status === 'INACTIVE' && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-700">
          <Info size={16} className="shrink-0" /> Hội nhóm đang tạm ngừng hoạt động và không nhận thành viên mới.
        </div>
      )}

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-extrabold text-plum-900">Giới thiệu</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-plum-700">{group.description}</p>

        {group.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <Tag size={14} className="text-plum-400" />
            {group.topics.map((t) => (
              <Badge key={t} tone="neutral" className="px-2.5 py-0.5 text-[11px] normal-case">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {group.joinRules && (
          <div className="mt-5 rounded-xl bg-plum-900/[0.04] p-4">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-sm font-bold text-plum-900">
              <ScrollText size={15} /> Quy định tham gia
            </p>
            <p className="whitespace-pre-line text-sm text-plum-600">{group.joinRules}</p>
          </div>
        )}

        {isPrivateOutsider && (
          <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            <Lock size={16} className="mt-0.5 shrink-0" />
            <span>Đây là hội nhóm riêng tư. Bạn cần gửi yêu cầu tham gia và được Owner/Admin duyệt để xem thành viên và nội dung dành riêng cho thành viên.</span>
          </div>
        )}
      </Card>

      <Card hover={false} className="p-5 sm:p-6">
        <h2 className="mb-3 text-lg font-extrabold text-plum-900">Thành viên</h2>
        <GroupMembersList groupId={group.id} canView={group.canViewMembers} viewerRole={group.viewerRole} viewerUserId={viewerUserId} />
      </Card>

      <ConfirmDialog
        open={confirmLeave}
        title="Rời khỏi hội nhóm"
        message={
          isSoleOwner ? (
            <>
              Bạn là thành viên cuối cùng của <b>{group.name}</b>. Nếu rời nhóm, hội nhóm sẽ bị xóa. Bạn có chắc chắn muốn tiếp tục?
            </>
          ) : (
            <>
              Bạn có chắc muốn rời khỏi <b>{group.name}</b>? Bạn sẽ mất quyền truy cập nội dung dành riêng cho thành viên.
            </>
          )
        }
        confirmLabel={leaveMut.isPending ? 'Đang xử lý…' : 'Rời nhóm'}
        danger
        loading={leaveMut.isPending}
        onConfirm={confirmLeaveNow}
        onClose={() => setConfirmLeave(false)}
      />

      {transferOpen && viewerUserId !== null && (
        <TransferOwnershipModal
          groupId={group.id}
          currentUserId={viewerUserId}
          onClose={() => setTransferOpen(false)}
          onDone={() => {
            setTransferOpen(false)
            setManageOpen(false)
          }}
        />
      )}

    </div>
  )
}
