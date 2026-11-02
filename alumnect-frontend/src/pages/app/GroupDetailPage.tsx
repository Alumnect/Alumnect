/**
 * GroupDetailPage — Trang chi tiết hội nhóm theo phong cách mạng xã hội hiện đại (Threads / Reddit / Instagram).
 *
 * Cấu trúc thiết kế:
 *  - Đầu trang: Ảnh bìa gọn, thông tin nhóm và các hành động tham gia bên dưới.
 *  - Thanh điều hướng phụ (Sub-nav Tabs): Thảo luận | Giới thiệu | Thành viên | Quản lý (cho Owner/Admin).
 *  - Bố cục 2 cột (Desktop 2-column layout):
 *     + Cột chính (68%): Luồng thảo luận cộng đồng, giới thiệu chi tiết, danh sách thành viên hoặc bảng quản lý.
 *     + Cột bên (32% sticky): Tóm tắt thông tin cộng đồng và nội quy nhanh.
 */
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Info,
  Lock,
  MessagesSquare,
  ScrollText,
  SearchX,
  Settings2,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge, Card, Skeleton, toast, FadeSwitch } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { TRANSITION } from '@/lib/motion'
import { useAuthStore } from '@/store/authStore'
import {
  ConfirmDialog,
  GroupDetailHeader,
  GroupDiscussionsFeed,
  GroupSidebarInfo,
  GroupManagePanel,
  GroupMembersList,
  TransferOwnershipModal,
  isManagerRole,
  useGroupDetail,
  useLeaveGroup,
} from '@/features/group'

type TabKey = 'discussions' | 'about' | 'members' | 'manage'

export function GroupDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((s) => s.user)
  const viewerUserId = user ? Number(user.id) : null

  const { data: group, isLoading, isError, error, refetch } = useGroupDetail(id, user?.id ?? 'guest')
  const leaveMut = useLeaveGroup()

  const initialTab: TabKey = searchParams.get('manage') === '1' ? 'manage' : 'discussions'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  // Liên kết chia sẻ cũ dạng /app/groups/{id}?postId={n} chuyển thẳng sang trang chi tiết bài viết.
  const sharedPostId = Number(searchParams.get('postId'))
  if (id && sharedPostId > 0) return <Navigate to={`/app/groups/${id}/posts/${sharedPostId}`} replace />


  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-5 pb-12">
        {/* Kích thước khớp với ảnh bìa và phần thông tin nhóm khi tải xong */}
        <Skeleton className="h-5 w-40" />
        <div className="overflow-hidden rounded-3xl">
          <Skeleton className="h-40 w-full rounded-none sm:h-52 lg:h-64 xl:h-72" />
          <Skeleton className="h-36 w-full rounded-none opacity-60" />
        </div>
        <Skeleton className="h-10 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
          <div className="hidden space-y-4 lg:col-span-4 lg:block">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !group) {
    const notFound = (error as (Error & { status?: number }) | null)?.status === 404
    return (
      <div className="mx-auto max-w-2xl py-10">
        <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-border p-12 text-center shadow-card dark:bg-surface">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-text-subtle">
            {notFound ? <SearchX size={28} /> : <AlertTriangle size={28} />}
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-text">
              {notFound ? t('groups.notFoundTitle') : t('groups.loadErrorTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-text-subtle">
              {notFound ? t('groups.notFoundDesc') : ((error as Error)?.message ?? t('common.error'))}
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            {!notFound && (
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                {t('common.tryAgain')}
              </Button>
            )}
            <Link to="/app/groups">
              <Button variant="primary" size="sm" leftIcon={<ArrowLeft size={14} />}>
                {t('groups.backToGroupList')}
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
  const isMember = group.viewerMembershipStatus === 'ACTIVE'
  const pendingRequests = group.pendingRequestCount ?? 0

  const handleLeave = () => {
    if (isOwner && group.memberCount > 1) setTransferOpen(true)
    else setConfirmLeave(true)
  }

  const confirmLeaveNow = () => {
    leaveMut.mutate(
      { id: group.id },
      {
        onSuccess: (res) => {
          toast.success(res.message || t('groups.leaveSuccess'))
          setConfirmLeave(false)
          setActiveTab('discussions')
        },
        onError: (err) => toast.error((err as Error).message || t('groups.leaveError')),
      },
    )
  }


  // Danh sách các tab
  const tabs: { key: TabKey; label: string; icon: typeof MessagesSquare; badge?: number }[] = [
    { key: 'discussions', label: t('groups.discussions'), icon: MessagesSquare },
    { key: 'about', label: t('groups.about'), icon: Info },
    { key: 'members', label: t('groups.membersTab'), icon: Users },
  ]

  if (isManager) {
    tabs.push({
      key: 'manage',
      label: t('groups.manage'),
      icon: Settings2,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      {/* Nút quay lại */}
      <Link
        to="/app/groups"
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-subtle transition-colors hover:text-primary-solid"
      >
        <ArrowLeft size={16} /> {t('groups.allGroups')}
      </Link>

      {/* Ảnh bìa và thông tin hội nhóm */}
      <GroupDetailHeader
        group={group}
        onManage={() => setActiveTab('manage')}
        onLeave={handleLeave}
      />

      {/* Thông báo nhóm tạm ngừng */}
      {group.status === 'INACTIVE' && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-warning-soft px-5 py-3 text-sm font-medium text-warning">
          <Info size={17} className="shrink-0 text-warning" />
          <span>{t('groups.inactiveNotice')}</span>
        </div>
      )}

      {/* Thanh điều hướng phụ (Sub-navigation Tabs) chuẩn Threads */}
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto scrollbar-none">
          {tabs.map((t) => {
            const isActive = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  'relative flex items-center gap-2 pb-3.5 pt-1 text-sm font-bold transition-colors whitespace-nowrap',
                  isActive
                    ? 'text-primary-solid'
                    : 'text-text-subtle hover:text-text',
                )}
              >
                <t.icon size={17} className={isActive ? 'text-primary-solid' : 'text-text-subtle'} />
                <span>{t.label}</span>
                {typeof t.badge === 'number' && (
                  <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary-solid px-1.5 text-xs font-black text-on-primary">
                    {t.badge}
                  </span>
                )}
                {/* Đường gạch chân hoạt họa khi Active */}
                {isActive && (
                  <motion.div
                    layoutId="group-active-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-solid"
                    transition={TRANSITION.indicator}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Nội dung các Tab */}
      <div className="min-h-[32rem] space-y-5 [overflow-anchor:none]">
            {/* TAB 1: THẢO LUẬN (DISCUSSIONS) */}
            <FadeSwitch id={activeTab}>
{activeTab === 'discussions' && (
              <div
                key="tab-discussions"
                className="space-y-4"
              >
                {/* Trạng thái nhóm riêng tư mà người xem chưa là thành viên */}
                {isPrivateOutsider ? (
                  <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-border p-10 text-center shadow-card dark:bg-surface">
                    <div className="grid h-16 w-16 place-items-center rounded-3xl bg-warning-soft text-warning">
                      <Lock size={32} />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-xl font-extrabold text-text">
                        {t('groups.privateGroupTitle')}
                      </h3>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0">
                      <GroupDiscussionsFeed
                        groupId={group.id}
                        groupName={group.name}
                        isActiveMember={isMember}
                        isGroupActive={group.status === 'ACTIVE'}
                        topics={group.topics}
                      />
                    </div>
                    <div className="hidden lg:block">
                      <GroupSidebarInfo group={group} isActiveMember={isMember} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GIỚI THIỆU (ABOUT & RULES) */}
            {activeTab === 'about' && (
              <div
                key="tab-about"
                className="space-y-5"
              >
                <Card hover={false} className="rounded-3xl border border-border p-6 shadow-card dark:bg-surface">
                  <h3 className="text-lg font-black text-text">{t('groups.groupDescriptionTitle')}</h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-muted">
                    {group.description}
                  </p>

                  {group.topics.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-text-subtle">
                        {t('groups.activityTopicsTitle')}
                      </h4>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {group.topics.map((t) => (
                          <Badge key={t} tone="neutral" className="rounded-full px-3 py-1 text-xs font-semibold normal-case">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Quy định tham gia (Community Rules) */}
                <Card hover={false} className="rounded-3xl border border-border p-6 shadow-card dark:bg-surface">
                  <div className="flex items-center gap-2 text-text">
                    <ScrollText size={20} className="text-primary-solid" />
                    <h3 className="text-lg font-black">{t('groups.rulesAndStandardsTitle')}</h3>
                  </div>

                  {group.joinRules ? (
                    <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-sm leading-relaxed text-text-muted whitespace-pre-line">
                      {group.joinRules}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-text-subtle">
                      {t('groups.defaultRulesNotice')}
                    </p>
                  )}

                  {/* 3 quy chuẩn ứng xử mẫu */}
                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-border p-3.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary-solid">
                        1
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-text">{t('groups.sampleRule1Title')}</strong>
                        <p className="text-xs text-text-subtle">{t('groups.sampleRule1Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-border p-3.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary-solid">
                        2
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-text">{t('groups.sampleRule2Title')}</strong>
                        <p className="text-xs text-text-subtle">{t('groups.sampleRule2Desc')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-border p-3.5">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary-solid">
                        3
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-text">{t('groups.sampleRule3Title')}</strong>
                        <p className="text-xs text-text-subtle">{t('groups.sampleRule3Desc')}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 3: THÀNH VIÊN (MEMBERS) */}
            {activeTab === 'members' && (
              <div
                key="tab-members"
              >
                <Card hover={false} className="rounded-3xl border border-border p-6 shadow-card dark:bg-surface">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-text">{t('groups.membersTitle')}</h3>
                      <p className="text-xs text-text-subtle">{t('groups.membersSubtitle')}</p>
                    </div>
                  </div>

                  <GroupMembersList
                    groupId={group.id}
                    canView={group.canViewMembers}
                    viewerRole={group.viewerRole}
                    viewerUserId={viewerUserId}
                  />
                </Card>
              </div>
            )}
</FadeSwitch>

            {/* TAB 4: QUẢN TRỊ NHÓM (MANAGEMENT - CHỈ CHO OWNER/ADMIN) */}
            {activeTab === 'manage' && isManager && (
              <div
                key="tab-manage"
              >
                <GroupManagePanel group={group} />
              </div>
            )}
      </div>

      {/* Modal xác nhận rời nhóm */}
      <ConfirmDialog
        open={confirmLeave}
        title={t('groups.leaveGroupConfirmTitle')}
        message={
          isSoleOwner ? (
            <>
              {t('groups.soleOwnerLeaveWarning', { name: group.name })}
            </>
          ) : (
            <>
              {t('groups.memberLeaveWarning', { name: group.name })}
            </>
          )
        }
        confirmLabel={leaveMut.isPending ? t('common.processing') : t('groups.leaveGroup')}
        danger
        loading={leaveMut.isPending}
        onConfirm={confirmLeaveNow}
        onClose={() => setConfirmLeave(false)}
      />

      {/* Modal chuyển quyền sở hữu khi Owner rời nhóm */}
      {transferOpen && viewerUserId !== null && (
        <TransferOwnershipModal
          groupId={group.id}
          currentUserId={viewerUserId}
          onClose={() => setTransferOpen(false)}
          onDone={() => {
            setTransferOpen(false)
            setActiveTab('discussions')
          }}
        />
      )}
    </div>
  )
}
