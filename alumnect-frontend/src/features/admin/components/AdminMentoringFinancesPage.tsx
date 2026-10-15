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
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#F27024] text-xs sm:text-sm font-bold tracking-wide uppercase">
            <Wallet className="w-4 h-4" />
            <span>Quản trị tài chính Mentoring Task</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Sổ quỹ & Đối soát tài chính theo Task
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi dòng tiền ký quỹ Escrow, thù lao chi Cố vấn, hoàn trả Học viên và đối soát sổ quỹ chi tiết từng nhiệm vụ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2022] px-3.5 py-2 text-right shadow-2xs"
            title={payoutBalance.isError
              ? (payoutBalance.error as Error)?.message || 'Không đọc được số dư Kênh chi PayOS (kiểm tra key và IP whitelist)'
              : undefined}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Số dư Kênh chi PayOS</p>
            <p className={`text-sm font-extrabold ${payoutBalance.isError ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {payoutBalance.isLoading ? '…' : payoutBalance.isError ? 'Không khả dụng' : formatVnd(payoutBalance.data)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { refetch(); payoutBalance.refetch() }}
            disabled={isFetching}
            className="gap-2 text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-[#1e2022] border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng thu ký quỹ (Trang này)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatVnd(pageTotalCollected)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Từ {tasks.length} nhiệm vụ trên trang
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white dark:from-blue-950/30 dark:via-blue-950/10 dark:to-[#1e2022] border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Đang giữ trong Escrow</span>
            <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {formatVnd(pageEscrowHolding)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tiền bảo đảm thực hiện Task
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white dark:from-purple-950/30 dark:via-purple-950/10 dark:to-[#1e2022] border border-purple-200/80 dark:border-purple-800/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Đã chi Cố vấn (Payout)</span>
            <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {formatVnd(pageTotalPayout)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thù lao hoàn thành hoặc hòa giải
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white dark:from-amber-950/30 dark:via-amber-950/10 dark:to-[#1e2022] border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Đã hoàn Học viên (Refund)</span>
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatVnd(pageTotalRefund)}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hoàn tiền hủy Task hoặc hòa giải
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2022] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo Mã Task, Tên Task..."
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value)
                setPage(0)
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Lọc Trạng thái Task */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trạng thái Task:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(0)
                }}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PREPARATION">Chuẩn bị (PREPARATION)</option>
                <option value="IN_PROGRESS">Đang làm (IN_PROGRESS)</option>
                <option value="SUBMITTED">Chờ duyệt (SUBMITTED)</option>
                <option value="COMPLETED">Hoàn thành (COMPLETED)</option>
                <option value="DISPUTED">Tranh chấp (DISPUTED)</option>
                <option value="RESOLVED">Đã phán quyết (RESOLVED)</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            {/* Lọc Trạng thái Quyết toán */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quyết toán:</span>
              <select
                value={settlementFilter}
                onChange={(e) => {
                  setSettlementFilter(e.target.value)
                  setPage(0)
                }}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="ALL">Tất cả quyết toán</option>
                <option value="HOLDING_ESCROW">Đang giữ Escrow</option>
                <option value="SETTLED">Đã quyết toán hoàn tất</option>
                <option value="PARTIALLY_SETTLED">Đã thanh toán một phần</option>
                <option value="UNSETTLED">Chưa quyết toán</option>
              </select>
            </div>

            {(keyword || statusFilter !== 'ALL' || settlementFilter !== 'ALL') && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="text-xs text-slate-600 dark:text-slate-300">
                Đặt lại
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e2022] shadow-xs">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-3 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-10 h-10 mx-auto" />
            <p className="font-semibold text-sm">Lỗi tải danh sách Sổ quỹ: {(error as any)?.message || 'Vui lòng thử lại.'}</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Wallet className="w-12 h-12 text-slate-400" />}
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
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
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
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => (
                  <tr key={task.taskId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group">
                    {/* Mã & Tiêu đề */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#F27024]">#{task.taskId}</span>
                        {task.activeTicketId && (
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                            title={`Có Ticket ${task.activeTicketCode || ''} (${task.activeTicketStatus || ''})`}
                          >
                            TICKET
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm line-clamp-2 mt-0.5" title={task.taskTitle}>
                        {task.taskTitle}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Ngày tạo: {formatDateTime(task.createdAt)}
                      </p>
                    </td>

                    {/* Các bên tham gia */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1.5 min-w-[170px]">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center text-[9px] font-bold">
                            H
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={task.student?.fullName}>
                            {task.student?.fullName || 'Học viên'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center text-[9px] font-bold">
                            C
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]" title={task.mentor?.fullName}>
                            {task.mentor?.fullName || 'Cố vấn'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tổng thu */}
                    <td className="px-4 py-3.5 font-bold text-sm text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      +{formatVnd(task.totalCollected)}
                      {task.totalTopUpAmount > 0 && (
                        <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          Gồm +{formatVnd(task.totalTopUpAmount)}
                        </span>
                      )}
                    </td>

                    {/* Giữ Escrow */}
                    <td className="px-4 py-3.5 font-bold text-sm text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {formatVnd(task.escrowHoldingAmount)}
                      {task.lockedAmount > 0 && (
                        <span className="block text-[10px] font-normal text-rose-500">
                          Khóa: {formatVnd(task.lockedAmount)}
                        </span>
                      )}
                    </td>

                    {/* Chi Cố vấn */}
                    <td className="px-4 py-3.5 font-bold text-sm text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {task.totalPayout > 0 ? `-${formatVnd(task.totalPayout)}` : '0 ₫'}
                    </td>

                    {/* Hoàn Học viên */}
                    <td className="px-4 py-3.5 font-bold text-sm text-amber-600 dark:text-amber-400 whitespace-nowrap">
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
                        className="gap-1.5 text-xs font-semibold bg-white hover:bg-orange-50 hover:text-[#F27024] hover:border-orange-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs"
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hiển thị <strong className="text-slate-800 dark:text-slate-200">{tasks.length}</strong> trên tổng số{' '}
              <strong className="text-slate-800 dark:text-slate-200">{totalElements}</strong> nhiệm vụ
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
