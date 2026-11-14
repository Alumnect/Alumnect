import { useState } from 'react'
import {
  Inbox,
  Eye,
  FileImage,
  Clock,
  Check,
  X,
  FileText,
} from 'lucide-react'
import { PageHeader, Badge, Avatar, EmptyState, Skeleton, toast, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { ADMIN_SECTIONS } from './adminSectionsData'
import { useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'
import type { AdminVerificationRequestDto } from '../api/adminApi'
import { AdminReportsQueue } from './AdminReportsQueue'
import { AdminVerificationDetailModal } from './AdminVerificationDetailModal'
import { AdminPageBanner, StatTile, panelClass } from './AdminVisuals'
import { fmtCount } from './adminFormat'

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

  // Tổng theo từng trạng thái lấy từ API (size 1, chỉ đọc totalElements)
  const { data: allVerifications } = useAdminVerifications({ page: 0, size: 1 })
  const { data: pendingVerifications } = useAdminVerifications({ status: 'PENDING', page: 0, size: 1 })
  const { data: approvedVerifications } = useAdminVerifications({ status: 'APPROVED', page: 0, size: 1 })
  const { data: rejectedVerifications } = useAdminVerifications({ status: 'REJECTED', page: 0, size: 1 })
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


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Dải đầu trang */}
      <AdminPageBanner
        title={s.title || 'Xác minh cựu sinh viên'}
        scene="verify"
      />

      {/* 2. Số liệu toàn hệ thống theo trạng thái — bấm để lọc */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatTile icon={<FileText />} tone="slate" label="Tổng hồ sơ" value={fmtCount(allVerifications?.totalElements)} />
        {(
          [
            { key: 'PENDING', label: 'Chờ duyệt', value: pendingVerifications?.totalElements, icon: <Clock />, tone: 'amber' },
            { key: 'APPROVED', label: 'Đã chấp thuận', value: approvedVerifications?.totalElements, icon: <Check />, tone: 'green' },
            { key: 'REJECTED', label: 'Đã từ chối', value: rejectedVerifications?.totalElements, icon: <X />, tone: 'red' },
          ] as const
        ).map((tile) => (
          <StatTile
            key={tile.key}
            icon={tile.icon}
            tone={tile.tone}
            label={tile.label}
            value={fmtCount(tile.value)}
            active={statusFilter === tile.key}
            onClick={() => {
              setStatusFilter(tile.key)
              setPage(0)
            }}
          />
        ))}
      </div>
      {/* 3. Single Unified Container Card: Tích hợp Header, Tabs, Table & Pagination */}
      <div className={panelClass}>
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
                <tr className="border-b border-border text-xs text-text-subtle bg-surface-2/60">
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
                            <span className="text-xs font-bold text-text-subtle shrink-0">
                              #{r.id}
                            </span>
                            <h3 className="font-bold text-xs text-text truncate group-hover:text-primary-solid transition">
                              {r.fullName}
                            </h3>
                          </div>
                          <p className="text-xs text-text-subtle truncate max-w-[190px]" title={r.email}>
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
                          <p className="text-xs text-text-subtle flex items-center gap-1">
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
                          className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-xs font-bold text-text-muted hover:text-text hover:bg-surface-3 border border-border shadow-2xs transition cursor-pointer"
                          title="Xem chi tiết tài liệu minh chứng"
                        >
                          <FileImage size={12} className="text-primary-solid" />
                          <span>Xem minh chứng</span>
                        </button>

                        <div>
                          <Badge
                            tone={r.status === 'APPROVED' ? 'success' : r.status === 'PENDING' ? 'gold' : 'danger'}
                            className="px-2 py-0.5 text-xs font-bold"
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
