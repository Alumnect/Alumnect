import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Inbox, Eye, X, 
  Flag, ArrowRight, ShieldAlert
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import { useAdminReports } from '../hooks/useAdmin'
import type { AdminReportDto } from '../api/adminApi'

const REASON_LABELS: Record<string, { label: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }> = {
  SPAM: { label: 'Spam / Rác', tone: 'neutral' },
  INAPPROPRIATE: { label: 'Không phù hợp', tone: 'danger' },
  MISINFORMATION: { label: 'Sai lệch thông tin', tone: 'gold' },
  SCAM_OR_FRAUD: { label: 'Lừa đảo & Giả mạo', tone: 'danger' },
  OTHER: { label: 'Lý do khác', tone: 'neutral' },
}

export function AdminReportsQueue() {
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING')
  const [reasonFilter, setReasonFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState(0)

  // Fetch reports from backend
  const { data: reportsData, isLoading, error } = useAdminReports({
    status: statusFilter,
    reason: reasonFilter === 'ALL' ? undefined : reasonFilter,
    query: searchQuery || undefined,
    page,
    size: 10,
  })

  // Modal Detail state
  const [selectedReport, setSelectedReport] = useState<AdminReportDto | null>(null)

  useEffect(() => {
    if (selectedReport) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedReport])

  const reports = reportsData?.content || []
  const totalPages = reportsData?.totalPages || 0
  const totalElements = reportsData?.totalElements || 0

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader 
        title="Báo cáo vi phạm" 
        subtitle="Quản lý và giải quyết các báo cáo vi phạm bài viết từ cộng đồng AlumNect." 
      />

      {/* Bộ lọc và Tìm kiếm */}
      <Card hover={false} className="mb-6 p-4 border border-plum-900/10 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Tabs Trạng thái */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { key: 'PENDING', label: 'Đang chờ xử lý' },
              { key: 'RESOLVED', label: 'Đã giải quyết' },
              { key: 'DISMISSED', label: 'Đã bỏ qua' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key as any)
                  setPage(0)
                }}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer',
                  statusFilter === tab.key
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md'
                    : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ô lọc lý do & Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value)
                setPage(0)
              }}
              className="bg-brand-50 border border-brand-100 rounded-full px-3 py-1.5 text-xs font-bold text-brand-700 outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">Tất cả lý do</option>
              <option value="SPAM">Spam / Rác</option>
              <option value="INAPPROPRIATE">Nội dung không phù hợp</option>
              <option value="MISINFORMATION">Sai lệch thông tin</option>
              <option value="SCAM_OR_FRAUD">Lừa đảo & Giả mạo</option>
              <option value="OTHER">Lý do khác</option>
            </select>

            <input
              type="text"
              placeholder="Tìm kiếm tác giả, nội dung..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              className="bg-brand-50 border border-brand-100 rounded-full px-4 py-1.5 text-xs font-medium text-plum-900 placeholder-plum-300 outline-none focus:ring-2 focus:ring-brand-500/20 w-full sm:w-60"
            />
          </div>

        </div>

        <div className="text-xs text-plum-500 font-semibold mt-3 text-right">
          Tổng số: <strong className="text-plum-900 font-bold">{totalElements}</strong> báo cáo
        </div>
      </Card>

      <Reveal>
        {isLoading ? (
          <Card hover={false} className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full bg-brand-50" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4 bg-brand-50" />
                    <Skeleton className="h-3 w-1/3 bg-brand-50" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : error ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Lỗi tải danh sách báo cáo"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Không có báo cáo nào"
            description={`Không tìm thấy báo cáo nào ở trạng thái ${
              statusFilter === 'PENDING' ? 'chờ xử lý' : statusFilter === 'RESOLVED' ? 'đã giải quyết' : 'đã bỏ qua'
            }.`}
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto border border-plum-900/10 bg-white rounded-3xl">
              <table className="w-full min-w-[720px] text-sm text-left">
                <thead>
                  <tr className="border-b border-plum-900/8 text-xs uppercase tracking-wider text-plum-400 bg-plum-900/[0.02]">
                    <th className="px-5 py-3.5 font-bold">Người gửi báo cáo</th>
                    <th className="px-5 py-3.5 font-bold">Lý do</th>
                    <th className="px-5 py-3.5 font-bold">Tác giả & Nội dung bài viết</th>
                    <th className="px-5 py-3.5 font-bold text-center">Trạng thái bài</th>
                    <th className="px-5 py-3.5 font-bold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {reports.map((r) => {
                    const reasonInfo = REASON_LABELS[r.reason] || { label: r.reason, tone: 'neutral' }
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-plum-900/[0.015]">
                        {/* Người báo cáo */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={r.reporterAvatarUrl}
                              name={r.reporterName}
                              size={36}
                              className="border border-brand-200 shrink-0 animate-breathe"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-plum-950 truncate">{r.reporterName}</p>
                              <p className="text-xs text-plum-400 truncate">{r.reporterEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Lý do báo cáo */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <Badge tone={reasonInfo.tone}>{reasonInfo.label}</Badge>
                            {r.description && (
                              <p className="text-xs text-plum-500 font-medium truncate max-w-[200px]" title={r.description}>
                                {r.description}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Tác giả & Nội dung bài viết */}
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-plum-400 font-medium">Bởi:</span>
                              <span className="text-xs font-bold text-plum-900 truncate">{r.postAuthorName}</span>
                            </div>
                            <p className="text-xs text-plum-600 truncate mt-1 max-w-[240px] font-medium bg-brand-50/50 p-1.5 rounded-lg border border-brand-100/50">
                              {r.postContent}
                            </p>
                          </div>
                        </td>

                        {/* Trạng thái bài viết */}
                        <td className="px-5 py-4 text-center">
                          {r.postStatus === 'HIDDEN' ? (
                            <Badge tone="danger">Đã ẩn</Badge>
                          ) : r.postStatus === 'DELETED' ? (
                            <Badge tone="neutral">Đã xóa</Badge>
                          ) : (
                            <Badge tone="success">Công khai</Badge>
                          )}
                        </td>

                        {/* Thao tác */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedReport(r)}
                              className="inline-flex items-center gap-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-full px-3 py-1.5 border border-brand-100 transition-colors shadow-2xs hover:shadow-xs cursor-pointer hover-sheen"
                            >
                              <Eye size={12} /> Chi tiết
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="secondary"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  size="sm"
                >
                  Trước
                </Button>
                <span className="flex items-center px-4 text-xs font-bold text-plum-600">
                  Trang {page + 1} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  size="sm"
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        )}
      </Reveal>

      {/* Modal chi tiết báo cáo vi phạm (Chỉ xem chi tiết - UC70) */}
      {selectedReport && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedReport(null)}
          />

          {/* Card Modal */}
          <Card hover={false} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-plum-950/15 shadow-2xl bg-white max-h-[90vh] flex flex-col pop">
            
            {/* Header Modal */}
            <div className="relative bg-gradient-to-r from-brand-500 to-violet-500 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2 border border-white/25">
                  <Flag size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Chi tiết báo cáo vi phạm</h3>
                  <p className="text-xs text-brand-50 mt-1 font-medium">Báo cáo #{selectedReport.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="rounded-full hover:bg-white/20 p-1.5 transition-colors border border-transparent hover:border-white/10 text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              
              {/* Thông tin người báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Thông tin báo cáo
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedReport.reporterAvatarUrl}
                    name={selectedReport.reporterName}
                    size={40}
                    className="border border-brand-200"
                  />
                  <div>
                    <span className="text-xs text-plum-400 block font-medium">Người gửi báo cáo</span>
                    <span className="font-bold text-plum-900 text-sm">{selectedReport.reporterName} ({selectedReport.reporterEmail})</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs mt-2 border-t border-brand-100/50 pt-2 font-medium">
                  <div>
                    <span className="text-plum-400 block">Lý do vi phạm</span>
                    <span className="font-bold text-plum-900 text-sm">
                      {REASON_LABELS[selectedReport.reason]?.label || selectedReport.reason}
                    </span>
                  </div>
                  <div>
                    <span className="text-plum-400 block">Thời điểm gửi</span>
                    <span className="font-bold text-plum-900 text-sm">
                      {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                {selectedReport.description && (
                  <div className="bg-white p-3 rounded-xl border border-brand-100 mt-2">
                    <span className="text-xs text-plum-400 block font-medium mb-1">Mô tả chi tiết từ người gửi:</span>
                    <p className="text-xs text-plum-800 italic font-medium leading-relaxed">
                      "{selectedReport.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Thông tin bài viết bị báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Bài viết bị báo cáo (Tác giả: {selectedReport.postAuthorName})
                  </h4>
                  <a
                    href={`/admin/posts/${selectedReport.postId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-brand-500 hover:text-brand-600 inline-flex items-center gap-0.5 hover:underline"
                  >
                    Xem bài đầy đủ <ArrowRight size={10} />
                  </a>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-brand-100 space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs text-plum-800 font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedReport.postContent}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-medium border-t border-brand-100/50 pt-2">
                  <div>
                    <span className="text-plum-400 block">Tác giả bài viết</span>
                    <span className="font-bold text-plum-900">{selectedReport.postAuthorEmail}</span>
                  </div>
                  <div>
                    <span className="text-plum-400 block">Trạng thái bài viết gốc</span>
                    {selectedReport.postStatus === 'HIDDEN' ? (
                      <Badge tone="danger">Đang bị ẩn</Badge>
                    ) : selectedReport.postStatus === 'DELETED' ? (
                      <Badge tone="neutral">Đã xóa</Badge>
                    ) : (
                      <Badge tone="success">Đang công khai</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút đóng đơn giản ở giao diện Chỉ Xem Chi Tiết */}
              <div className="pt-4 border-t border-plum-900/8 flex justify-end">
                <Button
                  onClick={() => setSelectedReport(null)}
                  className="font-bold text-xs rounded-full bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-100 px-5 py-2 cursor-pointer"
                >
                  Đóng
                </Button>
              </div>

            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  )
}
