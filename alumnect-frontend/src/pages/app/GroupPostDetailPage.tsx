/**
 * GroupPostDetailPage — Trang chi tiết một bài viết trong hội nhóm (`/app/groups/:groupId/posts/:postId`).
 *
 * Trách nhiệm:
 *  - Lấy chi tiết bài viết qua `useGroupPostDetail` và thông tin hội nhóm qua `useGroupDetail` (quyền thành viên, trạng thái nhóm, chủ đề).
 *  - Tái sử dụng `GroupPostCard` (nội dung, ảnh/video, thích, bình luận lồng, sửa/xóa/ghim, chia sẻ) ở chế độ chi tiết: khung bình luận mở sẵn.
 *  - Xử lý đầy đủ trạng thái: loading (skeleton) / không tồn tại (404) / không có quyền xem nhóm riêng tư (403) / lỗi hệ thống (thử lại) / thành công.
 *  - Sau khi xóa bài viết thì quay về trang hội nhóm.
 */
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Lock, SearchX, Users2 } from 'lucide-react'
import { Card, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { GroupPostCard, useGroupDetail, useGroupPostDetail } from '@/features/group'

/** Trạng thái lỗi/không có quyền dùng chung một khung thẻ cho gọn. */
function StateCard({ icon, title, description, actions }: { icon: React.ReactNode; title: string; description: string; actions: React.ReactNode }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-plum-900/[0.08] p-12 text-center shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400 dark:bg-white/5">{icon}</span>
      <div>
        <h2 className="text-xl font-extrabold text-plum-900 dark:text-white">{title}</h2>
        <p className="mt-1.5 text-sm text-plum-500 dark:text-[#b0b3b8]">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 pt-2">{actions}</div>
    </Card>
  )
}

export function GroupPostDetailPage() {
  const { groupId: groupIdParam, postId: postIdParam } = useParams<{ groupId: string; postId: string }>()
  const groupId = Number(groupIdParam)
  const postId = Number(postIdParam)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: group, isLoading: groupLoading } = useGroupDetail(groupIdParam, user?.id ?? 'guest')
  const { data: post, isLoading: postLoading, isError, error, refetch } = useGroupPostDetail(groupId, postId)

  const backToGroup = `/app/groups/${groupIdParam}`
  const backLink = (
    <Link to={backToGroup} className="inline-flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:text-brand-400">
      <ArrowLeft size={16} /> {group ? `Quay lại ${group.name}` : 'Quay lại hội nhóm'}
    </Link>
  )

  if (!Number.isFinite(groupId) || !Number.isFinite(postId)) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <StateCard
          icon={<SearchX size={28} />}
          title="Không tìm thấy bài viết"
          description="Đường dẫn bài viết không hợp lệ."
          actions={
            <Link to="/app/groups">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>Về danh sách hội nhóm</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (postLoading || groupLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-12">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </div>
    )
  }

  if (isError || !post) {
    const status = (error as (Error & { status?: number }) | null)?.status
    if (status === 403) {
      return (
        <div className="mx-auto max-w-2xl space-y-4 py-6">
          {backLink}
          <StateCard
            icon={<Lock size={28} />}
            title="Hội nhóm riêng tư"
            description="Chỉ thành viên của hội nhóm mới xem được bài viết này. Hãy tham gia hội nhóm để xem nội dung và thảo luận cùng mọi người."
            actions={
              <Link to={backToGroup}>
                <Button variant="primary" size="sm" leftIcon={<Users2 size={14} />}>Xem hội nhóm</Button>
              </Link>
            }
          />
        </div>
      )
    }
    if (status === 404) {
      return (
        <div className="mx-auto max-w-2xl space-y-4 py-6">
          {backLink}
          <StateCard
            icon={<SearchX size={28} />}
            title="Không tìm thấy bài viết"
            description="Bài viết này không tồn tại, đã bị xóa hoặc hội nhóm không còn khả dụng."
            actions={
              <Link to={backToGroup}>
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>Về hội nhóm</Button>
              </Link>
            }
          />
        </div>
      )
    }
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        {backLink}
        <StateCard
          icon={<AlertTriangle size={28} />}
          title="Không tải được bài viết"
          description={(error as Error | null)?.message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.'}
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Thử lại</Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      {backLink}

      <GroupPostCard
        post={post}
        groupId={groupId}
        isActiveMember={group?.viewerMembershipStatus === 'ACTIVE'}
        isGroupActive={group ? group.status === 'ACTIVE' : true}
        topics={group?.topics ?? []}
        detailMode
        onDeleted={() => navigate(backToGroup, { replace: true })}
      />
    </div>
  )
}
