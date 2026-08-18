import { useState } from 'react'
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
      {selectedUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4 backdrop-blur-sm">
          <Card
            hover={false}
            className="w-full max-w-xl bg-white shadow-2xl animate-in slide-in-from-bottom-8 duration-300 overflow-hidden"
          >
            {/* Header info */}
            <div className="relative bg-brand-600 p-6 text-white">
              <button
                onClick={() => setSelectedUserId(null)}
                className="absolute right-4 top-4 rounded-full bg-black/15 p-1 text-white hover:bg-black/25 transition-all"
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
                  <Avatar src={userDetail.avatarUrl} name={userDetail.fullName} size={64} ring verified={userDetail.isAccountVerified} />
                  <div>
                    <h3 className="text-xl font-bold">{userDetail.fullName}</h3>
                    <p className="text-white/80 text-sm mt-0.5">
                      {userDetail.role === 'ADMIN' ? 'Hệ thống Admin' : userDetail.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                    </p>
                    {userDetail.headline && <p className="text-white/70 text-xs mt-1.5 italic">"{userDetail.headline}"</p>}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Body Info */}
            <div className="p-6">
              {isLoadingDetail ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : userDetail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="flex items-center gap-3 text-sm text-plum-700">
                      <span className="p-2 rounded-xl bg-plum-900/[0.04] text-plum-500">
                        <Mail size={16} />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-plum-400">Email</p>
                        <p className="font-semibold truncate max-w-[200px]">{userDetail.email}</p>
                      </div>
                    </div>

                    {/* Điện thoại */}
                    <div className="flex items-center gap-3 text-sm text-plum-700">
                      <span className="p-2 rounded-xl bg-plum-900/[0.04] text-plum-500">
                        <Phone size={16} />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-plum-400">Điện thoại</p>
                        <p className="font-semibold">{userDetail.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    {/* Ngành học */}
                    <div className="flex items-center gap-3 text-sm text-plum-700">
                      <span className="p-2 rounded-xl bg-plum-900/[0.04] text-plum-500">
                        <BookOpen size={16} />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-plum-400">Ngành học</p>
                        <p className="font-semibold">
                          {userDetail.major ? `${userDetail.major.name} (${userDetail.major.code})` : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Mã số / Khóa */}
                    <div className="flex items-center gap-3 text-sm text-plum-700">
                      <span className="p-2 rounded-xl bg-plum-900/[0.04] text-plum-500">
                        <User size={16} />
                      </span>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-plum-400">Mã sinh viên / Khóa</p>
                        <p className="font-semibold">
                          {userDetail.studentCode || 'N/A'} {userDetail.cohort ? `(K${userDetail.cohort})` : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-plum-900/5 my-4" />

                  {/* Account state info */}
                  <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-plum-400">
                    <p>
                      Tài khoản khởi tạo: <strong>{new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}</strong>
                    </p>
                    <div className="flex gap-2">
                      <Badge
                        tone={userDetail.accountStatus === 'ACTIVE' ? 'success' : 'danger'}
                      >
                        {userDetail.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </Badge>
                      <Badge tone={userDetail.isAccountVerified ? 'brand' : 'gold'}>
                        {userDetail.isAccountVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                      </Badge>
                    </div>
                  </div>

                  {/* Actions inside profile details */}
                  {userDetail.role !== 'ADMIN' && (
                    <div className="mt-6 flex justify-end gap-3 border-t border-plum-900/5 pt-4">
                      <Button
                        size="sm"
                        variant={userDetail.accountStatus === 'LOCKED' ? 'primary' : 'secondary'}
                        onClick={() => {
                          handleToggleLock(userDetail.id, userDetail.accountStatus)
                        }}
                      >
                        {updateStatusMutation.isPending && (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        )}
                        {userDetail.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setSelectedUserId(null)}>
                        Đóng
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
