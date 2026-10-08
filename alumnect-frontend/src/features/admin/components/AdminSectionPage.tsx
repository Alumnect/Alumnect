import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Inbox, Loader2, CheckCircle2, 
  Eye, X, AlertTriangle, FileImage
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, toast, ImageViewerModal, Pagination } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from './adminSectionsData'
import { useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'
import type { AdminVerificationRequestDto } from '../api/adminApi'
import { AdminReportsQueue } from './AdminReportsQueue'
import { AdminVerificationDetailModal } from './AdminVerificationDetailModal'

export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  const s = ADMIN_SECTIONS[sectionKey]
  const Icon = s.icon

  if (sectionKey === 'reports') {
    return <AdminReportsQueue />
  }

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
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title={s.title}
          subtitle={s.subtitle}
          actions={<Button variant="gold" size="sm">{s.primaryAction}</Button>}
        />
        <Reveal>
          <Card hover={false} className="overflow-hidden border border-plum-900/10">
            <div className="flex items-center justify-between border-b border-plum-900/8 p-5">
              <h2 className="flex items-center gap-2 font-bold text-plum-900">
                <Icon size={18} className="text-gold-600" /> Hàng đợi
              </h2>
              <Badge tone="neutral">{s.rows.length} mục</Badge>
            </div>
            <EmptyState icon={<Inbox size={22} />} title="Tính năng đang được phát triển" className="rounded-none border-none" />
          </Card>
        </Reveal>
      </div>
    )
  }

  const requests = verificationsData?.content || []
  const totalPages = verificationsData?.totalPages || 0
  const totalElements = verificationsData?.totalElements || 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={s.title} subtitle={s.subtitle} />

      {/* Tabs & Tổng số lượng */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'PENDING', label: 'Đang chờ duyệt' },
            { key: 'APPROVED', label: 'Đã chấp thuận' },
            { key: 'REJECTED', label: 'Đã từ chối' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key as any)
                setPage(0)
              }}
              className={cn(
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer select-none',
                statusFilter === tab.key
                  ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-950 shadow-xs'
                  : 'bg-plum-900/[0.04] text-plum-600 hover:bg-plum-900/[0.08]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-plum-500 font-semibold">
          Tổng số: <strong className="text-plum-900 font-bold">{totalElements}</strong> hồ sơ
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
            icon={<Inbox size={24} />}
            title="Lỗi tải danh sách xác minh"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Hàng đợi trống"
            description={`Hiện không có hồ sơ xác minh nào ở trạng thái ${
              statusFilter === 'PENDING' ? 'đang chờ duyệt' : statusFilter === 'APPROVED' ? 'đã duyệt' : 'đã từ chối'
            }.`}
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm text-left">
                <thead>
                  <tr className="border-b border-plum-900/8 text-xs uppercase tracking-wider text-plum-400 bg-plum-900/[0.02]">
                    <th className="px-5 py-3.5 font-bold">Cựu sinh viên</th>
                    <th className="px-5 py-3.5 font-bold">Chuyên ngành</th>
                    <th className="px-5 py-3.5 font-bold text-center">Minh chứng</th>
                    <th className="px-5 py-3.5 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {requests.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-plum-900/[0.015] group"
                    >
                      {/* Cột 1: Cựu sinh viên (Avatar + Tên + Email) */}
                      <td className="px-5 py-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer group/user"
                          onClick={() => setDetailReq(r)}
                        >
                          <Avatar
                            src={r.avatarUrl}
                            name={r.fullName}
                            size={40}
                            className="border border-gold-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-plum-950 group-hover/user:text-gold-600 transition-colors truncate">
                              {r.fullName}
                            </p>
                            <p className="text-xs text-plum-400 truncate">{r.email || 'Chưa có email'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Chuyên ngành */}
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-plum-900">
                          {r.majorName ? `${r.majorCode} - ${r.majorName}` : r.majorCode}
                        </span>
                      </td>

                      {/* Cột 3: Minh chứng (Bấm để mở modal Chi tiết xác minh & xem trực tiếp tài liệu) */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setDetailReq(r)}
                          className="group/btn inline-flex items-center gap-1.5 rounded-xl border border-plum-900/10 bg-cream-50 px-3 py-1.5 text-xs font-bold text-plum-700 transition-all hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700 shadow-2xs cursor-pointer"
                          title="Xem chi tiết tài liệu minh chứng"
                        >
                          <FileImage size={14} className="text-gold-600 transition-transform group-hover/btn:scale-110" />
                          <span>Xem minh chứng</span>
                        </button>
                      </td>

                      {/* Cột 4: Thao tác / Trạng thái */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailReq(r)}
                            className="h-8 px-3 text-xs font-bold bg-plum-900/[0.04] text-plum-700 hover:bg-plum-900/[0.08] cursor-pointer flex items-center gap-1"
                            title="Xem chi tiết hồ sơ xác minh"
                          >
                            <Eye size={13} />
                            <span>Chi tiết</span>
                          </Button>

                          {r.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => setDetailReq(r)}
                                className="h-8 px-3 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Mở hồ sơ để phê duyệt"
                              >
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setDetailReq(r)}
                                className="h-8 px-3 text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                                title="Mở hồ sơ để từ chối"
                              >
                                Từ chối
                              </Button>
                            </>
                          ) : (
                            <Badge
                              tone={r.status === 'APPROVED' ? 'success' : 'danger'}
                              className="px-2.5 py-0.5 text-xs font-bold"
                            >
                              {r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            {/* Phân trang */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Reveal>

      {/* Modal Chi tiết xác minh (2 cột: Thông tin hồ sơ 35% & Minh chứng trực tiếp 65%) */}
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
