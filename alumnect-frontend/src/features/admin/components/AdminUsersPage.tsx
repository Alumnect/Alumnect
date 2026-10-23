import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Lock, Unlock, Users, X, Loader2, Mail, Phone, BookOpen, GraduationCap, Calendar, FileText, Award } from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, toast, Modal, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminUsers, useAdminUserDetail, useUpdateUserStatus } from '../hooks/useAdmin'
import { AdminMentorCvModal } from './AdminMentorCvModal'

const TABS = [
  { name: 'Tất cả', value: 'ALL' },
  { name: 'Cựu sinh viên', value: 'ALUMNI' },
  { name: 'Sinh viên', value: 'STUDENT' },
  { name: 'Đang khóa', value: 'LOCKED' },
]

export function AdminUsersPage() {
  const [tab, setTab] = useState('ALL')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  // UC96 State
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
        subtitle="Tìm kiếm, xem hồ sơ chi tiết và khóa/mở khóa tài khoản người dùng."
      />

      {/* Tabs and search bar bọc Card chuẩn đồng bộ với AdminPostsPage & AdminReportsQueue */}
      <Card hover={false} className="mb-5 p-4 bg-surface/80 backdrop-blur border border-border shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTab(t.value)
                  setPage(0) // reset về trang đầu
                }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer select-none',
                  tab === t.value
                    ? 'bg-primary-solid text-on-primary shadow-xs'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="relative flex items-center sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 text-text-subtle" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
              placeholder="Tìm theo tên, email, mã số..."
              className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-sm text-text placeholder:text-text-subtle focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>
        </div>
      </Card>

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
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-text-subtle">
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
                      className="border-b border-border transition-colors last:border-0 hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div
                          className="flex items-center gap-3 cursor-pointer group/user"
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <Avatar src={u.avatarUrl} name={u.fullName} size={38} verified={u.isAccountVerified} />
                          <div>
                            <p className="font-semibold text-text group-hover/user:text-gold-600 transition-colors">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-text-subtle">{u.email}</p>
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
                          {u.role === 'ADMIN' ? 'Quản trị viên' : u.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          tone={u.accountStatus === 'LOCKED' ? 'danger' : 'success'}
                          className="px-2.5 py-0.5"
                        >
                          {u.accountStatus === 'LOCKED' ? 'Bị khóa' : 'Hoạt động'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-text-muted">
                        {u.studentCode || 'N/A'}{' '}
                        {u.cohort ? <span className="text-xs text-text-subtle">(K{u.cohort})</span> : ''}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'ALUMNI' && (u.hasMentorProfile || u.mentorProfileId) && (
                            <button
                              onClick={() => {
                                setSelectedCvMentorId(u.mentorProfileId || u.id)
                                setIsCvModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-1.5 text-xs font-bold text-primary-solid hover:bg-orange-100 border border-orange-200/80 shadow-sm transition-all"
                              title="Xem CV Mentor"
                            >
                              <FileText size={13} /> CV Mentor
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedUserId(u.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-text-muted hover:bg-surface-3"
                          >
                            Chi tiết
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => handleToggleLock(u.id, u.accountStatus)}
                              className={cn(
                                'grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset transition-all',
                                u.accountStatus === 'LOCKED'
                                  ? 'bg-success-soft text-success ring-success hover:bg-success-border/60'
                                  : 'bg-danger-soft text-danger ring-danger hover:bg-danger-border/60'
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Reveal>

      {/* User Profile Detail Drawer / Modal */}
      {selectedUserId !== null &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedUserId(null)}
            />

            <Card
              hover={false}
              className="relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface p-0 shadow-2xl border border-plum-950/15 rounded-3xl pop"
            >
              {/* Header Banner - Clean white matching user modals */}
              <div className="relative bg-surface p-6 border-b border-border rounded-t-3xl">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-text-subtle hover:bg-surface-2 hover:text-text transition-colors z-20 cursor-pointer"
                  title="Đóng cửa sổ"
                >
                  <X size={18} />
                </button>

                {isLoadingDetail ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full border-2 border-border shadow-sm shrink-0" />
                    <div className="space-y-2 flex-1 pb-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                ) : userDetail ? (
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={userDetail.avatarUrl}
                      name={userDetail.fullName}
                      size={72}
                      verified={userDetail.isAccountVerified}
                      className="rounded-full border-2 border-border ring-2 ring-slate-100/80 shadow-sm shrink-0 bg-surface"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-bold text-text tracking-tight">{userDetail.fullName}</h2>
                        <Badge
                          tone={userDetail.role === 'ADMIN' ? 'neutral' : userDetail.role === 'ALUMNI' ? 'brand' : 'aqua'}
                          className="px-2.5 py-0.5 text-xs rounded-full shrink-0 font-bold uppercase border"
                        >
                          {userDetail.role === 'ADMIN' ? 'Quản trị viên' : userDetail.role === 'ALUMNI' ? 'Cựu sinh viên' : 'Sinh viên'}
                        </Badge>
                        <Badge
                          tone={userDetail.accountStatus === 'LOCKED' ? 'danger' : 'success'}
                          className="px-2.5 py-0.5 text-xs rounded-full shrink-0 font-bold uppercase border"
                        >
                          {userDetail.accountStatus === 'LOCKED' ? 'Bị khóa' : 'Hoạt động'}
                        </Badge>
                      </div>
                      <p className="text-text-subtle text-xs mt-0.5 font-medium">{userDetail.email}</p>
                      {userDetail.headline && (
                        <p className="text-text-muted text-xs mt-2 italic font-medium flex items-center gap-1.5 bg-surface-2 border border-border px-2.5 py-1.5 rounded-xl w-fit">
                          <Award size={13} className="shrink-0 text-warning" />
                          <span>"{userDetail.headline}"</span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4 bg-surface">
                {isLoadingDetail ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full bg-surface-2 rounded-xl" />
                    ))}
                  </div>
                ) : userDetail ? (
                  <>
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Contact Column */}
                      <div className="space-y-3.5 p-4.5 rounded-2xl bg-surface-2 border border-border">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                          <Mail size={13} className="text-primary-solid" />
                          <span>Thông tin liên hệ</span>
                        </h4>
                        
                        <div className="space-y-2 text-xs">
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
                      <div className="space-y-3.5 p-4.5 rounded-2xl bg-surface-2 border border-border">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                          <GraduationCap size={14} className="text-primary-solid" />
                          <span>Học vấn & Mã số</span>
                        </h4>
                        
                        <div className="space-y-2 text-xs">
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
                      <div className="p-4.5 rounded-2xl bg-surface-2 border border-border space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                          <FileText size={13} className="text-primary-solid" />
                          <span>Tiểu sử bản thân</span>
                        </h4>
                        <p className="text-xs text-text leading-relaxed whitespace-pre-line font-normal">{userDetail.biography}</p>
                      </div>
                    )}

                    {/* Account Status / Metadata */}
                    <div className="p-4 rounded-2xl bg-slate-50/60 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-text-subtle" />
                        <span className="text-text-subtle">Tham gia:</span>
                        <span className="font-semibold text-text">
                          {new Date(userDetail.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge tone={userDetail.accountStatus === 'ACTIVE' ? 'success' : 'danger'} className="text-xs px-2.5 py-0.5 font-bold">
                          {userDetail.accountStatus === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                        </Badge>
                        <Badge tone={userDetail.isAccountVerified ? 'gold' : 'neutral'} className="text-xs px-2.5 py-0.5 font-bold">
                          {userDetail.isAccountVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions under Modal */}
                    <div className="mt-6 flex justify-end gap-2.5 border-t border-border pt-4">
                      {userDetail.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          variant={userDetail.accountStatus === 'LOCKED' ? 'primary' : 'secondary'}
                          onClick={() => {
                            handleToggleLock(userDetail.id, userDetail.accountStatus)
                          }}
                          className={cn(
                            'font-bold text-xs rounded-xl px-4 py-2 transition-all',
                            userDetail.accountStatus === 'LOCKED'
                              ? 'bg-success text-text-inverse hover:opacity-90 shadow-xs'
                              : 'border border-danger-border bg-danger-soft text-danger hover:bg-danger-border/60 hover:text-danger'
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
                        className="font-bold text-xs border border-border text-text-muted hover:bg-surface-2 rounded-xl px-4 py-2"
                      >
                        Đóng
                      </Button>
                    </div>
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
          icon={confirmUserLock.currentStatus === 'LOCKED' ? <Unlock size={18} className="text-success" /> : <Lock size={18} className="text-danger" />}
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmUserLock(null)} disabled={updateStatusMutation.isPending}>
                Hủy
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmToggleLock}
                disabled={updateStatusMutation.isPending}
                className={confirmUserLock.currentStatus === 'LOCKED' ? 'bg-success hover:opacity-90 text-text-inverse' : 'bg-danger hover:opacity-90 text-text-inverse'}
              >
                {updateStatusMutation.isPending ? 'Đang xử lý...' : confirmUserLock.currentStatus === 'LOCKED' ? 'Mở khóa' : 'Khóa tài khoản'}
              </Button>
            </div>
          }
        >
          <p className="text-sm text-text-muted">
            Bạn có chắc muốn {confirmUserLock.currentStatus === 'LOCKED' ? 'mở khóa' : 'khóa'} tài khoản này không?
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
