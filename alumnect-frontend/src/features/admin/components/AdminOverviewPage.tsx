import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UserPlus,
  Inbox,
  Flag,
  Megaphone,
  ChevronRight,
  RefreshCw,
  Scale,
  GraduationCap,
  Compass,
  Lock,
  TrendingUp,
} from 'lucide-react'
import { EmptyState, Skeleton, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  useAdminOverview,
  useAdminReports,
  useAdminMentors,
  useAdminSystemNotifications,
  useAdminUsers,
  useAdminTickets,
  useAdminRevenueOverview,
} from '../hooks/useAdmin'
import { AdminHero, QueueTile, AreaTrend, Donut } from './AdminVisuals'
import { brandButtonClass, softButtonClass } from '@/components/brand/brandClasses'
import { useAuthStore } from '@/store/authStore'

export function AdminOverviewPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

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
          icon: <UserPlus className="h-3.5 w-3.5 text-success" />,
          iconTone: 'bg-success-soft',
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
          title: r.reporterName || (r.systemGenerated ? 'Hệ thống kiểm duyệt' : 'Thành viên ẩn danh'),
          description: `Báo cáo vi phạm bài viết (${r.reason === 'SPAM' ? 'Spam' : r.reason === 'INAPPROPRIATE' ? 'Không phù hợp' : 'Nội dung vi phạm'})`,
          timestamp: r.createdAt,
          timeAgo: formatTimeAgo(r.createdAt),
          actorName: r.reporterName || 'Hệ thống kiểm duyệt',
          actorAvatar: r.reporterAvatarUrl,
          icon: <Flag className="h-3.5 w-3.5 text-danger" />,
          iconTone: 'bg-danger-soft',
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
      .slice(0, 5)
  }, [recentUsersData, recentReportsData, recentNotificationsData])

  // ---------- Số liệu bổ sung cho trang (đều từ API thật) ----------
  const { data: openTicketsPage } = useAdminTickets({ status: 'OPEN', page: 0, size: 1 })
  const { data: revenue } = useAdminRevenueOverview()

  const currentMonth = new Date().getMonth() + 1
  const newThisMonth = summary?.registrationsByMonth?.[currentMonth - 1]?.count ?? 0
  const openTicketCount = openTicketsPage?.totalElements ?? 0
  const pendingVerificationCount = summary?.pendingVerifications ?? 0
  const formatVnd = (value = 0) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)

  // Hàng đợi công việc của Quản trị viên: số lượng thật, đi thẳng tới nơi xử lý
  type Queue = { id: string; label: string; sub: string; short: string; count: number; href: string; action: string; urgent: boolean; icon: React.ReactNode }
  const queues: Queue[] = [
    { id: 'reports', label: 'Báo cáo vi phạm', sub: 'chờ xử lý', short: 'báo cáo vi phạm', count: pendingReportCount, href: '/admin/reports', action: 'Xử lý', urgent: true, icon: <Flag /> },
    { id: 'tickets', label: 'Tranh chấp', sub: 'chờ tiếp nhận', short: 'tranh chấp', count: openTicketCount, href: '/admin/mentoring-tickets', action: 'Tiếp nhận', urgent: true, icon: <Scale /> },
    { id: 'verifications', label: 'Hồ sơ cựu SV', sub: 'chờ duyệt', short: 'hồ sơ cựu sinh viên', count: pendingVerificationCount, href: '/admin/verifications', action: 'Duyệt', urgent: true, icon: <GraduationCap /> },
    { id: 'mentors', label: 'Mentor', sub: 'chờ thanh toán gói', short: 'mentor chờ thanh toán', count: pendingMentorCount, href: '/admin/mentor-packages', action: 'Xem', urgent: false, icon: <Compass /> },
    { id: 'broadcasts', label: 'Thông báo', sub: 'đã hẹn giờ', short: 'thông báo hẹn giờ', count: scheduledBroadcastCount, href: '/admin/broadcast', action: 'Xem lịch', urgent: false, icon: <Megaphone /> },
    { id: 'locked', label: 'Tài khoản', sub: 'đang khóa', short: 'tài khoản khóa', count: lockedUserCount, href: '/admin/users', action: 'Kiểm tra', urgent: false, icon: <Lock /> },
  ]
  const urgentActive = queues.filter((q) => q.urgent && q.count > 0)
  const firstUrgent = urgentActive[0]

  // Cơ cấu người dùng (phần còn lại là tài khoản quản trị)
  const totalUsers = summary?.totalUsers ?? 0
  const composition = [
    { label: 'Cựu sinh viên', value: summary?.totalAlumni ?? 0, color: '#F27024' },
    { label: 'Sinh viên', value: summary?.totalStudents ?? 0, color: '#1F6BB8' },
    { label: 'Quản trị', value: Math.max(0, totalUsers - (summary?.totalAlumni ?? 0) - (summary?.totalStudents ?? 0)), color: '#D9D4CF' },
  ]
  const pct = (v: number) => (totalUsers > 0 ? Math.round((v / totalUsers) * 100) : 0)
  const lastWeek = summary?.registrationsLast7Days ?? summary?.dailyRegistrations ?? []
  const lastWeekRegistrations = lastWeek.reduce((acc, d) => acc + Number(d.count || 0), 0)

  // Biểu đồ: 12 tháng năm nay (tháng chưa tới = null) hoặc 7 ngày qua
  const [trendPeriod, setTrendPeriod] = useState<'YEAR' | 'WEEK'>('YEAR')
  const trendPoints =
    trendPeriod === 'YEAR'
      ? (summary?.registrationsByMonth ?? []).map((d, idx) => ({
          label: d.date.replace('Tháng ', 'T'),
          value: idx + 1 > currentMonth ? null : Number(d.count || 0),
        }))
      : lastWeek.map((d) => {
          const [, mm, dd] = d.date.split('-')
          return { label: dd && mm ? `${dd}/${mm}` : d.date, value: Number(d.count || 0) }
        })
  const yearTotal = (summary?.registrationsByMonth ?? []).reduce((acc, d) => acc + Number(d.count || 0), 0)

  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 14 ? 'Chào buổi trưa' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const todayLabel = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
  const isLoadingPendingCards = isLoadingReports || isLoadingMentors || isLoadingBroadcasts || isLoadingLockedUsers
  const isErrorPendingCards = !!reportsError || !!mentorsError || !!broadcastsError || !!lockedUsersError
  const isLoadingRecentCards = isLoadingRecentUsers || isLoadingRecentReports || isLoadingRecentNotifications

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* 1. Dải chào có minh hoạ campus FPT + tóm tắt việc trong ngày */}
      <AdminHero
        eyebrow={<span className="first-letter:uppercase">{todayLabel}</span>}
        title={
          <>
            {greeting},
            <br />
            {user?.name || 'Quản trị viên'}
          </>
        }
        actions={
          <>
            {firstUrgent && (
              <button type="button" onClick={() => navigate(firstUrgent.href)} className={brandButtonClass}>
                <Flag className="h-4 w-4" />
                {firstUrgent.action} {firstUrgent.short}
              </button>
            )}
            <button type="button" onClick={() => navigate('/admin/broadcast')} className={firstUrgent ? softButtonClass : brandButtonClass}>
              <Megaphone className="h-4 w-4" />
              Tạo thông báo
            </button>
          </>
        }
      >
        {isLoadingPendingCards ? (
          'Đang tổng hợp công việc trong ngày…'
        ) : urgentActive.length > 0 ? (
          <>
            Hôm nay có{' '}
            {urgentActive.map((q, idx) => (
              <span key={q.id}>
                {idx > 0 && ', '}
                <b className="font-semibold text-[#E5484D]">
                  {q.count} {q.short}
                </b>
              </span>
            ))}{' '}
            đang chờ bạn.
          </>
        ) : (
          'Không có việc nào đang chờ quyết định.'
        )}{' '}
        {newThisMonth > 0 && (
          <>
            Cộng đồng có thêm <b className="font-semibold text-text">{newThisMonth} tài khoản mới</b> trong tháng {currentMonth}.
          </>
        )}
      </AdminHero>

      {/* 2. Việc cần làm */}
      <section>
        <div className="mb-3.5 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-text">Việc cần làm</h2>
          {isErrorPendingCards && (
            <Button size="sm" variant="secondary" onClick={handleRefreshAll} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Thử lại
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 xl:grid-cols-6">
          {queues.map((q) => (
            <QueueTile
              key={q.id}
              icon={q.icon}
              count={q.count}
              label={q.label}
              sub={q.sub}
              action={q.action}
              urgent={q.urgent}
              loading={isLoadingPendingCards}
              onClick={() => navigate(q.href)}
            />
          ))}
        </div>
      </section>

      {/* 3. Đăng ký mới · Cơ cấu người dùng · Doanh thu */}
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1.55fr_1fr_1fr]">
        <section className="rounded-3xl border border-border bg-surface px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-text-subtle">
                Tài khoản đăng ký mới · {trendPeriod === 'YEAR' ? `năm ${new Date().getFullYear()}` : '7 ngày qua'}
              </p>
              <p className="mt-1 flex items-baseline gap-2 font-display text-[34px] font-bold tabular-nums text-text">
                {trendPeriod === 'YEAR' ? yearTotal : lastWeekRegistrations}
                {trendPeriod === 'YEAR' && newThisMonth > 0 && (
                  <span className="inline-flex items-center gap-1 font-sans text-sm font-semibold text-success">
                    <TrendingUp className="h-3.5 w-3.5" />+{newThisMonth} tháng này
                  </span>
                )}
              </p>
            </div>
            <div role="tablist" aria-label="Khoảng thời gian" className="flex rounded-xl bg-surface-2 p-1 text-xs font-semibold">
              {(
                [
                  ['WEEK', '7 ngày'],
                  ['YEAR', 'Năm nay'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={trendPeriod === key}
                  onClick={() => setTrendPeriod(key)}
                  className={cn('rounded-lg px-3 py-1.5 transition', trendPeriod === key ? 'bg-surface text-text shadow-xs' : 'text-text-subtle hover:text-text')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            {isLoadingKpis ? (
              <Skeleton className="h-52 w-full" />
            ) : trendPoints.length === 0 ? (
              <p className="py-16 text-center text-sm text-text-subtle">Chưa có số liệu đăng ký.</p>
            ) : (
              <AreaTrend points={trendPoints} />
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-surface px-6 py-5">
          <p className="text-sm text-text-subtle">Cơ cấu người dùng</p>
          {kpisError ? (
            <EmptyState
              icon={<Inbox size={22} />}
              title="Không thể tải số liệu"
              description={kpisError instanceof Error ? kpisError.message : 'Lỗi kết nối máy chủ.'}
              action={
                <Button size="sm" variant="secondary" onClick={() => refetchKpis()} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Thử lại
                </Button>
              }
              className="mt-3 border-none"
            />
          ) : (
            <>
              <div className="my-3 flex justify-center">
                {isLoadingKpis ? <Skeleton className="h-[172px] w-[172px] rounded-full" /> : <Donut parts={composition} total={totalUsers} caption="người dùng" />}
              </div>
              <dl className="space-y-1.5 text-sm">
                {composition.map((c) => (
                  <div key={c.label} className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: c.color }} aria-hidden />
                    <dt className="flex-1 text-text-muted">{c.label}</dt>
                    <dd className="font-display font-bold tabular-nums text-text">{c.value}</dd>
                    <dd className="w-10 text-right tabular-nums text-text-subtle">{pct(c.value)}%</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </section>

        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F2A44] to-[#2B3A5E] px-6 py-5 text-white">
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#F27024]/25 blur-xl" aria-hidden />
          <p className="relative text-sm text-[#B9C3DA]">Doanh thu tháng {currentMonth}</p>
          <p className="relative mt-1.5 font-display text-[34px] font-bold tabular-nums">{revenue ? formatVnd(revenue.currentMonthRevenue) : '—'}</p>
          <p className="relative mt-1 text-sm text-[#B9C3DA]">
            {revenue ? `${revenue.successfulTransactionCount ?? 0} khoản đã ghi nhận` : 'Đang tải…'}
          </p>
          <div className="relative mt-6 grid grid-cols-2 gap-2.5">
            {[
              ['Mentor', mentorsData?.totalElements ?? 0, '/admin/mentor-packages'],
              ['Đăng ký 7 ngày', lastWeekRegistrations, '/admin/users'],
            ].map(([label, value, href]) => (
              <button
                key={label as string}
                type="button"
                onClick={() => navigate(href as string)}
                className="rounded-2xl border border-white/10 bg-white/[0.08] px-3 py-3 text-left transition hover:bg-white/[0.14]"
              >
                <p className="text-xs text-[#B9C3DA]">{label}</p>
                <p className="mt-0.5 font-display text-[22px] font-bold tabular-nums">{value}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/revenue')}
            className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[#FFB284] hover:underline"
          >
            Xem doanh thu
            <ChevronRight className="h-4 w-4" />
          </button>
        </section>
      </div>

      {/* 4. Hoạt động gần đây */}
      <section className="rounded-3xl border border-border bg-surface px-6 py-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-text">Hoạt động gần đây</h2>
          <button type="button" onClick={() => navigate('/admin/users')} className="text-sm font-semibold text-[#E3561A] hover:underline">
            Xem tất cả
          </button>
        </div>
        {isLoadingRecentCards ? (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : recentActivities.length === 0 ? (
          <p className="mt-3 text-sm text-text-subtle">Chưa có hoạt động nào.</p>
        ) : (
          <ul className="mt-1 grid gap-x-10 md:grid-cols-2">
            {recentActivities.map((act) => {
              const isReport = act.type === 'REPORT'
              return (
                <li key={act.id} className="border-b border-dashed border-border last:border-b-0 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                  <button
                    type="button"
                    onClick={() => act.linkUrl && navigate(act.linkUrl)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    {act.actorAvatar ? (
                      <img src={act.actorAvatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <span
                        className={cn(
                          'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold',
                          isReport ? 'bg-[#FFE9E3] text-[#E5484D]' : 'bg-[#EAF2FF] text-[#1F6BB8]'
                        )}
                      >
                        {(act.actorName || '?')
                          .split(' ')
                          .filter(Boolean)
                          .slice(-2)
                          .map((w) => w.charAt(0).toUpperCase())
                          .join('')}
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text">{act.title}</span>
                      <span className="block truncate text-xs text-text-subtle">{act.description}</span>
                    </span>
                    <span className="shrink-0 text-xs text-text-subtle">{act.timeAgo}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
