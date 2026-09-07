import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Inbox, Eye, EyeOff, X,
  Flag, ShieldAlert, Check, Ban,
  Filter, Sparkles, CheckCircle2, ChevronRight,
  Trash2, Info, UserX, HelpCircle, Radio, MessageSquare
} from 'lucide-react'
import { PageHeader, Badge, Card, Avatar, EmptyState, Skeleton, toast } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { Reveal } from '@/components/motion'
import { cn } from '@/lib/utils'
import {
  useAdminAnswerReports,
  useUpdateAnswerReportStatus,
  useWebSocketViolatingAnswers,
} from '../hooks/useAdmin'
import type { AdminAnswerReportDto } from '../api/adminApi'

/** Nhãn hiển thị cho các lý do báo cáo vi phạm */
const REASON_LABELS: Record<string, { label: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }> = {
  SPAM: { label: 'Spam / Rác', tone: 'neutral' },
  INAPPROPRIATE: { label: 'Nội dung không phù hợp', tone: 'danger' },
  MISINFORMATION: { label: 'Sai lệch thông tin', tone: 'gold' },
  SCAM_OR_FRAUD: { label: 'Lừa đảo & Giả mạo', tone: 'danger' },
  OTHER: { label: 'Lý do khác', tone: 'neutral' },
}

type ReasonKey = 'ALL' | 'SPAM' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'SCAM_OR_FRAUD' | 'OTHER'

interface ReasonConfig {
  value: ReasonKey
  label: string
  icon: React.ElementType
  colorHex: string
  hoverBg: string
}

const REASON_CONFIG: Record<ReasonKey, ReasonConfig> = {
  ALL: {
    value: 'ALL',
    label: 'Tất cả lý do',
    icon: Filter,
    colorHex: '#F27024',
    hoverBg: 'hover:bg-brand-50 hover:text-brand-900',
  },
  SPAM: {
    value: 'SPAM',
    label: 'Spam / Rác',
    icon: Trash2,
    colorHex: '#64748B',
    hoverBg: 'hover:bg-slate-50 hover:text-slate-900',
  },
  INAPPROPRIATE: {
    value: 'INAPPROPRIATE',
    label: 'Nội dung không phù hợp',
    icon: Ban,
    colorHex: '#EF4444',
    hoverBg: 'hover:bg-red-50 hover:text-red-900',
  },
  MISINFORMATION: {
    value: 'MISINFORMATION',
    label: 'Sai lệch thông tin',
    icon: Info,
    colorHex: '#F59E0B',
    hoverBg: 'hover:bg-amber-50 hover:text-amber-900',
  },
  SCAM_OR_FRAUD: {
    value: 'SCAM_OR_FRAUD',
    label: 'Lừa đảo & Giả mạo',
    icon: UserX,
    colorHex: '#DC2626',
    hoverBg: 'hover:bg-rose-50 hover:text-rose-900',
  },
  OTHER: {
    value: 'OTHER',
    label: 'Lý do khác',
    icon: HelpCircle,
    colorHex: '#6366F1',
    hoverBg: 'hover:bg-indigo-50 hover:text-indigo-900',
  },
}

interface CustomReasonDropdownProps {
  value: string
  onChange: (val: string) => void
}

/** Component Dropdown chọn lý do vi phạm được tùy chỉnh giao diện Pastel */
function CustomReasonDropdown({ value, onChange }: CustomReasonDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedConfig = REASON_CONFIG[value as ReasonKey] || REASON_CONFIG.ALL
  const SelectedIcon = selectedConfig.icon

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-9 items-center justify-between gap-2 rounded-full border bg-brand-50/80 px-3.5 text-xs font-bold text-brand-900 shadow-2xs transition-all duration-200 hover:border-brand-300 focus:outline-none cursor-pointer min-w-[170px]',
          isOpen ? 'ring-2 ring-brand-400/30 border-brand-400 bg-white' : 'border-brand-100 hover:bg-white'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-white shadow-2xs shrink-0"
            style={{ backgroundColor: selectedConfig.colorHex }}
          >
            <SelectedIcon size={11} />
          </span>
          <span className="truncate">{selectedConfig.label}</span>
        </div>
        <ChevronRight
          size={14}
          className={cn('text-brand-400 transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-brand-600' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-2xl border border-plum-900/15 bg-white/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-plum-950/20 animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-plum-400 border-b border-plum-900/5 mb-1 flex items-center justify-between">
            <span>Lọc theo lý do</span>
            <Sparkles size={11} className="text-brand-400" />
          </div>
          <div className="space-y-0.5">
            {(Object.keys(REASON_CONFIG) as ReasonKey[]).map((rKey) => {
              const cfg = REASON_CONFIG[rKey]
              const Icon = cfg.icon
              const isSelected = value === rKey

              return (
                <button
                  key={rKey}
                  type="button"
                  onClick={() => {
                    onChange(rKey)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-brand-500 text-white shadow-sm font-bold'
                      : cn('text-plum-800', cfg.hoverBg)
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-5.5 w-5.5 items-center justify-center rounded-lg text-white shadow-2xs shrink-0 transition-transform',
                        isSelected ? 'scale-105 bg-white/20' : 'opacity-90'
                      )}
                      style={{ backgroundColor: isSelected ? undefined : cfg.colorHex }}
                    >
                      <Icon size={12} />
                    </span>
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="text-white shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Component giao diện kiểm duyệt danh sách câu trả lời vi phạm dành cho Admin (UC79).
 * Tích hợp STOMP WebSocket đẩy dữ liệu real-time khi người dùng gửi báo cáo câu trả lời mới.
 */
export function AdminViolatingAnswersQueue({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING')
  const [reasonFilter, setReasonFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [page, setPage] = useState(0)

  // Kích hoạt kết nối WebSocket STOMP real-time cho danh sách câu trả lời vi phạm
  useWebSocketViolatingAnswers()

  // Tải dữ liệu báo cáo câu trả lời từ backend
  const { data: reportsData, isLoading, error } = useAdminAnswerReports({
    status: statusFilter,
    reason: reasonFilter === 'ALL' ? undefined : reasonFilter,
    query: searchQuery || undefined,
    page,
    size: 10,
  })

  const updateStatusMutation = useUpdateAnswerReportStatus()

  // State quản lý modal chi tiết báo cáo được chọn
  const [selectedReport, setSelectedReport] = useState<AdminAnswerReportDto | null>(null)

  // Lưu trạng thái muốn ẩn câu trả lời hay không (true = sẽ ẩn, false = không ẩn)
  const [willHideMap, setWillHideMap] = useState<Record<number, boolean>>({})

  // Popup xác nhận thao tác
  const [confirmAction, setConfirmAction] = useState<{
    type: 'RESOLVE' | 'DISMISS'
    id: number
  } | null>(null)

  useEffect(() => {
    if (selectedReport || confirmAction) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [selectedReport, confirmAction])

  const triggerResolveConfirm = (id: number) => {
    setConfirmAction({ type: 'RESOLVE', id })
  }

  const triggerDismissConfirm = (id: number) => {
    setConfirmAction({ type: 'DISMISS', id })
  }

  /** Lấy trạng thái muốn ẩn câu trả lời hiện tại cho modal được chọn */
  const getSelectedReportWillHide = () => {
    if (!selectedReport) return false
    if (willHideMap[selectedReport.id] !== undefined) {
      return willHideMap[selectedReport.id]
    }
    return selectedReport.answerStatus === 'HIDDEN'
  }

  /** Chuyển đổi trạng thái đánh dấu ẩn/mở ẩn câu trả lời trong local state modal */
  const toggleSelectedReportWillHide = () => {
    if (!selectedReport) return
    const current = getSelectedReportWillHide()
    setWillHideMap((prev) => ({
      ...prev,
      [selectedReport.id]: !current,
    }))
  }

  /** Thực thi xử lý giải quyết / bỏ qua báo cáo */
  const executeConfirmAction = async () => {
    if (!confirmAction || !selectedReport) return
    const { type, id } = confirmAction
    const willHide = getSelectedReportWillHide()

    try {
      if (type === 'RESOLVE') {
        await updateStatusMutation.mutateAsync({
          id,
          payload: { status: 'RESOLVED', hideAnswer: willHide },
        })
        toast.success(
          willHide
            ? 'Đã giải quyết báo cáo và ẩn câu trả lời vi phạm.'
            : 'Đã giải quyết báo cáo và công khai lại câu trả lời.'
        )
      } else {
        await updateStatusMutation.mutateAsync({
          id,
          payload: { status: 'DISMISSED', hideAnswer: false },
        })
        toast.success('Đã bỏ qua báo cáo vi phạm câu trả lời này.')
      }
      setSelectedReport(null)
      setConfirmAction(null)
    } catch (err: any) {
      toast.error(err?.message || 'Có lỗi xảy ra khi cập nhật trạng thái báo cáo.')
      setConfirmAction(null)
    }
  }

  const reports = reportsData?.content || []
  const totalPages = reportsData?.totalPages || 0
  const totalElements = reportsData?.totalElements || 0
  const activeWillHide = getSelectedReportWillHide()

  return (
    <div className="mx-auto max-w-6xl">
      {/* Tiêu đề trang */}
      {!hideHeader && (
        <div className="mb-4">
          <PageHeader
            title="Kiểm duyệt câu trả lời vi phạm"
            subtitle="Quản lý và xử lý các báo cáo vi phạm câu trả lời trên diễn đàn Q&A từ cộng đồng AlumNect."
          />
        </div>
      )}

      {/* Thanh bộ lọc & Tìm kiếm */}
      <Card hover={false} className="mb-6 p-4 border border-plum-900/10 bg-white !overflow-visible relative z-20">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">

          {/* Các tab trạng thái */}
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
            <CustomReasonDropdown
              value={reasonFilter}
              onChange={(val) => {
                setReasonFilter(val)
                setPage(0)
              }}
            />

            <input
              type="text"
              placeholder="Tìm câu trả lời, câu hỏi, tác giả, người báo cáo..."
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
          Tổng số: <strong className="text-plum-900 font-bold">{totalElements}</strong> báo cáo câu trả lời
        </div>
      </Card>

      {/* Danh sách bảng báo cáo */}
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
            title="Lỗi tải danh sách báo cáo câu trả lời"
            description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
          />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<Inbox size={24} />}
            title="Không có báo cáo câu trả lời nào"
            description={`Không tìm thấy báo cáo câu trả lời nào ở trạng thái ${statusFilter === 'PENDING' ? 'chờ xử lý' : statusFilter === 'RESOLVED' ? 'đã giải quyết' : 'đã bỏ qua'
              }.`}
          />
        ) : (
          <div className="space-y-4">
            <Card hover={false} className="overflow-x-auto border border-plum-900/10 bg-white rounded-3xl">
              <table className="w-full min-w-[760px] text-sm text-left">
                <thead>
                  <tr className="border-b border-plum-900/8 text-xs uppercase tracking-wider text-plum-400 bg-plum-900/[0.02]">
                    <th className="px-5 py-3.5 font-bold">Người gửi báo cáo</th>
                    <th className="px-5 py-3.5 font-bold">Lý do</th>
                    <th className="px-5 py-3.5 font-bold">Tác giả & Nội dung câu trả lời</th>
                    <th className="px-5 py-3.5 font-bold text-center">Trạng thái câu trả lời</th>
                    <th className="px-5 py-3.5 font-bold text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-plum-900/5">
                  {reports.map((r) => {
                    const reasonInfo = REASON_LABELS[r.reason] || { label: r.reason, tone: 'neutral' }
                    const localWillHide = willHideMap[r.id]
                    const currentStatus = localWillHide !== undefined
                      ? (localWillHide ? 'HIDDEN' : 'ACTIVE')
                      : r.answerStatus

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

                        {/* Tác giả & Nội dung câu trả lời */}
                        <td className="px-5 py-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-plum-400 font-medium">Bởi:</span>
                              <span className="text-xs font-bold text-plum-900 truncate">{r.answerAuthorName}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-brand-600 truncate max-w-[280px]">
                              <MessageSquare size={11} className="shrink-0" />
                              <span className="truncate">{r.questionTitle}</span>
                            </div>
                            <p className="text-xs font-medium text-plum-800 truncate mt-1 max-w-[280px] bg-brand-50/50 p-1.5 rounded-md border border-brand-100/40">
                              {r.answerContent}
                            </p>
                          </div>
                        </td>

                        {/* Trạng thái câu trả lời */}
                        <td className="px-5 py-4 text-center">
                          {currentStatus === 'HIDDEN' ? (
                            <Badge tone="danger">Đã ẩn{localWillHide !== undefined && ' *'}</Badge>
                          ) : currentStatus === 'DELETED' ? (
                            <Badge tone="neutral">Đã xóa</Badge>
                          ) : (
                            <Badge tone="success">Công khai{localWillHide !== undefined && ' *'}</Badge>
                          )}
                        </td>

                        {/* Hành động */}
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

      {/* Modal chi tiết báo cáo câu trả lời vi phạm */}
      {selectedReport && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-plum-950/40 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
            onClick={() => setSelectedReport(null)}
          />

          {/* Modal Container */}
          <Card hover={false} className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-plum-950/15 shadow-2xl bg-white max-h-[90vh] flex flex-col pop">

            {/* Header Modal */}
            <div className="relative bg-gradient-to-r from-brand-500 to-violet-500 p-5 text-white flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2 border border-white/25">
                  <Flag size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Chi tiết báo cáo câu trả lời vi phạm</h3>
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

            {/* Body Modal */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">

              {/* Thông tin người gửi báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Thông tin người báo cáo
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

              {/* Thông tin câu hỏi gốc liên quan */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
                    <MessageSquare size={13} /> Câu hỏi liên quan
                  </h4>
                  {selectedReport.questionAuthorName && (
                    <span className="text-[11px] text-plum-500 font-semibold">
                      Người hỏi: <strong className="text-plum-900 font-bold">{selectedReport.questionAuthorName}</strong>
                    </span>
                  )}
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-brand-100 space-y-1.5">
                  <h5 className="text-xs font-extrabold text-plum-950 flex items-start gap-1.5">
                    <span className="text-brand-500 font-black shrink-0">Hỏi:</span>
                    <span>{selectedReport.questionTitle}</span>
                  </h5>
                  {selectedReport.questionBody && (
                    <p className="text-xs text-plum-700 font-medium whitespace-pre-wrap leading-relaxed border-t border-plum-100/70 pt-2">
                      {selectedReport.questionBody}
                    </p>
                  )}
                </div>
              </div>

              {/* Thông tin câu trả lời bị báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Câu trả lời bị báo cáo (Tác giả: {selectedReport.answerAuthorName})
                  </h4>
                </div>

                <div className="bg-white p-4 rounded-xl border border-brand-100 space-y-2 max-h-56 overflow-y-auto">
                  <span className="text-xs text-plum-400 block font-medium">Nội dung câu trả lời:</span>
                  <p className="text-xs text-plum-900 font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedReport.answerContent}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-medium border-t border-brand-100/50 pt-2">
                  <div>
                    <span className="text-plum-400 block">Email tác giả câu trả lời</span>
                    <span className="font-bold text-plum-900">{selectedReport.answerAuthorEmail}</span>
                  </div>
                  <div>
                    <span className="text-plum-400 block">Trạng thái câu trả lời gốc</span>
                    {selectedReport.answerStatus === 'HIDDEN' ? (
                      <Badge tone="danger">Đang bị ẩn</Badge>
                    ) : selectedReport.answerStatus === 'DELETED' ? (
                      <Badge tone="neutral">Đã xóa</Badge>
                    ) : (
                      <Badge tone="success">Đang công khai</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Nút thao tác xử lý báo cáo */}
              <div className="pt-4 border-t border-plum-900/8 flex flex-col sm:flex-row gap-2 justify-between items-center">

                {/* Đánh dấu Ẩn / Mở ẩn câu trả lời */}
                {selectedReport.answerStatus !== 'DELETED' && selectedReport.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    onClick={toggleSelectedReportWillHide}
                    className={cn(
                      "w-full sm:w-auto font-bold text-xs rounded-full cursor-pointer transition-all",
                      activeWillHide
                        ? "border border-green-200 text-green-600 hover:bg-green-50"
                        : "border border-red-200 text-red-600 hover:bg-red-50"
                    )}
                  >
                    {activeWillHide ? (
                      <span className="inline-flex items-center gap-1"><Eye size={12} /> Hủy ẩn câu trả lời (Giữ công khai)</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><EyeOff size={12} /> Đánh dấu ẩn câu trả lời này</span>
                    )}
                  </Button>
                )}

                {/* Giải quyết / Bỏ qua */}
                {selectedReport.status === 'PENDING' ? (
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => triggerDismissConfirm(selectedReport.id)}
                      className="w-full sm:w-auto font-bold text-xs rounded-full border border-plum-200 hover:bg-plum-50 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1"><Ban size={12} /> Bỏ qua báo cáo</span>
                    </Button>
                    <Button
                      onClick={() => triggerResolveConfirm(selectedReport.id)}
                      className="w-full sm:w-auto font-bold text-xs rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm cursor-pointer hover-sheen"
                    >
                      <span className="inline-flex items-center gap-1"><Check size={12} /> Đã giải quyết</span>
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-plum-400">
                    Báo cáo này đã ở trạng thái:{' '}
                    <span className="text-plum-900 font-extrabold">
                      {selectedReport.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã bỏ qua'}
                    </span>
                  </div>
                )}

              </div>

            </div>
          </Card>
        </div>,
        document.body
      )}

      {/* Popup xác nhận thao tác */}
      {confirmAction && createPortal(
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-plum-950/30 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setConfirmAction(null)}
          />

          <Card hover={false} className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-plum-950/15 shadow-2xl bg-white p-6 pop">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-brand-50 p-3 border border-brand-100 text-brand-500 animate-breathe">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-plum-950">
                  {confirmAction.type === 'RESOLVE' && 'Giải quyết báo cáo câu trả lời'}
                  {confirmAction.type === 'DISMISS' && 'Bỏ qua báo cáo câu trả lời'}
                </h3>
                <p className="text-xs text-plum-500 font-semibold leading-relaxed">
                  {confirmAction.type === 'RESOLVE' && (
                    activeWillHide
                      ? 'Bạn có chắc muốn ẩn câu trả lời vi phạm này không?'
                      : 'Bạn có chắc muốn giữ công khai câu trả lời này không?'
                  )}
                  {confirmAction.type === 'DISMISS' && 'Bạn có chắc muốn bỏ qua báo cáo này không?'}
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 font-bold text-xs rounded-full border border-plum-200 hover:bg-plum-50 cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={executeConfirmAction}
                  className="flex-1 font-bold text-xs rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:from-brand-600 hover:to-brand-700 shadow-sm cursor-pointer hover-sheen"
                >
                  Xác nhận
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
