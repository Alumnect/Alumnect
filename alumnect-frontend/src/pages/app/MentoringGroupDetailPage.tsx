import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()
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
      toast.success(t('mentoring.invitationRevokedSuccess'))
      setInvitationToCancel(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || t('mentoring.revokeInvitationError'))
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => mentoringGroupApi.remove(groupId, userId),
    onSuccess: () => {
      toast.success(t('mentoring.memberRemovedSuccess'))
      setMemberToRemove(null)
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || t('mentoring.removeMemberError'))
    },
  })

  const leaveGroupMutation = useMutation({
    mutationFn: () => mentoringGroupApi.leaveGroup(groupId),
    onSuccess: () => {
      toast.success(t('mentoring.leaveGroupSuccess'))
      setIsLeaveConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      navigate('/app/mentoring/groups')
    },
    onError: (err: Error) => {
      toast.error(err.message || t('mentoring.leaveGroupError'))
    },
  })

  const deleteGroupMutation = useMutation({
    mutationFn: () => mentoringGroupApi.deleteGroup(groupId),
    onSuccess: () => {
      toast.success(t('mentoring.disbandGroupSuccess'))
      setIsDeleteConfirmOpen(false)
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      navigate('/app/mentoring/groups')
    },
    onError: (err: Error) => {
      toast.error(err.message || t('mentoring.disbandGroupError'))
    },
  })

  const reinviteMutation = useMutation({
    mutationFn: (userId: number) => mentoringGroupApi.invite(groupId, [userId]),
    onSuccess: () => {
      toast.success(t('mentoring.reinviteSuccess'))
      queryClient.invalidateQueries({ queryKey: ['mentoring-group', groupId] })
    },
    onError: (err: Error) => {
      toast.error(err.message || t('mentoring.reinviteError'))
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
        <h2 className="text-xl font-bold text-text">{t('mentoring.groupNotFoundTitle')}</h2>
        <p className="text-sm text-text-subtle max-w-md mx-auto">
          {(error as Error)?.message || t('mentoring.groupNotFoundDesc')}
        </p>
        <Button variant="primary" onClick={() => navigate('/app/mentoring/groups')}>
          {t('mentoring.backToGroupsList')}
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
            <CheckCircle2 className="h-3 w-3" /> {t('mentoring.memberStatusJoined')}
          </span>
        )
      case 'PENDING':
      case 'INVITED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning">
            <Clock className="h-3 w-3" /> {t('mentoring.memberStatusPending')}
          </span>
        )
      case 'DECLINED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
            <XCircle className="h-3 w-3" /> {t('mentoring.memberStatusDeclined')}
          </span>
        )
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-0.5 text-xs font-bold text-text-muted dark:bg-surface-2">
            <Ban className="h-3 w-3" /> {t('mentoring.memberStatusCancelled')}
          </span>
        )
      case 'REMOVED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-bold text-danger">
            <Trash2 className="h-3 w-3" /> {t('mentoring.memberStatusRemoved')}
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
            {t('mentoring.mentoringGroupsNav')}
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
                {t('mentoring.createMentoringRequestBtn')}
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
                {t('mentoring.disbandGroupBtn')}
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
                {t('mentoring.leaveGroupBtn')}
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
                    {group.status === 'ACTIVE' ? t('mentoring.statusActive') : group.status}
                  </span>
                  {isLeader && (
                    <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary-solid">
                      {t('mentoring.youAreLeader')}
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
                    {t('mentoring.leaderLabel')} <strong>{group.leaderName || t('mentoring.groupLeader')}</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-success" />
                    <strong>{joinedMembers.length}</strong> {t('mentoring.officialMembersCount', { count: joinedMembers.length }).replace(String(joinedMembers.length) + ' ', '')}
                  </span>
                  {pendingMembers.length > 0 && (
                    <span className="flex items-center gap-1.5 text-warning font-bold">
                      <Clock className="h-4 w-4" />
                      {t('mentoring.pendingInvitationsCount', { count: pendingMembers.length })}
                    </span>
                  )}
                  {group.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {t('mentoring.createdDateAt', { date: new Date(group.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') })}
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
                  {t('mentoring.inviteMembersBtn')}
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-6 border-t border-border pt-4">
            <MentoringFilterTabs
              ariaLabel={t('mentoring.groupSectionsAria')}
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'OVERVIEW', label: t('mentoring.tabOverview') },
                {
                  value: 'MEMBERS',
                  label:
                    pendingMembers.length > 0
                      ? t('mentoring.tabMembersWithPending', { joined: joinedMembers.length, pending: pendingMembers.length })
                      : t('mentoring.tabMembersOnly', { joined: joinedMembers.length }),
                },
                { value: 'REQUESTS', label: t('mentoring.tabRequests', { count: requests.length }) },
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
                    {t('mentoring.officialMembersHeading', { count: joinedMembers.length })}
                  </h3>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsInviteModalOpen(true)}
                      className="text-xs font-bold text-primary-solid hover:text-primary-solid"
                    >
                      {t('mentoring.inviteMoreBtn')}
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
                              {t('mentoring.groupLeader')}
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
                    {t('mentoring.linkedRequestsHeading', { count: requests.length })}
                  </h3>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                      className="text-xs font-bold text-primary-solid hover:text-primary-solid"
                    >
                      {t('mentoring.createNewRequestBtn')}
                    </Button>
                  )}
                </div>

                {loadingRequests ? (
                  <div className="py-8 text-center text-xs text-text-subtle">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-primary-solid mb-2" />
                    {t('mentoring.loadingRequestsList')}
                  </div>
                ) : requests.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <p className="text-xs text-text-subtle">
                      {t('mentoring.groupNoRequestsYet')}
                    </p>
                    {isLeader && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                        className="rounded-xl text-xs font-bold"
                      >
                        {t('mentoring.createFirstRequestBtn')}
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
                            <span>{t('mentoring.typePrefix', { type: req.requestType === 'DIRECT' ? t('mentoring.requestTypeDirectLabel') : t('mentoring.requestTypeMatchingLabel') })}</span>
                            <span>•</span>
                            <span>{new Date(req.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}</span>
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
                  {t('mentoring.processGroupFirstHeading')}
                </h4>
                <ul className="text-xs text-primary-solid space-y-2.5 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      {t('mentoring.processGroupFirstP1')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      {t('mentoring.processGroupFirstP2')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary-solid shrink-0 mt-0.5">•</span>
                    <span className="flex-1">
                      {t('mentoring.processGroupFirstP3')}
                    </span>
                  </li>
                </ul>
              </Card>

              {/* Quick Actions */}
              <Card hover={false} className="border border-border p-5 space-y-3 dark:bg-surface">
                <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                  {t('mentoring.quickActionsHeading')}
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
                        {t('mentoring.createRequestForGroupBtn')}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-xs font-bold rounded-xl gap-2 border-border"
                        onClick={() => setIsInviteModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4" />
                        {t('mentoring.inviteMoreMembersBtn')}
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
                      {t('mentoring.leaveGroupActionBtn')}
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
                    {t('mentoring.activeMembersHeading', { count: joinedMembers.length })}
                  </h3>
                  <p className="text-xs text-text-subtle">
                    {t('mentoring.activeMembersSubtext')}
                  </p>
                </div>
                {isLeader && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="gap-1.5 rounded-xl text-xs font-bold"
                  >
                    <UserPlus className="h-4 w-4" /> {t('mentoring.inviteMembersBtn')}
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-subtle font-bold">
                      <th className="py-2.5 px-3">{t('mentoring.tableHeaderMember')}</th>
                      <th className="py-2.5 px-3">{t('mentoring.tableHeaderMajorEmail')}</th>
                      <th className="py-2.5 px-3">{t('mentoring.tableHeaderStatus')}</th>
                      <th className="py-2.5 px-3">{t('mentoring.tableHeaderJoinDate')}</th>
                      {isLeader && <th className="py-2.5 px-3 text-right">{t('mentoring.tableHeaderActions')}</th>}
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
                                    {t('mentoring.groupLeader')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-text-muted">
                          <div>{member.major || t('mentoring.notUpdated')}</div>
                          <div className="text-xs text-text-subtle">{member.email}</div>
                        </td>
                        <td className="py-3 px-3">{getStatusBadge(member.status)}</td>
                        <td className="py-3 px-3 text-text-subtle">
                          {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US') : '—'}
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
                                {t('common.delete')}
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
                    {t('mentoring.pendingInvitationsHeading', { count: pendingMembers.length })}
                  </h3>
                  <p className="text-xs text-warning">
                    {t('mentoring.pendingInvitationsSubtext')}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-warning-border text-warning font-bold">
                        <th className="py-2 px-3">{t('mentoring.tableHeaderInvitedPerson')}</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">{t('mentoring.tableHeaderInviteTime')}</th>
                        <th className="py-2 px-3">{t('mentoring.tableHeaderStatus')}</th>
                        {isLeader && <th className="py-2 px-3 text-right">{t('mentoring.tableHeaderActions')}</th>}
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
                            {new Date(member.invitedAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
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
                                {t('mentoring.revokeInvitationAction')}
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
                    {t('mentoring.invitationHistoryHeading', { count: historyMembers.length })}
                  </h3>
                  <p className="text-xs text-text-subtle">
                    {t('mentoring.invitationHistorySubtext')}
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-subtle font-bold">
                        <th className="py-2 px-3">{t('mentoring.tableHeaderMember')}</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">{t('mentoring.tableHeaderStatus')}</th>
                        <th className="py-2 px-3 text-right">{t('mentoring.tableHeaderActions')}</th>
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
                              {t('mentoring.reinviteAction')}
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
                    {t('mentoring.allGroupRequestsHeading', { count: requests.length })}
                  </h3>
                  <p className="text-xs text-text-subtle">
                    {t('mentoring.allGroupRequestsSubtext')}
                  </p>
                </div>
                {isLeader && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                    className="gap-1.5 rounded-xl text-xs font-bold shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" /> {t('mentoring.createNewRequestBtn')}
                  </Button>
                )}
              </div>

              {loadingRequests ? (
                <div className="py-12 text-center text-xs text-text-subtle">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary-solid mb-2" />
                  {t('mentoring.loadingAllRequests')}
                </div>
              ) : requests.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-xs text-text-subtle">
                    {t('mentoring.noGroupRequestsYet')}
                  </p>
                  {isLeader && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/app/mentoring/requests/create?groupId=${group.id}`)}
                      className="rounded-xl text-xs font-bold"
                    >
                      {t('mentoring.startCreatingRequest')}
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
                            {t('mentoring.formatLabel')}<strong>{req.requestType === 'DIRECT' ? t('mentoring.directMentorAssigned') : t('mentoring.autoMatchingLabel')}</strong>
                          </span>
                          {req.targetMentorName && (
                            <span>
                              Mentor: <strong>{req.targetMentorName}</strong>
                            </span>
                          )}
                          <span>
                            {t('mentoring.createdDatePrefix')}{new Date(req.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
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
                            {t('mentoring.viewDeal')}
                          </Link>
                        )}
                        {req.taskId && (
                          <Link
                            to={`/app/mentoring/tasks/${req.taskId}`}
                            className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-text-muted hover:bg-surface-2"
                          >
                            {t('mentoring.viewTask')}
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
                    {t('mentoring.confirmRemoveMemberTitle')}
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    {t('mentoring.confirmRemoveMemberDesc', { name: memberToRemove.fullName })}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => removeMemberMutation.mutate(memberToRemove.userId)}
                  disabled={removeMemberMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {removeMemberMutation.isPending ? t('mentoring.removingText') : t('mentoring.removeFromGroupBtn')}
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
                    {t('mentoring.confirmRevokeInvitationTitle')}
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    {t('mentoring.confirmRevokeInvitationDesc', { name: invitationToCancel.fullName })}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => cancelInvitationMutation.mutate(invitationToCancel.id)}
                  disabled={cancelInvitationMutation.isPending}
                  className="bg-primary-solid hover:bg-primary-hover text-on-primary"
                >
                  {cancelInvitationMutation.isPending ? t('mentoring.revokingText') : t('mentoring.revokeInvitationBtn')}
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
                    {t('mentoring.confirmLeaveGroupTitle')}
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    {t('mentoring.confirmLeaveGroupDesc', { name: group.name })}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => leaveGroupMutation.mutate()}
                  disabled={leaveGroupMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {leaveGroupMutation.isPending ? t('mentoring.processingText') : t('mentoring.confirmLeaveBtn')}
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
                    {t('mentoring.confirmDisbandGroupTitle')}
                  </h3>
                  <p className="text-xs text-text-subtle leading-relaxed">
                    {t('mentoring.confirmDisbandGroupDesc', { name: group.name })}
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
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => deleteGroupMutation.mutate()}
                  disabled={deleteGroupMutation.isPending}
                  className="bg-danger hover:opacity-90 text-text-inverse"
                >
                  {deleteGroupMutation.isPending ? t('mentoring.processingText') : t('mentoring.confirmDisbandBtn')}
                </Button>
              </div>
            </DialogFrame>
        )}
      </MentoringTermsGate>
    </Container>
  )
}
