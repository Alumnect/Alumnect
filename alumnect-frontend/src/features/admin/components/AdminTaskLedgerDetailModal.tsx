import { useState } from 'react'
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
import { Badge, Card, EmptyState, Skeleton } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { useAdminTaskFundDetail } from '../hooks/useAdmin'

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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Thu ký quỹ (Escrow)
          </span>
        )
      case 'PAYOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            <ArrowUpRight className="w-3.5 h-3.5" /> Chi trả Cố vấn
          </span>
        )
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <RotateCcw className="w-3.5 h-3.5" /> Hoàn trả Học viên
          </span>
        )
      case 'TOP_UP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Clock className="w-3.5 h-3.5" /> Đang chờ
          </span>
        )
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" /> Thất bại
          </span>
        )
      default:
        return <span className="text-xs text-muted-foreground">{status}</span>
    }
  }

  const summary = detail?.summary

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-background rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary">TASK #{taskId}</span>
                {summary && renderTaskStatusBadge(summary.taskStatus)}
                {summary && renderSettlementBadge(summary.settlementStatus)}
              </div>
              <h2 className="text-lg font-bold text-foreground truncate max-w-xl">
                {summary ? summary.taskTitle : `Sổ quỹ Mentoring Task #${taskId}`}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          )}

          {isError && (
            <div className="p-6 text-center space-y-3 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
              <AlertTriangle className="w-8 h-8 mx-auto" />
              <p className="font-semibold">Lỗi tải dữ liệu sổ quỹ của Task: {(error as any)?.message || 'Vui lòng thử lại.'}</p>
              <Button size="sm" variant="secondary" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          )}

          {summary && (
            <>
              {/* Thông tin đối tượng tham gia & Hạn chót */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-sm font-bold">
                    HV
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Học viên (Student)</p>
                    <p className="text-sm font-semibold text-foreground truncate">{summary.student?.fullName || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{summary.student?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-center text-sm font-bold">
                    CV
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Cố vấn (Mentor)</p>
                    <p className="text-sm font-semibold text-foreground truncate">{summary.mentor?.fullName || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate">{summary.mentor?.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">Hạn chót hoàn thành</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateTime(summary.currentDeadline)}</p>
                    <p className="text-xs text-muted-foreground">Khởi tạo: {formatDateTime(summary.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Bảng cân đối dòng tiền Task (KPI Cards) */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Card className="p-3.5 bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/20">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Tổng thu ký quỹ</span>
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatVnd(summary.totalCollected)}
                  </p>
                  {summary.totalTopUpAmount > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Đã gồm +{formatVnd(summary.totalTopUpAmount)} bổ sung
                    </p>
                  )}
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-blue-500/10 via-card to-card border-blue-500/20">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Đang giữ Escrow</span>
                    <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {formatVnd(summary.escrowHoldingAmount)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {summary.lockedAmount > 0 ? `Đang khóa tranh chấp: ${formatVnd(summary.lockedAmount)}` : 'Sẵn sàng giải ngân'}
                  </p>
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-purple-500/10 via-card to-card border-purple-500/20">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Đã chi Cố vấn</span>
                    <ArrowUpRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {formatVnd(summary.totalPayout)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Thù lao Mentoring</p>
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-amber-500/10 via-card to-card border-amber-500/20">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Đã hoàn Học viên</span>
                    <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {formatVnd(summary.totalRefund)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Hoàn tiền giải quyết</p>
                </Card>

                <Card className="p-3.5 bg-gradient-to-br from-zinc-500/10 via-card to-card border-border">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">Phí nền tảng/Hòa giải</span>
                    <ShieldCheck className="w-4 h-4 text-zinc-500" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-foreground mt-1">
                    {formatVnd(summary.platformFee)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Thu phí xử lý vé</p>
                </Card>
              </div>

              {/* Tabs Lịch sử giao dịch & Tài liệu liên quan */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('ledgers')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'ledgers'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Sổ quỹ giao dịch ({detail.ledgers?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('extensions')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'extensions'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    Gia hạn thời hạn ({detail.extensionHistory?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('amendments')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'amendments'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Điều chỉnh & Bổ sung quỹ ({detail.amendmentHistory?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveTab('disputes')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      activeTab === 'disputes'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    Vé tranh chấp & Phán quyết ({detail.disputeTickets?.length || 0})
                  </button>
                </div>

                {/* TAB 1: Sổ quỹ giao dịch (Ledgers Table) */}
                {activeTab === 'ledgers' && (
                  <div className="space-y-3">
                    {(!detail.ledgers || detail.ledgers.length === 0) ? (
                      <EmptyState
                        icon={<Wallet className="w-10 h-10 text-muted-foreground" />}
                        title="Chưa có giao dịch sổ quỹ"
                        description="Chưa có bút toán thu/chi nào được ghi nhận cho nhiệm vụ Mentoring này."
                      />
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-muted/70 text-xs font-semibold text-muted-foreground uppercase border-b border-border">
                            <tr>
                              <th className="px-4 py-3">Mã GD</th>
                              <th className="px-4 py-3">Thời gian</th>
                              <th className="px-4 py-3">Loại giao dịch</th>
                              <th className="px-4 py-3">Số tiền</th>
                              <th className="px-4 py-3">Trạng thái</th>
                              <th className="px-4 py-3">Mã đối soát / Snapshot</th>
                              <th className="px-4 py-3">Ghi chú</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {detail.ledgers.map((l) => (
                              <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 font-mono font-medium text-xs text-foreground">
                                  #{l.id}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDateTime(l.createdAt)}
                                </td>
                                <td className="px-4 py-3">
                                  {renderLedgerTypeBadge(l.transactionType)}
                                </td>
                                <td className="px-4 py-3 font-bold text-sm">
                                  <span
                                    className={
                                      l.transactionType === 'ESCROW_COLLECTION' || l.transactionType === 'TOP_UP'
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : l.transactionType === 'PAYOUT'
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                    }
                                  >
                                    {l.transactionType === 'PAYOUT' || l.transactionType === 'REFUND' ? '-' : '+'}
                                    {formatVnd(l.amount)}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {renderLedgerStatusBadge(l.status)}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="space-y-0.5">
                                    <p className="font-mono text-xs text-foreground truncate max-w-[200px]" title={l.providerReference || '—'}>
                                      Ref: {l.providerReference || '—'}
                                    </p>
                                    {l.deadlineSnapshot && (
                                      <p className="text-[11px] text-muted-foreground">
                                        DL: {formatDateTime(l.deadlineSnapshot)}
                                      </p>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate" title={l.note || ''}>
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
                        icon={<Clock className="w-10 h-10 text-muted-foreground" />}
                        title="Không có yêu cầu gia hạn"
                        description="Nhiệm vụ này chưa từng có đề xuất gia hạn thời hạn từ phía Học viên hoặc Cố vấn."
                      />
                    ) : (
                      <div className="space-y-3">
                        {detail.extensionHistory.map((ext: any) => (
                          <div key={ext.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">TICKET GIA HẠN #{ext.id}</span>
                                <Badge tone={ext.status === 'CONFIRMED' ? 'success' : ext.status === 'REJECTED' ? 'danger' : 'gold'}>
                                  {ext.status === 'CONFIRMED' ? 'Đã duyệt' : ext.status === 'REJECTED' ? 'Bị từ chối' : 'Chờ phản hồi'}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDateTime(ext.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Người gửi đề xuất:{' '}
                              <strong className="text-foreground">{ext.createdByName || '—'}</strong> ({ext.createdByRole})
                            </p>
                            <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/30 rounded-lg text-xs">
                              <div>
                                <span className="text-muted-foreground">Hạn chót cũ: </span>
                                <span className="font-medium text-foreground">{formatDateTime(ext.currentDeadline)}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hạn chót đề xuất: </span>
                                <span className="font-bold text-primary">{formatDateTime(ext.proposedDeadline)}</span>
                              </div>
                            </div>
                            <p className="text-xs text-foreground">
                              <span className="text-muted-foreground">Lý do: </span>
                              {ext.reason || '—'}
                            </p>
                            {ext.responseNote && (
                              <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded">
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
                        icon={<TrendingUp className="w-10 h-10 text-muted-foreground" />}
                        title="Không có điều chỉnh phạm vi"
                        description="Nhiệm vụ này không có đề xuất thay đổi phạm vi công việc hoặc bổ sung ngân sách."
                      />
                    ) : (
                      <div className="space-y-3">
                        {detail.amendmentHistory.map((amd: any) => (
                          <div key={amd.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">AMENDMENT v{amd.version}</span>
                                <Badge tone={amd.status === 'APPLIED' ? 'success' : amd.status === 'REJECTED' ? 'danger' : 'gold'}>
                                  {amd.status}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDateTime(amd.createdAt)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Bổ sung kinh phí:{' '}
                              <strong className="text-emerald-600 font-bold">+{formatVnd(amd.additionalAmount)}</strong>
                            </p>
                            {amd.newScope && (
                              <div className="text-xs text-foreground p-2 rounded bg-muted/30">
                                <p className="font-semibold text-muted-foreground mb-1">Phạm vi công việc mới:</p>
                                <p>{amd.newScope}</p>
                              </div>
                            )}
                            <p className="text-xs text-foreground">
                              <span className="text-muted-foreground">Lý do điều chỉnh: </span>
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
                        icon={<Scale className="w-10 h-10 text-muted-foreground" />}
                        title="Không có vé tranh chấp"
                        description="Nhiệm vụ này chưa từng phát sinh tranh chấp hoặc yêu cầu phán quyết hòa giải từ Admin."
                      />
                    ) : (
                      <div className="space-y-4">
                        {detail.disputeTickets.map((t: any) => (
                          <div key={t.id} className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">TICKET #{t.ticketCode}</span>
                                <Badge tone={t.status === 'RESOLVED' ? 'success' : t.status === 'IN_REVIEW' ? 'gold' : 'danger'}>
                                  {t.status}
                                </Badge>
                                {t.decision && (
                                  <Badge tone="brand">Phán quyết: {t.decision}</Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</span>
                            </div>

                            <p className="text-sm font-semibold text-foreground">{t.title}</p>
                            <p className="text-xs text-muted-foreground">{t.description}</p>

                            {/* Khối phán quyết chi tiền của Admin nếu đã RESOLVED */}
                            {t.status === 'RESOLVED' && (
                              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                                <p className="text-xs font-bold text-primary uppercase tracking-wide">
                                  Kết quả quyết toán phân bổ tiền Escrow (UC120)
                                </p>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div className="p-2 bg-background rounded-lg border border-border">
                                    <span className="text-muted-foreground">Chi Cố vấn: </span>
                                    <span className="font-bold text-purple-600 block text-sm mt-0.5">
                                      {formatVnd(t.mentorAmount)}
                                    </span>
                                  </div>
                                  <div className="p-2 bg-background rounded-lg border border-border">
                                    <span className="text-muted-foreground">Hoàn Học viên: </span>
                                    <span className="font-bold text-amber-600 block text-sm mt-0.5">
                                      {formatVnd(t.studentRefund)}
                                    </span>
                                  </div>
                                  <div className="p-2 bg-background rounded-lg border border-border">
                                    <span className="text-muted-foreground">Phí xử lý: </span>
                                    <span className="font-bold text-foreground block text-sm mt-0.5">
                                      {formatVnd(t.disputeFee)}
                                    </span>
                                  </div>
                                </div>
                                {t.resolutionNote && (
                                  <p className="text-xs text-muted-foreground">
                                    <strong className="text-foreground">Căn cứ giải quyết: </strong>
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
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-border bg-card/60">
          <Button variant="secondary" onClick={onClose}>
            Đóng cửa sổ
          </Button>
        </div>
      </div>
    </div>
  )
}
