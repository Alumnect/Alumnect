import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Calendar,
  Shield,
  UserPlus,
  Clock,
  CheckCircle2,
  XCircle,
  Trash2,
  LogOut,
  Send,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
  Ban,
  FileText,
  ArrowLeft,
  Loader2,
} from 'lucide-react'
import { Card, Container, Skeleton, toast, DialogFrame, FadeSwitch } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'
import { MentoringTermsGate } from '@/features/mentorship'
import { MentoringFilterTabs } from '@/features/mentorship/components/MentoringUi'
import { mentoringGroupApi } from '@/features/mentorship/api/mentoringGroupApi'
import { InviteMembersModal } from '@/features/mentorship/components/InviteMembersModal'
import type {
  MentoringGroupMemberData,
  MentoringGroupMemberStatus,
} from '@/features/mentorship/model/mentoringRequestTypes'

export function MentoringGroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const groupId = Number(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'MEMBERS' | 'REQUESTS'>('OVERVIEW')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<MentoringGroupMemberData | null>(null)
  const [invitationToCancel, setInvitationToCancel] = useState<MentoringGroupMemberData | null>(null)
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

  // Fetch Group Detail
  const {
    data: group,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['mentoring-group', groupId],
    queryFn: () => mentoringGroupApi.getById(groupId),
    enabled: !isNaN(groupId) && groupId > 0,
  })

  // Fetch Group Requests
  const { data: requests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['mentoring-group-requests', groupId],
    queryFn: () => mentoringGroupApi.getRequests(groupId),
    enabled: !isNaN(groupId) && groupId > 0,
  })

  // Mutations
  const cancelInvitationMutation = useMutation({
    mutationFn: (memberId: number) => mentoringGroupApi.cancelInvitation(groupId, memberId),
    onSuccess: () => {
      toast.success('Đã thu hồi lời mời tham gia nhóm')
      setInvitationToCancel(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể thu hồi lời mời')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => mentoringGroupApi.remove(groupId, userId),
    onSuccess: () => {
      toast.success('Đã xóa thành viên khỏi nhóm')
      setMemberToRemove(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể xóa thành viên')
    },
  })

  const leaveGroupMutation = useMutation({
    mutationFn: () => mentoringGroupApi.leaveGroup(groupId),
    onSuccess: () => {
      toast.success('Bạn đã rời khỏi nhóm mentoring')
      setIsLeaveConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      navigate('/app/mentoring/groups')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể rời khỏi nhóm')
    },
  })

  const deleteGroupMutation = useMutation({
    mutationFn: () => mentoringGroupApi.deleteGroup(groupId),
    onSuccess: () => {
      toast.success('Đã giải tán nhóm mentoring')
      setIsDeleteConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      navigate('/app/mentoring/groups')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể giải tán nhóm')
    },
  })

  const reinviteMutation = useMutation({
    mutationFn: (userId: number) => mentoringGroupApi.invite(groupId, [userId]),
    onSuccess: () => {
      toast.success('Đã gửi lại lời mời thành công')
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể gửi lại lời mời')
    },
  })

  if (isLoading) {
    return (
      <Container className="space-y-6 py-2 sm:py-4">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </Container>
    )
  }

  if (isError || !group) {
    return (
      <Container className="py-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-text">Không tìm thấy nhóm</h2>
        <p className="text-sm text-text-subtle max-w-md mx-auto">
          {(error as Error)?.message || 'Nhóm này không tồn tại hoặc bạn không có quyền truy cập.'}
        </p>
        <Button variant="primary" onClick={() => navigate('/app/mentoring/groups')}>
          Quay lại danh sách nhóm
        </Button>
      </Container>
    )
  }

  const isLeader = group.canManage || (currentUser && String(currentUser.id) === String(group.leaderId))
  // Chỉ trưởng nhóm thật (không phải Mentor có quyền quản lý) mới được giải tán nhóm
  const isGroupOwner = !!currentUser && String(currentUser.id) === String(group.leaderId)
  const joinedMembers = (group.members || []).filter(
    (m: MentoringGroupMemberData) => m.status === 'JOINED' || m.status === 'ACTIVE'
  )
  const pendingMembers = (group.members || []).filter(
    (m: MentoringGroupMemberData) => m.status === 'PENDING' || m.status === 'INVITED'
  )
  const historyMembers = (group.members || []).filter((m: MentoringGroupMemberData) =>
    ['DECLINED', 'REMOVED', 'CANCELLED'].includes(m.status)
  )

  const isCurrentUserJoined = (group.members || []).some(
    (m: MentoringGroupMemberData) =>
      currentUser &&
      String(m.userId) === String(currentUser.id) &&
      (m.status === 'JOINED' || m.status === 'ACTIVE')
  )

  const getStatusBadge = (status: MentoringGroupMemberStatus) => {
    switch (status) {
      case 'JOINED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-bold text-success">
            <CheckCircle2 className="h-3 w-3" /> Đã tham gia
          </span>
        )
      case 'PENDING':
      case 'INVITED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning">
            <Clock className="h-3 w-3" /> Đang chờ phản hồi
          </span>
        )
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
            <XCircle className="h-3 w-3" /> Đã từ chối
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-bold text-text-muted dark:bg-surface-2">
            <Ban className="h-3 w-3" /> Đã thu hồi
          </span>
        )
      case 'REMOVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
            <Trash2 className="h-3 w-3" /> Đã rời / bị xóa
          </span>
        )
      default:
        return null
    }
  }

  return (
    <Container className="py-4 sm:py-6 space-y-6">
      <MentoringTermsGate source="MENTORING_HOME">
        {/* Top Navigation Back */}
        <div className="flex items-center justify-between">
          <Link
            to="/app/mentoring/groups"
            className="inline-flex items-center gap-2 text-xs font-bold text-text-muted hover:text-primary-solid transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Danh sách nhóm Mentoring
          </Link>
          <div className="flex items-center gap-2">
            {isLeader && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                className="gap-1.5 rounded-xl text-xs font-bold shadow-xs"
              >
                <Send className="h-3.5 w-3.5" />
                Tạo Mentoring Request
              </Button>
            )}
            {isGroupOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="gap-1.5 rounded-xl border-danger-border text-danger hover:bg-danger-soft text-xs font-bold"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Giải tán nhóm
              </Button>
            )}
            {!isLeader && isCurrentUserJoined && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLeaveConfirmOpen(true)}
                className="gap-1.5 rounded-xl border-danger-border text-danger hover:bg-danger-soft text-xs font-bold"
              >
                <LogOut className="h-3.5 w-3.5" />
                Rời nhóm
              </Button>
            )}
          </div>
        </div>

        {/* Hero Card */}
        <Card hover={false} className="border border-border bg-surface p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-solid font-display text-2xl font-bold shadow-inner">
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-text">
                    {group.name}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      group.status === 'ACTIVE'
                        ? 'bg-success-soft text-success'
                        : 'bg-surface-3 text-text-muted dark:bg-surface-2'
                    }`}
                  >
                    {group.status === 'ACTIVE' ? 'Đang hoạt động' : group.status}
                  </span>
                  {isLeader && (
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-solid">
                      Bạn là Trưởng nhóm
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-text-muted leading-relaxed max-w-2xl">
                    {group.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-text-subtle">
                  <span className="flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-primary-solid" />
                    Trưởng nhóm: <strong>{group.leaderName || 'Trưởng nhóm'}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-success" />
                    <strong>{joinedMembers.length}</strong> thành viên chính thức
                  </span>
                  {pendingMembers.length > 0 && (
                    <span className="flex items-center gap-1.5 text-warning font-bold">
                      <Clock className="h-4 w-4" />
                      {pendingMembers.length} lời mời đang chờ
                    </span>
                  )}
                  {group.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Tạo ngày {new Date(group.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
              {isLeader && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="gap-1.5 rounded-xl border-primary-soft-border text-primary-solid hover:bg-primary-soft text-xs font-bold"
                >
                  <UserPlus className="h-4 w-4" />
                  Mời thành viên
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-t border-border pt-4">
            <MentoringFilterTabs
              ariaLabel="Mục của nhóm"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'OVERVIEW', label: 'Tổng quan' },
                {
                  value: 'MEMBERS',
                  label:
                    pendingMembers.length > 0
                      ? `Thành viên (${joinedMembers.length}) · ${pendingMembers.length} chờ`
                      : `Thành viên (${joinedMembers.length})`,
                },
                { value: 'REQUESTS', label: `Yêu cầu Mentoring (${requests.length})` },
              ]}
            />
          </div>
        </Card>

        {/* TAB 1: OVERVIEW */}
        <FadeSwitch id={activeTab}>
{activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Snapshot Active Members Preview */}
              <Card hover={false} className="border border-border p-5 space-y-4 dark:bg-surface">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary-solid" />
                    Thành viên chính thức ({joinedMembers.length})
                  </h3>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="text-xs font-bold text-primary-solid hover:text-primary-solid"
                    >
                      + Mời thêm
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {joinedMembers.map((member: MentoringGroupMemberData) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-cream-100/50 p-3 dark:bg-white/5"
                    >
                      <img
                        src={
                          member.avatarUrl ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`
                        }
                        alt=""
                        className="h-10 w-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-bold text-text">
                            {member.fullName}
                          </span>
                          {member.leader && (
                            <span className="rounded-md bg-warning-soft px-1.5 py-0.5 text-xs font-bold text-warning">
                              Trưởng nhóm
                            </span>
                          )}
                        </div>
                        <span className="block truncate text-xs text-text-subtle">
                          {member.major || member.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Mentoring Request Status Overview */}
              <Card hover={false} className="border border-border p-5 space-y-4 dark:bg-surface">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-display text-sm font-bold text-text flex items-center gap-2">
                    <FileText className="h-4 w-4 text-success" />
                    Mentoring Requests liên kết ({requests.length})
                  </h3>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                      className="text-xs font-bold text-primary-solid hover:text-primary-solid"
                    >
                      + Tạo yêu cầu mới
                    </Button>
                  )}
                </div>

                {loadingRequests ? (
                  <div className="py-8 text-center text-xs text-text-subtle">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary-solid mb-2" />
                    Đang tải danh sách yêu cầu...
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-text-subtle">
                      Nhóm này chưa gửi Mentoring Request nào.
                    </p>
                    {isLeader && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                        className="rounded-xl text-xs font-bold"
                      >
                        Tạo Mentoring Request đầu tiên
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {requests.slice(0, 3).map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border p-3 hover:bg-cream-100/70 transition-colors dark:hover:bg-white/5"
                      >
                        <div className="min-w-0 space-y-1">
                          <Link
                            to={`/app/mentoring/requests/${req.id}`}
                            className="font-bold text-xs text-text hover:text-primary-solid truncate block"
                          >
                            {req.title}
                          </Link>
                          <div className="flex items-center gap-3 text-xs text-text-subtle">
                            <span>Loại: {req.requestType === 'DIRECT' ? 'Trực tiếp' : 'Mở (Matching)'}</span>
                            <span>•</span>
                            <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-solid">
                            {req.status}
                          </span>
                          <Link
                            to={`/app/mentoring/requests/${req.id}`}
                            className="rounded-lg p-1.5 text-text-subtle hover:text-text hover:bg-surface-3"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Right Column: Group Rules & Stats */}
            <div className="space-y-6">
              <Card hover={false} className="border border-primary-soft-border bg-brand-50/30 p-5 space-y-3 dark:bg-brand-700/20">
                <h4 className="text-xs font-bold text-primary-solid uppercase tracking-wider">
                  Quy trình Group-First
                </h4>
                <ul className="text-xs text-primary-solid space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      Nhóm hoạt động độc lập và có thể gửi nhiều Mentoring Requests khác nhau.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      Chỉ những thành viên có trạng thái <strong className="font-bold text-primary-solid underline decoration-primary-solid/40 underline-offset-2">Đã tham gia</strong> mới được đưa vào danh sách của Yêu cầu cố vấn.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      Thành viên là Mentor chủ động sẽ không thể tự nhận Request của nhóm mình (tránh xung đột lợi ích).
                    </span>
                  </li>
                </ul>
              </Card>

              {/* Quick Actions */}
              <Card hover={false} className="border border-border p-5 space-y-3 dark:bg-surface">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                  Thao tác nhanh
                </h4>
                <div className="space-y-2">
                  {isLeader && (
                    <>
                      <Button
                        variant="primary"
                        className="w-full justify-start text-xs font-bold rounded-xl gap-2"
                        onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                      >
                        <Send className="h-4 w-4" />
                        Tạo Mentoring Request cho nhóm
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs font-bold rounded-xl gap-2 border-border"
                        onClick={() => setIsInviteModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Mời thêm thành viên
                      </Button>
                    </>
                  )}
                  {!isLeader && isCurrentUserJoined && (
                    <Button
                      variant="outline"
                      className="w-full justify-start text-xs font-bold rounded-xl gap-2 border-danger-border text-danger hover:bg-danger-soft"
                      onClick={() => setIsLeaveConfirmOpen(true)}
                    >
                      <LogOut className="h-4 w-4" />
                      Rời khỏi nhóm
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 2: MEMBERS MANAGEMENT */}
        {activeTab === 'MEMBERS' && (
          <div className="space-y-6">
            {/* Active Members Table */}
            <Card hover={false} className="border border-border p-5 space-y-4 dark:bg-surface">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-text">
                    Thành viên đang tham gia ({joinedMembers.length})
                  </h3>
                  <p className="text-xs text-text-subtle">
                    Những thành viên này sẽ tự động có mặt trong snapshot khi bạn tạo Mentoring Request.
                  </p>
                </div>
                {isLeader && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="gap-1.5 rounded-xl text-xs font-bold"
                  >
                    <UserPlus className="h-4 w-4" /> Mời thành viên
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-subtle font-bold">
                      <th className="py-2.5 px-3">Thành viên</th>
                      <th className="py-2.5 px-3">Chuyên ngành / Email</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3">Ngày tham gia</th>
                      {isLeader && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {joinedMembers.map((member: MentoringGroupMemberData) => (
                      <tr key={member.id} className="hover:bg-cream-100/50 dark:hover:bg-white/5">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                member.avatarUrl ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}`
                              }
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-text">
                                {member.fullName}
                                {member.leader && (
                                  <span className="rounded-md bg-warning-soft px-1.5 py-0.2 text-xs font-bold text-warning">
                                    Trưởng nhóm
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-text-muted">
                          <div>{member.major || 'Chưa cập nhật'}</div>
                          <div className="text-xs text-text-subtle">{member.email}</div>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(member.status)}</td>
                        <td className="py-3 px-3 text-text-subtle">
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        {isLeader && (
                          <td className="py-3 px-3 text-right">
                            {!member.leader && (
                              <button
                                type="button"
                                onClick={() => setMemberToRemove(member)}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-danger hover:bg-danger-soft transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pending Invitations Table */}
            {pendingMembers.length > 0 && (
              <Card hover={false} className="border border-warning-border bg-warning-soft p-5 space-y-4">
                <div className="border-b border-warning-border pb-3">
                  <h3 className="font-display text-sm font-bold text-warning flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Lời mời đang chờ chấp nhận ({pendingMembers.length})
                  </h3>
                  <p className="text-xs text-warning">
                    Người được mời chưa xác nhận tham gia. Họ sẽ không có mặt trong Mentoring Request cho đến khi Accept.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warning-border text-warning font-bold">
                        <th className="py-2 px-3">Người được mời</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Thời gian mời</th>
                        <th className="py-2 px-3">Trạng thái</th>
                        {isLeader && <th className="py-2 px-3 text-right">Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warning-border">
                      {pendingMembers.map((member: MentoringGroupMemberData) => (
                        <tr key={member.id} className="hover:bg-warning-soft">
                          <td className="py-2.5 px-3 font-bold text-text">
                            {member.fullName}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">{member.email}</td>
                          <td className="py-2.5 px-3 text-text-subtle">
                            {new Date(member.invitedAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-2.5 px-3">{getStatusBadge(member.status)}</td>
                          {isLeader && (
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => setInvitationToCancel(member)}
                                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-warning hover:bg-amber-200/50 transition-colors"
                              >
                                <Ban className="h-3.5 w-3.5" />
                                Thu hồi
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* History Table (DECLINED, REMOVED, CANCELLED) */}
            {isLeader && historyMembers.length > 0 && (
              <Card hover={false} className="border border-border p-5 space-y-4 dark:bg-surface">
                <div className="border-b border-border pb-3">
                  <h3 className="font-display text-sm font-bold text-text">
                    Lịch sử lời mời ({historyMembers.length})
                  </h3>
                  <p className="text-xs text-text-subtle">
                    Danh sách những người đã từ chối, bị thu hồi lời mời hoặc bị xóa khỏi nhóm. Bạn có thể gửi lại lời mời bất kỳ lúc nào.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-subtle font-bold">
                        <th className="py-2 px-3">Thành viên</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Trạng thái</th>
                        <th className="py-2 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {historyMembers.map((member: MentoringGroupMemberData) => (
                        <tr key={member.id} className="hover:bg-cream-100/50 dark:hover:bg-white/5">
                          <td className="py-2.5 px-3 font-bold text-text">
                            {member.fullName}
                          </td>
                          <td className="py-2.5 px-3 text-text-muted">{member.email}</td>
                          <td className="py-2.5 px-3">{getStatusBadge(member.status)}</td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => reinviteMutation.mutate(member.userId)}
                              disabled={reinviteMutation.isPending}
                              className="h-7 text-xs font-bold gap-1 rounded-lg"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Mời lại
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* TAB 3: REQUESTS LIST */}
        {activeTab === 'REQUESTS' && (
          <div className="space-y-6">
            <Card hover={false} className="border border-border p-5 space-y-4 dark:bg-surface">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-text">
                    Tất cả Mentoring Requests của nhóm ({requests.length})
                  </h3>
                  <p className="text-xs text-text-subtle">
                    Một nhóm có thể tái sử dụng để tạo nhiều yêu cầu mentoring theo nhu cầu học tập.
                  </p>
                </div>
                {isLeader && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                    className="gap-1.5 rounded-xl text-xs font-bold shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> Tạo yêu cầu mới
                  </Button>
                )}
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-xs text-text-subtle">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-solid mb-2" />
                  Đang tải danh sách Mentoring Requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-text-subtle">
                    Chưa có Mentoring Request nào được tạo cho nhóm này.
                  </p>
                  {isLeader && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                      className="rounded-xl text-xs font-bold"
                    >
                      Bắt đầu tạo Mentoring Request
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border p-4 hover:border-primary-soft-border transition"
                    >
                      <div className="space-y-1">
                        <Link
                          to={`/app/mentoring/requests/${req.id}`}
                          className="font-bold text-sm text-text hover:text-primary-solid flex items-center gap-1.5"
                        >
                          {req.title}
                          <ExternalLink className="h-3.5 w-3.5 text-text-subtle" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-text-subtle">
                          <span>
                            Hình thức: <strong>{req.requestType === 'DIRECT' ? 'Chỉ định Mentor' : 'Matching tự động'}</strong>
                          </span>
                          {req.targetMentorName && (
                            <span>
                              Mentor: <strong>{req.targetMentorName}</strong>
                            </span>
                          )}
                          <span>
                            Ngày tạo: {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-solid">
                          {req.status}
                        </span>
                        {req.confirmedDealId && (
                          <Link
                            to={`/app/mentoring/deals`}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-text-muted hover:bg-surface-2"
                          >
                            Xem Deal
                          </Link>
                        )}
                        {req.taskId && (
                          <Link
                            to={`/app/mentoring/tasks/${req.taskId}`}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-text-muted hover:bg-surface-2"
                          >
                            Xem Task
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
</FadeSwitch>

        {/* MODAL: Invite Members */}
        {group && (
          <InviteMembersModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            groupId={group.id}
            groupName={group.name}
            existingMembers={group.members || []}
            onInviteSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
            }}
          />
        )}

        {/* DIALOG: Confirmation to Remove Member */}
        {memberToRemove && (
          <DialogFrame
            onClose={() => setMemberToRemove(null)}
            zIndexClassName="z-50"
            maxWidthClassName="max-w-md"
            className="p-6 space-y-4 border-danger-border"
          >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-text">
                    Xác nhận xóa thành viên?
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    Bạn có chắc chắn muốn loại <strong>{memberToRemove.fullName}</strong> khỏi nhóm mentoring này không?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMemberToRemove(null)}
                  disabled={removeMemberMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => removeMemberMutation.mutate(memberToRemove.userId)}
                  disabled={removeMemberMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {removeMemberMutation.isPending ? 'Đang xóa...' : 'Xóa khỏi nhóm'}
                </Button>
              </div>
            </DialogFrame>
        )}

        {/* DIALOG: Confirmation to Cancel Invitation */}
        {invitationToCancel && (
          <DialogFrame
            onClose={() => setInvitationToCancel(null)}
            zIndexClassName="z-50"
            maxWidthClassName="max-w-md"
            className="p-6 space-y-4 border-warning-border"
          >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                  <Ban className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-text">
                    Thu hồi lời mời tham gia?
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    Sau khi thu hồi lời mời, <strong>{invitationToCancel.fullName}</strong> sẽ không thể chấp nhận để vào nhóm này nữa.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInvitationToCancel(null)}
                  disabled={cancelInvitationMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => cancelInvitationMutation.mutate(invitationToCancel.id)}
                  disabled={cancelInvitationMutation.isPending}
                  className="bg-primary-solid hover:bg-primary-hover text-on-primary"
                >
                  {cancelInvitationMutation.isPending ? 'Đang thu hồi...' : 'Thu hồi lời mời'}
                </Button>
              </div>
            </DialogFrame>
        )}

        {/* DIALOG: Confirmation to Leave Group */}
        {isLeaveConfirmOpen && (
          <DialogFrame
            onClose={() => setIsLeaveConfirmOpen(false)}
            zIndexClassName="z-50"
            maxWidthClassName="max-w-md"
            className="p-6 space-y-4 border-danger-border"
          >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                  <LogOut className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-text">
                    Rời khỏi nhóm Mentoring?
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    Bạn sẽ không còn là thành viên của nhóm <strong>{group.name}</strong> và không thể tham gia vào các Mentoring Request mới của nhóm.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLeaveConfirmOpen(false)}
                  disabled={leaveGroupMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => leaveGroupMutation.mutate()}
                  disabled={leaveGroupMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {leaveGroupMutation.isPending ? 'Đang xử lý...' : 'Xác nhận rời nhóm'}
                </Button>
              </div>
            </DialogFrame>
        )}
        {/* DIALOG: Confirmation to Delete Group */}
        {isDeleteConfirmOpen && (
          <DialogFrame
            onClose={() => setIsDeleteConfirmOpen(false)}
            zIndexClassName="z-50"
            maxWidthClassName="max-w-md"
            className="p-6 space-y-4 border-danger-border"
          >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display text-base font-bold text-text">
                    Giải tán nhóm Mentoring?
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    Nhóm <strong>{group.name}</strong> sẽ bị giải tán, các lời mời đang chờ bị hủy và thành viên sẽ nhận được thông báo. Không thể giải tán khi nhóm còn Mentoring Request hoặc nhiệm vụ chưa kết thúc.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  disabled={deleteGroupMutation.isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => deleteGroupMutation.mutate()}
                  disabled={deleteGroupMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {deleteGroupMutation.isPending ? 'Đang xử lý...' : 'Xác nhận giải tán'}
                </Button>
              </div>
            </DialogFrame>
        )}
      </MentoringTermsGate>
    </Container>
  )
}
