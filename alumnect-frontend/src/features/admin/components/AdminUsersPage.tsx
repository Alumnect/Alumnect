import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Lock, Unlock, Users, X, Loader2, Mail, Phone, BookOpen, GraduationCap, Calendar, FileText, Award } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, toast, Modal } from '@/components/ui'
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

  const [confirmUserLock, setConfirmUserLock] = useState<{ id: number; currentStatus: string } | null>(null)

  // Lock / Unlock Action handler
  const handleToggleLock = (userId: number, currentStatus: string) => {
    setConfirmUserLock({ id: userId, currentStatus })
  }

  const handleConfirmToggleLock = async () => {
    if (!confirmUserLock) return
    const nextStatus = confirmUserLock.currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED'
    try {
      await updateStatusMutation.mutateAsync({ id: confirmUserLock.id, status: nextStatus })
      toast.success(nextStatus === 'ACTIVE' ? 'Đã mở khóa tài khoản thành công!' : 'Đã khóa tài khoản thành công!')
      setConfirmUserLock(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái')
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/45 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <Card
              hover={false}
              className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl border border-brand-100/30 rounded-2xl animate-pop"
            >
              {/* Header Banner - Wrap avatar, name, and email with white text on gradient background */}
              <div className="relative bg-gradient-to-r from-brand-400 via-brand-300 to-gold-400 p-6 text-white rounded-t-2xl shadow-sm">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-all border border-white/10 z-20 shadow-xs"
                >
                  <X size={16} />
                </button>

                {isLoadingDetail ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full border-4 border-white/30 shadow-md bg-white/10 shrink-0" />
                    <div className="space-y-2 flex-1 pb-1">
                      <Skeleton className="h-5 w-40 bg-white/20" />
                      <Skeleton className="h-4 w-48 bg-white/20" />
                    </div>
                  </div>
                ) : userDetail ? (
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={userDetail.avatarUrl}
                      name={userDetail.fullName}
                      size={80}
                      verified={userDetail.isAccountVerified}
                      className="rounded-full border-4 border-white ring-1 ring-plum-900/5 shadow-md shrink-0 bg-white"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-white tracking-tight">{userDetail.fullName}</h2>
                        <Badge
                          tone="neutral"
                          className="bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] rounded-full shrink-0 font-extrabold uppercase border border-white/30 text-white shadow-2xs"
                        >
                          {userDetail.role === 'ADMIN' ? 'Admin' : userDetail.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                        </Badge>
                      </div>
                      <p className="text-white/80 text-xs mt-0.5 font-medium">{userDetail.email}</p>
                      {userDetail.headline && (
                        <p className="text-gold-100 text-xs mt-2 italic font-semibold flex items-center gap-1.5 bg-black/10 px-2.5 py-1.5 rounded-lg border border-white/5 w-fit">
                          <Award size={13} className="shrink-0 text-gold-400" />
                          <span>"{userDetail.headline}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4 bg-white">
                {isLoadingDetail ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-plum-900/5 rounded-xl" />
                    ))}
                  </div>
                ) : userDetail ? (
                  <>
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contact Column */}
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/50 border border-slate-100/80 shadow-3xs">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Mail size={12} className="text-brand-500" />
                          <span>Thông tin liên hệ</span>
                        </h4>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Địa chỉ Email</span>
                            <span className="font-semibold text-plum-900 break-all">{userDetail.email}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Số điện thoại</span>
                            <span className="font-semibold text-plum-900 flex items-center gap-1">
                              <Phone size={11} className="text-slate-400 shrink-0" />
                              {userDetail.phone || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Education Column */}
                      <div className="space-y-3.5 p-4 rounded-xl bg-slate-50/50 border border-slate-100/80 shadow-3xs">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-brand-500" />
                          <span>Học vấn & Mã số</span>
                        </h4>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Chuyên ngành</span>
                            <span className="font-semibold text-plum-900 flex items-center gap-1">
                              <BookOpen size={11} className="text-slate-400 shrink-0" />
                              {userDetail.majorName ? `${userDetail.majorName} (${userDetail.majorCode})` : 'Chưa chọn'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block mb-0.5">Mã sinh viên / Khóa</span>
                            <span className="font-semibold text-plum-900 flex items-center gap-1.5">
                              <span>{userDetail.studentCode || 'N/A'}</span>
                              {userDetail.cohort ? (
                                <Badge tone="neutral" className="px-1.5 py-0 text-[9px] font-bold border border-plum-900/10">
                                  K{userDetail.cohort}
                                </Badge>
                              ) : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Biography block if present */}
                    {userDetail.biography && (
                      <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-100/80 space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <FileText size={12} className="text-brand-500" />
                          <span>Tiểu sử bản thân</span>
                        </h4>
                        <p className="text-xs text-plum-800 leading-relaxed whitespace-pre-line">{userDetail.biography}</p>
                      </div>
                    )}

                    {/* Account Status / Metadata */}
                    <div className="p-4 rounded-xl bg-slate-50/30 border border-slate-100/50 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span className="text-slate-400">Tham gia:</span>
                        <span className="font-semibold text-plum-900">
                          {new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge tone={userDetail.accountStatus === 'ACTIVE' ? 'success' : 'danger'} className="text-[9px] px-2 py-0.5">
                          {userDetail.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                        </Badge>
                        <Badge tone={userDetail.isAccountVerified ? 'gold' : 'neutral'} className="text-[9px] px-2 py-0.5">
                          {userDetail.isAccountVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions under Modal */}
                    {userDetail.role !== 'ADMIN' && (
                      <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                        <Button
                          size="sm"
                          variant={userDetail.accountStatus === 'LOCKED' ? 'primary' : 'secondary'}
                          onClick={() => {
                            handleToggleLock(userDetail.id, userDetail.accountStatus)
                          }}
                          className={cn(
                            'font-bold text-xs shadow-3xs rounded-xl px-4 py-2 transition-all',
                            userDetail.accountStatus === 'LOCKED'
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 hover:shadow-xs'
                              : 'border border-red-200 bg-red-50/50 text-red-600 hover:bg-red-100/80 hover:text-red-700'
                          )}
                        >
                          {updateStatusMutation.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : userDetail.accountStatus === 'LOCKED' ? (
                            <Unlock size={14} className="mr-1.5" />
                          ) : (
                            <Lock size={14} className="mr-1.5" />
                          )}
                          {userDetail.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedUserId(null)}
                          className="font-bold text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2"
                        >
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

      {/* Modal xác nhận khóa / mở khóa tài khoản */}
      {confirmUserLock && (
        <Modal
          isOpen={!!confirmUserLock}
          onClose={() => setConfirmUserLock(null)}
          title={confirmUserLock.currentStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          icon={confirmUserLock.currentStatus === 'LOCKED' ? <Unlock size={18} className="text-emerald-500" /> : <Lock size={18} className="text-rose-500" />}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmUserLock(null)} disabled={updateStatusMutation.isPending}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmToggleLock}
                disabled={updateStatusMutation.isPending}
                className={confirmUserLock.currentStatus === 'LOCKED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}
              >
                {updateStatusMutation.isPending ? 'Đang xử lý...' : confirmUserLock.currentStatus === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-plum-600">
            Bạn có chắc muốn {confirmUserLock.currentStatus === 'LOCKED' ? 'mở khóa' : 'khóa'} tài khoản này không?
          </p>
        </Modal>
      )}
    </div>
  )
}
