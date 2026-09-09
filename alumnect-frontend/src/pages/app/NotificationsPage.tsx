import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader, Avatar, Card, EmptyState, Skeleton, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  type NotificationItem,
  type NotificationType,
} from '@/features/notification'

const ICONS: Record<NotificationType, any> = {
  POST_LIKE: Heart,
  POST_COMMENT: MessageCircle,
  USER_FOLLOW: UserPlus,
  FORUM_ANSWER: HelpCircle,
  REPORT_RESOLVED: ShieldAlert,
  WELCOME: PartyPopper,
  SYSTEM_BROADCAST: Megaphone,
}

const TONES: Record<NotificationType, string> = {
  POST_LIKE: 'bg-rose-500 text-white shadow-md shadow-rose-500/30',
  POST_COMMENT: 'bg-sky-500 text-white shadow-md shadow-sky-500/30',
  USER_FOLLOW: 'bg-brand-500 text-white shadow-md shadow-brand-500/30',
  FORUM_ANSWER: 'bg-violet-600 text-white shadow-md shadow-violet-500/30',
  REPORT_RESOLVED: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
  WELCOME: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30',
  SYSTEM_BROADCAST: 'bg-gradient-to-r from-amber-500 to-brand-600 text-white shadow-md shadow-brand-500/30',
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

export function NotificationsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const pageSize = 15

  const { data, isLoading } = useNotifications(page, pageSize)
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllMutation = useMarkAllNotificationsAsRead()

  const notifications = data?.content || []
  const totalPages = data?.totalPages || 1
  const hasUnread = notifications.some((n) => !n.isRead)

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsReadMutation.mutate(item.id)
    }

    // Điều hướng tương ứng theo loại và đối tượng mục tiêu
    if (item.type === 'WELCOME') {
      navigate('/app')
    } else if (item.type === 'REPORT_RESOLVED') {
      navigate('/app')
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
            icon={<Bell size={40} className="text-plum-400" />}
            title="Chưa có thông báo nào"
            description="Bạn sẽ nhận được thông báo khi có người thích, bình luận bài viết, theo dõi hoặc trả lời câu hỏi của bạn."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n, idx) => {
            const Icon = ICONS[n.type] || Bell
            const toneClass = TONES[n.type] || 'bg-brand-500/15 text-brand-600'
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
                    'group flex cursor-pointer items-center gap-4 p-4 transition-all duration-200 hover:shadow-md',
                    !n.isRead
                      ? 'bg-brand-500/[0.05] ring-1 ring-inset ring-brand-400/30'
                      : 'bg-white/95 opacity-90 hover:opacity-100'
                  )}
                >
                  {/* Logo / Avatar: Thông báo hệ thống và Vi phạm tiêu chuẩn có logo riêng biệt */}
                  {isSystemBroadcast ? (
                    <div className="relative shrink-0">
                      <div className="grid h-[46px] w-[46px] place-items-center rounded-2xl bg-gradient-to-br from-amber-500 via-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 ring-2 ring-white">
                        <Megaphone size={22} className="drop-shadow-xs" />
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white shadow-xs"
                        title="Thông báo chính thức từ hệ thống"
                      >
                        <ShieldCheck size={12} strokeWidth={3} />
                      </span>
                    </div>
                  ) : isReportResolved ? (
                    <div className="relative shrink-0">
                      <div className="grid h-[46px] w-[46px] place-items-center rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-amber-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-white">
                        <ShieldAlert size={22} className="drop-shadow-xs" />
                      </div>
                      <span
                        className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-white ring-2 ring-white shadow-xs"
                        title="Vi phạm tiêu chuẩn cộng đồng"
                      >
                        <AlertTriangle size={11} strokeWidth={3} />
                      </span>
                    </div>
                  ) : (
                    <div className="relative shrink-0">
                      <Avatar src={n.senderAvatarUrl || undefined} name={avatarName} size={46} />
                      <span
                        className={cn(
                          'absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full ring-2 ring-white',
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
                      <p className="text-sm font-bold text-slate-950 mb-0.5">{n.title}</p>
                    )}
                    <p className="text-sm leading-snug text-slate-800">
                      {n.senderName && !n.title && (
                        <span className="font-bold text-slate-950 mr-1.5">
                          {n.senderName}
                        </span>
                      )}
                      <span className="text-slate-700">{n.content}</span>
                    </p>
                    <span className="mt-1 block text-xs text-slate-400">
                      {formatRelativeTime(n.createdAt)}
                    </span>
                  </div>

                  {!n.isRead && (
                    <span
                      title="Chưa đọc"
                      className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 shadow-sm"
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
