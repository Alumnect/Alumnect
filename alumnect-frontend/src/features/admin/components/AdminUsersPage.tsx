import { useState, useEffect } from 'react'
import {
  Search,
  Lock,
  Unlock,
  Users,
  X,
  Loader2,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  FileText,
  Award,
  RotateCcw,
} from 'lucide-react'
import { Badge, Avatar, EmptyState, Skeleton, toast, Modal, Pagination, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAdminUsers, useAdminUserDetail, useUpdateUserStatus, useAdminOverview } from '../hooks/useAdmin'
import { AdminMentorCvModal } from './AdminMentorCvModal'
import type { AdminUserDto } from '../api/adminApi'
import { AdminPageBanner, StatTile, panelClass } from './AdminVisuals'
import { fmtCount } from './adminFormat'

/**
 * Trang quản lý tài khoản người dùng dành cho Quản trị viên (Admin).
 * Redesigned theo phong cách shadcn-admin / square-ui với 4 Thẻ KPI và bảng compound 0 cuộn ngang.
 */
export function AdminUsersPage() {
  const [tab, setTab] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // UC96 State xem CV Mentor
  const [selectedCvMentorId, setSelectedCvMentorId] = useState<number | null>(null)
  const [isCvModalOpen, setIsCvModalOpen] = useState(false)

  // Mapping tab values to API parameters
  const roleParam = tab === 'ALUMNI' ? 'ALUMNI' : tab === 'STUDENT' ? 'STUDENT' : undefined
  const statusParam = tab === 'LOCKED' ? 'LOCKED' : undefined

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

  const [confirmUserLock, setConfirmUserLock] = useState<{ id: number; currentStatus: string; name?: string; email?: string } | null>(null)

  // Lock / Unlock Action handler
  const handleToggleLock = (userId: number, currentStatus: string, name?: string, email?: string) => {
    setConfirmUserLock({ id: userId, currentStatus, name, email })
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
  const totalElements = data?.totalElements || 0

  // Thống kê toàn hệ thống (không đếm theo trang đang xem)
  const { data: overview } = useAdminOverview()
  const { data: lockedUsers } = useAdminUsers({ status: 'LOCKED', page: 0, size: 1 })
  const stats = [
    { key: 'ALL', label: 'Tổng số tài khoản', value: overview?.totalUsers, icon: <Users />, tone: 'slate' as const },
    { key: 'ALUMNI', label: 'Cựu sinh viên', value: overview?.totalAlumni, icon: <GraduationCap />, tone: 'orange' as const },
    { key: 'STUDENT', label: 'Sinh viên', value: overview?.totalStudents, icon: <BookOpen />, tone: 'blue' as const },
    { key: 'LOCKED', label: 'Đang khóa', value: lockedUsers?.totalElements, icon: <Lock />, tone: 'red' as const },
  ]

  const hasActiveFilters = tab !== 'ALL' || Boolean(query)

  const resetFilters = () => {
    setTab('ALL')
    setQuery('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Dải đầu trang */}
      <AdminPageBanner
        title="Quản lý tài khoản"
        scene="users"
      />

      {/* 2. Số liệu toàn hệ thống — bấm để lọc */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile
            key={s.key}
            icon={s.icon}
            tone={s.tone}
            label={s.label}
            value={fmtCount(s.value)}
            active={tab === s.key}
            onClick={() => {
              setTab(s.key)
              setPage(0)
            }}
          />
        ))}
      </div>
      {/* 3. Single Unified Container Card: Tích hợp Header, Filters, Table & Pagination */}
      <div className={panelClass}>
        {/* Toolbar: Tìm kiếm & Đặt lại bộ lọc */}
        <div className="border-b border-border bg-surface-2/40 p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm theo tên, email, mã số..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm theo tên, email, mã số sinh viên..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-text-muted hover:border-danger hover:bg-danger-soft hover:text-danger transition cursor-pointer shrink-0"
                  title="Đặt lại toàn bộ bộ lọc"
                >
                  <RotateCcw size={13} />
                  <span>Đặt lại</span>
                </button>
              )}

              <div className="text-xs font-semibold text-text-subtle shrink-0">
                Hiển thị <strong className="text-text font-bold">{users.length}</strong> / <strong>{totalElements}</strong> tài khoản
              </div>
            </div>
          </div>
        </div>

        {/* Table: Danh sách tài khoản (table-fixed 100% không tràn màn hình) */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-soft/40" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-primary-soft/40" />
                  <Skeleton className="h-3 w-1/2 bg-primary-soft/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={<Users size={28} className="text-danger" />}
              title="Lỗi tải danh sách người dùng"
              description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
            />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Users size={28} className="text-text-subtle" />}
              title="Không tìm thấy người dùng"
              description="Hãy thử thay đổi điều kiện tìm kiếm hoặc tab bộ lọc."
            />
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs text-left">
              <thead>
                <tr className="border-b border-border text-xs text-text-subtle bg-surface-2/60">
                  <th className="px-3.5 py-3 font-bold w-[40%]">Thành viên & Mã số</th>
                  <th className="px-3.5 py-3 font-bold w-[24%]">Vai trò & Hồ sơ</th>
                  <th className="px-3.5 py-3 font-bold w-[18%]">Trạng thái</th>
                  <th className="px-3.5 py-3 pr-4 font-bold text-right w-[18%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u: AdminUserDto) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="cursor-pointer transition-colors hover:bg-surface-2/60 group"
                  >
                    {/* Cột 1: Thành viên & Mã số */}
                    <td className="px-3.5 py-3 align-top">
                      <div className="flex items-start gap-2.5">
                        <Avatar
                          src={u.avatarUrl}
                          name={u.fullName}
                          size={34}
                          verified={u.isAccountVerified}
                          className="shrink-0 ring-1 ring-border group-hover:scale-105 transition-transform shadow-2xs mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-bold text-text-subtle shrink-0">
                              #{u.id}
                            </span>
                            <h3 className="font-bold text-xs text-text truncate group-hover:text-primary-solid transition">
                              {u.fullName}
                            </h3>
                          </div>
                          <p className="text-xs text-text-subtle truncate max-w-[200px]" title={u.email}>
                            {u.email}
                          </p>
                          {(u.studentCode || u.cohort) && (
                            <p className="text-xs text-text-subtle font-medium">
                              MSSV: <strong className="text-text font-semibold">{u.studentCode || 'N/A'}</strong>
                              {u.cohort ? ` · K${u.cohort}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Vai trò & Hồ sơ */}
                    <td className="px-3.5 py-3 align-top">
                      <div className="space-y-1.5">
                        <div>
                          <Badge
                            tone={
                              u.role === 'ADMIN' ? 'gold' : u.role === 'ALUMNI' ? 'brand' : 'neutral'
                            }
                            className="px-2 py-0.5 text-xs font-bold"
                          >
                            {u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                          </Badge>
                        </div>

                        {u.role === 'ALUMNI' && (u.hasMentorProfile || u.mentorProfileId) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCvMentorId(u.mentorProfileId || u.id)
                              setIsCvModalOpen(true)
                            }}
                            className="inline-flex items-center gap-1 rounded-md bg-orange-500/10 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-500/20 border border-orange-500/20 shadow-2xs transition cursor-pointer"
                            title="Xem CV Mentor"
                          >
                            <FileText size={11} /> CV Mentor
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Cột 3: Trạng thái tài khoản */}
                    <td className="px-3.5 py-3 align-top">
                      <div className="space-y-1">
                        <div>
                          <Badge
                            tone={u.accountStatus === 'LOCKED' ? 'danger' : 'success'}
                            className="px-2 py-0.5 text-xs font-bold"
                          >
                            {u.accountStatus === 'LOCKED' ? 'Bị khóa' : 'Hoạt động'}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-subtle font-medium">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </td>

                    {/* Cột 4: Thao tác */}
                    <td className="px-3.5 py-3 pr-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUserId(u.id)
                          }}
                          className="h-7 px-2.5 text-xs font-bold bg-surface-2 text-text hover:bg-surface-3 border border-border shadow-2xs"
                          title="Xem chi tiết tài khoản"
                        >
                          Chi tiết
                        </Button>

                        {u.role !== 'ADMIN' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleLock(u.id, u.accountStatus, u.fullName, u.email)
                            }}
                            className={cn(
                              'grid h-7 w-7 place-items-center rounded-lg border transition shadow-2xs cursor-pointer',
                              u.accountStatus === 'LOCKED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
                            )}
                            title={u.accountStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.accountStatus === 'LOCKED' ? <Unlock size={13} /> : <Lock size={13} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Footer: Pagination */}
        <div className="border-t border-border p-4 bg-surface flex items-center justify-between">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* User Profile Detail Drawer / Modal */}
      {selectedUserId !== null && (
        <DialogFrame
          onClose={() => setSelectedUserId(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-xl"
          className="z-10 overflow-hidden border border-border shadow-2xl flex flex-col pop bg-surface rounded-3xl"
        >
          {/* Header Modal */}
          <div className="relative bg-surface p-5 border-b border-border">
            <button
              onClick={() => setSelectedUserId(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-xl text-text-subtle hover:bg-surface-2 hover:text-text transition-colors z-20 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>

            {isLoadingDetail ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full border border-border shadow-sm shrink-0" />
                <div className="space-y-2 flex-1 pb-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : userDetail ? (
              <div className="flex items-center gap-3.5">
                <Avatar
                  src={userDetail.avatarUrl}
                  name={userDetail.fullName}
                  size={60}
                  verified={userDetail.isAccountVerified}
                  className="rounded-full border border-border shadow-sm shrink-0 bg-surface"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-text tracking-tight">{userDetail.fullName}</h2>
                    <Badge
                      tone={userDetail.role === 'ADMIN' ? 'neutral' : userDetail.role === 'ALUMNI' ? 'brand' : 'aqua'}
                      className="px-2 py-0.5 text-xs rounded-full shrink-0 font-bold border"
                    >
                      {userDetail.role === 'ADMIN' ? 'Quản trị viên' : userDetail.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                    </Badge>
                    <Badge
                      tone={userDetail.accountStatus === 'LOCKED' ? 'danger' : 'success'}
                      className="px-2 py-0.5 text-xs rounded-full shrink-0 font-bold border"
                    >
                      {userDetail.accountStatus === 'LOCKED' ? 'Bị khóa' : 'Hoạt động'}
                    </Badge>
                  </div>
                  <p className="text-text-subtle text-xs mt-0.5 font-medium">{userDetail.email}</p>
                  {userDetail.headline && (
                    <p className="text-text-muted text-xs mt-1.5 font-medium flex items-center gap-1.5 bg-surface-2 border border-border px-2 py-1 rounded-lg w-fit">
                      <Award size={12} className="shrink-0 text-amber-500" />
                      <span>"{userDetail.headline}"</span>
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-3.5 bg-surface overflow-y-auto max-h-[calc(85vh-130px)]">
            {isLoadingDetail ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full bg-surface-2 rounded-xl" />
                ))}
              </div>
            ) : userDetail ? (
              <>
                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Contact Column */}
                  <div className="space-y-2.5 p-3.5 rounded-2xl bg-surface-2 border border-border">
                    <h4 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                      <Mail size={12} className="text-primary-solid" />
                      <span>Thông tin liên hệ</span>
                    </h4>
                    
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-xs font-medium text-text-subtle block mb-0.5">Địa chỉ Email</span>
                        <span className="font-semibold text-text break-all">{userDetail.email}</span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-text-subtle block mb-0.5">Số điện thoại</span>
                        <span className="font-semibold text-text flex items-center gap-1">
                          <Phone size={11} className="text-text-subtle shrink-0" />
                          {userDetail.phone || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Education Column */}
                  <div className="space-y-2.5 p-3.5 rounded-2xl bg-surface-2 border border-border">
                    <h4 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                      <GraduationCap size={13} className="text-primary-solid" />
                      <span>Học vấn & Mã số</span>
                    </h4>
                    
                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-xs font-medium text-text-subtle block mb-0.5">Chuyên ngành</span>
                        <span className="font-semibold text-text flex items-center gap-1">
                          <BookOpen size={11} className="text-text-subtle shrink-0" />
                          {userDetail.majorName ? `${userDetail.majorName} (${userDetail.majorCode})` : 'Chưa chọn'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-text-subtle block mb-0.5">Mã sinh viên / Khóa</span>
                        <span className="font-semibold text-text flex items-center gap-1.5">
                          <span>{userDetail.studentCode || 'N/A'}</span>
                          {userDetail.cohort ? (
                            <Badge tone="neutral" className="px-1.5 py-0 text-xs font-bold border border-border">
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
                  <div className="p-3.5 rounded-2xl bg-surface-2 border border-border space-y-1.5">
                    <h4 className="text-xs font-bold text-text-subtle flex items-center gap-1.5">
                      <FileText size={12} className="text-primary-solid" />
                      <span>Tiểu sử bản thân</span>
                    </h4>
                    <p className="text-xs text-text leading-relaxed whitespace-pre-line font-normal">{userDetail.biography}</p>
                  </div>
                )}

                {/* Account Status / Metadata */}
                <div className="p-3.5 rounded-2xl bg-surface-2 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-text-subtle" />
                    <span className="text-text-subtle">Tham gia:</span>
                    <span className="font-semibold text-text">
                      {new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge tone={userDetail.isAccountVerified ? 'gold' : 'neutral'} className="text-xs px-2 py-0.5 font-bold">
                      {userDetail.isAccountVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                    </Badge>
                  </div>
                </div>

                {/* Actions under Modal */}
                <div className="mt-4 flex justify-end gap-2.5 border-t border-border pt-3">
                  {userDetail.role !== 'ADMIN' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        handleToggleLock(userDetail.id, userDetail.accountStatus, userDetail.fullName, userDetail.email)
                      }}
                      className={cn(
                        'font-bold text-xs rounded-xl px-4 py-2 transition text-white',
                        userDetail.accountStatus === 'LOCKED'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-rose-600 hover:bg-rose-700'
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
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedUserId(null)}
                    className="font-bold text-xs border border-border text-text hover:bg-surface-2 rounded-xl px-4 py-2"
                  >
                    Đóng
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogFrame>
      )}

      {/* Modal xác nhận khóa / mở khóa tài khoản */}
      {confirmUserLock && (
        <Modal
          isOpen={!!confirmUserLock}
          onClose={() => setConfirmUserLock(null)}
          title={confirmUserLock.currentStatus === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
          icon={confirmUserLock.currentStatus === 'LOCKED' ? <Unlock size={18} className="text-emerald-500" /> : <Lock size={18} className="text-rose-500" />}
          footer={
            <div className="flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={() => setConfirmUserLock(null)} disabled={updateStatusMutation.isPending}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmToggleLock}
                disabled={updateStatusMutation.isPending}
                className={cn(
                  'font-bold text-white',
                  confirmUserLock.currentStatus === 'LOCKED'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                )}
              >
                {updateStatusMutation.isPending ? 'Đang xử lý...' : confirmUserLock.currentStatus === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
              </Button>
            </div>
          }
        >
          <p className="text-xs text-text-muted leading-relaxed">
            Bạn có chắc chắn muốn {confirmUserLock.currentStatus === 'LOCKED' ? 'mở khóa' : 'khóa'} tài khoản{' '}
            <strong className="text-text font-bold">{confirmUserLock.name || `#${confirmUserLock.id}`}</strong>{confirmUserLock.email ? ` (${confirmUserLock.email})` : ''} không?
          </p>
        </Modal>
      )}

      {/* UC96 Modal Xem CV Mentor cho Quản trị viên */}
      <AdminMentorCvModal
        isOpen={isCvModalOpen}
        onClose={() => setIsCvModalOpen(false)}
        mentorProfileId={selectedCvMentorId}
      />
    </div>
  )
}
