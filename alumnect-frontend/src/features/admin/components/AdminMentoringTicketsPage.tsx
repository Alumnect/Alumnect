import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { useState, useMemo } from 'react'
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
  UserCheck,
  Loader2,
  History,
  Image as ImageIcon,
  Layers,
  MessageSquare,
} from 'lucide-react'
import { EmptyState, Pagination, Skeleton, SelectDropdown, toast, DialogFrame, FadeSwitch } from '@/components/ui'
import { useAdminTickets, useAcceptAdminTicket, useAdminDisputeContext } from '../hooks/useAdmin'
import {
  type MentoringDisputeTicket,
  type MentoringDisputeEvidence,
  MentoringTicketDiscussionThread,
} from '@/features/mentorship'
import { AdminResolveTicketModal } from './AdminResolveTicketModal'
import { cn } from '@/lib/utils'
import { AdminPageBanner, StatTile, panelClass } from './AdminVisuals'
import { fmtCount } from './adminFormat'

/**
 * Trang Quản lý Tranh chấp & Hòa giải Task dành cho Admin (UC116 - UC120).
 * Thiết kế phong cách shadcn-admin / square-ui với tone cam - đen - trắng hiện đại,
 * bộ 4 thẻ KPI chỉ số, bảng 4 cột tích hợp (không cuộn ngang) và tải trực tiếp dữ liệu từ Database backend.
 */
export function AdminMentoringTicketsPage() {
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // Custom hook lấy danh sách Tickets phân trang & bộ lọc từ Database Backend (API /admin/mentoring/tickets)
  const { data, isLoading, isError, refetch } = useAdminTickets({
    keyword: keyword || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    page,
    size: 10,
  })

  const tickets = useMemo(() => data?.content || [], [data])
  const totalElements = data?.totalElements || 0
  const totalPages = data?.totalPages || 0

  // Số liệu toàn hệ thống theo trạng thái (không phụ thuộc trang/bộ lọc đang xem)
  const { data: allTicketsPage } = useAdminTickets({ page: 0, size: 1 })
  const { data: openTicketsPage } = useAdminTickets({ status: 'OPEN', page: 0, size: 1 })
  const { data: inReviewTicketsPage } = useAdminTickets({ status: 'IN_REVIEW', page: 0, size: 1 })
  const { data: resolvedTicketsPage } = useAdminTickets({ status: 'RESOLVED', page: 0, size: 1 })
  const openTickets = openTicketsPage?.totalElements ?? 0

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
      toast.error(err?.response?.data?.message || `Không thể tiếp nhận vé ${ticket.ticketCode}`)
    }
  }

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
        return {
          text: 'Chờ tiếp nhận',
          tone: 'aqua' as const,
          icon: Clock,
          className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60',
        }
      case 'IN_REVIEW':
        return {
          text: 'Đang xử lý',
          tone: 'gold' as const,
          icon: AlertTriangle,
          className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
        }
      case 'RESOLVED':
        return {
          text: 'Đã giải quyết',
          tone: 'success' as const,
          icon: CheckCircle2,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
        }
      case 'REJECTED':
        return {
          text: 'Bị từ chối',
          tone: 'danger' as const,
          icon: X,
          className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
        }
      case 'CANCELLED':
        return {
          text: 'Đã hủy',
          tone: 'neutral' as const,
          icon: X,
          className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        }
      default:
        return {
          text: status,
          tone: 'neutral' as const,
          icon: Clock,
          className: 'bg-surface-2 text-text-muted border-border',
        }
    }
  }

  const getTypeBadge = (type: string) => {
    if (type === 'DISPUTE') {
      return {
        text: 'Khiếu nại / Tranh chấp',
        className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60',
      }
    }
    return {
      text: 'Thỏa thuận Hòa giải',
      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* 1. Dải đầu trang */}
      <AdminPageBanner
        title="Tranh chấp & hòa giải"
        scene="disputes"
      />

      {/* 2. Số liệu theo trạng thái — bấm để lọc */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {(
          [
            { key: 'ALL', label: 'Tổng số ticket', value: allTicketsPage?.totalElements, icon: <Layers />, tone: 'slate', hint: undefined },
            { key: 'OPEN', label: 'Chờ tiếp nhận', value: openTicketsPage?.totalElements, icon: <Clock />, tone: 'red', hint: openTickets > 0 ? 'Cần tiếp nhận' : undefined },
            { key: 'IN_REVIEW', label: 'Đang hòa giải', value: inReviewTicketsPage?.totalElements, icon: <UserCheck />, tone: 'amber', hint: undefined },
            { key: 'RESOLVED', label: 'Đã phân xử', value: resolvedTicketsPage?.totalElements, icon: <CheckCircle2 />, tone: 'green', hint: undefined },
          ] as const
        ).map((tile) => (
          <StatTile
            key={tile.key}
            icon={tile.icon}
            tone={tile.tone}
            label={tile.label}
            value={fmtCount(tile.value)}
            hint={tile.hint}
            active={statusFilter === tile.key}
            onClick={() => {
              setStatusFilter(tile.key)
              setPage(0)
            }}
          />
        ))}
      </div>
      {/* 3. BẢNG DUY NHẤT (Single Unified Card Container) */}
      <div className={panelClass}>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border p-5 bg-surface">
          <h2 className="text-base font-semibold text-text">Danh sách ticket</h2>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-semibold text-text-subtle mr-2 hidden sm:inline">
              Hiển thị <strong className="text-text font-bold">{tickets.length}</strong> / <strong>{totalElements}</strong> Tickets
            </span>
          </div>
        </div>

        {/* Toolbar: Tìm kiếm & Bộ lọc Dropdowns */}
        <div className="border-b border-border bg-surface-2/40 p-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-subtle" />
              <input
                aria-label="Tìm mã ticket, tiêu đề, task, email..."
                type="text"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm mã ticket, tiêu đề, task, học viên, cố vấn..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer p-0.5"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter by Ticket Type */}
            <SelectDropdown
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(String(val))
                setPage(0)
              }}
              options={[
                { value: 'ALL', label: 'Tất cả loại Ticket' },
                { value: 'DISPUTE', label: 'Khiếu nại / Tranh chấp (DISPUTE)' },
                { value: 'SETTLEMENT', label: 'Thỏa thuận Hòa giải (SETTLEMENT)' },
              ]}
              placeholder="Tất cả loại Ticket"
              className="w-full sm:w-56"
              buttonClassName="h-10 text-xs rounded-xl shadow-2xs"
            />

            {/* Filter by Status */}
            <SelectDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(String(val))
                setPage(0)
              }}
              options={[
                { value: 'ALL', label: 'Tất cả trạng thái xử lý' },
                { value: 'OPEN', label: 'Chờ tiếp nhận (OPEN)' },
                { value: 'IN_REVIEW', label: 'Đang xử lý (IN_REVIEW)' },
                { value: 'RESOLVED', label: 'Đã giải quyết (RESOLVED)' },
                { value: 'REJECTED', label: 'Bị từ chối (REJECTED)' },
                { value: 'CANCELLED', label: 'Đã hủy (CANCELLED)' },
              ]}
              placeholder="Tất cả trạng thái xử lý"
              className="w-full sm:w-56"
              buttonClassName="h-10 text-xs rounded-xl shadow-2xs"
            />

            {/* Reset Filters */}
            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-text-muted hover:border-danger hover:bg-danger-soft hover:text-danger transition cursor-pointer shrink-0"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl bg-primary-soft" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-primary-soft" />
                  <Skeleton className="h-3 w-1/3 bg-primary-soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-4 text-center bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-200 font-semibold flex items-center justify-between">
            <span>Máy chủ đang bảo trì, hiển thị dữ liệu mẫu để bạn thử nghiệm chức năng phân xử.</span>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-surface text-xs font-bold text-amber-900 dark:text-amber-100 hover:bg-surface-2 transition cursor-pointer"
            >
              Thử kết nối lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && tickets.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<Scale size={32} className="text-text-subtle" />}
              title="Không tìm thấy Ticket nào"
              description={
                isFiltered
                  ? 'Không có Ticket nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
                  : 'Hiện không có Ticket khiếu nại hay thỏa thuận hòa giải nào cần xử lý.'
              }
            />
          </div>
        )}

        {/* Bảng Ticket 4 Cột Compound - Không thanh cuộn ngang */}
        {!isLoading && tickets.length > 0 && (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs text-text-subtle bg-surface-2/60">
                  <th className="px-4 py-3 sm:px-5 font-bold w-[25%]">Mã Ticket & Phân loại</th>
                  <th className="px-4 py-3 sm:px-5 font-bold w-[38%]">Nhiệm vụ & Các bên tham gia</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-center w-[20%]">Ngân sách & Trạng thái</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-right w-[17%]">Thao tác</th>
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
                    <tr key={t.id} className="transition-colors hover:bg-surface-2/50">
                      {/* Cột 1: Mã Ticket & Loại */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="space-y-1">
                          <span className="tabular-nums font-bold text-xs text-text bg-surface-2 px-2 py-0.5 rounded-md border border-border/80 shadow-2xs inline-block">
                            {t.ticketCode}
                          </span>
                          <span
                            className={cn(
                              'inline-block px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs whitespace-nowrap block mt-1 w-fit',
                              typeInfo.className
                            )}
                          >
                            {typeInfo.text}
                          </span>
                          <p className="text-xs text-text-subtle pt-0.5">{formatDate(t.createdAt)}</p>
                        </div>
                      </td>

                      {/* Cột 2: Nhiệm vụ & Tiêu đề & Học viên/Cố vấn */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-text leading-tight line-clamp-1" title={t.title}>
                            {t.title}
                          </p>
                          <p className="text-xs text-text-muted font-medium line-clamp-1">
                            Nhiệm vụ: <strong className="text-text font-bold">{t.taskTitle || `#Task ${t.taskId}`}</strong>
                          </p>

                          {/* Học viên & Cố vấn */}
                          <div className="flex flex-col gap-0.5 pt-1 text-xs text-text-subtle">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 shrink-0" />
                              <span>Học viên: <strong className="text-text font-semibold">{studentName}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>Cố vấn: <strong className="text-text font-semibold">{mentorName}</strong></span>
                            </div>
                          </div>

                          {t.evidences && t.evidences.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400 font-bold mt-1 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-900/60 shadow-2xs">
                              <FileText size={10} /> {t.evidences.length} bằng chứng đính kèm
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Cột 3: Ngân sách & Trạng thái */}
                      <td className="px-4 py-3.5 sm:px-5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          {/* Tổng tiền ký quỹ */}
                          <span className="font-bold text-sm text-text tracking-tight">
                            {formatVND(t.totalAmount)}
                          </span>

                          {/* Đề xuất hoàn / thù lao nếu có */}
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle flex-wrap justify-center">
                            {t.studentRefund !== null && t.studentRefund !== undefined && Number(t.studentRefund) > 0 && (
                              <span className="text-sky-600 dark:text-sky-400">Hoàn: {formatVND(t.studentRefund)}</span>
                            )}
                            {t.mentorAmount !== null && t.mentorAmount !== undefined && Number(t.mentorAmount) > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">Thù lao: {formatVND(t.mentorAmount)}</span>
                            )}
                          </div>

                          {/* Trạng thái Badge */}
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-2xs mt-0.5 whitespace-nowrap',
                              statusInfo.className
                            )}
                          >
                            <StatusIcon size={10} />
                            <span>{statusInfo.text}</span>
                          </span>

                          {/* Cán bộ phụ trách */}
                          <p className="text-xs text-text-subtle truncate max-w-[140px] pt-0.5">
                            {t.handledByName ? `Phụ trách: ${t.handledByName}` : 'Chưa phân công'}
                          </p>
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="px-4 py-3.5 sm:px-5 text-right whitespace-nowrap">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                          {/* Nút Tiếp nhận (chỉ khi OPEN) */}
                          {(!t.handledByName || t.status === 'OPEN') && (
                            <button
                              type="button"
                              onClick={() => handleAcceptTicket(t)}
                              disabled={acceptTicketMutation.isPending}
                              className="inline-flex items-center gap-1 rounded-xl bg-primary-solid hover:bg-primary-solid/90 text-on-primary text-xs font-bold px-2.5 py-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                              title="Tiếp nhận thụ lý vé này"
                            >
                              {acceptTicketMutation.isPending ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <UserCheck size={12} />
                              )}
                              <span>Tiếp nhận</span>
                            </button>
                          )}

                          {/* Nút Phán quyết (khi chưa giải quyết) */}
                          {t.status !== 'RESOLVED' && t.status !== 'REJECTED' && t.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setTicketToResolve(t)
                                setIsResolveModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-2.5 py-1.5 transition cursor-pointer shadow-2xs"
                              title="Ban hành phán quyết trọng tài"
                            >
                              <Scale size={12} />
                              <span>Phán quyết</span>
                            </button>
                          )}

                          {/* Nút Chi tiết */}
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            className="inline-flex items-center gap-1 rounded-xl border border-primary-soft-border bg-primary-soft text-primary-solid hover:bg-primary-soft/80 text-xs font-bold px-2.5 py-1.5 transition cursor-pointer shadow-2xs"
                            title="Xem chi tiết bằng chứng và thảo luận"
                          >
                            <Eye size={12} />
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
        )}

        {/* Phân trang tích hợp dưới đáy bảng */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-semibold text-text-subtle">
              Trang <strong className="text-text">{page + 1}</strong> / <strong>{totalPages}</strong>
            </span>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* 4. Modal Xem Bằng Chứng & Bối Cảnh Toàn Diện Của Task (UC118) */}
      {selectedTicket && (
        <DialogFrame
          onClose={() => setSelectedTicket(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-4xl"
          className="z-10 flex flex-col overflow-hidden bg-surface"
        >
          {/* Modal Header */}
          <div className="px-6 pt-5 pb-3 border-b border-border bg-surface shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs tabular-nums font-bold text-text bg-surface-2 px-2 py-0.5 rounded-md border border-border shadow-2xs">
                    {selectedTicket.ticketCode}
                  </span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-md text-xs font-bold border shadow-2xs',
                      getTypeBadge(selectedTicket.ticketType).className
                    )}
                  >
                    {getTypeBadge(selectedTicket.ticketType).text}
                  </span>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border shadow-2xs',
                      getStatusBadge(selectedTicket.status).className
                    )}
                  >
                    {getStatusBadge(selectedTicket.status).text}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-text mt-1.5 truncate">
                  {selectedTicket.title}
                </h2>
                <p className="text-xs text-text-subtle flex items-center gap-2 mt-0.5">
                  <span>Nhiệm vụ: <strong className="text-text font-semibold">{selectedTicket.taskTitle || `#Task ${selectedTicket.taskId}`}</strong></span>
                  <span>•</span>
                  <span>Tạo lúc: {formatDate(selectedTicket.createdAt)}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-text-subtle hover:text-text hover:bg-surface-2 rounded-xl transition-colors cursor-pointer shrink-0"
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
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer select-none',
                  activeModalTab === 'evidence'
                    ? 'border-primary-solid text-primary-solid font-bold'
                    : 'border-transparent text-text-subtle hover:text-text'
                )}
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
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer select-none',
                  activeModalTab === 'context'
                    ? 'border-primary-solid text-primary-solid font-bold'
                    : 'border-transparent text-text-subtle hover:text-text'
                )}
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
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer select-none',
                  activeModalTab === 'ticket'
                    ? 'border-primary-solid text-primary-solid font-bold'
                    : 'border-transparent text-text-subtle hover:text-text'
                )}
              >
                <DollarSign size={14} />
                <span>Yêu cầu & Tài chính</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('discussion')}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer select-none',
                  activeModalTab === 'discussion'
                    ? 'border-primary-solid text-primary-solid font-bold'
                    : 'border-transparent text-text-subtle hover:text-text'
                )}
              >
                <MessageSquare size={14} />
                <span>Trao đổi & Hòa giải</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-surface-2/60">
            {isLoadingContext && !selectedTicket ? (
              <div className="space-y-3 py-6">
                <Skeleton className="h-6 w-1/3 bg-primary-soft" />
                <Skeleton className="h-24 w-full bg-primary-soft" />
                <Skeleton className="h-24 w-full bg-primary-soft" />
              </div>
            ) : (
              <>
                {/* TAB 1: BẰNG CHỨNG TRANH CHẤP (UC118) */}
                <FadeSwitch id={activeModalTab}>
                  {activeModalTab === 'evidence' && (
                    <div className="space-y-4">
                      {/* Filter Bằng chứng theo bên nộp */}
                      <div className="flex items-center justify-between gap-3 bg-surface p-3 rounded-2xl border border-border shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-subtle">Lọc theo người nộp:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('ALL')}
                              className={cn(
                                'px-2.5 py-1 text-xs rounded-xl font-bold transition cursor-pointer',
                                evidencePartyFilter === 'ALL'
                                  ? 'bg-primary-solid text-on-primary shadow-2xs'
                                  : 'text-text-muted hover:bg-surface-2'
                              )}
                            >
                              Tất cả
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('STUDENT')}
                              className={cn(
                                'px-2.5 py-1 text-xs rounded-xl font-bold transition cursor-pointer',
                                evidencePartyFilter === 'STUDENT'
                                  ? 'bg-primary-solid text-on-primary shadow-2xs'
                                  : 'text-text-muted hover:bg-surface-2'
                              )}
                            >
                              Học viên nộp
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidencePartyFilter('MENTOR')}
                              className={cn(
                                'px-2.5 py-1 text-xs rounded-xl font-bold transition cursor-pointer',
                                evidencePartyFilter === 'MENTOR'
                                  ? 'bg-primary-solid text-on-primary shadow-2xs'
                                  : 'text-text-muted hover:bg-surface-2'
                              )}
                            >
                              Cố vấn nộp
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Danh sách Bằng chứng */}
                      {(() => {
                        const allEvidences = (disputeContext?.evidences && disputeContext.evidences.length > 0)
                          ? disputeContext.evidences
                          : (selectedTicket.evidences || [])

                        const filteredEvidences = allEvidences.filter((ev: MentoringDisputeEvidence) => {
                          if (evidencePartyFilter === 'STUDENT') {
                            return ev.uploadedBy?.role === 'STUDENT' || ev.uploadedBy?.id === selectedTicket.studentId
                          }
                          if (evidencePartyFilter === 'MENTOR') {
                            return ev.uploadedBy?.role === 'ALUMNI' || ev.uploadedBy?.role === 'MENTOR' || ev.uploadedBy?.id === selectedTicket.mentorId
                          }
                          return true
                        })

                        if (filteredEvidences.length === 0) {
                          return (
                            <div className="p-8 text-center bg-surface rounded-2xl border border-border">
                              <FileText className="mx-auto h-8 w-8 text-text-subtle mb-2" />
                              <p className="text-xs text-text-subtle">
                                Chưa có tài liệu hoặc bằng chứng nào được tải lên cho mục này.
                              </p>
                            </div>
                          )
                        }

                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {filteredEvidences.map((ev: MentoringDisputeEvidence) => (
                              <div
                                key={ev.id}
                                className="p-4 rounded-2xl border border-border bg-surface space-y-2.5 shadow-2xs hover:shadow-xs transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    {ev.fileType === 'IMAGE' ? (
                                      <span className="p-2 rounded-xl bg-primary-soft text-primary-solid">
                                        <ImageIcon size={15} />
                                      </span>
                                    ) : (
                                      <span className="p-2 rounded-xl bg-surface-2 text-text-muted">
                                        <FileText size={15} />
                                      </span>
                                    )}
                                    <div>
                                      <h4 className="text-xs font-bold text-text line-clamp-1">
                                        {ev.title}
                                      </h4>
                                      <span className="text-xs text-text-subtle tabular-nums">
                                        {formatDate(ev.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-surface-2 border border-border text-text-subtle">
                                    {ev.fileType}
                                  </span>
                                </div>

                                {ev.description && (
                                  <p className="text-xs text-text-muted leading-relaxed font-medium line-clamp-2">
                                    {ev.description}
                                  </p>
                                )}

                                {ev.fileUrl && (
                                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                                    {ev.fileType === 'IMAGE' ? (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewImage(ev.fileUrl)}
                                        className="text-primary-solid hover:underline font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                                      >
                                        <Eye size={12} /> Xem ảnh lớn
                                      </button>
                                    ) : (
                                      <a
                                        href={ev.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-solid hover:underline font-bold text-xs inline-flex items-center gap-1"
                                      >
                                        <ExternalLink size={12} /> Mở tệp đính kèm
                                      </a>
                                    )}
                                    <span className="text-xs text-text-subtle">
                                      Bởi: <strong className="text-text">{ev.uploadedBy?.fullName || 'Người tham gia'}</strong>
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  {/* TAB 2: BỐI CẢNH & LỊCH SỬ TASK */}
                  {activeModalTab === 'context' && (
                    <div className="space-y-4">
                      {/* Thẻ tóm tắt thông tin Task */}
                      <div className="p-5 rounded-2xl border border-border bg-surface space-y-3 shadow-2xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary-solid">
                          <Layers size={14} /> Thông tin bối cảnh nhiệm vụ
                        </div>
                        <h3 className="text-sm font-bold text-text">
                          {selectedTicket.taskTitle || `#Task ${selectedTicket.taskId}`}
                        </h3>
                        <p className="text-xs text-text-muted leading-relaxed font-medium">
                          {selectedTicket.description || 'Không có mô tả chi tiết cho nhiệm vụ này.'}
                        </p>
                      </div>

                      {/* Lý do khiếu nại & Yêu cầu phân xử */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                        <div className="p-4 rounded-2xl border border-border bg-surface space-y-1.5 shadow-2xs">
                          <span className="font-bold text-text-subtle block">Nguyên nhân tranh chấp:</span>
                          <p className="font-semibold text-text leading-relaxed">
                            {selectedTicket.disputeReason || 'Chưa cập nhật lý do cụ thể.'}
                          </p>
                        </div>

                        <div className="p-4 rounded-2xl border border-border bg-surface space-y-1.5 shadow-2xs">
                          <span className="font-bold text-text-subtle block">Phương án mong muốn:</span>
                          <p className="font-semibold text-text leading-relaxed">
                            {selectedTicket.desiredSolution || 'Chưa đề xuất phương án giải quyết.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: TÀI CHÍNH & KÝ QUỸ */}
                  {activeModalTab === 'ticket' && (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl border border-border bg-surface space-y-4 shadow-2xs">
                        <h3 className="text-xs font-bold text-primary-solid flex items-center gap-1.5">
                          <DollarSign size={14} /> Cân đối quỹ & Dự thảo phân chia
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div className="p-3.5 rounded-xl border border-border bg-surface-2/60">
                            <span className="text-text-subtle block mb-1">Tổng ngân sách Task:</span>
                            <span className="font-bold text-base text-text">
                              {formatVND(selectedTicket.totalAmount)}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl border border-border bg-surface-2/60">
                            <span className="text-text-subtle block mb-1">Dự thảo hoàn Học viên:</span>
                            <span className="font-bold text-base text-sky-600 dark:text-sky-400">
                              {formatVND(selectedTicket.studentRefund)}
                            </span>
                          </div>

                          <div className="p-3.5 rounded-xl border border-border bg-surface-2/60">
                            <span className="text-text-subtle block mb-1">Dự thảo chi Cố vấn:</span>
                            <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                              {formatVND(selectedTicket.mentorAmount)}
                            </span>
                          </div>
                        </div>

                        {selectedTicket.resolutionNote && (
                          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-xs space-y-1">
                            <span className="font-bold text-emerald-800 dark:text-emerald-200 block">
                              Phán quyết cuối cùng của Ban Quản Trị:
                            </span>
                            <p className="text-emerald-900 dark:text-emerald-300 font-medium leading-relaxed">
                              {selectedTicket.resolutionNote}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: THẢO LUẬN & HÒA GIẢI (THREAD) */}
                  {activeModalTab === 'discussion' && (
                    <div className="bg-surface rounded-2xl border border-border p-4 shadow-2xs">
                      <MentoringTicketDiscussionThread
                        ticketId={selectedTicket.id}
                        ticketStatus={selectedTicket.status}
                        currentRole="ADMIN"
                        ticketCode={selectedTicket.ticketCode}
                        studentName={selectedTicket.student?.fullName || selectedTicket.studentName}
                        mentorName={selectedTicket.mentor?.fullName || selectedTicket.mentorName}
                        totalAmount={selectedTicket.totalAmount}
                      />
                    </div>
                  )}
                </FadeSwitch>
              </>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-surface border-t border-border flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {(!selectedTicket.handledByName || selectedTicket.status === 'OPEN') && (
                <button
                  type="button"
                  onClick={() => handleAcceptTicket(selectedTicket)}
                  className="px-4 py-2 text-xs font-bold text-on-primary bg-primary-solid hover:bg-primary-solid/90 rounded-xl transition cursor-pointer shadow-raised flex items-center gap-1.5"
                >
                  <UserCheck size={14} /> Tiếp nhận vé này
                </button>
              )}

              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'REJECTED' && (
                <button
                  type="button"
                  onClick={() => {
                    setTicketToResolve(selectedTicket)
                    setIsResolveModalOpen(true)
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Scale size={14} /> Ban hành phán quyết
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedTicket(null)}
              className="px-4 py-2 text-xs font-bold text-text-muted hover:text-text bg-surface border border-border hover:bg-surface-2 rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </DialogFrame>
      )}

      {/* 5. Modal Ban Hành Phán Quyết (UC120) */}
      {isResolveModalOpen && ticketToResolve && (
        <AdminResolveTicketModal
          isOpen={isResolveModalOpen}
          onClose={() => {
            setIsResolveModalOpen(false)
            setTicketToResolve(null)
          }}
          ticket={ticketToResolve}
          totalEscrowAmount={ticketToResolve.totalAmount ?? 0}
        />
      )}

      {/* 6. Image Viewer Popup */}
      {previewImage && (
        <ImageViewerModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          src={previewImage}
          alt="Ảnh bằng chứng tranh chấp"
        />
      )}
    </div>
  )
}
