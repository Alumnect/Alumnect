import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Plus,
  Search,
  Check,
  X,
  Clock,
  Shield,
  Send,
  UserPlus,
  ChevronRight,
  LogOut,
  AlertTriangle,
  Inbox,
  AlertCircle,
  RefreshCw,
  Loader2,
  Layers,
} from 'lucide-react'
import { Card, Container, Skeleton, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { MentoringTermsGate, MentorPageHeader } from '@/features/mentorship'
import { MentoringFilterTabs } from '@/features/mentorship/components/MentoringUi'
import { mentoringGroupApi } from '@/features/mentorship/api/mentoringGroupApi'
import { CreateMentoringGroupModal } from '@/features/mentorship/components/CreateMentoringGroupModal'
import { InviteMembersModal } from '@/features/mentorship/components/InviteMembersModal'
import type { MentoringGroupData, MentoringGroupMemberData } from '@/features/mentorship/model/mentoringRequestTypes'

type GroupTab = 'ALL' | 'MANAGED' | 'JOINED' | 'INVITATIONS'

export function MentoringGroupsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<GroupTab>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [invitingGroup, setInvitingGroup] = useState<MentoringGroupData | null>(null)
  const [declineTarget, setDeclineTarget] = useState<MentoringGroupData | null>(null)
  const [leavingGroup, setLeavingGroup] = useState<MentoringGroupData | null>(null)

  // Fetch groups
  const {
    data: allGroups = [],
    isLoading: loadingGroups,
    isError: errorGroups,
    refetch: refetchGroups,
  } = useQuery({
    queryKey: ['mentoring-groups'],
    queryFn: () => mentoringGroupApi.getAll(),
  })

  // Fetch pending invitations
  const {
    data: invitations = [],
    isLoading: loadingInvitations,
  } = useQuery({
    queryKey: ['mentoring-groups', 'invitations'],
    queryFn: () => mentoringGroupApi.getInvitations(),
  })

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: (groupId: number) => mentoringGroupApi.accept(groupId),
    onSuccess: () => {
      toast.success('Chấp nhận lời mời tham gia nhóm thành công!')
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể chấp nhận lời mời')
    },
  })

  const declineMutation = useMutation({
    mutationFn: (groupId: number) => mentoringGroupApi.decline(groupId),
    onSuccess: () => {
      toast.success('Đã từ chối lời mời tham gia nhóm')
      setDeclineTarget(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể từ chối lời mời')
    },
  })

  const leaveMutation = useMutation({
    mutationFn: (groupId: number) => mentoringGroupApi.leaveGroup(groupId),
    onSuccess: () => {
      toast.success('Bạn đã rời khỏi nhóm mentoring')
      setLeavingGroup(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể rời nhóm')
    },
  })

  // Filter groups according to tab and search
  const filteredGroups = useMemo(() => {
    return allGroups.filter((group: MentoringGroupData) => {
      const matchesSearch =
        !searchQuery.trim() ||
        group.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase().trim()))

      if (!matchesSearch) return false

      if (activeTab === 'MANAGED') {
        return group.canManage || (currentUser && String(currentUser.id) === String(group.leaderId))
      }
      if (activeTab === 'JOINED') {
        const isLeader = group.canManage || (currentUser && String(currentUser.id) === String(group.leaderId))
        return !isLeader
      }
      return true
    })
  }, [allGroups, activeTab, searchQuery, currentUser])

  const managedCount = allGroups.filter(
    (g: MentoringGroupData) => g.canManage || (currentUser && String(currentUser.id) === String(g.leaderId)),
  ).length

  return (
    <Container className="py-2 sm:py-4 space-y-6">
      <MentoringTermsGate source="MENTORING_HOME">
        <MentorPageHeader
          icon={<Users className="h-4 w-4" />}
          eyebrow="Học nhóm"
          title="Nhóm Mentoring"
          description="Tạo nhóm, mời bạn cùng học và gửi yêu cầu Mentoring cho cả nhóm."
          actions={
            <Button size="sm" onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Tạo nhóm
            </Button>
          }
        />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <MentoringFilterTabs
            ariaLabel="Lọc nhóm"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'ALL', label: `Tất cả (${allGroups.length})` },
              { value: 'MANAGED', label: `Tôi quản lý (${managedCount})` },
              { value: 'JOINED', label: `Đã tham gia (${allGroups.length - managedCount})` },
              { value: 'INVITATIONS', label: invitations.length > 0 ? `Lời mời (${invitations.length})` : 'Lời mời' },
            ]}
          />

          {/* Search Input */}
          {activeTab !== 'INVITATIONS' && (
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-plum-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhóm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-plum-900/10 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 dark:border-[#3a3b3c] dark:bg-[#18191a] dark:text-white"
              />
            </div>
          )}
        </div>

        {/* TAB: PENDING INVITATIONS */}
        {activeTab === 'INVITATIONS' && (
          <div className="space-y-4">
            {loadingInvitations ? (
              <div className="space-y-3">
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
              </div>
            ) : invitations.length === 0 ? (
              <Card hover={false} className="border border-dashed border-plum-900/10 p-12 text-center space-y-3 dark:border-white/10">
                <Inbox className="mx-auto h-10 w-10 text-plum-400 opacity-60" />
                <p className="font-bold text-sm text-plum-900 dark:text-white">Không có lời mời nào</p>
                <p className="text-xs text-plum-500 max-w-sm mx-auto dark:text-[#8f9399]">
                  Bạn hiện không có lời mời tham gia nhóm mentoring nào đang chờ phản hồi.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {invitations.map((group) => {
                  const leaderMember = group.members?.find((m) => m.leader)
                  return (
                    <Card
                      key={group.id}
                      hover={false}
                      className="border border-amber-300/80 bg-amber-50/20 p-5 sm:p-6 transition-all dark:border-amber-700/60 dark:bg-amber-950/20"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              Lời mời gia nhập nhóm
                            </span>
                            <span className="text-xs text-plum-400">•</span>
                            <span className="text-xs text-plum-500">
                              {group.joinedMemberCount || group.members?.filter((m) => m.status === 'JOINED' || m.status === 'ACTIVE').length || 1} thành viên
                            </span>
                          </div>
                          <h3 className="font-display text-base font-bold text-plum-900 dark:text-white">
                            {group.name}
                          </h3>
                          {group.description && (
                            <p className="text-xs text-plum-600 line-clamp-2 max-w-xl dark:text-[#b0b3b8]">
                              {group.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1 text-xs text-plum-500 dark:text-[#8f9399]">
                            <Shield className="h-3.5 w-3.5 text-brand-500" />
                            <span>
                              Người mời (Trưởng nhóm): <strong>{group.leaderName || leaderMember?.fullName || 'Trưởng nhóm'}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Actions for Invitation */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/app/mentoring/groups/${group.id}`)}
                            className="text-xs font-bold rounded-xl border-plum-900/10"
                          >
                            Xem nhóm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeclineTarget(group)}
                            disabled={declineMutation.isPending || acceptMutation.isPending}
                            className="text-xs font-bold rounded-xl text-coral-600 hover:bg-coral-50"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Từ chối
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => acceptMutation.mutate(group.id)}
                            disabled={acceptMutation.isPending || declineMutation.isPending}
                            className="text-xs font-bold rounded-xl gap-1.5 shadow-xs"
                          >
                            {acceptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Chấp nhận
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TABS: ALL / MANAGED / JOINED */}
        {activeTab !== 'INVITATIONS' && (
          <div className="space-y-6">
            {loadingGroups ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : errorGroups ? (
              <Card hover={false} className="border border-coral-200 p-8 text-center space-y-3">
                <AlertCircle className="mx-auto h-8 w-8 text-coral-500" />
                <p className="font-bold text-sm text-plum-900 dark:text-white">Không thể tải danh sách nhóm</p>
                <Button variant="outline" size="sm" onClick={() => refetchGroups()} className="rounded-xl">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Thử lại
                </Button>
              </Card>
            ) : filteredGroups.length === 0 ? (
              <Card hover={false} className="border border-dashed border-plum-900/10 p-12 text-center space-y-4 dark:border-white/10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-700/40">
                  <Users className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-plum-900 dark:text-white">
                    {searchQuery
                      ? 'Không tìm thấy nhóm phù hợp'
                      : activeTab === 'MANAGED'
                      ? 'Bạn chưa tạo nhóm cố vấn nào'
                      : activeTab === 'JOINED'
                      ? 'Bạn chưa tham gia nhóm cố vấn nào'
                      : 'Bạn chưa có nhóm cố vấn nào'}
                  </h3>
                  <p className="text-xs text-plum-500 max-w-sm mx-auto dark:text-[#8f9399]">
                    {searchQuery
                      ? 'Thử tìm kiếm với từ khóa khác.'
                      : 'Hãy tạo nhóm đầu tiên để mời các bạn học và gửi yêu cầu Mentoring cùng nhau.'}
                  </p>
                </div>
                {!searchQuery && (
                  <Button
                    variant="primary"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 rounded-xl text-xs font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo nhóm đầu tiên của bạn
                  </Button>
                )}
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredGroups.map((group: MentoringGroupData) => {
                  const isLeader = group.canManage || (currentUser && String(currentUser.id) === String(group.leaderId))
                  const joinedCount =
                    group.joinedMemberCount ||
                    group.members?.filter((m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE').length ||
                    1
                  const pendingCount =
                    group.pendingMemberCount ||
                    group.members?.filter((m: MentoringGroupMemberData) => m.status === 'PENDING' || m.status === 'INVITED').length ||
                    0
                  const requestCount = group.requests?.length || 0

                  return (
                    <Card
                      key={group.id}
                      hover={false}
                      className="flex flex-col justify-between border border-plum-900/[0.08] bg-white p-5 transition-all hover:shadow-md dark:bg-[#242526] dark:border-[#393a3b]"
                    >
                      <div className="space-y-4">
                        {/* Header: Icon, Name & Badges */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-display font-bold text-base shadow-xs dark:bg-brand-700/40 dark:text-brand-300">
                              {group.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/app/mentoring/groups/${group.id}`}
                                className="font-display font-bold text-sm text-plum-900 hover:text-brand-600 truncate block dark:text-white"
                              >
                                {group.name}
                              </Link>
                              <div className="flex items-center gap-1.5 text-[11px] text-plum-400 mt-0.5">
                                <Shield className="h-3 w-3 text-brand-500" />
                                <span className="truncate">
                                  {isLeader ? 'Bạn là Trưởng nhóm' : `Trưởng nhóm: ${group.leaderName || 'N/A'}`}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isLeader && (
                            <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 dark:bg-brand-700/40 dark:text-brand-300">
                              Quản lý
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {group.description ? (
                          <p className="text-xs text-plum-600 line-clamp-2 leading-relaxed dark:text-[#b0b3b8]">
                            {group.description}
                          </p>
                        ) : (
                          <p className="text-xs text-plum-400 italic">Chưa có mô tả nhóm.</p>
                        )}

                        {/* Stats Summary */}
                        <div className="flex flex-wrap items-center gap-3 border-t border-plum-900/5 pt-3 text-[11px] text-plum-500 dark:border-white/5 dark:text-[#8f9399]">
                          <span className="flex items-center gap-1 font-semibold text-plum-700 dark:text-white">
                            <Users className="h-3.5 w-3.5 text-mint-600" />
                            {joinedCount} thành viên
                          </span>
                          {isLeader && pendingCount > 0 && (
                            <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                              <Clock className="h-3.5 w-3.5" />
                              {pendingCount} chờ duyệt
                            </span>
                          )}
                          {requestCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-brand-500" />
                              {requestCount} yêu cầu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-2 border-t border-plum-900/5 mt-4 pt-3 dark:border-white/5">
                        <Link
                          to={`/app/mentoring/groups/${group.id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-plum-700 hover:text-brand-600 dark:text-[#e4e6eb]"
                        >
                          Xem chi tiết <ChevronRight className="h-3.5 w-3.5" />
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {isLeader ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setInvitingGroup(group)}
                                className="h-8 text-xs font-bold px-2.5 rounded-lg text-brand-700 hover:bg-brand-50"
                                title="Mời thành viên"
                              >
                                <UserPlus className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                                className="h-8 text-xs font-bold px-3 rounded-lg gap-1 shadow-2xs"
                              >
                                <Send className="h-3 w-3" />
                                Tạo yêu cầu
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setLeavingGroup(group)}
                              className="h-8 text-xs font-bold px-2.5 rounded-lg text-coral-600 hover:bg-coral-50"
                              title="Rời nhóm"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* MODAL: Create Mentoring Group */}
        <CreateMentoringGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccessRedirect={true}
        />

        {/* MODAL: Invite Members */}
        {invitingGroup && (
          <InviteMembersModal
            isOpen={Boolean(invitingGroup)}
            onClose={() => setInvitingGroup(null)}
            groupId={invitingGroup.id}
            groupName={invitingGroup.name}
            existingMembers={invitingGroup.members || []}
            onInviteSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
            }}
          />
        )}

        {/* DIALOG: Confirmation to Decline Invitation */}
        {declineTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs animate-fade-in">
            <Card hover={false} className="max-w-md w-full p-6 space-y-4 shadow-xl border border-coral-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-100 text-coral-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-plum-900 dark:text-white">
                    Từ chối lời mời tham gia nhóm?
                  </h3>
                  <p className="text-xs text-plum-500 leading-relaxed dark:text-[#8f9399]">
                    Bạn có chắc chắn muốn từ chối lời mời tham gia nhóm <strong>{declineTarget.name}</strong> không?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeclineTarget(null)}
                  disabled={declineMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => declineMutation.mutate(declineTarget.id)}
                  disabled={declineMutation.isPending}
                  className="bg-coral-600 hover:bg-coral-700 text-white"
                >
                  {declineMutation.isPending ? 'Đang xử lý...' : 'Từ chối lời mời'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* DIALOG: Confirmation to Leave Group */}
        {leavingGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs animate-fade-in">
            <Card hover={false} className="max-w-md w-full p-6 space-y-4 shadow-xl border border-coral-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-100 text-coral-600">
                  <LogOut className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-plum-900 dark:text-white">
                    Rời khỏi nhóm Mentoring?
                  </h3>
                  <p className="text-xs text-plum-500 leading-relaxed dark:text-[#8f9399]">
                    Bạn sẽ không còn là thành viên của nhóm <strong>{leavingGroup.name}</strong> và không thể tham gia vào các yêu cầu mới của nhóm.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeavingGroup(null)}
                  disabled={leaveMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => leaveMutation.mutate(leavingGroup.id)}
                  disabled={leaveMutation.isPending}
                  className="bg-coral-600 hover:bg-coral-700 text-white"
                >
                  {leaveMutation.isPending ? 'Đang xử lý...' : 'Xác nhận rời nhóm'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </MentoringTermsGate>
    </Container>
  )
}
