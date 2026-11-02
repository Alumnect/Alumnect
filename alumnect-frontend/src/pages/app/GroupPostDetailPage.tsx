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
import { useTranslation } from 'react-i18next'
import { Card, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { GroupPostCard, useGroupDetail, useGroupPostDetail } from '@/features/group'

/** Trạng thái lỗi/không có quyền dùng chung một khung thẻ cho gọn. */
function StateCard({ icon, title, description, actions }: { icon: React.ReactNode; title: string; description: string; actions: React.ReactNode }) {
  return (
    <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-border p-12 text-center shadow-card dark:bg-surface">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-text-subtle">{icon}</span>
      <div>
        <h2 className="text-xl font-extrabold text-text">{title}</h2>
        <p className="mt-1.5 text-sm text-text-subtle">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2.5 pt-2">{actions}</div>
    </Card>
  )
}

export function GroupPostDetailPage() {
  const { t } = useTranslation()
  const { groupId: groupIdParam, postId: postIdParam } = useParams<{ groupId: string; postId: string }>()
  const groupId = Number(groupIdParam)
  const postId = Number(postIdParam)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: group, isLoading: groupLoading } = useGroupDetail(groupIdParam, user?.id ?? 'guest')
  const { data: post, isLoading: postLoading, isError, error, refetch } = useGroupPostDetail(groupId, postId)

  const backToGroup = `/app/groups/${groupIdParam}`
  const backLink = (
    <Link to={backToGroup} className="inline-flex items-center gap-2 text-sm font-semibold text-text-subtle transition-colors hover:text-primary-solid">
      <ArrowLeft size={16} /> {group ? t('groups.backToGroup', { name: group.name }) : t('groups.backToGroupGeneric')}
    </Link>
  )

  if (!Number.isFinite(groupId) || !Number.isFinite(postId)) {
    return (
      <div className="mx-auto max-w-2xl py-10">
        <StateCard
          icon={<SearchX size={28} />}
          title={t('groups.postNotFound')}
          description={t('groups.invalidPostUrl')}
          actions={
            <Link to="/app/groups">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>{t('groups.backToGroupList')}</Button>
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
            title={t('groups.privateGroupTitle')}
            description={t('groups.privateGroupDesc')}
            actions={
              <Link to={backToGroup}>
                <Button variant="primary" size="sm" leftIcon={<Users2 size={14} />}>{t('groups.viewGroup')}</Button>
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
            title={t('groups.postNotFound')}
            description={t('groups.postNotFoundDesc')}
            actions={
              <Link to={backToGroup}>
                <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>{t('groups.backToGroupGeneric')}</Button>
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
          title={t('groups.postLoadError')}
          description={(error as Error | null)?.message ?? t('common.error')}
          actions={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>{t('common.tryAgain')}</Button>
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
