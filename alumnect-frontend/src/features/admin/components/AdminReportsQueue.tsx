import { useState, useEffect, useRef, useMemo } from 'react'
import { 
  Inbox, Eye, EyeOff, X, 
  Flag, ArrowRight, ShieldAlert, Check, Ban,
  Filter, Sparkles, CheckCircle2, ChevronRight,
  Trash2, Info, UserX, HelpCircle,
  Search, User, RotateCcw, Layers
} from 'lucide-react'
import { Badge, Avatar, EmptyState, Skeleton, toast, Pagination, DialogFrame } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAdminReports, useUpdateReportStatus, useTogglePostHidden } from '../hooks/useAdmin'
import type { AdminReportDto } from '../api/adminApi'
import { CATEGORY_MAP, getCategoryConfig } from './AdminPostsPage'
import type { CategoryKey } from './AdminPostsPage'
import { Client } from '@stomp/stompjs'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

const REASON_LABELS: Record<string, { label: string; tone: 'brand' | 'gold' | 'success' | 'danger' | 'neutral' }> = {
  SPAM: { label: 'Spam / Rác', tone: 'neutral' },
  INAPPROPRIATE: { label: 'Không phù hợp', tone: 'danger' },
  MISINFORMATION: { label: 'Sai lệch thông tin', tone: 'gold' },
  SCAM_OR_FRAUD: { label: 'Lừa đảo & Giả mạo', tone: 'danger' },
  OTHER: { label: 'Lý do khác', tone: 'neutral' },
}

export type ReasonKey = 'ALL' | 'SPAM' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'SCAM_OR_FRAUD' | 'OTHER'

export interface ReasonConfig {
  value: ReasonKey
  label: string
  icon: React.ElementType
  colorHex: string
  hoverBg: string
}

export const REASON_CONFIG: Record<ReasonKey, ReasonConfig> = {
  ALL: {
    value: 'ALL',
    label: 'Tất cả lý do',
    icon: Filter,
    colorHex: '#4A1525',
    hoverBg: 'hover:bg-surface-3 hover:text-text',
  },
  SPAM: {
    value: 'SPAM',
    label: 'Spam / Rác',
    icon: Trash2,
    colorHex: '#64748B',
    hoverBg: 'hover:bg-surface-2 hover:text-text',
  },
  INAPPROPRIATE: {
    value: 'INAPPROPRIATE',
    label: 'Nội dung không phù hợp',
    icon: Ban,
    colorHex: '#EF4444',
    hoverBg: 'hover:bg-danger-soft hover:text-danger',
  },
  MISINFORMATION: {
    value: 'MISINFORMATION',
    label: 'Sai lệch thông tin',
    icon: Info,
    colorHex: '#F59E0B',
    hoverBg: 'hover:bg-warning-soft hover:text-warning',
  },
  SCAM_OR_FRAUD: {
    value: 'SCAM_OR_FRAUD',
    label: 'Lừa đảo & Giả mạo',
    icon: UserX,
    colorHex: '#DC2626',
    hoverBg: 'hover:bg-danger-soft hover:text-danger',
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
          'flex h-10 items-center justify-between gap-2.5 rounded-2xl border bg-surface px-3.5 text-xs font-bold text-text shadow-2xs transition duration-200 hover:border-gold-400 focus:outline-none cursor-pointer min-w-[190px]',
          isOpen ? 'ring-2 ring-gold-400/40 border-gold-400 bg-surface-2' : 'border-border-strong hover:bg-surface-2'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-white shadow-2xs shrink-0"
            style={{ backgroundColor: selectedConfig.colorHex }}
          >
            <SelectedIcon size={12} />
          </span>
          <span className="truncate">{selectedConfig.label}</span>
        </div>
        <ChevronRight
          size={14}
          className={cn('text-text-subtle transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-text-muted' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-2xl border border-border-strong bg-surface backdrop-blur-xl p-1.5 shadow-2xl shadow-plum-950/20 animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-subtle border-b border-border mb-1 flex items-center justify-between">
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
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-primary-solid text-on-primary shadow-sm font-bold'
                      : cn('text-text', cfg.hoverBg)
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex h-5.5 w-5.5 items-center justify-center rounded-lg text-white shadow-2xs shrink-0 transition-transform',
                        isSelected ? 'scale-105 bg-plum-950/20 text-text' : 'opacity-90'
                      )}
                      style={{ backgroundColor: isSelected ? undefined : cfg.colorHex }}
                    >
                      <Icon size={12} />
                    </span>
                    <span>{cfg.label}</span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} className="text-text shrink-0 ml-2" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface CustomCategoryDropdownProps {
  value: CategoryKey
  onChange: (val: CategoryKey) => void
}

function CustomCategoryDropdown({ value, onChange }: CustomCategoryDropdownProps) {
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

  const selectedCfg = CATEGORY_MAP[value] || CATEGORY_MAP.ALL
  const SelectedIcon = selectedCfg.icon

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 items-center justify-between gap-2 rounded-xl border bg-surface px-3 text-xs font-bold text-text shadow-2xs transition duration-200 hover:border-primary-solid focus:outline-none cursor-pointer min-w-[160px]',
          isOpen ? 'ring-2 ring-primary-500/20 border-primary-solid bg-surface-2' : 'border-border hover:bg-surface-2'
        )}
      >
        <div className="flex items-center gap-2 truncate">
          <span
            className="flex h-5 w-5 items-center justify-center rounded-md text-white shadow-2xs shrink-0"
            style={{ backgroundColor: selectedCfg.colorHex }}
          >
            <SelectedIcon size={12} />
          </span>
          <span className="truncate">{selectedCfg.shortLabel}</span>
        </div>
        <ChevronRight
          size={14}
          className={cn('text-text-subtle transition-transform duration-200 shrink-0 ml-1', isOpen ? 'rotate-90 text-text-muted' : 'rotate-0')}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 origin-top-right rounded-2xl border border-border bg-surface backdrop-blur-xl p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95">
          <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-text-subtle border-b border-border mb-1 flex items-center justify-between">
            <span>Loại bài viết</span>
            <Layers size={11} className="text-primary-solid" />
          </div>
          <div className="space-y-0.5">
            {(Object.keys(CATEGORY_MAP) as CategoryKey[]).map((catKey) => {
              const cfg = CATEGORY_MAP[catKey]
              const Icon = cfg.icon
              const isSelected = value === catKey

              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => {
                    onChange(catKey)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition duration-150 text-left cursor-pointer',
                    isSelected
                      ? 'bg-primary-solid text-on-primary shadow-sm font-bold'
                      : 'text-text hover:bg-surface-2'
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-5.5 w-5.5 items-center justify-center rounded-lg text-white shadow-2xs shrink-0"
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

/** Các mức lọc rủi ro; việc lọc do backend thực hiện để phân trang và tổng số luôn đúng. */
const RISK_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'HIGH', label: 'Nguy cơ cao (>=85%)' },
  { key: 'MEDIUM', label: 'Nghi vấn (40-85%)' },
  { key: 'LOW', label: 'An toàn (<40%)' },
] as const

type RiskFilter = (typeof RISK_TABS)[number]['key']

/** Tên hiển thị của người gửi báo cáo; báo cáo tự động không có người gửi. */
const reporterLabel = (report: AdminReportDto) => report.reporterName ?? 'Hệ thống kiểm duyệt'

/** Dòng phụ của người gửi báo cáo. */
const reporterDetail = (report: AdminReportDto) => report.reporterEmail ?? 'Tự động phát hiện'

/** Kiểm tra báo cáo này do AI phát hiện ảnh nhạy cảm/bạo lực (nhị phân, không chấm thang điểm). */
const isImageAiViolation = (report: AdminReportDto) => Boolean(report.detectedKeywords?.includes('[Ảnh vi phạm]'))

export function AdminReportsQueue() {
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | 'DISMISSED'>('PENDING')
  const [reasonFilter, setReasonFilter] = useState<string>('ALL')
  const [typeFilter, setTypeFilter] = useState<CategoryKey>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [authorQuery, setAuthorQuery] = useState<string>('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL')
  const [page, setPage] = useState(0)

  // Fetch reports from backend
  const { data: reportsData, isLoading, error } = useAdminReports({
    status: statusFilter,
    reason: reasonFilter === 'ALL' ? undefined : reasonFilter,
    type: typeFilter === 'ALL' ? undefined : typeFilter,
    query: searchQuery || undefined,
    author: authorQuery || undefined,
    riskLevel: riskFilter === 'ALL' ? undefined : riskFilter,
    page,
    size: 10,
  })

  const updateStatusMutation = useUpdateReportStatus()
  const togglePostHiddenMutation = useTogglePostHidden()

  // Modal Detail state
  const [selectedReport, setSelectedReport] = useState<AdminReportDto | null>(null)
  const [revealMedia, setRevealMedia] = useState(false)

  // Store local will-hide state mapped by report ID to persist state between modal open/close
  const [willHideMap, setWillHideMap] = useState<Record<number, boolean>>({})

  // Custom Confirmation Popup state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'RESOLVE' | 'DISMISS'
    id: number
  } | null>(null)

  useEffect(() => {
    setRevealMedia(false)
  }, [selectedReport?.id])

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

  // Get current state of willHide for the selected report (default to DB state if not toggled yet)
  const getSelectedReportWillHide = () => {
    if (!selectedReport) return false
    if (willHideMap[selectedReport.id] !== undefined) {
      return willHideMap[selectedReport.id]
    }
    return selectedReport.postStatus === 'HIDDEN'
  }

  const toggleSelectedReportWillHide = () => {
    if (!selectedReport) return
    const current = getSelectedReportWillHide()
    setWillHideMap(prev => ({
      ...prev,
      [selectedReport.id]: !current
    }))
  }

  const executeConfirmAction = async () => {
    if (!confirmAction || !selectedReport) return
    const { type, id } = confirmAction

    try {
      if (type === 'RESOLVE') {
        const targetWillHide = getSelectedReportWillHide()
        
        // 1. Chỉ thực hiện ẩn/hiện bài viết thật nếu có sự thay đổi so với trạng thái ban đầu của bài viết
        const originalHidden = selectedReport.postStatus === 'HIDDEN'
        if (targetWillHide !== originalHidden) {
          await togglePostHiddenMutation.mutateAsync({ id: selectedReport.postId, hidden: targetWillHide })
        }
        
        // 2. Cập nhật trạng thái báo cáo sang RESOLVED
        await updateStatusMutation.mutateAsync({ id, status: 'RESOLVED' })
        
        // Clean up map for this report
        setWillHideMap(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        
        setSelectedReport(null)
        toast.success('Đã xử lý báo cáo thành công!')
      } else if (type === 'DISMISS') {
        // Bỏ qua báo cáo; nếu bài bị hệ thống tự ẩn nhầm, backend sẽ khôi phục và báo cho tác giả
        await updateStatusMutation.mutateAsync({ id, status: 'DISMISSED' })
        
        // Clean up map for this report
        setWillHideMap(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })

        setSelectedReport(null)
        toast.success('Đã xử lý báo cáo thành công!')
      }
      setConfirmAction(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi xảy ra khi thực hiện hành động')
      setConfirmAction(null)
    }
  }

  const accessToken = useAuthStore((state) => state.accessToken)
  const queryClient = useQueryClient()

  // Real-time WebSocket listener cho kênh kiểm duyệt Admin
  useEffect(() => {
    if (!accessToken) return

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const wsUrl = apiBase.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '') + '/ws'

    const client = new Client({
      brokerURL: wsUrl,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/admin/moderation-alerts', (msg) => {
          try {
            const data = JSON.parse(msg.body)
            const isImgAlert = Array.isArray(data.detectedKeywords) && data.detectedKeywords.some((k: string) => String(k).includes('[Ảnh vi phạm]'))
            if (data.type === 'CRITICAL_AUTO_HIDDEN') {
              toast.error(
                isImgAlert
                  ? `🚨 CẢNH BÁO: Bài viết #${data.postId || ''} vừa bị AI tự động ẩn do phát hiện hình ảnh nhạy cảm/bạo lực!`
                  : `🚨 CẢNH BÁO: Bài viết #${data.postId || ''} vừa bị tự động ẩn do vi phạm nghiêm trọng (${(data.aiScore * 100).toFixed(0)}%)!`
              )
            } else if (data.type === 'REVIEW_REQUIRED') {
              toast.warning(`⚠️ Báo cáo mới cần duyệt: Báo cáo #${data.reportId} có dấu hiệu nghi vấn (${(data.aiScore * 100).toFixed(0)}%)`)
            }
            queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] })
            queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
          } catch (e) {
            console.error('Lỗi phân tích WebSocket moderation alert:', e)
          }
        })
      },
    })

    client.activate()
    return () => {
      client.deactivate()
    }
  }, [accessToken, queryClient])

  const rawReports = reportsData?.content || []
  const totalPages = reportsData?.totalPages || 0
  const totalElements = reportsData?.totalElements || 0

  // Client-side fallback: Đảm bảo lọc mức rủi ro chính xác 100% theo tiêu chuẩn ModerationRiskLevel
  const reports = useMemo(() => {
    if (riskFilter === 'ALL') return rawReports
    return rawReports.filter((r) => {
      const isHigh = r.riskLevel === 'HIGH' || (r.aiScore != null && r.aiScore >= 0.85) || isImageAiViolation(r)
      const isMedium = !isHigh && (r.riskLevel === 'MEDIUM' || (r.aiScore != null && r.aiScore >= 0.40))
      const isLow = !isHigh && !isMedium
      if (riskFilter === 'HIGH') return isHigh
      if (riskFilter === 'MEDIUM') return isMedium
      if (riskFilter === 'LOW') return isLow
      return true
    })
  }, [rawReports, riskFilter])

  const activeWillHide = getSelectedReportWillHide()

  const hasActiveFilters =
    reasonFilter !== 'ALL' ||
    typeFilter !== 'ALL' ||
    riskFilter !== 'ALL' ||
    Boolean(searchQuery) ||
    Boolean(authorQuery)

  const resetFilters = () => {
    setReasonFilter('ALL')
    setTypeFilter('ALL')
    setRiskFilter('ALL')
    setSearchQuery('')
    setAuthorQuery('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* 1 BẢNG DUY NHẤT (Single Unified Table Card) tích hợp toàn bộ: Header, Filter, Table, Pagination */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        {/* --- Card Header: Tiêu đề trang & Tabs trạng thái xử lý --- */}
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between bg-surface">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-solid">
              <ShieldAlert size={15} /> Kiểm duyệt nội dung cộng đồng
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              Báo cáo vi phạm
            </h1>
            <p className="mt-0.5 text-xs text-text-subtle">
              Giám sát, phân tích rủi ro AI và giải quyết các bài viết bị báo cáo vi phạm tiêu chuẩn cộng đồng.
            </p>
          </div>

          {/* Primary Status Tabs */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1 shadow-2xs self-start sm:self-auto">
            {[
              { key: 'PENDING', label: 'Đang chờ xử lý', countBadge: statusFilter === 'PENDING' ? totalElements : null },
              { key: 'RESOLVED', label: 'Đã giải quyết', countBadge: statusFilter === 'RESOLVED' ? totalElements : null },
              { key: 'DISMISSED', label: 'Đã bỏ qua', countBadge: statusFilter === 'DISMISSED' ? totalElements : null },
            ].map((tab) => {
              const isActive = statusFilter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.key as any)
                    setPage(0)
                  }}
                  className={cn(
                    'relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-150 cursor-pointer select-none',
                    isActive
                      ? 'bg-primary-solid text-on-primary shadow-raised font-extrabold'
                      : 'text-text-muted hover:bg-surface hover:text-text'
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.countBadge !== null && tab.countBadge !== undefined && tab.countBadge > 0 && (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none',
                        isActive ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary-solid'
                      )}
                    >
                      {tab.countBadge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* --- Toolbar: Tìm kiếm, Bộ lọc Dropdown & Mức rủi ro AI --- */}
        <div className="border-b border-border bg-surface-2/40 p-4 space-y-3.5">
          {/* Row 1: Search Inputs & Faceted Dropdowns */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:flex-wrap">
            {/* Search Content */}
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm nội dung bài viết..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Tìm kiếm nội dung bài viết..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Search Author */}
            <div className="relative w-full sm:w-56">
              <User size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle" />
              <input
                aria-label="Tìm tác giả, email..."
                value={authorQuery}
                onChange={(e) => {
                  setAuthorQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Tác giả, email..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-8 text-xs text-text placeholder:text-text-subtle focus:border-primary-solid focus:outline-none transition shadow-2xs"
              />
              {authorQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthorQuery('')
                    setPage(0)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Reason Dropdown */}
            <CustomReasonDropdown
              value={reasonFilter}
              onChange={(newReason) => {
                setReasonFilter(newReason)
                setPage(0)
              }}
            />

            {/* Post Category Dropdown */}
            <CustomCategoryDropdown
              value={typeFilter}
              onChange={(newCat) => {
                setTypeFilter(newCat)
                setPage(0)
              }}
            />

            {/* Reset Filters button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-3 text-xs font-bold text-text-muted hover:border-danger hover:bg-danger-soft hover:text-danger transition cursor-pointer shrink-0"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <RotateCcw size={13} />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Row 2: AI Risk Level Chips & Result Summary */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {/* Risk Level Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="flex items-center gap-1.5 pr-1.5 text-xs font-bold text-text-subtle shrink-0">
                <Sparkles size={13} className="text-gold-500" /> Mức rủi ro AI:
              </span>

              {RISK_TABS.map((tab) => {
                const isSelected = riskFilter === tab.key
                const dotColor =
                  tab.key === 'HIGH'
                    ? 'bg-rose-500 ring-rose-500/20'
                    : tab.key === 'MEDIUM'
                    ? 'bg-amber-500 ring-amber-500/20'
                    : tab.key === 'LOW'
                    ? 'bg-emerald-500 ring-emerald-500/20'
                    : 'bg-slate-400 ring-slate-400/20'

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setRiskFilter(tab.key)
                      setPage(0)
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none',
                      isSelected
                        ? 'bg-primary-solid text-on-primary border-primary shadow-xs font-extrabold'
                        : 'bg-surface text-text-muted border-border hover:bg-surface-2 hover:text-text'
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full ring-2 shrink-0', dotColor, isSelected ? 'bg-white ring-white/30' : '')} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Report Counter */}
            <div className="text-xs font-semibold text-text-subtle shrink-0">
              Hiển thị <strong className="text-text font-bold">{reports.length}</strong> / <strong>{totalElements}</strong> báo cáo vi phạm
            </div>
          </div>
        </div>

        {/* --- Thân bảng: Danh sách báo cáo vi phạm --- */}
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full bg-primary-soft" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4 bg-primary-soft" />
                  <Skeleton className="h-3 w-1/3 bg-primary-soft" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8">
            <EmptyState
              icon={<Inbox size={24} />}
              title="Lỗi tải danh sách báo cáo"
              description={error instanceof Error ? error.message : 'Lỗi kết nối máy chủ.'}
            />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Inbox size={24} />}
              title="Không có báo cáo nào"
              description={
                typeFilter !== 'ALL'
                  ? `Không tìm thấy báo cáo nào cho bài viết loại "${CATEGORY_MAP[typeFilter]?.label}".`
                  : `Không tìm thấy báo cáo nào ở trạng thái ${
                      statusFilter === 'PENDING' ? 'chờ xử lý' : statusFilter === 'RESOLVED' ? 'đã giải quyết' : 'đã bỏ qua'
                    }.`
              }
            />
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-subtle bg-surface-2/60">
                  <th className="px-4 py-3 sm:px-5 font-bold w-[30%]">Người gửi & Phân loại</th>
                  <th className="px-4 py-3 sm:px-5 font-bold">Tác giả & Nội dung bài viết</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-center w-[160px]">Rủi ro & Trạng thái</th>
                  <th className="px-4 py-3 sm:px-5 font-bold text-right w-[100px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r: AdminReportDto) => {
                  const reasonInfo = REASON_LABELS[r.reason] || { label: r.reason, tone: 'neutral' }
                  const catCfg = getCategoryConfig(r.postType)
                  const CatIcon = catCfg.icon

                  const localWillHide = willHideMap[r.id]
                  const currentStatus = localWillHide !== undefined 
                    ? (localWillHide ? 'HIDDEN' : 'ACTIVE') 
                    : r.postStatus

                  return (
                    <tr key={r.id} className={cn('transition-colors hover:bg-surface-2/50 border-l-4', catCfg.rowBorderLeft)}>
                      {/* Cột 1: Người báo cáo + Lý do + Loại bài */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-start gap-2.5">
                          <Avatar
                            src={r.reporterAvatarUrl}
                            name={reporterLabel(r)}
                            size={34}
                            className="border border-border shrink-0 mt-0.5"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div>
                              <p className="font-bold text-xs text-text truncate leading-tight">{reporterLabel(r)}</p>
                              <p className="text-[11px] text-text-subtle truncate">{reporterDetail(r)}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <Badge tone={reasonInfo.tone} className="text-[10px] px-1.5 py-0.5 leading-none">
                                {reasonInfo.label}
                              </Badge>
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border shadow-2xs',
                                  catCfg.badgeBg,
                                  catCfg.badgeText,
                                  catCfg.badgeBorder
                                )}
                              >
                                <CatIcon size={10} style={{ color: catCfg.colorHex }} />
                                <span>{catCfg.shortLabel}</span>
                              </span>
                            </div>
                            {r.description && (
                              <p className="text-[11px] text-text-subtle line-clamp-1 italic" title={r.description}>
                                "{r.description}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Tác giả & Nội dung bài viết */}
                      <td className="px-4 py-3.5 sm:px-5">
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-text-subtle font-medium">Bởi:</span>
                            <span className="text-xs font-bold text-text truncate">{r.postAuthorName || 'Ẩn danh'}</span>
                          </div>
                          <p
                            className="text-xs text-text-muted line-clamp-2 font-medium bg-surface-2/80 p-2 rounded-lg border border-border/70 leading-relaxed break-words"
                            title={r.postContent}
                          >
                            {r.postContent || '(Không có nội dung văn bản)'}
                          </p>
                        </div>
                      </td>

                      {/* Cột 3: Đánh giá rủi ro & Trạng thái bài viết gộp chung */}
                      <td className="px-4 py-3.5 sm:px-5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          {/* AI Risk Score Pill */}
                          {isImageAiViolation(r) ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border shadow-2xs bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 whitespace-nowrap">
                              <Sparkles size={10} />
                              Ảnh vi phạm
                            </span>
                          ) : r.aiScore !== undefined && r.aiScore !== null ? (
<div className="inline-flex flex-col items-center gap-1">
                              <span
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border shadow-2xs whitespace-nowrap',
                                  r.riskLevel === 'HIGH' || r.aiScore >= 0.60
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60'
                                    : r.riskLevel === 'MEDIUM' || r.aiScore >= 0.20
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                                )}
                              >
                                <Sparkles size={10} />
                                {(r.aiScore * 100).toFixed(0)}% {r.riskLevel === 'HIGH' ? 'Cao' : r.riskLevel === 'MEDIUM' ? 'Nghi vấn' : 'Thấp'}
                              </span>
                              {r.autoModerated && (
                                <span className="text-[10px] font-bold text-rose-600 bg-rose-100/60 dark:bg-rose-950/40 dark:text-rose-300 rounded px-1.5 py-0.5">
                                  Tự động ẩn
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-text-subtle font-medium">—</span>
                          )}

                          {/* Trạng thái bài viết */}
                          {currentStatus === 'HIDDEN' ? (
                            <Badge tone="danger" className="text-[10px] px-2 py-0.5">
                              Đã ẩn{localWillHide !== undefined && ' *'}
                            </Badge>
                          ) : currentStatus === 'DELETED' ? (
                            <Badge tone="neutral" className="text-[10px] px-2 py-0.5">
                              Đã xóa
                            </Badge>
                          ) : (
                            <Badge tone="success" className="text-[10px] px-2 py-0.5">
                              Công khai{localWillHide !== undefined && ' *'}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Cột 4: Thao tác */}
                      <td className="px-4 py-3.5 sm:px-5 text-right">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="inline-flex items-center gap-1 bg-primary-soft hover:bg-primary-soft/80 text-primary-solid font-bold text-xs rounded-xl px-2.5 py-1.5 border border-primary-soft-border transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
                          title="Xem chi tiết báo cáo"
                        >
                          <Eye size={12} />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* --- Card Footer: Phân trang tích hợp dưới đáy bảng --- */}
        {totalPages > 1 && (
          <div className="border-t border-border bg-surface p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-xs font-semibold text-text-subtle">
              Trang <strong className="text-text">{page + 1}</strong> / <strong>{totalPages}</strong>
            </span>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Modal chi tiết báo cáo vi phạm */}
      {selectedReport && <DialogFrame
          onClose={() => setSelectedReport(null)}
          zIndexClassName="z-50"
          maxWidthClassName="max-w-2xl"
          className="z-10 overflow-hidden border-plum-950/15 flex flex-col pop"
        >
            
            {/* Header Modal */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface rounded-t-3xl shrink-0">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-danger-soft p-2.5 border border-danger-border text-danger">
                  <Flag size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text leading-none">Chi tiết báo cáo vi phạm</h3>
                  <p className="text-xs text-text-subtle mt-1 font-medium">Báo cáo #{selectedReport.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="grid h-9 w-9 place-items-center rounded-xl text-text-subtle hover:bg-surface-2 hover:text-text transition-colors cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-140px)]">
              
              {/* Thông tin người báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-primary-soft-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary-solid flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Thông tin báo cáo
                </h4>
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedReport.reporterAvatarUrl}
                    name={reporterLabel(selectedReport)}
                    size={40}
                    className="border border-primary-soft-border"
                  />
                  <div>
                    <span className="text-xs text-text-subtle block font-medium">Người gửi báo cáo</span>
                    <span className="font-bold text-text text-sm">{reporterLabel(selectedReport)} ({reporterDetail(selectedReport)})</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs mt-2 border-t border-brand-100/50 pt-2 font-medium">
                  <div>
                    <span className="text-text-subtle block">Lý do vi phạm</span>
                    <span className="font-bold text-text text-sm">
                      {REASON_LABELS[selectedReport.reason]?.label || selectedReport.reason}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-subtle block">Thời điểm gửi</span>
                    <span className="font-bold text-text text-sm">
                      {new Date(selectedReport.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
                {selectedReport.description && (
                  <div className="bg-surface p-3 rounded-xl border border-primary-soft-border mt-2">
                    <span className="text-xs text-text-subtle block font-medium mb-1">Mô tả chi tiết từ người gửi:</span>
                    <p className="text-xs text-text italic font-medium leading-relaxed">
                      "{selectedReport.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Thông tin bài viết bị báo cáo */}
              <div className="p-4 rounded-2xl bg-brand-50/40 border border-primary-soft-border space-y-3">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary-solid">
                      Bài viết bị báo cáo
                    </h4>
                    {(() => {
                      const selCatCfg = getCategoryConfig(selectedReport.postType)
                      const SelCatIcon = selCatCfg.icon
                      return (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-bold border shadow-2xs',
                            selCatCfg.badgeBg,
                            selCatCfg.badgeText,
                            selCatCfg.badgeBorder
                          )}
                        >
                          <SelCatIcon size={12} style={{ color: selCatCfg.colorHex }} />
                          <span>{selCatCfg.label}</span>
                        </span>
                      )
                    })()}
                  </div>
                  <a
                    href={`/admin/posts/${selectedReport.postId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-primary-solid hover:text-primary-solid inline-flex items-center gap-0.5 hover:underline"
                  >
                    Xem bài đầy đủ <ArrowRight size={10} />
                  </a>
                </div>
                
                <div className="bg-surface p-4 rounded-xl border border-primary-soft-border space-y-2 max-h-48 overflow-y-auto">
                  <p className="text-xs text-text font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedReport.postContent || '(Bài viết không có nội dung văn bản)'}
                  </p>
                </div>

                {/* Hình ảnh đính kèm của bài viết (tự động làm mờ an toàn khi nghi ngờ vi phạm) */}
                {selectedReport.postMediaUrls && selectedReport.postMediaUrls.length > 0 && (
                  <div className="rounded-xl border border-primary-soft-border bg-surface p-3 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-text">
                        Hình ảnh đính kèm ({selectedReport.postMediaUrls.length})
                      </span>
                      {(selectedReport.autoModerated || selectedReport.riskLevel === 'HIGH') && (
                        <button
                          type="button"
                          onClick={() => setRevealMedia((prev) => !prev)}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-bold text-text hover:bg-surface-3 transition cursor-pointer"
                        >
                          {revealMedia ? (
                            <>
                              <EyeOff size={12} /> Làm mờ ảnh
                            </>
                          ) : (
                            <>
                              <Eye size={12} /> Hiện ảnh để kiểm tra
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedReport.postMediaUrls.map((url, idx) => {
                        const shouldBlur = (selectedReport.autoModerated || selectedReport.riskLevel === 'HIGH') && !revealMedia
                        return (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative block aspect-video overflow-hidden rounded-lg border border-border bg-surface-2"
                            title="Mở ảnh gốc trong tab mới"
                          >
                            <img
                              src={url}
                              alt={`Ảnh bài viết #${idx + 1}`}
                              className={cn(
                                'h-full w-full object-cover transition duration-200',
                                shouldBlur ? 'blur-xl scale-110 select-none' : 'group-hover:scale-105'
                              )}
                            />
                            {shouldBlur && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/35 p-2 text-center">
                                <span className="rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-bold text-white">
                                  Đã làm mờ bảo vệ
                                </span>
                              </div>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Khối phân tích kiểm duyệt tự động */}
                {selectedReport.aiScore !== undefined && selectedReport.aiScore !== null && (
                  <div className="rounded-2xl border border-border bg-surface-2/70 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-gold-500" />
                        <h4 className="text-xs font-bold text-text uppercase tracking-wider">
                          Phân tích Kiểm duyệt Tự động
                        </h4>
                      </div>
                      {isImageAiViolation(selectedReport) ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold border bg-rose-50 text-rose-700 border-rose-300">
                          AI Vision: Phát hiện ảnh vi phạm
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold border',
                            selectedReport.riskLevel === 'HIGH' || selectedReport.aiScore >= 0.60
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : selectedReport.riskLevel === 'MEDIUM' || selectedReport.aiScore >= 0.20
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          )}
                        >
                          Điểm rủi ro: {(selectedReport.aiScore * 100).toFixed(0)}% (
                          {selectedReport.riskLevel === 'HIGH' ? 'Nguy cơ cao' : selectedReport.riskLevel === 'MEDIUM' ? 'Nghi vấn' : 'An toàn'}
                          )
                        </span>
                      )}
                    </div>

                    {/* Thanh đo mức độ rủi ro Risk Meter (chỉ áp dụng cho kiểm duyệt văn bản) */}
                    {!isImageAiViolation(selectedReport) && (
                      <div className="w-full bg-border/60 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-500',
                            selectedReport.aiScore >= 0.85
                              ? 'bg-rose-500'
                              : selectedReport.aiScore >= 0.40
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          )}
                          style={{ width: `${Math.min(100, Math.max(5, selectedReport.aiScore * 100))}%` }}
                        />
                      </div>
                    )}

                    {/* Đánh giá và từ khóa vi phạm */}
                    <div className="text-xs space-y-1.5 text-text-muted">
                      {selectedReport.aiFlaggedReason && (
                        <div>
                          <span className="font-bold text-text">Đánh giá hệ thống: </span>
                          <span>{selectedReport.aiFlaggedReason}</span>
                        </div>
                      )}
                      {selectedReport.detectedKeywords && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="font-bold text-text">
                            {isImageAiViolation(selectedReport) ? 'Tệp ảnh vi phạm: ' : 'Từ khóa vi phạm: '}
                          </span>
                          {selectedReport.detectedKeywords.split(',').map((kw, i) => (
                            <span
                              key={i}
                              className="inline-block bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-rose-200"
                            >
                              {kw.trim()}
                            </span>
                          ))}
                        </div>
                      )}
                      {selectedReport.autoModerated && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px] flex items-center gap-2">
                          <ShieldAlert size={15} className="shrink-0 text-rose-600" />
                          {isImageAiViolation(selectedReport)
                            ? 'Hệ thống AI đã tự động ẩn bài viết do phát hiện hình ảnh nhạy cảm hoặc bạo lực.'
                            : 'Hệ thống đã tự động tạm ẩn bài viết do vi phạm nghiêm trọng quy chuẩn cộng đồng (>= 85%).'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-medium border-t border-brand-100/50 pt-2">
                  <div>
                    <span className="text-text-subtle block">Tác giả bài viết</span>
                    <span className="font-bold text-text truncate block">{selectedReport.postAuthorName}</span>
                    <span className="text-xs text-text-subtle truncate block">{selectedReport.postAuthorEmail}</span>
                  </div>
                  <div>
                    <span className="text-text-subtle block">Phân loại bài viết</span>
                    {(() => {
                      const selCatCfg = getCategoryConfig(selectedReport.postType)
                      const SelCatIcon = selCatCfg.icon
                      return (
                        <span className="inline-flex items-center gap-1.5 font-bold text-text mt-0.5">
                          <SelCatIcon size={13} style={{ color: selCatCfg.colorHex }} />
                          {selCatCfg.shortLabel}
                        </span>
                      )
                    })()}
                  </div>
                  <div>
                    <span className="text-text-subtle block">Trạng thái bài viết gốc</span>
                    <div className="mt-0.5">
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
              </div>

              {/* Nút thao tác xử lý báo cáo */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row gap-2 justify-between items-center">
                
                {/* Thiết lập trạng thái Ẩn / Mở ẩn cho bài viết (Chỉ thay đổi local state map) */}
                {selectedReport.postStatus !== 'DELETED' && selectedReport.status === 'PENDING' && (
                  <Button
                    variant="secondary"
                    onClick={toggleSelectedReportWillHide}
                    className={cn(
                      "w-full sm:w-auto font-bold text-xs rounded-full cursor-pointer transition",
                      activeWillHide 
                        ? "border border-success-border text-success hover:bg-success-soft" 
                        : "border border-danger-border text-danger hover:bg-danger-soft"
                    )}
                  >
                    {activeWillHide ? (
                      <span className="inline-flex items-center gap-1"><Eye size={12} /> Hủy ẩn bài (Sẽ giữ công khai)</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><EyeOff size={12} /> Đánh dấu ẩn bài viết</span>
                    )}
                  </Button>
                )}

                {/* Giải quyết / Bỏ qua */}
                {selectedReport.status === 'PENDING' ? (
                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => triggerDismissConfirm(selectedReport.id)}
                      className="w-full sm:w-auto font-bold text-xs rounded-full border border-border hover:bg-surface-2 cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1"><Ban size={12} /> Bỏ qua báo cáo</span>
                    </Button>
                    <Button
                      onClick={() => triggerResolveConfirm(selectedReport.id)}
                      className="w-full sm:w-auto font-bold text-xs rounded-full bg-primary-solid text-on-primary hover:bg-primary-hover shadow-raised cursor-pointer"
                    >
                      <span className="inline-flex items-center gap-1"><Check size={12} /> Đã giải quyết</span>
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-text-subtle">
                    Báo cáo này đã ở trạng thái:{' '}
                    <span className="text-text font-extrabold">
                      {selectedReport.status === 'RESOLVED' ? 'Đã giải quyết' : 'Đã bỏ qua'}
                    </span>
                  </div>
                )}

              </div>

            </div>
          </DialogFrame>}

      {/* Custom Confirmation Popup Dialog */}
      {confirmAction && <DialogFrame
          onClose={() => setConfirmAction(null)}
          zIndexClassName="z-60"
          maxWidthClassName="max-w-sm"
          className="z-10 overflow-hidden border-plum-950/15 p-6 pop"
        >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-primary-soft p-3 border border-primary-soft-border text-primary-solid animate-breathe">
                <ShieldAlert size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text">
                  {confirmAction.type === 'RESOLVE' && 'Giải quyết báo cáo'}
                  {confirmAction.type === 'DISMISS' && 'Bỏ qua báo cáo'}
                </h3>
                <p className="text-xs text-text-subtle font-semibold leading-relaxed">
                  {confirmAction.type === 'RESOLVE' && (
                    activeWillHide 
                      ? 'Bạn có chắc muốn ẩn bài viết vi phạm này không?' 
                      : 'Bạn có chắc muốn giữ công khai bài viết này không?'
                  )}
                  {confirmAction.type === 'DISMISS' && 'Bạn có chắc muốn bỏ qua báo cáo này không? Nếu bài viết bị hệ thống tự ẩn, bài sẽ được khôi phục.'}
                </p>
              </div>
              <div className="flex gap-2 w-full pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setConfirmAction(null)}
                  className="flex-1 font-bold text-xs rounded-full border border-border hover:bg-surface-2 cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={executeConfirmAction}
                  className="flex-1 font-bold text-xs rounded-full bg-primary-solid text-on-primary hover:bg-primary-hover shadow-raised cursor-pointer"
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </DialogFrame>}
    </div>
  )
}
