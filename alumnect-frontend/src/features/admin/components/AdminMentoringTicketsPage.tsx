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
  UserCheck,
  Loader2,
  Calendar,
  History,
  FileCheck,
  Image as ImageIcon,
  Layers,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'
import { Badge, Card, EmptyState, Pagination, Skeleton, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminTickets, useAcceptAdminTicket, useAdminDisputeContext } from '../hooks/useAdmin'
import {
  type MentoringDisputeTicket,
  type MentoringDisputeEvidence,
  MentoringTicketDiscussionThread,
} from '@/features/mentorship'
import { AdminResolveTicketModal } from './AdminResolveTicketModal'

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
  const [activeModalTab, setActiveModalTab] = useState<'evidence' | 'context' | 'ticket' | 'discussion'>('evidence')
  const [evidencePartyFilter, setEvidencePartyFilter] = useState<'ALL' | 'STUDENT' | 'MENTOR'>('ALL')
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // State quản lý Modal ra phán quyết giải quyết Ticket (UC120)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false)
  const [ticketToResolve, setTicketToResolve] = useState<MentoringDisputeTicket | null>(null)

  // Hook tra cứu toàn bộ bằng chứng và bối cảnh Task (UC118)
  const { data: disputeContext, isLoading: isLoadingContext } = useAdminDisputeContext(selectedTicket?.id ?? null)

  // Mutation tiếp nhận xử lý Ticket (UC117)
  const acceptTicketMutation = useAcceptAdminTicket()

  const handleAcceptTicket = async (ticket: MentoringDisputeTicket) => {
    try {
      const updated = await acceptTicketMutation.mutateAsync(ticket.id)
      toast.success(`Đã tiếp nhận xử lý vé ${ticket.ticketCode} thành công!`)
      if (selectedTicket && selectedTicket.id === ticket.id) {
        setSelectedTicket(updated)
      }
      refetch()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tiếp nhận vé'
      toast.error(msg)
    }
  }

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
        className: 'bg-danger-soft text-danger border-danger-border',
      }
    }
    return {
      text: 'Thỏa thuận Hòa giải',
      className: 'bg-warning-soft text-warning border-warning-border',
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-text leading-tight">
            Quản lý Tranh chấp & Hòa giải Task
          </h1>
          <p className="text-sm text-text-subtle mt-1.5">
            Theo dõi, tiếp nhận và phân xử các yêu cầu khiếu nại và thỏa thuận dừng Task trong Mentorship.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted shadow-2xs">
            <Scale className="h-4 w-4 text-primary-solid" />
            <span>Phân hệ Trọng tài Task</span>
          </div>
        </div>
      </div>

      {/* 2. Control Bar: Search Input & Multi-Criteria Filters (UC116) */}
      <div className="flex flex-col gap-3 bg-surface p-3.5 rounded-xl border border-border shadow-2xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-subtle" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm mã ticket, tiêu đề, task, email..."
                className="w-full h-9 rounded-lg border border-border-strong bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-2.5 text-text-subtle hover:text-text-muted p-0.5 cursor-pointer"
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
                className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-xs text-text-muted focus:border-primary focus:outline-none cursor-pointer"
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
                className="h-9 rounded-lg border border-border-strong bg-surface px-2.5 text-xs text-text-muted focus:border-primary focus:outline-none cursor-pointer"
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
                className="gap-1.5 text-xs text-text-muted hover:text-text border-border-strong h-9 shrink-0"
              >
                <RotateCcw size={12} /> Đặt lại
              </Button>
            )}
          </div>

          <div className="text-xs text-text-subtle self-end lg:self-center shrink-0">
            Tổng cộng: <strong className="text-text font-semibold">{totalElements}</strong> Tickets
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
        <Card hover={false} className="p-8 text-center border-danger-border bg-danger-soft">
          <div className="space-y-3">
            <ShieldAlert className="mx-auto h-8 w-8 text-danger" />
            <h3 className="text-sm font-semibold text-text">Lỗi tải danh sách Ticket</h3>
            <p className="text-xs text-text-subtle max-w-sm mx-auto">
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
          icon={<Scale size={32} className="text-text-subtle" />}
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
          <Card hover={false} className="p-0 border border-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wider text-text-subtle bg-surface-2">
                    <th className="px-4 py-3.5">Mã Ticket & Loại</th>
                    <th className="px-4 py-3.5 w-[26%]">Công việc & Tiêu đề</th>
                    <th className="px-4 py-3.5">Học viên / Cố vấn</th>
                    <th className="px-3 py-3.5 text-right">Ngân sách</th>
                    <th className="px-3 py-3.5 text-center">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((t) => {
                    const statusInfo = getStatusBadge(t.status)
                    const typeInfo = getTypeBadge(t.ticketType)
                    const StatusIcon = statusInfo.icon
                    const studentName = t.student?.fullName || t.studentName || 'Học viên'
                    const mentorName = t.mentor?.fullName || t.mentorName || 'Cố vấn'

                    return (
                      <tr key={t.id} className="transition-colors hover:bg-surface-2">
                        {/* Code & Type */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="whitespace-nowrap font-mono font-semibold text-text">{t.ticketCode}</p>
                          <span
                            className={`inline-block whitespace-nowrap mt-1 px-2 py-0.5 rounded text-xs font-medium border ${typeInfo.className}`}
                          >
                            {typeInfo.text}
                          </span>
                          <p className="text-xs text-text-subtle mt-1">{formatDate(t.createdAt)}</p>
                        </td>

                        {/* Task Title & Ticket Title */}
                        <td className="px-4 py-3.5 text-xs">
                          <p className="font-semibold text-text line-clamp-1">{t.title}</p>
                          <p className="text-text-subtle mt-0.5 text-xs line-clamp-1">
                            Task: <span className="font-medium text-text-muted">{t.taskTitle || `#Task ${t.taskId}`}</span>
                          </p>
                          {t.evidences && t.evidences.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-info mt-1 font-medium">
                              <FileText size={11} /> {t.evidences.length} bằng chứng đính kèm
                            </span>
                          )}
                        </td>

                        {/* Student / Mentor */}
                        <td className="px-4 py-3.5 text-xs">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5 text-text">
                              <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
                              <span className="truncate">H/V: {studentName}</span>
                            </p>
                            <p className="flex items-center gap-1.5 text-text">
                              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                              <span className="truncate">C/V: {mentorName}</span>
                            </p>
                          </div>
                        </td>

                        {/* Budget */}
                        <td className="px-3 py-3.5 text-right text-xs whitespace-nowrap">
                          <p className="font-semibold text-text">{formatVND(t.totalAmount)}</p>
                          {t.studentRefund !== null && t.studentRefund !== undefined && Number(t.studentRefund) > 0 && (
                            <p className="text-xs text-info">Hoàn: {formatVND(t.studentRefund)}</p>
                          )}
                          {t.mentorAmount !== null && t.mentorAmount !== undefined && Number(t.mentorAmount) > 0 && (
                            <p className="text-xs text-success">Thù lao: {formatVND(t.mentorAmount)}</p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <Badge tone={statusInfo.tone} className="px-2 py-0.5 font-medium text-xs inline-flex items-center gap-1">
                            <StatusIcon size={11} />
                            <span>{statusInfo.text}</span>
                          </Badge>
                          {t.handledBy ? (
                            <p className="text-xs text-text-subtle mt-1 truncate">
                              Phụ trách: {t.handledBy.fullName}
                            </p>
                          ) : (
                            <p className="text-xs text-warning mt-1">Chưa phân công</p>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex w-[9.5rem] flex-wrap items-center justify-end gap-1.5 ml-auto">
                            {(!t.handledBy || t.status === 'OPEN') && (
                              <button
                                type="button"
                                onClick={() => handleAcceptTicket(t)}
                                disabled={acceptTicketMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary-solid hover:bg-primary-hover text-on-primary text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                                title="Tiếp nhận xử lý vé này"
                              >
                                {acceptTicketMutation.isPending ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <UserCheck size={13} />
                                )}
                                <span>Tiếp nhận</span>
                              </button>
                            )}
                            {t.status !== 'RESOLVED' && t.status !== 'REJECTED' && t.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTicketToResolve(t)
                                  setIsResolveModalOpen(true)
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-info hover:opacity-90 text-text-inverse text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                                title="Ban hành phán quyết giải quyết Ticket"
                              >
                                <Scale size={13} />
                                <span>Giải quyết</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedTicket(t)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted hover:bg-surface-2 hover:border-border-strong transition-colors cursor-pointer"
                              title="Xem chi tiết vé khiếu nại"
                            >
                              <Eye size={13} className="text-text-subtle" />
                              <span>Chi tiết</span>
                            </button>
                          </div>
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

      {/* 7. Modal Xem Bằng Chứng & Bối Cảnh Toàn Diện Của Task (UC118) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTicket(null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-4xl max-h-[92vh] bg-surface rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-text animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 pt-5 pb-3 border-b border-border bg-surface shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text-subtle bg-surface-2 px-2 py-0.5 rounded">
                      {selectedTicket.ticketCode}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        getTypeBadge(selectedTicket.ticketType).className
                      }`}
                    >
                      {getTypeBadge(selectedTicket.ticketType).text}
                    </span>
                    <Badge tone={getStatusBadge(selectedTicket.status).tone} className="px-2 py-0.5 text-xs font-semibold">
                      {getStatusBadge(selectedTicket.status).text}
                    </Badge>
                  </div>
                  <h2 className="text-[17px] font-bold text-text mt-1 truncate">
                    {selectedTicket.title}
                  </h2>
                  <p className="text-[12px] text-text-subtle flex items-center gap-2 mt-0.5">
                    <span>Nhiệm vụ: <strong className="text-text-muted">{selectedTicket.taskTitle || `#Task ${selectedTicket.taskId}`}</strong></span>
                    <span>•</span>
                    <span>Tạo lúc: {formatDate(selectedTicket.createdAt)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="p-1.5 text-text-subtle hover:text-text-muted hover:bg-surface-2 rounded-lg transition-colors cursor-pointer shrink-0"
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs Navigation (UC118) */}
              <div className="flex items-center gap-1 border-b border-border -mb-3 mt-4 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('evidence')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'evidence'
                      ? 'border-primary-solid text-primary-solid'
                      : 'border-transparent text-text-subtle hover:text-text'
                  }`}
                >
                  <FileText size={14} />
                  <span>Bằng chứng tranh chấp</span>
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-primary-soft text-primary-solid">
                    {disputeContext?.evidences?.length ?? selectedTicket.evidences?.length ?? 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('context')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'context'
                      ? 'border-primary-solid text-primary-solid'
                      : 'border-transparent text-text-subtle hover:text-text'
                  }`}
                >
                  <History size={14} />
                  <span>Bối cảnh & Lịch sử Task</span>
                  {disputeContext?.extensionHistory && disputeContext.extensionHistory.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-xs font-bold bg-surface-2 text-text-muted">
                      {disputeContext.extensionHistory.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('ticket')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'ticket'
                      ? 'border-primary-solid text-primary-solid'
                      : 'border-transparent text-text-subtle hover:text-text'
                  }`}
                >
                  <DollarSign size={14} />
                  <span>Yêu cầu & Tài chính</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('discussion')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                    activeModalTab === 'discussion'
                      ? 'border-primary-solid text-primary-solid font-bold'
                      : 'border-transparent text-text-subtle hover:text-text'
                  }`}
                >
                  <MessageSquare size={14} />
                  <span>Trao đổi & Hòa giải</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface-2">
              {isLoadingContext ? (
                <div className="space-y-3 py-6">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {/* TAB 1: BẰNG CHỨNG TRANH CHẤP (UC118) */}
                  {activeModalTab === 'evidence' && (
                    <div className="space-y-4">
                      {/* Filter Bằng chứng theo bên nộp */}
                      <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-text-subtle">Lọc theo người nộp:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('ALL')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                                evidencePartyFilter === 'ALL'
                                  ? 'bg-text text-text-inverse'
                                  : 'bg-surface-2 text-text-muted hover:bg-surface-3'
                              }`}
                            >
                              Tất cả ({disputeContext?.evidences?.length ?? 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('STUDENT')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                                evidencePartyFilter === 'STUDENT'
                                  ? 'bg-info text-text-inverse'
                                  : 'bg-info-soft text-info hover:bg-info-border/60'
                              }`}
                            >
                              Học viên ({disputeContext?.studentEvidenceCount ?? 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('MENTOR')}
                              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                                evidencePartyFilter === 'MENTOR'
                                  ? 'bg-success text-text-inverse'
                                  : 'bg-success-soft text-success hover:bg-success-border/60'
                              }`}
                            >
                              Cố vấn ({disputeContext?.mentorEvidenceCount ?? 0})
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-text-subtle">
                          * Bằng chứng đối chiếu theo UC118
                        </div>
                      </div>

                      {/* Evidence List */}
                      {(() => {
                        const allEvidences: MentoringDisputeEvidence[] = disputeContext?.evidences ?? (selectedTicket.evidences as unknown as MentoringDisputeEvidence[]) ?? []
                        const filtered = allEvidences.filter((ev) => {
                          const isStudentEv = ev.uploaderRole === 'STUDENT' || ev.uploaderId === selectedTicket.student?.id || ev.uploadedBy?.id === selectedTicket.student?.id
                          const isMentorEv = ev.uploaderRole === 'MENTOR' || ev.uploaderId === selectedTicket.mentor?.id || ev.uploadedBy?.id === selectedTicket.mentor?.id
                          if (evidencePartyFilter === 'STUDENT') {
                            return isStudentEv
                          }
                          if (evidencePartyFilter === 'MENTOR') {
                            return isMentorEv
                          }
                          return true
                        })

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 text-center bg-surface rounded-xl border border-dashed border-border-strong">
                              <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                              <p className="text-sm font-semibold text-text-muted">Chưa có tài liệu/bằng chứng nào</p>
                              <p className="text-xs text-text-subtle mt-1">
                                {evidencePartyFilter === 'ALL'
                                  ? 'Hai bên chưa tải lên bằng chứng chứng từ nào cho Ticket này.'
                                  : `Không có bằng chứng nào từ ${evidencePartyFilter === 'STUDENT' ? 'Học viên' : 'Cố vấn'}.`}
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {filtered.map((ev) => {
                              const isStudent = ev.uploaderRole === 'STUDENT' || ev.uploaderId === selectedTicket.student?.id || ev.uploadedBy?.id === selectedTicket.student?.id
                              const isImage = (ev.fileType?.startsWith('image') ?? false) || /\.(png|jpe?g|webp|gif)$/i.test(ev.fileUrl)
                              const uploaderName = ev.uploaderName || ev.uploadedBy?.fullName || (isStudent ? selectedTicket.student?.fullName : selectedTicket.mentor?.fullName) || 'Người tham gia'

                              return (
                                <div
                                  key={ev.id}
                                  className="p-4 rounded-xl border border-border bg-surface hover:border-border-strong shadow-2xs flex flex-col justify-between transition-all"
                                >
                                  <div>
                                    {/* Header card: Người nộp */}
                                    <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                                          isStudent ? 'bg-info' : 'bg-success'
                                        }`}>
                                          {isStudent ? 'HV' : 'CV'}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="text-xs font-bold text-text truncate">
                                            {uploaderName}
                                          </p>
                                          <p className="text-xs text-text-subtle truncate">
                                            {isStudent ? 'Học viên' : 'Cố vấn'} • {formatDate(ev.createdAt)}
                                          </p>
                                        </div>
                                      </div>

                                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        isStudent
                                          ? 'bg-info-soft text-info border-info-border'
                                          : 'bg-success-soft text-success border-success-border'
                                      }`}>
                                        {isStudent ? 'Bên khiếu nại' : 'Bên giải trình'}
                                      </span>
                                    </div>

                                    {/* Preview nếu là hình ảnh */}
                                    {isImage && (
                                      <div
                                        className="relative h-32 w-full rounded-lg bg-surface-2 mb-2.5 overflow-hidden group cursor-pointer border border-border"
                                        onClick={() => setPreviewImage(ev.fileUrl)}
                                        title="Nhấn để phóng to ảnh"
                                      >
                                        <img
                                          src={ev.fileUrl}
                                          alt={ev.title || 'Evidence image'}
                                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity gap-1">
                                          <Eye size={14} />
                                          <span>Phóng to xem</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* Content info */}
                                    <div className="space-y-1">
                                      <h4 className="font-bold text-sm text-text leading-snug">
                                        {ev.title || ev.fileName || 'Tài liệu minh chứng'}
                                      </h4>
                                      {ev.description && (
                                        <p className="text-xs text-text-muted bg-surface-2 p-2 rounded-lg border border-border leading-relaxed whitespace-pre-wrap">
                                          {ev.description}
                                        </p>
                                      )}
                                      {ev.fileName && (
                                        <p className="text-xs text-text-subtle font-mono truncate">
                                          Tệp: {ev.fileName}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action button */}
                                  <div className="pt-3 mt-3 border-t border-border flex items-center justify-end gap-2">
                                    {isImage && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(ev.fileUrl)}
                                        className="px-2.5 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 text-text-muted text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        <ImageIcon size={13} />
                                        <span>Xem ảnh</span>
                                      </button>
                                    )}
                                    <a
                                      href={ev.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1.5 rounded-lg bg-text hover:opacity-90 text-text-inverse text-xs font-medium inline-flex items-center gap-1 transition-colors"
                                    >
                                      <span>Mở xem tệp gốc</span>
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* TAB 2: BỐI CẢNH & LỊCH SỬ TASK (UC118) */}
                  {activeModalTab === 'context' && (
                    <div className="space-y-5">
                      {/* 1. Thỏa thuận Deal gốc & Quỹ Escrow */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                            <Layers size={14} className="text-primary-solid" />
                            Thỏa thuận Deal ban đầu & Quỹ ký quỹ
                          </h4>
                          <span className="text-xs text-text-subtle">
                            Deal ID: #{disputeContext?.dealId || selectedTicket.taskId}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-surface-2 rounded-lg border border-border">
                            <span className="text-text-subtle block mb-0.5">Giá thỏa thuận Deal:</span>
                            <span className="font-bold text-sm text-text">
                              {formatVND(disputeContext?.dealPrice || selectedTicket.totalAmount)}
                            </span>
                          </div>

                          <div className="p-3 bg-success-soft rounded-lg border border-success-border">
                            <span className="text-success font-medium block mb-0.5">Quỹ Escrow đang giữ:</span>
                            <span className="font-bold text-sm text-success">
                              {formatVND(disputeContext?.totalEscrowAmount || selectedTicket.totalAmount)}
                            </span>
                          </div>

                          <div className="p-3 bg-surface-2 rounded-lg border border-border">
                            <span className="text-text-subtle block mb-0.5">Thời điểm chốt Deal:</span>
                            <span className="font-semibold text-text">
                              {formatDate(disputeContext?.dealConfirmedAt || disputeContext?.startedAt)}
                            </span>
                          </div>
                        </div>

                        {disputeContext?.taskScope && (
                          <div className="text-xs">
                            <span className="text-text-subtle block mb-1">Phạm vi công việc đã chốt (Task Scope):</span>
                            <p className="p-2.5 bg-surface-2 rounded-lg border border-border text-text-muted whitespace-pre-wrap leading-relaxed">
                              {disputeContext.taskScope}
                            </p>
                          </div>
                        )}

                        {disputeContext?.expectedResult && (
                          <div className="text-xs">
                            <span className="text-text-subtle block mb-1">Kết quả kỳ vọng đầu ra (Expected Deliverable):</span>
                            <p className="p-2.5 bg-warning-soft rounded-lg border border-warning-border text-text whitespace-pre-wrap leading-relaxed">
                              {disputeContext.expectedResult}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 2. Timeline & Lịch sử Gia hạn Deadline (UC109) */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                            <Calendar size={14} className="text-info" />
                            Timeline & Hạn chót nhiệm vụ
                          </h4>
                          {disputeContext?.isOverdue && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-danger-soft text-danger border border-danger-border">
                              ĐÃ QUÁ HẠN DEADLINE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-2.5 bg-surface-2 rounded-lg border border-border">
                            <span className="text-text-subtle block mb-0.5">Ngày kích hoạt:</span>
                            <span className="font-semibold text-text">
                              {formatDate(disputeContext?.startedAt)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-surface-2 rounded-lg border border-border">
                            <span className="text-text-subtle block mb-0.5">Hạn chót ban đầu:</span>
                            <span className="font-semibold text-text">
                              {formatDate(disputeContext?.originalDeadline)}
                            </span>
                          </div>

                          <div className="p-2.5 bg-info-soft rounded-lg border border-info-border">
                            <span className="text-info font-medium block mb-0.5">Hạn chót sau gia hạn:</span>
                            <span className="font-bold text-info">
                              {formatDate(disputeContext?.currentDeadline)}
                            </span>
                          </div>
                        </div>

                        {/* Extension History List */}
                        <div className="pt-2">
                          <span className="text-xs font-semibold text-text-muted block mb-2">
                            Lịch sử các lần gia hạn deadline ({disputeContext?.extensionHistory?.length || 0}):
                          </span>
                          {disputeContext?.extensionHistory && disputeContext.extensionHistory.length > 0 ? (
                            <div className="space-y-2">
                              {disputeContext.extensionHistory.map((ext) => (
                                <div
                                  key={ext.id}
                                  className="p-3 bg-surface-2 rounded-lg border border-border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-text">{ext.createdByName}</span>
                                      <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-surface-3 text-text-muted">
                                        {ext.createdByRole}
                                      </span>
                                      <span className="text-text-subtle">• {formatDate(ext.createdAt)}</span>
                                    </div>
                                    <p className="text-text-muted mt-1">Lý do: {ext.reason}</p>
                                    <div className="flex items-center gap-1.5 text-text-subtle mt-1 font-mono text-xs">
                                      <span>{formatDate(ext.currentDeadline)}</span>
                                      <ArrowRight size={11} className="text-text-subtle" />
                                      <span className="text-info font-bold">{formatDate(ext.proposedDeadline)}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                      ext.status === 'CONFIRMED'
                                        ? 'bg-success-soft text-success border-success-border'
                                        : ext.status === 'REJECTED'
                                        ? 'bg-danger-soft text-danger border-danger-border'
                                        : 'bg-warning-soft text-warning border-warning-border'
                                    }`}>
                                      {ext.status === 'CONFIRMED' ? 'Đã chấp nhận' : ext.status === 'REJECTED' ? 'Bị từ chối' : 'Chờ phản hồi'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-text-subtle italic p-2.5 rounded bg-surface-2 border border-border">
                              Task này chưa từng yêu cầu gia hạn deadline.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 3. Nhật ký công việc đã được nghiệm thu (Confirmed Work Logs) */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-border pb-2.5">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                            <FileCheck size={14} className="text-success" />
                            Nhật ký công việc đã được Học viên nghiệm thu ({disputeContext?.totalConfirmedLogs || 0})
                          </h4>
                          <span className="text-xs text-text-subtle">
                            Căn cứ đánh giá mức độ hoàn thành
                          </span>
                        </div>

                        {disputeContext?.confirmedWorkLogs && disputeContext.confirmedWorkLogs.length > 0 ? (
                          <div className="space-y-2">
                            {disputeContext.confirmedWorkLogs.map((wl) => (
                              <div
                                key={wl.id}
                                className="p-3 bg-success-soft rounded-lg border border-success-border text-xs space-y-1.5"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-text">
                                    Ngày làm: {wl.logDate ? String(wl.logDate) : formatDate(wl.createdAt)}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-success-soft text-success">
                                    Đã nghiệm thu
                                  </span>
                                </div>
                                <p className="text-text-muted">{wl.description}</p>
                                {wl.workCompleted && (
                                  <p className="text-text-muted">
                                    <strong>Hoàn thành:</strong> {wl.workCompleted}
                                  </p>
                                )}
                                {wl.result && (
                                  <p className="text-success">
                                    <strong>Kết quả:</strong> {wl.result}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-subtle italic p-3 rounded bg-surface-2 border border-border">
                            Chưa có Work Log nào được Học viên nghiệm thu (CONFIRMED).
                          </p>
                        )}
                      </div>

                      {/* 4. Lần submit deliverable nghiệm thu cuối cùng (nếu có) */}
                      {disputeContext?.latestCompletionSubmission && (
                        <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-primary-solid" />
                            Bàn giao kết quả hoàn thành từ Cố vấn (Submit Completion)
                          </h4>
                          <div className="p-3 bg-primary-soft rounded-lg border border-primary-soft-border text-xs space-y-2">
                            <p className="text-text">
                              <strong>Tóm tắt:</strong> {disputeContext.latestCompletionSubmission.finalSummary}
                            </p>
                            {disputeContext.latestCompletionSubmission.deliverables && (
                              <p className="text-text-muted">
                                <strong>Sản phẩm bàn giao:</strong> {disputeContext.latestCompletionSubmission.deliverables}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: THÔNG TIN YÊU CẦU & PHÂN BỔ TÀI CHÍNH */}
                  {activeModalTab === 'ticket' && (
                    <div className="space-y-4">
                      {/* Dispute Details */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3 text-xs">
                        <div>
                          <span className="text-text-subtle block mb-0.5">Tiêu đề yêu cầu:</span>
                          <p className="font-bold text-text text-sm">{selectedTicket.title}</p>
                        </div>

                        {selectedTicket.disputeReason && (
                          <div>
                            <span className="text-text-subtle block mb-0.5">Lý do khiếu nại (Dispute Reason):</span>
                            <p className="font-medium text-danger bg-danger-soft p-2.5 rounded-lg border border-danger-border">
                              {selectedTicket.disputeReason}
                            </p>
                          </div>
                        )}

                        {selectedTicket.desiredSolution && (
                          <div>
                            <span className="text-text-subtle block mb-0.5">Phương án mong muốn của người tạo:</span>
                            <p className="font-medium text-text bg-warning-soft p-2.5 rounded-lg border border-warning-border">
                              {selectedTicket.desiredSolution}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="text-text-subtle block mb-0.5">Mô tả chi tiết:</span>
                          <p className="text-text-muted leading-relaxed whitespace-pre-wrap bg-surface-2 p-3 rounded-lg border border-border">
                            {selectedTicket.description || 'Không có mô tả chi tiết'}
                          </p>
                        </div>
                      </div>

                      {/* Financial Split Proposal */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle flex items-center gap-1.5">
                          <DollarSign size={14} className="text-success" />
                          Phương án phân chia tài chính đề xuất
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl border border-success-border bg-success-soft">
                            <span className="text-success font-medium block mb-1">Thù lao cho Cố vấn:</span>
                            <span className="font-extrabold text-base text-success">
                              {formatVND(selectedTicket.mentorAmount)}
                            </span>
                            <p className="text-xs text-text-subtle mt-1">Cố vấn: {selectedTicket.mentor?.fullName}</p>
                          </div>

                          <div className="p-3.5 rounded-xl border border-info-border bg-info-soft">
                            <span className="text-info font-medium block mb-1">Hoàn trả cho Học viên:</span>
                            <span className="font-extrabold text-base text-info">
                              {formatVND(selectedTicket.studentRefund)}
                            </span>
                            <p className="text-xs text-text-subtle mt-1">Học viên: {selectedTicket.student?.fullName}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-surface-2 rounded-lg border border-border text-xs flex items-center justify-between">
                          <span className="text-text-subtle font-medium">Tổng ngân sách giải quyết:</span>
                          <span className="font-bold text-text text-sm">
                            {formatVND(selectedTicket.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Handling Admin Info */}
                      <div className="bg-surface p-4 rounded-xl border border-border shadow-2xs text-xs space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
                          Tiến trình thụ lý của Quản trị viên
                        </h4>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-border">
                          <div>
                            <span className="text-text-subtle block mb-0.5">Admin phụ trách:</span>
                            <span className="font-bold text-text">
                              {selectedTicket.handledBy?.fullName || 'Chưa phân công'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-text-subtle block mb-0.5">Thời điểm tiếp nhận:</span>
                            <span className="font-semibold text-text-muted">
                              {formatDate(selectedTicket.acceptedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: KÊNH TRAO ĐỔI & HÒA GIẢI 3 BÊN (UC119) */}
                  {activeModalTab === 'discussion' && (
                    <MentoringTicketDiscussionThread
                      ticketId={selectedTicket.id}
                      ticketStatus={selectedTicket.status}
                      currentRole="ADMIN"
                      studentName={selectedTicket.student?.fullName || selectedTicket.studentName}
                      mentorName={selectedTicket.mentor?.fullName || selectedTicket.mentorName}
                      totalAmount={selectedTicket.totalAmount}
                    />
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-surface shrink-0">
              <div>
                {(!selectedTicket.handledBy || selectedTicket.status === 'OPEN') ? (
                  <span className="text-xs text-warning font-medium inline-flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Vé đang chờ Quản trị viên tiếp nhận xử lý
                  </span>
                ) : (
                  <span className="text-xs text-text-subtle">
                    Phụ trách: <strong className="text-text">{selectedTicket.handledBy.fullName}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(!selectedTicket.handledBy || selectedTicket.status === 'OPEN') && (
                  <button
                    type="button"
                    onClick={() => handleAcceptTicket(selectedTicket)}
                    disabled={acceptTicketMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-solid hover:bg-primary-hover text-on-primary font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    {acceptTicketMutation.isPending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <UserCheck size={15} />
                    )}
                    <span>Tiếp nhận xử lý</span>
                  </button>
                )}
                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'REJECTED' && selectedTicket.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setTicketToResolve(selectedTicket)
                      setIsResolveModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-solid hover:bg-primary-hover text-on-primary font-medium text-sm transition-colors cursor-pointer shadow-2xs"
                  >
                    <Scale size={15} />
                    <span>Ra phán quyết</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 text-sm font-medium text-text-muted bg-surface border border-border-strong hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Hình Ảnh Bằng Chứng (UC118) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-transparent">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Đóng ảnh"
            >
              <X size={24} />
            </button>
            <img
              src={previewImage}
              alt="Bằng chứng tranh chấp phóng to"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* 8. Modal Ra Phán Quyết Giải Quyết Ticket (UC120) */}
      <AdminResolveTicketModal
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false)
          setTicketToResolve(null)
          refetch()
        }}
        ticket={ticketToResolve}
        totalEscrowAmount={disputeContext?.totalEscrowAmount}
      />
    </div>
  )
}

