/**
 * JoinRequestsList — Danh sách yêu cầu tham gia đang chờ duyệt của hội nhóm (chỉ Owner/Admin).
 * Mỗi yêu cầu có nút Chấp nhận / Từ chối; sau khi xử lý danh sách và số lượng thành viên tự làm mới.
 */
import { Link } from 'react-router-dom'
import { Check, Inbox, Loader2, X } from 'lucide-react'
import { Avatar, EmptyState, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useJoinRequests } from '../hooks/useGroups'
import { useHandleJoinRequest } from '../hooks/useGroupActions'

export function JoinRequestsList({ groupId }: { groupId: number }) {
  const { data, isLoading, isError, error, hasNextPage, fetchNextPage, isFetchingNextPage } = useJoinRequests(groupId, true)
  const handleMut = useHandleJoinRequest(groupId)

  const requests = data?.pages.flatMap((p) => p.items) ?? []

  const handle = (requestId: number, action: 'APPROVE' | 'REJECT') => {
    handleMut.mutate(
      { requestId, action },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã xử lý yêu cầu.'),
        onError: (err) => toast.error((err as Error).message || 'Không thể xử lý yêu cầu, vui lòng thử lại.'),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-plum-900/[0.05]" />
        ))}
      </div>
    )
  }
  if (isError) {
    return <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-600">{(error as Error)?.message ?? 'Không tải được danh sách yêu cầu.'}</p>
  }
  if (requests.length === 0) {
    return <EmptyState icon={<Inbox size={22} />} title="Không có yêu cầu nào đang chờ duyệt" description="Khi có người gửi yêu cầu tham gia, họ sẽ xuất hiện ở đây." className="py-10" />
  }

  const busyId = handleMut.isPending ? handleMut.variables?.requestId : undefined

  return (
    <div>
      <ul className="divide-y divide-plum-900/5">
        {requests.map((r) => {
          const busy = busyId === r.requestId
          return (
            <li key={r.requestId} className="flex flex-wrap items-center gap-3 py-3">
              <Link to={`/app/profile?userId=${r.userId}`} className="shrink-0">
                <Avatar src={r.avatarUrl ?? ''} name={r.fullName} size={42} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/app/profile?userId=${r.userId}`} className="block truncate text-sm font-semibold text-plum-900 hover:text-brand-600">
                  {r.fullName}
                </Link>
                <p className="truncate text-xs text-plum-500">
                  {r.headline ? `${r.headline} · ` : ''}
                  {r.requestedAt ? `Gửi lúc ${new Date(r.requestedAt).toLocaleString('vi-VN')}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="primary" size="sm" disabled={handleMut.isPending} onClick={() => handle(r.requestId, 'APPROVE')} leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}>
                  Chấp nhận
                </Button>
                <Button variant="secondary" size="sm" disabled={handleMut.isPending} onClick={() => handle(r.requestId, 'REJECT')} leftIcon={<X size={14} />}>
                  Từ chối
                </Button>
              </div>
            </li>
          )
        })}
      </ul>
      {hasNextPage && (
        <div className="pt-3 text-center">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'Đang tải…' : 'Tải thêm yêu cầu'}
          </Button>
        </div>
      )}
    </div>
  )
}
