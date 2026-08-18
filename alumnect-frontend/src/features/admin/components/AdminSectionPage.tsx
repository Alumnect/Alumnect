import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Inbox, ExternalLink, Loader2, CheckCircle2, XCircle, 
  Eye, ZoomIn, X, MessageSquare, AlertTriangle, ShieldCheck, FileImage
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { ADMIN_SECTIONS } from './adminSectionsData'
import { useAdminVerifications, useReviewVerification } from '../hooks/useAdmin'
import type { AdminVerificationRequestDto } from '../api/adminApi'

const REJECT_REASON_TEMPLATES = [
  'Ảnh minh chứng mờ, không nhìn rõ thông tin.',
  'Thông tin chuyên ngành hoặc năm tốt nghiệp không khớp.',
  'Hình ảnh không phải là bằng tốt nghiệp hoặc chứng nhận hợp lệ.',
  'Mã số sinh viên / hồ sơ không tìm thấy trên hệ thống.',
]

export function AdminSectionPage({ sectionKey }: { sectionKey: keyof typeof ADMIN_SECTIONS }) {
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

  // Modal Review state
  const [selectedReq, setSelectedReq] = useState<AdminVerificationRequestDto | null>(null)
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [reviewNote, setReviewNote] = useState('')

  // Preview Lightbox state (dành cho xem ảnh minh chứng full size)
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null)

  // Detail Modal state (dành cho xem đầy đủ chi tiết hồ sơ)
  const [detailReq, setDetailReq] = useState<AdminVerificationRequestDto | null>(null)

  useEffect(() => {
    if ((selectedReq && reviewAction) || previewProofUrl || detailReq) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedReq, reviewAction, previewProofUrl, detailReq])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !reviewAction) return

    try {
      await reviewMutation.mutateAsync({
        id: selectedReq.id,
        status: reviewAction,
        reviewNote: reviewNote || (reviewAction === 'APPROVED' ? 'Minh chứng tốt nghiệp hợp lệ. Đã phê duyệt quyền Cựu sinh viên.' : 'Minh chứng không hợp lệ.'),
      })
      setSelectedReq(null)
      setReviewAction(null)
      setReviewNote('')
      if (detailReq?.id === selectedReq.id) {
        setDetailReq(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Có lỗi xảy ra khi duyệt hồ sơ')
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
                'rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200',
                statusFilter === tab.key
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                  : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100'
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
                    <th className="px-5 py-3.5 font-bold">Thông tin xác minh</th>
                    <th className="px-5 py-3.5 font-bold">Ghi chú</th>
                    <th className="px-5 py-3.5 font-bold text-center">Minh chứng</th>
                    <th className="px-5 py-3.5 font-bold text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {requests.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-plum-900/[0.015]">
                      {/* Cột 1: Cựu sinh viên (Avatar + Tên + Email) */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={r.avatarUrl}
                            name={r.fullName}
                            size={40}
                            className="border border-gold-300 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-plum-950 truncate">{r.fullName}</p>
                            <p className="text-xs text-plum-400 truncate">{r.email || 'Chưa có email'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Thông tin xác minh (Ngành + Năm tốt nghiệp) */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-plum-900">
                            {r.majorName ? `${r.majorCode} - ${r.majorName}` : r.majorCode}
                          </span>
                          <span className="text-xs text-plum-500">
                            Tốt nghiệp năm <strong className="text-plum-800 font-semibold">{r.graduationYear}</strong>
                          </span>
                        </div>
                      </td>

                      {/* Cột 3: Ghi chú */}
                      <td className="px-5 py-4 max-w-xs">
                        {r.note ? (
                          <div className="flex items-start gap-1 text-xs text-plum-700 italic bg-plum-900/[0.03] p-2 rounded-lg border border-plum-900/5 line-clamp-2">
                            <MessageSquare size={12} className="mt-0.5 shrink-0 text-gold-600" />
                            <span>"{r.note}"</span>
                          </div>
                        ) : (
                          <span className="text-xs text-plum-400 font-normal">Không có ghi chú</span>
                        )}
                        {r.status !== 'PENDING' && r.reviewNote && (
                          <div className="mt-1 text-[11px] font-medium text-plum-500">
                            Ghi chú Admin: {r.reviewNote}
                          </div>
                        )}
                      </td>

                      {/* Cột 4: Ảnh minh chứng (Thumbnail nút nhấp xem) */}
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setPreviewProofUrl(r.proofUrl)}
                          className="group inline-flex items-center gap-1.5 rounded-xl border border-plum-900/10 bg-cream-50 px-3 py-1.5 text-xs font-bold text-plum-700 transition-all hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700 shadow-2xs"
                        >
                          <FileImage size={14} className="text-gold-600 transition-transform group-hover:scale-110" />
                          <span>Xem ảnh</span>
                        </button>
                      </td>

                      {/* Cột 5: Thao tác / Trạng thái */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setDetailReq(r)}
                            className="h-8 px-2.5 text-xs font-bold bg-plum-900/[0.04] text-plum-700 hover:bg-plum-900/[0.08]"
                            title="Xem đầy đủ hồ sơ"
                          >
                            <Eye size={13} />
                          </Button>

                          {r.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedReq(r)
                                  setReviewAction('APPROVED')
                                  setReviewNote('Minh chứng hợp lệ. Đã phê duyệt quyền Cựu sinh viên.')
                                }}
                                className="h-8 px-3 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                              >
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setSelectedReq(r)
                                  setReviewAction('REJECTED')
                                  setReviewNote('')
                                }}
                                className="h-8 px-3 text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-2">
                <p className="text-xs text-plum-500">
                  Hiển thị trang <strong className="text-plum-900">{page + 1}</strong> / <strong className="text-plum-900">{totalPages}</strong>
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Reveal>

      {/* 1. Modal Xem Chi Tiết Hồ Sơ (Full Detail Modal) */}
      {detailReq &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/60 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <Card hover={false} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl border border-brand-100 rounded-2xl">
              {/* Banner Header - FPT Corporate Orange-Gold Gradient */}
              <div className="relative bg-gradient-to-r from-brand-500 via-brand-600 to-gold-500 p-6 text-white rounded-t-2xl shadow-sm">
                <button
                  onClick={() => setDetailReq(null)}
                  className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <X size={18} />
                </button>

                <div className="flex items-center gap-4">
                  <Avatar 
                    src={detailReq.avatarUrl} 
                    name={detailReq.fullName} 
                    size={64} 
                    className="border-2 border-white ring-4 ring-white/30 shadow-lg shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-black text-white tracking-tight">{detailReq.fullName}</h2>
                      <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-0.5 text-xs font-bold text-white border border-white/30 shadow-2xs">
                        {detailReq.status === 'APPROVED' ? 'Đã phê duyệt' : detailReq.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                      </span>
                    </div>
                    <p className="text-brand-50 text-xs mt-1 truncate">{detailReq.email || 'Chưa cập nhật email'}</p>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3 p-4 rounded-xl bg-brand-50/40 border border-brand-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">Thông tin học tập</h4>
                    <div>
                      <span className="text-xs text-plum-500 block">Chuyên ngành</span>
                      <span className="font-bold text-plum-900">{detailReq.majorName ? `${detailReq.majorCode} - ${detailReq.majorName}` : detailReq.majorCode}</span>
                    </div>
                    <div>
                      <span className="text-xs text-plum-500 block">Năm tốt nghiệp</span>
                      <span className="font-bold text-plum-900">{detailReq.graduationYear}</span>
                    </div>
                    <div>
                      <span className="text-xs text-plum-500 block">Thời điểm gửi yêu cầu</span>
                      <span className="font-bold text-plum-900">{new Date(detailReq.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-brand-50/40 border border-brand-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">Ghi chú & Kiểm duyệt</h4>
                    <div>
                      <span className="text-xs text-plum-500 block">Ghi chú từ cựu sinh viên</span>
                      <span className="italic font-medium text-plum-800">{detailReq.note ? `"${detailReq.note}"` : 'Không có'}</span>
                    </div>
                    {detailReq.reviewedBy && (
                      <div>
                        <span className="text-xs text-plum-500 block">Người duyệt</span>
                        <span className="font-bold text-plum-900">{detailReq.reviewedBy}</span>
                      </div>
                    )}
                    {detailReq.reviewNote && (
                      <div>
                        <span className="text-xs text-plum-500 block">Ghi chú duyệt của Admin</span>
                        <span className="font-bold text-plum-900">{detailReq.reviewNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Xem minh chứng bằng */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">Ảnh minh chứng tốt nghiệp</h4>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-brand-100 bg-brand-50/20 max-h-80 flex items-center justify-center p-2">
                    <img
                      src={detailReq.proofUrl}
                      alt="Minh chứng"
                      className="max-h-80 w-auto object-contain cursor-pointer transition-transform hover:scale-105 rounded-lg"
                      onClick={() => setPreviewProofUrl(detailReq.proofUrl)}
                    />
                  </div>
                </div>

                {/* Nút thao tác dưới Modal chi tiết */}
                {detailReq.status === 'PENDING' && (
                  <div className="mt-6 flex justify-end gap-3 border-t border-plum-900/8 pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedReq(detailReq)
                        setReviewAction('REJECTED')
                        setReviewNote('')
                      }}
                      className="border border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    >
                      Từ chối hồ sơ
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedReq(detailReq)
                        setReviewAction('APPROVED')
                        setReviewNote('Minh chứng hợp lệ. Đã phê duyệt quyền Cựu sinh viên.')
                      }}
                      className="bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 font-bold shadow-sm"
                    >
                      Phê duyệt hồ sơ
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>,
          document.body
        )}

      {/* 2. Lightbox Xem Ảnh Minh Chứng Full-screen */}
      {previewProofUrl &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="absolute right-6 top-6 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X size={22} />
            </button>
            <div className="max-w-4xl max-h-[90vh] flex flex-col items-center">
              <img
                src={previewProofUrl}
                alt="Minh chứng tốt nghiệp full-size"
                className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl border border-white/10"
              />
            </div>
          </div>,
          document.body
        )}

      {/* 3. Modal Phê duyệt / Từ chối (Review Confirmation Modal) */}
      {selectedReq && reviewAction &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-plum-950/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <Card hover={false} className="w-full max-w-md bg-white p-6 shadow-2xl rounded-2xl border border-plum-900/10">
              <div className="flex items-center gap-2 mb-2">
                {reviewAction === 'APPROVED' ? (
                  <CheckCircle2 size={22} className="text-emerald-600" />
                ) : (
                  <AlertTriangle size={22} className="text-red-600" />
                )}
                <h3 className="text-lg font-bold text-plum-950">
                  {reviewAction === 'APPROVED' ? 'Duyệt hồ sơ cựu sinh viên' : 'Từ chối hồ sơ cựu sinh viên'}
                </h3>
              </div>

              <p className="mt-1 text-sm text-plum-600 leading-relaxed">
                {reviewAction === 'APPROVED'
                  ? `Xác nhận phê duyệt vai trò Cựu sinh viên cho `
                  : `Nhập lý do từ chối hồ sơ xác minh của `}
                <strong className="text-plum-950 font-bold">{selectedReq.fullName}</strong>.
              </p>

              {/* Template gợi ý lý do từ chối nhanh */}
              {reviewAction === 'REJECTED' && (
                <div className="mt-3 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-plum-400">Gợi ý lý do từ chối nhanh:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {REJECT_REASON_TEMPLATES.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewNote(tmpl)}
                        className="rounded-lg bg-plum-900/[0.04] px-2.5 py-1 text-[11px] font-medium text-plum-700 hover:bg-plum-900/[0.08] text-left transition-colors"
                      >
                        {tmpl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="mt-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-wider text-plum-400">
                    {reviewAction === 'APPROVED' ? 'Ghi chú duyệt (Tùy chọn)' : 'Lý do từ chối (Bắt buộc)'}
                  </span>
                  <textarea
                    required={reviewAction === 'REJECTED'}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder={
                      reviewAction === 'APPROVED'
                        ? 'Ví dụ: Minh chứng tốt nghiệp hợp lệ.'
                        : 'Lý do chi tiết cho cựu sinh viên...'
                    }
                    className="mt-1.5 h-24 w-full rounded-xl border border-plum-900/10 bg-plum-900/[0.02] p-3 text-sm text-plum-900 placeholder:text-plum-400 focus:border-gold-400/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold-400/25"
                  />
                </label>

                <div className="mt-5 flex justify-end gap-2.5">
                  <Button type="button" variant="secondary" onClick={() => setSelectedReq(null)} className="font-bold">
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className={cn(
                      'font-bold text-white shadow-sm',
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-red-600 hover:bg-red-700'
                    )}
                    disabled={reviewMutation.isPending}
                  >
                    {reviewMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {reviewAction === 'APPROVED' ? 'Phê duyệt' : 'Từ chối'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>,
          document.body
        )}
    </div>
  )
}
