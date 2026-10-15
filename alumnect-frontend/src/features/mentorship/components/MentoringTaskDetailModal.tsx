import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { X, ClipboardCheck, CalendarDays, Wallet, Link2, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { Skeleton, Button } from '@/components/ui'
import { useTaskDetail } from '../hooks/useMentoringTasks'
import {
  MENTORING_PARTICIPATION_LABELS,
  MENTORING_TASK_STATUS_LABELS,
  MENTORING_TASK_TYPE_LABELS,
  MENTORING_WORKING_MODE_LABELS,
  formatVnd,
} from '../model/mentoringFlowLabels'

interface MentoringTaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  taskId?: number | null
}

/**
 * Modal "Xem Task" trong Chat for Task (UC105 & UC106): hiển thị Mentoring Task đã kích hoạt sau thanh toán,
 * kèm liên kết truy ngược Request → Deal → Chat for Task và điều hướng sang trang quản lý toàn diện UC106 & UC107.
 */
export function MentoringTaskDetailModal({ isOpen, onClose, taskId }: MentoringTaskDetailModalProps) {
  const navigate = useNavigate()
  const { data: detail, isLoading, error } = useTaskDetail(taskId ?? undefined)

  if (!isOpen || !taskId) return null

  const formatDate = (value?: string | null) => (value ? format(new Date(value), 'dd/MM/yyyy HH:mm') : '—')

  const overview = detail?.overview
  const deal = detail?.deal

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-surface rounded-3xl border border-border shadow-2xl p-6 text-left space-y-5 max-h-[90vh] overflow-y-auto chat-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-5 top-5 p-2 text-text-subtle hover:text-text-muted rounded-full hover:bg-surface-2 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-success-soft text-success">
            <ClipboardCheck className="h-6 w-6" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-text">Mentoring Task #{taskId}</h3>
            <p className="text-xs text-text-subtle">
              {overview ? MENTORING_TASK_STATUS_LABELS[overview.status] || overview.status : 'Đang tải...'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error || !detail || !overview ? (
          <p className="rounded-2xl bg-danger-soft p-3 text-xs font-semibold text-danger">
            {error?.message || 'Không thể tải thông tin Task.'}
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-subtle">Phạm vi công việc</p>
              <p className="mt-1 whitespace-pre-wrap text-text">{overview.taskScope}</p>
            </div>
            {deal && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-text-subtle">Kết quả kỳ vọng</p>
                <p className="mt-1 whitespace-pre-wrap text-text">{deal.expectedResult}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-cream-100/70 p-3 dark:bg-white/5">
                <p className="flex items-center gap-1 font-bold text-text-subtle">
                  <Wallet className="h-3.5 w-3.5" /> Giá đã thanh toán
                </p>
                <p className="mt-1 font-display text-base font-bold text-text">{formatVnd(overview.agreedPrice)}</p>
              </div>
              <div className="rounded-2xl bg-cream-100/70 p-3 dark:bg-white/5">
                <p className="flex items-center gap-1 font-bold text-text-subtle">
                  <CalendarDays className="h-3.5 w-3.5" /> Deadline
                </p>
                <p className="mt-1 font-display text-base font-bold text-text">{formatDate(overview.deadline)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <span className="rounded-full bg-primary-soft px-2.5 py-1 text-primary-solid">
                {MENTORING_TASK_TYPE_LABELS[overview.taskType] || overview.taskType}
              </span>
              <span className="rounded-full bg-surface-3 px-2.5 py-1 text-text-muted">
                {MENTORING_WORKING_MODE_LABELS[overview.workingMode] || overview.workingMode}
              </span>
              <span className="rounded-full bg-surface-3 px-2.5 py-1 text-text-muted">
                {MENTORING_PARTICIPATION_LABELS[overview.participationType] || overview.participationType}
              </span>
            </div>
            <div className="rounded-2xl border border-border p-3 text-xs text-text-muted space-y-1">
              <p className="flex items-center gap-1.5 font-bold text-text">
                <Link2 className="h-3.5 w-3.5" /> Truy vết nghiệp vụ
              </p>
              <p>Request #{detail.requestId ?? '—'}{detail.requestTitle ? ` · ${detail.requestTitle}` : ''}</p>
              <p>Thỏa thuận #{detail.deal.id} → Nhiệm vụ #{overview.id} · Cuộc trò chuyện #{detail.conversationId ?? '—'}</p>
              <p>Kích hoạt lúc {formatDate(overview.startedAt)}</p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  onClose()
                  navigate(`/app/mentoring/tasks/${overview.id}`)
                }}
                className="w-full rounded-2xl bg-primary-solid text-on-primary hover:bg-primary-hover text-xs font-bold gap-2 py-2.5 shadow-sm shadow-brand-600/20"
              >
                <span>Mở trang chi tiết & Quản lý Work Log</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
