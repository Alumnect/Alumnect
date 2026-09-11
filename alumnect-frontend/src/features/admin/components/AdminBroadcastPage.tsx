import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Megaphone,
  Plus,
  XCircle,
  Trash2,
  Eye,
  Inbox,
  Loader2,
  Calendar,
  User,
  Users,
  X,
  Archive,
  Hourglass,
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, toast, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  useAdminSystemNotifications,
  useCancelSystemNotification,
  useArchiveSystemNotification,
} from '../hooks/useAdmin'
import type { SystemNotificationDto, SystemNotificationStatus } from '../api/adminApi'
import { CreateNotificationModal } from './CreateNotificationModal'

const DURATION_LABELS: Record<string, string> = {
  ONE_DAY: '1 ngày',
  ONE_WEEK: '1 tuần',
  ONE_MONTH: '1 tháng',
  ONE_YEAR: '1 năm',
  FOREVER: 'Vĩnh viễn',
  CUSTOM: 'Tùy chỉnh',
}

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'success' | 'gold' | 'danger' | 'neutral' }
> = {
  SENT: { label: 'Đang hoạt động', tone: 'success' },
  ACTIVE: { label: 'Đang hoạt động', tone: 'success' },
  SCHEDULED: { label: 'Đang hẹn giờ', tone: 'gold' },
  SENDING: { label: 'Đang gửi', tone: 'gold' },
  EXPIRED: { label: 'Đã hết hạn', tone: 'neutral' },
  ARCHIVED: { label: 'Đã lưu trữ', tone: 'neutral' },
  CANCELLED: { label: 'Đã hủy lịch', tone: 'danger' },
  DRAFT: { label: 'Bản nháp', tone: 'neutral' },
}

const STATUS_TABS: { label: string; value: SystemNotificationStatus | '' }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Đang hẹn giờ', value: 'SCHEDULED' },
  { label: 'Đang hoạt động', value: 'ACTIVE' },
  { label: 'Đã hết hạn', value: 'EXPIRED' },
  { label: 'Kho lưu trữ', value: 'ARCHIVED' },
]

const TIME_TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Hôm nay', value: 'TODAY' },
  { name: 'Tuần này', value: 'THIS_WEEK' },
  { name: 'Tháng này', value: 'THIS_MONTH' },
]

function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${hours}:${minutes} - ${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

export function AdminBroadcastPage() {
  const [statusFilter, setStatusFilter] = useState<SystemNotificationStatus | ''>('')
  const [timeFilter, setTimeFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<SystemNotificationDto | null>(null)
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null)
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null)

  const { data, isLoading, error } = useAdminSystemNotifications({
    timeFilter,
    status: statusFilter || undefined,
    page,
    size: pageSize,
  })

  const cancelMutation = useCancelSystemNotification()
  const archiveMutation = useArchiveSystemNotification()

  const notifications = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const handleCancelScheduled = async (id: number) => {
    try {
      await cancelMutation.mutateAsync(id)
      toast.success('Đã hủy thông báo hẹn giờ thành công!')
      setCancelTargetId(null)
      if (detailItem?.id === id) {
        setDetailItem(null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi hủy thông báo')
    }
  }

  const handleArchive = async (id: number) => {
    try {
      await archiveMutation.mutateAsync(id)
      toast.success('Đã lưu trữ thông báo vào kho lưu trữ thành công!')
      setArchiveTargetId(null)
      if (detailItem?.id === id) {
        setDetailItem(null)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi lưu trữ thông báo')
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Quản lý thông báo hệ thống"
        subtitle="Hẹn giờ thông báo, kiểm soát thời hạn hiệu lực và quản lý kho lưu trữ độc lập."
        actions={
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 font-bold shadow-sm"
            leftIcon={<Plus size={16} />}
          >
            Tạo thông báo mới
          </Button>
        }
      />

      {/* Tabs lọc trạng thái chính (Section 9: [All], [Scheduled], [Active], [Expired], [Archived]) */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 border-b border-plum-900/10 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value)
                setPage(0)
              }}
              className={cn(
                'rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer border',
                statusFilter === tab.value
                  ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-950 border-gold-400/60 shadow-sm'
                  : 'bg-white text-plum-700 border-plum-900/10 hover:bg-plum-50/70 hover:border-plum-900/20'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs lọc thời gian & Thống kê số lượng */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Time filter tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-plum-500 flex items-center gap-1">
            <Calendar size={13} className="text-gold-500" /> Mốc thời gian:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TIME_TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTimeFilter(t.value)
                  setPage(0)
                }}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer',
                  timeFilter === t.value
                    ? 'bg-plum-900 text-white shadow-xs'
                    : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-plum-400 font-medium">
            Tổng cộng: <strong className="text-plum-900 font-bold">{totalElements}</strong> thông báo
          </span>
        </div>
      </div>

      {/* Main Table */}
      <Reveal>
        {isLoading ? (
          <Card hover={false} className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Lỗi tải danh sách thông báo"
            description="Đã có lỗi hệ thống xảy ra. Vui lòng thử lại."
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={28} className="text-plum-400" />}
            title="Không có thông báo nào"
            description="Hiện không có thông báo hệ thống nào phù hợp với bộ lọc đã chọn."
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm text-left">
                <thead>
                  <tr className="border-b border-plum-900/8 text-xs uppercase tracking-wider text-plum-400 bg-plum-900/[0.02]">
                    <th className="px-5 py-3.5 font-bold">Tiêu đề & Nội dung</th>
                    <th className="px-5 py-3.5 font-bold">Đối tượng nhận</th>
                    <th className="px-5 py-3.5 font-bold text-center">Trạng thái</th>
                    <th className="px-5 py-3.5 font-bold">Mốc thời gian</th>
                    <th className="px-5 py-3.5 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {notifications.map((item) => (
                    <tr key={item.id} className="transition-colors hover:bg-plum-900/[0.015]">
                      {/* Tiêu đề & Nội dung */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-plum-950 text-sm leading-snug line-clamp-1">{item.title}</p>
                          <p className="text-xs text-plum-500 mt-1 line-clamp-2">{item.content}</p>
                        </div>
                      </td>

                      {/* Đối tượng nhận */}
                      <td className="px-5 py-4">
                        {item.recipientType === 'ALL_USERS' ? (
                          <Badge tone="brand" className="px-2.5 py-0.5 text-xs font-bold">
                            Tất cả người dùng
                          </Badge>
                        ) : item.recipientType === 'USER_ROLE' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] text-plum-400 font-medium">Nhóm vai trò:</span>
                            <Badge
                              tone={
                                item.recipientRole === 'STUDENT'
                                  ? 'brand'
                                  : item.recipientRole === 'ALUMNI'
                                    ? 'gold'
                                    : 'neutral'
                              }
                              className="px-2.5 py-0.5 text-xs font-bold self-start"
                            >
                              {item.recipientRole === 'STUDENT'
                                ? 'Sinh viên'
                                : item.recipientRole === 'ALUMNI'
                                  ? 'Cựu sinh viên'
                                  : 'Quản trị viên'}
                            </Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={item.recipientUser?.avatarUrl}
                              name={item.recipientUser?.fullName || 'User'}
                              size={30}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-plum-900 truncate">
                                {item.recipientUser?.fullName || 'Người dùng'}
                              </p>
                              <p className="text-[10px] text-plum-400 truncate">{item.recipientUser?.email}</p>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-5 py-4 text-center">
                        <Badge
                          tone={
                            item.status === 'SCHEDULED' || item.status === 'SENDING'
                              ? 'gold'
                              : item.status === 'SENT' || item.status === 'ACTIVE'
                                ? 'success'
                                : item.status === 'EXPIRED' || item.status === 'ARCHIVED'
                                  ? 'neutral'
                                  : 'danger'
                          }
                          className="px-2.5 py-0.5 text-xs font-bold"
                        >
                          {STATUS_CONFIG[item.status]?.label || item.status}
                        </Badge>
                      </td>

                      {/* Mốc thời gian */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-[11px] text-plum-600">
                          {item.status === 'SCHEDULED' ? (
                            <div>
                              <span className="text-gold-700 font-semibold">Hẹn gửi: </span>
                              <strong>[{formatDateTime(item.scheduledAt)}]</strong>
                            </div>
                          ) : (
                            <div>
                              <span className="text-emerald-700 font-semibold">Đã gửi: </span>
                              <strong>[{formatDateTime(item.sentAt || item.createdAt)}]</strong>
                            </div>
                          )}
                          <div className="text-plum-400">
                            <span>Hết hạn: </span>
                            {item.durationType === 'FOREVER' || !item.expiresAt ? (
                              <span className="font-semibold text-plum-500">Vĩnh viễn</span>
                            ) : (
                              <span>[{formatDateTime(item.expiresAt)}]</span>
                            )}
                          </div>
                          {item.archivedAt && (
                            <div className="text-purple-600 font-medium">
                              <span>Lưu trữ: [{formatDateTime(item.archivedAt)}]</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View - có cho mọi status */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailItem(item)}
                            className="h-8 px-2.5 text-xs font-bold bg-plum-900/[0.04] text-plum-700 hover:bg-plum-900/[0.08]"
                            title="Xem chi tiết"
                          >
                            <Eye size={13} />
                          </Button>

                          {/* Scheduled: Cancel Schedule */}
                          {item.status === 'SCHEDULED' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setCancelTargetId(item.id)}
                              className="h-8 px-2 text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              title="Hủy lịch gửi"
                            >
                              <Trash2 size={13} />
                            </Button>
                          )}

                          {/* Active / Expired: Archive button */}
                          {(item.status === 'SENT' || item.status === 'ACTIVE' || item.status === 'EXPIRED') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setArchiveTargetId(item.id)}
                              className="h-8 px-2 text-xs font-bold border border-plum-900/15 bg-plum-900/[0.03] text-plum-700 hover:bg-plum-900/[0.07]"
                              title="Lưu trữ thông báo"
                            >
                              <Archive size={13} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Phân trang chuẩn */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Reveal>

      {/* Modal Tạo Thông Báo */}
      <CreateNotificationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Modal Xem Chi Tiết Thông Báo */}
      {detailItem && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDetailItem(null)}
          />

          <Card
            hover={false}
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-plum-950/15 shadow-2xl bg-white max-h-[90vh] flex flex-col pop"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                  <Megaphone size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-plum-900 tracking-tight leading-tight">
                    Chi tiết thông báo hệ thống
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Mã #{detailItem.id} · Tạo lúc {formatDateTime(detailItem.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailItem(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-plum-400 hover:bg-plum-900/[0.05] hover:text-plum-900 transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung chi tiết - Có thanh cuộn */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-130px)]">
              {/* Tiêu đề & Trạng thái phát hành */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-brand-50/40 border border-brand-100/70">
                <div className="space-y-1 min-w-0 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 block">
                    Tiêu đề thông báo
                  </span>
                  <h4 className="text-base font-black text-plum-950 leading-snug">
                    {detailItem.title}
                  </h4>
                </div>
                <Badge
                  tone={STATUS_CONFIG[detailItem.status]?.tone || 'neutral'}
                  className="px-3 py-1 text-xs font-bold shrink-0"
                >
                  {STATUS_CONFIG[detailItem.status]?.label || detailItem.status}
                </Badge>
              </div>

              {/* Nội dung thông báo */}
              <div className="rounded-2xl border border-plum-900/10 bg-white p-4 space-y-2 shadow-2xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 block">
                  Nội dung phát thanh
                </span>
                <div className="p-3.5 rounded-xl bg-plum-900/[0.02] border border-plum-900/5 text-sm font-medium text-plum-800 leading-relaxed whitespace-pre-wrap">
                  {detailItem.content}
                </div>
              </div>

              {/* Thông tin đối tượng nhận & Thời hạn hiệu lực */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Đối tượng nhận */}
                <div className="p-4 rounded-2xl bg-plum-900/[0.02] border border-plum-900/8 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 flex items-center gap-1.5">
                    <Users size={14} className="text-brand-500" /> Đối tượng nhận thông báo
                  </span>
                  {detailItem.recipientType === 'ALL_USERS' ? (
                    <div>
                      <Badge tone="brand" className="text-xs font-bold">
                        Tất cả người dùng
                      </Badge>
                      <p className="text-xs text-plum-500 mt-1">Toàn bộ thành viên có tài khoản ACTIVE</p>
                    </div>
                  ) : detailItem.recipientType === 'USER_ROLE' ? (
                    <div>
                      <Badge
                        tone={
                          detailItem.recipientRole === 'STUDENT'
                            ? 'brand'
                            : detailItem.recipientRole === 'ALUMNI'
                              ? 'gold'
                              : 'neutral'
                        }
                        className="text-xs font-bold"
                      >
                        Nhóm: {
                          detailItem.recipientRole === 'STUDENT'
                            ? 'Sinh viên'
                            : detailItem.recipientRole === 'ALUMNI'
                              ? 'Cựu sinh viên'
                              : 'Quản trị viên'
                        }
                      </Badge>
                      <p className="text-xs text-plum-500 mt-1">
                        Gửi tới tất cả {
                          detailItem.recipientRole === 'STUDENT'
                            ? 'sinh viên'
                            : detailItem.recipientRole === 'ALUMNI'
                              ? 'cựu sinh viên'
                              : 'quản trị viên'
                        } trong hệ thống
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 pt-0.5">
                      <Avatar
                        src={detailItem.recipientUser?.avatarUrl}
                        name={detailItem.recipientUser?.fullName || 'User'}
                        size={36}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-plum-900 truncate">
                          {detailItem.recipientUser?.fullName || 'Người dùng chỉ định'}
                        </p>
                        <p className="text-[11px] text-plum-400 truncate">
                          {detailItem.recipientUser?.email}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thời hạn hiệu lực */}
                <div className="p-4 rounded-2xl bg-plum-900/[0.02] border border-plum-900/8 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 flex items-center gap-1.5">
                    <Hourglass size={14} className="text-gold-500" /> Thời hạn hiệu lực
                  </span>
                  <div>
                    <span className="text-sm font-bold text-plum-900 block">
                      {DURATION_LABELS[detailItem.durationType] || detailItem.durationType}
                    </span>
                    <p className="text-xs text-plum-500 mt-1">
                      {detailItem.expiresAt
                        ? `Hết hiệu lực: ${formatDateTime(detailItem.expiresAt)}`
                        : 'Thông báo duy trì vĩnh viễn không giới hạn thời gian'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mốc thời gian & Quản trị viên phát hành */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Mốc thời gian */}
                <div className="p-4 rounded-2xl bg-plum-900/[0.02] border border-plum-900/8 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 flex items-center gap-1.5">
                    <Calendar size={14} className="text-brand-500" /> Tiến trình thời gian
                  </span>
                  <div className="pt-1 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-plum-500">Khởi tạo:</span>
                      <span className="font-semibold text-plum-900">{formatDateTime(detailItem.createdAt)}</span>
                    </div>
                    {detailItem.scheduledAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gold-600 font-medium">Hẹn giờ gửi:</span>
                        <span className="font-bold text-gold-700">{formatDateTime(detailItem.scheduledAt)}</span>
                      </div>
                    )}
                    {detailItem.sentAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-600 font-medium">Thời điểm gửi:</span>
                        <span className="font-bold text-emerald-700">{formatDateTime(detailItem.sentAt)}</span>
                      </div>
                    )}
                    {detailItem.expiresAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-plum-500">Hết hiệu lực:</span>
                        <span className="font-semibold text-plum-900">{formatDateTime(detailItem.expiresAt)}</span>
                      </div>
                    )}
                    {detailItem.archivedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-purple-600 font-medium">Thời điểm lưu trữ:</span>
                        <span className="font-bold text-purple-700">{formatDateTime(detailItem.archivedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quản trị viên phát hành */}
                <div className="p-4 rounded-2xl bg-plum-900/[0.02] border border-plum-900/8 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400 flex items-center gap-1.5">
                    <User size={14} className="text-brand-500" /> Quản trị viên phát hành
                  </span>
                  <div className="flex items-center gap-3 pt-0.5">
                    <Avatar
                      src={detailItem.createdBy?.avatarUrl}
                      name={detailItem.createdBy?.fullName || 'Quản trị viên'}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-plum-900 truncate">
                        {detailItem.createdBy?.fullName || 'Quản trị viên'}
                      </p>
                      <p className="text-[11px] text-plum-400 truncate">
                        {detailItem.createdBy?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="p-4 border-t border-plum-900/8 bg-plum-900/[0.01] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {detailItem.status === 'SCHEDULED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setCancelTargetId(detailItem.id)
                    }}
                    className="bg-red-600 text-white hover:bg-red-700 font-bold border-transparent shadow-xs"
                    leftIcon={<XCircle size={15} />}
                  >
                    Hủy lịch hẹn gửi
                  </Button>
                )}

                {(detailItem.status === 'SENT' || detailItem.status === 'ACTIVE' || detailItem.status === 'EXPIRED') && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setArchiveTargetId(detailItem.id)
                    }}
                    className="font-bold bg-plum-900/5 hover:bg-plum-900/10 text-plum-800"
                    leftIcon={<Archive size={15} />}
                  >
                    Lưu trữ thông báo
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={() => setDetailItem(null)}>
                Đóng
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {/* Confirm Hủy Lịch Gửi */}
      {cancelTargetId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setCancelTargetId(null)}
          />
          <Card hover={false} className="relative z-10 w-full max-w-sm bg-white p-6 shadow-2xl rounded-3xl border border-plum-950/15 pop">
            <h3 className="text-base font-bold text-plum-950">Xác nhận hủy thông báo hẹn giờ?</h3>
            <p className="text-xs text-plum-500 mt-2 leading-relaxed">
              Thông báo này sẽ không được phát hành tự động nữa. Trạng thái sẽ chuyển sang ĐÃ HỦY.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setCancelTargetId(null)}>
                Quay lại
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700 font-bold"
                disabled={cancelMutation.isPending}
                onClick={() => handleCancelScheduled(cancelTargetId)}
              >
                {cancelMutation.isPending && <Loader2 size={13} className="mr-1 animate-spin" />}
                Xác nhận hủy
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}

      {/* Confirm Lưu Trữ Thông Báo (Archive) */}
      {archiveTargetId && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setArchiveTargetId(null)}
          />
          <Card hover={false} className="relative z-10 w-full max-w-sm bg-white p-6 shadow-2xl rounded-3xl border border-plum-950/15 pop">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold-100 text-gold-700">
                <Archive size={18} />
              </span>
              <h3 className="text-base font-bold text-plum-950">Lưu trữ thông báo?</h3>
            </div>
            <p className="text-xs text-plum-600 mt-2 leading-relaxed">
              Thông báo sẽ được chuyển vào <strong>Kho lưu trữ</strong> và ngừng hiển thị.
            </p>
            <div className="mt-5 flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setArchiveTargetId(null)}>
                Quay lại
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-gold-400 to-gold-500 text-plum-950 font-bold hover:from-gold-500 hover:to-gold-600 shadow-xs"
                disabled={archiveMutation.isPending}
                onClick={() => handleArchive(archiveTargetId)}
              >
                {archiveMutation.isPending && <Loader2 size={13} className="mr-1 animate-spin" />}
                Xác nhận lưu trữ
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  )
}

