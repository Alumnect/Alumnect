import { useState } from 'react'
import {
  Scale,
  Search,
  FileText,
  Eye,
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Badge, Card, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminTickets } from '../hooks/useAdmin'
import type { MentoringDisputeTicket } from '@/features/mentorship'

/**
 * Trang Quản lý Tranh chấp & Hòa giải Task dành cho Admin (UC116 - UC120).
 * Cho phép theo dõi, tìm kiếm, lọc và xem chi tiết các Dispute/Settlement Ticket cần Admin can thiệp.
 */
export function AdminMentoringTicketsPage() {
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // Custom hook lấy danh sách Tickets phân trang & bộ lọc
  const { data, isLoading, isError, error, refetch } = useAdminTickets({
    keyword: keyword || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    size: 10,
  })

  // State quản lý Modal xem chi tiết Ticket
  const [selectedTicket, setSelectedTicket] = useState<MentoringDisputeTicket | null>(null)

  const tickets = data?.content || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  const isFiltered = !!keyword || typeFilter !== 'ALL' || statusFilter !== 'ALL'

  const handleResetFilters = () => {
    setKeyword('')
    setTypeFilter('ALL')
    setStatusFilter('ALL')
    setPage(0)
  }

  const formatVND = (num?: number | null) => {
    if (num === null || num === undefined) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { text: 'Chờ tiếp nhận', tone: 'aqua' as const, icon: Clock }
      case 'IN_REVIEW':
        return { text: 'Đang xử lý', tone: 'gold' as const, icon: AlertTriangle }
      case 'RESOLVED':
        return { text: 'Đã giải quyết', tone: 'success' as const, icon: CheckCircle2 }
      case 'REJECTED':
        return { text: 'Bị từ chối', tone: 'danger' as const, icon: X }
      case 'CANCELLED':
        return { text: 'Đã hủy', tone: 'neutral' as const, icon: X }
      default:
        return { text: status, tone: 'neutral' as const, icon: Clock }
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'DISPUTE') {
      return {
        text: 'Khiếu nại / Tranh chấp',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
      }
    }
    return {
      text: 'Thỏa thuận Hòa giải',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-slate-900 leading-tight">
            Quản lý Tranh chấp & Hòa giải Task
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Theo dõi, tiếp nhận và phân xử các yêu cầu khiếu nại và thỏa thuận dừng Task trong Mentorship (UC116 - UC120).
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-2xs">
            <Scale className="h-4 w-4 text-[#F27024]" />
            <span>Phân hệ Trọng tài Task</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Search Input & Multi-Criteria Filters (UC116) */}
      <div className="flex flex-col gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm mã ticket, tiêu đề, task, email..."
                className="w-full h-9 rounded-lg border border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#F27024] focus:outline-none focus:ring-1 focus:ring-[#F27024]"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Ticket Type */}
            <div className="flex items-center gap-1.5">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(0)
                }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:border-[#F27024] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả loại Ticket</option>
                <option value="DISPUTE">Khiếu nại / Tranh chấp (DISPUTE)</option>
                <option value="SETTLEMENT">Thỏa thuận Hòa giải (SETTLEMENT)</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:border-[#F27024] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái xử lý</option>
                <option value="OPEN">Chờ tiếp nhận (OPEN)</option>
                <option value="IN_REVIEW">Đang xử lý (IN_REVIEW)</option>
                <option value="RESOLVED">Đã giải quyết (RESOLVED)</option>
                <option value="REJECTED">Bị từ chối (REJECTED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {isFiltered && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
                className="gap-1.5 text-xs text-slate-600 hover:text-slate-900 border-slate-300 h-9 shrink-0"
              >
                <RotateCcw size={12} /> Đặt lại
              </Button>
            )}
          </div>

          <div className="text-xs text-slate-500 self-end lg:self-center shrink-0">
            Tổng cộng: <strong className="text-slate-900 font-semibold">{totalElements}</strong> Tickets
          </div>
        </div>
      </div>

      {/* 3. Loading Skeleton */}
      {isLoading && (
        <Card hover={false} className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* 4. Error State */}
      {isError && (
        <Card hover={false} className="p-8 text-center border-red-200 bg-red-50/30">
          <div className="space-y-3">
            <ShieldAlert className="mx-auto h-8 w-8 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-900">Lỗi tải danh sách Ticket</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {(error as any)?.message || 'Không thể kết nối máy chủ dữ liệu Ticket.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs font-medium"
            >
              <RotateCcw size={13} /> Thử lại
            </Button>
          </div>
        </Card>
      )}

      {/* 5. Empty State */}
      {!isLoading && !isError && tickets.length === 0 && (
        <EmptyState
          icon={<Scale size={32} className="text-slate-400" />}
          title="Không tìm thấy Ticket nào"
          description={
            isFiltered
              ? 'Không có Ticket nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
              : 'Hiện không có Ticket khiếu nại hay thỏa thuận hòa giải nào cần xử lý.'
          }
        />
      )}

      {/* 6. Tickets Table */}
      {!isLoading && !isError && tickets.length > 0 && (
        <div className="space-y-4">
          <Card hover={false} className="p-0 border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50">
                    <th className="px-4 py-3.5 w-[20%]">Mã Ticket & Loại</th>
                    <th className="px-4 py-3.5 w-[25%]">Nhiệm vụ & Tiêu đề</th>
                    <th className="px-4 py-3.5 w-[20%]">Học viên / Cố vấn</th>
                    <th className="px-3 py-3.5 text-right w-[15%]">Ngân sách</th>
                    <th className="px-3 py-3.5 text-center w-[10%]">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right w-[10%]">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => {
                    const statusInfo = getStatusBadge(t.status)
                    const typeInfo = getTypeBadge(t.ticketType)
                    const StatusIcon = statusInfo.icon
                    const studentName = t.student?.fullName || t.studentName || 'Học viên'
                    const mentorName = t.mentor?.fullName || t.mentorName || 'Cố vấn'

                    return (
                      <tr key={t.id} className="transition-colors hover:bg-slate-50/70">
                        {/* Code & Type */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="font-mono font-semibold text-slate-900">{t.ticketCode}</p>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium border ${typeInfo.className}`}
                          >
                            {typeInfo.text}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">{formatDate(t.createdAt)}</p>
                        </td>

                        {/* Task Title & Ticket Title */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="font-semibold text-slate-900 line-clamp-1">{t.title}</p>
                          <p className="text-slate-500 mt-0.5 text-[11px] line-clamp-1">
                            Task: <span className="font-medium text-slate-700">{t.taskTitle || `#Task ${t.taskId}`}</span>
                          </p>
                          {t.evidences && t.evidences.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 mt-1 font-medium">
                              <FileText size={11} /> {t.evidences.length} bằng chứng đính kèm
                            </span>
                          )}
                        </td>

                        {/* Student / Mentor */}
                        <td className="px-4 py-3.5 text-xs">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="truncate">H/V: {studentName}</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span className="truncate">C/V: {mentorName}</span>
                            </p>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="px-3 py-3.5 text-right text-xs whitespace-nowrap">
                          <p className="font-semibold text-slate-900">{formatVND(t.totalAmount)}</p>
                          {t.studentRefund !== null && t.studentRefund !== undefined && Number(t.studentRefund) > 0 && (
                            <p className="text-[11px] text-blue-600">Hoàn: {formatVND(t.studentRefund)}</p>
                          )}
                          {t.mentorAmount !== null && t.mentorAmount !== undefined && Number(t.mentorAmount) > 0 && (
                            <p className="text-[11px] text-emerald-600">Thù lao: {formatVND(t.mentorAmount)}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <Badge tone={statusInfo.tone} className="px-2 py-0.5 font-medium text-[11px] inline-flex items-center gap-1">
                            <StatusIcon size={11} />
                            <span>{statusInfo.text}</span>
                          </Badge>
                          {t.handledBy ? (
                            <p className="text-[10px] text-slate-500 mt-1 truncate">
                              Phụ trách: {t.handledBy.fullName}
                            </p>
                          ) : (
                            <p className="text-[10px] text-amber-600 mt-1">Chưa phân công</p>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer"
                            title="Xem chi tiết vé khiếu nại"
                          >
                            <Eye size={13} className="text-slate-500" />
                            <span>Chi tiết</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Phân trang chuẩn */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* 7. Modal Xem Chi Tiết Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 transition-opacity"
            onClick={() => setSelectedTicket(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-semibold text-slate-900 leading-tight">
                    Chi tiết Ticket: {selectedTicket.ticketCode}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                      getTypeBadge(selectedTicket.ticketType).className
                    }`}
                  >
                    {getTypeBadge(selectedTicket.ticketType).text}
                  </span>
                </div>
                <p className="text-[12px] text-slate-500 mt-1">
                  Khởi tạo lúc: {formatDate(selectedTicket.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Status & Assignment Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <Badge tone={getStatusBadge(selectedTicket.status).tone} className="px-2.5 py-1 text-xs font-semibold">
                    {getStatusBadge(selectedTicket.status).text}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {selectedTicket.handledBy
                      ? `Phụ trách bởi Admin: ${selectedTicket.handledBy.fullName}`
                      : 'Chưa có Admin tiếp nhận xử lý'}
                  </span>
                </div>
                <span className="font-semibold text-sm text-slate-900">
                  {formatVND(selectedTicket.totalAmount)}
                </span>
              </div>

              {/* Task Reference */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-white text-xs space-y-1">
                <span className="text-slate-400 font-medium block">Nhiệm vụ liên quan:</span>
                <p className="font-semibold text-sm text-slate-900">
                  {selectedTicket.taskTitle || `#Task ID ${selectedTicket.taskId}`}
                </p>
              </div>

              {/* Dispute / Settlement Content */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500">
                  Nội dung & Yêu cầu giải quyết
                </h4>
                <div className="p-4 rounded-lg border border-slate-200 bg-white space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Tiêu đề:</span>
                    <p className="font-semibold text-slate-900 text-sm">{selectedTicket.title}</p>
                  </div>

                  {selectedTicket.disputeReason && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Lý do tranh chấp:</span>
                      <p className="font-medium text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                        {selectedTicket.disputeReason}
                      </p>
                    </div>
                  )}

                  {selectedTicket.desiredSolution && (
                    <div>
                      <span className="text-slate-400 block mb-0.5">Phương án mong muốn:</span>
                      <p className="font-medium text-slate-800 bg-amber-50 p-2 rounded border border-amber-200">
                        {selectedTicket.desiredSolution}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block mb-0.5">Mô tả chi tiết:</span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-200">
                      {selectedTicket.description || 'Không có mô tả chi tiết'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Financial Split proposal */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <DollarSign size={14} /> Phân chia tài chính đề xuất
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Thù lao cho Cố vấn:</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {formatVND(selectedTicket.mentorAmount)}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-white">
                    <span className="text-slate-400 block mb-1">Hoàn trả cho Học viên:</span>
                    <span className="font-bold text-sm text-blue-700">
                      {formatVND(selectedTicket.studentRefund)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidences List */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileText size={14} /> Tài liệu & Bằng chứng ({selectedTicket.evidences?.length || 0})
                </h4>
                {selectedTicket.evidences && selectedTicket.evidences.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTicket.evidences.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="font-semibold text-slate-900 truncate">
                            {ev.title || ev.fileName || 'Tài liệu chứng từ'}
                          </p>
                          {ev.description && (
                            <p className="text-slate-500 text-[11px] truncate mt-0.5">{ev.description}</p>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">
                            Người nộp: {ev.uploadedBy?.fullName || 'Người tham gia'} • {formatDate(ev.createdAt)}
                          </p>
                        </div>
                        <a
                          href={ev.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded bg-white border border-slate-300 text-slate-700 hover:text-[#F27024] hover:border-[#F27024] font-medium text-xs flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span>Mở xem</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic p-3 rounded border border-dashed border-slate-200 text-center">
                    Chưa có bằng chứng đính kèm nào được tải lên.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white shrink-0">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
