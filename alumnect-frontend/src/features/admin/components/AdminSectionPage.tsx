import { useState, useMemo } from 'react'
import {
  Inbox,
  Eye,
  FileImage,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Check,
  X,
} from 'lucide-react'
import { PageHeader, Badge, Avatar, EmptyState, Skeleton, toast, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from './adminSectionsData'
import { useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'
import type { AdminVerificationRequestDto } from '../api/adminApi'
import { AdminReportsQueue } from './AdminReportsQueue'
import { AdminVerificationDetailModal } from './AdminVerificationDetailModal'

/** Trang theo mục quản trị: "Báo cáo" dùng hàng đợi riêng; các mục còn lại dùng khung chung bên dưới. */
export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  if (sectionKey === 'reports') return <AdminReportsQueue />
  return <AdminGenericSection sectionKey={sectionKey} />
}

function AdminGenericSection({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  const s = ADMIN_SECTIONS[sectionKey]
  const Icon = s.icon

  const isVerifications = sectionKey === 'verifications'
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [page, setPage] = useState(0)

  // Fetch verifications from backend
  const { data: verificationsData, isLoading, error } = useAdminVerifications({
    status: isVerifications ? statusFilter : undefined,
    page,
    size: 10,
  })

  const reviewMutation = useReviewVerification()

  // Detail Modal state (Chi tiết xác minh)
  const [detailReq, setDetailReq] = useState<AdminVerificationRequestDto | null>(null)

  const handleReviewSubmit = async (
    id: number,
    status: 'APPROVED' | 'REJECTED',
    reviewNote: string
  ) => {
    try {
      await reviewMutation.mutateAsync({
        id,
        status,
        reviewNote,
      })
      setDetailReq((prev) => (prev && prev.id === id ? { ...prev, status, reviewNote, reviewedBy: 'Quản trị viên' } : prev))
      toast.success(
        status === 'APPROVED'
          ? 'Đã phê duyệt hồ sơ cựu sinh viên thành công!'
          : 'Đã từ chối hồ sơ xác thực.'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi duyệt hồ sơ')
      throw err
    }
  }

  if (!isVerifications) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          kicker="Hàng đợi xử lý tác vụ"
          kickerIcon={<Icon size={15} />}
          title={s.title}
          subtitle={s.subtitle}
          actions={<Button variant="gold" size="sm">{s.primaryAction}</Button>}
        />
        <div className="overflow-hidden border border-border rounded-2xl bg-surface p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h2 className="flex items-center gap-2 font-bold text-text text-sm">
              <Icon size={16} className="text-gold-600" /> Hàng đợi tác vụ
            </h2>
            <Badge tone="neutral">{s.rows.length} mục</Badge>
          </div>
          <EmptyState icon={<Inbox size={22} />} title="Tính năng đang được phát triển" className="rounded-none border-none" />
        </div>
      </div>
    )
  }

  const requests = verificationsData?.content || []
  const totalPages = verificationsData?.totalPages || 0
  const totalElements = verificationsData?.totalElements || 0

  // Thống kê KPIs từ dữ liệu hàng đợi
  const kpiStats = useMemo(() => {
    let pendingCount = 0
    let approvedCount = 0
    let rejectedCount = 0

    requests.forEach((r) => {
      if (r.status === 'PENDING') pendingCount++
      else if (r.status === 'APPROVED') approvedCount++
      else if (r.status === 'REJECTED') rejectedCount++
    })

    return { pendingCount, approvedCount, rejectedCount }
  }, [requests])

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Header chuẩn hóa theo phong cách Quản lý Cố vấn & Gói dịch vụ */}
      <PageHeader
        kicker="Kiểm duyệt hồ sơ tốt nghiệp"
        kickerIcon={<ShieldCheck size={15} />}
        title={s.title || "Xác minh cựu sinh viên"}
        subtitle={s.subtitle || "Kiểm tra bằng cấp, bảng điểm và phê duyệt danh hiệu Cựu sinh viên chính thức cho sinh viên đã tốt nghiệp."}
      />

      {/* 2. Top 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng số yêu cầu */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Tổng hồ sơ</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary-solid shadow-2xs">
              <FileText size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">{totalElements}</span>
            <span className="text-xs text-text-subtle font-medium">yêu cầu</span>
          </div>
          <p className="mt-1 text-[11px] text-text-subtle font-medium">
            Trang {page + 1} / {Math.max(1, totalPages)}
          </p>
        </div>

        {/* Card 2: Đang chờ duyệt */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Chờ xét duyệt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-2xs">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">
              {statusFilter === 'PENDING' ? totalElements : kpiStats.pendingCount}
            </span>
            <span className="text-xs text-text-subtle font-medium">hồ sơ chờ</span>
          </div>
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
            <Clock size={11} /> Cần kiểm tra minh chứng
          </p>
        </div>

        {/* Card 3: Đã chấp thuận */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đã chấp thuận</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">
              {statusFilter === 'APPROVED' ? totalElements : kpiStats.approvedCount}
            </span>
            <span className="text-xs text-text-subtle font-medium">đã duyệt</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 size={11} /> Đã cấp quyền Alumni
          </p>
        </div>

        {/* Card 4: Đã từ chối */}
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-subtle">Đã từ chối</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs">
              <XCircle size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-text tracking-tight">
              {statusFilter === 'REJECTED' ? totalElements : kpiStats.rejectedCount}
            </span>
            <span className="text-xs text-text-subtle font-medium">không đạt</span>
          </div>
          <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <XCircle size={11} /> Minh chứng không hợp lệ
          </p>
        </div>
      </div>

      {/* 3. Single Unified Container Card: Tích hợp Header, Tabs, Table & Pagination */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* Card Header: Tabs trạng thái duyệt */}
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between bg-surface">
          <div>
            <h2 className="text-base font-extrabold text-text flex items-center gap-2">
              <span>Hàng đợi hồ sơ xác minh</span>
              <span className="rounded-full bg-primary-soft text-primary-solid px-2 py-0.5 text-xs font-bold">
                {totalElements} hồ sơ
              </span>
            </h2>
            <p className="text-xs text-text-subtle mt-0.5">
              Kiểm tra thông tin bằng tốt nghiệp, xác thực cựu sinh viên FPTU trước khi nâng cấp tài khoản.
            </p>
          </div>

          {/* Segmented Status Tabs */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-2xs self-start sm:self-auto">
            {[
              { key: 'PENDING', label: 'Đang chờ duyệt' },
              { key: 'APPROVED', label: 'Đã chấp thuận' },
              { key: 'REJECTED', label: 'Đã từ chối' },
            ].map((tab) => {
              const isActive = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key as any)
                    setPage(0)
                  }}
                  className={cn(
                    'relative flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 cursor-pointer select-none whitespace-nowrap',
                    isActive
                      ? 'bg-primary-solid text-on-primary shadow-xs font-extrabold'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  )}
                >
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Toolbar: Counter tóm tắt */}
        <div className="border-b border-border bg-surface-2/40 px-5 py-3 flex items-center justify-between">
          <div className="text-xs font-semibold text-text-subtle">
            Trạng thái hiện tại:{' '}
            <strong className="text-text font-bold">
              {statusFilter === 'PENDING' ? 'Chờ duyệt' : statusFilter === 'APPROVED' ? 'Đã chấp thuận' : 'Đã từ chối'}
            </strong>
          </div>
          <div className="text-xs font-semibold text-text-subtle">
            Hiển thị <strong className="text-text font-bold">{requests.length}</strong> / <strong>{totalElements}</strong> hồ sơ
          </div>
        </div>

        {/* Table: Danh sách hồ sơ (table-fixed 100% không tràn màn hình) */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-soft/40" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-primary-soft/40" />
                  <Skeleton className="h-3 w-1/3 bg-primary-soft/40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={<Inbox size={28} className="text-danger" />}
              title="Lỗi tải danh sách xác minh"
              description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
            />
          </div>
        ) : requests.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Inbox size={28} className="text-text-subtle" />}
              title="Hàng đợi trống"
              description={`Hiện không có hồ sơ xác minh nào ở trạng thái ${
                statusFilter === 'PENDING' ? 'đang chờ duyệt' : statusFilter === 'APPROVED' ? 'đã duyệt' : 'đã từ chối'
              }.`}
            />
          </div>
        ) : (
          <div className="w-full overflow-hidden">
            <table className="w-full table-fixed text-xs text-left">
              <thead>
                <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-subtle bg-surface-2/60">
                  <th className="px-3.5 py-3 font-bold w-[36%]">Cựu sinh viên & Mã số</th>
                  <th className="px-3.5 py-3 font-bold w-[28%]">Chuyên ngành & Thời gian</th>
                  <th className="px-3.5 py-3 font-bold w-[20%]">Minh chứng</th>
                  <th className="px-3.5 py-3 pr-4 font-bold text-right w-[16%]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r: AdminVerificationRequestDto) => (
                  <tr
                    key={r.id}
                    className="transition-colors hover:bg-surface-2/60 group"
                  >
                    {/* Cột 1: Cựu sinh viên */}
                    <td className="px-3.5 py-3 align-top">
                      <div
                        className="flex items-start gap-2.5 cursor-pointer"
                        onClick={() => setDetailReq(r)}
                      >
                        <Avatar
                          src={r.avatarUrl}
                          name={r.fullName}
                          size={34}
                          className="shrink-0 ring-1 ring-border group-hover:scale-105 transition-transform shadow-2xs mt-0.5"
                        />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[10px] font-bold text-text-subtle uppercase tracking-wider shrink-0">
                              #{r.id}
                            </span>
                            <h3 className="font-extrabold text-xs text-text truncate group-hover:text-primary-solid transition">
                              {r.fullName}
                            </h3>
                          </div>
                          <p className="text-[11px] text-text-subtle truncate max-w-[190px]" title={r.email}>
                            {r.email || 'Chưa cập nhật email'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Chuyên ngành & Thời gian gửi */}
                    <td className="px-3.5 py-3 align-top">
                      <div className="space-y-1">
                        <p className="font-bold text-xs text-text truncate" title={r.majorName || r.majorCode}>
                          {r.majorName ? `${r.majorCode} - ${r.majorName}` : r.majorCode}
                        </p>
                        {r.createdAt && (
                          <p className="text-[11px] text-text-subtle flex items-center gap-1">
                            <Clock size={11} className="shrink-0" />
                            <span>{new Date(r.createdAt).toLocaleString('vi-VN')}</span>
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Cột 3: Minh chứng & Trạng thái */}
                    <td className="px-3.5 py-3 align-top">
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailReq(r)}
                          className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[11px] font-bold text-text-muted hover:text-text hover:bg-surface-3 border border-border shadow-2xs transition cursor-pointer"
                          title="Xem chi tiết tài liệu minh chứng"
                        >
                          <FileImage size={12} className="text-primary-solid" />
                          <span>Xem minh chứng</span>
                        </button>

                        <div>
                          <Badge
                            tone={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'gold' : 'danger'}
                            className="px-2 py-0.5 text-[10px] font-bold"
                          >
                            {r.status === 'APPROVED' ? 'Đã duyệt' : r.status === 'PENDING' ? 'Chờ duyệt' : 'Đã từ chối'}
                          </Badge>
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Thao tác */}
                    <td className="px-3.5 py-3 pr-4 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDetailReq(r)}
                          className="h-7 px-2 text-xs font-bold bg-surface-2 text-text hover:bg-surface-3 border border-border shadow-2xs"
                          title="Xem chi tiết hồ sơ xác minh"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </Button>

                        {r.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setDetailReq(r)}
                              className="h-7 w-7 p-0 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60 shadow-2xs transition cursor-pointer"
                              title="Phê duyệt hồ sơ"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailReq(r)}
                              className="h-7 w-7 p-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 shadow-2xs transition cursor-pointer"
                              title="Từ chối hồ sơ"
                            >
                              <X size={13} />
                            </button>
                          </>
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

      {/* Modal Chi tiết xác minh (2 cột: Thông tin hồ sơ & Minh chứng trực tiếp) */}
      <AdminVerificationDetailModal
        isOpen={detailReq !== null}
        onClose={() => setDetailReq(null)}
        request={detailReq}
        onReviewSubmit={handleReviewSubmit}
        isSubmitting={reviewMutation.isPending}
      />
    </div>
  )
}
