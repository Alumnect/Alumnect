import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  UserPlus,
  Inbox,
  Flag,
  Compass,
  Megaphone,
  Lock,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, Button } from '@/components/ui'
import { Reveal, Stagger, StaggerItem, Counter } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  useAdminOverview,
  useAdminReports,
  useAdminMentors,
  useAdminSystemNotifications,
  useAdminUsers,
} from '../hooks/useAdmin'
import { RegistrationAnalyticsChart } from './RegistrationAnalyticsChart'

export function AdminOverviewPage() {
  const navigate = useNavigate()

  // 1. KPI & Summary Queries
  const {
    data: summary,
    isLoading: isLoadingKpis,
    error: kpisError,
    refetch: refetchKpis,
  } = useAdminOverview()

  // 2. Pending Tasks Queries for "Cần xử lý"
  const {
    data: pendingReports,
    isLoading: isLoadingReports,
    error: reportsError,
    refetch: refetchReports,
  } = useAdminReports({
    status: 'PENDING',
    page: 0,
    size: 5,
  })

  const {
    data: mentorsData,
    isLoading: isLoadingMentors,
    error: mentorsError,
    refetch: refetchMentors,
  } = useAdminMentors({
    page: 0,
    size: 10,
  })

  const {
    data: scheduledBroadcasts,
    isLoading: isLoadingBroadcasts,
    error: broadcastsError,
    refetch: refetchBroadcasts,
  } = useAdminSystemNotifications({
    status: 'SCHEDULED',
    page: 0,
    size: 5,
  })

  const {
    data: lockedUsers,
    isLoading: isLoadingLockedUsers,
    error: lockedUsersError,
    refetch: refetchLockedUsers,
  } = useAdminUsers({
    status: 'LOCKED',
    page: 0,
    size: 5,
  })

  // 3. Recent Activities Queries for "Hoạt động gần đây"
  const {
    data: recentUsersData,
    isLoading: isLoadingRecentUsers,
  } = useAdminUsers({
    page: 0,
    size: 5,
  })

  const {
    data: recentReportsData,
    isLoading: isLoadingRecentReports,
  } = useAdminReports({
    page: 0,
    size: 5,
  })

  const {
    data: recentNotificationsData,
    isLoading: isLoadingRecentNotifications,
  } = useAdminSystemNotifications({
    page: 0,
    size: 5,
  })

  // Refetch toàn bộ dữ liệu khi bấm Thử lại
  const handleRefreshAll = () => {
    refetchKpis()
    refetchReports()
    refetchMentors()
    refetchBroadcasts()
    refetchLockedUsers()
  }

  // Tính số lượng công việc cần xử lý
  const pendingReportCount = pendingReports?.totalElements || 0
  const pendingMentorCount = useMemo(() => {
    if (!mentorsData?.content) return 0
    return mentorsData.content.filter(
      (m) =>
        m.mentorStatus === 'PAYMENT_PENDING' ||
        m.mentorStatus === 'PENDING_PAYMENT' ||
        m.mentorStatus === 'PENDING' ||
        m.subscriptionStatus === 'PENDING_PAYMENT' ||
        m.subscriptionStatus === 'PENDING'
    ).length
  }, [mentorsData])
  const scheduledBroadcastCount = scheduledBroadcasts?.totalElements || 0
  const lockedUserCount = lockedUsers?.totalElements || 0

  const totalActionItems =
    pendingReportCount + pendingMentorCount + scheduledBroadcastCount + lockedUserCount

  // Danh sách các mục trong Card "Cần xử lý"
  const actionItems = useMemo(() => {
    const list = []

    // Mục 1: Báo cáo vi phạm bài viết (ưu tiên cao)
    if (pendingReportCount > 0) {
      list.push({
        id: 'reports',
        title: 'Báo cáo vi phạm bài viết',
        description: 'Bài viết cộng đồng bị người dùng báo cáo vi phạm tiêu chuẩn nội dung',
        count: pendingReportCount,
        badgeText: 'Cần xử lý ngay',
        badgeTone: 'rose' as const,
        icon: <Flag className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
        iconBg: 'bg-rose-100 dark:bg-rose-950/50',
        actionLabel: 'Xử lý',
        actionHref: '/admin/reports',
        isUrgent: true,
      })
    }

    // Mục 2: Mentor chờ kích hoạt / thanh toán gói
    if (pendingMentorCount > 0) {
      list.push({
        id: 'mentors',
        title: 'Mentor chờ hoàn tất đăng ký / gói',
        description: 'Hồ sơ Cố vấn cần theo dõi kích hoạt gói dịch vụ hoặc đối chứng CV',
        count: pendingMentorCount,
        badgeText: 'Chờ thanh toán',
        badgeTone: 'gold' as const,
        icon: <Compass className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
        iconBg: 'bg-amber-100 dark:bg-amber-950/50',
        actionLabel: 'Xem danh sách',
        actionHref: '/admin/mentor-packages',
        isUrgent: false,
      })
    }

    // Mục 3: Thông báo hệ thống đã lên lịch chờ gửi
    if (scheduledBroadcastCount > 0) {
      list.push({
        id: 'broadcasts',
        title: 'Thông báo hệ thống đã hẹn giờ',
        description: 'Bản tin thông báo toàn hệ thống đang trong hàng đợi chờ phát tự động',
        count: scheduledBroadcastCount,
        badgeText: 'Đã hẹn giờ',
        badgeTone: 'brand' as const,
        icon: <Megaphone className="h-4 w-4 text-violet-600 dark:text-violet-400" />,
        iconBg: 'bg-violet-100 dark:bg-violet-950/50',
        actionLabel: 'Xem lịch phát',
        actionHref: '/admin/broadcast',
        isUrgent: false,
      })
    }

    // Mục 4: Tài khoản đang bị khóa
    if (lockedUserCount > 0) {
      list.push({
        id: 'locked-users',
        title: 'Tài khoản người dùng đang bị khóa',
        description: 'Tài khoản thành viên bị tạm khóa do vi phạm hoặc yêu cầu bảo mật',
        count: lockedUserCount,
        badgeText: 'Đang khóa',
        badgeTone: 'neutral' as const,
        icon: <Lock className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
        iconBg: 'bg-slate-100 dark:bg-[#323436]',
        actionLabel: 'Kiểm tra',
        actionHref: '/admin/users',
        isUrgent: false,
      })
    }

    return list
  }, [pendingReportCount, pendingMentorCount, scheduledBroadcastCount, lockedUserCount])

  // Chuẩn hóa thời gian tương đối
  const formatTimeAgo = (dateStr?: string | null): string => {
    if (!dateStr) return 'Vừa xong'
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHours = Math.floor(diffMin / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffSec < 60) return 'Vừa xong'
      if (diffMin < 60) return `${diffMin} phút trước`
      if (diffHours < 24) return `${diffHours} giờ trước`
      if (diffDays === 1) return 'Hôm qua'
      if (diffDays < 7) return `${diffDays} ngày trước`
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    } catch {
      return 'Gần đây'
    }
  }

  // Danh sách các mục trong Card "Hoạt động gần đây"
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string
      type: 'USER' | 'REPORT' | 'NOTIFICATION' | 'MENTOR'
      title: string
      description: string
      timestamp: string
      timeAgo: string
      actorName: string
      actorAvatar?: string
      icon: React.ReactNode
      iconTone: string
      linkUrl?: string
    }

    const items: ActivityItem[] = []

    // 1. Người dùng mới đăng ký
    if (recentUsersData?.content) {
      recentUsersData.content.forEach((u) => {
        items.push({
          id: `user-${u.id}-${u.createdAt}`,
          type: 'USER',
          title: u.fullName || 'Người dùng mới',
          description: `Đăng ký tài khoản ${u.role === 'ALUMNI' ? 'Cựu sinh viên' : u.role === 'STUDENT' ? 'Sinh viên' : 'Quản trị viên'}`,
          timestamp: u.createdAt,
          timeAgo: formatTimeAgo(u.createdAt),
          actorName: u.fullName,
          actorAvatar: u.avatarUrl,
          icon: <UserPlus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />,
          iconTone: 'bg-emerald-100 dark:bg-emerald-950/50',
          linkUrl: '/admin/users',
        })
      })
    }

    // 2. Báo cáo bài viết mới gửi
    if (recentReportsData?.content) {
      recentReportsData.content.forEach((r) => {
        items.push({
          id: `report-${r.id}-${r.createdAt}`,
          type: 'REPORT',
          title: r.reporterName || 'Thành viên ẩn danh',
          description: `Báo cáo vi phạm bài viết (${r.reason === 'SPAM' ? 'Spam' : r.reason === 'INAPPROPRIATE' ? 'Không phù hợp' : 'Nội dung vi phạm'})`,
          timestamp: r.createdAt,
          timeAgo: formatTimeAgo(r.createdAt),
          actorName: r.reporterName,
          actorAvatar: r.reporterAvatarUrl,
          icon: <Flag className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />,
          iconTone: 'bg-rose-100 dark:bg-rose-950/50',
          linkUrl: '/admin/reports',
        })
      })
    }

    // 3. Thông báo hệ thống mới
    if (recentNotificationsData?.content) {
      recentNotificationsData.content.forEach((n) => {
        items.push({
          id: `notification-${n.id}-${n.createdAt}`,
          type: 'NOTIFICATION',
          title: n.createdBy?.fullName || 'Quản trị viên',
          description: `Đã phát thông báo: "${n.title}"`,
          timestamp: n.createdAt,
          timeAgo: formatTimeAgo(n.createdAt),
          actorName: n.createdBy?.fullName || 'Quản trị viên',
          actorAvatar: n.createdBy?.avatarUrl,
          icon: <Megaphone className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />,
          iconTone: 'bg-violet-100 dark:bg-violet-950/50',
          linkUrl: '/admin/broadcast',
        })
      })
    }

    // Sắp xếp thời gian mới nhất lên đầu và lấy 6 mục
    return items
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6)
  }, [recentUsersData, recentReportsData, recentNotificationsData])

  // KPIs Data
  const kpis = summary
    ? [
        { label: 'Tổng số người dùng', value: summary.totalUsers, delta: '+12.4%', up: true },
        { label: 'Sinh viên FPTU', value: summary.totalStudents, delta: '+8.1%', up: true },
        { label: 'Cựu sinh viên', value: summary.totalAlumni, delta: '+15.3%', up: true },
        {
          label: 'Yêu cầu cần xử lý',
          value: totalActionItems,
          delta: totalActionItems > 0 ? `${totalActionItems} mục chờ` : 'Đã giải quyết',
          up: totalActionItems === 0,
          isWarning: totalActionItems > 0,
        },
      ]
    : []

  const dailyRegs = summary?.dailyRegistrations || []
  const isLoadingPendingCards =
    isLoadingReports || isLoadingMentors || isLoadingBroadcasts || isLoadingLockedUsers
  const isErrorPendingCards =
    !!reportsError || !!mentorsError || !!broadcastsError || !!lockedUsersError
  const isLoadingRecentCards =
    isLoadingRecentUsers || isLoadingRecentReports || isLoadingRecentNotifications

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Tổng quan Quản trị"
        subtitle="Theo dõi chỉ số vận hành, phân tích tăng trưởng người dùng và xử lý các yêu cầu trên hệ thống."
      />

      {/* KPI Section */}
      {isLoadingKpis ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} hover={false} className="p-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-2 h-8 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </Card>
          ))}
        </div>
      ) : kpisError ? (
        <EmptyState
          icon={<Inbox size={24} />}
          title="Không thể tải dữ liệu thống kê"
          description={kpisError instanceof Error ? kpisError.message : 'Lỗi kết nối máy chủ.'}
          action={
            <Button size="sm" variant="secondary" onClick={() => refetchKpis()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Thử lại
            </Button>
          }
        />
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {kpis.map((k) => (
            <StaggerItem key={k.label}>
              <Card hover={false} className="p-5 border border-plum-900/10 dark:border-[#393a3b] shadow-xs">
                <p className="text-xs font-semibold text-plum-500 dark:text-[#a0a3a7]">{k.label}</p>
                <p className="mt-2 text-3xl font-black text-plum-900 dark:text-[#f0f2f5]">
                  <Counter value={k.value} compactFmt={k.value > 9999} />
                </p>
                <p
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-xs font-bold',
                    k.isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : k.up
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-500'
                  )}
                >
                  <ArrowUpRight size={14} /> {k.delta}
                  <span className="font-medium text-plum-400 dark:text-slate-500"> so với tháng trước</span>
                </p>
              </Card>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {/* Row 2: Registrations Combo Chart */}
      <Reveal>
        <RegistrationAnalyticsChart
          summary={summary}
          liveDailyRegs={dailyRegs}
          isLoading={isLoadingKpis}
        />
      </Reveal>

      {/* Row 3: Bố cục 2 Card: "Cần xử lý" (60%) & "Hoạt động gần đây" (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================= CARD 1: CẦN XỬ LÝ (60% - 7/12 cột desktop) ================= */}
        <div className="lg:col-span-7">
          <Reveal>
            <Card
              hover={false}
              className="p-5 sm:p-6 rounded-2xl border border-plum-900/10 dark:border-[#393a3b] shadow-xs flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#333537] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-plum-900 dark:text-[#f0f2f5] flex items-center gap-2">
                      <span>Cần xử lý</span>
                      {totalActionItems > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                          {totalActionItems}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#a0a3a7] mt-0.5">
                      Danh sách công việc và hàng đợi cần Quản trị viên can thiệp
                    </p>
                  </div>
                </div>

                {isErrorPendingCards && (
                  <button
                    type="button"
                    onClick={handleRefreshAll}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2e3033] transition-colors cursor-pointer"
                    title="Tải lại dữ liệu"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-center">
                {/* 1. Loading Skeleton */}
                {isLoadingPendingCards && (
                  <div className="space-y-3.5 py-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#222426] border border-slate-100 dark:border-[#333537]"
                      >
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-xl" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-20 rounded-xl" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Error State */}
                {!isLoadingPendingCards && isErrorPendingCards && (
                  <div className="p-6 text-center bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/80 dark:border-rose-900/40 space-y-3">
                    <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-[#f0f2f5]">
                        Không thể tải danh sách công việc
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Đã xảy ra sự cố khi kết nối tới một số dịch vụ hàng đợi.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleRefreshAll}
                      className="text-xs rounded-xl font-bold cursor-pointer"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Thử lại
                    </Button>
                  </div>
                )}

                {/* 3. Empty State (Khi đã xử lý xong hết) */}
                {!isLoadingPendingCards && !isErrorPendingCards && actionItems.length === 0 && (
                  <div className="py-10 px-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 dark:text-[#f0f2f5]">
                        Đã xử lý hết các yêu cầu
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-[#a0a3a7] max-w-sm mx-auto mt-1">
                        Hiện không có công việc nào tồn đọng đang chờ Quản trị viên xử lý. Hệ thống đang vận hành ổn định!
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Action Items List */}
                {!isLoadingPendingCards && !isErrorPendingCards && actionItems.length > 0 && (
                  <div className="space-y-3">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl transition-all border',
                          item.isUrgent
                            ? 'bg-rose-50/40 dark:bg-rose-950/15 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-300'
                            : 'bg-slate-50/70 dark:bg-[#222426] border-slate-200/70 dark:border-[#333537] hover:border-brand-500/40'
                        )}
                      >
                        {/* Icon & Title */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={cn(
                              'p-2.5 rounded-xl shrink-0 mt-0.5',
                              item.iconBg
                            )}
                          >
                            {item.icon}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-xs sm:text-sm text-plum-900 dark:text-[#f0f2f5] truncate">
                                {item.title}
                              </h3>
                              <Badge tone={item.badgeTone} className="text-[10px] font-bold px-2 py-0.2">
                                {item.count} {item.badgeText}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-[#a0a3a7] truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="shrink-0 self-end sm:self-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={item.isUrgent ? 'primary' : 'secondary'}
                            onClick={() => navigate(item.actionHref)}
                            className={cn(
                              'rounded-xl text-xs font-bold px-3.5 py-1.5 transition-all cursor-pointer flex items-center gap-1.5',
                              item.isUrgent
                                ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white hover:from-rose-700 hover:to-rose-600 shadow-sm'
                                : 'bg-white dark:bg-[#1c1d1f] text-plum-800 dark:text-[#e4e6eb] hover:bg-slate-100 dark:hover:bg-[#2e3033] border border-slate-200 dark:border-slate-700'
                            )}
                          >
                            <span>{item.actionLabel}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </Reveal>
        </div>

        {/* ================= CARD 2: HOẠT ĐỘNG GẦN ĐÂY (40% - 5/12 cột desktop) ================= */}
        <div className="lg:col-span-5">
          <Reveal direction="left">
            <Card
              hover={false}
              className="p-5 sm:p-6 rounded-2xl border border-plum-900/10 dark:border-[#393a3b] shadow-xs flex flex-col h-full"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#333537] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-base text-plum-900 dark:text-[#f0f2f5]">
                      Hoạt động gần đây
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-[#a0a3a7] mt-0.5">
                      Nhật ký thao tác và sự kiện mới nhất
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/admin/users')}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  <span>Xem tất cả</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex-1 flex flex-col justify-center">
                {/* 1. Loading Skeleton */}
                {isLoadingRecentCards && (
                  <div className="space-y-3.5 py-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-3 w-12" />
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Empty State */}
                {!isLoadingRecentCards && recentActivities.length === 0 && (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2a2b2d] flex items-center justify-center mx-auto text-slate-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-[#a0a3a7]">
                      Chưa có hoạt động mới nào được ghi nhận.
                    </p>
                  </div>
                )}

                {/* 3. Activity Feed List */}
                {!isLoadingRecentCards && recentActivities.length > 0 && (
                  <ul className="divide-y divide-slate-100 dark:divide-[#2e3033]">
                    {recentActivities.map((act) => (
                      <li
                        key={act.id}
                        onClick={() => act.linkUrl && navigate(act.linkUrl)}
                        className={cn(
                          'py-3 flex items-center gap-3 transition-colors rounded-xl px-1.5 -mx-1.5',
                          act.linkUrl ? 'cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#242628]' : ''
                        )}
                      >
                        {/* Avatar or Icon */}
                        <div className="relative shrink-0">
                          {act.actorAvatar ? (
                            <img
                              src={act.actorAvatar}
                              alt={act.actorName}
                              className="h-8.5 w-8.5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                            />
                          ) : (
                            <div className="h-8.5 w-8.5 rounded-full bg-slate-100 dark:bg-[#323436] flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300">
                              {act.actorName ? act.actorName.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}

                          {/* Mini tone badge icon */}
                          <span
                            className={cn(
                              'absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-white dark:ring-[#1c1d1f]',
                              act.iconTone
                            )}
                          >
                            {act.icon}
                          </span>
                        </div>

                        {/* Content text */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-plum-900 dark:text-[#f0f2f5] truncate">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#a0a3a7] truncate">
                            {act.description}
                          </p>
                        </div>

                        {/* Time indicator */}
                        <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap pl-1">
                          {act.timeAgo}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
