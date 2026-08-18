import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Lock, Unlock, Users, Mail, Phone, BookOpen, User, X, Loader2 } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminUsers, useAdminUserDetail, useUpdateUserStatus } from '../hooks/useAdmin'

const TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Cựu sinh viên', value: 'ALUMNI' },
  { name: 'Sinh viên', value: 'STUDENT' },
  { name: 'Chờ duyệt', value: 'PENDING' },
  { name: 'Đang khóa', value: 'LOCKED' },
]

export function AdminUsersPage() {
  const [tab, setTab] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // Mapping tab values to API parameters
  const roleParam = tab === 'ALUMNI' ? 'ALUMNI' : tab === 'STUDENT' ? 'STUDENT' : undefined
  const statusParam = tab === 'PENDING' ? 'WAITING_APPROVAL' : tab === 'LOCKED' ? 'LOCKED' : undefined

  // Fetch users
  const { data, isLoading, error } = useAdminUsers({
    query: query || undefined,
    role: roleParam,
    status: statusParam,
    page,
    size: 10,
  })

  // Mutations & Detail states
  const updateStatusMutation = useUpdateUserStatus()
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const { data: userDetail, isLoading: isLoadingDetail } = useAdminUserDetail(selectedUserId)

  // Khóa cuộn trang khi mở modal chi tiết
  useEffect(() => {
    if (selectedUserId !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedUserId])

  // Lock / Unlock Action handler
  const handleToggleLock = async (userId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    const confirmMsg =
      currentStatus === 'LOCKED'
        ? 'Bạn có chắc chắn muốn mở khóa tài khoản này không?'
        : 'Bạn có chắc chắn muốn khóa tài khoản này không? Người dùng sẽ không thể đăng nhập.'

    if (!confirm(confirmMsg)) return

    try {
      await updateStatusMutation.mutateAsync({ id: userId, status: nextStatus })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái')
    }
  }

  const users = data?.content || []
  const totalPages = data?.totalPages || 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Quản lý tài khoản"
        subtitle="Tìm kiếm, phân trang tài khoản, xem hồ sơ chi tiết và khóa/mở khóa tài khoản người dùng."
      />

      {/* Tabs and search bar */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTab(t.value)
                setPage(0) // reset về trang đầu
              }}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
                tab === t.value
                  ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900'
                  : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="relative flex items-center sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-3 text-plum-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(0)
            }}
            placeholder="Tìm theo tên, email, mã số..."
            className="h-10 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.04] pl-9 pr-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none"
          />
        </div>
      </div>

      <Reveal>
        {isLoading ? (
          <Card hover={false} className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            icon={<Users size={24} />}
            title="Lỗi tải danh sách người dùng"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="Không tìm thấy người dùng"
            description="Hãy thử thay đổi điều kiện tìm kiếm hoặc tab bộ lọc."
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-plum-900/8 text-left text-xs uppercase tracking-wide text-plum-400">
                    <th className="px-5 py-3 font-semibold">Thành viên</th>
                    <th className="px-5 py-3 font-semibold">Vai trò</th>
                    <th className="px-5 py-3 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3 font-semibold">Mã số / Khóa</th>
                    <th className="px-5 py-3 font-semibold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-plum-900/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center gap-3 cursor-pointer group/user"
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <Avatar src={u.avatarUrl} name={u.fullName} size={38} verified={u.isAccountVerified} />
                          <div>
                            <p className="font-semibold text-plum-900 group-hover/user:text-gold-600 transition-colors">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-plum-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={
                            u.role === 'ADMIN' ? 'gold' : u.role === 'ALUMNI' ? 'brand' : 'neutral'
                          }
                          className="px-2.5 py-0.5"
                        >
                          {u.role === 'ADMIN' ? 'Admin' : u.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={
                            u.accountStatus === 'ACTIVE'
                              ? 'success'
                              : u.accountStatus === 'LOCKED'
                                ? 'danger'
                                : 'gold'
                          }
                          className="px-2.5 py-0.5"
                        >
                          {u.accountStatus === 'ACTIVE'
                            ? 'Hoạt động'
                            : u.accountStatus === 'LOCKED'
                              ? 'Bị khóa'
                              : 'Đợi duyệt'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-plum-600">
                        {u.studentCode || 'N/A'}{' '}
                        {u.cohort ? <span className="text-xs text-plum-400">(K{u.cohort})</span> : ''}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-plum-900/[0.04] px-2.5 py-1.5 text-xs font-semibold text-plum-600 hover:bg-plum-900/[0.08]"
                          >
                            Chi tiết
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleLock(u.id, u.accountStatus)}
                              className={cn(
                                'grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset transition-all',
                                u.accountStatus === 'LOCKED'
                                  ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 ring-rose-500/20 hover:bg-rose-500/20'
                              )}
                              title={u.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                            >
                              {u.accountStatus === 'LOCKED' ? <Unlock size={15} /> : <Lock size={15} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2">
                <p className="text-xs text-plum-400">
                  Hiển thị trang <strong>{page + 1}</strong> trên tổng số <strong>{totalPages}</strong> trang
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Reveal>

      {/* User Profile Detail Drawer / Modal */}
      {selectedUserId !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <Card
              hover={false}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl border border-brand-100 rounded-2xl"
            >
              {/* Header info - FPT System Orange-Gold Gradient */}
              <div className="relative bg-gradient-to-r from-brand-500 via-brand-600 to-gold-500 p-6 text-white rounded-t-2xl shadow-sm">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </button>

                {isLoadingDetail ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full bg-white/20" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-40 bg-white/20" />
                      <Skeleton className="h-4 w-48 bg-white/20" />
                    </div>
                  </div>
                ) : userDetail ? (
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={userDetail.avatarUrl}
                      name={userDetail.fullName}
                      size={64}
                      verified={userDetail.isAccountVerified}
                      className="border-2 border-white ring-4 ring-white/30 shadow-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-white tracking-tight">{userDetail.fullName}</h2>
                        <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 text-xs font-bold text-white border border-white/30 shadow-2xs">
                          {userDetail.role === 'ADMIN' ? 'Hệ thống Admin' : userDetail.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                        </span>
                      </div>
                      <p className="text-brand-50 text-xs mt-1 truncate">{userDetail.email}</p>
                      {userDetail.headline && (
                        <p className="text-gold-100 text-xs mt-1.5 italic font-medium">"{userDetail.headline}"</p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Body Info */}
              <div className="p-6 bg-white space-y-4">
                {isLoadingDetail ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : userDetail ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-sm">
                      {/* Cột 1: Thông tin cá nhân & Liên hệ */}
                      <div className="space-y-3 p-4 rounded-xl bg-brand-50/40 border border-brand-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">Thông tin liên hệ</h4>
                        <div>
                          <span className="text-xs text-plum-500 block">Địa chỉ Email</span>
                          <span className="font-bold text-plum-900 break-all">{userDetail.email}</span>
                        </div>
                        <div>
                          <span className="text-xs text-plum-500 block">Số điện thoại</span>
                          <span className="font-bold text-plum-900">{userDetail.phone || 'Chưa cập nhật'}</span>
                        </div>
                      </div>

                      {/* Cột 2: Học vấn & Sinh viên */}
                      <div className="space-y-3 p-4 rounded-xl bg-brand-50/40 border border-brand-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">Thông tin học tập</h4>
                        <div>
                          <span className="text-xs text-plum-500 block">Ngành học</span>
                          <span className="font-bold text-plum-900">
                            {userDetail.major ? `${userDetail.major.name} (${userDetail.major.code})` : 'Chưa chọn'}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-plum-500 block">Mã sinh viên / Khóa</span>
                          <span className="font-bold text-plum-900">
                            {userDetail.studentCode || 'N/A'} {userDetail.cohort ? `(Khóa K${userDetail.cohort})` : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trạng thái tài khoản */}
                    <div className="p-4 rounded-xl bg-brand-50/30 border border-brand-100 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-plum-500 block">Ngày khởi tạo tài khoản</span>
                        <span className="font-bold text-plum-900">
                          {new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={userDetail.accountStatus === 'ACTIVE' ? 'success' : 'danger'}>
                          {userDetail.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                        </Badge>
                        <Badge tone={userDetail.isAccountVerified ? 'gold' : 'neutral'}>
                          {userDetail.isAccountVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </Badge>
                      </div>
                    </div>

                    {/* Nút thao tác dưới Modal */}
                    {userDetail.role !== 'ADMIN' && (
                      <div className="mt-6 flex justify-end gap-3 border-t border-plum-900/8 pt-4">
                        <Button
                          size="sm"
                          variant={userDetail.accountStatus === 'LOCKED' ? 'primary' : 'secondary'}
                          onClick={() => {
                            handleToggleLock(userDetail.id, userDetail.accountStatus)
                          }}
                          className={cn(
                            'font-bold text-xs shadow-xs',
                            userDetail.accountStatus === 'LOCKED'
                              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700'
                              : 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                          )}
                        >
                          {updateStatusMutation.isPending && (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          )}
                          {userDetail.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setSelectedUserId(null)} className="font-bold text-xs">
                          Đóng
                        </Button>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </Card>
          </div>,
          document.body
        )}
    </div>
  )
}
