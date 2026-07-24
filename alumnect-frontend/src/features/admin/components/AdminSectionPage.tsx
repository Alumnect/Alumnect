import { useState } from 'react'
import { Inbox, ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader, Badge, Card, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from './adminSectionsData'
import { useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'

export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
  const s = ADMIN_SECTIONS[sectionKey]
  const Icon = s.icon

  // Only use dynamic verifications API for the "verifications" section
  const isVerifications = sectionKey === 'verifications'
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [page, setPage] = useState(0)

  // React Query fetch for verifications
  const { data: verificationsData, isLoading, error } = useAdminVerifications({
    status: isVerifications ? statusFilter : undefined,
    page,
    size: 10,
  })

  const reviewMutation = useReviewVerification()

  // Modal Review state
  const [selectedReq, setSelectedReq] = useState<{ id: number; fullName: string } | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !reviewAction) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedReq.id,
        status: reviewAction,
        reviewNote: reviewNote || (reviewAction === 'APPROVED' ? 'Minh chứng tốt nghiệp hợp lệ.' : 'Minh chứng không hợp lệ.'),
      })
      setSelectedReq(null)
      setReviewAction(null)
      setReviewNote('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    }
  }

  if (!isVerifications) {
    // Fallback static implementation for non-verification sections
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader
          title={s.title}
          subtitle={s.subtitle}
          actions={<Button variant="gold" size="sm">{s.primaryAction}</Button>}
        />
        <Reveal>
          <Card hover={false} className="overflow-hidden">
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

  // Verification request rendering
  const requests = verificationsData?.content || []
  const totalPages = verificationsData?.totalPages || 0
  const totalElements = verificationsData?.totalElements || 0

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={s.title} subtitle={s.subtitle} />

      {/* Verification filters */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setStatusFilter('PENDING')
            setPage(0)
          }}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
            statusFilter === 'PENDING'
              ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900'
              : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
          )}
        >
          Đang chờ duyệt
        </button>
        <button
          onClick={() => {
            setStatusFilter('APPROVED')
            setPage(0)
          }}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
            statusFilter === 'APPROVED'
              ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900'
              : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
          )}
        >
          Đã chấp thuận
        </button>
        <button
          onClick={() => {
            setStatusFilter('REJECTED')
            setPage(0)
          }}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all',
            statusFilter === 'REJECTED'
              ? 'bg-gradient-to-r from-gold-300 to-gold-400 text-plum-900'
              : 'bg-plum-900/[0.04] text-plum-500 hover:bg-plum-900/[0.06]'
          )}
        >
          Đã từ chối
        </button>
      </div>

      <Reveal>
        <Card hover={false} className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-plum-900/8 p-5">
            <h2 className="flex items-center gap-2 font-bold text-plum-900">
              <Icon size={18} className="text-gold-600" /> Hàng đợi kiểm duyệt
            </h2>
            <Badge tone="neutral">{totalElements} mục</Badge>
          </div>

          {isLoading ? (
            <div className="space-y-4 p-5">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={<Inbox size={22} />}
              title="Lỗi tải dữ liệu"
              description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
            />
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Inbox size={22} />}
              title="Hàng đợi trống"
              description={`Không tìm thấy hồ sơ nào ở trạng thái ${
                statusFilter === 'PENDING' ? 'đang chờ duyệt' : statusFilter === 'APPROVED' ? 'đã duyệt' : 'đã từ chối'
              }.`}
              className="rounded-none border-none"
            />
          ) : (
            <ul className="divide-y divide-plum-900/8">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:gap-4 transition-colors hover:bg-white/[0.02]">
                  <span
                    className={cn(
                      'grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset',
                      r.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-600 ring-emerald-500/20'
                        : r.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-600 ring-rose-500/20'
                        : 'bg-gold-300/20 text-gold-600 ring-gold-400/20'
                    )}
                  >
                    {r.status === 'APPROVED' ? (
                      <CheckCircle2 size={18} />
                    ) : r.status === 'REJECTED' ? (
                      <XCircle size={18} />
                    ) : (
                      <Icon size={18} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-plum-900">{r.fullName}</p>
                    <p className="text-xs text-plum-400 mt-0.5">
                      Ngành: <strong>{r.majorCode}</strong> · Năm tốt nghiệp: <strong>{r.graduationYear}</strong>
                    </p>
                    {r.note && <p className="text-xs text-plum-500 italic mt-1">"{r.note}"</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    <a
                      href={r.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors"
                    >
                      Bằng tốt nghiệp <ExternalLink size={13} />
                    </a>
                    {r.status === 'PENDING' ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setSelectedReq({ id: r.id, fullName: r.fullName })
                            setReviewAction('APPROVED')
                            setReviewNote('Minh chứng hợp lệ. Chấp nhận tài khoản cựu sinh viên FPTU.')
                          }}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedReq({ id: r.id, fullName: r.fullName })
                            setReviewAction('REJECTED')
                            setReviewNote('')
                          }}
                        >
                          Từ chối
                        </Button>
                      </div>
                    ) : (
                      <Badge tone={r.status === 'APPROVED' ? 'success' : 'danger'}>
                        {r.status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối'}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-plum-900/8">
              <p className="text-xs text-plum-400">
                Hiển thị trang <strong>{page + 1}</strong> trên <strong>{totalPages}</strong>
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
        </Card>
      </Reveal>

      {/* Review Confirmation Modal */}
      {selectedReq && reviewAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-900/40 p-4 backdrop-blur-sm">
          <Card hover={false} className="w-full max-w-md bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-plum-900">
              {reviewAction === 'APPROVED' ? 'Duyệt hồ sơ cựu sinh viên' : 'Từ chối hồ sơ cựu sinh viên'}
            </h3>
            <p className="mt-2 text-sm text-plum-500">
              {reviewAction === 'APPROVED'
                ? `Bạn có chắc muốn phê duyệt tài khoản cựu sinh viên cho `
                : `Vui lòng nhập lý do từ chối tài khoản của cựu sinh viên `}
              <strong>{selectedReq.fullName}</strong>.
            </p>

            <form onSubmit={handleReviewSubmit} className="mt-4">
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-wider text-plum-400">
                  Ghi chú phê duyệt / Lý do từ chối
                </span>
                <textarea
                  required={reviewAction === 'REJECTED'}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewAction === 'APPROVED'
                      ? 'Ví dụ: Minh chứng tốt nghiệp hợp lệ.'
                      : 'Lý do cụ thể (Bắt buộc)...'
                  }
                  className="mt-2 h-24 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/50 focus:outline-none"
                />
              </label>

              <div className="mt-5 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setSelectedReq(null)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className={cn(
                    reviewAction === 'APPROVED'
                      ? 'from-gold-300 to-gold-400 text-plum-900 shadow-[0_12px_28px_-12px_rgba(239,175,62,0.8)]'
                      : 'from-rose-600 to-rose-500 text-white shadow-[0_12px_28px_-12px_rgba(220,38,38,0.5)]'
                  )}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Xác nhận
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
