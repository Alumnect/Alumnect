/**
 * GroupMembershipActions — bộ nút thao tác theo trạng thái tham gia của người xem (dùng chung cho thẻ và trang chi tiết).
 *
 *  - Guest: "Đăng nhập để tham gia" (mở popup mời đăng nhập).
 *  - Chưa tham gia (NONE/REJECTED/LEFT/REMOVED): "Tham gia" (nhóm công khai) / "Gửi yêu cầu tham gia" (nhóm riêng tư).
 *  - Đang chờ duyệt (PENDING): "Đang chờ duyệt" + "Hủy yêu cầu".
 *  - Thành viên (ACTIVE): "Đã tham gia" + (trang chi tiết) "Rời nhóm".
 *  - Owner/Admin: "Quản lý hội nhóm" (+ "Rời nhóm" ở trang chi tiết).
 *  - Tài khoản Admin hệ thống chỉ xem, không có nút thao tác.
 */
import { CheckCircle2, Clock, Loader2, LogIn, LogOut, Settings2, UserPlus } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { toast } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { useLoginPrompt } from '@/store/loginPrompt'
import { useJoinGroup, useLeaveGroup } from '../hooks/useGroupActions'
import { isManagerRole } from '../model/group'
import type { GroupPrivacy, GroupRole, GroupStatus, ViewerMembershipStatus } from '../model/group'

type Props = {
  group: { id: number; privacy: GroupPrivacy; status: GroupStatus; viewerMembershipStatus: ViewerMembershipStatus; viewerRole: GroupRole | null }
  size?: 'sm' | 'md'
  /** Nút "Quản lý hội nhóm": truyền onManage để xử lý tại chỗ (trang chi tiết), bỏ trống thì điều hướng sang trang chi tiết (thẻ). */
  onManage?: () => void
  /** Có hiển thị nút "Rời nhóm" hay không (chỉ ở trang chi tiết); onLeave do trang quyết định luồng xác nhận/chuyển quyền. */
  onLeave?: () => void
  className?: string
  hideManageButton?: boolean
}

export function GroupMembershipActions({ group, size = 'sm', onManage, onLeave, className, hideManageButton }: Props) {
  const user = useAuthStore((s) => s.user)
  const promptLogin = useLoginPrompt((s) => s.open)
  const joinMut = useJoinGroup()
  const leaveMut = useLeaveGroup()

  if (!user) {
    return (
      <div className={className}>
        <Button variant="primary" size={size} leftIcon={<LogIn size={15} />} onClick={() => promptLogin('Đăng nhập để tham gia hội nhóm.')}>
          Đăng nhập để tham gia
        </Button>
      </div>
    )
  }
  if (user.role !== 'STUDENT' && user.role !== 'ALUMNI') return null

  const { id, privacy, status, viewerMembershipStatus, viewerRole } = group

  const handleJoin = () => {
    joinMut.mutate(id, {
      onSuccess: (res) => toast.success(res.message || 'Thành công!'),
      onError: (err) => toast.error((err as Error).message || 'Không thể tham gia hội nhóm, vui lòng thử lại.'),
    })
  }
  const handleCancel = () => {
    leaveMut.mutate(
      { id },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã hủy yêu cầu.'),
        onError: (err) => toast.error((err as Error).message || 'Không thể hủy yêu cầu, vui lòng thử lại.'),
      },
    )
  }

  const leaveButton = onLeave ? (
    <Button variant="secondary" size={size} leftIcon={<LogOut size={15} />} onClick={onLeave}>
      Rời nhóm
    </Button>
  ) : null

  if (viewerMembershipStatus === 'ACTIVE') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
        {!hideManageButton && (
          isManagerRole(viewerRole) ? (
            onManage ? (
              <Button variant="primary" size={size} leftIcon={<Settings2 size={15} />} onClick={onManage}>
                Quản lý hội nhóm
              </Button>
            ) : (
              <ButtonLink to={`/app/groups/${id}?manage=1`} variant="primary" size={size} leftIcon={<Settings2 size={15} />}>
                Quản lý hội nhóm
              </ButtonLink>
            )
          ) : (
            <Button variant="outline" size={size} disabled leftIcon={<CheckCircle2 size={15} />}>
              Đã tham gia
            </Button>
          )
        )}
        {leaveButton}
      </div>
    )
  }

  if (viewerMembershipStatus === 'PENDING') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
        <Button variant="outline" size={size} disabled leftIcon={<Clock size={15} />}>
          Đang chờ duyệt
        </Button>
        <Button variant="secondary" size={size} onClick={handleCancel} disabled={leaveMut.isPending} leftIcon={leaveMut.isPending ? <Loader2 size={15} className="animate-spin" /> : undefined}>
          Hủy yêu cầu
        </Button>
      </div>
    )
  }

  if (status !== 'ACTIVE') {
    return (
      <div className={className}>
        <Button variant="outline" size={size} disabled>
          Tạm ngừng hoạt động
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button
        variant="primary"
        size={size}
        onClick={handleJoin}
        disabled={joinMut.isPending}
        leftIcon={joinMut.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
      >
        {privacy === 'PRIVATE' ? 'Gửi yêu cầu tham gia' : 'Tham gia'}
      </Button>
    </div>
  )
}
