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
import { Link, useParams, useSearchParams } from 'react-router-dom'
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
import { Badge, Card, Skeleton, toast } from '@/components/ui'
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
        <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-plum-900/[0.08] p-12 text-center shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-plum-900/[0.05] text-plum-400 dark:bg-white/5">
            {notFound ? <SearchX size={28} /> : <AlertTriangle size={28} />}
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-plum-900 dark:text-white">
              {notFound ? 'Không tìm thấy hội nhóm' : 'Không tải được hội nhóm'}
            </h2>
            <p className="mt-1.5 text-sm text-plum-500 dark:text-[#b0b3b8]">
              {notFound ? 'Hội nhóm này không tồn tại hoặc đã bị xóa.' : ((error as Error)?.message ?? 'Đã có lỗi hệ thống xảy ra. Vui lòng thử lại.')}
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
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
          toast.success(res.message || 'Đã rời khỏi hội nhóm.')
          setConfirmLeave(false)
          setActiveTab('discussions')
        },
        onError: (err) => toast.error((err as Error).message || 'Không thể rời nhóm, vui lòng thử lại.'),
      },
    )
  }


  // Danh sách các tab
  const tabs: { key: TabKey; label: string; icon: typeof MessagesSquare; badge?: number }[] = [
    { key: 'discussions', label: 'Thảo luận', icon: MessagesSquare },
    { key: 'about', label: 'Giới thiệu', icon: Info },
    { key: 'members', label: 'Thành viên', icon: Users },
  ]

  if (isManager) {
    tabs.push({
      key: 'manage',
      label: 'Quản trị nhóm',
      icon: Settings2,
      badge: pendingRequests > 0 ? pendingRequests : undefined,
    })
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      {/* Nút quay lại */}
      <Link
        to="/app/groups"
        className="inline-flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-brand-600 dark:text-[#b0b3b8] dark:hover:text-brand-400"
      >
        <ArrowLeft size={16} /> Tất cả hội nhóm
      </Link>

      {/* Ảnh bìa và thông tin hội nhóm */}
      <GroupDetailHeader
        group={group}
        onManage={() => setActiveTab('manage')}
        onLeave={handleLeave}
      />

      {/* Thông báo nhóm tạm ngừng */}
      {group.status === 'INACTIVE' && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-800 dark:text-amber-300">
          <Info size={17} className="shrink-0 text-amber-600" />
          <span>Hội nhóm đang tạm ngừng hoạt động và không nhận thêm thành viên mới.</span>
        </div>
      )}

      {/* Thanh điều hướng phụ (Sub-navigation Tabs) chuẩn Threads */}
      <div className="flex items-center justify-between border-b border-plum-900/[0.08] dark:border-[#393a3b]">
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
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-plum-500 hover:text-plum-900 dark:text-[#b0b3b8] dark:hover:text-white',
                )}
              >
                <t.icon size={17} className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-plum-400 dark:text-[#b0b3b8]'} />
                <span>{t.label}</span>
                {typeof t.badge === 'number' && (
                  <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand-500 px-1.5 text-[10px] font-black text-white">
                    {t.badge}
                  </span>
                )}
                {/* Đường gạch chân hoạt họa khi Active */}
                {isActive && (
                  <motion.div
                    layoutId="group-active-tab-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500"
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
            {activeTab === 'discussions' && (
              <motion.div
                key="tab-discussions"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Trạng thái nhóm riêng tư mà người xem chưa là thành viên */}
                {isPrivateOutsider ? (
                  <Card hover={false} className="flex flex-col items-center gap-4 rounded-3xl border border-plum-900/[0.08] p-10 text-center shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
                    <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20">
                      <Lock size={32} />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-xl font-extrabold text-plum-900 dark:text-white">
                        Hội nhóm riêng tư
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
                        sharedPostId={Number(searchParams.get('postId')) || undefined}
                      />
                    </div>
                    <div className="hidden lg:block">
                      <GroupSidebarInfo group={group} isActiveMember={isMember} />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: GIỚI THIỆU (ABOUT & RULES) */}
            {activeTab === 'about' && (
              <motion.div
                key="tab-about"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="space-y-5"
              >
                <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-6 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
                  <h3 className="text-lg font-black text-plum-900 dark:text-white">Mô tả hội nhóm</h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-plum-700 dark:text-plum-200">
                    {group.description}
                  </p>

                  {group.topics.length > 0 && (
                    <div className="mt-5 border-t border-plum-900/[0.06] pt-4 dark:border-[#393a3b]">
                      <h4 className="mb-2 text-xs font-black uppercase tracking-wider text-plum-400">
                        Chủ đề hoạt động
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
                <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-6 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
                  <div className="flex items-center gap-2 text-plum-900 dark:text-white">
                    <ScrollText size={20} className="text-brand-500" />
                    <h3 className="text-lg font-black">Nội quy & Chuẩn mực cộng đồng</h3>
                  </div>

                  {group.joinRules ? (
                    <div className="mt-4 rounded-2xl bg-plum-900/[0.03] p-4 text-sm leading-relaxed text-plum-700 dark:bg-[#3a3b3c] dark:text-plum-200 whitespace-pre-line">
                      {group.joinRules}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-plum-500 dark:text-[#b0b3b8]">
                      Hội nhóm này áp dụng các quy tắc văn hóa và ứng xử chung của nền tảng AlumNect.
                    </p>
                  )}

                  {/* 3 quy chuẩn ứng xử mẫu */}
                  <div className="mt-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-plum-900/[0.06] p-3.5 dark:border-[#393a3b]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/10 text-xs font-black text-brand-600">
                        1
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-plum-900 dark:text-white">Tôn trọng & Lắng nghe</strong>
                        <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">Luôn giữ tinh thần hòa nhã, lịch sự trong giao tiếp và tranh luận mang tính xây dựng.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-plum-900/[0.06] p-3.5 dark:border-[#393a3b]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/10 text-xs font-black text-brand-600">
                        2
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-plum-900 dark:text-white">Không quảng cáo rác & Spam</strong>
                        <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">Mọi bài viết thương mại hoặc tuyển dụng cần được sự đồng ý của ban quản trị nhóm.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-2xl border border-plum-900/[0.06] p-3.5 dark:border-[#393a3b]">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-500/10 text-xs font-black text-brand-600">
                        3
                      </span>
                      <div>
                        <strong className="text-sm font-bold text-plum-900 dark:text-white">Bảo mật thông tin nội bộ</strong>
                        <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">Không mang nội dung thảo luận riêng tư của các thành viên ra các kênh công cộng khi chưa được phép.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* TAB 3: THÀNH VIÊN (MEMBERS) */}
            {activeTab === 'members' && (
              <motion.div
                key="tab-members"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Card hover={false} className="rounded-3xl border border-plum-900/[0.08] p-6 shadow-card dark:border-[#393a3b] dark:bg-[#242526]">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-plum-900 dark:text-white">Thành viên hội nhóm</h3>
                      <p className="text-xs text-plum-500 dark:text-[#b0b3b8]">Danh sách những người đang sinh hoạt và kết nối trong cộng đồng</p>
                    </div>
                  </div>

                  <GroupMembersList
                    groupId={group.id}
                    canView={group.canViewMembers}
                    viewerRole={group.viewerRole}
                    viewerUserId={viewerUserId}
                  />
                </Card>
              </motion.div>
            )}

            {/* TAB 4: QUẢN TRỊ NHÓM (MANAGEMENT - CHỈ CHO OWNER/ADMIN) */}
            {activeTab === 'manage' && isManager && (
              <motion.div
                key="tab-manage"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <GroupManagePanel group={group} />
              </motion.div>
            )}
      </div>

      {/* Modal xác nhận rời nhóm */}
      <ConfirmDialog
        open={confirmLeave}
        title="Rời khỏi hội nhóm"
        message={
          isSoleOwner ? (
            <>
              Bạn là thành viên cuối cùng của <b>{group.name}</b>. Nếu rời nhóm, hội nhóm sẽ bị xóa vĩnh viễn. Bạn có chắc chắn muốn tiếp tục?
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
