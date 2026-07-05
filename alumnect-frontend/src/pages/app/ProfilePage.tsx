import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MapPin,
  Briefcase,
  GraduationCap,
  Settings,
  BadgeCheck,
  Calendar,
  Mail,
  Phone,
  Lock,
  Unlock,
  Loader2,
  ArrowLeft,
} from 'lucide-react'
import { Avatar, Badge, Card, SmartImage, Skeleton, EmptyState } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal, Counter } from '@/components/motion'
import { useAuthStore } from '@/store/authStore'
import { useAdminUserDetail, useUpdateUserStatus } from '@/pages/admin/useAdmin'
import { compact } from '@/lib/utils'

const TIMELINE = [
  { role: 'Senior Software Engineer', org: 'FPT Software', period: '2024 — Present', current: true },
  { role: 'Software Engineer', org: 'KMS Technology', period: '2021 — 2024', current: false },
  { role: 'Frontend Intern', org: 'Axon Active', period: '2020 — 2021', current: false },
  { role: 'B.Sc. Software Engineering', org: 'FPT University', period: '2016 — 2020', current: false },
]

const SKILLS = ['React', 'TypeScript', 'Node.js', 'AWS', 'System Design', 'GraphQL', 'Tailwind', 'Leadership']

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const userIdStr = searchParams.get('userId')
  const userId = userIdStr ? parseInt(userIdStr, 10) : null

  // Check if current user is admin
  const currentUserRole = useAuthStore((state) => state.user?.role)
  const isAdmin = currentUserRole === 'ADMIN'

  // Fetch dynamic profile details if userId is specified (Admin only)
  const { data: userDetail, isLoading, error } = useAdminUserDetail(userId)
  const updateStatusMutation = useUpdateUserStatus()

  const handleToggleLock = async () => {
    if (!userDetail) return
    const currentStatus = userDetail.accountStatus
    const nextStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    const confirmMsg =
      currentStatus === 'LOCKED'
        ? 'Bạn có chắc chắn muốn mở khóa tài khoản này không?'
        : 'Bạn có chắc chắn muốn khóa tài khoản này không? Người dùng sẽ không thể đăng nhập.'

    if (!confirm(confirmMsg)) return

    try {
      await updateStatusMutation.mutateAsync({ id: userDetail.id, status: nextStatus })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái')
    }
  }

  // Render Loading state
  if (userId && isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-48 rounded-3xl sm:h-60" />
        <div className="px-4 sm:px-8 space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
    )
  }

  // Render Error state
  if (userId && error) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Button variant="secondary" size="sm" leftIcon={<ArrowLeft size={15} />} onClick={() => navigate(-1)} className="mb-4">
          Quay lại
        </Button>
        <EmptyState
          icon={<MapPin size={24} />}
          title="Lỗi tải hồ sơ người dùng"
          description={error instanceof Error ? error.message : 'Lỗi hệ thống.'}
        />
      </div>
    )
  }

  // If userId is provided and we have userDetail, render dynamic profile
  if (userId && userDetail) {
    return (
      <div className="mx-auto max-w-5xl">
        {/* Back Button for Admin */}
        <div className="mb-4 flex items-center justify-between px-4 sm:px-8">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft size={15} />}
            onClick={() => navigate('/admin/users')}
          >
            Quay lại danh sách
          </Button>
          <Badge tone={userDetail.accountStatus === 'ACTIVE' ? 'success' : 'danger'}>
            Trạng thái: {userDetail.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
          </Badge>
        </div>

        {/* Cover */}
        <Reveal>
          <div className="relative h-48 overflow-hidden rounded-3xl sm:h-60">
            <SmartImage
              src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop"
              alt="Profile cover"
              className="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-plum-900/40 to-transparent" />
          </div>
        </Reveal>

        {/* Header */}
        <div className="relative -mt-16 px-4 sm:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <Avatar name={userDetail.fullName} size={120} verified={userDetail.isAccountVerified} ring />
              <div className="pb-2">
                <h1 className="flex items-center gap-2 pt-1 text-2xl font-extrabold leading-[1.35] text-plum-900 sm:text-3xl">
                  {userDetail.fullName}
                  {userDetail.isAccountVerified && (
                    <BadgeCheck className="shrink-0 text-brand-400" size={22} />
                  )}
                </h1>
                <p className="text-plum-500">
                  {userDetail.headline ||
                    (userDetail.role === 'ALUMNI' ? 'Cựu sinh viên FPT' : 'Sinh viên FPT')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-plum-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> FPT University
            </span>
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap size={14} />{' '}
              {userDetail.major ? `${userDetail.major.code}` : 'N/A'}{' '}
              {userDetail.cohort ? `· K${userDetail.cohort}` : ''}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> Tham gia {new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>

          <div className="mt-5 flex gap-8">
            {[
              { label: 'Người theo dõi', value: 0 },
              { label: 'Đang theo dõi', value: 0 },
              { label: 'Bài viết', value: 0 },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-xl font-extrabold text-plum-900">
                  <Counter value={s.value} compactFmt />
                </p>
                <p className="text-xs text-plum-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body content */}
        <div className="mt-8 grid gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* About Card */}
            <Reveal>
              <Card hover={false} className="p-6">
                <h2 className="text-lg font-bold text-plum-900">Thông tin liên hệ</h2>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-plum-700">
                    <Mail size={16} className="text-plum-400" />
                    <span>{userDetail.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-plum-700">
                    <Phone size={16} className="text-plum-400" />
                    <span>{userDetail.phone || 'Chưa cập nhật số điện thoại'}</span>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Profile summary / bio */}
            <Reveal delay={0.1}>
              <Card hover={false} className="p-6">
                <h2 className="text-lg font-bold text-plum-900">Giới thiệu</h2>
                <p className="mt-3 text-sm leading-relaxed text-plum-600">
                  {userDetail.headline
                    ? `Người dùng ${userDetail.fullName} hiện đã đăng ký tài khoản với tư cách là ${
                        userDetail.role === 'ALUMNI' ? 'Cựu sinh viên tốt nghiệp' : 'Sinh viên đang học'
                      } tại Đại học FPT.`
                    : 'Chưa có thông tin tự giới thiệu từ thành viên này.'}
                </p>
              </Card>
            </Reveal>
          </div>

          <aside className="space-y-6">
            {/* Admin Controls Panel */}
            {isAdmin && (
              <Reveal direction="left">
                <Card hover={false} className="p-6 border-2 border-brand-500/20 bg-brand-500/[0.02]">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600">
                    Bảng điều khiển Admin
                  </h2>
                  <p className="mt-2 text-xs text-plum-500">
                    Thực hiện quản trị tài khoản này. Khóa tài khoản sẽ chặn đăng nhập tức thì.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="text-xs text-plum-700">
                      Vai trò: <strong>{userDetail.role}</strong>
                    </div>
                    <div className="text-xs text-plum-700">
                      Mã sinh viên: <strong>{userDetail.studentCode || 'N/A'}</strong>
                    </div>
                    <div className="text-xs text-plum-700">
                      Xác thực: <strong>{userDetail.isAccountVerified ? 'ĐÃ XÁC MINH' : 'CHƯA DUYỆT'}</strong>
                    </div>
                  </div>
                  <div className="mt-5">
                    <Button
                      size="sm"
                      variant={userDetail.accountStatus === 'LOCKED' ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={handleToggleLock}
                      disabled={updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : userDetail.accountStatus === 'LOCKED' ? (
                        <Unlock size={14} className="mr-1.5" />
                      ) : (
                        <Lock size={14} className="mr-1.5" />
                      )}
                      {userDetail.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                    </Button>
                  </div>
                </Card>
              </Reveal>
            )}

            {/* Verification status indicator */}
            <Reveal direction="left" delay={0.1}>
              <Card hover={false} className="p-6">
                <div className="flex items-center gap-2">
                  <Badge tone={userDetail.isAccountVerified ? 'brand' : 'gold'}>
                    {userDetail.isAccountVerified ? 'Đã xác thực FPTU' : 'Chưa xác thực FPTU'}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-plum-500">
                  {userDetail.isAccountVerified
                    ? 'Tài khoản đã hoàn tất xác thực bằng đại học và thông tin cựu sinh viên FPT.'
                    : 'Tài khoản chưa hoàn tất hoặc đang chờ phê duyệt minh chứng cựu sinh viên.'}
                </p>
              </Card>
            </Reveal>
          </aside>
        </div>
      </div>
    )
  }

  // Default Mock Profile View (for logged-in user standard profile fallback)
  return (
    <div className="mx-auto max-w-5xl">
      {/* cover */}
      <Reveal>
        <div className="relative h-48 overflow-hidden rounded-3xl sm:h-60">
          <SmartImage
            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1600&auto=format&fit=crop"
            alt="Profile cover"
            className="h-full w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-plum-900/40 to-transparent" />
          <Button size="sm" variant="glass" className="absolute right-4 top-4" leftIcon={<Settings size={15} />}>
            Edit profile
          </Button>
        </div>
      </Reveal>

      {/* header */}
      <div className="relative -mt-16 px-4 sm:px-8">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar src="https://i.pravatar.cc/200?img=12" name="Trần Minh Anh" size={120} verified ring />
            <div className="pb-2">
              <h1 className="flex items-center gap-2 pt-1 text-2xl font-extrabold leading-[1.35] text-plum-900 sm:text-3xl">
                Trần Minh Anh <BadgeCheck className="shrink-0 text-brand-400" size={22} />
              </h1>
              <p className="text-plum-500">Senior Software Engineer @ FPT Software</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-plum-500">
          <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> Đà Nẵng, Vietnam</span>
          <span className="inline-flex items-center gap-1.5"><GraduationCap size={14} /> SE · K15</span>
          <span className="inline-flex items-center gap-1.5"><Calendar size={14} /> Joined Mar 2024</span>
        </div>

        <div className="mt-5 flex gap-8">
          {[
            { label: 'Followers', value: 1240 },
            { label: 'Following', value: 312 },
            { label: 'Posts', value: 86 },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl font-extrabold text-plum-900"><Counter value={s.value} compactFmt /></p>
              <p className="text-xs text-plum-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* body */}
      <div className="mt-8 grid gap-6 px-4 sm:px-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Reveal>
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">About</h2>
              <p className="mt-3 text-sm leading-relaxed text-plum-600">
                Senior engineer passionate about scalable frontend systems and developer experience.
                FPTU alumnus mentoring the next generation through AlumNect. Previously building fintech
                at KMS. I love clean architecture, design systems, and a good cup of cà phê sữa đá.
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">Career Timeline</h2>
              <ol className="mt-5 space-y-0">
                {TIMELINE.map((t, i) => (
                  <li key={i} className="relative flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-9 w-9 place-items-center rounded-full ${t.current ? 'bg-gradient-to-br from-brand-500 to-violet-600 text-white' : 'bg-plum-900/[0.05] text-plum-400'}`}>
                        <Briefcase size={15} />
                      </span>
                      {i < TIMELINE.length - 1 && <span className="mt-1 w-px flex-1 bg-plum-900/[0.07]" />}
                    </div>
                    <div className="pb-1">
                      <p className="font-bold text-plum-900">{t.role}</p>
                      <p className="text-sm text-plum-500">{t.org}</p>
                      <p className="text-xs text-plum-400">{t.period}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </Reveal>
        </div>

        <aside className="space-y-6">
          <Reveal direction="left">
            <Card hover={false} className="p-6">
              <h2 className="text-lg font-bold text-plum-900">Skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {SKILLS.map((s) => (
                  <span key={s} className="rounded-lg bg-plum-900/[0.04] px-3 py-1.5 text-sm font-medium text-plum-600 ring-1 ring-inset ring-plum-900/10">
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          </Reveal>

          <Reveal direction="left" delay={0.1}>
            <Card hover={false} className="p-6">
              <div className="flex items-center gap-2">
                <Badge tone="gold" icon={<BadgeCheck size={13} />}>Verified Alumni</Badge>
              </div>
              <p className="mt-3 text-sm text-plum-500">
                Identity confirmed by AlumNect admin on {compact(1240)}+ member network.
              </p>
            </Card>
          </Reveal>
        </aside>
      </div>
    </div>
  )
}
