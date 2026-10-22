import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Heart,
  UserPlus,
  MessageCircle,
  HelpCircle,
  ShieldAlert,
  PartyPopper,
  Megaphone,
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Briefcase,
  FileText,
  Send,
  Users,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageHeader, Avatar, Card, EmptyState, Skeleton, Pagination, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { mentoringGroupApi } from '@/features/mentorship/api/mentoringGroupApi'
import { useAcceptIncomingRequest, useDeclineIncomingRequest } from '@/features/mentorship'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  type NotificationItem,
  type NotificationType,
} from '@/features/notification'

const ICONS: Record<NotificationType, LucideIcon> = {
  POST_LIKE: Heart,
  POST_COMMENT: MessageCircle,
  USER_FOLLOW: UserPlus,
  FORUM_ANSWER: HelpCircle,
  REPORT_RESOLVED: ShieldAlert,
  WELCOME: PartyPopper,
  SYSTEM_BROADCAST: Megaphone,
  MENTORING_REQUEST: Send,
  MENTORING_TASK: Briefcase,
  MENTORING_WORK_LOG: FileText,
  MENTORING_GROUP: Users,
  MENTORING_ACCOUNT: Briefcase,
}

const TONES: Record<NotificationType, string> = {
  POST_LIKE: 'bg-danger text-text-inverse shadow-md shadow-rose-500/30',
  POST_COMMENT: 'bg-info text-text-inverse shadow-md shadow-sky-500/30',
  USER_FOLLOW: 'bg-primary-solid text-on-primary shadow-md shadow-brand-500/30',
  FORUM_ANSWER: 'bg-info text-text-inverse shadow-md shadow-violet-500/30',
  REPORT_RESOLVED: 'bg-warning text-text-inverse shadow-md shadow-amber-500/30',
  WELCOME: 'bg-success text-text-inverse shadow-md shadow-emerald-500/30',
  SYSTEM_BROADCAST: 'bg-gradient-to-r from-amber-500 to-brand-600 text-white shadow-md shadow-brand-500/30',
  MENTORING_REQUEST: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30',
  MENTORING_TASK: 'bg-teal-600 text-white shadow-md shadow-teal-600/30',
  MENTORING_WORK_LOG: 'bg-success text-text-inverse shadow-md shadow-emerald-600/30',
  MENTORING_GROUP: 'bg-info text-text-inverse shadow-md shadow-violet-600/30',
  MENTORING_ACCOUNT: 'bg-info text-text-inverse shadow-md shadow-sky-600/30',
}

function formatRelativeTime(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (diff < 60) return 'Vừa xong'
    if (diff < 3600) return `${Math.floor(diff / 60)} phút`
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày`
    return new Date(dateString).toLocaleDateString('vi-VN')
  } catch {
    return 'Gần đây'
  }
}

/** targetId của thông báo nhóm có dạng "groupId:memberId". */
function parseGroupId(targetId?: string | null): number {
  const groupId = Number(targetId?.split(':')[0])
  return Number.isInteger(groupId) && groupId > 0 ? groupId : 0
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [page, setPage] = useState(0)
  const [respondingId, setRespondingId] = useState<number | null>(null)
  const [respondedInvitations, setRespondedInvitations] = useState<Record<number, 'ACCEPTED' | 'DECLINED'>>({})
  const pageSize = 15

  const { data, isLoading } = useNotifications(page, pageSize)
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllMutation = useMarkAllNotificationsAsRead()
  const acceptIncomingMutation = useAcceptIncomingRequest()
  const declineIncomingMutation = useDeclineIncomingRequest()

  const { data: myGroups = [] } = useQuery({
    queryKey: ['mentoring-groups'],
    queryFn: () => mentoringGroupApi.getAll(),
    staleTime: 30_000,
  })

  const { data: pendingInvitations = [], isLoading: loadingInvitations } = useQuery({
    queryKey: ['mentoring-groups', 'invitations'],
    queryFn: () => mentoringGroupApi.getInvitations(),
    staleTime: 30_000,
  })

  const notifications = data?.content || []
  const totalPages = data?.totalPages || 1
  const hasUnread = notifications.some((n) => !n.isRead)

  const handleAcceptInvitation = async (notification: NotificationItem, groupId: number) => {
    try {
      setRespondingId(notification.id)
      await mentoringGroupApi.accept(groupId)
      setRespondedInvitations((prev) => ({
        ...prev,
        [notification.id]: 'ACCEPTED',
        [groupId]: 'ACCEPTED',
      }))
      toast.success('Bạn đã chấp nhận tham gia nhóm mentoring!')
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id)
      }
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups', 'invitations'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể chấp nhận lời mời'
      if (
        errMsg.toLowerCase().includes('đã là thành viên') ||
        errMsg.toLowerCase().includes('đã tham gia')
      ) {
        setRespondedInvitations((prev) => ({
          ...prev,
          [notification.id]: 'ACCEPTED',
          [groupId]: 'ACCEPTED',
        }))
        toast.info('Bạn đã là thành viên của nhóm này')
        if (!notification.isRead) {
          markAsReadMutation.mutate(notification.id)
        }
      } else {
        toast.error(errMsg)
      }
    } finally {
      setRespondingId(null)
    }
  }

  const handleDeclineInvitation = async (notification: NotificationItem, groupId: number) => {
    try {
      setRespondingId(notification.id)
      await mentoringGroupApi.decline(groupId)
      setRespondedInvitations((prev) => ({
        ...prev,
        [notification.id]: 'DECLINED',
        [groupId]: 'DECLINED',
      }))
      toast.success('Đã từ chối lời mời tham gia nhóm')
      if (!notification.isRead) {
        markAsReadMutation.mutate(notification.id)
      }
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups'] })
      queryClient.invalidateQueries({ queryKey: ['mentoring-groups', 'invitations'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] })
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể từ chối lời mời'
      toast.error(errMsg)
    } finally {
      setRespondingId(null)
    }
  }

  const handleIncomingRequest = async (notification: NotificationItem, requestId: number, accepted: boolean) => {
    try {
      setRespondingId(notification.id)
      if (accepted) {
        await acceptIncomingMutation.mutateAsync({ requestId })
        toast.success('Đã nhận yêu cầu Mentoring. Kênh trao đổi đã được mở.')
      } else {
        await declineIncomingMutation.mutateAsync({ requestId })
        toast.success('Đã bỏ qua yêu cầu Mentoring.')
      }
      if (!notification.isRead) markAsReadMutation.mutate(notification.id)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu Mentoring'
      // Yêu cầu đã đóng/hết hạn: nút phản hồi không còn tác dụng, đánh dấu đã đọc để ẩn đi và tránh bấm lặp
      if (message.includes('đã đóng')) {
        if (!notification.isRead) markAsReadMutation.mutate(notification.id)
        queryClient.invalidateQueries({ queryKey: ['notifications'] })
        queryClient.invalidateQueries({ queryKey: ['mentoring', 'incoming-requests'] })
        return
      }
      toast.error(message)
    } finally {
      setRespondingId(null)
    }
  }

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id)
    }

    // Điều hướng tương ứng theo loại và đối tượng mục tiêu
    if (item.type === 'WELCOME') {
      navigate('/app')
    } else if (item.type === 'REPORT_RESOLVED') {
      navigate('/app')
    } else if (item.targetType === 'MENTOR_PAYOUT') {
      navigate('/app/mentoring/earnings')
    } else if (item.targetType === 'MENTORING_REFUND') {
      navigate('/app/mentoring/refunds')
    } else if (item.targetType === 'MENTOR_SUBSCRIPTION') {
      navigate('/app/mentoring/subscription')
    } else if (item.targetType === 'MENTORING_REQUEST_CLOSED' && item.targetId) {
      navigate(`/app/mentoring/requests/${item.targetId}`)
    } else if (item.targetType === 'MENTORING_INCOMING_REQUEST_CLOSED' && item.targetId) {
      navigate(`/app/mentoring/incoming-requests/${item.targetId}`)
    } else if (item.targetType === 'MENTORING_GROUP_REQUEST_CHAT' && item.targetId) {
      // targetId = "groupId:conversationId": mở thẳng Chat for Task của nhóm với Mentor
      const conversationId = Number(item.targetId.split(':')[1])
      navigate(conversationId ? `/app/mentoring/chats/${conversationId}` : '/app/mentoring/messages')
    } else if (item.targetType?.startsWith('MENTORING_GROUP') && item.targetId) {
      const gId = item.targetType === 'MENTORING_GROUP_DISBANDED' ? 0 : parseGroupId(item.targetId)
      navigate(gId ? `/app/mentoring/groups/${gId}` : '/app/mentoring/groups')
    } else if (item.targetType?.startsWith('MENTORING_TASK') && item.targetId) {
      navigate(`/app/mentoring/tasks/${item.targetId.split(':')[0]}`)
    } else if (item.type === 'MENTORING_WORK_LOG' && item.targetId) {
      navigate(`/app/mentoring/tasks/${item.targetId}`)
    } else if (item.targetType === 'MENTORING_INCOMING_REQUEST' && item.targetId) {
      navigate(`/app/mentoring/incoming-requests/${item.targetId}`)
    } else if (item.targetType?.startsWith('MENTORING_REQUEST') && item.targetId) {
      navigate(`/app/mentoring/requests/${item.targetId}`)
    } else if (item.targetType === 'POST' && item.targetId) {
      navigate(`/app/posts/${item.targetId}`)
    } else if (item.targetType === 'USER' && item.targetId) {
      navigate(`/app/profile?userId=${item.targetId}`)
    } else if (item.targetType === 'QUESTION' && item.targetId) {
      navigate(`/app/forum/${item.targetId}`)
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <PageHeader
        icon={<Bell size={20} />}
        title="Thông báo"
        subtitle="Cập nhật thông báo các hoạt động gần đây."
        actions={
          hasUnread && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={markAllMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-11 w-11 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
            </Card>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={<Bell size={40} className="text-text-subtle" />}
            title="Chưa có thông báo nào"
            description="Bạn sẽ nhận được thông báo khi có người thích, bình luận bài viết, theo dõi hoặc trả lời câu hỏi của bạn."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, idx) => {
            const Icon = ICONS[n.type] || Bell
            const toneClass = TONES[n.type] || 'bg-brand-500/15 text-primary-solid'
            const avatarName = n.senderName || 'Hệ thống AlumNect'
            const isSystemBroadcast = n.type === 'SYSTEM_BROADCAST'
            const isReportResolved = n.type === 'REPORT_RESOLVED'

            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.25) }}
              >
                <Card
                  hover
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    'group flex cursor-pointer items-center gap-4 p-4 transition-all duration-200 hover:shadow-md dark:border-border',
                    !n.isRead
                      ? 'bg-brand-500/[0.05] ring-1 ring-inset ring-brand-400/30 dark:bg-surface-2/60 dark:ring-brand-500/40'
                      : 'bg-surface opacity-90 hover:opacity-100'
                  )}
                >
                  {/* Logo / Avatar: Thông báo hệ thống và Vi phạm tiêu chuẩn có logo riêng biệt */}
                  {isSystemBroadcast ? (
                    <div className="relative shrink-0">
                      <div className="grid h-[46px] w-[46px] place-items-center rounded-2xl bg-gradient-to-br from-amber-500 via-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 ring-2 ring-surface dark:from-amber-500 dark:via-brand-500 dark:to-brand-600">
                        <Megaphone size={22} className="text-white drop-shadow-sm" />
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-success text-text-inverse ring-2 ring-surface shadow-xs"
                        title="Thông báo chính thức từ hệ thống"
                      >
                        <ShieldCheck size={12} strokeWidth={3} className="text-white" />
                      </span>
                    </div>
                  ) : isReportResolved ? (
                    <div className="relative shrink-0">
                      <div className="grid h-[46px] w-[46px] place-items-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-surface dark:from-rose-500 dark:via-red-500 dark:to-orange-500">
                        <ShieldAlert size={22} className="text-white drop-shadow-sm" />
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-warning text-text-inverse ring-2 ring-surface shadow-xs"
                        title="Vi phạm tiêu chuẩn cộng đồng"
                      >
                        <AlertTriangle size={11} strokeWidth={3} className="text-white" />
                      </span>
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <Avatar src={n.senderAvatarUrl || undefined} name={avatarName} size={46} />
                      <span
                        className={cn(
                          'absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full ring-2 ring-surface',
                          toneClass
                        )}
                      >
                        <Icon
                          size={14}
                          strokeWidth={2.5}
                          className={n.type === 'POST_LIKE' ? 'fill-white' : ''}
                        />
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    {n.title && (
                      <p className="text-sm font-bold text-text mb-0.5">{n.title}</p>
                    )}
                    <p className="text-sm leading-snug text-text">
                      {n.senderName && !n.title && (
                        <span className="font-bold text-text mr-1.5">
                          {n.senderName}
                        </span>
                      )}
                      <span className="text-text-muted">{n.content}</span>
                    </p>
                    <span className="mt-1 block text-xs text-text-subtle dark:text-text-subtle">
                      {formatRelativeTime(n.createdAt)}
                    </span>

                    {/* Interactive Group Invitation Actions */}
                    {(() => {
                      const isGroupInvitation = n.targetType === 'MENTORING_GROUP_INVITATION'
                      const groupId = parseGroupId(n.targetId)

                      if (!isGroupInvitation || !groupId) return null

                      const sessionStatus = respondedInvitations[n.id] || respondedInvitations[groupId]
                      const group = myGroups.find((g) => g.id === groupId)
                      const myMember = group?.members?.find((m) => Number(m.userId) === Number(currentUser?.id))
                      const isMemberJoined = Boolean(
                        group && (
                          (currentUser && Number(group.leaderId) === Number(currentUser.id)) ||
                          myMember?.status === 'JOINED' ||
                          myMember?.status === 'ACTIVE'
                        )
                      )
                      const isMemberDeclined = myMember?.status === 'DECLINED'
                      const isPendingInApi = pendingInvitations.some((inv) => inv.id === groupId)

                      const isJoined = sessionStatus === 'ACCEPTED' || isMemberJoined
                      const isDeclined = sessionStatus === 'DECLINED' || isMemberDeclined

                      if (isJoined) {
                        return (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              Đã tham gia nhóm
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs font-semibold px-2 text-text-subtle hover:text-primary-solid hover:bg-surface-soft rounded-lg gap-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/app/mentoring/groups/${groupId}`)
                              }}
                            >
                              Xem nhóm
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      }

                      if (isDeclined) {
                        return (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted bg-surface-soft px-2.5 py-1 rounded-lg border border-border">
                              <X className="h-3.5 w-3.5 text-text-muted" />
                              Đã từ chối lời mời
                            </span>
                          </div>
                        )
                      }

                      // Nếu lời mời không còn trong danh sách chờ của API và đã tải xong
                      if (!loadingInvitations && !isPendingInApi) {
                        return (
                          <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1">
                            <span className="text-xs text-text-subtle">
                              Lời mời đã đóng hoặc đã được phản hồi
                            </span>
                            <button
                              type="button"
                              className="h-7 inline-flex items-center text-xs font-semibold px-2 text-text-subtle hover:text-primary-solid hover:underline"
                              onClick={(e) => {
                                e.stopPropagation()
                                navigate(`/app/mentoring/groups/${groupId}`)
                              }}
                            >
                              Xem nhóm
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="primary"
                            className="h-7 text-xs font-bold px-3 rounded-lg gap-1 shadow-2xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAcceptInvitation(n, groupId)
                            }}
                            disabled={respondingId === n.id}
                          >
                            {respondingId === n.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Chấp nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs font-bold px-2.5 rounded-lg text-danger hover:bg-danger-soft"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeclineInvitation(n, groupId)
                            }}
                            disabled={respondingId === n.id}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Từ chối
                          </Button>
                          <button
                            type="button"
                            className="h-7 inline-flex items-center text-xs font-semibold px-2 text-text-subtle hover:text-primary-solid hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/app/mentoring/groups/${groupId}`)
                            }}
                          >
                            Xem nhóm
                          </button>
                        </div>
                      )
                    })()}

                    {(() => {
                      const requestId = Number(n.targetId)
                      if (n.isRead || n.targetType !== 'MENTORING_INCOMING_REQUEST' || !Number.isInteger(requestId) || requestId <= 0) {
                        return null
                      }
                      return (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-7 rounded-lg px-3 text-xs font-bold"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleIncomingRequest(n, requestId, true)
                            }}
                            disabled={respondingId === n.id}
                          >
                            {respondingId === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Nhận
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 rounded-lg px-2.5 text-xs font-bold text-danger hover:bg-danger-soft"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleIncomingRequest(n, requestId, false)
                            }}
                            disabled={respondingId === n.id}
                          >
                            <X className="mr-1 h-3 w-3" />
                            Bỏ qua
                          </Button>
                          <button
                            type="button"
                            className="inline-flex h-7 items-center px-2 text-xs font-semibold text-text-subtle hover:text-primary-solid hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/app/mentoring/incoming-requests/${requestId}`)
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      )
                    })()}
                  </div>

                  {!n.isRead && (
                    <span
                      title="Chưa đọc"
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary-solid shadow-sm"
                    />
                  )}
                </Card>
              </motion.div>
            )
          })}

          {/* Phân trang */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  )
}
