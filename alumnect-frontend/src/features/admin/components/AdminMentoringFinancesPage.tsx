import { useState } from 'react'
import {
  Wallet,
  Search,
  Eye,
  AlertTriangle,
  Landmark,
  Lock,
  ArrowUpRight,
  Undo2,
} from 'lucide-react'
import { Badge, EmptyState, Pagination, Skeleton, SelectDropdown } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminPayoutBalance, useAdminTaskFunds } from '../hooks/useAdmin'
import { AdminTaskLedgerDetailModal } from './AdminTaskLedgerDetailModal'
import { AdminPageBanner } from './AdminVisuals'

export function AdminMentoringFinancesPage() {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [settlementFilter, setSettlementFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  // State mở modal xem sổ quỹ
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Lấy danh sách Quỹ Task từ server
  const { data, isLoading, isError, error, refetch } = useAdminTaskFunds({
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
    <div className="mx-auto max-w-6xl space-y-6 text-text">
      {/* 1. Dải đầu trang + số dư kênh chi PayOS */}
      <AdminPageBanner
        title="Sổ quỹ Mentoring"
        scene="ledger"
        actions={
          <div
            className="inline-flex items-center gap-3 rounded-2xl border border-[#F3D9C8] bg-white/80 px-4 py-2.5 backdrop-blur dark:border-border dark:bg-surface"
            title={
              payoutBalance.isError
                ? (payoutBalance.error as Error)?.message || 'Không đọc được số dư Kênh chi PayOS (kiểm tra key và IP whitelist)'
                : undefined
            }
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1F2A44] text-white">
              <Landmark className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-xs text-text-subtle">Số dư kênh chi PayOS</span>
              <span className={`block font-display text-base font-bold tabular-nums ${payoutBalance.isError ? 'text-danger' : 'text-text'}`}>
                {payoutBalance.isLoading ? '…' : payoutBalance.isError ? 'Không khả dụng' : formatVnd(payoutBalance.data)}
              </span>
            </span>
          </div>
        }
      />

      {/* 2. Tổng tiền của các nhiệm vụ đang hiển thị (API chưa có tổng toàn hệ thống) */}
      <section aria-label="Tổng tiền của các nhiệm vụ đang hiển thị" className="overflow-hidden rounded-2xl border border-border bg-surface">
        <p className="px-4 pt-4 text-sm text-text-subtle">Tổng của {tasks.length} nhiệm vụ đang hiển thị</p>
        <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          {([
            { label: 'Đã thu ký quỹ', value: pageTotalCollected, icon: <Wallet /> },
            { label: 'Đang giữ trong ký quỹ', value: pageEscrowHolding, icon: <Lock /> },
            { label: 'Đã chi cho Mentor', value: pageTotalPayout, icon: <ArrowUpRight /> },
            { label: 'Đã hoàn cho học viên', value: pageTotalRefund, icon: <Undo2 /> },
          ] as const).map((item) => (
            <div key={item.label} className="flex min-w-0 items-center gap-3 px-4 py-4">
              <span className="shrink-0 text-text-subtle">{item.icon}</span>
              <div className="min-w-0">
                <dt className="text-xs text-text-subtle">{item.label}</dt>
                <dd className="mt-1 whitespace-nowrap text-base font-semibold tabular-nums text-text">{formatVnd(item.value)}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Filter Toolbar */}
      <div className="space-y-4 rounded-3xl border border-border bg-surface p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
            <input
              aria-label="Tìm theo Mã Task, Tên Task..."
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
              <SelectDropdown
                value={statusFilter}
                onChange={(val) => {
                  setStatusFilter(String(val))
                  setPage(0)
                }}
                options={[{ value: 'ALL', label: 'Tất cả trạng thái' }, { value: 'PREPARATION', label: 'Chuẩn bị' }, { value: 'IN_PROGRESS', label: 'Đang làm' }, { value: 'SUBMITTED', label: 'Chờ duyệt' }, { value: 'COMPLETED', label: 'Hoàn thành' }, { value: 'DISPUTED', label: 'Tranh chấp' }, { value: 'RESOLVED', label: 'Đã phán quyết' }, { value: 'CANCELLED', label: 'Đã hủy' }]}
                placeholder="Tất cả trạng thái"
                className="w-48"
                buttonClassName="h-9 text-xs"
              />
            </div>

            {/* Lọc Trạng thái Quyết toán */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-subtle font-medium">Quyết toán:</span>
              <SelectDropdown
                value={settlementFilter}
                onChange={(val) => {
                  setSettlementFilter(String(val))
                  setPage(0)
                }}
                options={[{ value: 'ALL', label: 'Tất cả quyết toán' }, { value: 'HOLDING_ESCROW', label: 'Đang giữ Escrow' }, { value: 'SETTLED', label: 'Đã quyết toán hoàn tất' }, { value: 'PARTIALLY_SETTLED', label: 'Đã thanh toán một phần' }, { value: 'UNSETTLED', label: 'Chưa quyết toán' }]}
                placeholder="Tất cả quyết toán"
                className="w-52"
                buttonClassName="h-9 text-xs"
              />
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
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
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
              <thead className="bg-surface-2 text-xs font-bold text-text-subtle border-b border-border">
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
                        <span className="tabular-nums text-xs font-bold text-primary-solid">#{task.taskId}</span>
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
                        className="gap-1.5 text-xs font-semibold bg-surface hover:bg-primary-soft hover:text-primary-solid hover:border-orange-300 text-text-muted border border-border transition shadow-2xs"
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
