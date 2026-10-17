import { useState } from 'react'
import {
  Wallet,
  Search,
  RotateCcw,
  Eye,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Badge, EmptyState, Pagination, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminPayoutBalance, useAdminTaskFunds } from '../hooks/useAdmin'
import { AdminTaskLedgerDetailModal } from './AdminTaskLedgerDetailModal'

export function AdminMentoringFinancesPage() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [settlementFilter, setSettlementFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // State mở modal xem sổ quỹ
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Lấy danh sách Quỹ Task từ server
  const { data, isLoading, isError, error, refetch, isFetching } = useAdminTaskFunds({
    keyword: keyword || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    settlementStatus: settlementFilter !== 'ALL' ? settlementFilter : undefined,
    page,
    size: 10,
  })

  const payoutBalance = useAdminPayoutBalance()

  const formatVnd = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const renderSettlementBadge = (status?: string) => {
    switch (status) {
      case 'SETTLED':
        return <Badge tone="success">Đã quyết toán</Badge>
      case 'HOLDING_ESCROW':
        return <Badge tone="brand">Đang giữ Escrow</Badge>
      case 'PARTIALLY_SETTLED':
        return <Badge tone="gold">Quyết toán một phần</Badge>
      case 'UNSETTLED':
        return <Badge tone="danger">Chưa quyết toán</Badge>
      default:
        return <Badge tone="neutral">{status || '—'}</Badge>
    }
  }

  const renderTaskStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge tone="success">Hoàn thành</Badge>
      case 'RESOLVED':
        return <Badge tone="brand">Đã xử lý tranh chấp</Badge>
      case 'IN_PROGRESS':
        return <Badge tone="aqua">Đang thực hiện</Badge>
      case 'DISPUTED':
        return <Badge tone="danger">Tranh chấp</Badge>
      case 'CANCELLED':
        return <Badge tone="neutral">Đã hủy</Badge>
      case 'SUBMITTED':
        return <Badge tone="gold">Chờ nghiệm thu</Badge>
      default:
        return <Badge tone="neutral">{status || 'Chuẩn bị'}</Badge>
    }
  }

  const tasks = data?.content || []
  const totalElements = data?.totalElements || 0
  const totalPages = data?.totalPages || 0

  // Tính tổng số liệu nhanh từ trang hiện tại
  const pageTotalCollected = tasks.reduce((sum, t) => sum + (t.totalCollected || 0), 0)
  const pageEscrowHolding = tasks.reduce((sum, t) => sum + (t.escrowHoldingAmount || 0), 0)
  const pageTotalPayout = tasks.reduce((sum, t) => sum + (t.totalPayout || 0), 0)
  const pageTotalRefund = tasks.reduce((sum, t) => sum + (t.totalRefund || 0), 0)

  const handleOpenDetail = (taskId: number) => {
    setSelectedTaskId(taskId)
    setIsModalOpen(true)
  }

  const handleResetFilters = () => {
    setKeyword('')
    setStatusFilter('ALL')
    setSettlementFilter('ALL')
    setPage(0)
  }

  return (
    <div className="space-y-6 text-text">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-solid text-xs sm:text-sm font-bold tracking-wide uppercase">
            <Wallet className="w-4 h-4" />
            <span>Quản trị tài chính Mentoring Task</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text mt-1">
            Sổ quỹ & Đối soát tài chính theo Task
          </h1>
          <p className="text-xs sm:text-sm text-text-subtle mt-1">
            Theo dõi dòng tiền ký quỹ Escrow, thù lao chi Cố vấn, hoàn trả Học viên và đối soát sổ quỹ chi tiết từng nhiệm vụ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="rounded-xl border border-border bg-surface dark:bg-bg px-3.5 py-2 text-right shadow-2xs"
            title={payoutBalance.isError
              ? (payoutBalance.error as Error)?.message || 'Không đọc được số dư Kênh chi PayOS (kiểm tra key và IP whitelist)'
              : undefined}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-text-subtle">Số dư Kênh chi PayOS</p>
            <p className={`text-sm font-extrabold ${payoutBalance.isError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {payoutBalance.isLoading ? '…' : payoutBalance.isError ? 'Không khả dụng' : formatVnd(payoutBalance.data)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { refetch(); payoutBalance.refetch() }}
            disabled={isFetching}
            className="gap-2 text-xs font-semibold bg-surface hover:bg-surface-2 text-text-muted border border-border"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-success-soft border border-success-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng thu ký quỹ (Trang này)</span>
            <ArrowDownLeft className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-extrabold text-success mt-2">
            {formatVnd(pageTotalCollected)}
          </p>
          <p className="text-xs text-text-subtle mt-1">
            Từ {tasks.length} nhiệm vụ trên trang
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-info-soft border border-info-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Đang giữ trong Escrow</span>
            <Wallet className="w-4 h-4 text-info" />
          </div>
          <p className="text-xl font-extrabold text-info mt-2">
            {formatVnd(pageEscrowHolding)}
          </p>
          <p className="text-xs text-text-subtle mt-1">
            Tiền bảo đảm thực hiện Task
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-primary-soft border border-primary-soft-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Đã chi Cố vấn (Payout)</span>
            <ArrowUpRight className="w-4 h-4 text-primary-solid" />
          </div>
          <p className="text-xl font-extrabold text-primary-solid mt-2">
            {formatVnd(pageTotalPayout)}
          </p>
          <p className="text-xs text-text-subtle mt-1">
            Thù lao hoàn thành hoặc hòa giải
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-warning-soft border border-warning-border shadow-xs">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Đã hoàn Học viên (Refund)</span>
            <RotateCcw className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-extrabold text-warning mt-2">
            {formatVnd(pageTotalRefund)}
          </p>
          <p className="text-xs text-text-subtle mt-1">
            Hoàn tiền hủy Task hoặc hòa giải
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-border bg-surface dark:bg-bg shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
            <input
              type="text"
              placeholder="Tìm theo Mã Task, Tên Task..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-4 py-2 bg-surface-2 border border-border rounded-xl text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lọc Trạng thái Task */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-subtle font-medium">Trạng thái Task:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PREPARATION">Chuẩn bị </option>
                <option value="IN_PROGRESS">Đang làm </option>
                <option value="SUBMITTED">Chờ duyệt </option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="DISPUTED">Tranh chấp</option>
                <option value="RESOLVED">Đã phán quyết</option>
                <option value="CANCELLED">Đã hủy </option>
              </select>
            </div>

            {/* Lọc Trạng thái Quyết toán */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-subtle font-medium">Quyết toán:</span>
              <select
                value={settlementFilter}
                onChange={(e) => {
                  setSettlementFilter(e.target.value)
                  setPage(0)
                }}
                className="bg-surface-2 border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">Tất cả quyết toán</option>
                <option value="HOLDING_ESCROW">Đang giữ Escrow</option>
                <option value="SETTLED">Đã quyết toán hoàn tất</option>
                <option value="PARTIALLY_SETTLED">Đã thanh toán một phần</option>
                <option value="UNSETTLED">Chưa quyết toán</option>
              </select>
            </div>

            {(keyword || statusFilter !== 'ALL' || settlementFilter !== 'ALL') && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-text-muted">
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface dark:bg-bg shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3 text-danger">
            <AlertTriangle className="w-10 h-10 mx-auto" />
            <p className="font-semibold text-sm">Lỗi tải danh sách Sổ quỹ: {(error as any)?.message || 'Vui lòng thử lại.'}</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Wallet className="w-12 h-12 text-text-subtle" />}
              title="Không tìm thấy nhiệm vụ nào"
              description="Không có nhiệm vụ Mentoring Task nào phù hợp với bộ lọc hiện tại."
              action={
                (keyword || statusFilter !== 'ALL' || settlementFilter !== 'ALL') ? (
                  <Button size="sm" variant="secondary" onClick={handleResetFilters}>
                    Xóa bộ lọc
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-2 text-xs font-bold text-text-subtle uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3.5">Mã Task & Tiêu đề</th>
                  <th className="px-4 py-3.5">Các bên tham gia</th>
                  <th className="px-4 py-3.5">Tổng thu ký quỹ</th>
                  <th className="px-4 py-3.5">Giữ Escrow</th>
                  <th className="px-4 py-3.5">Chi Cố vấn</th>
                  <th className="px-4 py-3.5">Hoàn Học viên</th>
                  <th className="px-4 py-3.5">Trạng thái Task</th>
                  <th className="px-4 py-3.5">Quyết toán</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.taskId} className="hover:bg-surface-2 transition-colors group">
                    {/* Mã & Tiêu đề */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary-solid">#{task.taskId}</span>
                        {task.activeTicketId && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-danger-soft text-danger"
                            title={`Có Ticket ${task.activeTicketCode || ''} (${task.activeTicketStatus || ''})`}
                          >
                            TICKET
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-text text-sm line-clamp-2 mt-0.5" title={task.taskTitle}>
                        {task.taskTitle}
                      </p>
                      <p className="text-xs text-text-subtle mt-0.5">
                        Ngày tạo: {formatDateTime(task.createdAt)}
                      </p>
                    </td>

                    {/* Các bên tham gia */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5 min-w-[170px]">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="w-4 h-4 rounded-full bg-info-soft text-info flex items-center justify-center text-xs font-bold">
                            H
                          </span>
                          <span className="font-medium text-text truncate max-w-[140px]" title={task.student?.fullName}>
                            {task.student?.fullName || 'Học viên'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="w-4 h-4 rounded-full bg-primary-soft text-primary-solid flex items-center justify-center text-xs font-bold">
                            C
                          </span>
                          <span className="font-medium text-text truncate max-w-[140px]" title={task.mentor?.fullName}>
                            {task.mentor?.fullName || 'Cố vấn'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tổng thu */}
                    <td className="px-4 py-3.5 font-bold text-sm text-success whitespace-nowrap">
                      +{formatVnd(task.totalCollected)}
                      {task.totalTopUpAmount > 0 && (
                        <span className="block text-xs font-normal text-text-subtle">
                          Gồm +{formatVnd(task.totalTopUpAmount)}
                        </span>
                      )}
                    </td>

                    {/* Giữ Escrow */}
                    <td className="px-4 py-3.5 font-bold text-sm text-info whitespace-nowrap">
                      {formatVnd(task.escrowHoldingAmount)}
                      {task.lockedAmount > 0 && (
                        <span className="block text-xs font-normal text-danger">
                          Khóa: {formatVnd(task.lockedAmount)}
                        </span>
                      )}
                    </td>

                    {/* Chi Cố vấn */}
                    <td className="px-4 py-3.5 font-bold text-sm text-primary-solid whitespace-nowrap">
                      {task.totalPayout > 0 ? `-${formatVnd(task.totalPayout)}` : '0 ₫'}
                    </td>

                    {/* Hoàn Học viên */}
                    <td className="px-4 py-3.5 font-bold text-sm text-warning whitespace-nowrap">
                      {task.totalRefund > 0 ? `-${formatVnd(task.totalRefund)}` : '0 ₫'}
                    </td>

                    {/* Trạng thái Task */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {renderTaskStatusBadge(task.taskStatus)}
                    </td>

                    {/* Trạng thái Quyết toán */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {renderSettlementBadge(task.settlementStatus)}
                    </td>

                    {/* Thao tác */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenDetail(task.taskId)}
                        className="gap-1.5 text-xs font-semibold bg-surface hover:bg-primary-soft hover:text-primary-solid hover:border-orange-300 text-text-muted border border-border transition-all shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem Sổ quỹ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between">
            <p className="text-xs text-text-subtle">
              Hiển thị <strong className="text-text">{tasks.length}</strong> trên tổng số{' '}
              <strong className="text-text">{totalElements}</strong> nhiệm vụ
            </p>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      {/* Modal Xem Chi Tiết Sổ Quỹ & Các bên liên quan */}
      <AdminTaskLedgerDetailModal
        taskId={selectedTaskId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedTaskId(null)
        }}
      />
    </div>
  )
}
