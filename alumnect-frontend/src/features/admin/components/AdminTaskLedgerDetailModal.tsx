import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  X,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { Badge, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminTaskFundDetail, useRetryAdminPayout } from '../hooks/useAdmin'

const PAYOUT_PROVIDER_STATUS_LABELS: Record<string, string> = {
  QUEUED: 'Chờ gửi PayOS',
  BANK_ACCOUNT_REQUIRED: 'Người nhận chưa có tài khoản ngân hàng hợp lệ',
  PROVIDER_UNAVAILABLE: 'PayOS chưa tiếp nhận, đang tự thử lại',
  SUBMIT_UNKNOWN: 'Đang xác minh kết quả gửi PayOS',
  REJECTED: 'PayOS từ chối lệnh chi',
  INVALID_REQUEST: 'Lệnh chi không hợp lệ',
  MOCK_VOIDED: 'Lệnh giả lập cũ, chưa chuyển tiền thật – cần chi lại',
  BELOW_MINIMUM: 'Dưới mức chi tối thiểu PayOS – chuyển khoản thủ công',
  RECEIVED: 'PayOS đã tiếp nhận',
  PROCESSING: 'PayOS đang xử lý',
  ON_HOLD: 'PayOS tạm giữ lệnh chi',
}

interface AdminTaskLedgerDetailModalProps {
  taskId: number | null
  isOpen: boolean
  onClose: () => void
}

export function AdminTaskLedgerDetailModal({
  taskId,
  isOpen,
  onClose,
}: AdminTaskLedgerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'ledgers' | 'extensions' | 'amendments' | 'disputes'>('ledgers')

  const { data: detail, isLoading, isError, error, refetch } = useAdminTaskFundDetail(
    isOpen ? taskId : null
  )
  const retryPayout = useRetryAdminPayout()

  if (!isOpen) return null

  const formatVnd = (amount?: number) => {
    if (amount === undefined || amount === null) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleString('vi-VN', {
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

  const renderSettlementBadge = (status?: string) => {
    switch (status) {
      case 'SETTLED':
        return <Badge tone="success">Đã quyết toán hoàn tất</Badge>
      case 'HOLDING_ESCROW':
        return <Badge tone="brand">Đang giữ quỹ Escrow</Badge>
      case 'PARTIALLY_SETTLED':
        return <Badge tone="gold">Đã thanh toán một phần</Badge>
      case 'UNSETTLED':
        return <Badge tone="danger">Chưa quyết toán</Badge>
      default:
        return <Badge tone="neutral">{status || 'Chưa xác định'}</Badge>
    }
  }

  const renderTaskStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge tone="success">Hoàn thành</Badge>
      case 'RESOLVED':
        return <Badge tone="brand">Đã xử lý hòa giải</Badge>
      case 'IN_PROGRESS':
        return <Badge tone="aqua">Đang thực hiện</Badge>
      case 'DISPUTED':
        return <Badge tone="danger">Đang tranh chấp</Badge>
      case 'CANCELLED':
        return <Badge tone="neutral">Đã hủy</Badge>
      default:
        return <Badge tone="neutral">{status || 'Chưa bắt đầu'}</Badge>
    }
  }

  const renderLedgerTypeBadge = (type?: string) => {
    switch (type) {
      case 'ESCROW_COLLECTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success-soft text-success border border-success-border">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Thu ký quỹ (Escrow)
          </span>
        )
      case 'PAYOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ArrowUpRight className="w-3.5 h-3.5" /> Chi trả Cố vấn
          </span>
        )
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-warning-soft text-warning border border-warning-border">
            <RotateCcw className="w-3.5 h-3.5" /> Hoàn trả Học viên
          </span>
        )
      case 'TOP_UP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-info-soft text-info border border-info-border">
            <TrendingUp className="w-3.5 h-3.5" /> Thu bổ sung (Top-up)
          </span>
        )
      default:
        return <Badge tone="neutral">{type || 'Giao dịch'}</Badge>
    }
  }

  const renderLedgerStatusBadge = (status?: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
            <Clock className="w-3.5 h-3.5" /> Đang chờ
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
            <AlertTriangle className="w-3.5 h-3.5" /> Thất bại
          </span>
        )
      default:
        return <span className="text-xs text-text-subtle">{status}</span>
    }
  }

  const summary = detail?.summary

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-surface dark:bg-bg rounded-3xl shadow-2xl border border-border overflow-hidden text-text">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-border bg-surface dark:bg-bg shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary-soft text-primary-solid dark:bg-orange-950/40 dark:text-orange-400 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-primary-soft text-primary-solid dark:bg-orange-950/40 dark:text-orange-300">
                  TASK #{taskId}
                </span>
                {summary && renderTaskStatusBadge(summary.taskStatus)}
                {summary && renderSettlementBadge(summary.settlementStatus)}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-text truncate max-w-xl sm:max-w-2xl mt-0.5">
                {summary ? summary.taskTitle : `Sổ quỹ Mentoring Task #${taskId}`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-subtle hover:text-text-muted hover:bg-surface-2 rounded-xl transition-colors cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          )}

          {isError && (
            <div className="p-6 text-center space-y-3 bg-danger-soft rounded-2xl border border-danger-border text-danger">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="font-semibold text-sm">Lỗi tải dữ liệu sổ quỹ của Task: {(error as any)?.message || 'Vui lòng thử lại.'}</p>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          )}

          {summary && (
            <>
              {/* Thông tin đối tượng tham gia & Hạn chót */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-surface-2 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-info-soft text-info flex items-center justify-center text-sm font-bold shrink-0">
                    HV
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase font-bold tracking-wider text-text-subtle">Học viên (Student)</p>
                    <p className="text-sm font-semibold text-text truncate">{summary.student?.fullName || '—'}</p>
                    <p className="text-xs text-text-subtle truncate">{summary.student?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 flex items-center justify-center text-sm font-bold shrink-0">
                    CV
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase font-bold tracking-wider text-text-subtle">Cố vấn (Mentor)</p>
                    <p className="text-sm font-semibold text-text truncate">{summary.mentor?.fullName || '—'}</p>
                    <p className="text-xs text-text-subtle truncate">{summary.mentor?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-warning-soft text-warning flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase font-bold tracking-wider text-text-subtle">Hạn chót hoàn thành</p>
                    <p className="text-sm font-semibold text-text">{formatDateTime(summary.currentDeadline)}</p>
                    <p className="text-xs text-text-subtle">Khởi tạo: {formatDateTime(summary.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Bảng cân đối dòng tiền Task (KPI Cards) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-50/50 to-white dark:from-emerald-950/30 dark:via-emerald-950/10 dark:to-surface border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-xs font-semibold">Tổng thu ký quỹ</span>
                    <ArrowDownLeft className="w-4 h-4 text-success" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-success mt-1">
                    {formatVnd(summary.totalCollected)}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5 truncate">
                    {summary.totalTopUpAmount > 0 ? `+${formatVnd(summary.totalTopUpAmount)} bổ sung` : 'Ký quỹ ban đầu'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-50/50 to-white dark:from-blue-950/30 dark:via-blue-950/10 dark:to-surface border border-blue-200/80 dark:border-blue-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-xs font-semibold">Đang giữ Escrow</span>
                    <Wallet className="w-4 h-4 text-info" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-info mt-1">
                    {formatVnd(summary.escrowHoldingAmount)}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5 truncate">
                    {summary.lockedAmount > 0 ? `Khóa: ${formatVnd(summary.lockedAmount)}` : 'Sẵn sàng giải ngân'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-50/50 to-white dark:from-purple-950/30 dark:via-purple-950/10 dark:to-surface border border-purple-200/80 dark:border-purple-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-xs font-semibold">Đã chi Cố vấn</span>
                    <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {formatVnd(summary.totalPayout)}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5">Thù lao Mentoring</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-white dark:from-amber-950/30 dark:via-amber-950/10 dark:to-surface border border-amber-200/80 dark:border-amber-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-xs font-semibold">Đã hoàn Học viên</span>
                    <RotateCcw className="w-4 h-4 text-warning" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-warning mt-1">
                    {formatVnd(summary.totalRefund)}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5">Hoàn tiền giải quyết</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-500/10 via-slate-50/50 to-white dark:from-slate-800/40 dark:via-slate-800/20 dark:to-surface border border-border shadow-xs">
                  <div className="flex items-center justify-between text-text-muted">
                    <span className="text-xs font-semibold">Phí nền tảng/Hòa giải</span>
                    <ShieldCheck className="w-4 h-4 text-text-subtle" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-text mt-1">
                    {formatVnd(summary.platformFee)}
                  </p>
                  <p className="text-xs text-text-subtle mt-0.5">Thu phí xử lý vé</p>
                </div>
              </div>

              {/* Tabs Lịch sử giao dịch & Tài liệu liên quan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ledgers')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'ledgers'
                        ? 'bg-primary-solid text-on-primary shadow-xs'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Sổ quỹ giao dịch</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'ledgers' ? 'bg-white/25 text-white' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {detail.ledgers?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('extensions')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'extensions'
                        ? 'bg-primary-solid text-on-primary shadow-xs'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Gia hạn thời hạn</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'extensions' ? 'bg-white/25 text-white' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {detail.extensionHistory?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('amendments')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'amendments'
                        ? 'bg-primary-solid text-on-primary shadow-xs'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Điều chỉnh & Bổ sung quỹ</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'amendments' ? 'bg-white/25 text-white' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {detail.amendmentHistory?.length || 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('disputes')}
                    className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      activeTab === 'disputes'
                        ? 'bg-primary-solid text-on-primary shadow-xs'
                        : 'text-text-muted hover:text-text hover:bg-surface-2'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Vé tranh chấp & Phán quyết</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'disputes' ? 'bg-white/25 text-white' : 'bg-surface-3 text-text-muted'
                    }`}>
                      {detail.disputeTickets?.length || 0}
                    </span>
                  </button>
                </div>

                {/* TAB 1: Sổ quỹ giao dịch (Ledgers Table) */}
                {activeTab === 'ledgers' && (
                  <div className="space-y-3">
                    {(!detail.ledgers || detail.ledgers.length === 0) ? (
                      <EmptyState
                        icon={<Wallet className="w-10 h-10 text-text-subtle" />}
                        title="Chưa có giao dịch sổ quỹ"
                        description="Chưa có bút toán thu/chi nào được ghi nhận cho nhiệm vụ Mentoring này."
                      />
                    ) : (
                      <div className="rounded-2xl border border-border overflow-hidden bg-surface dark:bg-[#1a1c1e] shadow-xs">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-surface-2 text-xs font-bold text-text-subtle uppercase tracking-wider border-b border-border">
                            <tr>
                              <th className="px-4 py-3.5">Mã GD</th>
                              <th className="px-4 py-3.5">Thời gian</th>
                              <th className="px-4 py-3.5">Loại giao dịch</th>
                              <th className="px-4 py-3.5">Số tiền</th>
                              <th className="px-4 py-3.5">Trạng thái</th>
                              <th className="px-4 py-3.5">Mã đối soát / Snapshot</th>
                              <th className="px-4 py-3.5">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {detail.ledgers.map((l) => (
                              <tr key={l.id} className="hover:bg-surface-2 transition-colors">
                                <td className="px-4 py-3 font-mono font-semibold text-xs text-text">
                                  #{l.id}
                                </td>
                                <td className="px-4 py-3 text-xs text-text-subtle whitespace-nowrap">
                                  {formatDateTime(l.createdAt)}
                                </td>
                                <td className="px-4 py-3">
                                  {renderLedgerTypeBadge(l.transactionType)}
                                </td>
                                <td className="px-4 py-3 font-bold text-sm">
                                  <span
                                    className={
                                      l.transactionType === 'ESCROW_COLLECTION' || l.transactionType === 'TOP_UP'
                                        ? 'text-success'
                                        : l.transactionType === 'PAYOUT'
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-warning'
                                    }
                                  >
                                    {l.transactionType === 'PAYOUT' || l.transactionType === 'REFUND' ? '-' : '+'}
                                    {formatVnd(l.amount)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {renderLedgerStatusBadge(l.status)}
                                  {(l.transactionType === 'PAYOUT' || l.transactionType === 'REFUND') && l.providerStatus && l.status !== 'SUCCEEDED' && (
                                    <p className="mt-1 text-xs text-text-subtle max-w-[180px]" title={l.failureCode ? `Mã lỗi: ${l.failureCode}` : undefined}>
                                      {PAYOUT_PROVIDER_STATUS_LABELS[l.providerStatus] || l.providerStatus}
                                    </p>
                                  )}
                                  {(l.transactionType === 'PAYOUT' || l.transactionType === 'REFUND') && l.status === 'FAILED' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="mt-2 text-xs"
                                      disabled={retryPayout.isPending}
                                      leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                                      onClick={() => retryPayout.mutate({ ledgerId: l.id })}
                                    >
                                      {retryPayout.isPending && retryPayout.variables?.ledgerId === l.id ? 'Đang gửi...' : 'Chi lại'}
                                    </Button>
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-0.5">
                                    <p className="font-mono text-xs text-text-muted truncate max-w-[200px]" title={l.providerReference || '—'}>
                                      Ref: {l.providerReference || '—'}
                                    </p>
                                    {l.deadlineSnapshot && (
                                      <p className="text-xs text-text-subtle">
                                        DL: {formatDateTime(l.deadlineSnapshot)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-text-muted max-w-xs truncate" title={l.note || ''}>
                                  {l.note || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Lịch sử gia hạn thời hạn */}
                {activeTab === 'extensions' && (
                  <div className="space-y-3">
                    {(!detail.extensionHistory || detail.extensionHistory.length === 0) ? (
                      <EmptyState
                        icon={<Clock className="w-10 h-10 text-text-subtle" />}
                        title="Không có yêu cầu gia hạn"
                        description="Nhiệm vụ này chưa từng có đề xuất gia hạn thời hạn từ phía Học viên hoặc Cố vấn."
                      />
                    ) : (
                      <div className="space-y-3">
                        {detail.extensionHistory.map((ext: any) => (
                          <div key={ext.id} className="p-4 rounded-2xl border border-border bg-surface-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary-solid">TICKET GIA HẠN #{ext.id}</span>
                                <Badge tone={ext.status === 'CONFIRMED' ? 'success' : ext.status === 'REJECTED' ? 'danger' : 'gold'}>
                                  {ext.status === 'CONFIRMED' ? 'Đã duyệt' : ext.status === 'REJECTED' ? 'Bị từ chối' : 'Chờ phản hồi'}
                                </Badge>
                              </div>
                              <span className="text-xs text-text-subtle">{formatDateTime(ext.createdAt)}</span>
                            </div>
                            <p className="text-xs text-text-muted">
                              Người gửi đề xuất:{' '}
                              <strong className="text-text font-semibold">{ext.createdByName || '—'}</strong> ({ext.createdByRole})
                            </p>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-surface rounded-xl text-xs border border-border">
                              <div>
                                <span className="text-text-subtle">Hạn chót cũ: </span>
                                <span className="font-medium text-text">{formatDateTime(ext.currentDeadline)}</span>
                              </div>
                              <div>
                                <span className="text-text-subtle">Hạn chót đề xuất: </span>
                                <span className="font-bold text-primary-solid">{formatDateTime(ext.proposedDeadline)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-text">
                              <span className="text-text-subtle">Lý do: </span>
                              {ext.reason || '—'}
                            </p>
                            {ext.responseNote && (
                              <p className="text-xs text-text-muted italic bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-700/50">
                                Phản hồi ({ext.respondedByName}): "{ext.responseNote}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Lịch sử điều chỉnh phạm vi & ngân sách */}
                {activeTab === 'amendments' && (
                  <div className="space-y-3">
                    {(!detail.amendmentHistory || detail.amendmentHistory.length === 0) ? (
                      <EmptyState
                        icon={<TrendingUp className="w-10 h-10 text-text-subtle" />}
                        title="Không có điều chỉnh phạm vi"
                        description="Nhiệm vụ này không có đề xuất thay đổi phạm vi công việc hoặc bổ sung ngân sách."
                      />
                    ) : (
                      <div className="space-y-3">
                        {detail.amendmentHistory.map((amd: any) => (
                          <div key={amd.id} className="p-4 rounded-2xl border border-border bg-surface-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary-solid">AMENDMENT v{amd.version}</span>
                                <Badge tone={amd.status === 'APPLIED' ? 'success' : amd.status === 'REJECTED' ? 'danger' : 'gold'}>
                                  {amd.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-text-subtle">{formatDateTime(amd.createdAt)}</span>
                            </div>
                            <p className="text-xs text-text-muted">
                              Bổ sung kinh phí:{' '}
                              <strong className="text-success font-bold">+{formatVnd(amd.additionalAmount)}</strong>
                            </p>
                            {amd.newScope && (
                              <div className="text-xs text-text p-3 rounded-xl bg-surface border border-border">
                                <p className="font-semibold text-text-subtle mb-1">Phạm vi công việc mới:</p>
                                <p>{amd.newScope}</p>
                              </div>
                            )}
                            <p className="text-xs text-text">
                              <span className="text-text-subtle">Lý do điều chỉnh: </span>
                              {amd.reason || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Lịch sử vé tranh chấp & phán quyết */}
                {activeTab === 'disputes' && (
                  <div className="space-y-3">
                    {(!detail.disputeTickets || detail.disputeTickets.length === 0) ? (
                      <EmptyState
                        icon={<Scale className="w-10 h-10 text-text-subtle" />}
                        title="Không có vé tranh chấp"
                        description="Nhiệm vụ này chưa từng phát sinh tranh chấp hoặc yêu cầu phán quyết hòa giải từ Admin."
                      />
                    ) : (
                      <div className="space-y-4">
                        {detail.disputeTickets.map((t: any) => (
                          <div key={t.id} className="p-4 rounded-2xl border border-border bg-surface-2 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/admin/mentoring-tickets?keyword=${encodeURIComponent(String(t.ticketCode))}`}
                                  className="font-mono text-xs font-bold text-primary-solid hover:underline"
                                >
                                  TICKET #{t.ticketCode}
                                </Link>
                                <Badge tone={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_REVIEW' ? 'gold' : 'danger'}>
                                  {t.status}
                                </Badge>
                                {t.decision && (
                                  <Badge tone="brand">Phán quyết: {t.decision}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-text-subtle">{formatDateTime(t.createdAt)}</span>
                            </div>

                            <p className="text-sm font-semibold text-text">{t.title}</p>
                            <p className="text-xs text-text-muted">{t.description}</p>

                            {/* Khối phán quyết chi tiền của Admin nếu đã RESOLVED */}
                            {t.status === 'RESOLVED' && (
                              <div className="p-3.5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-800/50 space-y-2">
                                <p className="text-xs font-bold text-primary-solid uppercase tracking-wide">
                                  Kết quả quyết toán phân bổ tiền Escrow
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="p-2.5 bg-surface dark:bg-bg rounded-xl border border-border">
                                    <span className="text-text-subtle block text-xs">Chi Cố vấn:</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400 block text-sm mt-0.5">
                                      {formatVnd(t.mentorAmount)}
                                    </span>
                                  </div>
                                  <div className="p-2.5 bg-surface dark:bg-bg rounded-xl border border-border">
                                    <span className="text-text-subtle block text-xs">Hoàn Học viên:</span>
                                    <span className="font-bold text-warning block text-sm mt-0.5">
                                      {formatVnd(t.studentRefund)}
                                    </span>
                                  </div>
                                  <div className="p-2.5 bg-surface dark:bg-bg rounded-xl border border-border">
                                    <span className="text-text-subtle block text-xs">Phí xử lý:</span>
                                    <span className="font-bold text-text block text-sm mt-0.5">
                                      {formatVnd(t.disputeFee)}
                                    </span>
                                  </div>
                                </div>
                                {t.resolutionNote && (
                                  <p className="text-xs text-text-muted">
                                    <strong className="text-text">Căn cứ giải quyết: </strong>
                                    {t.resolutionNote}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border bg-surface-2 dark:bg-[#1f2123] shrink-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-surface hover:bg-surface-2 text-text-muted border border-border-strong font-semibold shadow-2xs"
          >
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  )
}
